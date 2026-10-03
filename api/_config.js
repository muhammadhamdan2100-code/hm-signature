// Shared server-side configuration for every API surface.
//
// Files in /api that begin with an underscore are private to Vercel (not routed),
// and server/index.js imports the same module, so development and production read
// configuration and write logs in exactly one way.
//
// Rules enforced here:
// - Optional services must never prevent the app from booting: every capability
//   reports "configured: false" instead of throwing.
// - Secrets are never returned, logged, or echoed to a client.
// - Customer-facing error bodies stay generic; detail goes to the logs.
import { payfastReadiness } from "./_payfast.js";

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function isAiConfigured() {
  return Boolean(process.env.AI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY);
}

export function isSupabaseServerConfigured() {
  return Boolean(supabaseUrl() && serviceRoleKey());
}

export function supabaseUrl() {
  return process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function supabasePublishableKey() {
  return (
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ""
  );
}

export function serviceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

// Absolute base URL is required for provider callbacks and emailed links, because
// a serverless function has no window.location to fall back on.
export function appBaseUrl() {
  const explicit = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "";
  if (vercel) return `https://${vercel}`.replace(/\/+$/, "");
  return `http://localhost:${process.env.PORT || 3001}`;
}

// CORS_ORIGIN accepts a comma-separated list so one deployment can serve
// preview + production hosts without a code change.
export function allowedOrigins() {
  return String(process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function storeContactEmail() {
  return String(process.env.STORE_CONTACT_EMAIL || process.env.SMTP_USER || "").toLowerCase();
}

export function isSchedulerAuthorised() {
  // Vercel Cron sends CRON_SECRET automatically; EMAIL_WORKER_SECRET covers any
  // other scheduler. Without one of them nothing can drain the queue unattended.
  return Boolean(process.env.CRON_SECRET || process.env.EMAIL_WORKER_SECRET);
}

export function capabilities() {
  return {
    email: isSmtpConfigured(),
    concierge: isAiConfigured(),
    payfast: payfastReadiness().ready,
    serverDatabase: isSupabaseServerConfigured(),
    // Unattended follow-ups need all three: credentials, a transport and a way to
    // authorise the scheduler. Reported as one boolean so the admin view can state
    // plainly whether automation can actually run.
    automations: isSupabaseServerConfigured() && isSmtpConfigured() && isSchedulerAuthorised(),
  };
}

export function isPayfastConfigured() {
  return payfastReadiness().ready;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

const LEVELS = ["debug", "info", "warn", "error"];

function newRequestId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Email addresses are business-identifying data: keep the shape legible, drop the
// person, so a log line can be shared while debugging without a data leak.
export function redactEmail(value) {
  const text = String(value ?? "");
  const [name, domain] = text.split("@");
  if (!domain) return text ? "***" : "";
  return `${name.slice(0, 2)}***@${domain.split(".")[0]}.***`;
}

function emit(level, message, context = {}) {
  if (!LEVELS.includes(level)) level = "info";
  const safe = {};
  for (const [key, value] of Object.entries(context)) {
    if (value === undefined || value === null || typeof value === "object") {
      if (value && typeof value === "object" && "email" in value) {
        safe[key] = redactEmail(value.email);
      } else if (value && typeof value === "object" && "token" in value) {
        safe[key] = "[redacted]";
      } else {
        safe[key] = typeof value === "object" ? undefined : value;
      }
    } else if (/secret|key|token|password|passphrase/i.test(key)) {
      safe[key] = "[redacted]";
    } else if (/email/i.test(key)) {
      safe[key] = redactEmail(value);
    } else {
      safe[key] = value;
    }
  }
  const line = JSON.stringify({ at: new Date().toISOString(), level, message, ...safe });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function createLogger(base = {}) {
  return {
    info: (message, context) => emit("info", message, { ...base, ...context }),
    warn: (message, context) => emit("warn", message, { ...base, ...context }),
    error: (message, context) => emit("error", message, { ...base, ...context }),
  };
}

export function withRequestId(handler) {
  return async (req, res) => {
    const requestId = String(req.headers["x-request-id"] || "").slice(0, 64) || newRequestId();
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    const log = createLogger({ requestId, route: req.url?.split("?")[0], method: req.method });
    req.log = log;
    try {
      await handler(req, res);
    } catch (error) {
      // Never forward an internal message to the browser: it can carry connection
      // strings, table names or provider detail.
      const failure = reportFailure({
        requestId,
        route: req.url?.split("?")[0],
        error,
        kind: "system",
      });
      log.error("unhandled request failure", { detail: error?.message, failureId: failure?.id });
      if (!res.headersSent) res.status(500).json({ error: "The request could not be completed." });
    }
  };
}

// ---------------------------------------------------------------------------
// Failure reporting
// ---------------------------------------------------------------------------
//
// Expected business outcomes (a coupon that expired, an order that is already
// cancelled) are not incidents; system failures are. A deployment with no error
// service must still be diagnosable, so failures are always logged with a stable
// id, counted in-process, and optionally posted to a webhook — with the same
// redaction rules either way. Sentry (or any similar service) can replace the
// webhook later; nothing here requires it.

const failureWindowMs = 60 * 60 * 1000;
const failures = [];

function isBusinessFailure(message) {
  return /not configured|permission denied|authorisation|authorization|not found|already|expired|invalid|sign in|refus/i.test(
    String(message || "")
  );
}

export function reportFailure({ requestId, route, error, kind }) {
  const message = String(error?.message || error || "unknown failure").slice(0, 300);
  const resolvedKind = kind || (isBusinessFailure(message) ? "business" : "system");
  if (resolvedKind !== "system") return null;

  const failure = {
    id: `${Date.now().toString(36)}-${newRequestId()}`,
    at: Date.now(),
    route: String(route || "").slice(0, 80),
    requestId: requestId || null,
    message,
    name: String(error?.name || "Error").slice(0, 60),
    status: Number(error?.status) || 500,
  };

  failures.push(failure);
  if (failures.length > 200) failures.splice(0, failures.length - 200);
  const cutoff = Date.now() - failureWindowMs;
  while (failures.length && failures[0].at < cutoff) failures.shift();

  const webhook = String(process.env.ERROR_REPORT_URL || "").trim();
  if (webhook) {
    // Fire-and-forget: a broken error sink must never break the request that
    // failed. No payload body, no headers, no customer data leaves this process.
    fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: "hm-signature",
        environment: process.env.VERCEL_ENV || "development",
        failure,
      }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {});
  }

  return failure;
}

export function recentFailures(limit = 5) {
  const cutoff = Date.now() - failureWindowMs;
  const window = failures.filter((f) => f.at >= cutoff);
  return {
    windowMinutes: failureWindowMs / 60000,
    systemFailures: window.length,
    recent: window.slice(-limit).map((f) => ({
      at: new Date(f.at).toISOString(),
      route: f.route,
      message: f.message,
    })),
  };
}
