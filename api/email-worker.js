// Vercel serverless function — POST /api/email-worker
//
// Drains the transactional email queue written by the business-event triggers.
// Two ways in, both server-authoritative:
//   1. scheduler path — header x-email-worker-secret matches EMAIL_WORKER_SECRET, or
//      the bearer token matches CRON_SECRET (Vercel Cron sends it automatically);
//      claims any due rows.
//   2. session path — a signed-in customer's bearer token; claims only queue rows
//      addressed to that customer's own account, so a checkout can deliver its own
//      confirmation without waiting for a schedule.
//
// Delivery needs both a service-role connection and SMTP. Without them the
// function answers 503 {configured:false} and claims nothing — no silent queue
// churn, and no claim that an email went out.
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_TIME_BUDGET_MS,
  deliverClaimedRows,
  getMailer,
  secretsMatch,
} from "./_email-sender.js";
import {
  isSmtpConfigured,
  serviceRoleKey,
  supabasePublishableKey,
  supabaseUrl,
  withRequestId,
} from "./_config.js";

export const maxDuration = 30;

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

const handler = async (req, res) => {
  // Vercel Cron invokes a path with GET; other schedulers and the storefront use
  // POST. Both are handled, and both are authorised below.
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const url = supabaseUrl();
  const key = serviceRoleKey();
  const mailer = await getMailer();

  if (!url || !key || !mailer) {
    return res.status(503).json({
      success: false,
      configured: false,
      reason: !url || !key ? "server credentials" : "smtp",
      delivered: 0,
    });
  }

  const secret = String(req.headers["x-email-worker-secret"] || "");
  const bearer = String(req.headers.authorization || "").startsWith("Bearer ")
    ? String(req.headers.authorization).slice(7)
    : "";
  const scheduled =
    secretsMatch(secret, process.env.EMAIL_WORKER_SECRET || "") ||
    secretsMatch(bearer, process.env.CRON_SECRET || "");
  const email = scheduled ? null : await callerEmail(req);
  if (!scheduled && !email) {
    return res.status(401).json({ error: "Worker secret or a signed-in session is required." });
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let rows = [];
  if (scheduled) {
    const limit = Math.max(1, Math.min(25, Number(req.body?.limit) || 10));
    const { data, error } = await admin.rpc("claim_email_batch", { p_limit: limit });
    if (error) {
      req.log?.error("queue claim failed", { detail: error.message });
      return res.status(502).json({ error: "The mail queue could not be read." });
    }
    rows = data || [];
  } else {
    // Session path: claim with the customer's own token so Postgres restricts the
    // batch to rows addressed to them; only the finish step uses the admin client.
    const token = String(req.headers.authorization || "").slice(7);
    const asUser = createClient(url, supabasePublishableKey(), {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await asUser.rpc("claim_email_batch_for_self", { p_limit: 3 });
    if (error) {
      req.log?.error("self claim failed", { detail: error.message });
      return res.status(502).json({ error: "The mail queue could not be read." });
    }
    rows = data || [];
  }

  const summary = await deliverClaimedRows(admin, rows, {
    mailer,
    log: req.log,
    deadlineAt: Date.now() + DEFAULT_TIME_BUDGET_MS,
  });

  res.status(200).json({ success: true, configured: true, ...summary });
};

export default withRequestId(handler);
