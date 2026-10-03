import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Shared harness for the Phase 3 data-rule suites.
 *
 * The project requires a confirmed email address before a signup may sign in, so
 * these suites run against two throwaway customer accounts supplied through the
 * environment (SUITE_A_* / SUITE_B_*, optionally SUITE_STAFF_* for the moderation
 * paths). Without them the suite reports that it skipped instead of pretending the
 * rule was checked. Every test removes the rows it creates.
 */

export type Env = { url: string; key: string };
export type Session = { token: string; id: string; email: string };

export function readSupabaseEnv(): Env | null {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    const pick = (name: string) =>
      (raw.match(new RegExp(`^${name}=\\s*(.+)$`, "m")) || [, ""])[1].trim();
    const url = pick("VITE_SUPABASE_URL");
    const key = pick("VITE_SUPABASE_PUBLISHABLE_KEY") || pick("VITE_SUPABASE_ANON_KEY");
    if (!url || !key) return null;
    return { url, key };
  } catch {
    return null;
  }
}

export async function login(env: Env, email: string, password: string): Promise<Session | null> {
  if (!email || !password) return null;
  const res = await fetch(`${env.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: env.key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = (await res.json().catch(() => null)) as
    | { access_token?: string; user?: { id?: string } }
    | null;
  if (!body?.access_token || !body.user?.id) return null;
  return { token: body.access_token, id: body.user.id, email };
}

export async function signUp(env: Env, email: string, password: string): Promise<Session | null> {
  const res = await fetch(`${env.url}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: env.key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = (await res.json().catch(() => null)) as
    | { access_token?: string; user?: { id?: string } }
    | null;
  const token = body?.access_token;
  const id = body?.user?.id;
  if (!token || !id) return null;
  return { token, id, email };
}

export type RestInit = { method?: string; body?: unknown; representation?: boolean; upsert?: boolean };

export async function rest(
  env: Env,
  token: string | null,
  path: string,
  init: RestInit = {}
): Promise<{ status: number; text: string; json: <T>() => T }> {
  const headers: Record<string, string> = {
    apikey: env.key,
    Authorization: `Bearer ${token ?? env.key}`,
    "Content-Type": "application/json",
  };
  const prefers: string[] = [];
  if (init.representation !== false) prefers.push("return=representation");
  if (init.upsert) prefers.push("resolution=merge-duplicates");
  if (prefers.length) headers.PREFER = prefers.join(",");
  const res = await fetch(`${env.url}/rest/v1/${path}`, {
    method: init.method || "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  return {
    status: res.status,
    text,
    json: <T,>() => (text ? (JSON.parse(text) as T) : ([] as unknown as T)),
  };
}

export async function rpc(
  env: Env,
  token: string | null,
  fn: string,
  payload: Record<string, unknown>
): Promise<{ status: number; text: string; json: <T>() => T }> {
  const res = await fetch(`${env.url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${token ?? env.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  return {
    status: res.status,
    text,
    json: <T,>() => (text ? (JSON.parse(text) as T) : ([] as unknown as T)),
  };
}

/** Reads the optional account credentials the suites need. */
export function suiteCredentials() {
  return {
    aEmail: process.env.SUITE_A_EMAIL || "",
    aPassword: process.env.SUITE_A_PASSWORD || "",
    bEmail: process.env.SUITE_B_EMAIL || "",
    bPassword: process.env.SUITE_B_PASSWORD || "",
    staffEmail: process.env.SUITE_STAFF_EMAIL || "",
    staffPassword: process.env.SUITE_STAFF_PASSWORD || "",
  };
}

export function reportSkip(why: string) {
  console.warn(`SUITE SKIPPED: ${why}`);
}
