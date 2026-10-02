import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, Heart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import ProductVisual from "../components/ProductVisual";
import { formatPKR } from "../utils/currency";

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotal,
    shipping,
    total,
    applyPromo,
    promoCode,
    promoError,
    promoDiscountAmount,
    freeShippingThreshold,
  } = useCart();
  const { toggleWishlist } = useWishlist();
  const [promoInput, setPromoInput] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [promoFailed, setPromoFailed] = useState(false);

  const submitPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await applyPromo(promoInput);
    setPromoFailed(!ok);
    setPromoMsg(ok ? `${promoInput.trim().toUpperCase()} applied.` : "");
  };

  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="pt-24 bg-navy min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16">
        <h1 className="font-serif text-4xl mb-12">Your Shopping Bag</h1>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted mb-8">Your bag is currently empty.</p>
            <Link to="/collections" className="btn-gold-fill">DISCOVER FRAGRANCES →</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-14">
            <div className="space-y-8 min-w-0">
              {items.map((item) => {
                const itemId = item.id || `${item.product.id}-${item.selectedSize}`;
                const unitPrice = item.price ?? item.product.price;
                return (
                  <div key={itemId} className="flex gap-5 border-b border-gold/15 pb-8">
                    <Link to={`/product/${item.product.slug}`}>
                      <ProductVisual product={item.product} className="w-20 sm:w-28 h-32 shrink-0 flex items-center justify-center border border-gold/20" bottleSize="w-14" />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between gap-4">
                        <div>
                          <div className="text-[11px] text-muted tracking-widest mb-1">{item.product.category}</div>
                          <Link to={`/product/${item.product.slug}`} className="font-serif text-xl break-words">{item.product.name}</Link>
                          <div className="text-xs text-muted mt-1 font-sans flex items-center gap-2">
                            <span className="font-mono text-gold font-bold bg-gold/10 px-2 py-0.5 rounded border border-gold/30">
                              {item.selectedSize}
                            </span>
                            <span>•</span>
                            <span>{item.product.concentration}</span>
                          </div>
                        </div>
                        <span className="text-goldLight font-mono font-bold text-lg shrink-0 whitespace-nowrap">{formatPKR(unitPrice * item.quantity)}</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-y-3 mt-4">
                        <div className="flex items-center border border-gold/25">
                          <button aria-label="Decrease quantity" className="px-3 py-2 min-h-11 hover:text-gold inline-flex items-center" onClick={() => updateQuantity(itemId, item.quantity - 1)}>
                            <Minus size={13} />
                          </button>
                          <span className="px-4 text-sm font-mono font-bold text-ivory">{item.quantity}</span>
                          <button aria-label="Increase quantity" className="px-3 py-2 min-h-11 hover:text-gold inline-flex items-center" onClick={() => updateQuantity(itemId, item.quantity + 1)}>
                            <Plus size={13} />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted">
                          <button
                            onClick={() => {
                              toggleWishlist(item.product.id);
                              removeFromCart(itemId);
                            }}
                            className="flex items-center gap-1 min-h-11 hover:text-gold"
                          >
                            <Heart size={13} /> Save for later
                          </button>
                          <button onClick={() => removeFromCart(itemId)} className="flex items-center gap-1 min-h-11 hover:text-gold">
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <form onSubmit={submitPromo} className="flex gap-3 max-w-sm pt-4">
                <input
                  id="promo-code"
                  aria-label="Promotion code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="PROMO CODE"
                  className="flex-1 bg-transparent border border-gold/30 px-4 py-3 text-xs tracking-widest placeholder:text-muted focus:outline-none focus:border-gold"
                />
                <button type="submit" className="btn-gold">APPLY</button>
              </form>
              <p
                className={`text-xs -mt-4 ${promoFailed ? "text-rose-300" : "text-goldLight"}`}
                role="status"
                aria-live="polite"
              >
                {promoFailed ? promoError || "That code could not be applied." : promoMsg || "Enter a promotion code if you have one."}
              </p>
            </div>

            <div className="border border-gold/25 p-6 sm:p-8 h-fit lg:sticky top-28 min-w-0">
              <h3 className="font-serif text-xl mb-6">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted"><span>Subtotal</span><span className="text-ivory">{formatPKR(subtotal + promoDiscountAmount)}</span></div>
                {promoDiscountAmount > 0 && (
                  <div className="flex justify-between text-muted">
                    <span>Promo {promoCode}</span>
                    <span className="text-goldLight">− {formatPKR(promoDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted"><span>Shipping</span><span className="text-ivory">{shipping === 0 ? "Complimentary" : formatPKR(shipping)}</span></div>
                <div className="flex justify-between pt-4 border-t border-gold/15">
                  <span className="font-serif text-lg">Total</span>
                  <span className="font-serif text-lg text-goldLight">{formatPKR(total)}</span>
                </div>
                {remainingForFreeShipping > 0 && (
                  <p className="text-[11px] text-muted font-light leading-relaxed">
                    Add {formatPKR(remainingForFreeShipping)} more for complimentary delivery.
                  </p>
                )}
                <p className="text-[10px] text-muted/80 font-light leading-relaxed">
                  Delivery and any promotion are confirmed on the next step before you place the order.
                </p>
              </div>
              <Link to="/checkout" className="btn-gold-fill w-full text-center block mt-8">
                PROCEED TO CHECKOUT →
              </Link>
              <Link to="/collections" className="link-underline block text-center mt-5">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
