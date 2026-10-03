// Vercel serverless function — POST /api/send-email
//
// The direct path for the one message type that is not tied to an order: a website
// enquiry. Guards, in order: session required, template allowlist, recipient forced
// to the configured staff inbox (the browser cannot choose who gets mailed), length
// caps, per-IP rate limit. Returns 501 {configured:false} when SMTP is unset, so the
// client degrades honestly instead of claiming a delivery that never happened.
//
// Everything order-related is queued by the database triggers and drained by
// /api/email-worker — this file cannot be used to send those.
import { renderEmail } from "./_email-templates.js";
import {
  appBaseUrl,
  redactEmail,
  storeContactEmail,
  supabasePublishableKey,
  supabaseUrl,
  withRequestId,
} from "./_config.js";

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

async function callerEmail(req) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const url = supabaseUrl();
  const anon = supabasePublishableKey();
  if (!token || !url || !anon) return null;
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anon },
    });
    if (!res.ok) return null;
    return (await res.json())?.email || null;
  } catch {
    return null;
  }
}

const ALLOWED_TEMPLATES = ["contact_enquiry"];

const handler = async (req, res) => {
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

    const { template, data } = req.body || {};
    if (!ALLOWED_TEMPLATES.includes(String(template))) {
      res.status(400).json({ error: "Unsupported message type." });
      return;
    }

    const sender = await callerEmail(req);
    if (!sender) {
      res.status(401).json({ error: "Please sign in before sending a message." });
      return;
    }

    const inbox = storeContactEmail();
    if (!inbox) {
      req.log?.warn("enquiry refused", { reason: "no staff inbox configured" });
      res.status(503).json({ error: "This deployment has no enquiry inbox configured." });
      return;
    }

    const payload = {
      name: String(data?.name || "").slice(0, 120),
      email: String(data?.email || sender).slice(0, 160),
      subject: String(data?.subject || "General").slice(0, 120),
      message: String(data?.message || "").slice(0, 4000),
    };
    if (!payload.message.trim() || !payload.name.trim()) {
      res.status(400).json({ error: "Please include your name and a message." });
      return;
    }

    const rendered = renderEmail("contact_enquiry", payload, { origin: appBaseUrl() });
    if (!rendered) {
      res.status(400).json({ error: "Could not compose the message." });
      return;
    }

    const mailer = await getMailer();
    if (!mailer) {
      res.status(501).json({ success: false, configured: false });
      return;
    }

    // Recipient is decided here, never by the caller.
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: inbox,
      replyTo: payload.email,
      subject: `[enquiry] ${payload.subject}`.slice(0, 150),
      html: rendered.html,
      text: rendered.text,
    });

    req.log?.info("enquiry forwarded", { from: redactEmail(payload.email) });
    res.status(200).json({ success: true, configured: true });
  } catch (error) {
    req.log?.error("enquiry delivery failed", { detail: error?.message });
    res.status(500).json({ error: "Message delivery failed." });
  }
}

export default withRequestId(handler);
