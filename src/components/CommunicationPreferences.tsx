import { useEffect, useState } from "react";
import {
  fetchCommunicationPreferences,
  saveMarketingConsent,
} from "../services/customerPreferences";
import { Mail, ShieldCheck } from "lucide-react";

/**
 * The customer's own marketing consent. This is the control behind the "manage your
 * email preferences" link in follow-up messages, and it is the only switch the
 * automation actually honours: promotional reminders are skipped in the database
 * whenever this is off.
 */
export default function CommunicationPreferences() {
  const [marketing, setMarketing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchCommunicationPreferences()
      .then((prefs) => {
        if (!mounted) return;
        setMarketing(prefs.marketingEmails);
        setLoaded(true);
      })
      .catch(() => {
        if (mounted) setLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    setBusy(true);
    setNotice(null);
    setError(null);
    const result = await saveMarketingConsent(marketing);
    setBusy(false);
    if (result.ok) {
      setNotice(
        marketing
          ? "Saved. A reminder may reach you if you leave a saved bag unpaid."
          : "Saved. Promotional reminders are turned off for this account."
      );
    } else {
      setError(result.error || "Your choice could not be saved. Please try again.");
    }
  };

  return (
    <section
      id="communication-preferences"
      aria-labelledby="communication-preferences-title"
      className="bg-navy2/90 border border-gold/30 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl backdrop-blur-md"
    >
      <div className="flex items-start space-x-2.5 border-b border-gold/20 pb-3">
        <Mail className="w-4 h-4 text-gold mt-0.5 shrink-0" />
        <div>
          <h3 id="communication-preferences-title" className="font-serif text-base font-bold text-ivory">
            Email preferences
          </h3>
          <p className="text-[11px] text-muted font-light leading-relaxed mt-0.5">
            Chosen by you and stored against your account.
          </p>
        </div>
      </div>

      <label className="flex items-start space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={marketing}
          disabled={!loaded || busy}
          onChange={(e) => {
            setMarketing(e.target.checked);
            setNotice(null);
          }}
          className="mt-0.5 w-4 h-4 accent-gold shrink-0 disabled:opacity-50"
        />
        <span className="text-xs text-ivory leading-relaxed">
          <span className="font-semibold">Promotional reminders</span>
          <span className="block text-muted font-light mt-0.5">
            A single reminder if you leave a saved bag unpaid for a while. Nothing is sent about
            promotions you have not asked for, and switching this off stops the reminder at once.
          </span>
        </span>
      </label>

      <p className="text-[11px] text-muted font-light leading-relaxed flex items-start space-x-2">
        <ShieldCheck className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
        <span>
          Order confirmations, payment receipts and delivery notices are part of your purchase and
          are not switched off here.
        </span>
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!loaded || busy}
          className="px-5 py-3 min-h-11 bg-gold hover:bg-goldLight text-navy font-bold rounded text-[11px] uppercase tracking-widest disabled:opacity-50 transition-colors"
        >
          {busy ? "SAVING…" : "Save preference"}
        </button>
        {!loaded && <span className="text-[11px] text-muted font-light">Loading your choice…</span>}
      </div>

      {notice && (
        <p role="status" aria-live="polite" className="text-[11px] text-emerald-300 font-sans">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="text-[11px] text-rose-300 font-sans">
          {error}
        </p>
      )}
    </section>
  );
}
