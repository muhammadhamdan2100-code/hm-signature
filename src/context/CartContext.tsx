import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product } from "../data/products";
import { dbService } from "../lib/supabase";

export interface CartItem {
  id: string; // unique item id: e.g. `${product.id}-${selectedSize}`
  product: Product;
  selectedSize: string; // e.g. "10ml", "30ml", "50ml", "100ml"
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
  promoDiscountAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = "hm-signature-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Migrate old format cart items if necessary
      return parsed.map((item: any) => ({
        id: item.id || `${item.product.id}-${item.selectedSize || item.product?.size || "50ml"}`,
        product: item.product,
        selectedSize: item.selectedSize || item.product?.size || "50ml",
        price: item.price ?? item.product?.price ?? 0,
        sku: item.sku || item.product?.sku || `HM-${item.product?.name?.slice(0, 3).toUpperCase()}-100`,
        quantity: item.quantity,
      }));
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoPercentage, setPromoPercentage] = useState(0);
  const [fixedDiscount, setFixedDiscount] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

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
    const price = variantPrice ?? matchedVariant?.price ?? product.price;
    const sku =
      variantSku ||
      matchedVariant?.sku ||
      (product as any).sku ||
      `HM-${product.name.slice(0, 3).toUpperCase()}-100`;
    const cartItemId = `${product.id}-${size}`;

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => (i.id || `${i.product.id}-${i.selectedSize}`) === cartItemId
      );

      if (existingIdx > -1) {
        const existing = prev[existingIdx];
        const currentStock = matchedVariant?.stock ?? (product as any).stock ?? 50;
        const targetQty = existing.quantity + quantity;
        if (targetQty > currentStock) {
          alert(`Maximum available stock reached for ${product.name} (${size}) [${currentStock} available].`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = {
          ...existing,
          selectedSize: size,
          price,
          sku,
          quantity: targetQty,
        };
        return updated;
      }

      return [
        ...prev,
        {
          id: cartItemId,
          product,
          selectedSize: size,
          price,
          sku,
          quantity,
        },
      ];
    });
    setIsOpen(true);
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id && i.product.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(id);
    setItems((prev) =>
      prev.map((i) => (i.id === id || i.product.id === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setPromoCode("");
    setPromoPercentage(0);
    setFixedDiscount(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const applyPromo = async (code: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return false;

    // First attempt database coupon lookup
    const dbCoupon = await dbService.validateCoupon(cleanCode);
    if (dbCoupon) {
      setPromoCode(dbCoupon.code);
      if (dbCoupon.type === "percentage") {
        setPromoPercentage(dbCoupon.value / 100);
        setFixedDiscount(0);
      } else {
        setFixedDiscount(dbCoupon.value);
        setPromoPercentage(0);
      }
      return true;
    }

    // Built-in luxury promo fallbacks
    if (cleanCode === "HMSIGNATURE10" || cleanCode === "SIGNATURE10") {
      setPromoCode("HMSIGNATURE10");
      setPromoPercentage(0.1);
      setFixedDiscount(0);
      return true;
    }
    if (cleanCode === "VIPLUXURY500") {
      setPromoCode("VIPLUXURY500");
      setFixedDiscount(500);
      setPromoPercentage(0);
      return true;
    }

    setPromoCode("");
    setPromoPercentage(0);
    setFixedDiscount(0);
    return false;
  };

  const rawSubtotal = items.reduce((sum, i) => sum + (i.price ?? i.product.price) * i.quantity, 0);
  const promoDiscountAmount = Math.round(rawSubtotal * promoPercentage + fixedDiscount);
  const subtotal = Math.max(0, rawSubtotal - promoDiscountAmount);
  const shipping = items.length === 0 || subtotal >= 6000 ? 0 : 300;
  const total = subtotal + shipping;
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
        subtotal,
        shipping,
        total,
        itemCount,
        promoCode,
        applyPromo,
        promoDiscountAmount,
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
