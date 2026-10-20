import { describe, expect, it } from "vitest";
import { dictionaries } from "./support/dictionaries";
import { BUILT_IN_LANGUAGES, interpolate, lookup } from "../src/i18n";
import { FALLBACK_CURRENCIES, formatMinor } from "../src/lib/money";

/**
 * Regression guards for the three verified i18n fixes. Audit-derived; they lock behaviour
 * that was previously only asserted informally.
 */

const pkr = FALLBACK_CURRENCIES.find((c) => c.code === "PKR")!;
const tokens = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);

describe("FIX 2 — Arabic built-in locale matches the enabled database row", () => {
  it("the built-in Arabic locale is ar-AE (not bare ar)", () => {
    const ar = BUILT_IN_LANGUAGES.find((l) => l.code === "ar");
    expect(ar?.locale).toBe("ar-AE");
    expect(ar?.direction).toBe("rtl");
  });
});

describe("FIX 1 — currency keeps Latin digits in every language", () => {
  // 1370 minor units of a 0-decimal currency = 1370. Symbol stays "Rs"; digits must stay ASCII
  // for ar/ur even though Intl would otherwise pick Arabic-Indic (arabext) numerals.
  for (const locale of ["en-US", "fr-FR", "es-ES", "de-DE", "ar-AE", "ur-PK"]) {
    it(`${locale}: no non-Latin digits and the Latin figure is present`, () => {
      const out = formatMinor(1370, pkr, locale);
      expect(out.startsWith("Rs ")).toBe(true);
      // Grouping may be a comma, dot, or (fr) narrow no-break space — that is locale-correct.
      // The guarantee is only that the DIGITS are Latin, never Arabic-Indic (٠-٩) or
      // Extended Arabic-Indic (۰-۹), so the price reads the same as the stored order total.
      expect(out).not.toMatch(/[؀-ۿ]/);
      expect(out.slice(3).replace(/[^0-9]/g, "")).toBe("1370");
    });
  }

  it("the default (no locale) path is unchanged: en-US grouping", () => {
    expect(formatMinor(1370, pkr)).toBe("Rs 1,370");
  });
});

describe("FIX 3 — deliveryTo placeholders match what the callers supply", () => {
  // InternationalPage passes { name }; Checkout passes { country }. A template using any other
  // token would render a literal {token}; a token the caller doesn't pass is the same bug.
  it("admin.international.deliveryTo uses only {name} in every language", () => {
    for (const [code, dict] of Object.entries(dictionaries)) {
      const value = lookup(dict, "admin.international.deliveryTo");
      expect(typeof value).toBe("string");
      expect(tokens(String(value)), `${code} deliveryTo tokens`).toEqual(["name"]);
    }
  });

  it("shipping.deliveryTo uses only {country} in every language", () => {
    for (const [code, dict] of Object.entries(dictionaries)) {
      const value = lookup(dict, "shipping.deliveryTo");
      expect(typeof value).toBe("string");
      expect(tokens(String(value)), `${code} shipping.deliveryTo tokens`).toEqual(["country"]);
    }
  });

  it("interpolates the caller's value", () => {
    const en = dictionaries.en as Record<string, unknown>;
    expect(interpolate(String(lookup(en, "shipping.deliveryTo")), { country: "Spain" })).toBe("Delivery to Spain");
  });
});
