// Vercel serverless function — GET|POST /api/automation-worker
//
// The scheduler entry point for Phase 6 follow-up workflows: it runs the database
// sweep (queue eligible abandoned bags, move due follow-ups into the email outbox)
// and then drains that outbox in the same invocation, so a single scheduled call
// completes the whole chain.
//
// Scheduler-only on purpose. run_automation_sweep is not executable by anon or
// authenticated roles, so no browser or customer session can trigger a send here —
// only a request carrying EMAIL_WORKER_SECRET or the CRON_SECRET Vercel Cron sends.
//
// Re-running is safe: follow-up tasks are keyed and a bag records the reminder, so
// a duplicate invocation cannot produce a second email for the same bag.
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_TIME_BUDGET_MS, deliverClaimedRows, getMailer, secretsMatch } from "./_email-sender.js";
import { isSmtpConfigured, serviceRoleKey, supabaseUrl, withRequestId } from "./_config.js";

export const maxDuration = 30;

const handler = async (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const secret = String(req.headers["x-email-worker-secret"] || "");
  const bearer = String(req.headers.authorization || "").startsWith("Bearer ")
    ? String(req.headers.authorization).slice(7)
    : "";
  const authorised =
    secretsMatch(secret, process.env.EMAIL_WORKER_SECRET || "") ||
    secretsMatch(bearer, process.env.CRON_SECRET || "");
  if (!authorised) {
    // Never fall back to a session here: a shopper must not be able to trigger
    // marketing follow-ups.
    return res.status(401).json({ error: "A scheduler secret is required." });
  }

  const url = supabaseUrl();
  const key = serviceRoleKey();
  if (!url || !key) {
    return res.status(503).json({
      success: false,
      configured: false,
      reason: "server credentials",
      swept: false,
    });
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const limit = Math.max(1, Math.min(50, Number(req.body?.limit ?? req.query?.limit) || 25));
  const { data: sweep, error: sweepError } = await admin.rpc("run_automation_sweep", { p_limit: limit });
  if (sweepError) {
    req.log?.error("automation sweep failed", { detail: sweepError.message });
    return res.status(502).json({ success: false, error: "The automation sweep could not run." });
  }

  const result = {
    success: true,
    configured: true,
    sweep: sweep ?? null,
    delivered: { claimed: 0, sent: 0, failed: 0, skipped: 0 },
  };

  const mailer = await getMailer();
  if (!mailer || !isSmtpConfigured()) {
    // The queue keeps the rows; nothing is pretend-sent and nothing is lost.
    result.email = false;
    result.reason = "smtp";
    return res.status(200).json(result);
  }

  const claimLimit = Math.max(1, Math.min(25, Number(req.body?.emailLimit) || 10));
  const { data: rows, error: claimError } = await admin.rpc("claim_email_batch", { p_limit: claimLimit });
  if (claimError) {
    req.log?.error("queue claim failed", { detail: claimError.message });
    result.email = false;
    result.reason = "queue unavailable";
    return res.status(200).json(result);
  }

  result.delivered = await deliverClaimedRows(admin, rows || [], {
    mailer,
    log: req.log,
    deadlineAt: Date.now() + DEFAULT_TIME_BUDGET_MS,
  });
  result.email = true;

  req.log?.info("automation sweep finished", {
    queued: result.sweep?.queued ?? 0,
    processed: result.sweep?.processed ?? 0,
    sent: result.delivered.sent,
  });

  res.status(200).json(result);
};

export default withRequestId(handler);
