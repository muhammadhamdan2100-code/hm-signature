import { supabase } from "../lib/supabase";
import { getCatalogProducts } from "./catalog";
import type { CartItem } from "../context/CartContext";

interface ServerCart {
  cartId: string | null;
  items: any[];
  subtotal: number;
}

async function ensureCartRow(): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return null;

  const { data: existing } = await supabase.from("cart").select("id").eq("user_id", uid).maybeSingle();
  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("cart")
    .insert([{ user_id: uid }])
    .select("id")
    .single();
  if (error) {
    console.warn("ensureCartRow:", error.message);
    return null;
  }
  return created?.id || null;
}

export async function pushCartToServer(items: CartItem[]): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return false;

  const cartId = await ensureCartRow();
  if (!cartId) return false;

  const wanted = items
    .map((i) => {
      const size = (i.selectedSize || "").toLowerCase();
      const variant = i.product.variants?.find((v) => v.size.toLowerCase() === size && !v.id.startsWith("v-"));
      return variant ? { cart_id: cartId, product_id: i.product.id, variant_id: variant.id, quantity: i.quantity } : null;
    })
    .filter(Boolean) as { cart_id: string; product_id: string; variant_id: string; quantity: number }[];

  const { error: delErr } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cartId)
    .not("variant_id", "is", null);
  if (delErr) console.warn("cart_items clear:", delErr.message);

  if (wanted.length > 0) {
    const { error: upErr } = await supabase
      .from("cart_items")
      .upsert(wanted, { onConflict: "cart_id,variant_id" });
    if (upErr) {
      console.warn("pushCartToServer:", upErr.message);
      return false;
    }
  }
  return true;
}

export async function clearServerCart(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return;
  const { data: cart } = await supabase.from("cart").select("id").eq("user_id", userData.user.id).maybeSingle();
  if (cart?.id) {
    await supabase.from("cart_items").delete().eq("cart_id", cart.id);
  }
}

// Rebuilds full cart lines from the priced server rows so the bag reflects the
// catalogue rather than a stale localStorage snapshot.
export async function fetchServerCart(): Promise<CartItem[]> {
  const { data, error } = await supabase.rpc("get_my_cart");
  if (error || !data?.items?.length) return [];

  const catalog = await getCatalogProducts();
  const byId = new Map(catalog.map((p) => [p.id, p]));

  return (data.items as any[])
    .map((row): CartItem | null => {
      const product = byId.get(row.product_id);
      if (!product) return null;
      const variant = product.variants?.find((v) => v.id === row.variant_id);
      return {
        id: `${product.id}-${variant?.size || row.size}`,
        product,
        selectedSize: variant?.size || row.size,
        price: Number(row.unit_price ?? variant?.price ?? product.price),
        sku: variant?.sku || product.sku || "",
        quantity: Number(row.quantity),
      };
    })
    .filter(Boolean) as CartItem[];
}

export type { ServerCart };
