import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import { deleteBoutique, listBoutiques, saveBoutique, type BoutiqueRow } from "../../services/paymentArchitecture";
import { fetchCountries } from "../../services/internationalConfig";
import { useI18n } from "../../i18n/I18nProvider";

// Physical boutique locations. The table is deliberately seeded empty: an address can only come
// from the business, so this screen exists to record real ones and nothing else.

const STATUSES = ["coming_soon", "live", "closed"] as const;
type BoutiqueStatus = (typeof STATUSES)[number];

const emptyDraft = {
  id: null as string | null,
  name: "",
  countryCode: "PK",
  city: "",
  address: "",
  phone: "",
  openingHours: "",
  mapsUrl: "",
  status: "coming_soon" as BoutiqueStatus,
  isEnabled: true,
  sortOrder: 100,
};

export function BoutiquesPage() {
  const { t } = useI18n();
  const { showToast } = useAdminData();
  const canManage = hasPermission(getCurrentStaff(), "boutiques.manage");

  const [rows, setRows] = useState<BoutiqueRow[]>([]);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [boutiques, countryRows] = await Promise.all([listBoutiques(), fetchCountries()]);
      setRows(boutiques);
      setCountries(countryRows.map((c: any) => ({ code: c.code, name: c.name })));
    } catch (error: any) {
      showToast("error", t("admin.boutiques.failedRow", { detail: error?.message || "" }));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const countryName = (code: string) => countries.find((c) => c.code === code)?.name || code;

  const statusLabel = (status: string) =>
    status === "live"
      ? t("admin.boutiques.statusLive")
      : status === "closed"
      ? t("admin.boutiques.statusClosed")
      : t("checkout.methodComingSoon");

  const submit = async () => {
    if (!draft.name.trim() || !draft.city.trim()) {
      showToast("error", t("admin.boutiques.needNameAndCity"));
      return;
    }
    setSaving(true);
    const result = await saveBoutique({ ...draft, name: draft.name.trim(), city: draft.city.trim() });
    setSaving(false);
    if (!result.success) {
      showToast("error", t("admin.boutiques.failedRow", { detail: result.error || "" }));
      return;
    }
    showToast("success", t("admin.boutiques.savedRow"));
    setDraft(emptyDraft);
    await load();
  };

  const remove = async (id: string) => {
    const result = await deleteBoutique(id);
    if (!result.success) {
      showToast("error", t("admin.boutiques.failedRow", { detail: result.error || "" }));
      return;
    }
    showToast("success", t("admin.boutiques.removedRow"));
    await load();
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-gold">
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] font-mono uppercase tracking-[3px]">{t("admin.boutiques.eyebrow")}</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-ivory">{t("admin.nav.boutiques")}</h1>
        <p className="text-xs text-muted leading-relaxed max-w-3xl">{t("admin.boutiques.subtitle")}</p>
      </header>

      {!canManage && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-5 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-100 leading-relaxed">{t("admin.boutiques.roleOnly")}</p>
        </div>
      )}

      {canManage && (
        <section className="rounded-xl border border-gold/25 bg-navy2 p-6 space-y-5">
          <h2 className="font-serif text-lg font-bold text-ivory">
            {draft.id ? t("admin.boutiques.editing", { name: draft.name }) : t("admin.boutiques.newBoutique")}
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 font-sans text-xs">
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.international.name")}</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="HM Signature Boutique"
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.international.country")}</span>
              <select
                value={draft.countryCode}
                onChange={(e) => setDraft({ ...draft, countryCode: e.target.value })}
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("checkout.city")}</span>
              <input
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.boutiques.address")}</span>
              <input
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.customers.phone")}</span>
              <input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.boutiques.openingHours")}</span>
              <input
                value={draft.openingHours}
                onChange={(e) => setDraft({ ...draft, openingHours: e.target.value })}
                placeholder="11:00 – 20:00"
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.boutiques.mapsUrl")}</span>
              <input
                value={draft.mapsUrl}
                onChange={(e) => setDraft({ ...draft, mapsUrl: e.target.value })}
                placeholder="https://maps.google.com/?q=…"
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.shared.status")}</span>
              <select
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as BoutiqueStatus })}
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.international.sortOrder")}</span>
              <input
                type="number"
                value={draft.sortOrder}
                onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              />
            </label>
            <label className="flex items-center gap-3 self-end pb-1">
              <input
                type="checkbox"
                checked={draft.isEnabled}
                onChange={(e) => setDraft({ ...draft, isEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#c9a961]"
              />
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.staff.enabled")}</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="btn-gold-fill font-sans text-xs disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("account.saveChanges")}
            </button>
            {draft.id && (
              <button type="button" onClick={() => setDraft(emptyDraft)} className="btn-gold font-sans text-xs">
                {t("common.cancel")}
              </button>
            )}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-gold/25 bg-navy2 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-lg font-bold text-ivory">{t("admin.boutiques.registry")}</h2>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-gold hover:text-goldLight"
          >
            <RefreshCw className="w-4 h-4" /> {t("admin.payments.reload")}
          </button>
        </div>

        {loading ? (
          <p className="flex items-center gap-2 text-xs text-muted">
            <Loader2 className="w-4 h-4 animate-spin" /> {t("admin.shared.loading")}
          </p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted border border-gold/15 bg-navy/50 rounded-lg px-4 py-6 text-center leading-relaxed">
            {t("admin.boutiques.empty")}
          </p>
        ) : (
          <div className="space-y-3 font-sans text-xs">
            {rows.map((row) => (
              <div key={row.id} className="border border-gold/15 bg-navy/50 rounded-lg p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-ivory font-serif font-bold">{row.name}</p>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-full border border-gold/40 text-[9px] font-mono uppercase tracking-wider text-gold">
                      {statusLabel(row.status)}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
                      {row.isEnabled ? t("admin.staff.enabled") : t("admin.staff.disabled")}
                    </span>
                    {canManage && (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              id: row.id,
                              name: row.name,
                              countryCode: row.countryCode,
                              city: row.city,
                              address: row.address,
                              phone: row.phone,
                              openingHours: row.openingHours,
                              mapsUrl: row.mapsUrl,
                              status: row.status as BoutiqueStatus,
                              isEnabled: row.isEnabled,
                              sortOrder: row.sortOrder,
                            })
                          }
                          className="text-[10px] font-mono uppercase tracking-wider text-ivory hover:text-gold"
                        >
                          {t("admin.categories.edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(row.id)}
                          className="text-[10px] font-mono uppercase tracking-wider text-rose-300 hover:text-rose-200 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> {t("admin.collections.delete")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-muted">
                  {row.city} · {countryName(row.countryCode)}
                </p>
                {row.address && <p className="text-muted leading-relaxed">{row.address}</p>}
                {row.phone && <p className="text-muted font-mono">{row.phone}</p>}
                {row.openingHours && <p className="text-muted">{row.openingHours}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default BoutiquesPage;
