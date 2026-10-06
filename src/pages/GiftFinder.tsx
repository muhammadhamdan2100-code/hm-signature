import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useI18n } from "../i18n/I18nProvider";
import { useCurrency } from "../context/CurrencyContext";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { getCatalogProducts } from "../services/catalog";
import { familyOptionsForCatalogue } from "../lib/fragranceMatch";
import {
  FACET_REASON_KEYS,
  fetchGiftSuggestions,
  humaniseTag,
  type DiscoveryFacetGroup,
  type HydratedResults,
} from "../services/brandExperience";
import type { Product } from "../data/products";

function optionValues(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object" && "value" in entry) return String((entry as { value: unknown }).value);
      return "";
    })
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

export default function GiftFinder() {
  const { t } = useI18n();
  const { format } = useCurrency();
  useSeoMeta(t("seo.giftFinderTitle"), t("seo.giftFinderDescription"));

  const [catalogue, setCatalogue] = useState<Product[]>([]);
  const [recipient, setRecipient] = useState("");
  const [relationship, setRelationship] = useState("");
  const [occasion, setOccasion] = useState("");
  const [season, setSeason] = useState("");
  const [mood, setMood] = useState("");
  const [gender, setGender] = useState("");
  const [family, setFamily] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [facets, setFacets] = useState<DiscoveryFacetGroup[]>([]);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [askedFor, setAskedFor] = useState<Record<string, string | null>>({});
  const [results, setResults] = useState<HydratedResults>({ entries: [], degraded: false });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

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
      const response = await fetchGiftSuggestions({
        recipient: recipient || undefined,
        relationship: relationship || undefined,
        occasion: occasion || undefined,
        season: season || undefined,
        mood: mood || undefined,
        gender: gender || undefined,
        family: family || undefined,
        budgetMax: budgetMax === "" ? undefined : Number(budgetMax),
        limit: 4,
      });
      setFacets(response.facets);
      setConfig(response.config);
      setAskedFor(response.askedFor);
      setResults(response.results);
    } catch {
      setResults({ entries: [], degraded: true });
      setFacets([]);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [recipient, relationship, occasion, season, mood, gender, family, budgetMax]);

  useEffect(() => {
    void run();
  }, [run]);

  const facetGroups = useMemo(() => {
    const map = new Map<string, DiscoveryFacetGroup>();
    for (const group of facets) map.set(group.kind, group);
    return map;
  }, [facets]);

  const familyOptions = useMemo(() => familyOptionsForCatalogue(catalogue), [catalogue]);

  const occasionOptions = useMemo(() => {
    const tagged = (facetGroups.get("occasion")?.values || []).map((v) => v.value);
    return [...new Set([...tagged, ...optionValues(config.occasions)])];
  }, [facetGroups, config]);

  const recipientOptions = useMemo(() => optionValues(config.recipients), [config]);
  const relationshipOptions = useMemo(() => optionValues(config.relationships), [config]);
  const moodOptions = useMemo(() => (facetGroups.get("mood")?.values || []).map((v) => v.value), [facetGroups]);
  const seasonOptions = useMemo(() => (facetGroups.get("season")?.values || []).map((v) => v.value), [facetGroups]);

  const selectClass =
    "w-full bg-navy2 border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold";

  const chipClass = (active: boolean) =>
    `text-[11px] tracking-[0.12em] uppercase font-mono px-3 py-2 border transition-colors ${
      active ? "border-gold bg-gold text-navy" : "border-gold/25 text-muted hover:text-ivory hover:border-gold/60"
    }`;

  const budgetBands = optionValues(config.budgetBands);

  // The house has not tagged occasions or defined recipients yet. Saying that is better than
  // offering a choice that every fragrance would fail.
  const characterisationReady = occasionOptions.length > 0 || recipientOptions.length > 0 || moodOptions.length > 0;

  return (
    <div className="bg-navy min-h-screen">
      <section className="pt-32 pb-10 border-b border-gold/15">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex items-start gap-5">
            <Gift className="w-8 h-8 text-gold shrink-0 mt-2" aria-hidden="true" />
            <div>
              <div className="eyebrow mb-4">{t("gift.eyebrow")}</div>
              <h1 className="font-serif text-4xl lg:text-5xl">{t("gift.title")}</h1>
              <p className="text-muted mt-4 max-w-2xl leading-relaxed text-sm">{t("gift.body")}</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 space-y-12">
          <div className="border border-gold/25 bg-navy2/60 rounded-lg p-6 lg:p-8 space-y-7">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <label className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("gift.leanLabel")}</span>
                <select value={gender} onChange={(event) => setGender(event.target.value)} className={selectClass}>
                  <option value="">{t("gift.leanAny")}</option>
                  <option value="women">{t("gift.leanHer")}</option>
                  <option value="men">{t("gift.leanHim")}</option>
                  <option value="unisex">{t("gift.leanUnisex")}</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("gift.familyLabel")}</span>
                <select value={family} onChange={(event) => setFamily(event.target.value)} className={selectClass}>
                  <option value="">{t("gift.familyAny")}</option>
                  {familyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("gift.budgetLabel")}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={budgetMax}
                  onChange={(event) => setBudgetMax(event.target.value)}
                  placeholder={t("gift.budgetPlaceholder")}
                  className={selectClass}
                />
              </label>

              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("gift.readyLabel")}</span>
                <p className="text-xs text-muted leading-relaxed">{t("gift.readyBody")}</p>
              </div>
            </div>

            {budgetBands.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {budgetBands.map((band) => (
                  <button
                    key={band}
                    type="button"
                    className={chipClass(budgetMax === band)}
                    aria-pressed={budgetMax === band}
                    onClick={() => setBudgetMax(budgetMax === band ? "" : band)}
                  >
                    {format(Number(band))}
                  </button>
                ))}
              </div>
            )}

            {characterisationReady ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {occasionOptions.length > 0 && (
                  <label className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("gift.occasionLabel")}</span>
                    <select value={occasion} onChange={(event) => setOccasion(event.target.value)} className={selectClass}>
                      <option value="">{t("gift.occasionAny")}</option>
                      {occasionOptions.map((value) => (
                        <option key={value} value={value}>
                          {humaniseTag(value)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {seasonOptions.length > 0 && (
                  <label className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("gift.seasonLabel")}</span>
                    <select value={season} onChange={(event) => setSeason(event.target.value)} className={selectClass}>
                      <option value="">{t("gift.seasonAny")}</option>
                      {seasonOptions.map((value) => (
                        <option key={value} value={value}>
                          {humaniseTag(value)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {moodOptions.length > 0 && (
                  <label className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("gift.moodLabel")}</span>
                    <select value={mood} onChange={(event) => setMood(event.target.value)} className={selectClass}>
                      <option value="">{t("gift.moodAny")}</option>
                      {moodOptions.map((value) => (
                        <option key={value} value={value}>
                          {humaniseTag(value)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {recipientOptions.length > 0 && (
                  <label className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("gift.recipientLabel")}</span>
                    <select value={recipient} onChange={(event) => setRecipient(event.target.value)} className={selectClass}>
                      <option value="">{t("gift.recipientAny")}</option>
                      {recipientOptions.map((value) => (
                        <option key={value} value={value}>
                          {humaniseTag(value)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted leading-relaxed border-t border-gold/15 pt-5">{t("gift.notDefinedYet")}</p>
            )}

            {relationshipOptions.length > 0 && (
              <label className="space-y-2 block max-w-xs">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("gift.relationshipLabel")}</span>
                <select value={relationship} onChange={(event) => setRelationship(event.target.value)} className={selectClass}>
                  <option value="">{t("gift.relationshipAny")}</option>
                  {relationshipOptions.map((value) => (
                    <option key={value} value={value}>
                      {humaniseTag(value)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="space-y-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-serif text-3xl">{t("gift.resultsTitle")}</h2>
              <p className="text-xs text-muted font-mono uppercase tracking-wider" aria-live="polite">
                {loading ? t("gift.loading") : t("gift.resultsCount", { count: results.entries.length })}
              </p>
            </div>

            {failed ? (
              <div className="border border-gold/25 bg-navy2/60 rounded-lg p-10 text-center space-y-3 max-w-xl mx-auto">
                <h3 className="font-serif text-2xl text-ivory">{t("gift.failedTitle")}</h3>
                <p className="text-sm text-muted leading-relaxed">{t("gift.failedBody")}</p>
                <button type="button" onClick={() => void run()} className="btn-gold text-xs">
                  {t("gift.failedCta")}
                </button>
              </div>
            ) : loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-busy="true">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border border-gold/10 bg-navy2/50 animate-pulse h-96" aria-hidden="true" />
                ))}
              </div>
            ) : results.entries.length === 0 ? (
              <div className="border border-gold/25 bg-navy2/60 rounded-lg p-10 text-center space-y-3 max-w-xl mx-auto">
                <h3 className="font-serif text-2xl text-ivory">{t("gift.emptyTitle")}</h3>
                <p className="text-sm text-muted leading-relaxed">{t("gift.emptyBody")}</p>
                <Link to="/contact" className="btn-gold-fill font-sans text-xs inline-block">
                  {t("gift.emptyContactCta")}
                </Link>
              </div>
            ) : (
              <>
                {(askedFor.occasion || askedFor.mood || askedFor.season || askedFor.recipient) &&
                  !results.entries.some((entry) => entry.facets.length > 0) && (
                    <p className="text-xs text-gold/90 border border-gold/25 bg-navy2/40 rounded px-4 py-3 leading-relaxed">
                      {t("gift.noTaggedForChoice")}
                    </p>
                  )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {results.entries.map(({ product, facets: matched }) => (
                    <div key={product.id} className="space-y-3">
                      <ProductCard product={product} />
                      <div className="flex flex-wrap gap-1.5 px-1">
                        {matched.length > 0 ? (
                          matched.map((code) => (
                            <span key={code} className="text-[10px] font-mono uppercase tracking-wider text-gold/80 border border-gold/25 px-2 py-0.5">
                              {FACET_REASON_KEYS[code] ? t(FACET_REASON_KEYS[code]) : humaniseTag(code)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted border border-gold/15 px-2 py-0.5">
                            {t("gift.reasonBudgetOnly")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="border-t border-gold/15 pt-8 flex flex-wrap gap-4 justify-center">
              <Link to="/discover" className="link-underline text-sm">
                {t("gift.discoverCta")}
              </Link>
              <Link to="/scent-finder" className="link-underline text-sm">
                {t("gift.finderCta")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
