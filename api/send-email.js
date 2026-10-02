// Vercel serverless function — POST /api/send-email
//
// Guards, in order: shared-secret-free session auth, recipient allowlist,
// template allowlist, per-IP rate limit. The browser cannot supply arbitrary
// HTML: the body is rendered here from an approved template id plus data.
// Returns 501 {configured:false} when SMTP is unset, so the client degrades
// honestly instead of reporting a delivery that never happened.
let mailTransport = null;

const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 4;
const buckets = new Map();

function tooMany(key) {
  const now = Date.now();
  const keep = (buckets.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (keep.length >= MAX_PER_WINDOW) {
    buckets.set(key, keep);
    return true;
  }
  keep.push(now);
  buckets.set(key, keep);
  return false;
}

async function getMailer() {
  if (mailTransport) return mailTransport;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  const nodemailer = await import("nodemailer");
  mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return mailTransport;
}

const escape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function renderTemplate(template, data) {
  const brand = '<p style="font-family:serif;letter-spacing:3px;color:#C8A96B;">HM SIGNATURE</p>';
  switch (template) {
    case "order_confirmation":
      return `<div style="font-family:sans-serif">${brand}
        <h2>Your order has been received</h2>
        <p>Order reference: <strong>${escape(data.orderNumber)}</strong></p>
        <p>Total: ${escape(data.total)} · Payment method: ${escape(data.paymentMethod)}</p>
        <p>Delivery city: ${escape(data.shippingCity)}</p>
        <p>We will email you again when your parcel is dispatched, with tracking.</p></div>`;
    case "shipping_update":
      return `<div style="font-family:sans-serif">${brand}
        <h2>${escape(data.title || "Delivery update")}</h2>
        <p>${escape(data.message || "")}</p>
        <p>Order: <strong>${escape(data.orderNumber)}</strong>${data.trackingId ? ` · Tracking: ${escape(data.trackingId)}` : ""}</p></div>`;
    case "general":
      return `<div style="font-family:sans-serif">${brand}
        <h2>${escape(data.subject || "Message from HM Signature")}</h2>
        <p>${escape(data.message || "")}</p></div>`;
    default:
      return null;
  }
}

async function callerEmail(req) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return null;
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anon },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.email || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
    if (tooMany(ip)) {
      res.status(429).json({ error: "Too many requests. Please wait a minute." });
      return;
    }

    const { to, subject, template, data } = req.body || {};
    const allowedTemplates = ["order_confirmation", "shipping_update", "general"];
    if (!allowedTemplates.includes(String(template))) {
      res.status(400).json({ error: "Unsupported email template." });
      return;
    }

    const email = await callerEmail(req);
    if (!email) {
      res.status(401).json({ error: "Sign in before sending email." });
      return;
    }

    // Recipients are limited to the signed-in customer and the atelier inbox,
    // so this endpoint can never be pointed at third parties.
    const inbox = process.env.STORE_CONTACT_EMAIL || process.env.SMTP_USER;
    const requested = String(to || "").trim().toLowerCase();
    if (requested !== email.toLowerCase() && requested !== String(inbox || "").toLowerCase()) {
      res.status(403).json({ error: "That recipient is not allowed." });
      return;
    }

    const html = renderTemplate(String(template), data || {});
    if (!html) {
      res.status(400).json({ error: "Could not render the message." });
      return;
    }

    const mailer = await getMailer();
    if (!mailer) {
      res.status(501).json({ success: false, configured: false });
      return;
    }

    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: requested,
      subject: String(subject || "HM Signature").slice(0, 150),
      html,
    });

    res.status(200).json({ success: true, configured: true });
  } catch (error) {
    console.error("Email function error:", error?.message);
    res.status(500).json({ error: "Email delivery failed." });
  }
}
