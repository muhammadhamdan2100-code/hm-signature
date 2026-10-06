import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { useI18n } from "../i18n/I18nProvider";
import { fetchRecommendationRail, RECOMMENDATION_REASON_KEYS, type RecommendationKind } from "../services/recommendations";
import type { Product } from "../data/products";

/** Keys stay literal so the dictionary parity test can see every one of them. */
const TITLE_KEYS: Record<RecommendationKind, string> = {
  recommended_for_you: "recommendations.titleRecommendedForYou",
  you_may_also_like: "recommendations.titleYouMayAlsoLike",
  because_you_viewed: "recommendations.titleBecauseYouViewed",
  similar_fragrances: "recommendations.titleSimilarFragrances",
  complete_your_collection: "recommendations.titleCompleteYourCollection",
  frequently_paired: "recommendations.titleFrequentlyPaired",
};

interface RecommendationRailProps {
  kind: RecommendationKind;
  productId?: string | null;
  recentIds?: string[];
  limit?: number;
  gender?: string | null;
  /** Set for rails that only make sense with a real personal signal; they hide themselves otherwise. */
  requirePersonalisation?: boolean;
  showReasons?: boolean;
  ctaTo?: string;
  ctaKey?: string;
}

/**
 * A single ranked row of fragrances. The title changes with the honest basis of the ranking: a
 * shopper with no history is offered "Signature selection", never "Recommended for you", because
 * nothing about them was used to build the list.
 */
export function RecommendationRail({
  kind,
  productId = null,
  recentIds,
  limit = 4,
  gender = null,
  requirePersonalisation = false,
  showReasons = false,
  ctaTo,
  ctaKey,
}: RecommendationRailProps) {
  const { t, language } = useI18n();
  const [items, setItems] = useState<Product[]>([]);
  const [basis, setBasis] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const recentKey = useMemo(() => (recentIds || []).slice(0, 12).join(","), [recentIds]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchRecommendationRail({ kind, productId, recentIds: recentKey ? recentKey.split(",") : undefined, limit, gender })
      .then((rail) => {
        if (!mounted) return;
        setItems(rail.items);
        setBasis(rail.basis);
        setReasons(rail.reasons);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [kind, productId, recentKey, limit, gender, language.code]);

  if (!loading && requirePersonalisation && basis !== "personalized") return null;
  if (!loading && items.length === 0) return null;

  const personalised = basis === "personalized";
  const titleKey = personalised ? TITLE_KEYS[kind] : "recommendations.titleSignatureSelection";

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="eyebrow mb-3">{t(personalised ? "recommendations.eyebrowPersonal" : "recommendations.eyebrowHouse")}</div>
            <h2 className="font-serif text-3xl lg:text-4xl">{t(titleKey)}</h2>
            {personalised && (
              <p className="text-muted text-xs mt-3 max-w-md leading-relaxed">{t("recommendations.whyNote")}</p>
            )}
          </motion.div>
          {ctaTo && ctaKey && (
            <Link to={ctaTo} className="link-underline whitespace-nowrap">
              {t(ctaKey)}
            </Link>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-busy={loading} aria-live="polite">
          {loading
            ? Array.from({ length: limit }).map((_, i) => (
                <div key={i} className="border border-gold/10 bg-navy2/50 animate-pulse h-96" aria-hidden="true" />
              ))
            : items.map((product) => (
                <div key={product.id} className="space-y-2">
                  <ProductCard product={product} />
                  {showReasons && (reasons[product.id] || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {(reasons[product.id] || []).slice(0, 2).map((code) => {
                        const key = RECOMMENDATION_REASON_KEYS[code];
                        if (!key) return null;
                        return (
                          <span key={code} className="text-[10px] font-mono uppercase tracking-wider text-gold/80 border border-gold/25 px-2 py-0.5">
                            {t(key)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

export default RecommendationRail;
