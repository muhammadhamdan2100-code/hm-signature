import { useCallback, useEffect, useMemo, useState } from "react";
import { Languages, Globe2, Coins, Pencil, RefreshCw } from "lucide-react";
import { DataTable, type Column } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import {
  fetchCountries,
  fetchCurrencies,
  fetchLanguages,
  saveCountryRule,
  saveCurrency,
  saveLanguage,
  type CountryDraft,
  type CountryRule,
} from "../../services/internationalConfig";
import type { CurrencyDef } from "../../lib/money";
import type { LanguageDef } from "../../services/internationalConfig";
import { useI18n } from "../../i18n/I18nProvider";

const numberOr = (value: string, fallback: number | null = null): number | null => {
  const trimmed = value.trim();
  if (trimmed === "") return fallback;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const textOr = (value: string): string | null => (value.trim() ? value.trim() : null);

export function InternationalPage() {
  const { t } = useI18n();
  const { showToast } = useAdminData();
  const canManage = hasPermission(getCurrentStaff(), "settings.manage");

  const [countries, setCountries] = useState<CountryRule[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyDef[]>([]);
  const [languages, setLanguages] = useState<LanguageDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [editingCountry, setEditingCountry] = useState<CountryRule | null>(null);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyDef | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<LanguageDef | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [countryRows, currencyRows, languageRows] = await Promise.all([
      fetchCountries(),
      fetchCurrencies(),
      fetchLanguages(),
    ]);
    setCountries(countryRows);
    setCurrencies(currencyRows);
    setLanguages(languageRows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const currencyCodes = useMemo(() => currencies.map((c) => c.code), [currencies]);

  const reload = async () => {
    await load();
  };

  const commitCountry = async (draft: CountryDraft) => {
    if (!editingCountry) return;
    if (draft.enabled && (draft.shippingFee === null || !draft.currencyCode)) {
      showToast("error", t("admin.international.setFeeAndCurrencyFirst"));
      return;
    }
    if (draft.taxEnabled && (draft.taxRate === null || draft.taxRate < 0 || draft.taxRate > 100)) {
      showToast("error", t("admin.international.taxRateRange"));
      return;
    }
    if (
      draft.deliveryDaysMin !== null &&
      draft.deliveryDaysMax !== null &&
      draft.deliveryDaysMax < draft.deliveryDaysMin
    ) {
      showToast("error", t("admin.international.maxWindowShorter"));
      return;
    }
    setBusy(true);
    const result = await saveCountryRule(editingCountry.code, draft);
    setBusy(false);
    if (!result.ok) {
      showToast("error", result.message);
      return;
    }
    showToast("success", t("admin.international.nameSaved", { name: editingCountry.name }));
    setEditingCountry(null);
    await reload();
  };

  const commitCurrency = async (draft: CurrencyDef) => {
    if (draft.rateToBase <= 0) {
      showToast("error", t("admin.international.rateAboveZero"));
      return;
    }
    setBusy(true);
    const result = await saveCurrency(draft);
    setBusy(false);
    if (!result.ok) {
      showToast("error", result.message);
      return;
    }
    showToast("success", t("admin.international.codeSaved", { code: draft.code }));
    setEditingCurrency(null);
    await reload();
  };

  const commitLanguage = async (draft: LanguageDef) => {
    setBusy(true);
    const result = await saveLanguage(draft);
    setBusy(false);
    if (!result.ok) {
      showToast("error", result.message);
      return;
    }
    showToast("success", t("admin.international.nameSaved", { name: draft.name }));
    setEditingLanguage(null);
    await reload();
  };

  const countryColumns: Column<CountryRule>[] = [
    { header: t("admin.international.code"), accessor: (row) => <span className="font-mono text-gold">{row.code}</span> },
    { header: t("admin.international.country"), accessor: (row) => <span className="text-ivory">{row.name}</span> },
    {
      header: t("admin.shared.status"),
      accessor: (row) =>
        row.enabled ? (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
            {t("admin.international.delivering")}
          </span>
        ) : (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-navy border border-gold/20 text-muted">
            {t("admin.international.closed")}
          </span>
        ),
    },
    { header: t("admin.international.currency"), accessor: (row) => <span className="font-mono text-xs">{row.currencyCode ?? "—"}</span> },
    {
      header: t("admin.international.fee"),
      accessor: (row) => (
        <span className="font-mono text-xs text-ivory">
          {row.shippingFee === null ? "—" : `${row.currencyCode ?? "PKR"} ${row.shippingFee.toLocaleString()}`}
        </span>
      ),
    },
    {
      header: t("admin.international.freeOver"),
      accessor: (row) => (
        <span className="font-mono text-xs text-muted">
          {row.freeShippingThreshold === null ? "—" : row.freeShippingThreshold.toLocaleString()}
        </span>
      ),
    },
    {
      header: t("admin.international.delivery"),
      accessor: (row) =>
        row.deliveryDaysMin === null && row.deliveryDaysMax === null ? (
          <span className="text-xs text-muted">—</span>
        ) : (
          <span className="text-xs text-ivory">
            {t("admin.international.daysRange", { min: row.deliveryDaysMin ?? "—", max: row.deliveryDaysMax ?? "—" })}
          </span>
        ),
    },
    {
      header: t("admin.international.tax"),
      accessor: (row) =>
        row.taxEnabled && row.taxRate ? (
          <span className="text-xs text-ivory font-mono">
            {row.taxRate}% {row.taxLabel ?? ""}
          </span>
        ) : (
          <span className="text-xs text-muted">{t("admin.international.none")}</span>
        ),
    },
    {
      header: "",
      accessor: (row) => (
        <button
          onClick={() => setEditingCountry(row)}
          disabled={!canManage}
          title={canManage ? t("admin.international.configureDestination") : t("admin.international.settingsAccessRequired")}
          className="p-1.5 rounded bg-navy2 border border-gold/25 hover:border-gold text-gold disabled:opacity-40"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      ),
      className: "text-end",
    },
  ];

  const currencyColumns: Column<CurrencyDef>[] = [
    { header: t("admin.international.code"), accessor: (row) => <span className="font-mono text-gold">{row.code}</span> },
    { header: t("admin.international.name"), accessor: (row) => <span className="text-ivory text-xs">{row.name}</span> },
    { header: t("admin.international.symbol"), accessor: (row) => <span className="font-mono text-xs">{row.symbol}</span> },
    {
      header: t("admin.international.minorUnits"),
      accessor: (row) => <span className="font-mono text-xs text-muted">{row.minorUnits}</span>,
    },
    {
      header: t("admin.international.rateToPkr"),
      accessor: (row) => (
        <span className="font-mono text-xs text-ivory">
          {row.isBase ? t("admin.international.baseRate") : t("admin.international.rateLine", { code: row.code, rate: row.rateToBase.toLocaleString() })}
        </span>
      ),
    },
    {
      header: t("admin.international.source"),
      accessor: (row) => (
        <span className="text-[10px] font-mono uppercase text-muted">
          {row.isBase ? "—" : row.rateSource}
          {row.rateUpdatedAt ? ` · ${row.rateUpdatedAt.slice(0, 10)}` : ""}
        </span>
      ),
    },
    {
      header: t("admin.shared.status"),
      accessor: (row) => (
        <span className={`text-xs ${row.enabled ? "text-emerald-300" : "text-muted"}`}>
          {row.enabled ? t("admin.international.shown") : t("admin.international.hidden")}
        </span>
      ),
    },
    {
      header: "",
      accessor: (row) => (
        <button
          onClick={() => setEditingCurrency(row)}
          disabled={!canManage}
          title={canManage ? t("admin.international.configureCurrency") : t("admin.international.settingsAccessRequired")}
          className="p-1.5 rounded bg-navy2 border border-gold/25 hover:border-gold text-gold disabled:opacity-40"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      ),
      className: "text-end",
    },
  ];

  const languageColumns: Column<LanguageDef>[] = [
    { header: t("admin.international.code"), accessor: (row) => <span className="font-mono text-gold">{row.code}</span> },
    { header: t("admin.international.language"), accessor: (row) => <span className="text-ivory text-xs">{row.name}</span> },
    { header: t("admin.international.native"), accessor: (row) => <span className="text-xs">{row.nativeName}</span> },
    {
      header: t("admin.international.direction"),
      accessor: (row) => <span className="font-mono text-xs text-muted uppercase">{row.direction}</span>,
    },
    { header: t("admin.international.locale"), accessor: (row) => <span className="font-mono text-xs text-muted">{row.locale}</span> },
    {
      header: t("admin.shared.status"),
      accessor: (row) => (
        <span className="text-xs text-ivory">
          {row.isDefault
            ? t("admin.international.defaultLabel")
            : row.enabled
              ? t("admin.international.available")
              : t("admin.international.hidden")}
        </span>
      ),
    },
    {
      header: "",
      accessor: (row) => (
        <button
          onClick={() => setEditingLanguage(row)}
          disabled={!canManage}
          title={canManage ? t("admin.international.configureLanguage") : t("admin.international.settingsAccessRequired")}
          className="p-1.5 rounded bg-navy2 border border-gold/25 hover:border-gold text-gold disabled:opacity-40"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      ),
      className: "text-end",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            {t("admin.international.eyebrow")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.international.title")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5 max-w-2xl">
            {t("admin.international.introBody")}
          </p>
        </div>
        <button
          onClick={reload}
          disabled={loading}
          className="px-4 py-2.5 bg-navy2 hover:bg-navy border border-gold/30 text-gold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center gap-2 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>{t("admin.international.reload")}</span>
        </button>
      </div>

      {!canManage && (
        <p className="text-xs text-muted border border-gold/20 bg-navy2/60 rounded-lg px-4 py-3">
          {t("admin.international.roleReadOnlyNote")}
        </p>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gold">
          <Globe2 className="w-4 h-4" />
          <h2 className="text-xs font-mono uppercase tracking-[2px]">{t("admin.international.destinationsHeading")}</h2>
        </div>
        <DataTable
          columns={countryColumns}
          data={countries}
          keyExtractor={(row) => row.code}
          emptyMessage={loading ? t("admin.international.loadingDestinations") : t("admin.international.noCountriesConfigured")}
          searchPlaceholder={t("admin.international.searchCountries")}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gold">
          <Coins className="w-4 h-4" />
          <h2 className="text-xs font-mono uppercase tracking-[2px]">{t("admin.international.currenciesHeading")}</h2>
        </div>
        <DataTable
          columns={currencyColumns}
          data={currencies}
          keyExtractor={(row) => row.code}
          emptyMessage={loading ? t("admin.international.loadingCurrencies") : t("admin.international.noCurrenciesConfigured")}
        />
        <p className="text-[11px] text-muted font-light leading-relaxed">
          {t("admin.international.ratesNotePrefix")} <span className="font-mono">manual</span>{" "}
          {t("admin.international.ratesNoteSuffix")}
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gold">
          <Languages className="w-4 h-4" />
          <h2 className="text-xs font-mono uppercase tracking-[2px]">{t("admin.international.languagesHeading")}</h2>
        </div>
        <DataTable
          columns={languageColumns}
          data={languages}
          keyExtractor={(row) => row.code}
          emptyMessage={loading ? t("admin.international.loadingLanguages") : t("admin.international.noLanguagesConfigured")}
        />
      </section>

      {editingCountry && (
        <CountryModal
          country={editingCountry}
          currencyCodes={currencyCodes}
          busy={busy}
          onClose={() => setEditingCountry(null)}
          onSave={commitCountry}
        />
      )}

      {editingCurrency && (
        <CurrencyModal currency={editingCurrency} busy={busy} onClose={() => setEditingCurrency(null)} onSave={commitCurrency} />
      )}

      {editingLanguage && (
        <LanguageModal language={editingLanguage} busy={busy} onClose={() => setEditingLanguage(null)} onSave={commitLanguage} />
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="block text-[10px] font-mono uppercase tracking-widest text-gold mb-1">{children}</span>;
}

const inputClass =
"w-full bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold font-sans";

function CountryModal({
  country,
  currencyCodes,
  busy,
  onClose,
  onSave,
}: {
  country: CountryRule;
  currencyCodes: string[];
  busy: boolean;
  onClose: () => void;
  onSave: (draft: CountryDraft) => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<CountryDraft>({
    enabled: country.enabled,
    currencyCode: country.currencyCode ?? "PKR",
    shippingFee: country.shippingFee,
    freeShippingThreshold: country.freeShippingThreshold,
    deliveryDaysMin: country.deliveryDaysMin,
    deliveryDaysMax: country.deliveryDaysMax,
    deliveryMethod: country.deliveryMethod ?? "",
    notes: country.notes ?? "",
    restrictions: country.restrictions ?? "",
    taxEnabled: country.taxEnabled,
    taxRate: country.taxRate,
    taxLabel: country.taxLabel ?? "",
  });

  const set = <K extends keyof CountryDraft>(key: K, value: CountryDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <Modal isOpen onClose={onClose} title={t("admin.international.deliveryTo", { name: country.name })} subtitle={t("admin.international.countryCode", { code: country.code })} maxWidth="lg">
      <div className="space-y-4 font-sans text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => set("enabled", e.target.checked)}
            className="w-4 h-4 accent-[#c9a961]"
          />
          <span className="text-ivory">{t("admin.international.deliverToThisCountry")}</span>
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>{t("admin.international.currency")}</Label>
            <select className={inputClass} value={draft.currencyCode ?? ""} onChange={(e) => set("currencyCode", e.target.value || null)}>
              <option value="">—</option>
              {currencyCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>{t("admin.international.shippingFeeBase")}</Label>
            <input
              className={inputClass}
              inputMode="decimal"
              value={draft.shippingFee ?? ""}
              onChange={(e) => set("shippingFee", numberOr(e.target.value))}
              placeholder={t("admin.international.exampleFee")}
            />
          </div>
          <div>
            <Label>{t("admin.international.freeShippingOver")}</Label>
            <input
              className={inputClass}
              inputMode="decimal"
              value={draft.freeShippingThreshold ?? ""}
              onChange={(e) => set("freeShippingThreshold", numberOr(e.target.value))}
              placeholder={t("common.optional")}
            />
          </div>
          <div>
            <Label>{t("admin.international.deliveryMethod")}</Label>
            <input
              className={inputClass}
              value={draft.deliveryMethod ?? ""}
              onChange={(e) => set("deliveryMethod", textOr(e.target.value))}
              placeholder={t("admin.international.deliveryMethodExample")}
            />
          </div>
          <div>
            <Label>{t("admin.international.minimumDays")}</Label>
            <input
              className={inputClass}
              inputMode="numeric"
              value={draft.deliveryDaysMin ?? ""}
              onChange={(e) => set("deliveryDaysMin", numberOr(e.target.value))}
            />
          </div>
          <div>
            <Label>{t("admin.international.maximumDays")}</Label>
            <input
              className={inputClass}
              inputMode="numeric"
              value={draft.deliveryDaysMax ?? ""}
              onChange={(e) => set("deliveryDaysMax", numberOr(e.target.value))}
            />
          </div>
        </div>

        <div className="border-t border-gold/15 pt-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.taxEnabled}
              onChange={(e) => set("taxEnabled", e.target.checked)}
              className="w-4 h-4 accent-[#c9a961]"
            />
            <span className="text-ivory">{t("admin.international.chargeTaxOnDestination")}</span>
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>{t("admin.international.taxRatePercentage")}</Label>
              <input
                className={inputClass}
                inputMode="decimal"
                value={draft.taxRate ?? ""}
                onChange={(e) => set("taxRate", numberOr(e.target.value, 0))}
                placeholder="0"
              />
            </div>
            <div>
              <Label>{t("admin.international.taxLabel")}</Label>
              <input
                className={inputClass}
                value={draft.taxLabel ?? ""}
                onChange={(e) => set("taxLabel", textOr(e.target.value))}
                placeholder={t("admin.international.taxLabelExample")}
              />
            </div>
          </div>
          <p className="text-[10px] text-muted font-light leading-relaxed">
            {t("admin.international.taxConfigNote")}
          </p>
        </div>

        <div className="space-y-3 border-t border-gold/15 pt-4">
          <div>
            <Label>{t("admin.international.notesShownAtCheckout")}</Label>
            <textarea className={inputClass} rows={2} value={draft.notes ?? ""} onChange={(e) => set("notes", textOr(e.target.value))} />
          </div>
          <div>
            <Label>{t("admin.international.restrictions")}</Label>
            <textarea
              className={inputClass}
              rows={2}
              value={draft.restrictions ?? ""}
              onChange={(e) => set("restrictions", textOr(e.target.value))}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gold/30 rounded text-ivory hover:border-gold text-xs uppercase tracking-wider"
          >
            {t("admin.modal.cancel")}
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={busy}
            className="flex-1 px-4 py-2.5 bg-gold hover:bg-goldLight text-navy rounded text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
          >
            {busy ? t("admin.international.saving") : t("admin.international.saveDestination")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CurrencyModal({
  currency,
  busy,
  onClose,
  onSave,
}: {
  currency: CurrencyDef;
  busy: boolean;
  onClose: () => void;
  onSave: (draft: CurrencyDef) => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<CurrencyDef>(currency);

  return (
    <Modal isOpen onClose={onClose} title={t("admin.international.currencyTitle", { code: currency.code })} subtitle={currency.isBase ? t("admin.international.baseCurrency") : t("admin.international.displayCurrency")} maxWidth="md">
      <div className="space-y-4 font-sans text-xs">
        <div>
          <Label>{t("admin.international.name")}</Label>
          <input className={inputClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div>
          <Label>{t("admin.international.symbol")}</Label>
          <input className={inputClass} value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>{t("admin.international.minorUnitsHint")}</Label>
            <input
              className={inputClass}
              inputMode="numeric"
              value={draft.minorUnits}
              onChange={(e) => setDraft({ ...draft, minorUnits: Math.trunc(Number(e.target.value) || 0) })}
            />
          </div>
          <div>
            <Label>{t("admin.international.sortOrder")}</Label>
            <input
              className={inputClass}
              inputMode="numeric"
              value={draft.sortOrder}
              onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div>
          <Label>{t("admin.international.pkrPerUnit")}</Label>
          <input
            className={inputClass}
            inputMode="decimal"
            disabled={draft.isBase}
            value={draft.rateToBase}
            onChange={(e) => setDraft({ ...draft, rateToBase: Number(e.target.value) || 0 })}
          />
          {draft.isBase && (
            <p className="text-[10px] text-muted mt-1">{t("admin.international.baseCurrencyNote")}</p>
          )}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.enabled}
            disabled={draft.isBase}
            onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
            className="w-4 h-4 accent-[#c9a961]"
          />
          <span className="text-ivory">{t("admin.international.offerCurrency")}</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gold/30 rounded text-ivory hover:border-gold text-xs uppercase tracking-wider">
            {t("admin.modal.cancel")}
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={busy}
            className="flex-1 px-4 py-2.5 bg-gold hover:bg-goldLight text-navy rounded text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
          >
            {busy ? t("admin.international.saving") : t("admin.international.saveCurrency")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function LanguageModal({
  language,
  busy,
  onClose,
  onSave,
}: {
  language: LanguageDef;
  busy: boolean;
  onClose: () => void;
  onSave: (draft: LanguageDef) => void;
}) {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState(language.enabled);
  const [isDefault, setIsDefault] = useState(language.isDefault);

  return (
    <Modal isOpen onClose={onClose} title={t("admin.international.languageTitle", { code: language.code.toUpperCase() })} subtitle={language.nativeName} maxWidth="sm">
      <div className="space-y-4 font-sans text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4 accent-[#c9a961]" />
          <span className="text-ivory">{t("admin.international.offerLanguage")}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            disabled={!enabled}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 accent-[#c9a961]"
          />
          <span className="text-ivory">{t("admin.international.defaultLanguage")}</span>
        </label>
        <p className="text-[10px] text-muted font-light leading-relaxed">
          {t("admin.international.languageNote")}
        </p>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gold/30 rounded text-ivory hover:border-gold text-xs uppercase tracking-wider">
            {t("admin.modal.cancel")}
          </button>
          <button
            onClick={() => onSave({ ...language, enabled, isDefault })}
            disabled={busy}
            className="flex-1 px-4 py-2.5 bg-gold hover:bg-goldLight text-navy rounded text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
          >
            {busy ? t("admin.international.saving") : t("admin.international.saveLanguage")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default InternationalPage;
