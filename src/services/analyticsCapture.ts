import { supabase } from "../lib/supabase";

/**
 * Storefront funnel and attribution capture.
 *
 * Phase 9's funnel report can only answer for the period this file has been
 * running: nothing here reaches back and estimates what happened before the
 * first recorded visit. The database validates every field again, so a tampered
 * payload cannot store a path with a query string in it or an order that is not
 * the caller's.
 *
 * What is stored: a random per-browser id, a random per-tab id, the path, the
 * campaign parameters already in the URL, and the host that referred the visit.
 * What is never stored: an IP address, a user agent, a full referrer, or anything
 * typed by the shopper. A `Do Not Track` setting is honoured.
 */

const VISITOR_KEY = "hm-analytics-visitor";
const SESSION_KEY = "hm-analytics-session";
const UTM_SENT_KEY = "hm-analytics-utm-sent";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export type FunnelEvent =
  | "visit"
  | "product_view"
  | "add_to_cart"
  | "begin_checkout"
  | "payment_started"
  | "payment_completed"
  | "order_completed";

export interface FunnelEventInput {
  event: FunnelEvent;
  path?: string;
  productId?: string | null;
  orderId?: string | null;
  currencyCode?: string | null;
  countryCode?: string | null;
}

function randomId(): string {
  const cryptoRef = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
    return cryptoRef.randomUUID().replace(/-/g, "");
  }
  // A browser without crypto.randomUUID still gets an unguessable 32-character id.
  let out = "";
  while (out.length < 32) out += Math.random().toString(36).slice(2);
  return out.slice(0, 32);
}

// When storage is unavailable the ids cannot be kept, but they must not be
// re-rolled for every call either: a visit whose page view and add-to-cart carry
// different session ids is two visitors to the funnel, and the counts double.
let fallbackVisitor = "";
let fallbackSession = "";

function stored(key: string, sink: "local" | "session"): string {
  try {
    const store = sink === "local" ? window.localStorage : window.sessionStorage;
    let value = store.getItem(key) || "";
    if (!value) {
      value = randomId();
      store.setItem(key, value);
    }
    return value;
  } catch {
    if (sink === "local") {
      if (!fallbackVisitor) fallbackVisitor = randomId();
      return fallbackVisitor;
    }
    if (!fallbackSession) fallbackSession = randomId();
    return fallbackSession;
  }
}

function visitorId(): string {
  return stored(VISITOR_KEY, "local");
}

function sessionId(): string {
  return stored(SESSION_KEY, "session");
}

function utmParams(): Record<string, string> {
  try {
    const search = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = (search.get(key) || "").trim();
      if (value) found[key] = value.slice(0, 80);
    }
    return found;
  } catch {
    return {};
  }
}

function referrerHost(): string | null {
  try {
    const ref = (window.document.referrer || "").trim();
    if (!ref) return null;
    const url = new URL(ref);
    if (url.hostname === window.location.hostname) return null;
    return url.hostname.slice(0, 120);
  } catch {
    return null;
  }
}

function currentPath(): string {
  try {
    // The query string is dropped on purpose: it is where a token or an email
    // address would otherwise be found.
    return window.location.pathname.slice(0, 200);
  } catch {
    return "/";
  }
}

function disabled(): boolean {
  try {
    const dnt = window.navigator?.doNotTrack;
    return dnt === "1" || dnt === "yes";
  } catch {
    return true;
  }
}

let visitSent = false;
let utmAlreadySent = false;
const viewedThisSession = new Set<string>();

try {
  utmAlreadySent = window.sessionStorage.getItem(UTM_SENT_KEY) === "1";
} catch {
  utmAlreadySent = false;
}

function send(events: Record<string, unknown>[]): void {
  if (!events.length) return;
  // Capture must never surface as a failed purchase or a console error.
  void supabase.rpc("record_analytics_event", { p_events: events }).then(({ error }) => {
    if (error) return;
  });
}

/** One funnel event. Fire it and move on; nothing in the UI waits for this. */
export function captureEvent(input: FunnelEventInput): void {
  if (disabled()) return;
  const event: Record<string, unknown> = {
    event: input.event,
    visitor_id: visitorId(),
    session_id: sessionId(),
    path: input.path ?? currentPath(),
  };
  if (input.productId) event.product_id = input.productId;
  if (input.orderId) event.order_id = input.orderId;
  if (input.currencyCode) event.currency_code = input.currencyCode;
  if (input.countryCode) event.country_code = input.countryCode;

  if (input.event === "visit" && !utmAlreadySent) {
    const utm = utmParams();
    Object.assign(event, utm);
    if (Object.keys(utm).length) {
      try {
        window.sessionStorage.setItem(UTM_SENT_KEY, "1");
      } catch {
        /* a repeated attribution on the next visit is the harmless fallback */
      }
    }
    const host = referrerHost();
    if (host) event.referrer_host = host;
    utmAlreadySent = true;
  }

  send([event]);
}

/** The arrival. Called once per page load by the router beacon. */
export function captureVisit(): void {
  if (visitSent) return;
  visitSent = true;
  captureEvent({ event: "visit" });
}

/** A fragrance opened in this tab. Repeats are not recorded twice. */
export function captureProductView(productId: string): void {
  if (!productId || viewedThisSession.has(productId)) return;
  viewedThisSession.add(productId);
  captureEvent({ event: "product_view", productId, path: `/product/${productId}` });
}
