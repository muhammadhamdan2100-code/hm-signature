import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "../data/products";
import { sizeToMl } from "../data/products";
import ProductCard from "../components/ProductCard";
import { useCurrency } from "../context/CurrencyContext";
import { useI18n } from "../i18n/I18nProvider";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { getCatalogProducts } from "../services/catalog";

interface Props {
  title: string;
  subtitle: string;
  eyebrow: string;
  baseFilter: (p: Product) => boolean;
  heroTexture?: string;
}

type SortKey = "featured" | "newest" | "price-low" | "price-high" | "rating";

const SORT_OPTIONS: { value: SortKey; labelKey: string }[] = [
  { value: "featured", labelKey: "shop.sortFeatured" },
  { value: "newest", labelKey: "shop.sortNewest" },
  { value: "price-low", labelKey: "shop.sortPriceLow" },
  { value: "price-high", labelKey: "shop.sortPriceHigh" },
  { value: "rating", labelKey: "shop.sortRating" },
];

const GENDERS = ["men", "women", "unisex"] as const;

// Display labels only; the value stays the deep-linked query token.
const GENDER_LABEL_KEYS: Record<string, string> = {
  men: "shop.genderMen",
  women: "shop.genderWomen",
  unisex: "shop.genderUnisex",
};

const chipBase =
"text-xs px-3 py-2 rounded transition-colors border min-h-[44px] inline-flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold";
const chipOn = "border-gold bg-gold text-navy font-semibold";
const chipOff = "border-gold/20 text-muted hover:text-ivory";

function variantPrice(v: NonNullable<Product["variants"]>[number]): number {
  return v.salePrice ?? v.price;
}

/** Lowest price the shopper can actually pay for this fragrance. */
function minListingPrice(p: Product): number {
  const active = (p.variants || []).filter((v) => v.active !== false);
  if (active.length > 0) return Math.min(...active.map(variantPrice));
  return p.price;
}

function hasStock(p: Product): boolean {
  const active = (p.variants || []).filter((v) => v.active !== false);
  if (active.length > 0) return active.some((v) => v.stock > 0);
  return p.stock > 0;
}

function searchHaystack(p: Product): string {
  return [
    p.name,
    p.category,
    p.fragranceFamily || "",
    p.description,
    p.shortDescription || "",
    p.topNotes.join(" "),
    p.heartNotes.join(" "),
    p.baseNotes.join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function SkeletonCard() {
  return (
    <div className="border border-gold/10 bg-navy2/50 animate-pulse" aria-hidden="true">
      <div className="aspect-[3/4] bg-navy2/80" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-1/3 bg-gold/15 rounded" />
        <div className="h-4 w-2/3 bg-gold/20 rounded" />
        <div className="h-8 w-full border border-gold/10 rounded" />
      </div>
    </div>
  );
}

export default function ShopPage({
  title, subtitle, eyebrow, baseFilter, heroTexture = "texture-navy" }: Props) {
  const { t, language } = useI18n();
  const { format } = useCurrency();
  const location = useLocation();
  const shopPath = location.pathname;
  useSeoMeta(
    shopPath,
    title,
    shopPath === "/collections" ? t("seo.collectionsDescription") : t("seo.shopDescription")
  );

  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Primary filters are deep-linked through the query string.
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const gender = searchParams.get("gender") || "all";
  const family = searchParams.get("family") || "all";
  const sort = (searchParams.get("sort") as SortKey) || "featured";
  const maxPriceParam = Number(searchParams.get("maxPrice"));

  // Secondary filters stay in local state.
  const [size, setSize] = useState("all");
  const [intensity, setIntensity] = useState("all");
  const [occasion, setOccasion] = useState("all");
  const [season, setSeason] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);

  // Search input mirrors the URL so navbar deep links (?q=…) keep working.
  const [searchInput, setSearchInput] = useState(query);
  useEffect(() => setSearchInput(query), [query]);

  useEffect(() => {
    let mounted = true;
    getCatalogProducts()
      .then((prods) => {
        if (mounted) setCatalogProducts(prods || []);
      })
      .catch((err) => {
        console.error("Failed to load catalog products:", err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [language.code]);

  const patchParams = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "" || value === "all") next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const clearAll = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setSize("all");
    setIntensity("all");
    setOccasion("all");
    setSeason("all");
    setInStockOnly(false);
    setSearchInput("");
  };

  // Price range derived from the real catalogue, not a fixed guess.
  const [priceFloor, priceCeiling] = useMemo(() => {
    // No catalogue yet: the slider is not rendered, so no invented bounds appear.
    if (catalogProducts.length === 0) return [0, 0];
    const lows = catalogProducts.map(minListingPrice);
    const highs = catalogProducts.map((p) => {
      const active = (p.variants || []).filter((v) => v.active !== false);
      return active.length > 0 ? Math.max(...active.map(variantPrice)) : p.price;
    });
    const floor = Math.max(0, Math.floor(Math.min(...lows) / 500) * 500);
    const ceiling = Math.ceil(Math.max(...highs) / 500) * 500;
    return [floor, ceiling];
  }, [catalogProducts]);

  const maxPrice =
    Number.isFinite(maxPriceParam) && maxPriceParam >= priceFloor
      ? Math.min(maxPriceParam, priceCeiling)
      : priceCeiling;

  const families = useMemo(
    () =>
      Array.from(
        new Set(catalogProducts.map((p) => p.fragranceFamily || p.category).filter(Boolean))
      ).sort(),
    [catalogProducts]
  );

  const sizes = useMemo(() => {
    const set = new Set<string>();
    catalogProducts.forEach((p) =>
      (p.variants || []).forEach((v) => {
        if (v.active !== false) set.add(v.size);
      })
    );
    return Array.from(set).sort(compareSizeLabels);
  }, [catalogProducts]);

  const intensities = useMemo(() => {
    const set = new Set<string>();
    catalogProducts.forEach((p) => p.intensity && set.add(p.intensity));
    return Array.from(set);
  }, [catalogProducts]);

  const occasions = useMemo(() => {
    const set = new Set<string>();
    catalogProducts.forEach((p) => (p.occasions || []).forEach((o) => set.add(o)));
    return Array.from(set);
  }, [catalogProducts]);

  const seasons = useMemo(() => {
    const set = new Set<string>();
    catalogProducts.forEach((p) => (p.seasons || []).forEach((s) => set.add(s)));
    return Array.from(set);
  }, [catalogProducts]);

  const filtered = useMemo(() => {
    let list = catalogProducts.filter(baseFilter);

    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length > 0) {
      list = list.filter((p) => {
        const hay = searchHaystack(p);
        return tokens.every((t) => hay.includes(t));
      });
    }
    if (gender !== "all") list = list.filter((p) => p.gender === gender);
    if (family !== "all")
      list = list.filter((p) => (p.fragranceFamily || p.category) === family);
    if (size !== "all")
      list = list.filter((p) =>
        (p.variants || []).some((v) => v.active !== false && v.size === size && v.stock > 0)
      );
    if (intensity !== "all") list = list.filter((p) => p.intensity === intensity);
    if (occasion !== "all") list = list.filter((p) => (p.occasions || []).includes(occasion));
    if (season !== "all") list = list.filter((p) => (p.seasons || []).includes(season));
    if (inStockOnly) list = list.filter(hasStock);
    if (maxPrice < priceCeiling) list = list.filter((p) => minListingPrice(p) <= maxPrice);

    switch (sort) {
      case "newest":
        // Catalogue arrives newest-first; bring declared new arrivals forward.
        list = [...list].sort(
          (a, b) => Number(Boolean(b.newArrival)) - Number(Boolean(a.newArrival))
        );
        break;
      case "price-low":
        list = [...list].sort((a, b) => minListingPrice(a) - minListingPrice(b));
        break;
      case "price-high":
        list = [...list].sort((a, b) => minListingPrice(b) - minListingPrice(a));
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        break;
      default:
        list = [...list].sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) || Number(b.bestseller) - Number(a.bestseller)
        );
    }
    return list;
  }, [
    catalogProducts, baseFilter, query, gender, family, size, intensity, occasion,
    season, inStockOnly, maxPrice, priceCeiling, sort,
  ]);

  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (query) chips.push({ key: "q", label: t("shop.chipSearch", { query }), remove: () => patchParams("q", null) });
  if (gender !== "all") chips.push({ key: "gender", label: t(GENDER_LABEL_KEYS[gender] ?? gender).toUpperCase(), remove: () => patchParams("gender", null) });
  if (family !== "all") chips.push({ key: "family", label: t("shop.chipFamily", { value: family }), remove: () => patchParams("family", null) });
  if (size !== "all") chips.push({ key: "size", label: t("shop.chipSize", { value: size }), remove: () => setSize("all") });
  if (intensity !== "all") chips.push({ key: "intensity", label: t("shop.chipIntensity", { value: intensity }), remove: () => setIntensity("all") });
  if (occasion !== "all") chips.push({ key: "occasion", label: t("shop.chipOccasion", { value: occasion }), remove: () => setOccasion("all") });
  if (season !== "all") chips.push({ key: "season", label: t("shop.chipSeason", { value: season }), remove: () => setSeason("all") });
  if (inStockOnly) chips.push({ key: "stock", label: t("shop.inStockOnly"), remove: () => setInStockOnly(false) });
  if (maxPrice < priceCeiling)
    chips.push({ key: "price", label: t("shop.chipUnder", { amount: format(maxPrice) }), remove: () => patchParams("maxPrice", null) });

  const catalogueEmpty = !isLoading && catalogProducts.length === 0;

  return (
    <div className="pt-24">
      <section className={`relative py-24 ${heroTexture} border-b border-gold/20`}>
        <div className="absolute inset-0 bg-navy/60" />
        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
          <div className="eyebrow mb-3">{eyebrow}</div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-wide mb-4">{title}</h1>
          <p className="text-muted max-w-xl mx-auto leading-relaxed text-sm sm:text-base font-light">
            {subtitle}
          </p>
        </div>
      </section>

      <section className="py-16 bg-navy overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setFiltersOpen((o) => !o)}
                aria-expanded={filtersOpen}
                aria-controls="shop-filters"
                className="btn-gold text-xs flex items-center gap-2 min-h-[44px]"
              >
                <SlidersHorizontal size={14} aria-hidden="true" /> {t("shop.filters")}
              </button>
              <span className="text-xs text-muted font-mono" role="status" aria-live="polite">
                {isLoading
                  ? t("shop.loading")
                  : `${filtered.length} ${filtered.length === 1 ? t("shop.fragrance") : t("shop.fragrances")}`}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs min-w-0">
              <label htmlFor="shop-sort" className="text-muted tracking-widest hidden sm:inline">
                {t("shop.sortBy")}
              </label>
              <select
                id="shop-sort"
                aria-label={t("shop.sortAriaLabel")}
                value={sort}
                onChange={(e) => patchParams("sort", e.target.value === "featured" ? null : e.target.value)}
                className="bg-transparent border border-gold/25 text-ivory px-3 py-2 text-xs rounded font-sans min-h-[44px] focus:outline-none focus-visible:ring-1 focus-visible:ring-gold focus-visible:border-gold"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-navy2 text-ivory">
                    {t(o.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <label htmlFor="shop-search" className="sr-only">
              {t("shop.searchLabel")}
            </label>
            <Search
              size={14}
              aria-hidden="true"
              className="absolute start-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              id="shop-search"
              type="search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                patchParams("q", e.target.value.trim() || null);
              }}
              placeholder={t("shop.searchPlaceholder")}
              className="w-full max-w-md bg-navy2/60 border border-gold/25 rounded text-sm text-ivory placeholder:text-muted/60 ps-9 pe-3 py-2.5 min-h-[44px] focus:outline-none focus-visible:ring-1 focus-visible:ring-gold focus-visible:border-gold"
            />
          </div>

          {/* Active filter chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6" role="region" aria-label={t("shop.activeFilters")}>
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-wider border border-gold/40 bg-gold/10 text-goldLight rounded px-2 py-1.5"
                >
                  {chip.label}
                  <button
                    onClick={chip.remove}
                    aria-label={t("shop.removeFilter", { label: chip.label })}
                    className="w-[44px] h-[24px] -me-2 flex items-center justify-center hover:text-ivory transition-colors"
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </span>
              ))}
              <button
                onClick={clearAll}
                className="text-[11px] font-mono tracking-widest text-muted hover:text-gold underline underline-offset-4 min-h-[44px] px-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                {t("shop.clearAll")}
              </button>
            </div>
          )}

          <AnimatePresence initial={false}>
            {filtersOpen && !catalogueEmpty && (
              <motion.div
                id="shop-filters"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border border-gold/20 p-6 mb-12 bg-navy2/60 rounded-lg"
              >
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-gold/15">
                  <span className="eyebrow">{t("shop.refineCollection")}</span>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    aria-label={t("shop.closeFilters")}
                    className="w-[44px] h-[44px] -me-3 flex items-center justify-center text-muted hover:text-ivory focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FilterGroup label={t("shop.filterGender")}>
                    {GENDERS.map((g) => (
                      <button
                        key={g}
                        onClick={() => patchParams("gender", gender === g ? null : g)}
                        aria-pressed={gender === g}
                        className={`${chipBase} ${gender === g ? chipOn : chipOff}`}
                      >
                        <span className="capitalize">{t(GENDER_LABEL_KEYS[g] ?? g)}</span>
                      </button>
                    ))}
                  </FilterGroup>

                  <FilterGroup label={t("shop.filterFragranceFamily")}>
                    {families.map((f) => (
                      <button
                        key={f}
                        onClick={() => patchParams("family", family === f ? null : f)}
                        aria-pressed={family === f}
                        className={`${chipBase} ${family === f ? chipOn : chipOff}`}
                      >
                        {f}
                      </button>
                    ))}
                  </FilterGroup>

                  {sizes.length > 0 && (
                    <FilterGroup label={t("shop.filterSizeAvailable")}>
                      {sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSize(size === s ? "all" : s)}
                          aria-pressed={size === s}
                          className={`${chipBase} ${size === s ? chipOn : chipOff}`}
                        >
                          {s}
                        </button>
                      ))}
                    </FilterGroup>
                  )}

                  {intensities.length > 0 && (
                    <FilterGroup label={t("shop.filterIntensity")}>
                      {intensities.map((s) => (
                        <button
                          key={s}
                          onClick={() => setIntensity(intensity === s ? "all" : s)}
                          aria-pressed={intensity === s}
                          className={`${chipBase} ${intensity === s ? chipOn : chipOff}`}
                        >
                          {s}
                        </button>
                      ))}
                    </FilterGroup>
                  )}

                  {occasions.length > 0 && (
                    <FilterGroup label={t("shop.filterOccasion")}>
                      {occasions.map((s) => (
                        <button
                          key={s}
                          onClick={() => setOccasion(occasion === s ? "all" : s)}
                          aria-pressed={occasion === s}
                          className={`${chipBase} ${occasion === s ? chipOn : chipOff}`}
                        >
                          {s}
                        </button>
                      ))}
                    </FilterGroup>
                  )}

                  {seasons.length > 0 && (
                    <FilterGroup label={t("shop.filterSeason")}>
                      {seasons.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSeason(season === s ? "all" : s)}
                          aria-pressed={season === s}
                          className={`${chipBase} ${season === s ? chipOn : chipOff}`}
                        >
                          {s}
                        </button>
                      ))}
                    </FilterGroup>
                  )}

                  {catalogProducts.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3 text-xs font-mono">
                      <span className="text-gold uppercase tracking-widest" id="shop-maxprice-label">
                        {t("shop.maximumPrice")}
                      </span>
                      <span className="text-ivory font-bold">{format(maxPrice)}</span>
                    </div>
                    <input
                      type="range"
                      aria-labelledby="shop-maxprice-label"
                      min={priceFloor}
                      max={priceCeiling}
                      step={500}
                      value={maxPrice}
                      onChange={(e) =>
                        patchParams(
"maxPrice",
                          Number(e.target.value) >= priceCeiling ? null : e.target.value
                        )
                      }
                      className="w-full accent-gold bg-navy border border-gold/20 rounded cursor-pointer h-11"
                    />
                    <div className="flex justify-between text-[10px] text-muted font-mono mt-1">
                      <span>{format(priceFloor)}</span>
                      <span>{format(priceCeiling)}</span>
                    </div>
                  </div>
                  )}

                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="shop-instock"
                      className="text-xs text-gold uppercase tracking-widest cursor-pointer flex items-center gap-2 min-h-[44px]"
                    >
                      <input
                        id="shop-instock"
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="accent-gold w-4 h-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                      />
                      {t("shop.inStockOnly")}
                    </label>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gold/15 flex justify-end">
                  <button
                    onClick={clearAll}
                    className="text-xs font-mono tracking-widest text-muted hover:text-gold min-h-[44px] px-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                  >
                    {t("shop.clearAllFilters")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="border-t border-gold/15 pt-10">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" aria-busy="true" aria-live="polite">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : catalogueEmpty ? (
              <div className="text-center py-24 max-w-lg mx-auto">
                <p className="font-serif text-2xl mb-3">{t("shop.catalogueEmptyTitle")}</p>
                <p className="text-muted text-sm leading-relaxed mb-6">
                  {t("shop.catalogueEmptyBody")}
                </p>
                <Link to="/scent-finder" className="btn-gold text-xs">
                  {t("home.collectionsEmptyCta")}
                </Link>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 max-w-lg mx-auto" role="status">
                <p className="font-serif text-2xl mb-3">{t("shop.emptyTitle")}</p>
                <p className="text-muted text-sm mb-6">
                  {t("shop.emptyBody")}
                </p>
                <button onClick={clearAll} className="btn-gold text-xs">
                  {t("shop.clearAll")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <span className="text-[11px] tracking-widest text-gold block mb-3 font-mono uppercase">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function compareSizeLabels(a: string, b: string): number {
  return sizeToMl(a) - sizeToMl(b);
}
