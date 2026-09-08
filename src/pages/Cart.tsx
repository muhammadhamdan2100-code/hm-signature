import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, Heart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import ProductVisual from "../components/ProductVisual";
import { formatPKR } from "../utils/currency";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal, shipping, total, applyPromo, promoCode } = useCart();
  const { toggleWishlist } = useWishlist();
  const [promoInput, setPromoInput] = useState("");
  const [promoMsg, setPromoMsg] = useState("");

  const submitPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = applyPromo(promoInput);
    setPromoMsg(ok ? "Promo code applied — 10% off!" : "Invalid promo code.");
  };

  const tax = subtotal * 0.08;

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
            <div className="space-y-8">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-5 border-b border-gold/15 pb-8">
                  <Link to={`/product/${item.product.slug}`}>
                    <ProductVisual product={item.product} className="w-28 h-32 shrink-0 flex items-center justify-center border border-gold/20" bottleSize="w-14" />
                  </Link>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between gap-4">
                      <div>
                        <div className="text-[11px] text-muted tracking-widest mb-1">{item.product.category}</div>
                        <Link to={`/product/${item.product.slug}`} className="font-serif text-xl">{item.product.name}</Link>
                        <div className="text-xs text-muted mt-1">{item.product.concentration} · {item.product.size}</div>
                      </div>
                      <span className="text-goldLight">{formatPKR(item.product.price * item.quantity)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gold/25">
                        <button className="px-3 py-2 hover:text-gold" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                          <Minus size={13} />
                        </button>
                        <span className="px-4 text-sm">{item.quantity}</span>
                        <button className="px-3 py-2 hover:text-gold" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                          <Plus size={13} />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <button
                          onClick={() => {
                            toggleWishlist(item.product.id);
                            removeFromCart(item.product.id);
                          }}
                          className="flex items-center gap-1 hover:text-gold"
                        >
                          <Heart size={13} /> Save for later
                        </button>
                        <button onClick={() => removeFromCart(item.product.id)} className="flex items-center gap-1 hover:text-gold">
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <form onSubmit={submitPromo} className="flex gap-3 max-w-sm pt-4">
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="PROMO CODE"
                  className="flex-1 bg-transparent border border-gold/30 px-4 py-3 text-xs tracking-widest placeholder:text-muted focus:outline-none focus:border-gold"
                />
                <button type="submit" className="btn-gold">APPLY</button>
              </form>
              {promoMsg && <p className="text-xs text-goldLight -mt-4">{promoMsg}</p>}
              {!promoMsg && <p className="text-xs text-muted -mt-4">Try code SIGNATURE10 for 10% off.</p>}
            </div>

            <div className="border border-gold/25 p-8 h-fit sticky top-28">
              <h3 className="font-serif text-xl mb-6">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted"><span>Subtotal</span><span className="text-ivory">{formatPKR(subtotal)}</span></div>
                {promoCode && <div className="flex justify-between text-muted"><span>Promo ({promoCode})</span><span className="text-goldLight">Applied</span></div>}
                <div className="flex justify-between text-muted"><span>Shipping</span><span className="text-ivory">{shipping === 0 ? "Free" : formatPKR(shipping)}</span></div>
                <div className="flex justify-between text-muted"><span>Estimated Tax</span><span className="text-ivory">{formatPKR(tax)}</span></div>
                <div className="flex justify-between pt-4 border-t border-gold/15">
                  <span className="font-serif text-lg">Total</span>
                  <span className="font-serif text-lg text-goldLight">{formatPKR(total + tax)}</span>
                </div>
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
