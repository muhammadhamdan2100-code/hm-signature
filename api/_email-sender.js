// Shared delivery primitives for the two server-side queue runners
// (api/email-worker.js and api/automation-worker.js). Keeping them here means a
// row is claimed, rendered and finished the same way whichever path drained it.
import { renderEmail } from "./_email-templates.js";
import { appBaseUrl, isSmtpConfigured, redactEmail, storeContactEmail } from "./_config.js";

export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// A serverless function that outlives its budget dies mid-batch, so callers pass a
// deadline; rows not reached are recorded as failed, which makes the claim query
// pick them up again after the normal backoff instead of stranding them as 'sending'.
export const DEFAULT_TIME_BUDGET_MS = 20000;

let mailTransport = null;

export async function getMailer() {
  if (!isSmtpConfigured()) return null;
  if (mailTransport) return mailTransport;
  const nodemailer = await import("nodemailer");
  mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return mailTransport;
}

/**
 * Sends already-claimed queue rows.
 * @param {object} admin service-role Supabase client
 * @param {Array<object>} rows claimed rows (id, template, subject, payload, recipient_*)
 * @param {{ mailer: object, log?: object, deadlineAt?: number }} options
 */
export async function deliverClaimedRows(admin, rows, { mailer, log, deadlineAt }) {
  const summary = { claimed: rows.length, sent: 0, failed: 0, skipped: 0 };

  for (const row of rows) {
    if (deadlineAt && Date.now() > deadlineAt) {
      // The row is already claimed, so it must be resolved rather than left in
      // 'sending'; 'failed' puts it back in the claim pool after the backoff.
      await admin.rpc("finish_email_send", { p_id: row.id, p_status: "failed", p_error: "worker time budget" });
      summary.failed += 1;
      continue;
    }

    const recipient =
      row.recipient_kind === "staff" ? storeContactEmail() : String(row.recipient_email || "").toLowerCase();

    if (!recipient || !EMAIL_PATTERN.test(recipient)) {
      await admin.rpc("finish_email_send", {
        p_id: row.id,
        p_status: "skipped",
        p_error: row.recipient_kind === "staff" ? "no staff inbox configured" : "recipient missing",
      });
      summary.skipped += 1;
      continue;
    }

    const rendered = renderEmail(row.template, row.payload || {}, { origin: appBaseUrl() });
    if (!rendered) {
      await admin.rpc("finish_email_send", { p_id: row.id, p_status: "skipped", p_error: "unknown template" });
      summary.skipped += 1;
      continue;
    }

    try {
      await mailer.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipient,
        subject: row.subject,
        html: rendered.html,
        text: rendered.text,
      });
      await admin.rpc("finish_email_send", { p_id: row.id, p_status: "sent" });
      summary.sent += 1;
      log?.info("transactional email delivered", { template: row.template, to: redactEmail(recipient) });
    } catch (error) {
      // Transport text can mention the host; keep the reason short and store it
      // without any credential material.
      await admin.rpc("finish_email_send", {
        p_id: row.id,
        p_status: "failed",
        p_error: String(error?.message || "send failed").slice(0, 200),
      });
      summary.failed += 1;
      log?.error("transactional email failed", { template: row.template, detail: error?.message });
    }
  }

  return summary;
}

export function secretsMatch(provided, expected) {
  if (!expected || !provided || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
