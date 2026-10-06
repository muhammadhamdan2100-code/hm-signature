// Shared server-side layer for Phase 8 discovery and the Gift Finder.
//
// Both read the database through the caller's own token, so what a shopper can filter is exactly
// what their row-level-security context can see — a VIP-only collection cannot be reached by
// typing a filter. Facets are computed server-side too: the browser is never told "there are 12
// romantic fragrances" unless a query proved it.
import { ExperienceError, postgrestRpc } from "./_recommendations.js";

const FACET_KEYS = [
  "families",
  "notes",
  "genders",
  "moods",
  "occasions",
  "seasons",
  "intensities",
  "sillage",
  "longevity",
];

const SORTS = ["matching", "price_asc", "price_desc", "new", "bestseller", "name"];

const GENDERS = ["men", "women", "unisex"];

function list(value, allowed) {
  const parts = String(value || "")
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
  if (!allowed) return parts;
  return parts.filter((part) => allowed.includes(part));
}

function money(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1e9) throw new ExperienceError("That price is not usable.");
  return n;
}

export function buildDiscoveryFilters(query) {
  const filters = {};
  for (const key of FACET_KEYS) {
    const allowed = key === "genders" ? GENDERS : null;
    const values = list(query[key], allowed);
    if (values.length > 0) filters[key] = values;
  }
  const min = money(query.priceMin);
  const max = money(query.priceMax);
  if (min !== null) filters.priceMin = min;
  if (max !== null) filters.priceMax = max;
  if (String(query.inStock || "") === "true") filters.inStockOnly = true;
  return filters;
}

export async function runDiscovery({ query, token }) {
  const sort = SORTS.includes(String(query.sort || "")) ? String(query.sort) : "matching";
  const limit = Math.min(Math.max(Number.parseInt(String(query.limit || "12"), 10) || 12, 1), 48);
  const offset = Math.max(Number.parseInt(String(query.offset || "0"), 10) || 0, 0);
  const filters = buildDiscoveryFilters(query);

  const response = await postgrestRpc(
    "discover_products",
    { p_filters: filters, p_sort: sort, p_limit: limit, p_offset: offset },
    token
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ExperienceError(`Discovery is unavailable (${response.status}) ${detail.slice(0, 120)}`, 502);
  }
  const rows = await response.json();
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    productId: row.product_id,
    matchedFacets: Array.isArray(row.matched_facets) ? row.matched_facets : [],
    matchCount: Number(row.match_count ?? 0),
    price: row.price === null ? null : Number(row.price),
    stockTotal: Number(row.stock_total ?? 0),
  }));
}

export async function discoveryFacets(token) {
  const response = await postgrestRpc("discovery_facets", {}, token);
  if (!response.ok) throw new ExperienceError("Facets are unavailable.", 502);
  const groups = await response.json();
  return Array.isArray(groups) ? groups : [];
}

export async function giftFinderConfig(token) {
  const response = await postgrestRpc("gift_finder_config", {}, token);
  if (!response.ok) return {};
  const value = await response.json();
  return value && typeof value === "object" ? value : {};
}

export async function runGiftFinder({ query, token }) {
  const occasion = list(query.occasion)[0] || null;
  const season = list(query.season)[0] || null;
  const mood = list(query.mood)[0] || null;
  const recipient = list(query.recipient)[0] || null;
  const relationship = list(query.relationship)[0] || null;
  const family = list(query.family)[0] || null;
  const genderRaw = list(query.gender)[0] || null;

  const args = {
    p_occasion: occasion,
    p_season: season,
    p_mood: mood,
    p_recipient: recipient,
    p_relationship: relationship,
    p_family: family,
    p_gender: genderRaw && GENDERS.includes(genderRaw) ? genderRaw : null,
    p_budget_min: money(query.budgetMin),
    p_budget_max: money(query.budgetMax),
    p_limit: Math.min(Math.max(Number.parseInt(String(query.limit || "4"), 10) || 4, 1), 8),
  };

  const response = await postgrestRpc("find_gifts", args, token);
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ExperienceError(`Gift suggestions are unavailable (${response.status}) ${detail.slice(0, 120)}`, 502);
  }
  const rows = await response.json();
  return {
    askedFor: { occasion, season, mood, recipient, relationship },
    items: (Array.isArray(rows) ? rows : []).map((row) => ({
      productId: row.product_id,
      score: Number(row.score ?? 0),
      reasonCodes: Array.isArray(row.reason_codes) ? row.reason_codes : [],
      price: row.price === null ? null : Number(row.price),
      stockTotal: Number(row.stock_total ?? 0),
    })),
  };
}
