// Account security for the signed-in user — currently the primary Super Admin's
// login email. The credential itself lives in Supabase Auth; `profiles.email` is only
// a copy kept in step with it, so a change is complete when Auth says so, never when
// the profile row is written.
import { supabase } from "../lib/supabase";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

export type LoginEmailState = {
  currentEmail: string;
  /** Set while the confirmation link for a requested change is still outstanding. */
  pendingEmail: string | null;
  emailConfirmed: boolean;
};

export type EmailChangeResult =
  | { status: "pending"; message: string }
  | { status: "applied"; message: string }
  | { status: "error"; message: string };

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim().toLowerCase());
}

export async function getLoginEmailState(): Promise<LoginEmailState | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) return null;
  return {
    currentEmail: user.email.toLowerCase(),
    pendingEmail: user.new_email ? user.new_email.toLowerCase() : null,
    emailConfirmed: Boolean(user.email_confirmed_at),
  };
}

/**
 * Asks Supabase Auth to move the signed-in account to a new login email.
 *
 * With email confirmation enabled — the project's current setting — Auth keeps the old
 * address working until the change is confirmed, and with Secure Email Change on
 * (Auth default) both addresses receive a link. That is what keeps the account
 * recoverable: an interrupted or mistyped change leaves the existing login intact.
 */
export async function requestLoginEmailChange(newEmail: string): Promise<EmailChangeResult> {
  const candidate = newEmail.trim().toLowerCase();

  if (!isValidEmail(candidate)) {
    return { status: "error", message: "Enter a complete email address, for example name@domain.com." };
  }

  const before = await getLoginEmailState();
  if (!before) {
    return { status: "error", message: "Your session has ended. Sign in again to change the account email." };
  }
  if (candidate === before.currentEmail) {
    return { status: "error", message: "That is already the sign-in address for this account." };
  }

  const { data, error } = await supabase.auth.updateUser({ email: candidate });

  if (error) {
    const message = String(error.message || "");
    const code = String((error as { code?: string }).code || "");

    if (code === "email_taken" || /already (been )?(registered|in use|taken)/i.test(message)) {
      return { status: "error", message: "That email address is already registered to another account." };
    }
    if (/security purposes|recently|re-?login|session/i.test(message)) {
      return {
        status: "error",
        message:
          "Supabase Auth requires a recent sign-in before the email can change. Please sign out, sign back in, and try again.",
      };
    }
    return { status: "error", message: message || "The email change could not be requested." };
  }

  const updated = data.user;
  const appliedNow = updated?.email?.toLowerCase() === candidate && !updated?.new_email;

  if (appliedNow) {
    // Confirmation is switched off for this project: the credential changed outright.
    await syncProfileEmailFromAuth();
    return { status: "applied", message: "Your sign-in email has been updated. Use the new address next time you sign in." };
  }

  return {
    status: "pending",
    message:
      `A confirmation link was sent to ${candidate}` +
      (/^[^@]+@[^@]+$/.test(before.currentEmail) ? ` and to ${before.currentEmail}.` : "."),
  };
}

/**
 * Mirrors the authenticated email into profiles.email, which several screens display.
 * Only the owner's own row is ever touched, and only the email column: the database
 * guard keeps role, status and the primary-admin flag locked regardless of what this
 * client asks for.
 */
export async function syncProfileEmailFromAuth(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.id || !user.email) return false;

  const authEmail = user.email.toLowerCase();
  const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).maybeSingle();
  if (!profile) return false;
  if (String(profile.email || "").toLowerCase() === authEmail) return false;

  const { error } = await supabase
    .from("profiles")
    .update({ email: authEmail, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  return !error;
}
