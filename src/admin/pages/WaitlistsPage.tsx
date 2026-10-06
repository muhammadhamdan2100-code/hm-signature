import { useCallback, useEffect, useState } from "react";
import { Loader2, Bell } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import { fetchWaitlists, notifyWaitlist, type WaitlistRow } from "../../services/brandAdmin";
import { AccessDeniedNote, rowClass } from "../components/Phase8Shared";

export function WaitlistsPage() {
  const { t, locale } = useI18n();
  const { showToast } = useAdminData();
  const canView = hasPermission(getCurrentStaff(), "waitlists.view");
  const canManage = hasPermission(getCurrentStaff(), "waitlists.manage");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [emailReady, setEmailReady] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchWaitlists();
      setRows(result.rows);
      if (result.error) showToast("error", result.error);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
    // Whether a notification can actually leave the building is a deployment fact, not a guess.
    fetch("/api/health")
      .then((response) => response.json())
      .then((body) => setEmailReady(Boolean(body?.capabilities?.email)))
      .catch(() => setEmailReady(null));
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-wider py-10">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        {t("admin.shared.loading")}
      </div>
    );
  }

  if (!canView) return <AccessDeniedNote>{t("admin.waitlists.denied")}</AccessDeniedNote>;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl">{t("admin.waitlists.title")}</h1>
        <p className="text-xs text-muted leading-relaxed max-w-2xl">{t("admin.waitlists.body")}</p>
      </header>

      {emailReady === false && (
        <p className="text-xs text-muted border border-gold/25 bg-navy2/40 rounded px-4 py-3 leading-relaxed">
          {t("admin.waitlists.noEmailNote")}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="text-xs text-muted border border-gold/20 rounded px-4 py-6 text-center leading-relaxed">
          {t("admin.waitlists.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className={rowClass}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs text-ivory truncate">{row.productName || t("admin.waitlists.item")}</p>
                  <p className="text-[11px] text-muted truncate">{row.email}</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted">
                    {[row.countryCode, row.currency].filter(Boolean).join(" · ")}
                    {" · "}
                    {new Date(row.createdAt).toLocaleDateString(locale)}
                    {row.notifiedAt ? ` · ${t("admin.waitlists.notifiedOn", { date: new Date(row.notifiedAt).toLocaleDateString(locale) })}` : ""}
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-gold border border-gold/25 px-2 py-1">{row.status}</span>
                {canManage && row.status === "Waiting" && (
                  <button
                    type="button"
                    disabled={busy === row.id}
                    onClick={async () => {
                      setBusy(row.id);
                      const result = await notifyWaitlist(row.id);
                      setBusy(null);
                      if (result.success) {
                        showToast("success", t("admin.waitlists.queued"));
                        await load();
                      } else {
                        showToast("error", result.error || t("admin.waitlists.failed"));
                      }
                    }}
                    className="btn-gold font-sans text-xs disabled:opacity-50 flex items-center gap-2"
                  >
                    <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                    {t("admin.waitlists.notifyCta")}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default WaitlistsPage;
