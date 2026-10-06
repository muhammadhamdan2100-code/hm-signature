import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Minus, Plus, Heart, Truck } from "lucide-react";
import {
  getProductBySlug as getStaticProductBySlug,
  products as staticProducts,
  generateDefaultVariants,
  type Product,
} from "../data/products";
import { getCatalogProductBySlug, getCatalogProducts, getProductReviews, submitProductReview } from "../services/catalog";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { useI18n } from "../i18n/I18nProvider";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { fetchShippingConfig, DEFAULT_SHIPPING_CONFIG } from "../services/storeConfig";
import TexturePanel from "../components/TexturePanel";
import Bottle from "../components/Bottle";
import Pedestal from "../components/Pedestal";
import ProductVisual from "../components/ProductVisual";
import { useCurrency } from "../context/CurrencyContext";
import StructuredData from "../components/StructuredData";
import { breadcrumbData, productData } from "../lib/seo";
import { effectiveVariantPrice } from "../data/products";
import ProductCard from "../components/ProductCard";
import RecommendationRail from "../components/RecommendationRail";
import LuxuryProductActions from "../components/LuxuryProductActions";
import { recordProductView } from "../services/recommendations";
import { captureProductView } from "../services/analyticsCapture";

const tabs = ["DESCRIPTION", "INGREDIENTS", "HOW TO WEAR", "SHIPPING & RETURNS", "REVIEWS"] as const;

export default function ProductPage() {
  const { t, language } = useI18n();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(() => getStaticProductBySlug(slug || "") || null);
  const [allProducts, setAllProducts] = useState<Product[]>(staticProducts);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { addToCart, freeShippingThreshold } = useCart();
  const { format, country } = useCurrency();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { recentIds, pushRecent } = useRecentlyViewed();
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<(typeof tabs)[number]>("DESCRIPTION");

  interface UiReview { name: string; text: string; rating: number; verified: boolean }
  const [dbReviews, setDbReviews] = useState<UiReview[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Delivery window comes from the store's shipping configuration — the same
  // settings read that already supplies freeShippingThreshold via the cart
  // context. Fetched once; falls back to the documented defaults.
  const [estimatedDays, setEstimatedDays] = useState<string>(DEFAULT_SHIPPING_CONFIG.estimatedDays);

  useEffect(() => {
    let mounted = true;
    fetchShippingConfig()
      .then((config) => {
        if (mounted) setEstimatedDays(config.estimatedDays);
      })
      .catch(() => {
        if (mounted) setEstimatedDays(DEFAULT_SHIPPING_CONFIG.estimatedDays);
      });
    return () => {
      mounted = false;
    };
  }, [language.code]);

  const isUuidId = !!product && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.id);

  // The destination rule carries the window; store-wide settings are the fallback.
  const deliveryEstimate =
    country && country.enabled && country.deliveryDaysMin && country.deliveryDaysMax
      ? t("shipping.daysRange", { from: country.deliveryDaysMin, to: country.deliveryDaysMax })
      : estimatedDays;

  useSeoMeta(
    `/product/${slug}`,
    product ? `${product.name} — HM Signature` : "HM Signature",
    product?.description,
    {
      type: "product",
      image: product?.photos?.[0],
      canonical: `/product/${slug}`,
    }
  );

  useEffect(() => {
    setDbReviews([]);
    setReviewMessage(null);
    if (product?.id && isUuidId) {
      getProductReviews(product.id).then(setDbReviews);
    }
  }, [product?.id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImage(0);
    setQty(1);
    setIsLoading(true);

    let mounted = true;
    Promise.all([
      getCatalogProductBySlug(slug || ""),
      getCatalogProducts(),
    ])
      .then(([foundProduct, catalogList]) => {
        if (mounted) {
          if (foundProduct) {
            setProduct(foundProduct);
            // LIFO, deduped, capped at 8 — handled inside the hook.
            pushRecent(foundProduct.id);
            // 8.1 — the same view, kept server-side for the signed-in customer only, so the
            // rails can be built from a real history rather than one browser.
            void recordProductView(foundProduct.id);
            // 9.4 — the same view for the funnel, recorded for guests too and with no
            // identity attached unless the shopper is signed in.
            captureProductView(foundProduct.id);
          } else {
            setProduct(null);
          }

          if (catalogList && catalogList.length > 0) {
            setAllProducts(catalogList);
          }
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
    // The catalogue is re-read on language change: the translated name/description come from
    // the database, so a switched language has to refetch rather than reuse cached rows.
  }, [slug, language.code]);

  const availableVariants = product?.variants && product.variants.length > 0
    ? product.variants.filter((v) => v.active !== false)
    : product
    ? generateDefaultVariants(product.price, (product as any).sku || "HM-PRD", product.stock)
    : [];

  const [selectedSize, setSelectedSize] = useState<string>("50ml");

  useEffect(() => {
    if (availableVariants.length > 0) {
      const has50 = availableVariants.find((v) => v.size.toLowerCase() === "50ml");
      setSelectedSize(has50 ? has50.size : availableVariants[0].size);
    }
  }, [slug, availableVariants.length]);

  const selectedVariant = availableVariants.find((v) => v.size.toLowerCase() === selectedSize.toLowerCase()) || availableVariants[0];
  const currentPrice = selectedVariant ? effectiveVariantPrice(selectedVariant) : product?.price || 0;
  const currentStock = selectedVariant ? selectedVariant.stock : product?.stock || 0;
  const lowStockThreshold = selectedVariant?.lowStockThreshold;
  const isLowStock = currentStock > 0 && lowStockThreshold != null && currentStock <= lowStockThreshold;

  const recentProducts = useMemo(() => {
    if (!product) return [] as Product[];
    return recentIds
      .filter((id) => id !== product.id)
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [recentIds, allProducts, product]);

  const declaredNoteTiers = [
    { label: t("product.topNotes"), notes: product?.topNotes ?? [] },
    { label: t("product.heartNotes"), notes: product?.heartNotes ?? [] },
    { label: t("product.baseNotes"), notes: product?.baseNotes ?? [] },
  ].filter((t) => t.notes.length > 0);

  if (isLoading && !product) {
    return (
      <div className="pt-40 pb-32 flex flex-col items-center justify-center min-h-[50vh] bg-navy">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono uppercase tracking-[2px] text-gold">{t("product.loadingAtelierCreation")}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-40 pb-32 text-center bg-navy min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-muted mb-6 font-serif text-lg">{t("product.fragranceNotFound")}</p>
        <button onClick={() => navigate("/collections")} className="btn-gold text-xs">
          {t("product.backToCollections")}
        </button>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);

  // The tab identifiers stay in English — they are what the panel conditions compare
  // against — only the rendered label follows the shopper's language.
  const tabLabel: Record<(typeof tabs)[number], string> = {
    DESCRIPTION: t("product.tabDescription"),
    INGREDIENTS: t("product.tabIngredients"),
"HOW TO WEAR": t("product.tabHowToWear"),
"SHIPPING & RETURNS": t("product.tabShippingReturns"),
    REVIEWS: t("product.tabReviews"),
  };

  return (
    <div className="pt-24 bg-navy">
      <StructuredData data={productData(product)} />
      <StructuredData
        data={breadcrumbData([
          { name: t("common.home"), path: "/" },
          { name: t("nav.collections"), path: "/collections" },
          { name: product.name, path: `/product/${product.slug}` },
        ])}
      />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-14">
        <div className="text-xs text-muted mb-10 tracking-wide">
          <Link to="/" className="hover:text-gold">{t("common.home")}</Link> / <Link to="/collections" className="hover:text-gold">{t("nav.collections")}</Link> / <span className="text-ivory">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-14">
          {/* Gallery */}
          <div className="min-w-0">
            <motion.div key={activeImage} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              {product.photos ? (
                <ProductVisual product={product} photoIndex={activeImage} className="aspect-square border border-gold/25" />
              ) : (
                <TexturePanel texture={product.images[activeImage]} className="aspect-square flex items-center justify-center border border-gold/25">
                  <div className="flex flex-col items-center">
                    <Bottle className="w-32" />
                    <Pedestal className="w-44 -mt-2" />
                  </div>
                </TexturePanel>
              )}
            </motion.div>
            <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-none" role="group" aria-label={t("product.imageThumbnails")}>
              {(product.photos || product.images).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  aria-label={t("product.viewImageOf", { index: i + 1, total: (product.photos || product.images).length })}
                  aria-pressed={activeImage === i}
                  className={`w-20 h-20 shrink-0 border min-h-[44px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                    activeImage === i ? "border-gold" : "border-gold/20"
                  }`}
                >
                  {product.photos ? (
                    <ProductVisual product={product} photoIndex={i} className="w-full h-full" />
                  ) : (
                    <TexturePanel texture={product.images[i]} className="w-full h-full flex items-center justify-center">
                      <Bottle className="w-9" />
                    </TexturePanel>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="min-w-0">
            <div className="eyebrow mb-3">{product.category}</div>
            <h1 className="font-serif text-4xl lg:text-5xl mb-4 break-words">{product.name}</h1>
            <div className="flex items-center gap-3 mb-6" role="status">
              {product.reviewCount > 0 ? (
                <>
                  <div className="flex gap-1" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill={i < Math.round(product.rating) ? "#E0C27A" : "none"} color="#E0C27A" />
                    ))}
                  </div>
                  <span className="text-xs text-muted">
                    {product.rating.toFixed(1)} ({product.reviewCount} {product.reviewCount === 1 ? t("product.reviewWord") : t("product.reviewsWord")})
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted italic">{t("product.notYetRated")}</span>
              )}
            </div>
            <div className="text-3xl text-goldLight font-serif mb-6">
              {currentPrice > 0 ? format(currentPrice) : t("product.priceOnRequest")}
            </div>
            <p className="text-muted leading-[1.9] mb-8 max-w-md">{product.description}</p>

            {/* Bottle Size Selector with per-size availability */}
            <div className="mb-8 space-y-3 font-sans">
              <div className="flex items-center justify-between text-xs tracking-widest text-muted uppercase">
                <span id="size-selector-label">{t("product.selectBottleSize")}</span>
                <span className="text-gold font-bold font-mono text-sm">{selectedSize}</span>
              </div>
              <div role="group" aria-labelledby="size-selector-label" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {availableVariants.map((v) => {
                  const isSelected = v.size.toLowerCase() === selectedSize.toLowerCase();
                  const isOutOfStock = v.stock <= 0;
                  const isLow =
                    !isOutOfStock && v.lowStockThreshold != null && v.stock <= v.lowStockThreshold;
                  const availability = isOutOfStock ? t("product.soldOutWord") : isLow ? t("product.nLeft", { count: v.stock }) : t("common.inStock");
                  return (
                    <button
                      key={v.size}
                      type="button"
                      disabled={isOutOfStock}
                      aria-pressed={isSelected}
                      aria-label={`${v.size}, ${v.price > 0 ? format(effectiveVariantPrice(v)) : t("product.priceOnRequestLower")}, ${availability}`}
                      onClick={() => setSelectedSize(v.size)}
                      className={`min-h-[44px] py-3 px-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center space-y-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                        isSelected
                          ? "bg-navy2 border-gold text-gold font-bold shadow-lg ring-1 ring-gold/40"
                          : isOutOfStock
                          ? "bg-navy/40 border-gold/10 text-muted/40 cursor-not-allowed line-through"
                          : "bg-navy/80 border-gold/20 text-ivory hover:border-gold/40 hover:text-gold"
                      }`}
                    >
                      <span className="text-xs font-mono font-bold tracking-wider">{v.size}</span>
                      <span className="text-[10px] font-mono text-goldLight">{format(effectiveVariantPrice(v))}</span>
                      <span
                        className={`text-[9px] font-mono tracking-wide ${
                          isOutOfStock ? "text-rose-400/70" : isLow ? "text-gold" : "text-emerald-400/80"
                        }`}
                      >
                        {availability}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specification panel — only fields the catalogue declares */}
            <div className="grid grid-cols-2 gap-4 mb-8 text-sm border-t border-gold/10 pt-6">
              {(product.fragranceFamily || product.category) && (
                <div>
                  <div className="text-[11px] text-muted tracking-widest mb-1">{t("product.fragranceFamilyLabel")}</div>
                  <div>{product.fragranceFamily || product.category}</div>
                </div>
              )}
              {product.intensity && (
                <div>
                  <div className="text-[11px] text-muted tracking-widest mb-1">{t("product.intensityLabel")}</div>
                  <div>{product.intensity}</div>
                </div>
              )}
              {(product.occasions?.length ?? 0) > 0 && (
                <div>
                  <div className="text-[11px] text-muted tracking-widest mb-1">{t("product.occasionLabel")}</div>
                  <div>{product.occasions!.join(" · ")}</div>
                </div>
              )}
              {(product.seasons?.length ?? 0) > 0 && (
                <div>
                  <div className="text-[11px] text-muted tracking-widest mb-1">{t("product.seasonLabel")}</div>
                  <div>{product.seasons!.join(" · ")}</div>
                </div>
              )}
              {product.concentration && (
                <div>
                  <div className="text-[11px] text-muted tracking-widest mb-1">{t("product.concentrationLabel")}</div>
                  <div>{product.concentration}</div>
                </div>
              )}
              {product.scentProfile && (
                <div>
                  <div className="text-[11px] text-muted tracking-widest mb-1">{t("product.scentProfileLabel")}</div>
                  <div>{product.scentProfile}</div>
                </div>
              )}
              <div>
                <div className="text-[11px] text-muted tracking-widest mb-1">{t("product.selectedSizeLabel")}</div>
                <div className="text-gold font-bold font-mono">{selectedSize}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted tracking-widest mb-1">{t("product.availabilityLabel")}</div>
                <div
                  role="status"
                  className={`font-medium ${
                    currentStock <= 0 ? "text-rose-400" : isLowStock ? "text-gold" : "text-emerald-400"
                  }`}
                >
                  {currentStock <= 0
                    ? t("product.availabilityOutOfStock")
                    : isLowStock
                    ? t("product.availabilityOnlyLeft", { count: currentStock })
                    : t("product.availabilityInStockCount", { count: currentStock })}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted tracking-widest mb-1">{t("product.genderLabel")}</div>
                <div className="capitalize">{product.gender}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gold/30 rounded" role="group" aria-label={t("common.quantity")}>
                <button
                  className="w-11 h-11 flex items-center justify-center hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label={t("product.decreaseQuantity")}
                  disabled={qty <= 1}
                >
                  <Minus size={14} />
                </button>
                <span className="px-5 text-sm" aria-live="polite">{qty}</span>
                <button
                  className="w-11 h-11 flex items-center justify-center hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label={t("product.increaseQuantity")}
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => toggleWishlist(product.id)}
                aria-pressed={wishlisted}
                aria-label={wishlisted ? t("product.removeFromWishlistShort") : t("product.addToWishlistShort")}
                className="w-12 h-12 border border-gold/30 flex items-center justify-center hover:border-gold shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                <Heart size={16} fill={wishlisted ? "#C8A96B" : "none"} color={wishlisted ? "#C8A96B" : "#F6F1E7"} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8 font-sans">
              <button
                onClick={() => addToCart(product, selectedSize, qty, currentPrice, selectedVariant?.sku)}
                disabled={currentStock <= 0}
                className="flex-1 min-w-0 btn-gold-fill text-center disabled:opacity-40"
              >
                {t("product.addToBagSize", { size: selectedSize })}
              </button>
              <button
                disabled={currentStock <= 0}
                onClick={() => {
                  addToCart(product, selectedSize, qty, currentPrice, selectedVariant?.sku);
                  navigate("/checkout");
                }}
                className="flex-1 min-w-0 btn-gold text-center disabled:opacity-40"
              >
                {t("product.buyNow")}
              </button>
            </div>

            {/* Phase 8 (8.9, 8.10, 8.11): edition, pre-order and waitlist, each shown only when the
                database says that fragrance is one of them. */}
            <LuxuryProductActions
              product={product}
              variantId={selectedVariant?.id || null}
              sizeLabel={selectedSize}
              totalStock={availableVariants.reduce((sum, variant) => sum + (variant.stock || 0), 0)}
            />

            <div className="flex items-center gap-3 text-xs text-muted border-t border-gold/15 pt-6">
              <Truck size={16} className="text-gold" aria-hidden="true" />
              {t("product.freeShippingShipsIn", { amount: format(freeShippingThreshold), estimate: deliveryEstimate.toLowerCase() })}
            </div>

            {/* Fragrance pyramid — only tiers the catalogue actually declares */}
            <div className="mt-10 border-t border-gold/15 pt-8">
              <h3 className="text-xs tracking-[2px] text-goldLight mb-6">{t("product.fragrancePyramid")}</h3>
              {declaredNoteTiers.length === 0 ? (
                <p className="text-sm text-muted italic">
                  {t("product.pyramidEmpty")}
                </p>
              ) : (
                <div
                  className="grid gap-4 text-sm"
                  style={{ gridTemplateColumns: `repeat(${declaredNoteTiers.length}, minmax(0, 1fr))` }}
                >
                  {declaredNoteTiers.map((tier) => (
                    <div key={tier.label}>
                      <div className="text-[11px] text-muted tracking-widest mb-2">{tier.label}</div>
                      {tier.notes.map((n) => (
                        <div key={n} className="mb-1">{n}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-20 border-t border-gold/15 pt-10">
          <div className="flex flex-wrap gap-2 sm:gap-6 mb-8 border-b border-gold/15 pb-4" role="tablist" aria-label={t("product.fragranceDetailsTabs")}>
            {tabs.map((tabId) => (
              <button
                key={tabId}
                role="tab"
                aria-selected={tab === tabId}
                onClick={() => setTab(tabId)}
                className={`text-xs tracking-[1.5px] px-2 sm:px-0 py-2 min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                  tab === tabId ? "text-gold border-b border-gold" : "text-muted hover:text-ivory"
                }`}
              >
                {tabLabel[tabId]}
              </button>
            ))}
          </div>
          <div className="max-w-2xl text-sm text-muted leading-[1.9]">
            {tab === "DESCRIPTION" && <p>{product.description}</p>}
            {tab === "INGREDIENTS" &&
              (product.ingredients && product.ingredients.trim() ? (
                <p>{product.ingredients}</p>
              ) : (
                <p className="italic">
                  {t("product.ingredientsEmpty")}
                </p>
              ))}
            {tab === "HOW TO WEAR" && (
              <p>
                {t("product.howToWearBody", { name: product.name })}
              </p>
            )}
            {tab === "SHIPPING & RETURNS" && (
              <p>
                {t("product.shippingReturnsBody", {
                  amount: format(freeShippingThreshold),
                  estimate: deliveryEstimate.toLowerCase(),
                })}
              </p>
            )}
            {tab === "REVIEWS" && (
              <div className="space-y-6">
                {dbReviews.length === 0 && product.reviews.length === 0 && (
                  <p className="text-xs text-muted italic">{t("product.noReviewsYet")}</p>
                )}
                {dbReviews.map((r, i) => (
                  <div key={`db-${i}`} className="border-b border-gold/10 pb-5">
                    <div className="flex gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} size={12} fill={s < r.rating ? "#E0C27A" : "none"} color="#E0C27A" />
                      ))}
                    </div>
                    <p className="text-ivory/90 mb-2">&ldquo;{r.text}&rdquo;</p>
                    <div className="text-xs">
                      {r.name} {r.verified && <span className="text-goldLight">{t("product.verifiedPurchase")}</span>}
                    </div>
                  </div>
                ))}
                {product.reviews.map((r, i) => (
                  <div key={i} className="border-b border-gold/10 pb-5">
                    <div className="flex gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} size={12} fill={s < r.rating ? "#E0C27A" : "none"} color="#E0C27A" />
                      ))}
                    </div>
                    <p className="text-ivory/90 mb-2">&ldquo;{r.text}&rdquo;</p>
                    <div className="text-xs">
                      {r.name} {r.verified && <span className="text-goldLight">{t("product.verifiedPurchase")}</span>}
                    </div>
                  </div>
                ))}

                {isUuidId && (
                  <form
                    className="pt-6 space-y-3 border-t border-gold/15"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!product || reviewComment.trim().length < 5) {
                        setReviewMessage({ ok: false, text: t("validation.reviewCommentRequired") });
                        return;
                      }
                      setReviewBusy(true);
                      setReviewMessage(null);
                      const res = await submitProductReview({
                        productId: product.id,
                        rating: reviewRating,
                        title: reviewTitle,
                        comment: reviewComment.trim(),
                      });
                      setReviewBusy(false);
                      if (res.success) {
                        setReviewTitle("");
                        setReviewComment("");
                        setReviewMessage({ ok: true, text: t("product.reviewAwaitingApproval") });
                      } else {
                        setReviewMessage({ ok: false, text: res.error || t("product.reviewSubmitFailed") });
                      }
                    }}
                  >
                    <h4 className="text-xs tracking-[2px] text-goldLight">{t("product.writeAReview")}</h4>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewRating(s + 1)}
                          aria-label={t("product.rateStars", { count: s + 1 })}
                        >
                          <Star size={16} fill={s < reviewRating ? "#E0C27A" : "none"} color="#E0C27A" />
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder={t("product.reviewTitlePlaceholder")}
                      className="w-full bg-transparent border border-gold/25 rounded-sm px-3 py-2 text-sm text-ivory placeholder:text-muted/60 focus:outline-none focus:border-gold"
                    />
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={t("product.reviewCommentPlaceholder")}
                      rows={3}
                      className="w-full bg-transparent border border-gold/25 rounded-sm px-3 py-2 text-sm text-ivory placeholder:text-muted/60 focus:outline-none focus:border-gold"
                    />
                    {reviewMessage && (
                      <p className={`text-xs ${reviewMessage.ok ? "text-goldLight" : "text-rose-300"}`}>
                        {reviewMessage.text}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={reviewBusy}
                      className="btn-gold text-xs px-6 py-2 disabled:opacity-40"
                    >
                      {reviewBusy ? t("product.submittingReview") : t("product.submitReview")}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 8.2 — ranked by the database from this fragrance's declared attributes plus the
            signed-in shopper's real history; falls back to the house selection rather than
            disappearing when nothing shares a family, note or category. */}
        <RecommendationRail kind="you_may_also_like" productId={product.id} recentIds={recentIds} limit={3} showReasons />

        {/* Only appears once two fragrances have genuinely been bought together. */}
        <RecommendationRail kind="frequently_paired" productId={product.id} limit={3} />

        {/* Recently viewed — LIFO from localStorage, excluding this fragrance */}
        {recentProducts.length > 0 && (
          <div className="mt-24">
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-serif text-3xl">{t("product.recentlyViewed")}</h3>
              <Link to="/collections" className="link-underline whitespace-nowrap">
                {t("product.allFragrances")}
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentProducts.slice(0, 3).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
