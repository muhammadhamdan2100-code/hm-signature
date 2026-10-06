import { Fragment, useEffect, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Hero from "../components/Hero";
import ValuesSection from "../components/ValuesSection";
import BrandStory from "../components/BrandStory";
import FeaturedProduct from "../components/FeaturedProduct";
import JournalSection from "../components/JournalSection";
import Reviews from "../components/Reviews";
import Newsletter from "../components/Newsletter";
import ProductCard from "../components/ProductCard";
import RecommendationRail from "../components/RecommendationRail";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { type Product } from "../data/products";
import { getCatalogProducts } from "../services/catalog";
import { useAdminData } from "../admin/context/AdminDataContext";
import { useI18n } from "../i18n/I18nProvider";
import { Link as RouterLink } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";

export default function Home() {
  // Start empty: fixtures only appear if the offline fallback in the service
  // hands them back — an empty catalogue is shown honestly, not masked.
  const [featuredList, setFeaturedList] = useState<Product[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { homepageConfig } = useAdminData();
  const { recentIds } = useRecentlyViewed();
  const { t, language } = useI18n();
  useSeoMeta("/", t("seo.homeTitle"), t("seo.homeDescription"));
  const announcement = homepageConfig.announcementBar;

  useEffect(() => {
    let mounted = true;
    getCatalogProducts()
      .then((prods) => {
        if (!mounted) return;
        const list = prods || [];
        const feat = list.filter((p) => p.featured);
        setFeaturedList(feat.length > 0 ? feat : list.slice(0, 3));
      })
      .finally(() => {
        if (mounted) setFeaturedLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [language.code]);

  useEffect(() => {
    const section = searchParams.get("section");
    if (section) {
      const el = document.getElementById(section);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    }
  }, [searchParams]);

  const blocks: Record<string, ReactNode> = {
    hero: <Hero hero={homepageConfig.hero} />,
    collections: (
      <section className="py-28" style={{ background: "linear-gradient(160deg, #2A0D13 0%, #3A1118 100%)" }}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="eyebrow mb-4">{t("home.collectionsEyebrow")}</div>
              <h2 className="font-serif text-4xl lg:text-5xl">{t("home.collectionsTitle")}</h2>
              <p className="text-muted mt-4 max-w-md leading-relaxed">
                {t("home.collectionsBody")}
              </p>
            </motion.div>
            <Link to="/collections" className="link-underline whitespace-nowrap">
              {t("home.viewAllCollections")}
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8" aria-busy="true" aria-live="polite">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-gold/10 bg-navy2/50 animate-pulse h-96" aria-hidden="true" />
              ))}
            </div>
          ) : featuredList.length === 0 ? (
            <div className="border border-gold/20 bg-navy2/40 p-10 text-center max-w-xl mx-auto">
              <p className="font-serif text-2xl mb-3">{t("home.collectionsEmptyTitle")}</p>
              <p className="text-muted text-sm leading-relaxed mb-6">
                {t("home.collectionsEmptyBody")}
              </p>
              <Link to="/scent-finder" className="btn-gold text-xs">
                {t("home.collectionsEmptyCta")}
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredList.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    ),
    // 8.1 — one ranked row, driven by whatever the database can prove about this shopper. With no
    // signals it becomes the house selection; the block never leaves a gap in the page.
    recommended: (
      <RecommendationRail kind="recommended_for_you" recentIds={recentIds} limit={4} showReasons />
    ),
    values: <ValuesSection />,
    story: <BrandStory />,
    spotlight: <FeaturedProduct />,
    journal: <JournalSection />,
    reviews: <Reviews />,
    newsletter: <Newsletter />,
  };

  const orderedSections = homepageConfig.sections
    .filter((s) => s.enabled && blocks[s.id])
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {announcement.enabled && announcement.text && (
        <RouterLink
          to={announcement.link || "/collections"}
          className="block bg-gold text-navy text-center text-[11px] tracking-[1.5px] py-2 font-sans uppercase"
        >
          {announcement.text}
        </RouterLink>
      )}

      {orderedSections.map((section) => (
        <Fragment key={section.id}>{blocks[section.id]}</Fragment>
      ))}
    </>
  );
}
