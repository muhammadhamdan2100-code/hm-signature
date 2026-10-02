import { supabase, isSupabaseConfigured } from "../lib/supabase";
import {
  products as staticProducts,
  getProductBySlug as getStaticProductBySlug,
  type Product,
  type ProductVariant,
  generateDefaultVariants,
} from "../data/products";

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
}

export interface CatalogCollection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  bannerUrl?: string;
  featured: boolean;
  active: boolean;
}

/**
 * Maps raw Supabase product row + variants + images + notes into the UI-compatible Product model
 */
export function mapDBProductToUI(
  dbProduct: any,
  variantsMap?: any[],
  imagesMap?: any[],
  notesMap?: any[],
  categoryName?: string
): Product {
  const basePrice = Number(dbProduct.base_price || dbProduct.price || 4500);

  // 1. Process variants
  let uiVariants: ProductVariant[] = [];
  if (variantsMap && variantsMap.length > 0) {
    uiVariants = variantsMap
      .filter((v: any) => v.active !== false)
      .map((v: any) => ({
        id: v.id || `v-${v.size}`,
        size: v.size,
        price: Number(v.price),
        salePrice: v.sale_price ? Number(v.sale_price) : undefined,
        sku: v.sku || `${dbProduct.sku || "HM"}-${v.size.toUpperCase()}`,
        stock: Number(v.stock ?? 30),
        active: v.active !== false,
      }));
  }

  if (uiVariants.length === 0) {
    uiVariants = generateDefaultVariants(
      basePrice,
      dbProduct.sku || "HM-PRD",
      Number(dbProduct.stock || 30)
    );
  }

  // 50ml or first active variant price reference
  const var50 = uiVariants.find((v) => v.size.toLowerCase() === "50ml");
  const displayPrice = var50 ? var50.price : basePrice;

  // 2. Process images & photos
  let photos: string[] = [];
  if (imagesMap && imagesMap.length > 0) {
    const sorted = [...imagesMap].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    photos = sorted.map((img: any) => img.image_url).filter(Boolean);
  }

  // Texture placeholders as fallback for visual cards
  const texturePlaceholder = dbProduct.texture || "texture-velvet";
  const defaultImages = [
    texturePlaceholder,
    "texture-marble-dark",
    "texture-wood",
    "texture-navy",
  ];

  // 3. Process Fragrance Notes
  const topNotes: string[] = [];
  const heartNotes: string[] = [];
  const baseNotes: string[] = [];

  if (notesMap && notesMap.length > 0) {
    notesMap.forEach((fn: any) => {
      const noteName = fn.fragrance_notes?.name || fn.note_name;
      if (noteName) {
        if (fn.note_type === "top") topNotes.push(noteName);
        else if (fn.note_type === "heart") heartNotes.push(noteName);
        else if (fn.note_type === "base") baseNotes.push(noteName);
      }
    });
  }

  // Calculate stock (prefer 50ml variant stock or sum of variant stock)
  const calculatedStock = var50
    ? var50.stock
    : uiVariants.reduce((acc, curr) => acc + (curr.stock || 0), 0) ||
      Number(dbProduct.stock || 30);

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug,
    price: displayPrice,
    images: defaultImages,
    photos: photos.length > 0 ? photos : undefined,
    category:
      categoryName ||
      dbProduct.categories?.name ||
      dbProduct.category ||
      "Haute Parfumerie",
    gender: (dbProduct.gender as "men" | "women" | "unisex") || "unisex",
    description: dbProduct.description || "",
    topNotes: topNotes.length > 0 ? topNotes : ["Bergamot", "Saffron", "Pink Pepper"],
    heartNotes: heartNotes.length > 0 ? heartNotes : ["Bulgarian Rose", "Oud Wood", "Cedar"],
    baseNotes: baseNotes.length > 0 ? baseNotes : ["Amber", "Vanilla", "Leather"],
    ingredients:
      dbProduct.ingredients ||
      "Alcohol Denat., Parfum (Fragrance), Aqua, Essential Botanicals.",
    size: "50ml",
    concentration:
      dbProduct.concentration ||
      dbProduct.fragrance_type ||
      "Extrait de Parfum",
    rating: Number(dbProduct.rating || 4.8),
    reviewCount: Number(dbProduct.review_count || 140),
    reviews: [],
    stock: calculatedStock,
    featured: Boolean(dbProduct.featured),
    bestseller: Boolean(dbProduct.bestseller),
    texture: texturePlaceholder,
    variants: uiVariants,
  };
}

/**
 * Fetch all active catalog products from Supabase with safe static fallback
 */
export async function getCatalogProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return staticProducts;
  }

  try {
    const { data: dbProducts, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (id, name, slug),
        collections!products_collection_id_fkey (id, name, slug),
        product_images (id, image_url, alt_text, display_order, is_primary),
        product_variants (id, size, sku, price, sale_price, stock, low_stock_threshold, active),
        product_fragrance_notes (note_type, fragrance_notes (id, name))
      `)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error || !dbProducts || dbProducts.length === 0) {
      if (error) {
        console.warn(
          "Supabase products query failed, using static fallback:",
          error.message
        );
      }
      return staticProducts;
    }

    return dbProducts.map((p) =>
      mapDBProductToUI(
        p,
        p.product_variants,
        p.product_images,
        p.product_fragrance_notes,
        p.categories?.name
      )
    );
  } catch (err) {
    console.error("Catalog fetch error, relying on static catalog:", err);
    return staticProducts;
  }
}

/**
 * Fetch a single catalog product by slug with safe static fallback
 */
export async function getCatalogProductBySlug(
  slug: string
): Promise<Product | null> {
  if (!slug) return null;

  if (!isSupabaseConfigured()) {
    return getStaticProductBySlug(slug) || null;
  }

  try {
    const { data: p, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (id, name, slug),
        collections!products_collection_id_fkey (id, name, slug),
        product_images (id, image_url, alt_text, display_order, is_primary),
        product_variants (id, size, sku, price, sale_price, stock, low_stock_threshold, active),
        product_fragrance_notes (note_type, fragrance_notes (id, name))
      `)
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (error || !p) {
      if (error) {
        console.warn(
          `Supabase single product query failed for '${slug}', checking fallback:`,
          error.message
        );
      }
      return getStaticProductBySlug(slug) || null;
    }

    return mapDBProductToUI(
      p,
      p.product_variants,
      p.product_images,
      p.product_fragrance_notes,
      p.categories?.name
    );
  } catch (err) {
    console.error(`Error fetching product '${slug}':`, err);
    return getStaticProductBySlug(slug) || null;
  }
}

/**
 * Fetch approved reviews for a product from Supabase (public storefront)
 */
export async function getProductReviews(
  productId: string
): Promise<{ name: string; text: string; rating: number; verified: boolean }[]> {
  if (!isSupabaseConfigured() || !productId) return [];
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("customer_name, comment, rating, verified_purchase")
      .eq("product_id", productId)
      .eq("status", "Approved")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((r: any) => ({
      name: r.customer_name || "Verified Client",
      text: r.comment,
      rating: Number(r.rating),
      verified: Boolean(r.verified_purchase),
    }));
  } catch {
    return [];
  }
}

/**
 * Submit a customer review (lands Pending until admin approval)
 */
export async function submitProductReview(input: {
  productId: string;
  rating: number;
  title: string;
  comment: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Reviews are unavailable right now." };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Please sign in to write a review." };
  }
  const { error } = await supabase.from("reviews").insert([
    {
      product_id: input.productId,
      user_id: user.id,
      customer_name:
        (user as any).user_metadata?.full_name || user.email?.split("@")[0] || "Client",
      customer_email: user.email || "customer@example.com",
      rating: input.rating,
      title: input.title || null,
      comment: input.comment,
      status: "Pending",
    },
  ]);
  if (error) {
    return { success: false, error: "Could not submit your review. Please try again." };
  }
  return { success: true };
}

/**
 * Fetch active categories from Supabase with static fallback
 */
export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  const fallbackCategories: CatalogCategory[] = [
    { id: "cat-1", name: "Woody Oriental", slug: "woody-oriental", active: true },
    { id: "cat-2", name: "Fresh Woods", slug: "fresh-woods", active: true },
    { id: "cat-3", name: "Floral Amber", slug: "floral-amber", active: true },
    { id: "cat-4", name: "Spicy Woody", slug: "spicy-woody", active: true },
    { id: "cat-5", name: "Amber Vanilla", slug: "amber-vanilla", active: true },
  ];

  if (!isSupabaseConfigured()) {
    return fallbackCategories;
  }

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return fallbackCategories;
    }

    return data.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.image_url,
      active: c.active,
    }));
  } catch (e) {
    return fallbackCategories;
  }
}

/**
 * Fetch active collections from Supabase with static fallback
 */
export async function getCatalogCollections(): Promise<CatalogCollection[]> {
  const fallbackCollections: CatalogCollection[] = [
    { id: "col-1", name: "Men's Collection", slug: "mens-collection", featured: true, active: true },
    { id: "col-2", name: "Women's Collection", slug: "womens-collection", featured: true, active: true },
    { id: "col-3", name: "Unisex Collection", slug: "unisex-collection", featured: true, active: true },
  ];

  if (!isSupabaseConfigured()) {
    return fallbackCollections;
  }

  try {
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return fallbackCollections;
    }

    return data.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      bannerUrl: c.banner_url,
      featured: c.featured,
      active: c.active,
    }));
  } catch (e) {
    return fallbackCollections;
  }
}
