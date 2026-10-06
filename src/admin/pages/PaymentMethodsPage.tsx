import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Loader2, Plus, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import {
  deletePaymentMethod,
  listPaymentMethods,
  listPaymentProviders,
  previewCountryMethods,
  savePaymentMethod,
  setPaymentMethodStatus,
  type MethodStatus,
  type PaymentMethodRow,
  type PaymentProviderRow,
} from "../../services/paymentArchitecture";
import { fetchCountries } from "../../services/internationalConfig";
import { useI18n } from "../../i18n/I18nProvider";

// Super Admin control over the payment-method architecture. Two facts are kept visibly apart
// here: the status a Super Admin sets (intent) and the state a shopper sees, which also depends
// on whether this deployment holds the provider's credentials. The preview below calls the same
// endpoint checkout calls, so nothing on this screen can claim a rail is live that is not.

const STATUSES: MethodStatus[] = ["enabled", "configured", "coming_soon", "unavailable"];
const TYPES = ["card", "wallet", "bank_transfer", "cod", "bnpl", "qr", "instant", "cash"];
const ENVIRONMENTS = ["none", "test", "live"];

const emptyDraft = {
  code: "",
  providerCode: "stripe",
  type: "card",
  displayName: "",
  description: "",
  icon: "",
  countryCodes: [] as string[],
  currencyCodes: [] as string[],
  status: "coming_soon" as MethodStatus,
  environment: "none" as const,
  configurationReference: "",
  sortOrder: 500,
};

export function PaymentMethodsPage() {
  const { t } = useI18n();
  const { showToast } = useAdminData();
  const staff = getCurrentStaff();
  // The database enforces this too; the screen refuses first so nobody edits a field that
  // would be rejected.
  const canConfigure = hasPermission(staff, "payments.configure");

  const [methods, setMethods] = useState<PaymentMethodRow[]>([]);
  const [providers, setProviders] = useState<PaymentProviderRow[]>([]);
  const [countries, setCountries] = useState<{ code: string; name: string; currencyCode: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewCountry, setPreviewCountry] = useState("PK");
  const [preview, setPreview] = useState<{ code: string; name: string; state: string; canSubmit: boolean }[]>([]);
  const [previewBusy, setPreviewBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, providerRows, countryRows] = await Promise.all([
        listPaymentMethods(),
        listPaymentProviders(),
        fetchCountries(),
      ]);
      setMethods(rows);
      setProviders(providerRows);
      setCountries(countryRows.map((c: any) => ({ code: c.code, name: c.name, currencyCode: c.currencyCode })));
    } catch (error: any) {
      showToast("error", t("admin.payments.failedRow", { detail: error?.message || "" }));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPreviewBusy(true);
    const currency = countries.find((c) => c.code === previewCountry)?.currencyCode || "";
    previewCountryMethods(previewCountry, currency)
      .then(setPreview)
      .catch(() => setPreview([]))
      .finally(() => setPreviewBusy(false));
  }, [previewCountry, countries]);

  const currencyOptions = useMemo(() => {
    const set = new Set<string>();
    countries.forEach((c) => c.currencyCode && set.add(c.currencyCode));
    return [...set].sort();
  }, [countries]);

  const toggleListValue = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const startEdit = (row: PaymentMethodRow) => {
    setEditingCode(row.code);
    setDraft({
      code: row.code,
      providerCode: row.providerCode,
      type: row.type,
      displayName: row.displayName,
      description: row.description,
      icon: row.icon,
      countryCodes: row.countryCodes,
      currencyCodes: row.currencyCodes,
      status: row.status,
      environment: row.environment as any,
      configurationReference: row.configurationReference,
      sortOrder: row.sortOrder,
    });
  };

  const submit = async () => {
    if (!draft.code.trim() || !draft.displayName.trim()) {
      showToast("error", t("admin.payments.needCodeAndName"));
      return;
    }
    setSaving(true);
    const result = await savePaymentMethod({ ...draft, code: draft.code.trim(), displayName: draft.displayName.trim() });
    setSaving(false);
    if (!result.success) {
      showToast("error", t("admin.payments.failedRow", { detail: result.error || "" }));
      return;
    }
    showToast("success", t("admin.payments.savedRow"));
    setEditingCode(null);
    setDraft(emptyDraft);
    await load();
  };

  const changeStatus = async (code: string, status: MethodStatus) => {
    const result = await setPaymentMethodStatus(code, status);
    if (!result.success) {
      showToast("error", t("admin.payments.failedRow", { detail: result.error || "" }));
      return;
    }
    showToast("success", t("admin.payments.savedRow"));
    await load();
  };

  const remove = async (code: string) => {
    const result = await deletePaymentMethod(code);
    if (!result.success) {
      showToast("error", t("admin.payments.failedRow", { detail: result.error || "" }));
      return;
    }
    showToast("success", t("admin.payments.removedRow"));
    await load();
  };

  const providerName = (code: string) => providers.find((p) => p.code === code)?.displayName || code;
  const envVarsFor = (code: string) => providers.find((p) => p.code === code)?.credentialEnvVars || [];
  // Written as literals so every status label the interface can show is a key that exists.
  const statusLabel = (status: MethodStatus) =>
    status === "enabled"
      ? t("admin.payments.statusEnabled")
      : status === "configured"
      ? t("admin.payments.statusConfigured")
      : status === "coming_soon"
      ? t("admin.payments.statusComingSoon")
      : t("admin.payments.statusUnavailable");

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-gold">
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px] font-mono uppercase tracking-[3px]">{t("admin.payments.eyebrow")}</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-ivory">{t("admin.nav.paymentMethods")}</h1>
        <p className="text-xs text-muted leading-relaxed max-w-3xl">{t("admin.payments.subtitle")}</p>
        <p className="text-[11px] text-muted font-sans">
          {methods.length} {t("admin.payments.countLabel")}
        </p>
      </header>

      {!canConfigure && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-5 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-100 leading-relaxed">{t("admin.payments.roleOnly")}</p>
        </div>
      )}

      {/* Shopper preview: the same response the checkout reads, for one destination. */}
      <section className="rounded-xl border border-gold/25 bg-navy2 p-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-serif text-lg font-bold text-ivory">{t("admin.payments.preview")}</h2>
            <p className="text-[11px] text-muted">{t("admin.payments.previewHint")}</p>
          </div>
          <label className="block text-xs">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1 block">{t("admin.international.country")}</span>
            <select
              value={previewCountry}
              onChange={(e) => setPreviewCountry(e.target.value)}
              className="bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </label>
        </div>

        {previewBusy ? (
          <p className="flex items-center gap-2 text-xs text-muted">
            <Loader2 className="w-4 h-4 animate-spin" /> {t("admin.shared.loading")}
          </p>
        ) : preview.length === 0 ? (
          <p className="text-xs text-muted border border-gold/15 bg-navy/50 rounded-lg px-4 py-4 text-center">
            {t("admin.payments.previewEmpty")}
          </p>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 font-sans text-xs">
            {preview.map((m) => (
              <li key={m.code} className="flex items-center justify-between gap-3 border border-gold/15 bg-navy/60 rounded px-3 py-2">
                <span className="text-ivory truncate">{m.name}</span>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-wider ${
                    m.canSubmit
                      ? "border-emerald-500/40 text-emerald-300"
                      : "border-gold/40 text-gold"
                  }`}
                >
                  {m.state === "available"
                    ? t("admin.payments.stateAvailable")
                    : m.state === "not_configured"
                    ? t("admin.payments.stateNotConfigured")
                    : m.state === "coming_soon"
                    ? t("checkout.methodComingSoon")
                    : m.state === "disabled"
                    ? t("admin.staff.disabled")
                    : t("admin.payments.stateUnavailable")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canConfigure && (
        <section className="rounded-xl border border-gold/25 bg-navy2 p-6 space-y-5">
          <h2 className="font-serif text-lg font-bold text-ivory">
            {editingCode ? t("admin.payments.editing", { code: editingCode }) : t("admin.payments.newMethod")}
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 font-sans text-xs">
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.payments.code")}</span>
              <input
                value={draft.code}
                disabled={Boolean(editingCode)}
                onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                placeholder="stripe_gb"
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold disabled:opacity-60"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.international.name")}</span>
              <input
                value={draft.displayName}
                onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
                placeholder="Bank Card"
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.payments.provider")}</span>
              <select
                value={draft.providerCode}
                onChange={(e) => setDraft({ ...draft, providerCode: e.target.value })}
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              >
                {providers.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.payments.methodType")}</span>
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              >
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.shared.status")}</span>
              <select
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as MethodStatus })}
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
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.payments.credentials")}</span>
              <select
                value={draft.environment}
                onChange={(e) => setDraft({ ...draft, environment: e.target.value as any })}
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              >
                {ENVIRONMENTS.map((env) => (
                  <option key={env} value={env}>
                    {env === "none"
                      ? t("admin.payments.envNone")
                      : env === "test"
                      ? t("admin.payments.envTest")
                      : t("admin.payments.envLive")}
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
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.payments.iconRef")}</span>
              <input
                value={draft.icon}
                onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                placeholder="credit-card"
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.payments.configRef")}</span>
              <input
                value={draft.configurationReference}
                onChange={(e) => setDraft({ ...draft, configurationReference: e.target.value })}
                placeholder="STRIPE_PRICE_ID / plan code"
                className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
              />
            </label>
          </div>

          <label className="block space-y-1 font-sans text-xs">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.collections.description")}</span>
            <textarea
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-6 font-sans text-xs">
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.payments.countries")}</span>
              <div className="flex flex-wrap gap-2">
                {countries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDraft({ ...draft, countryCodes: toggleListValue(draft.countryCodes, c.code) })}
                    className={`px-2.5 py-1 rounded border text-[10px] font-mono uppercase tracking-wider transition-colors ${
                      draft.countryCodes.includes(c.code)
                        ? "border-gold bg-gold/15 text-gold"
                        : "border-gold/25 text-muted hover:border-gold/50"
                    }`}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.payments.currencies")}</span>
              <div className="flex flex-wrap gap-2">
                {currencyOptions.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setDraft({ ...draft, currencyCodes: toggleListValue(draft.currencyCodes, code) })}
                    className={`px-2.5 py-1 rounded border text-[10px] font-mono uppercase tracking-wider transition-colors ${
                      draft.currencyCodes.includes(code)
                        ? "border-gold bg-gold/15 text-gold"
                        : "border-gold/25 text-muted hover:border-gold/50"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted font-sans leading-relaxed">{t("admin.payments.noSecrets")}</p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="btn-gold-fill font-sans text-xs disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t("account.saveChanges")}
            </button>
            {editingCode && (
              <button
                type="button"
                onClick={() => {
                  setEditingCode(null);
                  setDraft(emptyDraft);
                }}
                className="btn-gold font-sans text-xs"
              >
                {t("common.cancel")}
              </button>
            )}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-gold/25 bg-navy2 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-lg font-bold text-ivory">{t("admin.payments.registry")}</h2>
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="text-start text-[10px] uppercase tracking-widest text-gold font-mono">
                  <th className="text-start py-2 pe-3">{t("admin.payments.method")}</th>
                  <th className="text-start py-2 pe-3">{t("admin.payments.provider")}</th>
                  <th className="text-start py-2 pe-3">{t("admin.payments.countries")}</th>
                  <th className="text-start py-2 pe-3">{t("admin.payments.currencies")}</th>
                  <th className="text-start py-2 pe-3">{t("admin.shared.status")}</th>
                  <th className="text-start py-2">{t("admin.staff.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((row) => (
                  <tr key={row.code} className="border-t border-gold/15 align-top">
                    <td className="py-3 pe-3">
                      <p className="text-ivory font-semibold">{row.displayName}</p>
                      <p className="text-[10px] text-muted font-mono">{row.code}</p>
                      <p className="text-[10px] text-muted mt-1 leading-relaxed">{row.description}</p>
                      {envVarsFor(row.providerCode).length > 0 && (
                        <p className="text-[10px] text-muted mt-1 font-mono">
                          {t("admin.payments.needsVars")} {envVarsFor(row.providerCode).join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pe-3 text-muted">{providerName(row.providerCode)}</td>
                    <td className="py-3 pe-3 text-muted font-mono">{row.countryCodes.join(" ")}</td>
                    <td className="py-3 pe-3 text-muted font-mono">{row.currencyCodes.join(" ")}</td>
                    <td className="py-3 pe-3">
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-wider ${
                          row.status === "enabled"
                            ? "border-emerald-500/40 text-emerald-300"
                            : row.status === "coming_soon"
                            ? "border-gold/40 text-gold"
                            : "border-gold/20 text-muted"
                        }`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="py-3">
                      {canConfigure ? (
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => changeStatus(row.code, "enabled")} className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 hover:text-emerald-200">
                            {t("admin.payments.markEnabled")}
                          </button>
                          <button type="button" onClick={() => changeStatus(row.code, "coming_soon")} className="text-[10px] font-mono uppercase tracking-wider text-gold hover:text-goldLight">
                            {t("admin.payments.markComingSoon")}
                          </button>
                          <button type="button" onClick={() => changeStatus(row.code, "unavailable")} className="text-[10px] font-mono uppercase tracking-wider text-muted hover:text-ivory">
                            {t("admin.payments.markUnavailable")}
                          </button>
                          <button type="button" onClick={() => startEdit(row)} className="text-[10px] font-mono uppercase tracking-wider text-ivory hover:text-gold">
                            {t("admin.categories.edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(row.code)}
                            className="text-[10px] font-mono uppercase tracking-wider text-rose-300 hover:text-rose-200 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> {t("admin.collections.delete")}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted font-mono">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default PaymentMethodsPage;
