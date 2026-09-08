import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Minus, Plus, Heart, Truck } from "lucide-react";
import { getProductBySlug, products } from "../data/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import TexturePanel from "../components/TexturePanel";
import Bottle from "../components/Bottle";
import Pedestal from "../components/Pedestal";
import ProductVisual from "../components/ProductVisual";
import { formatPKR } from "../utils/currency";
import ProductCard from "../components/ProductCard";

const tabs = ["DESCRIPTION", "INGREDIENTS", "HOW TO WEAR", "SHIPPING & RETURNS", "REVIEWS"] as const;

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const product = getProductBySlug(slug || "");
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<(typeof tabs)[number]>("DESCRIPTION");

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImage(0);
    setQty(1);
    if (product) {
      const raw = localStorage.getItem("hm-signature-recent");
      const recent: string[] = raw ? JSON.parse(raw) : [];
      const updated = [product.id, ...recent.filter((id) => id !== product.id)].slice(0, 6);
      localStorage.setItem("hm-signature-recent", JSON.stringify(updated));
    }
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!product) {
    return (
      <div className="pt-40 pb-32 text-center">
        <p className="text-muted mb-6">Fragrance not found.</p>
        <button onClick={() => navigate("/collections")} className="btn-gold">
          BACK TO COLLECTIONS
        </button>
      </div>
    );
  }

  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 3);
  const relatedFallback = related.length > 0 ? related : products.filter((p) => p.id !== product.id).slice(0, 3);
  const wishlisted = isWishlisted(product.id);

  return (
    <div className="pt-24 bg-navy">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-14">
        <div className="text-xs text-muted mb-10 tracking-wide">
          <Link to="/" className="hover:text-gold">Home</Link> / <Link to="/collections" className="hover:text-gold">Collections</Link> / <span className="text-ivory">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-14">
          {/* Gallery */}
          <div>
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
            <div className="flex gap-3 mt-4">
              {(product.photos || product.images).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-20 shrink-0 border ${activeImage === i ? "border-gold" : "border-gold/20"}`}
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
          <div>
            <div className="eyebrow mb-3">{product.category}</div>
            <h1 className="font-serif text-4xl lg:text-5xl mb-4">{product.name}</h1>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill={i < Math.round(product.rating) ? "#E0C27A" : "none"} color="#E0C27A" />
                ))}
              </div>
              <span className="text-xs text-muted">{product.rating} ({product.reviewCount} reviews)</span>
            </div>
            <div className="text-3xl text-goldLight font-serif mb-6">{formatPKR(product.price)}</div>
            <p className="text-muted leading-[1.9] mb-8 max-w-md">{product.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
              <div>
                <div className="text-[11px] text-muted tracking-widest mb-1">CONCENTRATION</div>
                <div>{product.concentration}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted tracking-widest mb-1">SIZE</div>
                <div>{product.size}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted tracking-widest mb-1">AVAILABILITY</div>
                <div className="text-goldLight">{product.stock > 0 ? "IN STOCK" : "OUT OF STOCK"}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted tracking-widest mb-1">GENDER</div>
                <div className="capitalize">{product.gender}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gold/30">
                <button className="px-4 py-3 hover:text-gold" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
                  <Minus size={14} />
                </button>
                <span className="px-5 text-sm">{qty}</span>
                <button className="px-4 py-3 hover:text-gold" onClick={() => setQty((q) => q + 1)} aria-label="Increase">
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => toggleWishlist(product.id)}
                className="w-12 h-12 border border-gold/30 flex items-center justify-center hover:border-gold shrink-0"
                aria-label="Wishlist"
              >
                <Heart size={16} fill={wishlisted ? "#C8A96B" : "none"} color={wishlisted ? "#C8A96B" : "#F6F1E7"} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button onClick={() => addToCart(product, qty)} className="flex-1 btn-gold-fill text-center">
                ADD TO CART
              </button>
              <button
                onClick={() => {
                  addToCart(product, qty);
                  navigate("/checkout");
                }}
                className="flex-1 btn-gold text-center"
              >
                BUY NOW
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted border-t border-gold/15 pt-6">
              <Truck size={16} className="text-gold" />
              Free shipping on orders over Rs 6,000 · Ships in 2–4 business days
            </div>

            {/* Fragrance notes */}
            <div className="mt-10 border-t border-gold/15 pt-8">
              <h3 className="text-xs tracking-[2px] text-goldLight mb-6">FRAGRANCE NOTES</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-[11px] text-muted tracking-widest mb-2">TOP NOTES</div>
                  {product.topNotes.map((n) => <div key={n} className="mb-1">{n}</div>)}
                </div>
                <div>
                  <div className="text-[11px] text-muted tracking-widest mb-2">HEART NOTES</div>
                  {product.heartNotes.map((n) => <div key={n} className="mb-1">{n}</div>)}
                </div>
                <div>
                  <div className="text-[11px] text-muted tracking-widest mb-2">BASE NOTES</div>
                  {product.baseNotes.map((n) => <div key={n} className="mb-1">{n}</div>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-20 border-t border-gold/15 pt-10">
          <div className="flex flex-wrap gap-6 mb-8 border-b border-gold/15 pb-4">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs tracking-[1.5px] pb-2 transition-colors ${tab === t ? "text-gold border-b border-gold" : "text-muted hover:text-ivory"}`}
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
                warm and hydrated. As an extrait de parfum, {product.name} is highly concentrated: 2–3
                sprays are enough to last well into the evening.
              </p>
            )}
            {tab === "SHIPPING & RETURNS" && (
              <p>
                Free standard shipping on all orders over Rs 6,000. Orders ship within 2–4 business days.
                Unopened items may be returned within 30 days of delivery for a full refund.
              </p>
            )}
            {tab === "REVIEWS" && (
              <div className="space-y-6">
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
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        <div className="mt-24">
          <h3 className="font-serif text-3xl mb-10">You May Also Love</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedFallback.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
