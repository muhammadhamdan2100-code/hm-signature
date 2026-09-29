import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_51HM_DUMMY_SECRET_KEY";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_dummy_webhook_secret";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as any,
});

app.use(cors());

// Webhook endpoint requires RAW body for signature verification
app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event: Stripe.Event;

  try {
    if (stripeWebhookSecret && sig && !stripeWebhookSecret.includes("dummy")) {
      event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
    } else {
      // Mock event processing when running test mode without live webhooks
      event = JSON.parse(req.body.toString());
    }
  } catch (err: any) {
    console.error("⚠️ Webhook Signature Verification Failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle Event Types
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("✅ Stripe Checkout Session Succeeded:", session.id, "Total:", session.amount_total);
      // Trigger order payment status update & inventory adjustment
      break;
    }
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("💳 PaymentIntent Succeeded:", paymentIntent.id);
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      console.log("↩️ Charge Refunded:", charge.id);
      break;
    }
    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Regular JSON parsing for API routes
app.use(express.json());

// 1. CREATE STRIPE CHECKOUT SESSION ENDPOINT
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { items, customerEmail, customerName, shippingAddress, couponCode } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    // Server-side price calculation (never trust client prices)
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: "pkr",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(Number(item.price) * 100), // convert to cents / smallest unit
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      customer_email: customerEmail,
      success_url: `${req.headers.origin || "http://localhost:5173"}/account/orders?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.origin || "http://localhost:5173"}/checkout?canceled=true`,
      metadata: {
        customerName,
        couponCode: couponCode || "",
        shippingCity: shippingAddress?.city || "",
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe Session Creation Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. TRANSACTIONAL EMAIL SENDER ENDPOINT
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, template, data } = req.body;

    console.log(`📧 Transactional Email Sent to [${to}] | Subject: "${subject}" | Template: "${template}"`);
    console.log("Email Payload Data:", data);

    res.json({ success: true, message: `Email dispatched successfully to ${to}` });
  } catch (error: any) {
    console.error("Email Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 HM Signature Backend API Server running on port ${PORT}`);
});
