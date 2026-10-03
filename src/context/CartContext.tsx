import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Product } from "../data/products";
import { useAuth } from "./AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import { previewCoupon } from "../services/checkoutOps";
import { fetchShippingConfig, DEFAULT_SHIPPING_CONFIG, type ShippingConfig } from "../services/storeConfig";
import { clearServerCart, fetchServerCart, pushCartToServer } from "../services/cartSync";

export interface CartItem {
  id: string; // unique item id: e.g. `${product.id}-${selectedSize}`
  product: Product;
  selectedSize: string; // any catalogue size, e.g. "10ml", "75ml", "100ml"
  price: number; // variant price
  quantity: number;
  sku?: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (
    product: Product,
    selectedSize?: string,
    quantity?: number,
    variantPrice?: number,
    variantSku?: string
  ) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
  promoCode: string;
  applyPromo: (code: string) => Promise<boolean>;
  clearPromo: () => void;
  promoError: string;
  promoDiscountAmount: number;
  freeShippingThreshold: number;
  syncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = "hm-signature-cart";
const PROMO_KEY = "hm-signature-promo";

function readStoredPromo(): string {
  try {
    const raw = localStorage.getItem(PROMO_KEY);
    return typeof raw === "string" ? raw.trim().toUpperCase() : "";
  } catch {
    return "";
  }
}

function readStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item: any) => item?.product?.id)
      .map((item: any) => ({
        id: item.id || `${item.product.id}-${item.selectedSize || item.product?.size || "50ml"}`,
        product: item.product,
        selectedSize: item.selectedSize || item.product?.size || "50ml",
        price: item.price ?? item.product?.price ?? 0,
        sku: item.sku || item.product?.sku || "",
        quantity: Number(item.quantity) || 1,
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(readStoredCart);
  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoCode] = useState(readStoredPromo);
  const [promoPercentage, setPromoPercentage] = useState(0);
  const [fixedDiscount, setFixedDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(DEFAULT_SHIPPING_CONFIG);
  const [syncing, setSyncing] = useState(false);

  const hydratedForUser = useRef<string | null>(null);
  const pushTimer = useRef<number | null>(null);

  useEffect(() => {
    fetchShippingConfig().then(setShippingConfig).catch(() => setShippingConfig(DEFAULT_SHIPPING_CONFIG));
  }, []);

  // Keep a local mirror for guests and for the next visit.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage may be unavailable in private mode */
    }
  }, [items]);

  // Only the code is remembered, never its money value — that is recomputed from the
  // catalogue on arrival, so an edited or expired coupon cannot survive a refresh.
  useEffect(() => {
    try {
      if (promoCode) localStorage.setItem(PROMO_KEY, promoCode);
      else localStorage.removeItem(PROMO_KEY);
    } catch {
      /* storage may be unavailable in private mode */
    }
  }, [promoCode]);

  // Signed-in: pull the server bag once per session, then push changes to it.
  useEffect(() => {
    if (!isSupabaseConfigured() || !user?.id) return;
    if (hydratedForUser.current === user.id) return;
    hydratedForUser.current = user.id;

    let mounted = true;
    fetchServerCart()
      .then((serverItems) => {
        if (!mounted) return;
        if (serverItems.length > 0) setItems(serverItems);
      })
      .catch(() => {
        /* the local bag remains usable if the server read fails */
      });
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !user?.id) return;
    if (pushTimer.current) window.clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(() => {
      setSyncing(true);
      pushCartToServer(items)
        .catch(() => undefined)
        .finally(() => setSyncing(false));
    }, 900);
    return () => {
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
    };
  }, [items, user?.id]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const addToCart = (
    product: Product,
    selectedSize?: string,
    quantity = 1,
    variantPrice?: number,
    variantSku?: string
  ) => {
    const size = selectedSize || product.size || "50ml";
    const matchedVariant = product.variants?.find((v) => v.size.toLowerCase() === size.toLowerCase());
    const price = variantPrice ?? matchedVariant?.salePrice ?? matchedVariant?.price ?? product.price;
    const sku = variantSku || matchedVariant?.sku || product.sku || "";
    const cartItemId = `${product.id}-${size}`;
    const stockCeiling = matchedVariant?.stock ?? product.stock ?? 0;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === cartItemId);

      if (existingIdx > -1) {
        const existing = prev[existingIdx];
        const targetQty = existing.quantity + quantity;
        if (stockCeiling > 0 && targetQty > stockCeiling) {
          window.alert(`Only ${stockCeiling} of ${product.name} (${size}) is available right now.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = { ...existing, selectedSize: size, price, sku, quantity: targetQty };
        return updated;
      }

      if (stockCeiling > 0 && quantity > stockCeiling) {
        window.alert(`Only ${stockCeiling} of ${product.name} (${size}) is available right now.`);
        return prev;
      }

      return [...prev, { id: cartItemId, product, selectedSize: size, price, sku, quantity }];
    });
    setIsOpen(true);
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id && i.product.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(id);
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id && i.product.id !== id) return i;
        const variant = i.product.variants?.find(
          (v) => (v.size || "").toLowerCase() === (i.selectedSize || "").toLowerCase()
        );
        const ceiling = variant?.stock ?? i.product.stock ?? 0;
        if (ceiling > 0 && quantity > ceiling) {
          window.alert(`Only ${ceiling} of ${i.product.name} (${i.selectedSize}) is available right now.`);
          return { ...i, quantity: ceiling };
        }
        return { ...i, quantity };
      })
    );
  };

  const resetPromo = () => {
    setPromoCode("");
    setPromoPercentage(0);
    setFixedDiscount(0);
  };

  const clearPromo = () => {
    resetPromo();
    setPromoError("");
  };

  const clearCart = () => {
    setItems([]);
    clearPromo();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (isSupabaseConfigured() && user?.id) {
      void clearServerCart();
    }
  };

  const rawSubtotal = items.reduce((sum, i) => sum + (i.price ?? i.product.price) * i.quantity, 0);

  // A code that qualified for a bigger bag must not stay applied: the server
  // re-checks min_spend, validity window and usage limits inside place_order, so
  // the bag is re-validated here and the reason is surfaced before checkout.
  const promoCheckedFor = useRef("");
  useEffect(() => {
    if (!promoCode) {
      promoCheckedFor.current = "";
      return;
    }
    const fingerprint = `${promoCode}:${rawSubtotal}`;
    if (promoCheckedFor.current === fingerprint) return;
    promoCheckedFor.current = fingerprint;

    let mounted = true;
    previewCoupon(promoCode, rawSubtotal)      .then((result) => {
        if (!mounted) return;
        if (!result.valid || !result.type) {
          resetPromo();
          setPromoError(result.reason || `${promoCode} no longer applies to this bag.`);
          return;
        }
        // Only the code survives a refresh, so the money value is re-derived here with
        // the same maths applyPromo uses. Writing the same numbers back is a no-op, so
        // this also keeps the discount honest whenever the bag changes size.
        if (result.type === "percentage") {
          let discount = Math.round(rawSubtotal * ((result.value || 0) / 100));
          if (result.maxDiscount != null) discount = Math.min(discount, result.maxDiscount);
          setPromoPercentage(rawSubtotal > 0 && discount > 0 ? discount / rawSubtotal : 0);
          setFixedDiscount(0);
        } else {
          setFixedDiscount(Math.min(result.value || 0, rawSubtotal));
          setPromoPercentage(0);
        }
      })
      .catch(() => {
        /* a failed re-check leaves the server as the final authority */
      });
    return () => {
      mounted = false;
      // StrictMode mounts, cleans up and mounts again. Without releasing the guard the
      // second pass would skip the check whose result the first pass threw away, and a
      // restored discount would silently compute to nothing.
      if (promoCheckedFor.current === fingerprint) promoCheckedFor.current = "";
    };
  }, [promoCode, rawSubtotal]);


  // The catalogue is the only source of a discount; place_order re-checks it
  // server-side before any money is charged.
  const applyPromo = async (code: string): Promise<boolean> => {
    const clean = code.trim().toUpperCase();
    setPromoError("");

    if (!clean) {
      resetPromo();
      setPromoError("Enter a promotion code.");
      return false;
    }

    const result = await previewCoupon(clean, rawSubtotal);
    if (!result.valid || !result.type) {
      resetPromo();
      setPromoError(result.reason || "That code is not recognised.");
      return false;
    }

    let discount = 0;
    if (result.type === "percentage") {
      discount = Math.round(rawSubtotal * ((result.value || 0) / 100));
      if (result.maxDiscount != null) discount = Math.min(discount, result.maxDiscount);
      setPromoPercentage(discount > 0 ? discount / rawSubtotal : 0);
      setFixedDiscount(0);
    } else {
      discount = Math.min(result.value || 0, rawSubtotal);
      setFixedDiscount(discount);
      setPromoPercentage(0);
    }

    setPromoCode(result.code);
    return true;
  };

  const promoDiscountAmount = Math.min(
    Math.round(rawSubtotal * promoPercentage + fixedDiscount),
    Math.round(rawSubtotal)
  );
  const subtotalAfterDiscount = Math.max(0, rawSubtotal - promoDiscountAmount);
  const shipping =
    items.length === 0 || subtotalAfterDiscount >= shippingConfig.freeThreshold
      ? 0
      : shippingConfig.standardCost;
  const total = subtotalAfterDiscount + shipping;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal: subtotalAfterDiscount,
        shipping,
        total,
        itemCount,
        promoCode,
        applyPromo,
        clearPromo,
        promoError,
        promoDiscountAmount,
        freeShippingThreshold: shippingConfig.freeThreshold,
        syncing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
