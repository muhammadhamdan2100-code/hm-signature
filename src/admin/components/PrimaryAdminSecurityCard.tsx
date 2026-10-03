import React, { useCallback, useEffect, useState } from "react";
import { getCurrentStaff } from "../../services/auth";
import { isPrimaryAdmin } from "../../types/staff";
import {
  getLoginEmailState,
  isValidEmail,
  requestLoginEmailChange,
  type LoginEmailState,
} from "../../services/accountSecurity";
import { isSupabaseConfigured } from "../../lib/supabase";
import { KeyRound, ShieldCheck, MailCheck, AlertCircle } from "lucide-react";

/**
 * The primary Super Admin can move their own sign-in address. The credential is
 * changed through Supabase Auth — never by writing the profile row — so the existing
 * login keeps working until the emailed confirmation is used, and an interrupted or
 * mistyped change cannot lock the owner out.
 *
 * Only this one account sees the control; every other staff member's identity, role and
 * status remain read-only here.
 */
export const PrimaryAdminSecurityCard: React.FC = () => {
  const staff = getCurrentStaff();
  const isOwner = isPrimaryAdmin(staff ?? undefined);

  const [state, setState] = useState<LoginEmailState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "ok" | "pending" | "err"; text: string } | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const next = await getLoginEmailState();
    setState(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!isOwner) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const candidate = newEmail.trim().toLowerCase();
    if (!isValidEmail(candidate)) {
      setFeedback({ tone: "err", text: "Enter a complete email address before requesting the change." });
      return;
    }
    setBusy(true);
    setFeedback(null);
    const result = await requestLoginEmailChange(candidate);
    if (result.status === "error") {
      setFeedback({ tone: "err", text: result.message });
    } else {
      setFeedback({ tone: result.status === "applied" ? "ok" : "pending", text: result.message });
      setNewEmail("");
      await refresh();
    }
    setBusy(false);
  };

  return (
    <div className="p-5 rounded-lg bg-navy2/80 border border-gold/25 space-y-4">
      <div className="flex items-start justify-between gap-4 border-b border-gold/15 pb-3">
        <div className="flex items-start gap-2.5">
          <KeyRound className="w-4 h-4 text-gold mt-0.5 shrink-0" />
          <div>
            <h2 className="font-serif text-sm font-bold text-ivory">Primary Super Admin sign-in email</h2>
            <p className="text-[11px] text-muted font-light leading-relaxed mt-0.5 max-w-2xl">
              The Super Admin role itself is locked: it cannot be removed, downgraded or handed to
              another account from this dashboard. Only this address is yours to change.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-gold bg-gold/15 border border-gold/40 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
          <ShieldCheck className="w-3 h-3" /> Protected
        </span>
      </div>

      {!isSupabaseConfigured() ? (
        <p className="text-xs text-muted font-light">
          Supabase Auth is not connected in this environment, so the sign-in address cannot be changed
          here. Nothing else on this page is affected.
        </p>
      ) : loading ? (
        <p className="text-xs text-muted font-light">Loading account details…</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-3 rounded bg-navy border border-gold/15">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted block">
                Current sign-in address
              </span>
              <span className="text-xs font-mono text-ivory break-all block mt-1">
                {state?.currentEmail || staff?.email || "—"}
              </span>
              {state && !state.emailConfirmed && (
                <span className="text-[10px] text-amber-300 font-light block mt-1">
                  This address is not yet confirmed in Supabase Auth.
                </span>
              )}
            </div>
            <div className="p-3 rounded bg-navy border border-gold/15">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted block">
                Pending change
              </span>
              <span className="text-xs font-mono text-ivory break-all block mt-1">
                {state?.pendingEmail ? (
                  <>
                    <MailCheck className="w-3.5 h-3.5 text-gold inline-block mr-1 -mt-0.5" />
                    {state.pendingEmail} — awaiting confirmation
                  </>
                ) : (
                  "None"
                )}
              </span>
              {state?.pendingEmail && (
                <span className="text-[10px] text-muted font-light block mt-1">
                  Your current address still works until you confirm the link.
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-end gap-3">
            <label className="block flex-1 space-y-1.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-gold block">
                New sign-in address
              </span>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setFeedback(null);
                }}
                placeholder="owner@newdomain.com"
                autoComplete="email"
                className="w-full min-h-11 bg-navy border border-gold/30 rounded px-3 py-2 text-xs font-mono text-ivory focus:outline-none focus:border-gold"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !newEmail.trim()}
              className="min-h-11 px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs tracking-wider uppercase transition-colors disabled:opacity-40 shrink-0"
            >
              {busy ? "Sending…" : "Request email change"}
            </button>
          </form>

          {feedback && (
            <p
              role={feedback.tone === "err" ? "alert" : "status"}
              aria-live="polite"
              className={`text-[11px] font-sans flex items-start gap-2 ${
                feedback.tone === "err"
                  ? "text-rose-300"
                  : feedback.tone === "pending"
                  ? "text-gold"
                  : "text-emerald-300"
              }`}
            >
              {feedback.tone === "err" && <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
              <span>{feedback.text}</span>
            </p>
          )}

          <p className="text-[10px] text-muted font-light leading-relaxed">
            Supabase Auth sends a confirmation link before the address takes effect, so a mistyped or
            abandoned request cannot lock you out. Sign in with the new address once it is confirmed.
          </p>
        </>
      )}
    </div>
  );
};
