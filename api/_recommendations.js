// Shared server-side layer for Phase 8 brand experience: recommendations, discovery and gifts.
//
// Ranking lives in the database (`recommend_products`), not here and never in the browser, for
// one reason: the function is SECURITY INVOKER, so a shopper only ever receives products their
// own row-level-security context can see. Doing the same ranking client-side would mean shipping
// the whole catalogue to the browser and trusting it to hide what should be hidden.
//
// The caller's own bearer token is forwarded so auth.uid() resolves inside that function; without
// it a signed-in customer would silently get the guest rails.
import { supabasePublishableKey, supabaseUrl } from "./_config.js";

export const RECOMMENDATION_KINDS = [
  "recommended_for_you",
  "you_may_also_like",
  "because_you_viewed",
  "similar_fragrances",
  "complete_your_collection",
  "frequently_paired",
];

export const GENDERS = ["men", "women", "unisex"];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ExperienceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function postgrestRpc(name, args, token) {
  const url = supabaseUrl();
  const publishable = supabasePublishableKey();
  if (!url || !publishable) {
    throw new ExperienceError("Supabase is not configured in this deployment.", 503);
  }
  return fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: publishable,
      Authorization: `Bearer ${token || publishable}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(8000),
  });
}

export function resolveToken(req) {
  const header = String(req.headers.authorization || "");
  const match = header.match(/^Bearer\s+(.+)$/i);
  const bearer = match ? match[1].trim() : "";
  // Only a real JWT is forwarded. Anything else falls back to the publishable key inside
  // postgrestRpc(), so a malformed header cannot turn into a broken authorization header.
  if (bearer && bearer.split(".").length === 3) return bearer;
  return "";
}

export function parseRecentIds(value) {
  const list = String(value || "")
    .split(",")
    .map((id) => id.trim().toLowerCase())
    .filter((id) => UUID.test(id))
    .slice(0, 12);
  return list;
}

// The Super Admin's switch has to be honoured where the ranking happens, not in the browser.
// Cached per process because it is global configuration, not customer data.
const RAIL_KEYS = {
  recommended_for_you: "recommendedForYou",
  you_may_also_like: "youMayAlsoLike",
  because_you_viewed: "becauseYouViewed",
  similar_fragrances: "similarFragrances",
  complete_your_collection: "completeYourCollection",
  frequently_paired: "frequentlyPaired",
};

let settingsCache = { at: 0, value: null };

async function personalizationSettings() {
  if (settingsCache.value && Date.now() - settingsCache.at < 30000) return settingsCache.value;
  try {
    const response = await postgrestRpc("personalization_config", {}, "");
    const value = response.ok ? await response.json() : null;
    settingsCache = { at: Date.now(), value: value && typeof value === "object" ? value : null };
  } catch {
    // Unreachable configuration is treated as "not configured", which the caller reads as off.
    settingsCache = { at: Date.now(), value: null };
  }
  return settingsCache.value;
}

/**
 * Ranked products for one rail. Validation is strict because everything here arrives from a
 * browser: an unknown kind, a malformed id or an oversized limit is refused rather than
 * reinterpreted.
 */
export async function rankProducts({ kind, productId, recentIds, limit, gender, token }) {
  if (!RECOMMENDATION_KINDS.includes(kind)) {
    throw new ExperienceError("That recommendation list is not available.");
  }
  if (productId != null && !UUID.test(String(productId).toLowerCase())) {
    throw new ExperienceError("That product reference is not valid.");
  }
  if (gender != null && !GENDERS.includes(String(gender))) {
    throw new ExperienceError("That leaning is not recognised.");
  }
  const size = Number.parseInt(String(limit ?? ""), 10);
  if (Number.isFinite(size) && (size < 1 || size > 8)) {
    throw new ExperienceError("A recommendation list holds between 1 and 8 fragrances.");
  }

  const settings = await personalizationSettings();
  if (settings && settings.enabled === false) return [];
  if (settings && settings.rails && settings.rails[RAIL_KEYS[kind]] === false) return [];

  let wanted = Number.isFinite(size) ? size : 4;
  const perRail = Number.parseInt(String(settings?.resultsPerRail ?? ""), 10);
  if (Number.isFinite(perRail)) wanted = Math.min(wanted, perRail);

  const response = await postgrestRpc(
    "recommend_products",
    {
      p_kind: kind,
      p_product_id: productId || null,
      p_recent_ids: recentIds && recentIds.length ? recentIds : null,
      p_limit: wanted,
      p_gender: gender || null,
    },
    token
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ExperienceError(`Recommendations are unavailable (${response.status}) ${detail.slice(0, 120)}`, 502);
  }

  const rows = await response.json();
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    productId: row.product_id,
    kind: row.kind,
    basis: row.basis,
    score: Number(row.score ?? 0),
    reasonCodes: Array.isArray(row.reason_codes) ? row.reason_codes : [],
    price: row.price === null ? null : Number(row.price),
    stockTotal: Number(row.stock_total ?? 0),
  }));
}
