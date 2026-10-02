import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const STORAGE_KEY = "hm-signature-wishlist";

const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

async function findWishlistId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

async function createWishlistId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("wishlists")
    .insert([{ user_id: userId }])
    .select("id")
    .single();
  return error ? null : data.id;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const wishlistTableId = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  // Load server-side wishlist whenever an authenticated user appears
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;

    async function syncFromAuth(userId: string | null) {
      if (!userId) {
        userIdRef.current = null;
        wishlistTableId.current = null;
        return;
      }
      userIdRef.current = userId;
      const tableId = await findWishlistId(userId);
      if (cancelled) return;
      wishlistTableId.current = tableId;
      if (!tableId) return;
      const { data } = await supabase
        .from("wishlist_items")
        .select("product_id")
        .eq("wishlist_id", tableId);
      if (!cancelled && data) {
        setWishlist(data.map((r: any) => r.product_id));
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncFromAuth(session?.user?.id ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      syncFromAuth(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const toggleWishlist = (id: string) => {
    const adding = !wishlist.includes(id);
    setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    // Best-effort DB persistence for authenticated users with real product ids
    if (isSupabaseConfigured() && userIdRef.current && isUuid(id)) {
      const userId = userIdRef.current;
      (async () => {
        if (!wishlistTableId.current) {
          wishlistTableId.current = await createWishlistId(userId);
        }
        const tableId = wishlistTableId.current;
        if (!tableId) return;
        if (adding) {
          const { error } = await supabase
            .from("wishlist_items")
            .upsert({ wishlist_id: tableId, product_id: id }, { onConflict: "wishlist_id,product_id" });
          if (error) console.warn("wishlist add not persisted:", error.message);
        } else {
          await supabase
            .from("wishlist_items")
            .delete()
            .eq("wishlist_id", tableId)
            .eq("product_id", id);
        }
      })();
    }
  };

  const isWishlisted = (id: string) => wishlist.includes(id);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
