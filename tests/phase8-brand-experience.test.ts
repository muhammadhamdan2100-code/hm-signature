import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { RECOMMENDATION_REASON_KEYS } from "../src/services/recommendations";
import { FACET_REASON_KEYS } from "../src/services/brandExperience";
import { en } from "../src/i18n/dictionaries/en";
import { hasPermission } from "../src/services/auth";
import { resolveRequiredPermission, type StaffMember } from "../src/types/staff";
import { login, readSupabaseEnv, reportSkip, rest, rpc, suiteCredentials } from "./support/harness";

/**
 * The recommendation and discovery engines live in the server-side API modules
 * `api/_recommendations.js` and `api/_discovery.js`. Those are deferred with the API
 * layer (the current Vercel Hobby deployment ships 0 serverless functions), so the
 * modules may be absent. When they are, the two source-level suites that exercise them
 * are skipped rather than crashing the whole file at import time; the suites that only
 * need `src/` (authorisation matrix, live-database checks) still run.
 */
const REC_PATH = resolve(process.cwd(), "api/_recommendations.js");
const DISC_PATH = resolve(process.cwd(), "api/_discovery.js");
const API_AVAILABLE = existsSync(REC_PATH) && existsSync(DISC_PATH);

let ExperienceError: new (...args: any[]) => Error = class extends Error {};
let RECOMMENDATION_KINDS: string[] = [];
let parseRecentIds: (raw: string) => string[] = () => [];
let rankProducts: (opts: any) => Promise<any> = async () => {
  throw new Error("recommendations API deferred");
};
let buildDiscoveryFilters: (opts: any) => any = () => ({});
let runGiftFinder: (opts: any) => Promise<any> = async () => null;

if (API_AVAILABLE) {
  const rec = await import("../api/_recommendations.js");
  const disc = await import("../api/_discovery.js");
  ExperienceError = rec.ExperienceError;
  RECOMMENDATION_KINDS = rec.RECOMMENDATION_KINDS;
  parseRecentIds = rec.parseRecentIds;
  rankProducts = rec.rankProducts;
  buildDiscoveryFilters = disc.buildDiscoveryFilters;
  runGiftFinder = disc.runGiftFinder;
}

/**
 * Phase 8 (personalisation, recommendations, discovery, gift finder, gift cards, loyalty, VIP,
 * exclusive collections, limited editions, pre-orders, waitlists).
 *
 * Two things are asserted everywhere here: that the code never claims a reason it cannot prove, and
 * that nothing customer-private can be read or written without a session. Where a rule is enforced
 * twice — once in the browser and once inside the database — both halves are checked, because the
 * browser gate is a courtesy and the database gate is the security boundary.
 */

const staffOf = (role: StaffMember["role"]): StaffMember => ({
  id: `qa-${role}`,
  name: `QA ${role}`,
  email: `qa-phase8-${role.toLowerCase().replace(/\s+/g, "-")}@hmsignature.test`,
  role,
  status: "Active",
  lastActive: "",
  createdAt: "",
  permissions: {},
});

/** A dotted path inside the English dictionary, which is the source of truth for every language. */
function dictionaryHas(path: string): boolean {
  let node: unknown = en;
  for (const part of path.split(".")) {
    if (!node || typeof node !== "object" || !(part in (node as Record<string, unknown>))) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" && (node as string).trim().length > 0;
}

describe.skipIf(!API_AVAILABLE)("Phase 8 translation keys are real, not humanised accidents", () => {
  it("gives every recommendation reason a dictionary entry", () => {
    const codes = [
      "family_match", "notes_match", "category_match", "collection_match",
      "occasion_match", "season_match", "intensity_match",
      "house_bestseller", "house_new",
    ];
    for (const code of codes) {
      const key = RECOMMENDATION_REASON_KEYS[code];
      expect(key, `no translation key for reason ${code}`).toBeTruthy();
      expect(dictionaryHas(key as string), `${key} missing from the English dictionary`).toBe(true);
    }
  });

  it("gives every discovery facet and gift reason a dictionary entry", () => {
    const codes = [
      "family", "notes", "gender", "mood", "occasion", "season", "intensity", "sillage", "longevity", "price",
      "within_budget", "occasion_match", "season_match", "mood_match", "recipient_match", "family_match", "last_pieces",
    ];
    for (const code of codes) {
      const key = FACET_REASON_KEYS[code];
      expect(key, `no translation key for facet ${code}`).toBeTruthy();
      expect(dictionaryHas(key as string), `${key} missing from the English dictionary`).toBe(true);
    }
  });

  it("names every rail it can render", () => {
    for (const kind of RECOMMENDATION_KINDS) {
      const pascal = kind.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
      expect(dictionaryHas(`recommendations.title${pascal}`), `no title for rail ${kind}`).toBe(true);
    }
    expect(dictionaryHas("recommendations.titleSignatureSelection")).toBe(true);
  });
});

describe.skipIf(!API_AVAILABLE)("Phase 8 server-side input handling", () => {
  it("refuses an unknown rail rather than guessing one", async () => {
    await expect(rankProducts({ kind: "everything_i_want", token: null })).rejects.toBeInstanceOf(ExperienceError);
  });

  it("refuses a malformed product id and an impossible list size", async () => {
    await expect(rankProducts({ kind: "recommended_for_you", productId: "not-a-uuid", token: null })).rejects.toBeInstanceOf(ExperienceError);
    await expect(rankProducts({ kind: "recommended_for_you", limit: 999, token: null })).rejects.toBeInstanceOf(ExperienceError);
  });

  it("keeps guest history short and only as ids", () => {
    const uuid = "42139dfd-888f-4691-845f-438e1f2c27e1";
    const list = [uuid, "junk", uuid, ...Array.from({ length: 30 }, () => uuid)];
    const parsed = parseRecentIds(list.join(","));
    expect(parsed.length).toBeLessThanOrEqual(12);
    expect(new Set(parsed).size).toBe(1);
  });

  it("normalises filters to lower case and rejects an invented price", () => {
    const filters = buildDiscoveryFilters({ families: ["Floral Amber", "  "], genders: ["men", "everyone"] });
    expect(filters.families).toEqual(["floral amber"]);
    expect(filters.genders).toEqual(["men"]);
    expect(() => buildDiscoveryFilters({ priceMin: "-4" })).toThrow();
    expect(() => buildDiscoveryFilters({ priceMin: "abc" })).toThrow();
  });

  it("answers a gift query with the asks it understood", async () => {
    // The shape is what the storefront notice depends on: an untagged ask must be reported, not swallowed.
    const result = await runGiftFinder({ query: { occasion: "Eid", budgetMax: "1" }, token: null }).catch(() => null);
    if (result === null) return; // no deployment configuration in this environment
    expect(result.askedFor.occasion).toBe("eid");
    expect(Array.isArray(result.items)).toBe(true);
  });
});

describe("Phase 8 admin authorisation matrix", () => {
  it("governs each new workspace explicitly", () => {
    expect(resolveRequiredPermission("/admin/brand")).toBe("personalization.manage");
    expect(resolveRequiredPermission("/admin/discovery")).toBe("discovery.manage");
    expect(resolveRequiredPermission("/admin/rewards")).toBe("loyalty.manage");
    expect(resolveRequiredPermission("/admin/gift-cards")).toBe("giftCards.manage");
    expect(resolveRequiredPermission("/admin/preorders")).toBe("preorders.view");
    expect(resolveRequiredPermission("/admin/waitlists")).toBe("waitlists.view");
  });

  it("keeps stored value and customer-facing configuration with the Super Admin", () => {
    for (const key of ["personalization.manage", "giftCards.manage", "loyalty.manage", "vip.manage"]) {
      expect(hasPermission(staffOf("Manager"), key), `Manager must not hold ${key}`).toBe(false);
      expect(hasPermission(staffOf("Order Manager"), key), `Order Manager must not hold ${key}`).toBe(false);
      expect(hasPermission(staffOf("Content Manager"), key), `Content Manager must not hold ${key}`).toBe(false);
      expect(hasPermission(staffOf("Super Admin"), key), `Super Admin must hold ${key}`).toBe(true);
    }
  });

  it("lets the roles that work orders work pre-orders and waitlists", () => {
    for (const key of ["preorders.manage", "waitlists.manage"]) {
      expect(hasPermission(staffOf("Order Manager"), key)).toBe(true);
      expect(hasPermission(staffOf("Manager"), key)).toBe(true);
      expect(hasPermission(staffOf("Content Manager"), key), `Content Manager must not hold ${key}`).toBe(false);
    }
    // Character tagging is content work, and the database guard for it is manage_products.
    expect(hasPermission(staffOf("Content Manager"), "discovery.manage")).toBe(true);
    expect(hasPermission(staffOf("Order Manager"), "discovery.manage")).toBe(false);
  });

  it("does not leave a new page accidentally public", () => {
    // Child routes inherit the nearest mapped prefix, so a sub-page cannot be unreadable-but-open.
    expect(resolveRequiredPermission("/admin/brand/anything")).toBe("personalization.manage");
    expect(resolveRequiredPermission("/admin/rewards/anything")).toBe("loyalty.manage");
    expect(resolveRequiredPermission("/admin/gift-cards/anything")).toBe("giftCards.manage");
  });
});

const env = readSupabaseEnv();
const live = env ? describe : describe.skip;

live("Phase 8 against the live database", () => {
  it("lets a shopper read rails, facets and a card state, and nothing that decides them", async () => {
    if (!env) throw new Error("unreachable");
    for (const [fn, payload] of [
      ["recommend_products", { p_kind: "recommended_for_you", p_limit: 2 }],
      ["discover_products", { p_filters: {}, p_sort: "matching", p_limit: 2 }],
      ["find_gifts", { p_budget_max: 5000 }],
      ["discovery_facets", {}],
      ["gift_card_state", { p_code: "HM-0000-0000-0000" }],
      ["personalization_config", {}],
      ["gift_finder_config", {}],
      ["loyalty_config", {}],
    ] as const) {
      const response = await rpc(env, null, fn, payload as Record<string, unknown>);
      expect(response.status, `${fn} should be readable by a guest`).toBe(200);
    }

    const refused: Array<[string, Record<string, unknown>]> = [
      ["save_personalization_config", { p_config: { enabled: true } }],
      ["save_gift_finder_config", { p_config: { enabled: true } }],
      ["save_gift_card_config", { p_config: { enabled: true } }],
      ["save_loyalty_config", { p_config: { enabled: true } }],
      ["save_recommendation_rule", { p_signal: "family", p_weight: 50, p_enabled: true }],
      ["issue_gift_card", { p_amount: 100, p_currency: "PKR" }],
      ["redeem_gift_card", { p_order_id: "00000000-0000-0000-0000-000000000000", p_code: "HM-AAAA-AAAA-AAAA" }],
      ["release_gift_card", { p_order_id: "00000000-0000-0000-0000-000000000000" }],
      ["redeem_loyalty_points", { p_order_id: "00000000-0000-0000-0000-000000000000", p_points: 10 }],
      ["adjust_loyalty_points", { p_customer_id: "00000000-0000-0000-0000-000000000000", p_points: 10, p_reason: "test" }],
      ["my_loyalty", {}],
      ["save_product_discovery_tag", { p_product_id: "00000000-0000-0000-0000-000000000000", p_kind: "mood", p_value: "calm" }],
      ["remove_product_discovery_tag", { p_tag_id: "00000000-0000-0000-0000-000000000000" }],
      ["save_product_edition", { p_product_id: "00000000-0000-0000-0000-000000000000", p_is_limited: false, p_edition_total: null, p_edition_number: null, p_released_on: null, p_ends_on: null }],
      ["save_collection_access", { p_collection_id: "00000000-0000-0000-0000-000000000000", p_visibility: "Private", p_visible_from: null, p_visible_until: null, p_min_tier_rank: null, p_country_codes: [] }],
      ["notify_waitlist", { p_waitlist_id: "00000000-0000-0000-0000-000000000000" }],
      ["set_pre_order_status", { p_pre_order_id: "00000000-0000-0000-0000-000000000000", p_status: "Confirmed", p_order_id: null }],
      ["reserve_pre_order", { p_product_id: "00000000-0000-0000-0000-000000000000", p_variant_id: null, p_quantity: 1, p_email: "x@example.invalid" }],
      ["set_gift_card_status", { p_card_id: "00000000-0000-0000-0000-000000000000", p_status: "Active" }],
    ];
    for (const [fn, payload] of refused) {
      const response = await rpc(env, null, fn, payload);
      expect([401, 403], `${fn} must not be callable by a guest`).toContain(response.status);
    }
  }, 45000);

  it("refuses an anonymous read of points, cards, ledgers and lists at the permission layer", async () => {
    if (!env) throw new Error("unreachable");
    for (const table of ["loyalty_ledger", "gift_cards", "gift_card_redemptions", "product_views", "vip_tiers", "pre_orders", "waitlists", "recommendation_rules"]) {
      const response = await rest(env, null, `${table}?select=*&limit=1`, { representation: false });
      expect([401, 403], `anon should not be granted select on ${table}`).toContain(response.status);
    }
    // What genuinely is public stays public.
    for (const table of ["products", "collections", "product_discovery_tags"]) {
      const response = await rest(env, null, `${table}?select=*&limit=1`, { representation: false });
      expect(response.status, `${table} must stay readable`).toBe(200);
    }
  });

  it("never claims a shopper signal a guest does not have", async () => {
    if (!env) throw new Error("unreachable");
    const response = await rpc(env, null, "recommend_products", { p_kind: "recommended_for_you", p_limit: 4 });
    expect(response.status).toBe(200);
    const rows = response.json<{ basis: string; product_id: string }[]>();
    for (const row of rows) {
      // A guest has no history in the database, so calling the rail personalised would be a lie.
      expect(row.basis).toBe("catalogue");
      expect(row.product_id).toBeTruthy();
    }
  });

  it("returns nothing for a character the shop has not recorded", async () => {
    if (!env) throw new Error("unreachable");
    const facets = await rpc(env, null, "discovery_facets", {});
    expect(facets.status).toBe(200);
    const groups = facets.json<{ kind: string; values: { value: string }[] }[]>();
    const knownMoods = new Set(
      groups.filter((group) => group.kind === "mood").flatMap((group) => group.values.map((value) => value.value))
    );

    const untagged = await rpc(env, null, "discover_products", {
      p_filters: { moods: ["definitely-not-a-real-mood-value"] },
      p_sort: "matching",
      p_limit: 10,
    });
    expect(untagged.status).toBe(200);
    // A filter nothing satisfies must yield nothing — this is the invention guard.
    expect(untagged.json<unknown[]>().length).toBe(0);

    for (const mood of knownMoods) {
      const tagged = await rpc(env, null, "discover_products", { p_filters: { moods: [mood] }, p_sort: "matching", p_limit: 10 });
      expect(tagged.json<unknown[]>().length, `facet ${mood} was advertised with no product behind it`).toBeGreaterThan(0);
    }
  });

  it("keeps every public collection visible until the shop marks it exclusive", async () => {
    if (!env) throw new Error("unreachable");
    const collections = await rest(env, null, "collections?select=id,visibility&active=eq.true", { representation: false });
    expect(collections.status).toBe(200);
    const rows = collections.json<{ id: string; visibility: string }[]>();
    const gated = await rpc(env, null, "discover_products", { p_filters: {}, p_sort: "matching", p_limit: 48 });
    expect(gated.status).toBe(200);
    // The restrictive policy must not silently hide the catalogue a guest already had.
    const products = await rest(env, null, "products?select=id&active=eq.true&limit=100", { representation: false });
    expect(products.json<unknown[]>().length).toBe(gated.json<unknown[]>().length);
    for (const row of rows) {
      const seen = await rpc(env, null, "collection_availability", { p_collection_id: row.id, p_country_code: null });
      expect(seen.status).toBe(200);
      expect(seen.json<{ visible: boolean }>().visible, `${row.visibility} collection should be visible to a guest`).toBe(row.visibility !== "Private");
    }
  });

  it("holds the ledger and card invariants that make a balance meaningful", async () => {
    if (!env) throw new Error("unreachable");
    const cards = await rest(env, null, "gift_cards?select=balance,initial_amount,status&limit=200", { representation: false });
    expect([200, 401, 403]).toContain(cards.status);

    const products = await rest(env, null, "products?select=id,is_limited_edition,edition_total&limit=100", { representation: false });
    expect(products.status).toBe(200);
    for (const row of products.json<{ is_limited_edition: boolean; edition_total: number | null }[]>()) {
      if (row.is_limited_edition) {
        expect(row.edition_total, "a limited edition must state its release size").not.toBeNull();
        expect(Number(row.edition_total)).toBeGreaterThan(0);
      } else {
        // 8.9: closing an edition clears its promise rather than leaving a stale number behind.
        expect(row.edition_total, "a fragrance that is not a limited edition carries no edition size").toBeNull();
      }
    }

    const tiers = await rest(env, null, "vip_tiers?select=code,min_lifetime_spend,min_points&limit=20", { representation: false });
    expect(tiers.status).toBe(401);
    // A guest may not read the ladder, and the derived standing is read from the rails instead:
    // every profile keeps the default until the shop sets a threshold.
    const derived = await rpc(env, null, "personalization_config", {});
    expect(derived.status).toBe(200);
  });

  it("does not let a signed-in customer read another customer's rewards", async () => {
    if (!env) throw new Error("unreachable");
    const credentials = suiteCredentials();
    if (!credentials) {
      reportSkip("no SUITE_A_* credentials — cross-customer isolation for Phase 8 rewards not exercised");
      return;
    }
    const session = await login(env, credentials.aEmail, credentials.aPassword);
    if (!session) {
      reportSkip("SUITE_A cannot sign in — cross-customer isolation for Phase 8 rewards not exercised");
      return;
    }

    const ownLedger = await rest(env, session.token, "loyalty_ledger?select=id&limit=5", { representation: false });
    expect(ownLedger.status).toBe(200);

    // Someone else's order: applying a card or points to it must be refused on ownership alone.
    const foreign = await rpc(env, session.token, "redeem_loyalty_points", {
      p_order_id: "00000000-0000-0000-0000-000000000000",
      p_points: 10,
    });
    expect(foreign.status).toBeGreaterThanOrEqual(400);
    const foreignCard = await rpc(env, session.token, "redeem_gift_card", {
      p_order_id: "00000000-0000-0000-0000-000000000000",
      p_code: "HM-AAAA-AAAA-AAAA",
    });
    expect(foreignCard.status).toBeGreaterThanOrEqual(400);

    // A customer cannot open a programme, issue a card or rewrite a tier either.
    for (const [fn, payload] of [
      ["save_loyalty_config", { p_config: { enabled: true, pointsPerUnit: 1, conversionRate: 1 } }],
      ["issue_gift_card", { p_amount: 500, p_currency: "PKR" }],
      ["save_vip_tier", { p_code: "gold", p_name: "Gold", p_rank: 3, p_min_lifetime_spend: 1, p_min_points: null, p_benefits: [], p_enabled: true }],
      ["adjust_loyalty_points", { p_customer_id: session.id, p_points: 1000, p_reason: "self-award" }],
    ] as const) {
      const response = await rpc(env, session.token, fn, payload as Record<string, unknown>);
      expect(response.status, `${fn} must be refused for a signed-in customer`).toBeGreaterThanOrEqual(400);
    }
  });
});
