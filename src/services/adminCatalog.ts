import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { AdminProduct, Category, Collection, InventoryLog } from "../admin/context/AdminDataContext";
import type { ProductVariant } from "../data/products";

/**
 * Upload an image file directly to Supabase Storage 'products' bucket
 */
export async function uploadProductImageToStorage(file: File): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured for storage upload.");
    return null;
  }

  try {
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `catalog/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase image upload failed:", uploadError.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("products")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Storage upload exception:", err);
    return null;
  }
}

/**
 * Fetch full admin products list from Supabase
 */
export async function fetchAdminProductsFromDB(): Promise<AdminProduct[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (id, name, slug),
        collections!products_collection_id_fkey (id, name, slug),
        product_images (id, image_url, alt_text, display_order, is_primary),
        product_variants (id, size, sku, price, sale_price, stock, low_stock_threshold, active, is_auto_price),
        product_fragrance_notes (note_type, fragrance_notes (id, name))
      `)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Error fetching admin products from DB:", error?.message);
      return [];
    }

    return data.map((p: any) => {
      const variants: ProductVariant[] = (p.product_variants || [])
        .filter((v: any) => v.active !== false)
        .map((v: any) => ({
          id: v.id,
          size: v.size,
          price: Number(v.price),
          salePrice: v.sale_price ? Number(v.sale_price) : undefined,
          sku: v.sku,
          stock: Number(v.stock ?? 0),
          active: v.active !== false,
          auto: v.is_auto_price !== false,
        }));

      const topNotes: string[] = [];
      const heartNotes: string[] = [];
      const baseNotes: string[] = [];

      (p.product_fragrance_notes || []).forEach((fn: any) => {
        const noteName = fn.fragrance_notes?.name;
        if (noteName) {
          if (fn.note_type === "top") topNotes.push(noteName);
          else if (fn.note_type === "heart") heartNotes.push(noteName);
          else if (fn.note_type === "base") baseNotes.push(noteName);
        }
      });

      const imagesSorted = (p.product_images || [])
        .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
      const photos = imagesSorted.map((img: any) => img.image_url);

      const var50 = variants.find((v) => v.size.toLowerCase() === "50ml");

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.base_price || (var50 ? var50.price : 4500)),
        salePrice: p.sale_price ? Number(p.sale_price) : undefined,
        sku: p.sku,
        category: p.categories?.name || "Woody Oriental",
        collection: p.collections?.name || "Unisex Collection",
        gender: (p.gender as "men" | "women" | "unisex") || "unisex",
        fragranceType: p.fragrance_type || "Extrait de Parfum",
        size: "50ml",
        concentration: p.concentration || "Extrait de Parfum (25-30% Oil)",
        stock: var50 ? var50.stock : variants.reduce((a, b) => a + b.stock, 0),
        lowStockThreshold: 10,
        topNotes: topNotes.length ? topNotes : ["Bergamot", "Saffron"],
        heartNotes: heartNotes.length ? heartNotes : ["Bulgarian Rose", "Oud Wood"],
        baseNotes: baseNotes.length ? baseNotes : ["Amber", "Vanilla"],
        description: p.description || "",
        fullDescription: p.full_description || p.description || "",
        images: ["texture-velvet", "texture-marble-dark"],
        photos: photos.length ? photos : [],
        featured: Boolean(p.featured),
        bestseller: Boolean(p.bestseller),
        newArrival: Boolean(p.new_arrival),
        active: Boolean(p.active),
        seoTitle: p.seo_title || `${p.name} — HM Signature`,
        seoDescription: p.seo_description || p.description,
        createdAt: p.created_at ? p.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        variants,
      };
    });
  } catch (err) {
    console.error("Admin products query failed:", err);
    return [];
  }
}

/**
 * Fetch categories from Supabase
 */
export async function fetchAdminCategoriesFromDB(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data: catData, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !catData) return [];

    // Query product count per category
    const { data: prodData } = await supabase.from("products").select("category_id");
    const countMap: Record<string, number> = {};
    (prodData || []).forEach((p: any) => {
      if (p.category_id) {
        countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      }
    });

    return catData.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      image: c.image_url || "texture-velvet",
      active: Boolean(c.active),
      productCount: countMap[c.id] || 0,
    }));
  } catch (err) {
    console.error("Failed to fetch admin categories:", err);
    return [];
  }
}

/**
 * Fetch collections from Supabase with collection_products junction
 */
export async function fetchAdminCollectionsFromDB(): Promise<Collection[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data: colData, error } = await supabase
      .from("collections")
      .select(`
        *,
        collection_products (product_id)
      `)
      .order("display_order", { ascending: true });

    if (error || !colData) return [];

    return colData.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      image: c.banner_url || "texture-marble-champagne",
      featured: Boolean(c.featured),
      active: Boolean(c.active),
      productIds: (c.collection_products || []).map((cp: any) => cp.product_id),
    }));
  } catch (err) {
    console.error("Failed to fetch admin collections:", err);
    return [];
  }
}

/**
 * Fetch inventory audit logs from Supabase
 */
export async function fetchAdminInventoryLogsFromDB(): Promise<InventoryLog[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from("inventory_transactions")
      .select(`
        *,
        product_variants (sku, size, product_id, products (name))
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) return [];

    return data.map((log: any) => ({
      id: log.id,
      productId: log.product_variants?.product_id || log.variant_id,
      productName: log.product_variants?.products?.name || "Fragrance Flacon",
      sku: log.product_variants?.sku || "HM-SKU",
      previousStock: log.previous_stock,
      newStock: log.new_stock,
      change: log.quantity_change,
      reason: log.notes || log.transaction_type,
      adjustedBy: "Staff Concierge",
      date: log.created_at ? log.created_at.replace("T", " ").slice(0, 16) : new Date().toISOString().slice(0, 16),
    }));
  } catch (err) {
    console.error("Failed to fetch inventory logs:", err);
    return [];
  }
}

/**
 * Save / Update Product in Supabase (upserts product, variants, images, notes)
 */
export async function saveProductToDB(
  productData: Omit<AdminProduct, "id" | "createdAt"> & { id?: string }
): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    // 1. Resolve Category ID
    let categoryId: string | null = null;
    const { data: catRow } = await supabase
      .from("categories")
      .select("id")
      .eq("name", productData.category)
      .maybeSingle();
    if (catRow) categoryId = catRow.id;

    // 2. Resolve Collection ID
    let collectionId: string | null = null;
    const { data: colRow } = await supabase
      .from("collections")
      .select("id")
      .eq("name", productData.collection)
      .maybeSingle();
    if (colRow) collectionId = colRow.id;

    const productPayload: any = {
      name: productData.name,
      slug: productData.slug,
      base_price: productData.price,
      sale_price: productData.salePrice || null,
      sku: productData.sku,
      category_id: categoryId,
      collection_id: collectionId,
      gender: productData.gender,
      fragrance_type: productData.fragranceType,
      concentration: productData.concentration,
      description: productData.description,
      full_description: productData.fullDescription,
      featured: productData.featured,
      bestseller: productData.bestseller,
      new_arrival: productData.newArrival,
      active: productData.active,
      seo_title: productData.seoTitle,
      seo_description: productData.seoDescription,
      updated_at: new Date().toISOString(),
    };

    let productId = productData.id;

    if (productId && !productId.startsWith("prod-")) {
      const { error: updateErr } = await supabase
        .from("products")
        .update(productPayload)
        .eq("id", productId);
      if (updateErr) throw updateErr;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("products")
        .insert([productPayload])
        .select()
        .single();
      if (insertErr || !inserted) throw insertErr;
      productId = inserted.id;
    }

    if (!productId) return false;

    // 3. Save Variants (10ml, 30ml, 50ml, 100ml)
    if (productData.variants && productData.variants.length > 0) {
      for (const v of productData.variants) {
        const variantPayload: any = {
          product_id: productId,
          size: v.size,
          sku: v.sku || `${productData.sku}-${v.size.toUpperCase()}`,
          price: v.price,
          sale_price: v.salePrice || null,
          stock: v.stock,
          active: v.active !== false,
          is_auto_price: v.auto !== false,
          updated_at: new Date().toISOString(),
        };

        if (v.id && !v.id.startsWith("v-")) {
          const { error: vErr } = await supabase.from("product_variants").update(variantPayload).eq("id", v.id);
          if (vErr) throw vErr;
        } else {
          const { error: vErr } = await supabase
            .from("product_variants")
            .upsert([variantPayload], { onConflict: "product_id,size" });
          if (vErr) throw vErr;
        }
      }
    }

    // 4. Save Product Images
    if (productData.photos && productData.photos.length > 0) {
      // Clear existing images for this product
      await supabase.from("product_images").delete().eq("product_id", productId);

      const imageRows = productData.photos.map((url, idx) => ({
        product_id: productId,
        image_url: url,
        display_order: idx,
        is_primary: idx === 0,
      }));
      await supabase.from("product_images").insert(imageRows);
    }

    // 5. Save Collection Products junction
    if (collectionId) {
      await supabase.from("collection_products").upsert({
        collection_id: collectionId,
        product_id: productId,
        display_order: 0,
      });
    }

    return true;
  } catch (err: any) {
    console.error("Failed to save product to DB:", err?.message || err);
    return false;
  }
}

/**
 * Toggle product active status
 */
export async function toggleProductStatusInDB(productId: string, active: boolean): Promise<boolean> {
  if (!isSupabaseConfigured() || productId.startsWith("prod-")) return true;

  try {
    const { error } = await supabase
      .from("products")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", productId);
    return !error;
  } catch (e) {
    return false;
  }
}

/**
 * Safe Product Delete (Deactivates active flag if foreign keys exist to preserve order & inventory history)
 */
export async function deleteProductSafeFromDB(productId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || productId.startsWith("prod-")) return true;

  try {
    // Attempt hard delete first
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) {
      // FK constraint violation (e.g. order_items or inventory history exists) -> Soft delete / Archive
      console.warn(`Hard delete blocked for product ${productId}, deactivating instead:`, error.message);
      await supabase.from("products").update({ active: false, updated_at: new Date().toISOString() }).eq("id", productId);
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Save Category
 */
export async function saveCategoryToDB(cat: Omit<Category, "id" | "productCount"> & { id?: string }): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    const payload = {
      name: cat.name,
      slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-"),
      description: cat.description,
      image_url: cat.image,
      active: cat.active,
      updated_at: new Date().toISOString(),
    };

    if (cat.id && !cat.id.startsWith("cat-")) {
      const { error } = await supabase.from("categories").update(payload).eq("id", cat.id);
      return !error;
    } else {
      const { error } = await supabase.from("categories").insert([payload]);
      return !error;
    }
  } catch (e) {
    return false;
  }
}

/**
 * Delete Category (Soft deactivates if products depend on it)
 */
export async function deleteCategorySafeFromDB(categoryId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || categoryId.startsWith("cat-")) return true;

  try {
    const { error } = await supabase.from("categories").delete().eq("id", categoryId);
    if (error) {
      await supabase.from("categories").update({ active: false, updated_at: new Date().toISOString() }).eq("id", categoryId);
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Save Collection & sync collection_products
 */
export async function saveCollectionToDB(col: Omit<Collection, "id"> & { id?: string }): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    const payload = {
      name: col.name,
      slug: col.slug || col.name.toLowerCase().replace(/\s+/g, "-"),
      description: col.description,
      banner_url: col.image,
      featured: col.featured,
      active: col.active,
      updated_at: new Date().toISOString(),
    };

    let colId = col.id;
    if (colId && !colId.startsWith("col-")) {
      const { error } = await supabase.from("collections").update(payload).eq("id", colId);
      if (error) return false;
    } else {
      const { data, error } = await supabase.from("collections").insert([payload]).select().single();
      if (error || !data) return false;
      colId = data.id;
    }

    if (colId && col.productIds) {
      await supabase.from("collection_products").delete().eq("collection_id", colId);
      if (col.productIds.length > 0) {
        const rows = col.productIds.map((pid, idx) => ({
          collection_id: colId,
          product_id: pid,
          display_order: idx,
        }));
        await supabase.from("collection_products").insert(rows);
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Delete Collection
 */
export async function deleteCollectionSafeFromDB(collectionId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || collectionId.startsWith("col-")) return true;

  try {
    const { error } = await supabase.from("collections").delete().eq("id", collectionId);
    if (error) {
      await supabase.from("collections").update({ active: false, updated_at: new Date().toISOString() }).eq("id", collectionId);
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Atomic Inventory Stock Adjustment RPC Call
 */
export async function adjustStockAtomicDB(
  productId: string,
  change: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    // 1. Find target variant (prefer 50ml or first active variant)
    const { data: variants, error: varErr } = await supabase
      .from("product_variants")
      .select("id, size, stock")
      .eq("product_id", productId);

    if (varErr || !variants || variants.length === 0) {
      return { success: false, error: "No product variant found for stock adjustment." };
    }

    const var50 = variants.find((v) => v.size.toLowerCase() === "50ml") || variants[0];

    // 2. Execute atomic database RPC 'adjust_inventory_stock'
    const { error: rpcError } = await supabase.rpc("adjust_inventory_stock", {
      p_variant_id: var50.id,
      p_quantity_change: change,
      p_transaction_type: "adjustment",
      p_notes: reason || "Manual atelier stock adjustment",
    });

    if (rpcError) {
      console.warn("RPC adjust_inventory_stock unavailable or error, falling back to direct transaction:", rpcError.message);
      
      // Fallback: Perform atomic update & log in direct sequence if RPC function not created in DB yet
      const oldStock = var50.stock;
      const newStock = Math.max(0, oldStock + change);

      const { error: updateErr } = await supabase
        .from("product_variants")
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq("id", var50.id);

      if (updateErr) return { success: false, error: updateErr.message };

      const staffUser = (await supabase.auth.getUser()).data.user;
      await supabase.from("inventory_transactions").insert([{
        variant_id: var50.id,
        transaction_type: "adjustment",
        quantity_change: change,
        previous_stock: oldStock,
        new_stock: newStock,
        created_by: staffUser?.id || null,
        notes: reason || "Manual atelier stock adjustment",
      }]);

      return { success: true };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Stock adjustment exception:", err);
    return { success: false, error: err.message || "Failed to adjust inventory stock." };
  }
}
