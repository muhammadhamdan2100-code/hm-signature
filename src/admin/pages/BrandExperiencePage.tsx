import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import {
  fetchGiftFinderConfig,
  fetchGiftCardConfig,
  fetchPersonalizationConfig,
  fetchRecommendationRules,
  saveGiftCardConfig,
  saveGiftFinderConfig,
  savePersonalizationConfig,
  saveProductEdition,
  saveRecommendationRule,
  setProductPreOrder,
  type RecommendationRule,
} from "../../services/brandAdmin";
import { getCatalogProducts } from "../../services/catalog";
import { AccessDeniedNote, AdminField, cardClass, inputClass, rowClass } from "../components/Phase8Shared";
import type { Product } from "../../data/products";

const RAIL_KEYS = [
  "recommendedForYou",
  "youMayAlsoLike",
  "becauseYouViewed",
  "similarFragrances",
  "completeYourCollection",
  "frequentlyPaired",
] as const;

/** Literal keys only — the parity test can only see a rail label it can read verbatim. */
const RAIL_LABEL_KEYS: Record<(typeof RAIL_KEYS)[number], string> = {
  recommendedForYou: "admin.brand.railRecommended",
  youMayAlsoLike: "admin.brand.railAlsoLike",
  becauseYouViewed: "admin.brand.railBecauseViewed",
  similarFragrances: "admin.brand.railSimilar",
  completeYourCollection: "admin.brand.railCompleteCollection",
  frequentlyPaired: "admin.brand.railFrequentlyPaired",
};

const FINDER_LIST_KEYS: Record<string, string> = {
  recipients: "admin.brand.recipients",
  relationships: "admin.brand.relationships",
  occasions: "admin.brand.occasions",
  budgetBands: "admin.brand.budgetBands",
};

const csv = (value: string) =>
  value.split(",").map((part) => part.trim().toLowerCase()).filter(Boolean).slice(0, 20);

export function BrandExperiencePage() {
  const { t } = useI18n();
  const { showToast } = useAdminData();
  const canConfigure = hasPermission(getCurrentStaff(), "personalization.manage");

  const [loading, setLoading] = useState(true);
  const [personalization, setPersonalization] = useState<Record<string, unknown>>({});
  const [giftFinder, setGiftFinder] = useState<Record<string, unknown>>({});
  const [giftCards, setGiftCards] = useState<Record<string, unknown>>({});
  const [rules, setRules] = useState<RecommendationRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [finderLists, setFinderLists] = useState({ recipients: "", relationships: "", occasions: "", budgetBands: "" });
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pc, gf, gc, rr, catalogue] = await Promise.all([
        fetchPersonalizationConfig(),
        fetchGiftFinderConfig(),
        fetchGiftCardConfig(),
        fetchRecommendationRules(),
        getCatalogProducts(),
      ]);
      setPersonalization(pc);
      setGiftFinder(gf);
      setGiftCards(gc);
      setRules(rr.rules);
      setProducts(catalogue || []);
      if (rr.error) showToast("error", rr.error);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const rails = useMemo(() => {
    const raw = (personalization.rails || {}) as Record<string, unknown>;
    return RAIL_KEYS.map((key) => ({ key, on: raw[key] !== false }));
  }, [personalization.rails]);

  const runSave = async (id: string, action: () => Promise<{ success: boolean; error?: string }>, okKey: string) => {
    setSaving(id);
    const result = await action();
    setSaving(null);
    if (result.success) {
      showToast("success", t(okKey));
      await load();
    } else {
      showToast("error", result.error || t("admin.brand.failed"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-wider py-10">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        {t("admin.shared.loading")}
      </div>
    );
  }

  if (!canConfigure) {
    return (
      <AccessDeniedNote>
        {t("admin.brand.denied")}
      </AccessDeniedNote>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl">{t("admin.brand.title")}</h1>
        <p className="text-xs text-muted leading-relaxed max-w-2xl">{t("admin.brand.body")}</p>
      </header>

      {/* Personalisation */}
      <section className={cardClass}>
        <h2 className="font-serif text-lg">{t("admin.brand.personalisation")}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <AdminField label={t("admin.brand.enabled")} htmlFor="pc-enabled">
            <select
              id="pc-enabled"
              value={personalization.enabled === false ? "off" : "on"}
              onChange={(event) => setPersonalization({ ...personalization, enabled: event.target.value === "on" })}
              className={inputClass}
            >
              <option value="on">{t("admin.common.on")}</option>
              <option value="off">{t("admin.common.off")}</option>
            </select>
          </AdminField>
          <AdminField label={t("admin.brand.perRail")} htmlFor="pc-per-rail">
            <input
              id="pc-per-rail"
              type="number"
              min="1"
              max="8"
              value={Number(personalization.resultsPerRail ?? 4)}
              onChange={(event) => setPersonalization({ ...personalization, resultsPerRail: Number(event.target.value) })}
              className={inputClass}
            />
          </AdminField>
          <AdminField label={t("admin.brand.historyDays")} htmlFor="pc-history">
            <input
              id="pc-history"
              type="number"
              min="1"
              max="365"
              value={Number(personalization.viewHistoryDays ?? 90)}
              onChange={(event) => setPersonalization({ ...personalization, viewHistoryDays: Number(event.target.value) })}
              className={inputClass}
            />
          </AdminField>
        </div>

        <div className="flex flex-wrap gap-3">
          {rails.map((rail) => (
            <label key={rail.key} className="flex items-center gap-2 text-xs text-muted border border-gold/20 rounded px-3 py-2">
              <input
                type="checkbox"
                checked={rail.on}
                onChange={(event) =>
                  setPersonalization({
                    ...personalization,
                    rails: { ...(personalization.rails as object), [rail.key]: event.target.checked },
                  })
                }
                className="accent-gold"
              />
              {t(RAIL_LABEL_KEYS[rail.key])}
            </label>
          ))}
        </div>

        <button
          type="button"
          disabled={saving === "pc"}
          onClick={() =>
            void runSave("pc", () => savePersonalizationConfig(personalization), "admin.brand.saved")
          }
          className="btn-gold-fill font-sans text-xs disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          {t("admin.brand.savePersonalisation")}
        </button>
      </section>

      {/* Recommendation weights */}
      <section className={cardClass}>
        <h2 className="font-serif text-lg">{t("admin.brand.recommendations")}</h2>
        <p className="text-xs text-muted leading-relaxed">{t("admin.brand.recommendationsBody")}</p>
        <ul className="space-y-3">
          {rules.map((rule) => (
            <li key={rule.signal} className={`${rowClass} flex flex-wrap items-center gap-4`}>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ivory">{rule.label}</p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted">{rule.signal}</p>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                aria-label={`${rule.label} weight`}
                defaultValue={rule.weight}
                onBlur={(event) => {
                  const next = Number(event.target.value);
                  if (!Number.isFinite(next) || next === rule.weight) return;
                  void runSave(`rule-${rule.signal}`, () => saveRecommendationRule(rule.signal, next, rule.enabled), "admin.brand.saved");
                  setRules((prev) => prev.map((row) => (row.signal === rule.signal ? { ...row, weight: next } : row)));
                }}
                className={`${inputClass} w-24`}
              />
              <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    setRules((prev) => prev.map((row) => (row.signal === rule.signal ? { ...row, enabled } : row)));
                    void runSave(`rule-${rule.signal}`, () => saveRecommendationRule(rule.signal, rule.weight, enabled), "admin.brand.saved");
                  }}
                  className="accent-gold"
                />
                {t("admin.common.enabled")}
              </label>
            </li>
          ))}
        </ul>
      </section>

      {/* Gift Finder */}
      <section className={cardClass}>
        <h2 className="font-serif text-lg">{t("admin.brand.giftFinder")}</h2>
        <p className="text-xs text-muted leading-relaxed">{t("admin.brand.giftFinderBody")}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <AdminField label={t("admin.brand.enabled")} htmlFor="gf-enabled">
            <select
              id="gf-enabled"
              value={giftFinder.enabled === false ? "off" : "on"}
              onChange={(event) => setGiftFinder({ ...giftFinder, enabled: event.target.value === "on" })}
              className={inputClass}
            >
              <option value="on">{t("admin.common.on")}</option>
              <option value="off">{t("admin.common.off")}</option>
            </select>
          </AdminField>
          <AdminField label={t("admin.brand.resultsLimit")} htmlFor="gf-limit">
            <input
              id="gf-limit"
              type="number"
              min="1"
              max="8"
              value={Number(giftFinder.resultsLimit ?? 4)}
              onChange={(event) => setGiftFinder({ ...giftFinder, resultsLimit: Number(event.target.value) })}
              className={inputClass}
            />
          </AdminField>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {(["recipients", "relationships", "occasions", "budgetBands"] as const).map((key) => (
            <AdminField key={key} label={t(FINDER_LIST_KEYS[key])} htmlFor={`gf-${key}`} hint={t("admin.brand.commaHint")}>
              <input
                id={`gf-${key}`}
                value={finderLists[key]}
                onChange={(event) => setFinderLists({ ...finderLists, [key]: event.target.value })}
                placeholder={((giftFinder[key] as unknown[]) || []).join(", ")}
                className={inputClass}
              />
            </AdminField>
          ))}
        </div>
        <button
          type="button"
          disabled={saving === "gf"}
          onClick={() =>
            void runSave(
              "gf",
              () =>
                saveGiftFinderConfig({
                  ...giftFinder,
                  recipients: csv(finderLists.recipients),
                  relationships: csv(finderLists.relationships),
                  occasions: csv(finderLists.occasions),
                  budgetBands: giftFinder.budgetBands,
                }),
              "admin.brand.saved"
            )
          }
          className="btn-gold font-sans text-xs disabled:opacity-50"
        >
          {t("admin.brand.saveGiftFinder")}
        </button>
      </section>

      {/* Gift card rules */}
      <section className={cardClass}>
        <h2 className="font-serif text-lg">{t("admin.brand.giftCardRules")}</h2>
        <p className="text-xs text-muted leading-relaxed">{t("admin.brand.giftCardRulesBody")}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminField label={t("admin.brand.enabled")} htmlFor="gc-enabled">
            <select
              id="gc-enabled"
              value={giftCards.enabled === true ? "on" : "off"}
              onChange={(event) => setGiftCards({ ...giftCards, enabled: event.target.value === "on" })}
              className={inputClass}
            >
              <option value="on">{t("admin.common.on")}</option>
              <option value="off">{t("admin.common.off")}</option>
            </select>
          </AdminField>
          <AdminField label={t("admin.brand.denominations")} htmlFor="gc-denoms">
            <input
              id="gc-denoms"
              defaultValue={((giftCards.denominations as unknown[]) || []).join(", ")}
              onBlur={(event) =>
                setGiftCards({
                  ...giftCards,
                  denominations: event.target.value
                    .split(",")
                    .map((part) => Number(part.trim()))
                    .filter((value) => Number.isFinite(value) && value > 0)
                    .slice(0, 10),
                })
              }
              className={inputClass}
            />
          </AdminField>
          <AdminField label={t("admin.brand.expiryDays")} htmlFor="gc-expiry">
            <input
              id="gc-expiry"
              type="number"
              min="1"
              max="3650"
              value={giftCards.expiryDays == null ? "" : Number(giftCards.expiryDays)}
              onChange={(event) =>
                setGiftCards({ ...giftCards, expiryDays: event.target.value === "" ? null : Number(event.target.value) })
              }
              className={inputClass}
            />
          </AdminField>
          <AdminField label={t("admin.brand.allowCustom")} htmlFor="gc-custom">
            <select
              id="gc-custom"
              value={giftCards.allowCustom === true ? "on" : "off"}
              onChange={(event) => setGiftCards({ ...giftCards, allowCustom: event.target.value === "on" })}
              className={inputClass}
            >
              <option value="on">{t("admin.common.on")}</option>
              <option value="off">{t("admin.common.off")}</option>
            </select>
          </AdminField>
        </div>
        <button
          type="button"
          disabled={saving === "gc"}
          onClick={() => void runSave("gc", () => saveGiftCardConfig(giftCards), "admin.brand.saved")}
          className="btn-gold font-sans text-xs disabled:opacity-50"
        >
          {t("admin.brand.saveGiftCardRules")}
        </button>
      </section>

      {/* Editions and pre-orders, per fragrance */}
      <section className={cardClass}>
        <h2 className="font-serif text-lg">{t("admin.brand.editionsAndPreOrders")}</h2>
        <p className="text-xs text-muted leading-relaxed">{t("admin.brand.editionsBody")}</p>
        <p className="text-[11px] text-muted leading-relaxed border border-gold/20 rounded px-3 py-2">{t("admin.brand.editionsHint")}</p>
        <ul className="space-y-4">
          {products.map((product) => (
            <li key={product.id} className={rowClass}>
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-xs text-ivory flex-1 min-w-0">{product.name}</p>

                <EditionEditor product={product} onSaved={() => void load()} />
                <PreOrderEditor product={product} onSaved={() => void load()} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function EditionEditor({ product, onSaved }: { product: Product; onSaved: () => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [total, setTotal] = useState<string>(product.editionTotal ? String(product.editionTotal) : "");
  const stock = (product.variants || []).filter((v) => v.active !== false).reduce((sum, v) => sum + (v.stock || 0), 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted">{t("admin.brand.limited")}</span>
      <input
        type="number"
        min="1"
        aria-label={`${product.name} edition total`}
        value={total}
        onChange={(event) => setTotal(event.target.value)}
        className="bg-navy border border-gold/25 rounded px-2 py-1.5 text-xs text-ivory w-24 focus:outline-none focus:border-gold"
      />
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const value = Number(total);
          await saveProductEdition({
            productId: product.id,
            isLimited: Number.isFinite(value) && value > 0,
            editionTotal: Number.isFinite(value) && value > 0 ? value : null,
            editionNumber: product.editionNumber || null,
            releasedOn: product.editionReleasedOn || null,
            endsOn: product.editionEndsOn || null,
          });
          setBusy(false);
          onSaved();
        }}
        className="btn-gold font-sans text-xs disabled:opacity-50"
      >
        {busy ? t("admin.brand.saving") : t("admin.brand.saveEdition")}
      </button>
      <span className="text-[10px] font-mono uppercase tracking-wider text-gold">
        {t("admin.brand.inStockNow", { count: stock })}
      </span>
    </div>
  );
}

function PreOrderEditor({ product, onSaved }: { product: Product; onSaved: () => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [releaseOn, setReleaseOn] = useState(product.preOrderReleaseOn || "");
  const [max, setMax] = useState(product.preOrderMaxQuantity ? String(product.preOrderMaxQuantity) : "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted">{t("admin.brand.preOrder")}</span>
      <input
        type="date"
        aria-label={`${product.name} release date`}
        value={releaseOn}
        onChange={(event) => setReleaseOn(event.target.value)}
        className="bg-navy border border-gold/25 rounded px-2 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
      />
      <input
        type="number"
        min="1"
        aria-label={`${product.name} pre-order cap`}
        value={max}
        onChange={(event) => setMax(event.target.value)}
        placeholder={t("admin.brand.optional")}
        className="bg-navy border border-gold/25 rounded px-2 py-1.5 text-xs text-ivory w-20 focus:outline-none focus:border-gold"
      />
      <button
        type="button"
        disabled={busy || !releaseOn}
        onClick={async () => {
          setBusy(true);
          const result = await setProductPreOrder(product.id, true, releaseOn, max ? Number(max) : null);
          setBusy(false);
          if (!result.success) window.alert(result.error || t("admin.brand.failed"));
          onSaved();
        }}
        className="btn-gold font-sans text-xs disabled:opacity-50"
      >
        {busy ? t("admin.brand.saving") : t("admin.brand.openPreOrder")}
      </button>
      {product.preOrderEnabled && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await setProductPreOrder(product.id, false, null, null);
            setBusy(false);
            onSaved();
          }}
          className="text-[10px] font-mono uppercase tracking-wider text-muted hover:text-gold"
        >
          {t("admin.brand.closePreOrder")}
        </button>
      )}
    </div>
  );
}

export default BrandExperiencePage;
