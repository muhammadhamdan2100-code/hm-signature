// Vercel serverless function — POST /api/payfast-start
//
// Builds a signed hosted-payment form for an order the caller is allowed to pay.
// The amount comes from the recorded order total converted by the deployment's
// configured rate; the browser never supplies an amount, a currency or a merchant
// identity. Without merchant credentials, a settlement currency and a conversion
// rate this answers 503 {configured:false} and checkout keeps the option hidden.
//
// PayFast documents the Custom Integration as a form the BROWSER posts to their
// page (fetch/XHR will not complete it), so this returns the field set and the
// storefront renders a one-shot auto-submitting form.
import { createClient } from "@supabase/supabase-js";
import {
  appBaseUrl,
  supabasePublishableKey,
  supabaseUrl,
  withRequestId,
} from "./_config.js";
import { formatAmount, payEndpoint, payfastConfig, payfastReadiness, signFields } from "./_payfast.js";

export const maxDuration = 15;

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const readiness = payfastReadiness();
  if (!readiness.ready) {
    req.log?.warn("hosted payment refused", { reason: readiness.reason });
    return res.status(503).json({ success: false, configured: false, reason: readiness.reason });
  }

  const header = String(req.headers.authorization || "");
  const accessToken = header.startsWith("Bearer ") ? header.slice(7) : null;
  const url = supabaseUrl();
  const anon = supabasePublishableKey();
  if (!accessToken || !url || !anon) {
    return res.status(401).json({ error: "Sign in to pay for this order." });
  }

  const orderId = String(req.body?.orderId || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return res.status(400).json({ error: "An order reference is required." });
  }

  const { merchantId, merchantKey, passphrase, currency } = payfastConfig();
  const rate = readiness.rate;

  // The RPC runs as the caller, so Postgres enforces ownership and re-reads the
  // authoritative total.
  const rpc = await fetch(`${url}/rest/v1/rpc/start_payfast_payment`, {
    method: "POST",
    headers: { apikey: anon, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_order_id: orderId, p_currency: currency, p_conversion_rate: rate }),
  });
  const payload = await rpc.json().catch(() => null);

  if (!rpc.ok) {
    req.log?.warn("hosted payment refused by the database", { detail: payload?.message });
    return res.status(400).json({
      error: "This order cannot be paid online right now. Choose another payment method or contact the atelier.",
    });
  }

  const intent = Array.isArray(payload) ? payload[0] : payload;
  const amount = formatAmount(intent?.amount);
  if (!amount) {
    return res.status(502).json({ error: "The payment amount could not be prepared." });
  }

  const base = appBaseUrl();
  const fields = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: `${base}/account/orders?paid=1&order=${encodeURIComponent(intent.order_number)}`,
    cancel_url: `${base}/checkout?cancelled=1`,
    notify_url: `${base}/api/payfast-notify`,
    name_first: String(intent.customer_name || "").slice(0, 100),
    email_address: String(intent.customer_email || "").slice(0, 100),
    m_payment_id: intent.order_number,
    amount,
    item_name: String(intent.item_name || `HM Signature order ${intent.order_number}`).slice(0, 100),
    item_description: "Fragrance order",
    custom_str1: "hm-signature",
    email_confirmation: "0",
    payment_method: "cc",
  };

  const signature = signFields(fields, passphrase);

  req.log?.info("hosted payment prepared", {
    order: intent.order_number,
    amount,
    currency: intent.currency,
    sandbox: String(process.env.PAYFAST_SANDBOX || "").toLowerCase() === "true",
  });

  return res.status(200).json({
    success: true,
    configured: true,
    endpoint: payEndpoint(),
    fields: { ...fields, signature },
  });
};

export default withRequestId(handler);
