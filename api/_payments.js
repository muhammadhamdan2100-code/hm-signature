// Shared payment-method layer for the serverless endpoints.
//
// Two separate facts are deliberately kept apart:
//   * what a Super Admin intends   — payment_methods.status, readable by anyone (checkout needs it)
//   * whether money can move today — the provider's credentials existing in this deployment
// A method is only submittable when both agree, so enabling a row cannot by itself start
// charging, and configuring credentials cannot by itself expose a method the admin disabled.
//
// No card data ever passes through this module: Stripe's own API receives it, and what comes
// back are identifiers (session / payment-intent) plus a status we re-verify server-side.
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { serviceRoleKey, supabasePublishableKey, supabaseUrl } from "./_config.js";

const STRIPE_API = "https://api.stripe.com/v1";

export function adminClient() {
  const url = supabaseUrl();
  const key = serviceRoleKey();
  if (!url || !key) throw new Error("Supabase server credentials are not configured in this deployment.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Client for reading the payment configuration only.
 *
 * payment_methods, payment_providers and boutiques carry SELECT policies for anon on purpose -
 * checkout has to show the list before anybody signs in - so the publishable key is enough for
 * these queries and a deployment without the service-role key (a local dev server) still answers
 * with real states instead of an empty list. Anything that writes still uses adminClient().
 */
export function readClient() {
  const url = supabaseUrl();
  const key = serviceRoleKey() || supabasePublishableKey();
  if (!url || !key) throw new Error("Supabase is not configured in this deployment.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function credentialPresent(env, name) {
  const value = env[name];
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Presence is not enough for a provider whose key format is known. A placeholder sitting in .env
 * would otherwise switch a payment option on at checkout while every upstream call to it fails,
 * which is exactly the "pretending to work" state this architecture exists to prevent.
 */
const CREDENTIAL_SHAPES = {
  stripe: (env) =>
    /^sk_(test|live)_[0-9a-zA-Z]{10,}$/.test(String(env.STRIPE_SECRET_KEY || "").trim()) &&
    /^whsec_[0-9a-zA-Z]{10,}$/.test(String(env.STRIPE_WEBHOOK_SECRET || "").trim()),
};

/**
 * Which providers can actually settle money in this deployment, computed from the registry in
 * the database so a new provider needs no code change here — only its credential variable names.
 */
export async function providerReadiness(supabase = readClient(), env = process.env) {
  const { data, error } = await supabase.from("payment_providers").select("code, credential_env_vars, integration_kind");
  if (error) throw new Error(`payment_providers unreadable: ${error.message}`);
  const readiness = {};
  for (const row of data || []) {
    const list = row.credential_env_vars || [];
    const missing = list.filter((name) => !credentialPresent(env, name));
    const shaped = list.length > 0 && missing.length === 0 && CREDENTIAL_SHAPES[row.code] ? CREDENTIAL_SHAPES[row.code](env) : true;
    readiness[row.code] = {
      connected: list.length > 0 && missing.length === 0 && shaped,
      requiresConfiguration: !(missing.length === 0 && shaped),
      missingEnvVars: missing,
      // Set when the variables exist but do not look usable: a misconfigured deployment, not an
      // unconfigured one, and worth telling the operator apart.
      invalidConfiguration: list.length > 0 && missing.length === 0 && !shaped,
      integrationKind: row.integration_kind,
    };
  }
  return readiness;
}

/**
 * The method list checkout should show for one destination, with the real state resolved:
 * available | coming_soon | disabled | unavailable | not_configured.
 */
export async function checkoutMethods({ countryCode, currencyCode, env = process.env, supabase = readClient() }) {
  const readiness = await providerReadiness(supabase, env);
  const { data, error } = await supabase
    .from("payment_methods")
    .select("code, provider_code, type, display_name, description, icon, status, environment, is_enabled, is_coming_soon, currency_codes, requires_reference, requires_proof, configuration_reference, sort_order")
    .contains("country_codes", [countryCode])
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`payment_methods unreadable: ${error.message}`);

  // A method with no currency_codes row is treated as unrestricted; a populated list must contain
  // the currency the order is actually priced in, or the shopper would be shown a rail that
  // cannot settle that amount.
  const supportsCurrency = (row) =>
    !Array.isArray(row.currency_codes) || row.currency_codes.length === 0 || row.currency_codes.includes(currencyCode);
  return (data || [])
    .filter((row) => !currencyCode || supportsCurrency(row))
    .map((row) => {
      const provider = readiness[row.provider_code] || { connected: false, missingEnvVars: ["unknown provider"], integrationKind: "manual_transfer" };
      let state;
      if (row.status === "unavailable") state = "unavailable";
      else if (row.status === "coming_soon") state = "coming_soon";
      else if (row.status === "configured") {
        // Set up but not switched on: the Super Admin has entered it without offering it yet.
        state = "disabled";
      } else if (row.status === "enabled") {
        // Rails settled without an API call from this server need no credential: cash at the
        // door, a bank transfer the shopkeeper verifies, and the wallet/instant transfers where
        // the customer moves the money themselves and uploads the reference and screenshot.
        const evidenceBased = Boolean(row.requires_reference || row.requires_proof);
        const needsCredential =
          !evidenceBased && row.provider_code !== "cash" && row.provider_code !== "bank_transfer";
        state = !needsCredential || provider.connected ? "available" : "not_configured";
      } else state = "disabled";
      // The derived flag is a second lock: the trigger keeps it in step with status, and a row
      // that somehow disagrees is not offered.
      if (state === "available" && !row.is_enabled) state = "disabled";
      return { ...row, state, canSubmit: state === "available", providerConnected: provider.connected };
    });
}

/**
 * Server-side refusal of a method the client should not have been able to pick. Every submit
 * path calls this; the browser's disabled buttons are UX, not the control.
 */
export async function assertSubmittable({ countryCode, currencyCode, methodCode, env = process.env, supabase = readClient() }) {
  const methods = await checkoutMethods({ countryCode, currencyCode, env, supabase });
  const method = methods.find((m) => m.code === methodCode);
  if (!method) throw new PaymentGateError(`That payment method is not offered for ${countryCode}.`, 400);
  if (method.state === "coming_soon") throw new PaymentGateError(`${method.display_name} is not enabled yet. Choose another payment method.`, 409);
  if (!method.canSubmit) throw new PaymentGateError(`${method.display_name} is not configured on this deployment yet.`, 409);
  return method;
}

export class PaymentGateError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status || 400;
  }
}

// ─── Stripe ───────────────────────────────────────────────────────────────────────────────────
export function stripeConfig(env = process.env) {
  const secretKey = String(env.STRIPE_SECRET_KEY || "").trim();
  const webhookSecret = String(env.STRIPE_WEBHOOK_SECRET || "").trim();
  // Test keys and live keys are never mixed: the mode is read from the key itself.
  const mode = secretKey.startsWith("sk_live_") ? "live" : secretKey.startsWith("sk_test_") ? "test" : "none";
  return {
    // A value that is not shaped like a Stripe key is not a configuration, it is a placeholder.
    configured: mode !== "none" && /^whsec_[0-9a-zA-Z]{10,}$/.test(webhookSecret),
    secretKey,
    webhookSecret,
    mode,
  };
}

async function stripeForm(fields) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) value.forEach((v, i) => body.append(`${key}[${i}]`, String(v)));
    else body.append(key, String(value));
  }
  return body;
}

export async function stripeRequest({ path, method = "POST", form, env }) {
  const config = stripeConfig(env);
  if (!config.configured) throw new PaymentGateError("Card payments are not configured on this deployment.", 503);
  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: method === "GET" ? undefined : form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.error?.message || `Stripe responded ${res.status}`;
    throw new PaymentGateError(message, res.status === 404 ? 404 : 502);
  }
  return json;
}

/**
 * Stripe expects amounts in the currency's smallest unit. Most currencies are 1/100, a few take
 * no decimal part at all, and getting this wrong charges a customer a hundred times too much, so
 * the list is explicit rather than inferred from the order total.
 */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);

export function toStripeMinorUnits(amount, currency) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * (ZERO_DECIMAL_CURRENCIES.has(String(currency || "").toLowerCase()) ? 1 : 100));
}

/** Back to the unit this project stores order totals in, for comparing a notification to an order. */
export function fromStripeMinorUnits(amountInMinorUnits, currency) {
  const value = Number(amountInMinorUnits);
  if (!Number.isFinite(value)) return null;
  return value / (ZERO_DECIMAL_CURRENCIES.has(String(currency || "").toLowerCase()) ? 1 : 100);
}

/** A Checkout Session for one already-stored order. Money is collected by Stripe, never here. */
export async function createCheckoutSession({ order, env, origin, paymentMethodTypes = ["card"] }) {
  const currency = String(order.currency || "PKR").toLowerCase();
  const unitAmount = toStripeMinorUnits(order.amount ?? order.total, currency);
  if (unitAmount === null) throw new PaymentGateError("The recorded order total is not payable.", 409);
  const form = await stripeForm({
    mode: "payment",
    "line_items[0][price_data][currency]": currency,
    "line_items[0][price_data][product_data][name]": `HM Signature order ${order.order_number}`,
    "line_items[0][price_data][product_data][description]": order.display_name || "Fragrance order",
    "line_items[0][price_data][unit_amount]": unitAmount,
    "line_items[0][quantity]": 1,
    client_reference_id: order.id,
    "metadata[order_id]": order.id,
    "metadata[order_number]": order.order_number,
    "metadata[payment_method_code]": order.payment_method_code || "",
    "metadata[provider]": "stripe",
    success_url: `${origin}/checkout?payment=success&order=${encodeURIComponent(order.order_number)}`,
    cancel_url: `${origin}/checkout?payment=cancelled&order=${encodeURIComponent(order.order_number)}`,
    "payment_method_types[0]": paymentMethodTypes[0] || "card",
  });
  return stripeRequest({ path: "/checkout/sessions", form, env });
}

export async function retrieveCheckoutSession(sessionId, env) {
  return stripeRequest({ path: `/checkout/sessions/${encodeURIComponent(sessionId)}`, method: "GET", env });
}

/**
 * Stripe signs the raw body with a HMAC. Verification must run on the exact bytes, so the
 * signature check happens before any JSON parsing.
 */
export function verifyStripeSignature({ rawBody, signatureHeader, webhookSecret, toleranceSeconds = 300, now = Date.now() }) {
  if (!webhookSecret || !signatureHeader || !rawBody) return false;
  const parts = Object.fromEntries(
    String(signatureHeader)
      .split(",")
      .map((piece) => piece.trim().split("="))
      .filter((pair) => pair.length === 2)
  );
  const timestamp = Number(parts.t);
  const received = parts.v1;
  if (!Number.isFinite(timestamp) || !received) return false;
  if (Math.abs(now / 1000 - timestamp) > toleranceSeconds) return false;
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(received, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Maps Stripe's own vocabulary onto this project's payment status without inventing a state. */
export function stripePaymentStatus(session) {
  const status = session?.payment_status;
  if (status === "paid") return "Paid";
  if (status === "unpaid") return "Pending";
  if (status === "processing") return "Pending";
  if (status === "failed") return "Failed";
  return "Pending";
}
