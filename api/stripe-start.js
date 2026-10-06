// Vercel serverless function — POST /api/stripe-start
//
// Creates a Stripe Checkout Session for an order that this database says is payable by card.
//
// What this endpoint never does:
//   * accept an amount, a currency or a merchant identity from the browser - the authoritative
//     figures come back from start_card_payment, which runs as the caller's own token so
//     Postgres checks ownership, availability and the delivery country;
//   * see a card number. Card details are collected by Stripe's hosted page; the only things
//     stored here are a session id, a payment-intent id and a status we later re-verify;
//   * claim a payment succeeded. The response carries a redirect URL and nothing more - the
//     order becomes Paid only when /api/stripe-notify confirms it server-side.
//
// Without STRIPE_SECRET_KEY this answers 503 {configured:false}, so a deployment can never
// present a live card option on the strength of configuration alone.
import {
  PaymentGateError,
  adminClient,
  createCheckoutSession,
  providerReadiness,
  readClient,
  retrieveCheckoutSession,
  stripeConfig,
} from "./_payments.js";
import { appBaseUrl, supabasePublishableKey, supabaseUrl, withRequestId } from "./_config.js";

export const maxDuration = 20;

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const env = process.env;
  const config = stripeConfig(env);
  if (!config.configured) {
    req.log?.warn("card payment refused: Stripe secret key absent");
    return res.status(503).json({ success: false, configured: false, reason: "stripe_not_configured" });
  }

  const header = String(req.headers.authorization || "");
  const accessToken = header.startsWith("Bearer ") ? header.slice(7) : null;
  const url = supabaseUrl();
  const anon = supabasePublishableKey();
  if (!accessToken || !url || !anon) {
    return res.status(401).json({ error: "Sign in to pay by card." });
  }

  const orderId = String(req.body?.orderId || "").trim();
  const methodCode = String(req.body?.methodCode || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !methodCode) {
    return res.status(400).json({ error: "An order and a payment method are required." });
  }

  const admin = adminClient();

  let intent;
  try {
    // Two gates, from two sources of truth: this deployment's credentials, and the configuration
    // the database holds for the method and the stored order.
    const readiness = await providerReadiness(readClient(), env);
    if (!readiness.stripe?.connected) {
      req.log?.warn("card payment refused: Stripe credentials incomplete", {
        missing: readiness.stripe?.missingEnvVars || [],
      });
      return res.status(503).json({ success: false, configured: false, reason: "stripe_not_configured" });
    }

    const rpc = await fetch(`${url}/rest/v1/rpc/start_card_payment`, {
      method: "POST",
      headers: { apikey: anon, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_order_id: orderId,
        p_method_code: methodCode,
        p_currency: req.body?.currency ? String(req.body.currency) : null,
      }),
    });
    const payload = await rpc.json().catch(() => null);
    if (!rpc.ok) {
      req.log?.warn("card payment refused by the database", { detail: payload?.message });
      return res.status(400).json({
        error: "This order cannot be paid by card right now. Choose another payment method or contact the atelier.",
      });
    }
    intent = Array.isArray(payload) ? payload[0] : payload;
    if (!intent?.order_id) throw new PaymentGateError("The order could not be prepared for payment.", 409);
    // A wallet or BNPL rail configured on the same Stripe account still has to be built as its
    // own integration; this endpoint only speaks the card flow.
    if (intent.provider_code !== "stripe") {
      throw new PaymentGateError(`${intent.display_name} is not a card rail on this deployment.`, 409);
    }
  } catch (error) {
    if (error instanceof PaymentGateError) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    throw error;
  }

  const origin = appBaseUrl();
  try {
    // A second click must not open a second session for the same order.
    if (intent.existing_session_id) {
      const prior = await retrieveCheckoutSession(intent.existing_session_id, env).catch(() => null);
      const stillOpen = prior && prior.status === "open" && Number(prior.amount_total) > 0;
      if (stillOpen) {
        req.log?.info("card payment reuses the existing session", {
          order: intent.order_number,
          session: prior.id,
        });
        return res.status(200).json({
          success: true,
          configured: true,
          reused: true,
          url: prior.url,
          sessionId: prior.id,
          orderNumber: intent.order_number,
        });
      }
    }

    const session = await createCheckoutSession({
      order: {
        id: intent.order_id,
        order_number: intent.order_number,
        amount: intent.amount,
        currency: intent.currency,
        display_name: intent.display_name,
        payment_method_code: methodCode,
      },
      env,
      origin,
    });

    // Persisting the references happens before the browser is sent anywhere, so the webhook can
    // always find the payment row this session belongs to.
    const { error: linkError } = await admin.rpc("attach_card_session", {
      p_order_id: intent.order_id,
      p_checkout_session_id: session.id,
      p_payment_intent_id: session.payment_intent || null,
    });
    if (linkError) {
      req.log?.error("card session could not be recorded", { detail: linkError.message });
      return res.status(502).json({ error: "The payment session could not be recorded. Please try again." });
    }

    req.log?.info("card payment session created", {
      order: intent.order_number,
      mode: config.mode,
      currency: intent.currency,
    });

    return res.status(200).json({
      success: true,
      configured: true,
      url: session.url,
      sessionId: session.id,
      orderNumber: intent.order_number,
    });
  } catch (error) {
    if (error instanceof PaymentGateError) {
      return res.status(error.status).json({ success: false, configured: false, error: error.message });
    }
    req.log?.error("card payment session failed", { detail: error?.message });
    return res.status(502).json({ success: false, error: "The card payment could not be started. Please try again." });
  }
};

export default withRequestId(handler);
