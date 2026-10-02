import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { AdminProduct, Category, Collection, InventoryLog } from "../admin/context/AdminDataContext";
import type { ProductVariant } from "../data/products";
import { isValidSizeLabel, normalizeSizeLabel, sizeToMl } from "../data/products";

// Resolve note names to fragrance_notes ids, creating any missing note once.
async function ensureFragranceNotes(
  notes: { name: string; type: string }[]
): Promise<{ id: string; type: string }[]> {
  const resolved: { id: string; type: string }[] = [];
  for (const n of notes) {
    const name = n.name.trim();
    if (!name) continue;
    const { data: existing } = await supabase
      .from("fragrance_notes")
      .select("id")
      .ilike("name", name)
      .maybeSingle();

    let id = existing?.id;
    if (!id) {
      const { data: created } = await supabase
        .from("fragrance_notes")
        .insert([{ name, category: n.type }])
        .select("id")
        .single();
      id = created?.id;
    }
    if (id) resolved.push({ id, type: n.type });
  }
  return resolved;
}

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
        product_images (id, image_url, alt_text, display_order, is_primary, variant_id),
        product_variants (id, size, sku, price, sale_price, stock, low_stock_threshold, active, is_auto_price),
        product_fragrance_notes (note_type, fragrance_notes (id, name))
      `)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Error fetching admin products from DB:", error?.message);
      return [];
    }

    return data.map((p: any) => {
      const variantImagesByVariant = new Map<string, string[]>();
      (p.product_images || []).forEach((img: any) => {
        if (img.variant_id) {
          const list = variantImagesByVariant.get(img.variant_id) || [];
          list.push(img.image_url);
          variantImagesByVariant.set(img.variant_id, list);
        }
      });

      const variants: ProductVariant[] = (p.product_variants || [])
        .filter((v: any) => v.active !== false)
        .sort((a: any, b: any) => sizeToMl(a.size) - sizeToMl(b.size))
        .map((v: any) => ({
          id: v.id,
          size: v.size,
          price: Number(v.price),
          salePrice: v.sale_price ? Number(v.sale_price) : undefined,
          sku: v.sku,
          stock: Number(v.stock ?? 0),
          active: v.active !== false,
          auto: v.is_auto_price !== false,
          lowStockThreshold: Number(v.low_stock_threshold ?? 10),
          images: variantImagesByVariant.get(v.id) || [],
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
        .filter((img: any) => !img.variant_id)
        .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
      const photos = imagesSorted.map((img: any) => img.image_url);
      const photoAlts = imagesSorted.map((img: any) => img.alt_text || "");

      const var50 = variants.find((v) => v.size.toLowerCase() === "50ml");

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.base_price || (var50 ? var50.price : 4500)),
        salePrice: p.sale_price ? Number(p.sale_price) : undefined,
        sku: p.sku,
        category: p.categories?.name || p.fragrance_family || "Woody Oriental",
        collection: p.collections?.name || "Unisex Collection",
        gender: (p.gender as "men" | "women" | "unisex") || "unisex",
        fragranceType: p.fragrance_type || "Extrait de Parfum",
        fragranceFamily: p.fragrance_family || p.categories?.name || undefined,
        size: "50ml",
        concentration: p.concentration || "Extrait de Parfum (25-30% Oil)",
        stock: var50 ? var50.stock : variants.reduce((a, b) => a + b.stock, 0),
        lowStockThreshold: variants.length ? Math.min(...variants.map((v) => v.lowStockThreshold ?? 10)) : 10,
        topNotes,
        heartNotes,
        baseNotes,
        description: p.description || "",
        shortDescription: p.short_description || undefined,
        occasions: Array.isArray(p.occasions) ? p.occasions : [],
        seasons: Array.isArray(p.seasons) ? p.seasons : [],
        intensity: p.intensity || undefined,
        scentProfile: p.scent_profile || undefined,
        fullDescription: p.full_description || p.description || "",
        images: ["texture-velvet", "texture-marble-dark"],
        photos: photos.length ? photos : [],
        photoAlts: photoAlts.length ? photoAlts : [],
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
      fragrance_family: productData.fragranceFamily || productData.category || null,
      concentration: productData.concentration,
      description: productData.description,
      short_description: productData.shortDescription || null,
      full_description: productData.fullDescription,
      occasions: productData.occasions || [],
      seasons: productData.seasons || [],
      intensity: productData.intensity || null,
      scent_profile: productData.scentProfile || null,
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

    // 3. Save variants. Stock is never written directly: every movement goes
    // through adjust_inventory_stock so the ledger stays the source of truth.
    if (productData.variants && productData.variants.length > 0) {
      for (const v of productData.variants) {
        const sizeLabel = normalizeSizeLabel(v.size);
        if (!isValidSizeLabel(sizeLabel)) {
          throw new Error(`Invalid bottle size "${v.size}". Use a whole millilitre value such as 75ml.`);
        }

        const threshold = Number(v.lowStockThreshold ?? productData.lowStockThreshold ?? 10);
        const variantPayload: any = {
          product_id: productId,
          size: sizeLabel,
          sku: v.sku || `${productData.sku}-${sizeLabel.toUpperCase()}`,
          price: v.price,
          sale_price: v.salePrice || null,
          low_stock_threshold: threshold,
          active: v.active !== false,
          is_auto_price: v.auto !== false,
          updated_at: new Date().toISOString(),
        };

        let variantId: string | null = v.id && !v.id.startsWith("v-") ? v.id : null;
        if (!variantId) {
          const { data: found } = await supabase
            .from("product_variants")
            .select("id")
            .eq("product_id", productId)
            .eq("size", sizeLabel)
            .maybeSingle();
          variantId = found?.id || null;
        }

        if (variantId) {
          const { data: current, error: readErr } = await supabase
            .from("product_variants")
            .select("stock")
            .eq("id", variantId)
            .single();
          if (readErr) throw readErr;

          const { error: vErr } = await supabase
            .from("product_variants")
            .update(variantPayload)
            .eq("id", variantId);
          if (vErr) throw vErr;

          const delta = Number(v.stock ?? 0) - Number(current?.stock ?? 0);
          if (delta !== 0) {
            const { error: adjErr } = await supabase.rpc("adjust_inventory_stock", {
              p_variant_id: variantId,
              p_quantity_change: delta,
              p_transaction_type: "adjustment",
              p_notes: "Stock revised in the product catalogue",
            });
            if (adjErr) throw adjErr;
          }
        } else {
          const { data: created, error: cErr } = await supabase
            .from("product_variants")
            .insert([{ ...variantPayload, stock: 0 }])
            .select("id")
            .single();
          if (cErr) throw cErr;
          const opening = Number(v.stock ?? 0);
          if (opening > 0) {
            const { error: adjErr } = await supabase.rpc("adjust_inventory_stock", {
              p_variant_id: created.id,
              p_quantity_change: opening,
              p_transaction_type: "restock",
              p_notes: "Opening stock for a new bottle size",
            });
            if (adjErr) throw adjErr;
          }
        }
      }
    }

    // 4. Save product and variant images
    if (Array.isArray(productData.photos) && productData.photos.length > 0) {
      await supabase.from("product_images").delete().eq("product_id", productId).is("variant_id", null);

      const imageRows = productData.photos.map((url, idx) => ({
        product_id: productId,
        image_url: url,
        alt_text: productData.photoAlts?.[idx] || `${productData.name} — HM Signature fragrance photograph`,
        display_order: idx,
        is_primary: idx === 0,
      }));
      const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
      if (imgErr) throw imgErr;
    }

    if (productData.variants?.length) {
      for (const v of productData.variants) {
        if (!v.id || v.id.startsWith("v-")) continue;
        const wanted = v.images || [];
        const { data: existingRows } = await supabase
          .from("product_images")
          .select("id, image_url")
          .eq("variant_id", v.id);
        const existingUrls = (existingRows || []).map((r: any) => r.image_url);
        if (existingUrls.join("|") !== wanted.join("|")) {
          await supabase.from("product_images").delete().eq("variant_id", v.id);
          if (wanted.length > 0) {
            const { error: vImgErr } = await supabase
              .from("product_images")
              .insert(wanted.map((url, idx) => ({
                product_id: productId,
                variant_id: v.id,
                image_url: url,
                display_order: idx,
                is_primary: idx === 0,
              })));
            if (vImgErr) throw vImgErr;
          }
        }
      }
    }

    // 4b. Fragrance notes (previously dropped on save)
    if (productData.topNotes || productData.heartNotes || productData.baseNotes) {
      await supabase.from("product_fragrance_notes").delete().eq("product_id", productId);
      const noteRows = [
        ...(productData.topNotes || []).map((name) => ({ name, type: "top" })),
        ...(productData.heartNotes || []).map((name) => ({ name, type: "heart" })),
        ...(productData.baseNotes || []).map((name) => ({ name, type: "base" })),
      ];
      if (noteRows.length > 0) {
        const resolved = await ensureFragranceNotes(noteRows);
        if (resolved.length > 0) {
          const { error: fnErr } = await supabase
            .from("product_fragrance_notes")
            .insert(resolved.map((r) => ({ product_id: productId, note_type: r.type, note_id: r.id })));
          if (fnErr) throw fnErr;
        }
      }
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
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (!error) return true;

    // The audit tables are ON DELETE RESTRICT on purpose: a fragrance that has
    // been sold or has stock history keeps its ledger, payments and timeline, so
    // the only honest outcome is to archive it.
    const blockedByHistory = error.code === "23503" || /violates foreign key constraint/i.test(error.message);
    if (!blockedByHistory) {
      console.error("deleteProductSafeFromDB failed:", error.message);
      return false;
    }

    console.warn(`Product ${productId} keeps its order/stock history, archiving instead:`, error.message);
    const { error: archiveErr } = await supabase
      .from("products")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", productId);
    if (archiveErr) {
      console.error("Archive after blocked delete failed:", archiveErr.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("deleteProductSafeFromDB exception:", e);
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
      // PGRST202 / 404 means the function is not present in this database yet.
      // Anything else (P0001 from a RAISE, 403 from the privilege layer, a
      // connection failure) is a real answer and must reach the admin as-is:
      // writing stock by hand behind a rejected adjustment would leave the
      // stock column and the inventory ledger disagreeing.
      const functionMissing =
        rpcError.code === "PGRST202" ||
        rpcError.code === "42883" ||
        /does not exist|not found/i.test(rpcError.message);

      if (!functionMissing) {
        return { success: false, error: rpcError.message };
      }

      console.warn("adjust_inventory_stock is unavailable, using the direct write path:", rpcError.message);

      const oldStock = var50.stock;
      const newStock = Math.max(0, oldStock + change);
      if (newStock < 0) {
        return { success: false, error: `Only ${oldStock} unit(s) of this size are in stock.` };
      }

      const { error: updateErr } = await supabase
        .from("product_variants")
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq("id", var50.id);

      if (updateErr) return { success: false, error: updateErr.message };

      const staffUser = (await supabase.auth.getUser()).data.user;
      const { error: ledgerErr } = await supabase.from("inventory_transactions").insert([{
        variant_id: var50.id,
        transaction_type: "adjustment",
        quantity_change: newStock - oldStock,
        previous_stock: oldStock,
        new_stock: newStock,
        created_by: staffUser?.id || null,
        notes: `${reason || "Manual atelier stock adjustment"} (direct write: adjust_inventory_stock unavailable)`,
      }]);
      if (ledgerErr) {
        return { success: false, error: `Stock changed but the ledger entry failed: ${ledgerErr.message}` };
      }

      return { success: true };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Stock adjustment exception:", err);
    return { success: false, error: err.message || "Failed to adjust inventory stock." };
  }
}
