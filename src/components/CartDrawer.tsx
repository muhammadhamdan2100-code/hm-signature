import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import ProductVisual from "./ProductVisual";
import { formatPKR } from "../utils/currency";

export default function CartDrawer() {
  const {
    items, isOpen, closeCart, updateQuantity, removeFromCart,
    subtotal, shipping, total, freeShippingThreshold, syncing,
  } = useCart();
  const { user } = useAuth();

  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progress =
    freeShippingThreshold > 0 ? Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100)) : 0;

  // The bag is a modal panel: Escape must close it like every other dialog.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={closeCart}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-navy2 border-l border-gold/25 z-[70] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gold/20">
              <h3 className="font-serif text-xl tracking-wide">Your Bag ({items.length})</h3>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="w-11 h-11 -mr-2 flex items-center justify-center text-muted hover:text-ivory focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* Free delivery progress — threshold comes from store config via context */}
            {items.length > 0 && (
              <div className="px-6 py-4 border-b border-gold/15" role="status" aria-live="polite">
                {remainingForFreeShipping > 0 ? (
                  <p className="text-[11px] text-muted tracking-wide mb-2">
                    Add <span className="text-goldLight font-mono font-bold">{formatPKR(remainingForFreeShipping)}</span>{" "}
                    more for free delivery
                  </p>
                ) : (
                  <p className="text-[11px] text-goldLight tracking-wide mb-2 flex items-center gap-2">
                    <Check size={13} aria-hidden="true" /> Free delivery unlocked
                  </p>
                )}
                <div
                  className="h-1 w-full bg-navy border border-gold/20 rounded-full overflow-hidden"
                  aria-hidden="true"
                >
                  <div
                    className="h-full bg-gold transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
              {items.length === 0 && (
                <div className="text-center text-muted text-sm mt-16">
                  Your bag is empty.
                  <div className="mt-6">
                    <Link to="/collections" onClick={closeCart} className="btn-gold">
                      DISCOVER FRAGRANCES →
                    </Link>
                  </div>
                </div>
              )}
              {items.map((item) => {
                const itemId = item.id || `${item.product.id}-${item.selectedSize}`;
                const unitPrice = item.price ?? item.product.price;
                return (
                  <div key={itemId} className="flex gap-4">
                    <ProductVisual product={item.product} className="w-20 h-24 shrink-0 flex items-center justify-center" bottleSize="w-10" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-serif text-lg leading-tight">{item.product.name}</div>
                          <div className="flex items-center space-x-2 text-xs text-muted mt-1">
                            <span className="font-mono text-gold font-bold bg-gold/10 px-1.5 py-0.5 rounded border border-gold/30 text-[10px]">
                              {item.selectedSize}
                            </span>
                            <span>•</span>
                            <span className="truncate">{item.product.concentration}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(itemId)}
                          aria-label={`Remove ${item.product.name} from bag`}
                          className="w-11 h-11 -mt-1 -mr-2 shrink-0 flex items-center justify-center text-muted hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-gold/25 rounded">
                          <button
                            className="w-11 h-11 flex items-center justify-center hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.product.name}`}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-2 text-sm font-mono font-bold text-ivory min-w-[2.5rem] text-center" aria-label="Quantity">
                            {item.quantity}
                          </span>
                          <button
                            className="w-11 h-11 flex items-center justify-center hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.product.name}`}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-goldLight font-mono text-sm font-bold">{formatPKR(unitPrice * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gold/20 px-6 py-6 space-y-3">
                <div className="flex justify-between text-sm text-muted">
                  <span>Subtotal</span>
                  <span className="text-ivory">{formatPKR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted">
                  <span>Shipping</span>
                  <span className="text-ivory">{shipping === 0 ? "Free" : formatPKR(shipping)}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-gold/10">
                  <span className="font-serif text-lg">Total</span>
                  <span className="font-serif text-lg text-goldLight">{formatPKR(total)}</span>
                </div>

                {/* Subtle persistence cue for signed-in clients */}
                {user && (
                  <div aria-live="polite" className="h-4">
                    {syncing ? (
                      <span className="text-[10px] font-mono tracking-widest text-muted uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" aria-hidden="true" />
                        Saving your bag…
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono tracking-widest text-gold/60 uppercase flex items-center gap-2">
                        <Check size={11} aria-hidden="true" /> Saved to your bag
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-3">
                  <Link
                    to="/cart"
                    onClick={closeCart}
                    className="btn-gold text-center min-h-[44px] inline-flex items-center justify-center"
                  >
                    VIEW CART
                  </Link>
                  <Link
                    to="/checkout"
                    onClick={closeCart}
                    className="btn-gold-fill text-center min-h-[44px] inline-flex items-center justify-center"
                  >
                    CHECKOUT →
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
