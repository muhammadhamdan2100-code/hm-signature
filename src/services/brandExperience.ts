// Phase 8 (8.3 + 8.4): storefront reads for discovery and the Gift Finder.
//
// Same split as the recommendation rails: the database filters and ranks, this service only turns
// ids into Product objects using the cached catalogue. Anything the query could not satisfy comes
// back empty, and the pages show that honestly.

import { getCatalogProducts } from "./catalog";
import type { Product } from "../data/products";

export interface DiscoveryFacetValue {
  value: string;
  products: number;
}

export interface DiscoveryFacetGroup {
  kind: string;
  values: DiscoveryFacetValue[];
}

export interface MatchedEntry {
  productId: string;
  matchedFacets?: string[];
  reasonCodes?: string[];
  matchCount?: number;
  score?: number;
  price: number | null;
  stockTotal: number;
}

export interface HydratedResults {
  entries: { product: Product; facets: string[]; matchCount: number }[];
  degraded: boolean;
}

async function getJson(url: string): Promise<Record<string, unknown>> {
  const response = await fetch(url, { signal: AbortSignal.timeout(9000) });
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return (await response.json()) as Record<string, unknown>;
}

function params(query: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  return search.toString();
}

/**
 * Ids the database returned, mapped onto catalogue rows. An id with no row is skipped rather than
 * replaced: it can only mean the product went inactive, ran out, or is outside what this shopper
 * may see.
 */
async function hydrate(entries: MatchedEntry[]): Promise<HydratedResults> {
  if (entries.length === 0) return { entries: [], degraded: false };
  const catalogue = await getCatalogProducts();
  const byId = new Map((catalogue || []).map((p) => [p.id, p]));
  const out: HydratedResults["entries"] = [];
  for (const entry of entries) {
    const product = byId.get(entry.productId);
    if (!product) continue;
    out.push({
      product,
      facets: entry.matchedFacets || entry.reasonCodes || [],
      matchCount: entry.matchCount ?? entry.score ?? 0,
    });
  }
  return { entries: out, degraded: false };
}

export interface DiscoveryResult {
  facets: DiscoveryFacetGroup[];
  results: HydratedResults;
}

export async function fetchDiscovery(query: {
  families?: string[];
  notes?: string[];
  genders?: string[];
  moods?: string[];
  occasions?: string[];
  seasons?: string[];
  intensities?: string[];
  sillage?: string[];
  longevity?: string[];
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
}): Promise<DiscoveryResult> {
  const csv = (list?: string[]) => (list && list.length > 0 ? list.join(",") : undefined);
  const body = await getJson(
    `/api/discovery?${params({
      families: csv(query.families),
      notes: csv(query.notes),
      genders: csv(query.genders),
      moods: csv(query.moods),
      occasions: csv(query.occasions),
      seasons: csv(query.seasons),
      intensities: csv(query.intensities),
      sillage: csv(query.sillage),
      longevity: csv(query.longevity),
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      inStock: query.inStock ? "true" : undefined,
      sort: query.sort,
      limit: query.limit,
      offset: query.offset,
    })}`
  );
  const facets = Array.isArray(body.facets) ? (body.facets as DiscoveryFacetGroup[]) : [];
  const raw = Array.isArray(body.items) ? (body.items as MatchedEntry[]) : [];
  const results = await hydrate(raw);
  return { facets, results: { ...results, degraded: Boolean(body.degraded) } };
}

export interface GiftFinderResult {
  config: Record<string, unknown>;
  facets: DiscoveryFacetGroup[];
  askedFor: Record<string, string | null>;
  results: HydratedResults;
}

export async function fetchGiftSuggestions(query: {
  recipient?: string;
  relationship?: string;
  occasion?: string;
  season?: string;
  mood?: string;
  gender?: string;
  family?: string;
  budgetMin?: number;
  budgetMax?: number;
  limit?: number;
}): Promise<GiftFinderResult> {
  const body = await getJson(
    `/api/gift-finder?${params({
      recipient: query.recipient,
      relationship: query.relationship,
      occasion: query.occasion,
      season: query.season,
      mood: query.mood,
      gender: query.gender,
      family: query.family,
      budgetMin: query.budgetMin,
      budgetMax: query.budgetMax,
      limit: query.limit,
    })}`
  );
  const facets = Array.isArray(body.facets) ? (body.facets as DiscoveryFacetGroup[]) : [];
  const raw = Array.isArray(body.items) ? (body.items as MatchedEntry[]) : [];
  const results = await hydrate(raw);
  return {
    config: body.config && typeof body.config === "object" ? (body.config as Record<string, unknown>) : {},
    facets,
    askedFor: body.askedFor && typeof body.askedFor === "object" ? (body.askedFor as Record<string, string | null>) : {},
    results: { ...results, degraded: Boolean(body.degraded) },
  };
}

/** Machine facet keys from the database, translated by the caller. Never displayed raw. */
export const FACET_REASON_KEYS: Record<string, string> = {
  family: "discovery.facetFamily",
  notes: "discovery.facetNotes",
  gender: "discovery.facetGender",
  mood: "discovery.facetMood",
  occasion: "discovery.facetOccasion",
  season: "discovery.facetSeason",
  intensity: "discovery.facetIntensity",
  sillage: "discovery.facetSillage",
  longevity: "discovery.facetLongevity",
  price: "discovery.facetPrice",
  within_budget: "gift.withinBudget",
  occasion_match: "gift.reasonOccasion",
  season_match: "gift.reasonSeason",
  mood_match: "gift.reasonMood",
  recipient_match: "gift.reasonRecipient",
  family_match: "recommendations.reasonFamily",
  last_pieces: "gift.lastPieces",
};

/** Displayed as stored data rather than translated copy: a tag value belongs to the shop. */
export function humaniseTag(value: string): string {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}
