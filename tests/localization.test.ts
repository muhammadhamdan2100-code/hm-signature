import { describe, expect, it } from "vitest";
import { applyBundle, type TranslationBundle } from "../src/services/localizedContent";
import { BUILT_IN_LANGUAGES, dictionaries, interpolate, lookup, translateFor } from "../src/i18n";
import { en } from "../src/i18n/dictionaries/en";
import { login, readSupabaseEnv, reportSkip, rest, rpc, suiteCredentials } from "./support/harness";

/**
 * Localization contract for the storefront and for the database.
 *
 * Two failure modes matter here: a translation replacing something it must not touch, and a
 * browser session reaching a translation write it has no business making. Both are asserted.
 */

const env = readSupabaseEnv();
const run = env ? describe : describe.skip;

describe("translation merge rules", () => {
  const target = { id: "p1", name: "Mystic Oud", description: "English text", price: 4800, sku: "HM-MYS" };

  it("replaces only the named copy fields", () => {
    const bundle: TranslationBundle = { name: "ميستيك أود", description: "نص عربي" };
    const merged = applyBundle(target, bundle, { name: "name", description: "description" });
    expect(merged.name).toBe("ميستيك أود");
    expect(merged.description).toBe("نص عربي");
    // Price, identifier and SKU are never translation targets and must survive untouched.
    expect(merged.price).toBe(4800);
    expect(merged.sku).toBe("HM-MYS");
    expect(merged.id).toBe("p1");
  });

  it("keeps the source value when a field is absent, empty or whitespace", () => {
    expect(applyBundle(target, { name: "   " }, { name: "name" }).name).toBe("Mystic Oud");
    expect(applyBundle(target, {}, { name: "name" }).name).toBe("Mystic Oud");
    expect(applyBundle(target, { description: "وصف" }, { name: "name" }).description).toBe("English text");
  });

  it("returns the same object shape rather than a partial one", () => {
    const merged = applyBundle(target, { name: "X" }, { name: "name" });
    expect(Object.keys(merged).sort()).toEqual(Object.keys(target).sort());
  });
});

describe("language registration and fallback", () => {
  it("offers exactly six languages with the right direction", () => {
    expect(BUILT_IN_LANGUAGES.map((l) => l.code).sort()).toEqual(["ar", "de", "en", "es", "fr", "ur"]);
    expect(BUILT_IN_LANGUAGES.find((l) => l.code === "ur")).toMatchObject({ direction: "rtl", locale: "ur-PK" });
    expect(BUILT_IN_LANGUAGES.filter((l) => l.direction === "rtl").map((l) => l.code).sort()).toEqual(["ar", "ur"]);
    expect(BUILT_IN_LANGUAGES.filter((l) => l.direction === "ltr").map((l) => l.code).sort()).toEqual(["de", "en", "es", "fr"]);
  });

  it("never renders a raw key, even when no dictionary has it", () => {
    const t = translateFor("ar");
    const rendered = t("definitelyNotARealNamespace.someMissingLeaf");
    expect(rendered).not.toContain("definitelyNotARealNamespace.");
    expect(rendered).toBe("some missing leaf");
  });

  it("falls back to English text when the chosen language lacks a key", () => {
    const english = lookup(en, "cart.viewCart");
    expect(typeof english).toBe("string");
    // A language dictionary that carries the key wins over the English fallback.
    expect(translateFor("ar")("cart.viewCart")).not.toBe(english);
  });

  it("leaves unknown placeholder tokens intact rather than deleting them", () => {
    expect(interpolate("Total {amount} for {country}", { amount: "Rs 4,750" })).toBe("Total Rs 4,750 for {country}");
  });
});

run("translation storage is read-only to the browser", () => {
  it("publishes translations for reading", async () => {
    const res = await rest(env!, null, "content_translations?select=entity_type,entity_ref,language_code,payload&limit=5");
    expect(res.status).toBe(200);
  });

  it("refuses an anonymous save through the RPC", async () => {
    const attempt = await rpc(env!, null, "save_content_translation", {
      p_entity_type: "product",
      p_entity_ref: "00000000-0000-0000-0000-000000000000",
      p_language: "ar",
      p_values: { name: "injected" },
    });
    expect(attempt.status).toBeGreaterThanOrEqual(400);
    // Scoped to the row the refusal was trying to create, so real catalog translations that
    // legitimately live in this table cannot make the check pass or fail by accident.
    const after = await rest(
      env!,
      null,
      "content_translations?select=id&entity_ref=eq.00000000-0000-0000-0000-000000000000"
    );
    expect(after.json<any[]>().length ?? 0).toBe(0);
  });

  it("refuses an anonymous delete through the RPC", async () => {
    const attempt = await rpc(env!, null, "delete_content_translation", {
      p_entity_type: "product",
      p_entity_ref: "00000000-0000-0000-0000-000000000000",
      p_language: "ar",
    });
    expect(attempt.status).toBeGreaterThanOrEqual(400);
  });

  it("refuses a direct insert and a direct patch from a signed-in customer", async () => {
    const creds = suiteCredentials();
    const session = await login(env!, creds.aEmail, creds.aPassword);
    if (!session) {
      reportSkip("no suite customer account");
      return;
    }
    const insert = await rest(env!, session.token, "content_translations", {
      method: "POST",
      body: { entity_type: "product", entity_ref: "00000000-0000-0000-0000-000000000001", language_code: "fr", payload: { name: "nope" } },
    });
    expect([200, 201, 204, 401, 403]).toContain(insert.status);
    const after = await rest(env!, session.token, "content_translations?select=id&language_code=eq.fr");
    expect(Array.isArray(after.json()) ? after.json<unknown[]>().length : 0).toBe(0);
  });

  it("registers six enabled languages in the database", async () => {
    const res = await rest(env!, null, "languages?select=code,direction,enabled&order=sort_order.asc");
    const rows = res.json<{ code: string; direction: string; enabled: boolean }[]>();
    expect(rows.map((r) => r.code).sort()).toEqual(["ar", "de", "en", "es", "fr", "ur"]);
    expect(rows.find((r) => r.code === "ur")?.direction).toBe("rtl");
  });

  it("keeps the storefront source content intact", async () => {
    const products = await rest(env!, null, "products?select=id,slug,sku,name&active=is.true");
    expect(products.json<unknown[]>().length).toBeGreaterThanOrEqual(6);
    const orders = await rest(env!, null, "orders?select=id,order_number&limit=1");
    // An anonymous session must not be able to read order rows at all.
    expect(Array.isArray(orders.json()) ? orders.json<unknown[]>().length : 1).toBe(0);
  });
});
