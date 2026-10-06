import { useEffect, useState } from "react";
import {
  fetchCommunicationPreferences,
  saveMarketingConsent,
} from "../services/customerPreferences";
import { useI18n } from "../i18n/I18nProvider";
import { Mail, ShieldCheck } from "lucide-react";

/**
 * The customer's own marketing consent. This is the control behind the "manage your
 * email preferences" link in follow-up messages, and it is the only switch the
 * automation actually honours: promotional reminders are skipped in the database
 * whenever this is off.
 */
export default function CommunicationPreferences() {
  const { t } = useI18n();
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
          ? t("account.prefSavedMarketing")
          : t("account.prefSavedOff")
      );
    } else {
      setError(result.error || t("account.prefSaveFailed"));
    }
  };

  return (
    <section
      id="communication-preferences"
      aria-labelledby="communication-preferences-title"
      className="bg-navy2/90 border border-gold/30 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl backdrop-blur-md"
    >
      <div className="flex items-start gap-2.5 border-b border-gold/20 pb-3">
        <Mail className="w-4 h-4 text-gold mt-0.5 shrink-0" />
        <div>
          <h3 id="communication-preferences-title" className="font-serif text-base font-bold text-ivory">
            {t("account.emailPreferences")}
          </h3>
          <p className="text-[11px] text-muted font-light leading-relaxed mt-0.5">
            {t("account.emailPreferencesHint")}
          </p>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
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
          <span className="font-semibold">{t("account.promotionalReminders")}</span>
          <span className="block text-muted font-light mt-0.5">
            {t("account.promotionalRemindersBody")}
          </span>
        </span>
      </label>

      <p className="text-[11px] text-muted font-light leading-relaxed flex items-start gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
        <span>
          {t("account.transactionalEmailsBody")}
        </span>
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!loaded || busy}
          className="px-5 py-3 min-h-11 bg-gold hover:bg-goldLight text-navy font-bold rounded text-[11px] uppercase tracking-widest disabled:opacity-50 transition-colors"
        >
          {busy ? t("account.savingUpper") : t("account.savePreference")}
        </button>
        {!loaded && <span className="text-[11px] text-muted font-light">{t("account.loadingChoice")}</span>}
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
