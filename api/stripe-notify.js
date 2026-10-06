// Vercel serverless function — POST /api/stripe-notify
//
// Stripe's server-to-server notification. Nothing here is trusted until three things hold:
//   1. the HMAC signature over the *raw request bytes* matches STRIPE_WEBHOOK_SECRET
//      (a parsed-and-reserialized body cannot be verified, so an unverifiable request is
//      rejected rather than guessed at);
//   2. the session is re-read from Stripe's API, so a stale or replayed payload cannot report a
//      status the provider no longer agrees to;
//   3. the database applies it through record_card_payment, which refuses replays of the same
//      event id, refuses to reopen a completed payment, and refuses an amount that does not
//      match the order it was recorded against.
//
// Front-end "payment success" is not a thing this endpoint reads. An order is Paid when Stripe
// says so here, and not before.
//
// Always answered with 200: Stripe retries non-2xx responses, and a rejected notification must
// not turn into a retry storm. Rejections are logged instead.
import { adminClient, fromStripeMinorUnits, retrieveCheckoutSession, stripeConfig, verifyStripeSignature } from "./_payments.js";
import { withRequestId } from "./_config.js";

export const maxDuration = 20;

const SESSION_EVENTS = {
  "checkout.session.completed": null,
  "checkout.session.async_payment_succeeded": "paid",
  "checkout.session.async_payment_failed": "failed",
  "checkout.session.expired": "unpaid",
};

/**
 * Vercel may hand the body over already parsed, in which case the stream is spent and the exact
 * bytes are gone. req.rawBody is provided by the Node runtime for parsed bodies; a Buffer or
 * string body is usable directly; otherwise the stream is read here.
 */
async function readRawBytes(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.rawBody === "string") return Buffer.from(req.rawBody, "utf8");
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? Buffer.concat(chunks) : null;
}

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(200).send("");
  }

  const env = process.env;
  const config = stripeConfig(env);
  const raw = await readRawBytes(req);

  if (!config.webhookSecret) {
    req.log?.error("card notification ignored: STRIPE_WEBHOOK_SECRET is not set");
    return res.status(200).send("");
  }
  if (!raw) {
    req.log?.warn("card notification rejected: no raw body to verify against");
    return res.status(200).send("");
  }
  if (!verifyStripeSignature({ rawBody: raw, signatureHeader: req.headers["stripe-signature"], webhookSecret: config.webhookSecret })) {
    req.log?.warn("card notification rejected: signature mismatch");
    return res.status(200).send("");
  }

  let event;
  try {
    event = JSON.parse(raw.toString("utf8"));
  } catch {
    req.log?.warn("card notification rejected: body is not valid JSON");
    return res.status(200).send("");
  }

  const type = String(event?.type || "");
  const object = event?.data?.object || {};

  if (type === "charge.refunded") {
    // A refund changes money and stock, and this project's refund workflow is a staff decision
    // (record_refund restocks and reconciles). The notification is therefore kept as evidence for
    // an operator rather than applied automatically.
    req.log?.info("card refund notification received; awaiting staff reconciliation", {
      charge: object.id || null,
      refund: object.refund || null,
      event: event.id,
    });
    return res.status(200).send("");
  }

  if (!(type in SESSION_EVENTS)) {
    req.log?.info("card notification ignored: event outside the handled set", { event: type });
    return res.status(200).send("");
  }

  const sessionId = String(object.id || "");
  if (!sessionId.startsWith("cs_")) {
    req.log?.warn("card notification rejected: no checkout session reference", { event: type });
    return res.status(200).send("");
  }

  // Re-read the session instead of trusting the payload's own status field.
  const session = await retrieveCheckoutSession(sessionId, env).catch((error) => {
    req.log?.error("card session could not be re-read from the provider", { detail: error?.message });
    return null;
  });
  if (!session) {
    // 202-equivalent: acknowledge, change nothing. A retry will follow.
    return res.status(200).send("");
  }

  const amount = fromStripeMinorUnits(session.amount_total, session.currency);
  const admin = adminClient();
  const { data, error } = await admin.rpc("record_card_payment", {
    p_provider_event_id: String(event.id || `${type}:${sessionId}`),
    p_checkout_session_id: session.id,
    p_payment_intent_id: session.payment_intent || null,
    p_status: SESSION_EVENTS[type] ?? session.payment_status,
    p_amount: amount,
    p_currency: session.currency,
  });

  if (error) {
    req.log?.error("card notification could not be applied", { detail: error.message, session: session.id });
    return res.status(200).send("");
  }

  const result = Array.isArray(data) ? data[0] : data;
  req.log?.info("card notification processed", {
    session: session.id,
    applied: result?.applied,
    reason: result?.reason,
    providerStatus: session.status,
    paymentStatus: session.payment_status,
  });
  return res.status(200).send("");
};

export default withRequestId(handler);
