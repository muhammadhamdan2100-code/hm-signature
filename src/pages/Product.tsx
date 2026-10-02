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
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { fetchShippingConfig, DEFAULT_SHIPPING_CONFIG } from "../services/storeConfig";
import TexturePanel from "../components/TexturePanel";
import Bottle from "../components/Bottle";
import Pedestal from "../components/Pedestal";
import ProductVisual from "../components/ProductVisual";
import { formatPKR } from "../utils/currency";
import { effectiveVariantPrice } from "../data/products";
import ProductCard from "../components/ProductCard";

const tabs = ["DESCRIPTION", "INGREDIENTS", "HOW TO WEAR", "SHIPPING & RETURNS", "REVIEWS"] as const;

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(() => getStaticProductBySlug(slug || "") || null);
  const [allProducts, setAllProducts] = useState<Product[]>(staticProducts);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { addToCart, freeShippingThreshold } = useCart();
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
  }, []);

  const isUuidId = !!product && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.id);

  useSeoMeta(
    `/product/${slug}`,
    product ? `${product.name} — HM Signature` : "HM Signature",
    product?.description
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
  }, [slug]);

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

  // "Similar fragrances" ranked only by real catalogue attributes:
  // shared family (3), same gender (2), same category (1), +1 per shared note.
  const similar = useMemo(() => {
    if (!product) return [] as Product[];
    const notesOf = (p: Product) =>
      new Set(
        [...p.topNotes, ...p.heartNotes, ...p.baseNotes]
          .map((n) => n.trim().toLowerCase())
          .filter(Boolean)
      );
    const selfNotes = notesOf(product);
    const selfFamily = product.fragranceFamily || product.category;
    return allProducts
      .filter((p) => p.id !== product.id)
      .map((p) => {
        const otherNotes = notesOf(p);
        let sharedNotes = 0;
        selfNotes.forEach((n) => {
          if (otherNotes.has(n)) sharedNotes += 1;
        });
        const score =
          ((p.fragranceFamily || p.category) === selfFamily ? 3 : 0) +
          (p.gender === product.gender ? 2 : 0) +
          (p.category === product.category ? 1 : 0) +
          sharedNotes;
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating)
      .slice(0, 3)
      .map((x) => x.p);
  }, [allProducts, product]);

  const recentProducts = useMemo(() => {
    if (!product) return [] as Product[];
    return recentIds
      .filter((id) => id !== product.id)
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [recentIds, allProducts, product]);

  const declaredNoteTiers = [
    { label: "TOP NOTES", notes: product?.topNotes ?? [] },
    { label: "HEART NOTES", notes: product?.heartNotes ?? [] },
    { label: "BASE NOTES", notes: product?.baseNotes ?? [] },
  ].filter((t) => t.notes.length > 0);

  if (isLoading && !product) {
    return (
      <div className="pt-40 pb-32 flex flex-col items-center justify-center min-h-[50vh] bg-navy">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono uppercase tracking-[2px] text-gold">Loading Atelier Creation...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-40 pb-32 text-center bg-navy min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-muted mb-6 font-serif text-lg">Fragrance not found.</p>
        <button onClick={() => navigate("/collections")} className="btn-gold text-xs">
          BACK TO COLLECTIONS
        </button>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);

  return (
    <div className="pt-24 bg-navy">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-14">
        <div className="text-xs text-muted mb-10 tracking-wide">
          <Link to="/" className="hover:text-gold">Home</Link> / <Link to="/collections" className="hover:text-gold">Collections</Link> / <span className="text-ivory">{product.name}</span>
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
            <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-none" role="group" aria-label="Product image thumbnails">
              {(product.photos || product.images).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1} of ${(product.photos || product.images).length}`}
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
                    {product.rating.toFixed(1)} ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted italic">Not yet rated by clients</span>
              )}
            </div>
            <div className="text-3xl text-goldLight font-serif mb-6">
              {currentPrice > 0 ? formatPKR(currentPrice) : "Price on request"}
            </div>
            <p className="text-muted leading-[1.9] mb-8 max-w-md">{product.description}</p>

            {/* Bottle Size Selector with per-size availability */}
            <div className="mb-8 space-y-3 font-sans">
              <div className="flex items-center justify-between text-xs tracking-widest text-muted uppercase">
                <span id="size-selector-label">SELECT BOTTLE SIZE:</span>
                <span className="text-gold font-bold font-mono text-sm">{selectedSize}</span>
              </div>
              <div role="group" aria-labelledby="size-selector-label" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {availableVariants.map((v) => {
                  const isSelected = v.size.toLowerCase() === selectedSize.toLowerCase();
                  const isOutOfStock = v.stock <= 0;
                  const isLow =
                    !isOutOfStock && v.lowStockThreshold != null && v.stock <= v.lowStockThreshold;
                  const availability = isOutOfStock ? "Sold out" : isLow ? `${v.stock} left` : "In stock";
                  return (
                    <button
                      key={v.size}
                      type="button"
                      disabled={isOutOfStock}
                      aria-pressed={isSelected}
                      aria-label={`${v.size}, ${v.price > 0 ? formatPKR(effectiveVariantPrice(v)) : "price on request"}, ${availability}`}
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
                      <span className="text-[10px] font-mono text-goldLight">{formatPKR(effectiveVariantPrice(v))}</span>
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
                  <div className="text-[11px] text-muted tracking-widest mb-1">FRAGRANCE FAMILY</div>
                  <div>{product.fragranceFamily || product.category}</div>
                </div>
              )}
              {product.intensity && (
                <div>
                  <div className="text-[11px] text-muted tracking-widest mb-1">INTENSITY</div>
                  <div>{product.intensity}</div>
                </div>
              )}
              {(product.occasions?.length ?? 0) > 0 && (
                <div>
                  <div className="text-[11px] text-muted tracking-widest mb-1">OCCASION</div>
                  <div>{product.occasions!.join(" · ")}</div>
                </div>
              )}
              {(product.seasons?.length ?? 0) > 0 && (
                <div>
                  <div className="text-[11px] text-muted tracking-widest mb-1">SEASON</div>
                  <div>{product.seasons!.join(" · ")}</div>
                </div>
              )}
              {product.concentration && (
                <div>
                  <div className="text-[11px] text-muted tracking-widest mb-1">CONCENTRATION</div>
                  <div>{product.concentration}</div>
                </div>
              )}
              {product.scentProfile && (
                <div>
                  <div className="text-[11px] text-muted tracking-widest mb-1">SCENT PROFILE</div>
                  <div>{product.scentProfile}</div>
                </div>
              )}
              <div>
                <div className="text-[11px] text-muted tracking-widest mb-1">SELECTED SIZE</div>
                <div className="text-gold font-bold font-mono">{selectedSize}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted tracking-widest mb-1">AVAILABILITY</div>
                <div
                  role="status"
                  className={`font-medium ${
                    currentStock <= 0 ? "text-rose-400" : isLowStock ? "text-gold" : "text-emerald-400"
                  }`}
                >
                  {currentStock <= 0
                    ? "OUT OF STOCK"
                    : isLowStock
                    ? `ONLY ${currentStock} LEFT`
                    : `IN STOCK (${currentStock} available)`}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted tracking-widest mb-1">GENDER</div>
                <div className="capitalize">{product.gender}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gold/30 rounded" role="group" aria-label="Quantity">
                <button
                  className="w-11 h-11 flex items-center justify-center hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  disabled={qty <= 1}
                >
                  <Minus size={14} />
                </button>
                <span className="px-5 text-sm" aria-live="polite">{qty}</span>
                <button
                  className="w-11 h-11 flex items-center justify-center hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => toggleWishlist(product.id)}
                aria-pressed={wishlisted}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className="w-12 h-12 border border-gold/30 flex items-center justify-center hover:border-gold shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                <Heart size={16} fill={wishlisted ? "#C8A96B" : "none"} color={wishlisted ? "#C8A96B" : "#F6F1E7"} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8 font-sans">
              <button
                onClick={() => addToCart(product, selectedSize, qty, currentPrice, selectedVariant?.sku)}
                disabled={currentStock <= 0}
                className="flex-1 btn-gold-fill text-center disabled:opacity-40"
              >
                ADD TO BAG ({selectedSize})
              </button>
              <button
                disabled={currentStock <= 0}
                onClick={() => {
                  addToCart(product, selectedSize, qty, currentPrice, selectedVariant?.sku);
                  navigate("/checkout");
                }}
                className="flex-1 btn-gold text-center disabled:opacity-40"
              >
                BUY NOW
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted border-t border-gold/15 pt-6">
              <Truck size={16} className="text-gold" aria-hidden="true" />
              Free shipping on orders over {formatPKR(freeShippingThreshold)} · Ships in {estimatedDays.toLowerCase()}
            </div>

            {/* Fragrance pyramid — only tiers the catalogue actually declares */}
            <div className="mt-10 border-t border-gold/15 pt-8">
              <h3 className="text-xs tracking-[2px] text-goldLight mb-6">FRAGRANCE PYRAMID</h3>
              {declaredNoteTiers.length === 0 ? (
                <p className="text-sm text-muted italic">
                  The full note pyramid for this fragrance hasn't been listed yet. Once our perfumers
                  publish it, it will appear here.
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
          <div className="flex flex-wrap gap-2 sm:gap-6 mb-8 border-b border-gold/15 pb-4" role="tablist" aria-label="Fragrance details">
            {tabs.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`text-xs tracking-[1.5px] px-2 sm:px-0 py-2 min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                  tab === t ? "text-gold border-b border-gold" : "text-muted hover:text-ivory"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="max-w-2xl text-sm text-muted leading-[1.9]">
            {tab === "DESCRIPTION" && <p>{product.description}</p>}
            {tab === "INGREDIENTS" && <p>{product.ingredients}</p>}
            {tab === "HOW TO WEAR" && (
              <p>
                Apply to pulse points — wrists, neck and behind the ears — after showering, when skin is
                warm. {product.name} is an extrait de parfum, so it is highly concentrated: start with 2–3
                sprays and add only if you want more presence.
              </p>
            )}
            {tab === "SHIPPING & RETURNS" && (
              <p>
                Free standard shipping on all orders over {formatPKR(freeShippingThreshold)}. Orders typically ship
                within {estimatedDays.toLowerCase()}. Unopened items may be returned within 30 days of delivery for a
                full refund.
              </p>
            )}
            {tab === "REVIEWS" && (
              <div className="space-y-6">
                {dbReviews.length === 0 && product.reviews.length === 0 && (
                  <p className="text-xs text-muted italic">No reviews yet. Be the first to share your impression.</p>
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
                      {r.name} {r.verified && <span className="text-goldLight">· Verified Purchase</span>}
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
                      {r.name} {r.verified && <span className="text-goldLight">· Verified Purchase</span>}
                    </div>
                  </div>
                ))}

                {isUuidId && (
                  <form
                    className="pt-6 space-y-3 border-t border-gold/15"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!product || reviewComment.trim().length < 5) {
                        setReviewMessage({ ok: false, text: "Please write a few words about the fragrance." });
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
                        setReviewMessage({ ok: true, text: "Thank you — your review is awaiting approval." });
                      } else {
                        setReviewMessage({ ok: false, text: res.error || "Could not submit your review." });
                      }
                    }}
                  >
                    <h4 className="text-xs tracking-[2px] text-goldLight">WRITE A REVIEW</h4>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewRating(s + 1)}
                          aria-label={`Rate ${s + 1} stars`}
                        >
                          <Star size={16} fill={s < reviewRating ? "#E0C27A" : "none"} color="#E0C27A" />
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Title (optional)"
                      className="w-full bg-transparent border border-gold/25 rounded-sm px-3 py-2 text-sm text-ivory placeholder:text-muted/60 focus:outline-none focus:border-gold"
                    />
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your impression of this fragrance…"
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
                      {reviewBusy ? "SUBMITTING…" : "SUBMIT REVIEW"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Similar fragrances — ranked by shared family, notes and gender */}
        {similar.length > 0 && (
          <div className="mt-24">
            <h3 className="font-serif text-3xl mb-10">Similar Fragrances</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {similar.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Recently viewed — LIFO from localStorage, excluding this fragrance */}
        {recentProducts.length > 0 && (
          <div className="mt-24">
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-serif text-3xl">Recently Viewed</h3>
              <Link to="/collections" className="link-underline whitespace-nowrap">
                ALL FRAGRANCES →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentProducts.slice(0, 3).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* When nothing shares a family, note or gender, offer a breadth pick */}
        {similar.length === 0 && recentProducts.length === 0 && allProducts.length > 1 && (
          <div className="mt-24">
            <h3 className="font-serif text-3xl mb-10">You May Also Love</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {allProducts.filter((p) => p.id !== product.id).slice(0, 3).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
