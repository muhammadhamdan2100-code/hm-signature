import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useI18n } from "../i18n/I18nProvider";
import { useCurrency } from "../context/CurrencyContext";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { getCatalogProducts } from "../services/catalog";
import { familyOptionsForCatalogue } from "../lib/fragranceMatch";
import {
  FACET_REASON_KEYS,
  fetchDiscovery,
  humaniseTag,
  type DiscoveryFacetGroup,
  type HydratedResults,
} from "../services/brandExperience";
import type { Product } from "../data/products";

interface Selection {
  families: string[];
  notes: string[];
  genders: string[];
  moods: string[];
  occasions: string[];
  seasons: string[];
  intensities: string[];
  sillage: string[];
  longevity: string[];
}

const EMPTY_SELECTION: Selection = {
  families: [],
  notes: [],
  genders: [],
  moods: [],
  occasions: [],
  seasons: [],
  intensities: [],
  sillage: [],
  longevity: [],
};

/** Tag-driven kinds, in the order the panel shows them, and the selection key each one writes. */
const TAG_KINDS = ["mood", "occasion", "season", "intensity", "sillage", "longevity"] as const;

const KIND_TO_SELECTION: Record<(typeof TAG_KINDS)[number], keyof Selection> = {
  mood: "moods",
  occasion: "occasions",
  season: "seasons",
  intensity: "intensities",
  sillage: "sillage",
  longevity: "longevity",
};

export default function Discover() {
  const { t } = useI18n();
  const { format } = useCurrency();
  useSeoMeta(t("seo.discoverTitle"), t("seo.discoverDescription"));

  const [catalogue, setCatalogue] = useState<Product[]>([]);
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState("matching");
  const [facets, setFacets] = useState<DiscoveryFacetGroup[]>([]);
  const [results, setResults] = useState<HydratedResults>({ entries: [], degraded: false });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    getCatalogProducts()
      .then((list) => {
        if (alive) setCatalogue(list || []);
      })
      .catch(() => {
        if (alive) setCatalogue([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetchDiscovery({
        ...selection,
        priceMin: priceMin === "" ? undefined : Number(priceMin),
        priceMax: priceMax === "" ? undefined : Number(priceMax),
        inStock,
        sort,
        limit: 24,
      });
      setFacets(response.facets);
      setResults(response.results);
    } catch {
      setFacets([]);
      setResults({ entries: [], degraded: true });
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [selection, priceMin, priceMax, inStock, sort]);

  useEffect(() => {
    void run();
  }, [run]);

  const familyOptions = useMemo(() => familyOptionsForCatalogue(catalogue), [catalogue]);

  // Notes come from the fragrances themselves, not from a list someone typed in.
  const noteOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of catalogue) {
      for (const note of [...product.topNotes, ...product.heartNotes, ...product.baseNotes]) {
        const key = note.trim();
        if (!key) continue;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 18);
  }, [catalogue]);

  const facetGroups = useMemo(() => {
    const map = new Map<string, DiscoveryFacetGroup>();
    for (const group of facets) map.set(group.kind, group);
    return map;
  }, [facets]);

  const toggle = (key: keyof Selection, value: string) => {
    setSelection((prev) => {
      const list = prev[key];
      const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
      return { ...prev, [key]: next };
    });
  };

  const activeCount =
    Object.values(selection).reduce((total, list) => total + list.length, 0) +
    (priceMin !== "" ? 1 : 0) +
    (priceMax !== "" ? 1 : 0) +
    (inStock ? 1 : 0);

  const reset = () => {
    setSelection(EMPTY_SELECTION);
    setPriceMin("");
    setPriceMax("");
    setInStock(false);
    setSort("matching");
  };

  const chipClass = (active: boolean) =>
    `text-[11px] tracking-[0.12em] uppercase font-mono px-3 py-2 border transition-colors ${
      active ? "border-gold bg-gold text-navy" : "border-gold/25 text-muted hover:text-ivory hover:border-gold/60"
    }`;

  return (
    <div className="bg-navy min-h-screen">
      <section className="pt-32 pb-10 border-b border-gold/15">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="eyebrow mb-4">{t("discovery.eyebrow")}</div>
            <h1 className="font-serif text-4xl lg:text-5xl">{t("discovery.title")}</h1>
            <p className="text-muted mt-4 max-w-2xl leading-relaxed text-sm">{t("discovery.body")}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 lg:flex lg:gap-12">
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            className="lg:hidden btn-gold font-sans text-xs mb-8 flex items-center gap-2"
            aria-expanded={panelOpen}
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            {t("discovery.filtersTitle")}
            {activeCount > 0 && <span className="text-navy bg-gold px-1.5 rounded-full">{activeCount}</span>}
          </button>

          <aside
            className={`${panelOpen ? "block" : "hidden"} lg:block lg:w-72 lg:shrink-0 space-y-9 pb-10 lg:pb-0`}
            aria-label={t("discovery.filtersTitle")}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-gold">{t("discovery.filtersTitle")}</h2>
              {activeCount > 0 && (
                <button type="button" onClick={reset} className="text-[10px] font-mono uppercase tracking-wider text-muted hover:text-gold flex items-center gap-1">
                  <X className="w-3 h-3" aria-hidden="true" />
                  {t("discovery.reset")}
                </button>
              )}
            </div>

            <fieldset className="space-y-3">
              <legend className="text-xs font-mono uppercase tracking-[0.18em] text-ivory mb-2">{t("discovery.familyTitle")}</legend>
              <div className="flex flex-wrap gap-2">
                {familyOptions.length === 0 ? (
                  <p className="text-xs text-muted">{t("discovery.noFamilies")}</p>
                ) : (
                  familyOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={chipClass(selection.families.includes(option.value.toLowerCase()))}
                      aria-pressed={selection.families.includes(option.value.toLowerCase())}
                      onClick={() => toggle("families", option.value.toLowerCase())}
                    >
                      {option.label}
                    </button>
                  ))
                )}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-xs font-mono uppercase tracking-[0.18em] text-ivory mb-2">{t("discovery.notesTitle")}</legend>
              <div className="flex flex-wrap gap-2">
                {noteOptions.length === 0 ? (
                  <p className="text-xs text-muted">{t("discovery.noNotes")}</p>
                ) : (
                  noteOptions.map(([name, count]) => (
                    <button
                      key={name}
                      type="button"
                      className={chipClass(selection.notes.includes(name.toLowerCase()))}
                      aria-pressed={selection.notes.includes(name.toLowerCase())}
                      onClick={() => toggle("notes", name.toLowerCase())}
                    >
                      {name} <span className="text-[9px] opacity-70">{count}</span>
                    </button>
                  ))
                )}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-xs font-mono uppercase tracking-[0.18em] text-ivory mb-2">{t("discovery.leanTitle")}</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={chipClass(selection.genders.length === 0)} aria-pressed={selection.genders.length === 0} onClick={() => setSelection((prev) => ({ ...prev, genders: [] }))}>
                  {t("discovery.everyone")}
                </button>
                <button type="button" className={chipClass(selection.genders.includes("men"))} aria-pressed={selection.genders.includes("men")} onClick={() => setSelection((prev) => ({ ...prev, genders: prev.genders.includes("men") ? [] : ["men"] }))}>
                  {t("discovery.forHim")}
                </button>
                <button type="button" className={chipClass(selection.genders.includes("women"))} aria-pressed={selection.genders.includes("women")} onClick={() => setSelection((prev) => ({ ...prev, genders: prev.genders.includes("women") ? [] : ["women"] }))}>
                  {t("discovery.forHer")}
                </button>
                <button type="button" className={chipClass(selection.genders.includes("unisex"))} aria-pressed={selection.genders.includes("unisex")} onClick={() => setSelection((prev) => ({ ...prev, genders: prev.genders.includes("unisex") ? [] : ["unisex"] }))}>
                  {t("discovery.unisex")}
                </button>
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-xs font-mono uppercase tracking-[0.18em] text-ivory mb-2">{t("discovery.priceTitle")}</legend>
              <div className="flex gap-3">
                <label className="flex-1 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted">{t("discovery.priceFrom")}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={priceMin}
                    onChange={(event) => setPriceMin(event.target.value)}
                    className="w-full bg-navy2 border border-gold/25 rounded px-2 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                  />
                </label>
                <label className="flex-1 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted">{t("discovery.priceTo")}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={priceMax}
                    onChange={(event) => setPriceMax(event.target.value)}
                    className="w-full bg-navy2 border border-gold/25 rounded px-2 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted pt-1">
                <input type="checkbox" checked={inStock} onChange={(event) => setInStock(event.target.checked)} className="accent-gold" />
                {t("discovery.inStockOnly")}
              </label>
            </fieldset>

            {/* Tag-driven attributes. A kind with nothing behind it is reported as untagged rather
                than dropped, so the shopper knows the house has not filled it in yet. */}
            <fieldset className="space-y-5">
              <legend className="text-xs font-mono uppercase tracking-[0.18em] text-ivory mb-2">{t("discovery.characterTitle")}</legend>
              {TAG_KINDS.map((kind) => {
                const group = facetGroups.get(kind);
                const selectionKey = KIND_TO_SELECTION[kind];
                return (
                  <div key={kind} className="space-y-2">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-gold/80">
                      {FACET_REASON_KEYS[kind] ? t(FACET_REASON_KEYS[kind]) : humaniseTag(kind)}
                    </p>
                    {group && group.values.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {group.values.map((value) => (
                          <button
                            key={`${kind}-${value.value}`}
                            type="button"
                            className={chipClass(selection[selectionKey].includes(value.value))}
                            aria-pressed={selection[selectionKey].includes(value.value)}
                            onClick={() => toggle(selectionKey, value.value)}
                          >
                            {humaniseTag(value.value)} <span className="text-[9px] opacity-70">{value.products}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted leading-relaxed">{t("discovery.notTagged")}</p>
                    )}
                  </div>
                );
              })}
            </fieldset>
          </aside>

          <div className="flex-1 min-w-0 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-muted font-mono uppercase tracking-wider" aria-live="polite">
                {loading ? t("discovery.loading") : t("discovery.resultsCount", { count: results.entries.length })}
              </p>
              <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted">
                {t("discovery.sortTitle")}
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="bg-navy2 border border-gold/25 rounded px-2 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
                >
                  <option value="matching">{t("discovery.sortMatching")}</option>
                  <option value="bestseller">{t("discovery.sortBestseller")}</option>
                  <option value="new">{t("discovery.sortNew")}</option>
                  <option value="price_asc">{t("discovery.sortPriceLow")}</option>
                  <option value="price_desc">{t("discovery.sortPriceHigh")}</option>
                  <option value="name">{t("discovery.sortName")}</option>
                </select>
              </label>
            </div>

            {failed ? (
              <div className="border border-gold/25 bg-navy2/60 rounded-lg p-10 text-center space-y-3 max-w-xl mx-auto">
                <h2 className="font-serif text-2xl text-ivory">{t("discovery.failedTitle")}</h2>
                <p className="text-sm text-muted leading-relaxed">{t("discovery.failedBody")}</p>
                <button type="button" onClick={() => void run()} className="btn-gold text-xs">
                  {t("discovery.failedCta")}
                </button>
              </div>
            ) : loading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6" aria-busy="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border border-gold/10 bg-navy2/50 animate-pulse h-96" aria-hidden="true" />
                ))}
              </div>
            ) : results.entries.length === 0 ? (
              <div className="border border-gold/25 bg-navy2/60 rounded-lg p-10 text-center space-y-3 max-w-xl mx-auto">
                <h2 className="font-serif text-2xl text-ivory">{t("discovery.emptyTitle")}</h2>
                <p className="text-sm text-muted leading-relaxed">{t("discovery.emptyBody")}</p>
                <div className="flex flex-wrap gap-3 justify-center pt-2">
                  <button type="button" onClick={reset} className="btn-gold text-xs">
                    {t("discovery.reset")}
                  </button>
                  <Link to="/scent-finder" className="btn-gold-fill font-sans text-xs">
                    {t("discovery.emptyFinderCta")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {results.entries.map(({ product, facets: matched }) => (
                    <div key={product.id} className="space-y-2">
                      <ProductCard product={product} />
                      {matched.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 px-1">
                          {matched.map((facet) => (
                            <span key={facet} className="text-[10px] font-mono uppercase tracking-wider text-gold/80 border border-gold/25 px-2 py-0.5">
                              {FACET_REASON_KEYS[facet] ? t(FACET_REASON_KEYS[facet]) : humaniseTag(facet)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {priceMin !== "" && priceMax !== "" && (
                  <p className="text-[11px] text-muted font-mono uppercase tracking-wider text-center">
                    {format(Number(priceMin))} – {format(Number(priceMax))}
                  </p>
                )}
              </div>
            )}

            <p className="text-[11px] text-muted leading-relaxed max-w-2xl mx-auto text-center">{t("discovery.footnote")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
