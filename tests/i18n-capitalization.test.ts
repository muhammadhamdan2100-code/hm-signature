import { describe, expect, it } from "vitest";
import { dictionaries } from "../src/i18n";
import { lookup } from "../src/i18n";

// Nav labels are proper labels, not sentences, so in Latin-script locales they start with an
// uppercase letter. This caught (and now prevents) a lone lowercase fr "avis" among capitalized
// siblings. Arabic/Urdu have no letter case, so they are intentionally excluded.
const LATIN_LOCALES = ["en", "fr", "es", "de"] as const;

function firstLevelValues(dict: unknown): { key: string; value: string }[] {
  const nav = (dict as Record<string, { nav?: unknown }>).admin?.nav;
  if (!nav || typeof nav !== "object") return [];
  return Object.entries(nav as Record<string, unknown>)
    .filter(([, v]) => typeof v === "string")
    .map(([k, v]) => ({ key: `admin.nav.${k}`, value: String(v) }));
}

describe("admin nav labels are capitalized in Latin-script locales", () => {
  for (const locale of LATIN_LOCALES) {
    it(`${locale}: no admin.nav label starts with a lowercase letter`, () => {
      const offenders = firstLevelValues(dictionaries[locale]).filter(({ value }) => /^[a-z]/.test(value));
      expect(
        offenders.map((o) => `${o.key}="${o.value}"`),
        `${locale} admin nav labels must not start lowercase`
      ).toEqual([]);
    });
  }

  it("fr admin.nav.reviews is the corrected capitalized form", () => {
    expect(lookup(dictionaries.fr, "admin.nav.reviews")).toBe("Avis");
  });
});
