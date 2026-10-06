import { supabase, isSupabaseConfigured } from "../lib/supabase";
import {
  SOURCE_LANGUAGE_CODE,
  applyBundle,
  bundleFor,
  getActiveContentLanguage,
  readTranslationMap,
} from "./localizedContent";
import {
  products as staticProducts,
  getProductBySlug as getStaticProductBySlug,
  type Product,
  type ProductVariant,
  generateDefaultVariants,
  sizeToMl,
  effectiveVariantPrice,
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
  categoryName?: string,
  reviewStats?: { rating: number; count: number }
): Product {
  // A price the database did not supply must not be invented. When a row carries
  // no base price, the cheapest real variant price is used; if the catalogue has
  // no price at all the product reads as 0 and the UI says "Price on request".
  const declaredBase = Number(dbProduct.base_price ?? dbProduct.price);
  const variantPrices = (variantsMap || [])
    .filter((v: any) => v.active !== false)
    .map((v: any) => Number(v.sale_price ?? v.price))
    .filter((n: number) => Number.isFinite(n) && n > 0);
  const basePrice =
    Number.isFinite(declaredBase) && declaredBase > 0
      ? declaredBase
      : variantPrices.length > 0
        ? Math.min(...variantPrices)
        : 0;

  // 1. Process variants
  let uiVariants: ProductVariant[] = [];
  if (variantsMap && variantsMap.length > 0) {
    uiVariants = variantsMap
      .filter((v: any) => v.active !== false)
      .sort((a: any, b: any) => sizeToMl(a.size) - sizeToMl(b.size))
      .map((v: any) => ({
        id: v.id || `v-${v.size}`,
        size: v.size,
        price: Number(v.price),
        salePrice: v.sale_price ? Number(v.sale_price) : undefined,
        sku: v.sku || `${dbProduct.sku || "HM"}-${String(v.size).toUpperCase()}`,
        stock: Number(v.stock ?? 0),
        active: v.active !== false,
        auto: v.is_auto_price !== false,
        lowStockThreshold: Number(v.low_stock_threshold ?? 10),
      }));
  }

  if (uiVariants.length === 0) {
    uiVariants = generateDefaultVariants(
      basePrice,
      dbProduct.sku || "HM-PRD",
      Number(dbProduct.stock || 30)
    );
  }

  // 50ml or first active variant price reference, on the same sale rule the
  // checkout uses.
  const var50 = uiVariants.find((v) => v.size.toLowerCase() === "50ml") || uiVariants[0];
  const displayPrice = var50 ? effectiveVariantPrice(var50) : basePrice;

  const variantPhotos = new Map<string, string[]>();
  let photos: string[] = [];
  if (imagesMap && imagesMap.length > 0) {
    const sorted = [...imagesMap].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    photos = sorted.filter((img: any) => !img.variant_id).map((img: any) => img.image_url).filter(Boolean);
    sorted.filter((img: any) => img.variant_id).forEach((img: any) => {
      const list = variantPhotos.get(img.variant_id) || [];
      list.push(img.image_url);
      variantPhotos.set(img.variant_id, list);
    });
  }
  uiVariants = uiVariants.map((v) => ({ ...v, images: variantPhotos.get(v.id) || [] }));

  // Texture placeholders as fallback for visual cards
  const texturePlaceholder = dbProduct.texture || "texture-velvet";
  const defaultImages = [
    texturePlaceholder,
    "texture-marble-dark",
    "texture-wood",
    "texture-navy",
  ];

  // 3. Process Fragrance Notes — only what the catalogue actually declares.
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
      Number(dbProduct.stock || 0);

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug,
    sku: dbProduct.sku,
    price: displayPrice,
    images: defaultImages,
    photos: photos.length > 0 ? photos : undefined,
    category:
      categoryName ||
      dbProduct.categories?.name ||
      dbProduct.category ||
      "Haute Parfumerie",
    fragranceFamily: dbProduct.fragrance_family || dbProduct.categories?.name || undefined,
    gender: (dbProduct.gender as "men" | "women" | "unisex") || "unisex",
    description: dbProduct.description || "",
    shortDescription: dbProduct.short_description || undefined,
    occasions: Array.isArray(dbProduct.occasions) ? dbProduct.occasions : [],
    seasons: Array.isArray(dbProduct.seasons) ? dbProduct.seasons : [],
    intensity: dbProduct.intensity || undefined,
    scentProfile: dbProduct.scent_profile || undefined,
    isLimitedEdition: dbProduct.is_limited_edition === true,
    editionTotal: Number.isFinite(Number(dbProduct.edition_total)) ? Number(dbProduct.edition_total) : undefined,
    editionNumber: dbProduct.edition_number || undefined,
    editionReleasedOn: dbProduct.edition_released_on || undefined,
    editionEndsOn: dbProduct.edition_ends_on || undefined,
    preOrderEnabled: dbProduct.pre_order_enabled === true,
    preOrderReleaseOn: dbProduct.pre_order_release_on || undefined,
    preOrderMaxQuantity: Number.isFinite(Number(dbProduct.pre_order_max_quantity)) ? Number(dbProduct.pre_order_max_quantity) : undefined,
    topNotes,
    heartNotes,
    baseNotes,
    // Ingredients and concentration are declared or they are not: nothing here
    // is invented, the product page renders an honest empty state instead.
    ingredients: dbProduct.ingredients || "",
    size: "50ml",
    concentration: dbProduct.concentration || dbProduct.fragrance_type || "",
    // Ratings come only from approved reviews; never a placeholder number.
    rating: reviewStats?.rating ?? 0,
    reviewCount: reviewStats?.count ?? 0,
    reviews: [],
    stock: calculatedStock,
    featured: Boolean(dbProduct.featured),
    bestseller: Boolean(dbProduct.bestseller),
    newArrival: Boolean(dbProduct.new_arrival),
    active: dbProduct.active !== false,
    seoTitle: dbProduct.seo_title || undefined,
    seoDescription: dbProduct.seo_description || undefined,
    texture: texturePlaceholder,
    variants: uiVariants,
  };
}

// Approved-review aggregates in one round trip, so cards show real ratings.
/**
 * The storefront requests the same catalogue from several components during one
 * page load, so a short-lived promise cache keeps that to a single round trip.
 */
const CATALOG_CACHE_MS = 4000;
let reviewStatsCache: {
  at: number;
  value: Promise<Map<string, { rating: number; count: number }>>;
} | null = null;
let catalogCache: { at: number; lang: string; value: Promise<Product[]> } | null = null;

async function loadApprovedReviewStats(): Promise<Map<string, { rating: number; count: number }>> {
  const map = new Map<string, { rating: number; count: number }>();
  const { data } = await supabase
    .from("reviews")
    .select("product_id, rating")
    .eq("status", "Approved");

  (data || []).forEach((r: any) => {
    const entry = map.get(r.product_id) || { rating: 0, count: 0 };
    entry.rating += Number(r.rating || 0);
    entry.count += 1;
    map.set(r.product_id, entry);
  });

  map.forEach((v, k) => {
    v.rating = v.count > 0 ? Math.round((v.rating / v.count) * 10) / 10 : 0;
    map.set(k, v);
  });
  return map;
}

function fetchApprovedReviewStats() {
  const now = Date.now();
  if (reviewStatsCache && now - reviewStatsCache.at < CATALOG_CACHE_MS) return reviewStatsCache.value;
  const value = loadApprovedReviewStats();
  reviewStatsCache = { at: now, value };
  value.catch(() => {
    if (reviewStatsCache?.value === value) reviewStatsCache = null;
  });
  return value;
}

/**
 * Fetch all active catalog products from Supabase with safe static fallback
 */
export function getCatalogProducts(): Promise<Product[]> {
  const now = Date.now();
  if (catalogCache && catalogCache.lang === getActiveContentLanguage() && now - catalogCache.at < CATALOG_CACHE_MS) return catalogCache.value;
  const value = loadCatalogProducts();
  const language = getActiveContentLanguage();
  catalogCache = { at: now, lang: language, value };
  value
    .then((products) => {
      // For a translated language, a result whose names are all still the English source means
      // the bundle read failed — cache that and the shopper stays English for the whole TTL.
      if (language === "en" || products.length === 0) return;
      Promise.resolve(readTranslationMap(language)).then((map) => {
        if (map.size === 0 && catalogCache?.lang === language) catalogCache = null;
      });
    })
    .catch(() => {
      /* handled by the rejection below */
    });
  value.catch(() => {
    if (catalogCache?.value === value) catalogCache = null;
  });
  return value;
}

async function loadCatalogProducts(): Promise<Product[]> {
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
        product_images (id, image_url, alt_text, display_order, is_primary, variant_id),
        product_variants (id, size, sku, price, sale_price, stock, low_stock_threshold, active, is_auto_price),
        product_fragrance_notes (note_type, fragrance_notes (id, name))
      `)
      .eq("active", true)
      .order("created_at", { ascending: false });

    // A query failure keeps the offline demo catalog; an empty catalogue is
    // reported honestly instead of being masked with fixture products.
    if (error || !dbProducts) {
      console.warn("Supabase products query failed, using static fallback:", error?.message);
      return staticProducts;
    }
    if (dbProducts.length === 0) return [];

    const reviewStats = await fetchApprovedReviewStats();

    return localizeCatalog(
      dbProducts.map((p) =>
        mapDBProductToUI(
          p,
          p.product_variants,
          p.product_images,
          p.product_fragrance_notes,
          p.categories?.name,
          reviewStats.get(p.id)
        )
      ),
      dbProducts
    );
  } catch (err) {
    console.error("Catalog fetch error, relying on static catalog:", err);
    return staticProducts;
  }
}

/**
 * Category and collection names are merchandising copy, so they follow the shopper's
 * language the same way product copy does — matched by the row's own id.
 */
async function localizeRows<T extends { id: string }>(rows: T[], kind: "category" | "collection"): Promise<T[]> {
  if (getActiveContentLanguage() === SOURCE_LANGUAGE_CODE) return rows;
  const map = await readTranslationMap();
  if (map.size === 0) return rows;
  return rows.map((row) =>
    applyBundle(row, bundleFor(map, kind, row.id), { name: "name", description: "description" })
  );
}

/**
 * Swaps the marketing copy of already-built catalogue rows for the shopper's language.
 *
 * Only text is touched. Prices, SKUs, stock, variant ids, images and review counts come
 * straight through, so a translation cannot move a number an order depends on. English is
 * the source language and returns the rows untouched; a missing bundle, a missing field or
 * an empty string all fall back to the original English text rather than blanking it.
 */
async function localizeCatalog(products: Product[], rows: any[]): Promise<Product[]> {
  if (getActiveContentLanguage() === SOURCE_LANGUAGE_CODE) return products;
  const map = await readTranslationMap();
  if (map.size === 0) return products;

  const noteNames = new Map<string, string>();
  for (const row of rows) {
    for (const link of row.product_fragrance_notes ?? []) {
      const note = link?.fragrance_notes;
      const translated = note?.id ? bundleFor(map, "fragrance_note", note.id).name : undefined;
      if (note?.name && translated) noteNames.set(note.name, translated);
    }
  }
  const notes = (values: string[] | undefined) =>
    (values ?? []).map((value) => noteNames.get(value) ?? value);

  return products.map((product) => {
    const source = rows.find((row) => row.id === product.id);
    const bundle = bundleFor(map, "product", product.id);
    const categoryBundle = source?.categories?.id ? bundleFor(map, "category", source.categories.id) : {};
    const collectionBundle = source?.collections?.id ? bundleFor(map, "collection", source.collections.id) : {};
    const localized = applyBundle(product, bundle, {
      name: "name",
      description: "description",
      fullDescription: "description",
      shortDescription: "shortDescription",
      scentProfile: "scentProfile",
      fragranceFamily: "fragranceFamily",
      seoTitle: "seoTitle",
      seoDescription: "seoDescription",
    });
    // Structured data has to describe the page the crawler would see. When a language
    // bundle translated the visible copy but carries no SEO fields of its own, the
    // localized text is used for them too, so an Arabic page cannot advertise an
    // English description to Google.
    const seoTitle = bundle.seoTitle || bundle.name || localized.seoTitle;
    const seoDescription =
      bundle.seoDescription || bundle.description || bundle.shortDescription || localized.seoDescription;
    return {
      ...localized,
      seoTitle,
      seoDescription,
      category: categoryBundle.name || localized.category,
      collection: collectionBundle.name || (localized as any).collection,
      topNotes: notes(localized.topNotes),
      heartNotes: notes(localized.heartNotes),
      baseNotes: notes(localized.baseNotes),
    };
  });
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
        product_images (id, image_url, alt_text, display_order, is_primary, variant_id),
        product_variants (id, size, sku, price, sale_price, stock, low_stock_threshold, active, is_auto_price),
        product_fragrance_notes (note_type, fragrance_notes (id, name))
      `)
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.warn(`Supabase single product query failed for '${slug}':`, error.message);
      return getStaticProductBySlug(slug) || null;
    }
    if (!p || p.active === false) return null;

    const stats = await fetchApprovedReviewStats();

    return localizeCatalog(
      [
        mapDBProductToUI(
          p,
          p.product_variants,
          p.product_images,
          p.product_fragrance_notes,
          p.categories?.name,
          stats.get(p.id)
        ),
      ],
      [p]
    ).then((rows) => rows[0]);
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
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { success: false, error: "Please choose a rating between 1 and 5 stars." };
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
    // One review per signed-in customer per fragrance (uniq_review_customer_product).
    if (error.code === "23505") {
      return { success: false, error: "You have already reviewed this fragrance." };
    }
    if (error.code === "42501" || /row-level security/i.test(error.message)) {
      return { success: false, error: "Please sign in to write a review." };
    }
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

    return localizeRows(
      data.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.image_url,
        active: c.active,
      })),
      "category"
    );
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

    return localizeRows(
      data.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        bannerUrl: c.banner_url,
        featured: c.featured,
        active: c.active,
      })),
      "collection"
    );
  } catch (e) {
    return fallbackCollections;
  }
}
