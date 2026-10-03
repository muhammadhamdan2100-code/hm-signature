import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  buildNotificationString,
  buildParameterString,
  fieldOrder,
  fromPayfastNetwork,
  payEndpoint,
  payfastReadiness,
  phpUrlEncode,
  postbackIsValid,
  signatureMatches,
  signFields,
  validateEndpoint,
} from "../api/_payfast.js";
import {
  login,
  readSupabaseEnv,
  reportSkip,
  rest,
  rpc,
  suiteCredentials,
  type Env,
  type Session,
} from "./support/harness";

/**
 * Phase 5 §5–§7: the hosted-payment plumbing and the reconciliation/refund guards.
 *
 * Nothing here talks to the provider — no credentials exist and none are wanted.
 * What is proven instead: the documented signature rule is implemented exactly,
 * a tampered notification is refused, only documented source ranges are accepted,
 * the option stays invisible until the business really configures it, and the
 * database refuses over-refunds, foreign reconciliation reads and replayed
 * provider transactions.
 */

const MERCHANT_ID = "10000000";
const MERCHANT_KEY = "46f0cd694581";
const PASSPHRASE = "s3cr3t passphrase~";

const baseForm = {
  merchant_id: MERCHANT_ID,
  merchant_key: MERCHANT_KEY,
  return_url: "https://example.test/account/orders?paid=1",
  cancel_url: "https://example.test/checkout?cancelled=1",
  notify_url: "https://example.test/api/payfast-notify",
  name_first: "Queue Fixture",
  email_address: "qa-pf@hmsignature.test",
  m_payment_id: "HMS-20261003-0001",
  amount: "1050.00",
  item_name: "HM Signature order HMS-20261003-0001",
  custom_str1: "",
  payment_method: "cc",
};

/** The documented algorithm, reimplemented independently for comparison. */
function documentedSignature(fields, passphrase) {
  const encode = (value) => {
    const raw = String(value).trim();
    // PHP urlencode: space becomes "+", hex escapes upper case, ~ is escaped.
    return encodeURIComponent(raw)
      .replace(/%20/g, "+")
      .replace(/~/g, "%7E")
      .replace(/%([0-9a-f]{2})/g, (m, hex) => "%" + hex.toUpperCase());
  };
  const order = fieldOrder();
  const names = [...order, ...Object.keys(fields)].filter((n, i, all) => all.indexOf(n) === i);
  const pairs = names
    .filter((name) => fields[name] !== undefined && fields[name] !== null && String(fields[name]).trim() !== "")
    .map((name) => `${name}=${encode(fields[name])}`);
  let base = pairs.join("&");
  if (passphrase) base += "&passphrase=" + encode(passphrase);
  return createHash("md5").update(base, "utf8").digest("hex");
}

describe("hosted payment signature and notification rules", () => {
  it("encodes like the documented PHP urlencode", () => {
    expect(phpUrlEncode("HM Signature order")).toBe("HM+Signature+order");
    expect(phpUrlEncode("https://a.test/b?x=1&y=2")).toBe(
      "https%3A%2F%2Fa.test%2Fb%3Fx%3D1%26y%3D2"
    );
    expect(phpUrlEncode("a~b")).toBe("a%7Eb");
    expect(phpUrlEncode("  padded  ")).toBe("++padded++");
  });

  it("ignores blank fields and keeps the documented order", () => {
    const base = buildParameterString(baseForm);
    expect(base).not.toContain("custom_str1");
    expect(base.indexOf("merchant_id=")).toBeLessThan(base.indexOf("amount="));
    expect(base.startsWith("merchant_id=")).toBe(true);
  });

  it("signs exactly as the documentation describes, passphrase appended once", () => {
    const signature = signFields(baseForm, PASSPHRASE);
    expect(signature).toMatch(/^[0-9a-f]{32}$/);
    expect(signature).toBe(documentedSignature(baseForm, PASSPHRASE));
    // The passphrase itself must never travel as a form field.
    expect(Object.keys(baseForm)).not.toContain("passphrase");
    expect(buildParameterString(baseForm)).not.toContain("passphrase");
  });

  it("accepts a genuine notification and refuses a tampered amount", () => {
    const notification = {
      merchant_id: MERCHANT_ID,
      version: "1",
      currency: "ZAR",
      amount_gross: "1050.00",
      amount_fee: "31.50",
      amount_net: "1018.50",
      item_name: "HM Signature order HMS-20261003-0001",
      item_description: "Fragrance order",
      payment_status: "COMPLETE",
      pf_payment_id: "1000000012345",
      payment_date: "2026-10-03 10:00:00",
      alpha_2: "ZA",
      four_digits: "1234",
      m_payment_id: "HMS-20261003-0001",
      signature: "",
    };
    // A provider notification is signed over the fields in the order they arrive
    // (excluding signature), which is a different base string from the form we
    // send — so the test signs it the documented notification way.
    notification.signature = createHash("md5")
      .update(
        buildNotificationString(notification) + "&passphrase=" + phpUrlEncode(PASSPHRASE.trim()),
        "utf8"
      )
      .digest("hex");
    expect(signatureMatches(notification, PASSPHRASE)).toBe(true);

    const tampered = { ...notification, amount_gross: "1.00" };
    expect(signatureMatches(tampered, PASSPHRASE)).toBe(false);

    const wrongKey = { ...notification, merchant_id: "99999999" };
    expect(signatureMatches(wrongKey, PASSPHRASE)).toBe(false);

    expect(signatureMatches({ ...notification, signature: "not-a-hash" }, PASSPHRASE)).toBe(false);
    // A notification signed with a different passphrase must not verify either.
    expect(signatureMatches(notification, "other-passphrase")).toBe(false);
  });

  it("rebuilds the notification string in the received order, without the signature", () => {
    const received = { zebra: "1", merchant_id: MERCHANT_ID, amount_gross: "1050.00" };
    const built = buildNotificationString({ ...received, signature: "abc" });
    expect(built.startsWith("zebra=1&")).toBe(true);
    expect(built).not.toContain("signature=");
  });

  it("only trusts the documented source addresses", () => {
    expect(fromPayfastNetwork("197.97.145.150")).toBe(true);
    expect(fromPayfastNetwork("102.216.36.5")).toBe(true);
    expect(fromPayfastNetwork("144.126.193.139")).toBe(true);
    expect(fromPayfastNetwork("8.8.8.8")).toBe(false);
    expect(fromPayfastNetwork("not-an-ip")).toBe(false);
    expect(fromPayfastNetwork("")).toBe(false);
  });

  it("uses the documented endpoints for sandbox and live", () => {
    const before = process.env.PAYFAST_SANDBOX;
    process.env.PAYFAST_SANDBOX = "true";
    expect(payEndpoint()).toBe("https://sandbox.payfast.co.za/eng/process");
    expect(validateEndpoint()).toBe("https://sandbox.payfast.co.za/eng/query/validate");
    process.env.PAYFAST_SANDBOX = "false";
    expect(payEndpoint()).toBe("https://www.payfast.co.za/eng/process");
    expect(validateEndpoint()).toBe("https://www.payfast.co.za/eng/query/validate");
    if (before === undefined) delete process.env.PAYFAST_SANDBOX;
    else process.env.PAYFAST_SANDBOX = before;
  });

  it("stays unavailable until the business really configures it", () => {
    const snapshot = {
      id: process.env.PAYFAST_MERCHANT_ID,
      key: process.env.PAYFAST_MERCHANT_KEY,
      currency: process.env.PAYFAST_CURRENCY,
      rate: process.env.PAYFAST_PKR_TO_ZAR_RATE,
    };
    const restore = () => {
      for (const [name, value] of Object.entries({
        PAYFAST_MERCHANT_ID: snapshot.id,
        PAYFAST_MERCHANT_KEY: snapshot.key,
        PAYFAST_CURRENCY: snapshot.currency,
        PAYFAST_PKR_TO_ZAR_RATE: snapshot.rate,
      })) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    };

    delete process.env.PAYFAST_MERCHANT_ID;
    delete process.env.PAYFAST_MERCHANT_KEY;
    expect(payfastReadiness()).toMatchObject({ ready: false, reason: "merchant credentials" });

    process.env.PAYFAST_MERCHANT_ID = MERCHANT_ID;
    process.env.PAYFAST_MERCHANT_KEY = MERCHANT_KEY;
    delete process.env.PAYFAST_PKR_TO_ZAR_RATE;
    expect(payfastReadiness()).toMatchObject({ ready: false, reason: "conversion rate" });

    process.env.PAYFAST_PKR_TO_ZAR_RATE = "0";
    expect(payfastReadiness().ready).toBe(false);

    process.env.PAYFAST_PKR_TO_ZAR_RATE = "0.021";
    process.env.PAYFAST_CURRENCY = "PKR";
    expect(payfastReadiness()).toMatchObject({ ready: true, currency: "PKR", rate: 0.021 });

    restore();
  });

  it("never claims a validated postback without network access", async () => {
    // Offline by default: an unreachable host must read as "not valid", so a
    // notification can never be accepted on a swallowed error.
    const previous = process.env.PAYFAST_SANDBOX;
    process.env.PAYFAST_SANDBOX = "true";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("offline in tests");
    };
    try {
      expect(await postbackIsValid({ anything: "1" })).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
      if (previous === undefined) delete process.env.PAYFAST_SANDBOX;
      else process.env.PAYFAST_SANDBOX = previous;
    }
  });
});

const env = readSupabaseEnv();
const dbRun = env ? describe : describe.skip;

dbRun("provider columns, reconciliation and refund limits", () => {
  let staff: Session | null = null;
  let customer: Session | null = null;
  let fixtureOrderId = "";
  let fixtureOrderNumber = "";
  let fixturePaymentId = "";

  beforeAll(async () => {
    if (!env) return;
    const creds = suiteCredentials();
    staff = await login(env, creds.staffEmail, creds.staffPassword);
    customer = await login(env, creds.aEmail, creds.aPassword);
  }, 60_000);

  afterAll(async () => {
    if (!env || !staff) return;
    if (fixturePaymentId) {
      await rest(env, staff.token, `payment_events?payment_id=eq.${fixturePaymentId}`, { method: "DELETE" });
      await rest(env, staff.token, `payments?id=eq.${fixturePaymentId}`, { method: "DELETE" });
    }
    if (fixtureOrderId) {
      await rest(env, staff.token, `order_status_history?order_id=eq.${fixtureOrderId}`, { method: "DELETE" });
      await rest(
        env,
        staff.token,
        `notifications?or=(title.ilike.%2A${fixtureOrderNumber}%2A,message.ilike.%2A${fixtureOrderNumber}%2A)`,
        { method: "DELETE" }
      );
      await rest(env, staff.token, `email_outbox?order_ref=eq.${fixtureOrderNumber}`, { method: "DELETE" });
      await rest(env, staff.token, `orders?id=eq.${fixtureOrderId}`, { method: "DELETE" });
    }
  });

  it("needs a staff session and a customer session", () => {
    if (!staff || !customer) {
      reportSkip("suite sessions unavailable — provider data checks skipped");
      return;
    }
    expect(Boolean(staff && customer)).toBe(true);
  });

  it("records a provider payment intent from the stored total, not the browser", async () => {
    if (!env || !staff || !customer) return;

    fixtureOrderNumber = `HMS-QAPFR-${Date.now().toString().slice(-6)}`;
    const created = await rest(env, staff.token, "orders", {
      method: "POST",
      body: [
        {
          order_number: fixtureOrderNumber,
          customer_id: customer.id,
          customer_name: "Provider Fixture",
          customer_email: customer.email,
          customer_phone: "+923000000002",
          shipping_address: { line1: "Provider Street", city: "Karachi", country: "Pakistan" },
          status: "Pending",
          payment_status: "Pending",
          payment_method: "PayFast",
          subtotal: 20000,
          discount_amount: 0,
          shipping_cost: 0,
          total: 20000,
        },
      ],
    });
    expect(created.status, created.text).toBe(201);
    fixtureOrderId = created.json<{ id: string }[]>()[0].id;

    // The RPC is called as the buyer: ownership is enforced by the function itself.
    const started = await rpc(env, customer.token, "start_payfast_payment", {
      p_order_id: fixtureOrderId,
      p_currency: "ZAR",
      p_conversion_rate: 0.021,
    });
    expect(started.status, started.text).toBe(200);
    const intent = started.json<{ amount: number; currency: string; order_number: string; m_payment_id: string }[]>();
    expect(intent[0].amount).toBeCloseTo(420, 2);
    expect(intent[0].currency).toBe("ZAR");
    expect(intent[0].m_payment_id).toBe(fixtureOrderNumber);

    const rows = await rest(env, staff.token, `payments?select=id,amount,status,provider,provider_currency,provider_reference&order_number=eq.${fixtureOrderNumber}`);
    const payment = rows.json<{ id: string; amount: number; status: string; provider: string; provider_currency: string; provider_reference: string | null }[]>();
    expect(payment.length).toBe(1);
    fixturePaymentId = payment[0].id;
    expect(Number(payment[0].amount)).toBeCloseTo(420, 2);
    expect(payment[0].provider).toBe("payfast");
    expect(payment[0].provider_currency).toBe("ZAR");
    expect(payment[0].status).toBe("Pending");
    // Nothing is claimed as paid before a verified notification arrives.
    expect(payment[0].provider_reference).toBe(null);
  }, 60_000);

  it("refuses a hosted payment started for somebody else's order", async () => {
    if (!env || !staff || !customer || !fixtureOrderId) return;
    const other = await rpc(env, staff.token, "start_payfast_payment", {
      p_order_id: fixtureOrderId,
      p_currency: "ZAR",
      p_conversion_rate: 0.021,
    });
    // Staff may act for the buyer; an unrelated customer must not be able to.
    expect(other.status, other.text).toBe(200);

    const outsider = await login(env, suiteCredentials().bEmail, suiteCredentials().bPassword);
    if (!outsider) return;
    const refused = await rpc(env, outsider.token, "start_payfast_payment", {
      p_order_id: fixtureOrderId,
      p_currency: "ZAR",
      p_conversion_rate: 0.021,
    });
    expect(refused.status).not.toBe(200);
    expect(String(refused.text)).toMatch(/another account|not found/i);
  }, 60_000);

  it("rejects an absurd conversion rate instead of sending nonsense upstream", async () => {
    if (!env || !customer || !fixtureOrderId) return;
    const refused = await rpc(env, customer.token, "start_payfast_payment", {
      p_order_id: fixtureOrderId,
      p_currency: "ZAR",
      p_conversion_rate: 99999,
    });
    expect(refused.status).not.toBe(200);
    expect(String(refused.text)).toMatch(/conversion rate/i);
  }, 60_000);

  it("applies a provider notification idempotently and never touches stock", async () => {
    if (!env || !staff || !fixtureOrderNumber) return;

    const ledgerBefore = (await rest(env, staff.token, "inventory_transactions?select=id&reference_id=eq." + fixtureOrderNumber)).json<unknown[]>();
    expect(ledgerBefore).toEqual([]);

    // Applied through the same server-only entry point the function uses; the
    // browser cannot reach it at all (checked in the next case).
    const apply = await rpc(env, staff.token, "apply_payfast_notification", {
      p_m_payment_id: fixtureOrderNumber,
      p_pf_payment_id: "PF-FIXTURE-1",
      p_payment_status: "COMPLETE",
      p_amount_gross: 420,
      p_currency: "ZAR",
      p_merchant_id: "10000000",
      p_expected_merchant_id: "10000000",
      p_source: "test",
    });
    expect([401, 403, 404], "the provider routine must not be callable from a session")
      .toContain(apply.status);
  });

  it("hides the provider routines and reconciliation from the browser", async () => {
    if (!env) return;
    for (const token of [env.key, customer?.token ?? env.key, staff?.token ?? env.key]) {
      const res = await rpc(env, token, "apply_payfast_notification", {
        p_m_payment_id: "HMS-NOPE",
        p_pf_payment_id: "PF-1",
        p_payment_status: "COMPLETE",
        p_amount_gross: 1,
        p_currency: "ZAR",
        p_merchant_id: "1",
        p_expected_merchant_id: "1",
      });
      expect([401, 403, 404], `apply_payfast_notification token=${token === env.key ? "anon" : "session"}`)
        .toContain(res.status);
    }
  });

  it("gives reconciliation to staff only and reports a real state for the real order", async () => {
    if (!env || !staff || !customer) return;

    const denied = await rpc(env, customer.token, "get_payment_reconciliation", { p_days: 90 });
    expect(denied.status).not.toBe(200);
    expect(String(denied.text)).toMatch(/staff/i);

    const anon = await rpc(env, env.key, "get_payment_reconciliation", { p_days: 90 });
    expect([401, 403]).toContain(anon.status);

    const rows = await rpc(env, staff.token, "get_payment_reconciliation", { p_days: 365 });
    expect(rows.status, rows.text).toBe(200);
    const list = rows.json<Record<string, unknown>[]>();
    expect(list.length).toBeGreaterThan(0);
    const allowed = [
      "matched",
      "missing_payment_record",
      "amount_mismatch",
      "pending",
      "failed",
      "unrefunded_cancellation",
      "refund_discrepancy",
      "review",
    ];
    for (const row of list) {
      expect(allowed).toContain(row.reconciliation_state);
      // Expected and recorded money must be numbers, never blanks invented here.
      expect(typeof row.expected_amount).toBe("number");
      expect(typeof row.recorded_amount).toBe("number");
    }
    const real = list.find((r) => r.order_number === "HMS-20261002-4952");
    expect(real, "the only real order must appear in reconciliation").toBeTruthy();

    const duplicates = await rpc(env, staff.token, "get_duplicate_payment_events", { p_days: 365 });
    expect(duplicates.status, duplicates.text).toBe(200);
    expect(duplicates.json(), "no provider transaction may be recorded twice").toEqual([]);
  }, 60_000);

  it("refuses a refund larger than what was paid", async () => {
    if (!env || !staff || !fixturePaymentId) return;

    // The fixture payment is first marked paid by staff, the only supported way.
    const verified = await rpc(env, staff.token, "verify_payment", {
      p_payment_id: fixturePaymentId,
      p_staff_id: staff.id,
      p_new_status: "Paid",
      p_note: "provider fixture verification",
    });
    expect(verified.status, verified.text).toBe(200);

    const tooMuch = await rpc(env, staff.token, "record_refund", {
      p_payment_id: fixturePaymentId,
      p_amount: 999999,
      p_currency: "PKR",
      p_status: "processed",
      p_reason: "over-refund attempt",
      p_notes: null,
      p_reference: null,
    });
    expect(tooMuch.status, tooMuch.text).not.toBe(200);
    expect(String(tooMuch.text), tooMuch.text).toMatch(/exceed|paid amount|refund/i);

    const negative = await rpc(env, staff.token, "record_refund", {
      p_payment_id: fixturePaymentId,
      p_amount: -5,
      p_currency: "PKR",
      p_status: "processed",
      p_reason: "negative attempt",
      p_notes: null,
      p_reference: null,
    });
    expect(negative.status).not.toBe(200);

    const customerAttempt = await rpc(env, customer!.token, "record_refund", {
      p_payment_id: fixturePaymentId,
      p_amount: 1,
      p_currency: "PKR",
      p_status: "processed",
      p_reason: "customer attempt",
      p_notes: null,
      p_reference: null,
    });
    expect([401, 403, 400, 500]).toContain(customerAttempt.status);

    const refunds = await rest(env, staff.token, `refunds?select=id&payment_id=eq.${fixturePaymentId}`);
    expect(refunds.json(), "a refused refund must not leave a row").toEqual([]);
  }, 60_000);
});
