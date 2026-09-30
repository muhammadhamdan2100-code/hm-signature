import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import ProductVisual from "./ProductVisual";
import { formatPKR } from "../utils/currency";

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeFromCart, subtotal, shipping, total } = useCart();

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
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-navy2 border-l border-gold/25 z-[70] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-gold/20">
              <h3 className="font-serif text-xl tracking-wide">Your Bag ({items.length})</h3>
              <button onClick={closeCart} aria-label="Close cart">
                <X size={20} />
              </button>
            </div>

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
                        <div>
                          <div className="font-serif text-lg leading-tight">{item.product.name}</div>
                          <div className="flex items-center space-x-2 text-xs text-muted mt-1">
                            <span className="font-mono text-gold font-bold bg-gold/10 px-1.5 py-0.5 rounded border border-gold/30 text-[10px]">
                              {item.selectedSize}
                            </span>
                            <span>•</span>
                            <span>{item.product.concentration}</span>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(itemId)} aria-label="Remove" className="text-muted hover:text-gold">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-gold/25">
                          <button
                            className="px-2 py-1 hover:text-gold"
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            aria-label="Decrease"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-3 text-sm font-mono font-bold text-ivory">{item.quantity}</span>
                          <button
                            className="px-2 py-1 hover:text-gold"
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                            aria-label="Increase"
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
                <div className="flex flex-col gap-3 pt-3">
                  <Link to="/cart" onClick={closeCart} className="btn-gold text-center">
                    VIEW CART
                  </Link>
                  <Link to="/checkout" onClick={closeCart} className="btn-gold-fill text-center">
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
