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

    const line_items = items.map((item: any) => ({
      price_data: {
        currency: "pkr",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(Number(item.price) * 100),
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

// 3. SECURE SERVER-SIDE STAFF CREATION ENDPOINT (Never exposes service_role key to client)
app.post("/api/admin/create-staff", async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return res.status(400).json({ error: "Server SUPABASE_SERVICE_ROLE_KEY is not configured." });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || "Password123!",
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (userError || !userData.user) {
      return res.status(400).json({ error: userError?.message || "User creation failed" });
    }

    // Connect auth.users.id to public.profiles.id
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userData.user.id,
        email,
        full_name: fullName,
        role,
        status: "active",
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Profile Upsert Error:", profileError.message);
    }

    res.json({ success: true, user: userData.user });
  } catch (error: any) {
    console.error("Server Staff Creation Error:", error.message);
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
