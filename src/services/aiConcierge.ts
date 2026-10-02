import { supabase } from "../lib/supabase";

export interface ConciergeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConciergeSource {
  type: string;
  id: string;
  label: string;
  slug?: string;
}

export interface ConciergeReply {
  ok: boolean;
  configured: boolean;
  degraded: boolean;
  authenticated: boolean;
  reply: string;
  sources: ConciergeSource[];
  error?: string;
}

const ENDPOINT = "/api/ai-chat";
// The serverless function is capped at maxDuration = 30s, so the browser gives up
// just after it: the platform's own structured error is what reaches the user,
// and only a hung connection is caught here.
const REQUEST_TIMEOUT_MS = 34000;

// The browser never learns the provider key. It forwards only its own session
// token, and the server reads data under the same row-level security rules the
// signed-in user is subject to.
export async function askConcierge(history: ConciergeMessage[]): Promise<ConciergeReply> {
  const fallback: ConciergeReply = {
    ok: false,
    configured: false,
    degraded: true,
    authenticated: false,
    reply: "",
    sources: [],
  };

  let token: string | null = null;
  try {
    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token || null;
  } catch {
    token = null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages: history.slice(-12) }),
      signal: controller.signal,
    });

    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (res.status === 501) {
      return {
        ...fallback,
        configured: false,
        reply:
          payload?.reply ||
          "The concierge assistant is not enabled on this deployment yet. Our team can still help on WhatsApp or by email.",
      };
    }
    if (res.status === 429) {
      return { ...fallback, configured: true, error: payload?.error || "Please slow down and try again shortly." };
    }
    if (!res.ok) {
      return { ...fallback, configured: true, error: payload?.error || "The concierge is unavailable right now." };
    }

    return {
      ok: true,
      configured: true,
      degraded: Boolean(payload?.degraded),
      authenticated: Boolean(payload?.authenticated),
      reply: String(payload?.reply || ""),
      sources: Array.isArray(payload?.sources) ? payload.sources : [],
    };
  } catch (err: any) {
    return {
      ...fallback,
      error: err?.name === "AbortError" ? "The concierge took too long to respond." : "The concierge could not be reached.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export interface InsightsResult {
  ok: boolean;
  configured: boolean;
  insight: string | null;
  error?: string;
  generatedAt?: string;
}

export async function requestBusinessInsights(): Promise<InsightsResult> {
  let token: string | null = null;
  try {
    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token || null;
  } catch {
    token = null;
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ mode: "insights" }),
    });
    const payload = await res.json().catch(() => null);

    if (res.status === 501) return { ok: false, configured: false, insight: null };
    if (!res.ok) {
      return { ok: false, configured: true, insight: null, error: payload?.error || "Insights are unavailable." };
    }
    return {
      ok: true,
      configured: true,
      insight: payload?.insight || null,
      generatedAt: payload?.generatedAt,
    };
  } catch {
    return { ok: false, configured: true, insight: null, error: "Insights are unavailable right now." };
  }
}
