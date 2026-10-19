import { describe, expect, it } from "vitest";
import { dictionaries, lookup } from "../src/i18n";
import {
  defaultFinderAnswers,
  resolveMatchReason,
  scoreProduct,
  type MatchReason,
} from "../src/lib/fragranceMatch";
import type { Product } from "../src/data/products";

/**
 * "Why this matched" lines used to be composed in English inside the matching engine, which
 * has no language, so every non-English shopper read English. The engine now emits a key and
 * its words, and the screen resolves them. These tests pin both halves.
 */

const REASON_KEYS = [
  "reasonFamilyExact", "reasonFamilyAdjacent",
  "reasonIntensityExact", "reasonIntensityAbove", "reasonIntensityBelow",
  "reasonSeasonAllFor", "reasonSeasonPartial", "reasonSeasonExact", "reasonSeasonNear",
  "reasonOccasionExact", "reasonOccasionNear",
  "reasonLeaningVersatile", "reasonLeaningMasculine", "reasonLeaningFeminine",
  "reasonNotesMany", "reasonNotes",
];

const LOCALES = ["en", "fr", "es", "de", "ar", "ur"] as const;

const product = (over: Partial<Product>): Product =>
  ({ name: "Test Flacon", id: "p1", ...over } as unknown as Product);

const translate =
  (locale: (typeof LOCALES)[number]) =>
  (key: string, params?: Record<string, string | number>) => {
    const raw = lookup(dictionaries[locale], key);
    if (!params) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
  };

describe("match reason keys", () => {
  it("every reason the engine can emit has a key in all six dictionaries", () => {
    for (const locale of LOCALES) {
      for (const leaf of REASON_KEYS) {
        const path = `scentFinder.${leaf}`;
        const value = lookup(dictionaries[locale], path);
        expect(value, `${locale} ${path}`).not.toBe(path);
        expect(value.length, `${locale} ${path}`).toBeGreaterThan(0);
      }
    }
  });

  it("the engine emits keys, never sentences", () => {
    const answers = { ...defaultFinderAnswers(), season: "Winter", intensity: "Strong" };
    const ranked = scoreProduct(
      answers,
      product({ seasons: ["Winter"], intensity: "Strong", occasions: ["Evening"], occasion: "Evening" })
    );
    expect(ranked.reasons.length).toBeGreaterThan(0);
    for (const reason of ranked.reasons) {
      expect(reason.key).toMatch(/^scentFinder\.reason/);
      // A composed English sentence would still contain a spaced verb; a key never does.
      expect(reason.key.split(" ").length).toBe(1);
    }
  });

  it("substitutes the words a sentence needs", () => {
    const reason: MatchReason = { key: "scentFinder.reasonSeasonExact", params: { season: "winter" } };
    expect(translate("en")(reason.key, reason.params)).toBe("Listed for winter — the season you named.");
  });

  it("translates the facet word inside the sentence, not just the sentence", () => {
    const reason: MatchReason = { key: "scentFinder.reasonSeasonExact", params: { season: "winter" } };
    const french = resolveMatchReason(reason, translate("fr"));
    expect(french).toContain("Hiver");
    expect(french).not.toMatch(/\bwinter\b/);
    // German really does spell it "Winter", so the surrounding sentence proves the lookup ran.
    expect(resolveMatchReason(reason, translate("de"))).toContain("Jahreszeit");
  });

  it("leaves words the facet table does not know exactly as the engine wrote them", () => {
    const reason: MatchReason = { key: "scentFinder.reasonNotes", params: { notes: "bergamot, vetiver" } };
    expect(resolveMatchReason(reason, translate("fr"))).toContain("bergamot, vetiver");
  });

  it("resolves a reason that takes no parameters", () => {
    const reason: MatchReason = { key: "scentFinder.reasonLeaningVersatile" };
    expect(resolveMatchReason(reason, translate("en"))).toBe("Composed as a versatile scent, suited to anyone.");
    expect(resolveMatchReason(reason, translate("es"))).toBe("Compuesto como un perfume versátil, apto para cualquiera.");
  });

  it("carries the intensity direction in the key, not in an English word mid-sentence", () => {
    // The engine lower-cases the token, so this also proves the lookup tolerates it.
    const above: MatchReason = { key: "scentFinder.reasonIntensityAbove", params: { intensity: "strong" } };
    const below: MatchReason = { key: "scentFinder.reasonIntensityBelow", params: { intensity: "light" } };
    const frenchAbove = resolveMatchReason(above, translate("fr"));
    expect(frenchAbove).toContain("au-dessus");
    expect(frenchAbove).toContain("Intense");
    expect(frenchAbove).not.toMatch(/\bstrong\b/);
    const frenchBelow = resolveMatchReason(below, translate("fr"));
    expect(frenchBelow).toContain("en dessous");
    expect(frenchBelow).toContain("Léger");
  });
});
