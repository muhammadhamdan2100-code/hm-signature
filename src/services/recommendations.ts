// Phase 8 (8.1 + 8.2): read the ranked rails, then hydrate them from the catalogue the page
// already loads.
//
// The browser never ranks. `recommend_products` in the database does, under the shopper's own
// row-level-security context, and this service only turns the returned ids into Product objects
// using the same cached catalogue the rest of the page reads — so a rail costs one small request
// and no extra table queries.

import { supabase } from "../lib/supabase";
import { getCatalogProducts } from "./catalog";
import type { Product } from "../data/products";

export type RecommendationKind =
  | "recommended_for_you"
  | "you_may_also_like"
  | "because_you_viewed"
  | "similar_fragrances"
  | "complete_your_collection"
  | "frequently_paired";

/** 'personalized' means a real signal of this shopper drove the order; 'catalogue' means it did not. */
export type RecommendationBasis = "personalized" | "catalogue";

export interface RecommendationItem {
  productId: string;
  basis: RecommendationBasis;
  score: number;
  reasonCodes: string[];
}

export interface RecommendationRail {
  kind: RecommendationKind;
  basis: RecommendationBasis | null;
  items: Product[];
  reasons: Record<string, string[]>;
  degraded: boolean;
}

export interface RecommendationQuery {
  kind: RecommendationKind;
  productId?: string | null;
  recentIds?: string[];
  limit?: number;
  gender?: string | null;
}

const EMPTY_RAIL = (kind: RecommendationKind, degraded = true): RecommendationRail => ({
  kind,
  basis: null,
  items: [],
  reasons: {},
  degraded,
});

async function accessToken(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  } catch {
    return "";
  }
}

export async function fetchRecommendationRail(query: RecommendationQuery): Promise<RecommendationRail> {
  const params = new URLSearchParams({ kind: query.kind });
  if (query.productId) params.set("productId", query.productId);
  if (query.recentIds && query.recentIds.length > 0) params.set("recent", query.recentIds.slice(0, 12).join(","));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.gender) params.set("gender", query.gender);

  const token = await accessToken();
  let raw: { items?: RecommendationItem[]; degraded?: boolean };
  try {
    const response = await fetch(`/api/recommendations?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return EMPTY_RAIL(query.kind);
    raw = (await response.json()) as { items?: RecommendationItem[]; degraded?: boolean };
  } catch {
    // A rail is an enhancement. If ranking is unreachable the page must still render its own
    // content, so this resolves to an empty rail instead of rejecting.
    return EMPTY_RAIL(query.kind);
  }

  const ranked = Array.isArray(raw.items) ? raw.items : [];
  if (ranked.length === 0) return { ...EMPTY_RAIL(query.kind), degraded: Boolean(raw.degraded) };

  const catalogue = await getCatalogProducts();
  const byId = new Map((catalogue || []).map((p) => [p.id, p]));
  const items: Product[] = [];
  const reasons: Record<string, string[]> = {};
  for (const entry of ranked) {
    const product = byId.get(entry.productId);
    // An id the catalogue does not offer is skipped rather than invented: it can only mean the
    // row is inactive, out of stock or outside what this shopper is allowed to see.
    if (!product) continue;
    items.push(product);
    reasons[product.id] = entry.reasonCodes || [];
  }

  return {
    kind: query.kind,
    basis: ranked[0]?.basis ?? null,
    items,
    reasons,
    degraded: Boolean(raw.degraded),
  };
}

/**
 * Remembers a view for the signed-in customer only. Guests are a deliberate no-op — their
 * recently-viewed list stays in their own browser, which is the least the feature can collect.
 */
export async function recordProductView(productId: string, source = "product_page"): Promise<void> {
  if (!productId) return;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) return;
    await supabase.rpc("record_product_view", { p_product_id: productId, p_source: source });
  } catch {
    /* never let an analytics-style write disturb the page */
  }
}

export async function clearMyProductViews(): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("clear_my_product_views");
  if (error) return { success: false, error: error.message };
  return { success: Boolean((data as { success?: boolean })?.success) };
}

/** Machine keys from the database, translated by the caller. Never displayed raw. */
export const RECOMMENDATION_REASON_KEYS: Record<string, string> = {
  family_match: "recommendations.reasonFamily",
  notes_match: "recommendations.reasonNotes",
  category_match: "recommendations.reasonCategory",
  collection_match: "recommendations.reasonCollection",
  occasion_match: "recommendations.reasonOccasion",
  season_match: "recommendations.reasonSeason",
  intensity_match: "recommendations.reasonIntensity",
  house_bestseller: "recommendations.reasonBestseller",
  house_new: "recommendations.reasonNew",
};
