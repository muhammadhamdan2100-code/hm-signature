// Phase 10-J — application observability, client side.
//
// This deployment ships no serverless functions, so there is no server log sink to write to. The
// honest scope of client observability is therefore: capture failures with a correlation id that
// ties a console event to one browser session, redact anything secret, and emit a structured line
// a human or a browser-extension log shipper can consume. If VITE_ERROR_REPORT_URL is configured
// (a real collector endpoint) each event is also POSTed; otherwise the beacon is a silent no-op —
// it never pretends a report was delivered. Observability here makes a failure *diagnosable*; it
// does not claim that paging/alerting works, which is a separate, server-side concern.

type FieldBag = Record<string, unknown>;

// Values that must never be shipped or printed verbatim. Keys are matched case-insensitively;
// string values are additionally screened so a stray token/JWT embedded in a message is masked too.
const SENSITIVE_KEY = /pass(word|wd)?|secret|token|apikey|api_key|authorization|bearer|session|jwt|cookie|cvv|pan|card|number|invoice|pin|proof|otp|private_key|client_secret|credential/i;
const SENSITIVE_VALUE = /\b(ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}|[A-Za-z0-9-]*_(?:test|live|publishable|secret)_[A-Za-z0-9_-]{8,}|(?:sk|pk|rk)_[A-Za-z0-9]{8,}|whsec_[A-Za-z0-9]{8,}|Bearer\s+[A-Za-z0-9._-]{12,})\b/g;

function redactString(value: string): string {
  return value.replace(SENSITIVE_VALUE, "[redacted]");
}

function redactFields(fields: FieldBag | undefined): FieldBag {
  const out: FieldBag = {};
  for (const [key, value] of Object.entries(fields || {})) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    if (typeof value === "string") out[key] = redactString(value);
    else if (value instanceof Error) out[key] = `${value.name}: ${redactString(value.message || "")}`;
    else out[key] = value;
  }
  return out;
}

// One id per browser session so every logged event from it can be correlated.
export function correlationId(): string {
  try {
    let id = sessionStorage.getItem("hm_correlation_id");
    if (!id) {
      id = (globalThis.crypto?.randomUUID?.() ?? `cid-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      sessionStorage.setItem("hm_correlation_id", id);
    }
    return id;
  } catch {
    // sessionStorage may be unavailable (private mode / sandbox); fall back to a page id.
    return (globalThis as any).__hm_page_cid || ((globalThis as any).__hm_page_cid = `cid-${Date.now()}`);
  }
}

export type ObservedEvent = {
  level: "info" | "warn" | "error";
  event: string;
  fields?: FieldBag;
};

function beacon(body: ObservedEvent & { correlationId: string; at: string }) {
  const url = (import.meta as any).env?.VITE_ERROR_REPORT_URL as string | undefined;
  if (!url) return; // No collector configured: nothing is claimed as delivered.
  try {
    // fire-and-forget; a failed ship must never disturb the app
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* observability never throws into the app */
  }
}

export function logEvent({ level, event, fields }: ObservedEvent): void {
  const at = new Date().toISOString();
  const cid = correlationId();
  const redacted = redactFields(fields);
  const line = `[hm][${level}] ${event} cid=${cid}`;
  // eslint-disable-next-line no-console
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  sink(line, redacted);
  beacon({ level, event, fields: redacted, correlationId: cid, at });
}

export function captureError(error: unknown, context: FieldBag = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  logEvent({
    level: "error",
    event: typeof context.event === "string" ? context.event : "app.error",
    fields: {
      ...context,
      name: error instanceof Error ? error.name : "Unknown",
      message: redactString(message || ""),
      stack: error instanceof Error && error.stack ? redactString(error.stack.split("\n").slice(0, 6).join("\n")) : undefined,
    },
  });
}

export function logMetric(name: string, fields: FieldBag = {}): void {
  logEvent({ level: "info", event: `metric.${name}`, fields });
}

let installed = false;

/** Registers process-wide handlers so uncaught errors and rejected promises become observable.
 * Safe to call more than once; only the first call attaches listeners. */
export function installGlobalErrorHandlers(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e) => {
    captureError(e.error ?? new Error(e.message || "window error"), {
      event: "window.error",
      source: e.filename,
      line: e.lineno,
      col: e.colno,
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    captureError(e.reason ?? new Error("unhandled rejection"), { event: "unhandledrejection" });
  });
}
