import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_51HM_DUMMY_SECRET_KEY";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_dummy_webhook_secret";
const stripeConfigured = !stripeSecretKey.includes("DUMMY");

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));

// Webhook endpoint requires RAW body for signature verification
app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    if (stripeWebhookSecret && sig && !stripeWebhookSecret.includes("dummy")) {
      event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
    } else {
      // Mock event processing when running test mode without live webhooks
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error("⚠️ Webhook Signature Verification Failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle Event Types
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log("✅ Stripe Checkout Session Succeeded:", session.id, "Total:", session.amount_total);
      break;
    }
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      console.log("💳 PaymentIntent Succeeded:", paymentIntent.id);
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
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

    if (!stripeConfigured) {
      return res.status(501).json({ error: "Stripe is not configured for this deployment.", configured: false });
    }

    if (!items || !items.length) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    const line_items = items.map((item) => ({
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
  } catch (error) {
    console.error("Stripe Session Creation Error:", error.message);
    res.status(500).json({ error: "Could not create checkout session." });
  }
});

// 2. TRANSACTIONAL EMAIL SENDER ENDPOINT
// Sends via SMTP only when provider credentials are configured server-side.
// Never exposes credentials; returns 501 (configured:false) when unavailable
// so the client can degrade gracefully instead of faking delivery.
let mailTransport = null;
async function getMailer() {
  if (mailTransport) return mailTransport;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  const nodemailer = await import("nodemailer");
  mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return mailTransport;
}

app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, html } = req.body || {};

    if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(to)) || !subject) {
      return res.status(400).json({ error: "Invalid email request." });
    }

    const mailer = await getMailer();
    if (!mailer) {
      console.log(`📧 [SMTP not configured] Would send "${subject}" to ${to}`);
      return res.status(501).json({ success: false, configured: false });
    }

    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: String(to),
      subject: String(subject),
      html: String(html || ""),
    });

    res.json({ success: true, configured: true });
  } catch (error) {
    console.error("Email Error:", error.message);
    res.status(500).json({ error: "Email delivery failed." });
  }
});

// 3. SECURE SERVER-SIDE STAFF CREATION ENDPOINT (Never exposes service_role key to client)
// Requires a valid Supabase JWT from an active manager/super-admin caller.
const ALLOWED_STAFF_ROLES = ["manager", "order_manager", "content_manager", "super_admin"];

app.post("/api/admin/create-staff", async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return res.status(400).json({ error: "Server SUPABASE_SERVICE_ROLE_KEY is not configured." });
    }

    const authHeader = req.headers.authorization || "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!accessToken) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (callerErr || !callerData.user) {
      return res.status(401).json({ error: "Invalid or expired session." });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role,status")
      .eq("id", callerData.user.id)
      .maybeSingle();

    if (
      !callerProfile ||
      callerProfile.status !== "active" ||
      !["super_admin", "manager"].includes(callerProfile.role)
    ) {
      return res.status(403).json({ error: "Only active managers or super admins can create staff." });
    }

    if (role === "super_admin" && callerProfile.role !== "super_admin") {
      return res.status(403).json({ error: "Only a super admin can create another super admin." });
    }

    if (!ALLOWED_STAFF_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid staff role." });
    }

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email is required." });
    }

    if (password !== undefined && String(password).length > 0 && String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    if (!password || String(password).length < 8) {
      return res.status(400).json({ error: "A password of at least 8 characters is required." });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: String(password),
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
  } catch (error) {
    console.error("Server Staff Creation Error:", error.message);
    res.status(500).json({ error: "Staff creation failed." });
  }
});

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 HM Signature Backend API Server running on port ${PORT}`);
});
