import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import { fetchPreOrders, setPreOrderStatus, type PreOrderRow } from "../../services/brandAdmin";
import { AccessDeniedNote, rowClass } from "../components/Phase8Shared";

const STATUSES = ["Reserved", "Payment Pending", "Confirmed", "Released", "Fulfilled", "Cancelled"] as const;

export function PreOrdersPage() {
  const { t, locale } = useI18n();
  const { showToast } = useAdminData();
  const canView = hasPermission(getCurrentStaff(), "preorders.view");
  const canManage = hasPermission(getCurrentStaff(), "preorders.manage");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PreOrderRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchPreOrders();
      setRows(result.rows);
      if (result.error) showToast("error", result.error);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-wider py-10">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        {t("admin.shared.loading")}
      </div>
    );
  }

  if (!canView) return <AccessDeniedNote>{t("admin.preorders.denied")}</AccessDeniedNote>;

  const counts = STATUSES.reduce<Record<string, number>>((total, status) => {
    total[status] = rows.filter((row) => row.status === status).length;
    return total;
  }, {});

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl">{t("admin.preorders.title")}</h1>
        <p className="text-xs text-muted leading-relaxed max-w-2xl">{t("admin.preorders.body")}</p>
      </header>

      <section className="flex flex-wrap gap-3">
        {STATUSES.map((status) => (
          <div key={status} className="border border-gold/20 bg-navy2/50 rounded px-3 py-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted">{status}</p>
            <p className="text-lg font-serif text-gold">{counts[status] || 0}</p>
          </div>
        ))}
      </section>

      {rows.length === 0 ? (
        <p className="text-xs text-muted border border-gold/20 rounded px-4 py-6 text-center leading-relaxed">
          {t("admin.preorders.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className={rowClass}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs text-ivory truncate">
                    {row.productName ? (
                      <span>{row.productName}</span>
                    ) : (
                      t("admin.preorders.item")
                    )}
                    <span className="text-muted"> · {t("admin.preorders.quantity", { count: row.quantity })}</span>
                  </p>
                  <p className="text-[11px] text-muted truncate">{row.email}</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted">
                    {row.expectedReleaseOn
                      ? t("admin.preorders.due", { date: new Date(row.expectedReleaseOn).toLocaleDateString(locale) })
                      : t("admin.preorders.noDate")}
                  </p>
                </div>
                {canManage ? (
                  <select
                    aria-label={`${row.email} status`}
                    value={row.status}
                    disabled={busy === row.id}
                    onChange={async (event) => {
                      setBusy(row.id);
                      const result = await setPreOrderStatus(row.id, event.target.value);
                      setBusy(null);
                      if (result.success) {
                        showToast("success", t("admin.preorders.updated"));
                        await load();
                      } else {
                        showToast("error", result.error || t("admin.preorders.failed"));
                      }
                    }}
                    className="bg-navy border border-gold/25 rounded px-2 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gold">{row.status}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-muted leading-relaxed border-t border-gold/15 pt-4">{t("admin.preorders.fulfilNote")}</p>
      <Link to="/admin/orders" className="link-underline text-sm">{t("admin.preorders.ordersCta")}</Link>
    </div>
  );
}

export default PreOrdersPage;
