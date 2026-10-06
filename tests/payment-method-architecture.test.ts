import { beforeAll, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import {
  assertSubmittable,
  checkoutMethods,
  fromStripeMinorUnits,
  providerReadiness,
  stripeConfig,
  stripePaymentStatus,
  toStripeMinorUnits,
  verifyStripeSignature,
} from "../api/_payments.js";
import { login, readSupabaseEnv, reportSkip, rest, rpc, suiteCredentials } from "./support/harness";
import { hasPermission } from "../src/services/auth";
import { resolveRequiredPermission, type StaffMember } from "../src/types/staff";

/**
 * The two new workspaces are configuration, not operations: a Manager may run payments but may
 * not decide which rails customers are offered. This is the browser-side half of the guard; the
 * database refuses the same writes again.
 */
const staffOf = (role: StaffMember["role"]): StaffMember => ({
  id: `qa-${role}`,
  name: `QA ${role}`,
  email: `qa-${role.toLowerCase().replace(/\s+/g, "-")}@hmsignature.test`,
  role,
  status: "Active",
  lastActive: "",
  createdAt: "",
  permissions: {},
});

describe("payment configuration is Super Admin only", () => {
  it("governs the two new routes explicitly", () => {
    expect(resolveRequiredPermission("/admin/payments/methods")).toBe("payments.configure");
    expect(resolveRequiredPermission("/admin/boutiques")).toBe("boutiques.manage");
    // The payment screens a Manager already used keep working.
    expect(resolveRequiredPermission("/admin/payments")).toBe("payments.view");
  });

  it("refuses every role except the Super Admin", () => {
    for (const key of ["payments.configure", "boutiques.manage"]) {
      expect(hasPermission(staffOf("Manager"), key), `Manager must not hold ${key}`).toBe(false);
      expect(hasPermission(staffOf("Order Manager"), key), `Order Manager must not hold ${key}`).toBe(false);
      expect(hasPermission(staffOf("Content Manager"), key), `Content Manager must not hold ${key}`).toBe(false);
      expect(hasPermission(staffOf("Super Admin"), key), `Super Admin must hold ${key}`).toBe(true);
    }
  });
});

/**
 * Phase 8: the payment-method architecture, without a provider account.
 *
 * Nothing here contacts Stripe - there are no credentials and none are wanted. What is proven
 * instead is the part that decides whether a customer can be lied to: a method is offered only
 * when the Super Admin's status AND this deployment's credentials both allow it; "coming soon"
 * cannot be submitted; the webhook signature is verified over the exact bytes; amounts are
 * converted in the currency's real smallest unit; and no buyer token can reach the functions
 * that mark a payment paid or attach a provider session.
 */

// ─── a stand-in for the configuration tables ─────────────────────────────────────────────────
const stubRows = (rows: any[]) => {
  const chain: any = {
    select: () => chain,
    order: () => chain,
    contains: (_column: string, value: string[]) => stubRows(rows.filter((r) => (r.country_codes || []).includes(value[0]))),
    then: (resolve: (v: { data: any[]; error: null }) => void, reject: (e: unknown) => void) =>
      Promise.resolve({ data: rows, error: null }).then(resolve, reject),
  };
  return chain;
};

const fakeDb = (tables: Record<string, any[]>) => ({
  from: (table: string) => stubRows(tables[table] || []),
});

const PROVIDERS = [
  { code: "stripe", integration_kind: "card_checkout", credential_env_vars: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] },
  { code: "payfast", integration_kind: "hosted_redirect", credential_env_vars: ["PAYFAST_MERCHANT_ID", "PAYFAST_MERCHANT_KEY"] },
  { code: "tabby", integration_kind: "bnpl", credential_env_vars: ["TABBY_API_KEY"] },
  { code: "cash", integration_kind: "cash", credential_env_vars: [] },
  { code: "bank_transfer", integration_kind: "manual_transfer", credential_env_vars: [] },
];

// Mirrors the shipped Pakistan configuration: the working rails are evidence-based (the customer
// transfers and uploads the proof), the card rails need a provider credential.
const METHODS = [
  { code: "cod", provider_code: "cash", type: "cash", display_name: "Cash on Delivery", country_codes: ["PK"], currency_codes: ["PKR"], status: "enabled", is_enabled: true, requires_reference: false, requires_proof: false },
  { code: "jazzcash_wallet", provider_code: "jazzcash", type: "wallet", display_name: "JazzCash", country_codes: ["PK"], currency_codes: ["PKR"], status: "enabled", is_enabled: true, requires_reference: true, requires_proof: true },
  { code: "raast_instant", provider_code: "raast", type: "instant", display_name: "Raast", country_codes: ["PK"], currency_codes: ["PKR"], status: "enabled", is_enabled: true, requires_reference: true, requires_proof: true },
  { code: "bank_transfer_pk", provider_code: "bank_transfer", type: "bank_transfer", display_name: "Bank Transfer", country_codes: ["PK"], currency_codes: ["PKR"], status: "enabled", is_enabled: true, requires_reference: true, requires_proof: true },
  { code: "stripe_pk", provider_code: "stripe", type: "card", display_name: "Bank Card", country_codes: ["PK"], currency_codes: ["PKR"], status: "enabled", is_enabled: true, requires_reference: false, requires_proof: false },
  { code: "google_pay_pk", provider_code: "google_pay", type: "wallet", display_name: "Google Pay", country_codes: ["PK"], currency_codes: ["PKR"], status: "coming_soon", is_enabled: false, requires_reference: false, requires_proof: false },
  { code: "tabby_ae", provider_code: "tabby", type: "bnpl", display_name: "Tabby", country_codes: ["AE"], currency_codes: ["AED"], status: "coming_soon", is_enabled: false, requires_reference: false, requires_proof: false },
  { code: "paypal_gb", provider_code: "paypal", type: "wallet", display_name: "PayPal", country_codes: ["GB"], currency_codes: ["GBP"], status: "unavailable", is_enabled: false, requires_reference: false, requires_proof: false },
  { code: "retired_row", provider_code: "stripe", type: "card", display_name: "Retired", country_codes: ["PK"], currency_codes: ["PKR"], status: "enabled", is_enabled: false, requires_reference: false, requires_proof: false },
  { code: "draft_row", provider_code: "stripe", type: "card", display_name: "Draft Rail", country_codes: ["PK"], currency_codes: ["PKR"], status: "configured", is_enabled: false, requires_reference: false, requires_proof: false },
];

const ENV_WITH_STRIPE = { STRIPE_SECRET_KEY: "sk_test_unitTestKey0123456789", STRIPE_WEBHOOK_SECRET: "whsec_unitTest0123456789" } as any;
const ENV_WITHOUT_ANYTHING = {} as any;

const db = () => fakeDb({ payment_providers: PROVIDERS, payment_methods: METHODS });

describe("payment method states resolve from configuration plus deployment", () => {
  it("counts a provider connected only when every listed variable exists", async () => {
    const readiness = await providerReadiness(db() as any, ENV_WITH_STRIPE);
    expect(readiness.stripe.connected).toBe(true);
    expect(readiness.stripe.missingEnvVars).toEqual([]);
    expect(readiness.payfast.connected).toBe(false);
    expect(readiness.payfast.missingEnvVars).toEqual(["PAYFAST_MERCHANT_ID", "PAYFAST_MERCHANT_KEY"]);
  });

  it("offers a card rail only when its credentials are actually deployed", async () => {
    const live = await checkoutMethods({ countryCode: "PK", currencyCode: "PKR", env: ENV_WITH_STRIPE, supabase: db() as any });
    const card = live.find((m) => m.code === "stripe_pk")!;
    expect(card.state).toBe("available");
    expect(card.canSubmit).toBe(true);

    const unconfigured = await checkoutMethods({ countryCode: "PK", currencyCode: "PKR", env: ENV_WITHOUT_ANYTHING, supabase: db() as any });
    const cardWithoutKeys = unconfigured.find((m) => m.code === "stripe_pk")!;
    expect(cardWithoutKeys.state).toBe("not_configured");
    expect(cardWithoutKeys.canSubmit).toBe(false);
  });

  it("keeps cash on delivery offered without credentials, because no provider has to settle it", async () => {
    const rows = await checkoutMethods({ countryCode: "PK", currencyCode: "PKR", env: ENV_WITHOUT_ANYTHING, supabase: db() as any });
    const cod = rows.find((m) => m.code === "cod")!;
    expect(cod.state).toBe("available");
    expect(cod.canSubmit).toBe(true);
  });

  it("never turns a coming soon or disabled rail into an option a customer can submit", async () => {
    const rows = await checkoutMethods({ countryCode: "PK", currencyCode: "PKR", env: ENV_WITH_STRIPE, supabase: db() as any });
    const byCode = Object.fromEntries(rows.map((m) => [m.code, m]));
    // JazzCash and Raast are worked today by the customer transferring the money and uploading the
    // reference and screenshot, so no API credential is involved.
    expect(byCode.jazzcash_wallet.state).toBe("available");
    expect(byCode.raast_instant.state).toBe("available");
    expect(byCode.draft_row.state).toBe("disabled");
    expect(byCode.google_pay_pk.state).toBe("coming_soon");
    expect(byCode.google_pay_pk.canSubmit).toBe(false);
    expect(byCode.retired_row.state).toBe("disabled");
    expect(byCode.retired_row.canSubmit).toBe(false);

    const ae = await checkoutMethods({ countryCode: "AE", currencyCode: "AED", env: ENV_WITHOUT_ANYTHING, supabase: db() as any });
    expect(ae.map((m) => [m.code, m.state])).toEqual([["tabby_ae", "coming_soon"]]);

    const gb = await checkoutMethods({ countryCode: "GB", currencyCode: "GBP", env: ENV_WITHOUT_ANYTHING, supabase: db() as any });
    expect(gb[0].state).toBe("unavailable");
  });

  it("filters a rail out when it cannot settle the currency the order is priced in", async () => {
    const usd = await checkoutMethods({ countryCode: "PK", currencyCode: "USD", env: ENV_WITH_STRIPE, supabase: db() as any });
    expect(usd).toEqual([]);
    // With no currency asserted, every rail registered for Pakistan is listed - including the
    // disabled one, which the UI then shows as not available.
    const anyCurrency = await checkoutMethods({ countryCode: "PK", env: ENV_WITHOUT_ANYTHING, supabase: db() as any });
    expect(anyCurrency.length).toBe(8);
  });

  it("does not mistake a placeholder key for a configured provider", async () => {
    // Exactly the state a .env filled with "stripe_secret_here" would produce. Presence alone
    // must not switch a payment option on at checkout.
    const placeholders = { STRIPE_SECRET_KEY: "my_stripe_key_123", STRIPE_WEBHOOK_SECRET: "shared_secret_123" } as any;
    const readiness = await providerReadiness(db() as any, placeholders);
    expect(readiness.stripe.connected).toBe(false);
    expect(readiness.stripe.missingEnvVars).toEqual([]);
    expect(readiness.stripe.invalidConfiguration).toBe(true);
    const rows = await checkoutMethods({ countryCode: "PK", currencyCode: "PKR", env: placeholders, supabase: db() as any });
    expect(rows.find((m) => m.code === "stripe_pk").state).toBe("not_configured");
    expect(stripeConfig(placeholders).configured).toBe(false);
    expect(stripeConfig(ENV_WITH_STRIPE).configured).toBe(true);
  });

  it("refuses submission server-side for the rails the buttons merely grey out", async () => {
    const common = { countryCode: "PK", currencyCode: "PKR", supabase: db() as any };
    await expect(assertSubmittable({ ...common, methodCode: "google_pay_pk", env: ENV_WITH_STRIPE })).rejects.toThrow(/not enabled yet/);
    await expect(assertSubmittable({ ...common, methodCode: "stripe_pk", env: ENV_WITHOUT_ANYTHING })).rejects.toThrow(/not configured/);
    await expect(assertSubmittable({ ...common, methodCode: "tabby_ae", env: ENV_WITHOUT_ANYTHING })).rejects.toThrow(/not offered for PK/);
    const ok = await assertSubmittable({ ...common, methodCode: "cod", env: ENV_WITHOUT_ANYTHING });
    expect(ok.code).toBe("cod");
  });

  it("reports refusals with the status the endpoint should answer", async () => {
    let status = 0;
    try {
      await assertSubmittable({ countryCode: "PK", currencyCode: "PKR", methodCode: "google_pay_pk", env: ENV_WITH_STRIPE, supabase: db() as any });
    } catch (error: any) {
      status = error.status;
    }
    expect(status).toBe(409);
  });
});

describe("Stripe plumbing is correct without a live account", () => {
  it("charges in the currency's smallest unit, and only currencies with no decimals skip it", () => {
    expect(toStripeMinorUnits(1250.5, "PKR")).toBe(125050);
    expect(toStripeMinorUnits(19.99, "USD")).toBe(1999);
    expect(toStripeMinorUnits(100, "JPY")).toBe(100);
    expect(fromStripeMinorUnits(125050, "PKR")).toBe(1250.5);
    expect(fromStripeMinorUnits(500, "GBP")).toBe(5);
  });

  it("refuses to build a session for an amount that is not payable", () => {
    expect(toStripeMinorUnits(0, "PKR")).toBeNull();
    expect(toStripeMinorUnits(-100, "PKR")).toBeNull();
    expect(toStripeMinorUnits(Number.NaN, "PKR")).toBeNull();
  });

  it("reads the mode from the key itself and never guesses live", () => {
    expect(stripeConfig({ STRIPE_SECRET_KEY: "sk_live_abc" }).mode).toBe("live");
    expect(stripeConfig({ STRIPE_SECRET_KEY: "sk_test_abc" }).mode).toBe("test");
    expect(stripeConfig({}).configured).toBe(false);
    expect(stripeConfig({}).mode).toBe("none");
  });

  it("verifies a webhook signature over the exact bytes it was given", () => {
    const secret = "whsec_unit_test";
    const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`, "utf8").digest("hex");

    expect(
      verifyStripeSignature({ rawBody: Buffer.from(body), signatureHeader: `t=${timestamp},v1=${signature}`, webhookSecret: secret })
    ).toBe(true);
    // A re-serialised body is a different body: the same signature must not validate it.
    expect(
      verifyStripeSignature({
        rawBody: Buffer.from(JSON.stringify({ type: "checkout.session.completed", id: "evt_1" })),
        signatureHeader: `t=${timestamp},v1=${signature}`,
        webhookSecret: secret,
      })
    ).toBe(false);
    expect(
      verifyStripeSignature({ rawBody: Buffer.from(body), signatureHeader: `t=${timestamp - 3600},v1=${signature}`, webhookSecret: secret })
    ).toBe(false);
    expect(
      verifyStripeSignature({ rawBody: Buffer.from(body), signatureHeader: `t=${timestamp},v1=deadbeef`, webhookSecret: secret })
    ).toBe(false);
    expect(verifyStripeSignature({ rawBody: Buffer.from(body), signatureHeader: undefined, webhookSecret: secret })).toBe(false);
    expect(verifyStripeSignature({ rawBody: Buffer.from(body), signatureHeader: `t=${timestamp},v1=${signature}`, webhookSecret: "" })).toBe(false);
  });

  it("maps Stripe's own statuses instead of inventing a success", () => {
    expect(stripePaymentStatus({ payment_status: "paid" })).toBe("Paid");
    expect(stripePaymentStatus({ payment_status: "processing" })).toBe("Pending");
    expect(stripePaymentStatus({ payment_status: "unpaid" })).toBe("Pending");
    expect(stripePaymentStatus({ payment_status: "failed" })).toBe("Failed");
    expect(stripePaymentStatus({})).toBe("Pending");
  });
});

describe("live configuration is public to read and closed to write", () => {
  const env = readSupabaseEnv();
  let buyer: Awaited<ReturnType<typeof login>> | null = null;

  beforeAll(async () => {
    if (!env) return;
    const creds = suiteCredentials();
    buyer = await login(env, creds.aEmail, creds.aPassword);
  });

  it("needs the linked project", () => {
    if (!env) {
      reportSkip("no Supabase environment — live payment configuration checks skipped");
      expect(false).toBe(true);
    }
  });

  it("exposes the method registry with derived flags that agree with the status", async () => {
    if (!env) return;
    const res = await rest(env, null, "payment_methods?select=code,status,is_enabled,is_coming_soon,environment,provider_code&order=sort_order.asc");
    expect(res.status).toBe(200);
    const rows = res.json<any[]>();
    expect(rows.length).toBeGreaterThan(0);
    const inconsistent = rows.filter((r) => r.is_enabled !== (r.status === "enabled") || r.is_coming_soon !== (r.status === "coming_soon"));
    expect(inconsistent).toEqual([]);
    // A method may state an environment — the shop configures that whenever it likes
    // — but it may not state one it cannot honour: it must be enabled, and its
    // provider must declare the credential variables that environment needs. Whether
    // those variables hold real values is resolved server-side and is not visible or
    // assertable from the browser, which is the point of the split.
    const claims = rows.filter((r) => r.environment !== "none");
    const providers = await rest(env, null, "payment_providers?select=code,credential_env_vars,integration_kind");
    const declared = new Map(providers.json<any[]>().map((p) => [p.code, p]));
    const unfounded = claims.filter((r) => {
      const provider = declared.get(r.provider_code);
      return r.status !== "enabled" || !provider || !Array.isArray(provider.credential_env_vars) || provider.credential_env_vars.length === 0;
    });
    process.stdout.write(`payment environments currently claimed: ${claims.map((r) => `${r.code}=${r.environment}`).join(", ") || "none"}\n`);
    expect(unfounded).toEqual([]);
  });

  it("keeps the boutiques table empty rather than inventing a location", async () => {
    if (!env) return;
    const res = await rest(env, null, "boutiques?select=id,name,city,country_code,status");
    expect(res.status).toBe(200);
    expect(res.json<any[]>()).toEqual([]);
  });

  it("refuses to let a browser write payment or boutique configuration", async () => {
    if (!env) return;
    const attempts = [
      await rest(env, null, "payment_methods", { method: "POST", body: { code: "evil", provider_code: "stripe", type: "card", display_name: "Evil", country_codes: ["PK"], currency_codes: ["PKR"], status: "enabled" } }),
      await rest(env, null, "boutiques", { method: "POST", body: { name: "Evil", country_code: "PK", city: "Nowhere" } }),
      await rpc(env, null, "set_payment_method_status", { p_code: "cod", p_status: "coming_soon" }),
      await rpc(env, null, "save_payment_method", {
        p_code: "evil", p_provider_code: "stripe", p_type: "card", p_display_name: "Evil", p_description: "", p_icon: "",
        p_country_codes: ["PK"], p_currency_codes: ["PKR"], p_status: "enabled", p_environment: "none", p_configuration_reference: null, p_sort_order: 999,
      }),
      await rpc(env, null, "delete_payment_method", { p_code: "cod" }),
    ];
    attempts.forEach((res, index) => {
      expect(res.status, `write attempt ${index} was not refused: ${res.text.slice(0, 120)}`).toBeGreaterThanOrEqual(400);
    });
    // The rails that must have survived the attempts are untouched.
    if (!env) return;
    const cod = await rest(env, null, "payment_methods?select=code,status&display_name=eq.Cash%20on%20Delivery");
    expect(cod.json<any[]>()[0]?.status).toBe("enabled");
  });

  it("gives a buyer no path to a paid status or a forged provider session", async () => {
    if (!env) return;
    // Anon and a signed-in customer are both refused: only this server's service role may call
    // these, which is what makes "the front end says success" worth nothing.
    for (const token of [null, buyer?.token ?? null]) {
      const record = await rpc(env, token, "record_card_payment", {
        p_provider_event_id: "evt_forged", p_checkout_session_id: "cs_forged", p_payment_intent_id: "pi_forged",
        p_status: "paid", p_amount: 1, p_currency: "PKR",
      });
      expect(record.status).toBeGreaterThanOrEqual(400);
      const attach = await rpc(env, token, "attach_card_session", {
        p_order_id: "00000000-0000-0000-0000-000000000000", p_checkout_session_id: "cs_forged", p_payment_intent_id: null,
      });
      expect(attach.status).toBeGreaterThanOrEqual(400);
    }
  });

  it("will not start a card payment anonymously, or for an order that does not exist", async () => {
    if (!env) return;
    const body = { p_order_id: "00000000-0000-0000-0000-000000000000", p_method_code: "cod", p_currency: "PKR" };
    // A guest has no EXECUTE on the function at all.
    const asAnon = await rpc(env, null, "start_card_payment", body);
    expect(asAnon.status).toBeGreaterThanOrEqual(400);
    // A signed-in account reaches the function, and the database still refuses an order it
    // cannot find rather than inventing a payment for one.
    if (buyer) {
      const asBuyer = await rpc(env, buyer.token, "start_card_payment", body);
      expect(asBuyer.status).toBeGreaterThanOrEqual(400);
      expect(asBuyer.text.toLowerCase()).toContain("order not found");
    }
  });

  it("has nowhere to store a card number, and no legacy column is hiding one", async () => {
    if (!env) return;
    for (const column of ["card_number", "cvv", "cardholder_name", "expiry", "pan"]) {
      const res = await rest(env, null, `payments?select=${column}&limit=1`);
      expect(res.status, `${column} should not exist on payments`).toBeGreaterThanOrEqual(400);
      expect(res.text.toLowerCase()).toContain("does not exist");
    }
    // The identifiers that ARE stored are provider references, not credentials.
    const ok = await rest(env, null, "payments?select=stripe_payment_intent_id,stripe_checkout_session_id,provider_code,payment_method_code,provider_status");
    expect(ok.status).toBe(200);
  });
});
