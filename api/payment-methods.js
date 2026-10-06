// Vercel serverless function — GET /api/payment-methods?country=PK&currency=PKR
//
// The method list the checkout shows. It is public because a guest must see it before signing
// in or placing an order, and it is served server-side rather than read straight from the table
// because the states a shopper sees (available / coming soon / not configured) depend on which
// provider credentials exist in this deployment — a fact the browser must not be able to forge.
import { withRequestId } from "./_config.js";
import { checkoutMethods, PaymentGateError } from "./_payments.js";

const ISO = /^[A-Za-z]{2}$/;
const CURRENCY = /^[A-Za-z]{3}$/;

const handler = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const country = String(req.query.country || "").toUpperCase();
  const currency = String(req.query.currency || "").toUpperCase();
  if (!ISO.test(country)) return res.status(400).json({ error: "A two-letter country code is required." });

  try {
    const methods = await checkoutMethods({ countryCode: country, currencyCode: CURRENCY.test(currency) ? currency : undefined });
    return res.status(200).json({
      country,
      currency: currency || null,
      methods: methods.map((m) => ({
        code: m.code,
        provider: m.provider_code,
        type: m.type,
        name: m.display_name,
        description: m.description,
        icon: m.icon,
        state: m.state,
        status: m.status,
        environment: m.environment,
        canSubmit: m.canSubmit,
        requiresReference: m.requires_reference,
        requiresProof: m.requires_proof,
      })),
    });
  } catch (error) {
    if (error instanceof PaymentGateError) return res.status(error.status).json({ error: error.message });
    console.error("payment-methods failed:", error?.message || error);
    // An empty list is safer than a guessed one: checkout shows "no methods configured" instead
    // of offering a rail that cannot settle.
    return res.status(200).json({ country, currency: currency || null, methods: [], degraded: true });
  }
};

export default withRequestId(handler);
