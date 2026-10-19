import { supabase } from "../lib/supabase";

/**
 * The rules behind signing in, resetting a password and offering a provider.
 *
 * Kept apart from the components so the security decisions can be tested without a browser, and
 * so a shopper is never told more than they should know: an unknown email and a known one must
 * produce the same words, and a provider the project has not configured must not appear at all.
 */

export type PasswordProblem = "tooShort" | "tooLong" | "needsLetter" | "needsNumber" | "tooCommon";

/** GoTrue's own floor is 6; the shop asks for more, and the dashboard must be set to match. */
export const MIN_PASSWORD_LENGTH = 8;
/** bcrypt truncates silently past 72 bytes, so a longer password is weaker, not stronger. */
export const MAX_PASSWORD_LENGTH = 72;

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "abc12345",
  "iloveyou",
  "welcome1",
  "letmein1",
  "monkey123",
  "football",
]);

export function passwordProblem(password: string): PasswordProblem | null {
  if (password.length < MIN_PASSWORD_LENGTH) return "tooShort";
  if (password.length > MAX_PASSWORD_LENGTH) return "tooLong";
  if (!/[A-Za-z]/.test(password)) return "needsLetter";
  if (!/[0-9]/.test(password)) return "needsNumber";
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return "tooCommon";
  return null;
}

/** GoTrue sends six digits; anything typed with spaces or dashes still counts. */
export const OTP_LENGTH = 6;

export function normalizeOtp(input: string): string | null {
  const digits = (input || "").replace(/[\s-]/g, "");
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(digits)) return null;
  return digits;
}

export type AuthProvider = { id: string; label: string; kind: "oauth" | "otp" };

/** Providers the project actually has credentials for. Nothing here can be guessed into existence. */
export function enabledProviders(settings: unknown): AuthProvider[] {
  const external = (settings as { external?: Record<string, { enabled?: boolean }> } | null)?.external;
  if (!external || typeof external !== "object") return [];
  const LABELS: Record<string, string> = {
    google: "Google",
    facebook: "Facebook",
    apple: "Apple",
    github: "GitHub",
  };
  const found: AuthProvider[] = [];
  if (external.phone?.enabled) found.push({ id: "phone", label: "Phone", kind: "otp" });
  for (const [id, config] of Object.entries(external)) {
    if (config?.enabled && LABELS[id]) found.push({ id, label: LABELS[id], kind: "oauth" });
  }
  return found;
}

/**
 * Ask GoTrue for a recovery code. A failure here is reported to the caller but the shopper is
 * still given the generic line, so the response cannot be used to probe accounts.
 */
export async function requestRecoveryCode(email: string): Promise<{ sent: boolean; error?: string }> {
  const address = (email || "").trim().toLowerCase();
  if (!address) return { sent: false, error: "invalid_email" };
  // The project's default template sends a link; the one with {{ .Token }} sends a code. Both are
  // asked for here, so the shopper can finish from whichever their email actually carries.
  const { error } = await supabase.auth.resetPasswordForEmail(address, {
    redirectTo: `${window.location.origin}/login?reset=1`,
  });
  if (error) return { sent: false, error: error.message };
  return { sent: true };
}

/** Exchange the typed code for a recovery session. Only then may a new password be written. */
export async function verifyRecoveryCode(
  email: string,
  code: string
): Promise<{ verified: boolean; error?: string }> {
  const otp = normalizeOtp(code);
  if (!otp) return { verified: false, error: "code_shape" };
  const { error } = await supabase.auth.verifyOtp({
    email: (email || "").trim().toLowerCase(),
    token: otp,
    type: "recovery",
  });
  if (error) return { verified: false, error: error.message };
  return { verified: true };
}

/**
 * Ask the auth server which providers this project has actually been given credentials for.
 * A button that leads to a provider Supabase has not configured would only produce an error page,
 * so the sign-in row is built from this answer and nothing else.
 */
export async function fetchEnabledProviders(): Promise<AuthProvider[]> {
  const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
    if (!res.ok) return [];
    return enabledProviders(await res.json());
  } catch {
    return [];
  }
}

/** E.164 is what GoTrue's SMS provider accepts; anything the shopper typed is normalised to it. */
export function normalizePhone(input: string): string | null {
  // Only the separators a person actually types are removed. Letters are not silently deleted —
  // "+92abc…" is a mistyped number, not a number with punctuation in it.
  const cleaned = (input || "").replace(/[\s()-]/g, "");
  return /^\+\d{8,15}$/.test(cleaned) ? cleaned : null;
}

/**
 * Ask for a sign-in code by text. Only useful once the project has an SMS provider — GoTrue
 * answers "Phone not allowed" until then, which is why the sign-in form does not offer it.
 */
export async function sendPhoneCode(phone: string): Promise<{ sent: boolean; error?: string }> {
  const number = normalizePhone(phone);
  if (!number) return { sent: false, error: "phone_shape" };
  const { error } = await supabase.auth.signInWithOtp({ phone: number });
  if (error) return { sent: false, error: error.message };
  return { sent: true };
}

export async function verifyPhoneCode(
  phone: string,
  code: string
): Promise<{ verified: boolean; error?: string }> {
  const number = normalizePhone(phone);
  const otp = normalizeOtp(code);
  if (!number || !otp) return { verified: false, error: "code_shape" };
  const { error } = await supabase.auth.verifyOtp({ phone: number, token: otp, type: "sms" });
  if (error) return { verified: false, error: error.message };
  return { verified: true };
}

/** Send the browser to the provider's own consent page, then back to /login. */
export async function startOAuth(provider: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOAuth({
    // supabase-js types the accepted providers; a project can enable one this build does not list.
    provider: provider as "google",
    options: { redirectTo: `${window.location.origin}/login` },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
