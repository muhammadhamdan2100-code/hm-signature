import { describe, expect, it } from "vitest";
import { dictionaries } from "../src/i18n";
import { lookup } from "../src/i18n";
import { facetKey, facetLabel, facetListLabel } from "../src/lib/facets";
import { INTENSITY_OPTIONS, OCCASION_OPTIONS, SEASON_OPTIONS } from "../src/data/products";

/**
 * Facet tokens are the English values the catalogue stores; the shopper must see them in
 * their own language. These tests pin both halves: every stored option has a key, and every
 * key resolves in all six dictionaries.
 */

const LOCALES = ["en", "fr", "es", "de", "ar", "ur"] as const;
const ALL_VALUES = [...INTENSITY_OPTIONS, ...SEASON_OPTIONS, ...OCCASION_OPTIONS];

describe("facet labels", () => {
  it("maps every catalogue facet option to a key", () => {
    const unmapped = ALL_VALUES.filter((value) => facetKey(value) === null);
    expect(unmapped).toEqual([]);
  });

  it("resolves in all six dictionaries, in that dictionary's own words", () => {
    for (const locale of LOCALES) {
      const dict = dictionaries[locale];
      for (const value of ALL_VALUES) {
        const key = facetKey(value)!;
        const rendered = lookup(dict, key);
        expect(rendered, `${locale} ${key}`).not.toBe(key);
        expect(rendered.length, `${locale} ${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("ignores case and spacing, because the finder and the rows disagree on both", () => {
    expect(facetKey("all season")).toBe(facetKey("All Season"));
    expect(facetKey("  night   out ")).toBe(facetKey("Night Out"));
  });

  it("leaves anything it does not recognise exactly as it arrived", () => {
    const t = (key: string) => `«${key}»`;
    expect(facetLabel(t, "Oud & Amber")).toBe("Oud & Amber");
    expect(facetLabel(t, "")).toBe("");
    expect(facetLabel(t, null)).toBe("");
  });

  it("translates through the supplied lookup and joins a list", () => {
    const t = (key: string) => (key === "facet.season.winter" ? "Hiver" : key === "facet.season.summer" ? "Été" : key);
    expect(facetLabel(t, "Winter")).toBe("Hiver");
    expect(facetListLabel(t, ["Winter", "Summer"])).toBe("Hiver · Été");
    expect(facetListLabel(t, ["Winter", null, ""])).toBe("Hiver");
    expect(facetListLabel(t, [])).toBe("");
    expect(facetListLabel(t, null)).toBe("");
  });

  it("does not let one language's identical word stand in for another's missing translation", () => {
    // "Winter" is correct German and wrong French; the guard in i18n-dictionaries allows it
    // only for de, and this pins that the other dictionaries really did translate it.
    expect(lookup(dictionaries.de, "facet.season.winter")).toBe("Winter");
    expect(lookup(dictionaries.fr, "facet.season.winter")).not.toBe("Winter");
    expect(lookup(dictionaries.es, "facet.season.winter")).not.toBe("Winter");
    expect(lookup(dictionaries.ar, "facet.season.winter")).not.toBe("Winter");
    expect(lookup(dictionaries.ur, "facet.season.winter")).not.toBe("Winter");
  });
});
