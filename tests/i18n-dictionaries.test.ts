import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BUILT_IN_LANGUAGES, dictionaries, lookup } from "../src/i18n";
import { en } from "../src/i18n/dictionaries/en";
import { ar } from "../src/i18n/dictionaries/ar";
import { fr } from "../src/i18n/dictionaries/fr";
import { es } from "../src/i18n/dictionaries/es";
import { ur } from "../src/i18n/dictionaries/ur";
import { de } from "../src/i18n/dictionaries/de";

/**
 * The translation contract, checked against the real source tree.
 *
 * A component may only ask for a key that exists, and a language may not quietly drop one.
 * Both failures are invisible at runtime — the interface just falls back to English — so
 * they are asserted here instead.
 */

const ROOT = resolve(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === "i18n" || entry === "node_modules") continue;
    const stats = statSync(full);
    if (stats.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(tsx|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

const files = sourceFiles(ROOT);

const literalKeys: { file: string; key: string }[] = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(/\bt\(\s*["']([a-zA-Z][\w.]*\.[\w.]+)["']/g)) {
    literalKeys.push({ file: file.replace(`${ROOT}/`, ""), key: match[1] });
  }
}

const uniqueKeys = [...new Set(literalKeys.map((entry) => entry.key))];

function leafPaths(source: unknown, prefix = ""): string[] {
  const found: string[] = [];
  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") found.push(path);
    else if (value && typeof value === "object") found.push(...leafPaths(value, path));
  }
  return found;
}

describe("translation keys used by the interface", () => {
  it("finds the keys it expects to check", () => {
    expect(uniqueKeys.length).toBeGreaterThan(120);
  });

  it.each(uniqueKeys.map((key) => [key]))("%s exists in the English source", (key) => {
    expect(typeof lookup(en, key)).toBe("string");
  });

  it("never asks for a key that no dictionary carries", () => {
    const missing = literalKeys.filter(({ key }) => typeof lookup(en, key) !== "string");
    expect(
      missing.map((entry) => `${entry.key} (${entry.file})`),
      "components must use keys that exist in src/i18n/dictionaries/en.ts"
    ).toEqual([]);
  });

  it("interpolates named placeholders", () => {
    expect(lookup(en, "checkout.qty")).toBe("Qty: {n}");
    const template = lookup(en, "international.deliveryUnavailable") as string;
    expect(template.replace("{country}", "Spain")).toBe("Delivery to Spain is not available yet. The atelier can still be contacted about it.");
  });
});

describe("language dictionaries stay complete", () => {
  const englishLeaves = leafPaths(en);

  for (const [code, dict] of [["ar", ar], ["fr", fr], ["es", es], ["ur", ur], ["de", de]] as const) {
    it(`${code} carries every English key`, () => {
      const own = new Set(leafPaths(dict));
      const absent = englishLeaves.filter((path) => !own.has(path));
      expect(absent, `${code} is missing ${absent.length} keys`).toEqual([]);
    });

    it(`${code} defines nothing English does not have`, () => {
      const own = leafPaths(dict);
      const extra = own.filter((path) => !englishLeaves.includes(path));
      expect(extra).toEqual([]);
    });

    it(`${code} answers in another language, not English copy`, () => {
      // Structural sanity: a translation byte-identical to English usually means the string was
      // skipped. Every value listed below was checked by hand and is legitimate: a real cognate
      // ("Description"/"Notes"/"Source" in French, "Total"/"Subtotal"/"No" in Spanish,
      // "Status"/"Name"/"Journal" in German), a technical identifier, or a brand/product name.
      // A new identical value must be justified here rather than tolerated by a percentage.
      const shared = new Set([
        "Collections", "Contact", "Journal", "Menu", "Total", "Subtotal", "No", "Error", "FAQ",
        "OCCASION", "CONCENTRATION", "DESCRIPTION", "CONTACT", "CONFIRMATION", "MESSAGE",
        "instructions", "Restrictions", "Date", "Actions", "Action", "Permissions", "Description",
        "Notes", "Client", "segment", "Code", "Name", "Symbol", "Source", "Status", "Live",
        "Maintenance", "Marketing", "Notifications", "International", "Commerce", "Dashboard",
        "Occasion", "Cookies", "page.", "BOUTIQUE", "unisex", "EDITORIAL", "optional", "VIP",
        "SKU", "SKU:", "Slug:", "Slug", "URL", "base (1)", "Detail {number}", "{count} points",
        "{label} ({rate}%)", "JOURNAL · 0{n}", "HAUTE PARFUMERIE", "HM Signature — Haute Parfumerie",
        "HM Signature — Mystic Oud", "client@domain.com", "JazzCash Wallet", "Raast Instant ID",
        "Oud & Amber", "September 2026",
        "Source", "Promotions", "Visible", "Occasions", "Photos", "Stock", "Projection",
        "MANUAL", "{hours} h", "{minutes} min", "{days} d",
        "Segment", "Workflow", "Optional", "+ {size}", "SKU: {sku} • {category}", "Coupons", "Admin",
        // Place names whose German/French/Spanish spelling is the English one: "Pakistan" and
        // "Pendjab"/"Punjab" are written identically in those languages, and the address example
        // "Rahim Yar Khan, Pakistan" is a proper noun string, not copy. Arabic and Urdu render
        // them in their own script, so this cannot hide a skipped value there.
        "Pakistan", "Punjab", "Rahim Yar Khan, Pakistan",
        // "Boutiques" and "Type" are ordinary French words, spelled as in English.
        "Boutiques", "Type",
        // "Unisex" is the standard loanword in Spanish and German too.
        "Unisex",
        // Payment rails are product names, written the same way in every language.
        "JazzCash", "Raast", "PayFast",
        // Phase 8. A gift card code is a format, not copy, and "date night" is the literal
        // lower-case example the discovery-tag column validates against — translating either would
        // teach a shopper the wrong thing.
        "HM-XXXX-XXXX-XXXX", "date night",
        // Phase 8 French: "Budget", "Message", "Points", "Suggestions" are ordinary French words
        // spelled as in English (Arabic and Urdu render them in their own script, so this cannot
        // hide a skipped value there).
        "Budget", "Message", "Points", "points", "Suggestions", "{count} suggestions",
        // Phase 9. "Net" is the French word for the net amount, spelled as in English. The other
        // three are the terms German marketing analytics actually uses — a German reader looking
        // for the funnel column expects "Funnel", not a coinage — and the surrounding sentences in
        // that dictionary are translated, so these are loanwords rather than skipped work.
        "Net", "Medium", "Funnel", "Attribution",
      ]);
      const identical = englishLeaves
        .filter((path) => lookup(dict, path) === lookup(en, path))
        .map((path) => ({ path, value: String(lookup(en, path)) }))
        .filter(({ value }) => !shared.has(value.trim()));
      expect(
        identical.map(({ path, value }) => `${path} = ${JSON.stringify(value)}`),
        `${code} leaves these English strings untranslated`
      ).toEqual([]);
    });
  }

  it("no dictionary value is leftover source code", () => {
    // The English copy was partly recovered by mining git history, and that mining leaked
    // identifiers into values: "/admin/coupons", "Activity as ActivityIcon,",
    // "RECONCILIATION_STATES,", "Last ${days} days". Those render literally on screen, so the
    // shape is banned outright rather than eyeballed per key.
    const offenders: string[] = [];
    for (const [code, dict] of [["en", en], ["ar", ar], ["fr", fr], ["es", es], ["ur", ur], ["de", de]] as const) {
      for (const path of leafPaths(dict)) {
        const value = String(lookup(dict, path));
        const barePath = /^\s*\/[\w./-]*\s*$/.test(value);
        const template = value.includes("${");
        const importLeak = /\bas\s[A-Z][A-Za-z]+\s*,/.test(value) || /[A-Z][A-Z_]+_(STATES|KEYS|TYPES),/.test(value);
        const jsToken = /^\s*(const|let|function|import|export|type|interface)\s/.test(value);
        // "LogOut," and "secondary," were import-list fragments; a short value ending in a comma
        // is never a label a designer wrote.
        const danglingComma = !value.includes("|") && /,$/.test(value.trim()) && value.trim().split(/\s+/).length <= 3;
        if (barePath || template || importLeak || jsToken || danglingComma) offenders.push(`${code}.${path} = ${JSON.stringify(value)}`);
      }
    }
    expect(offenders, "dictionary values must be human text, never code").toEqual([]);
  });

  it("registers every offered language", () => {
    for (const language of BUILT_IN_LANGUAGES) {
      expect(dictionaries[language.code], `${language.code} has no dictionary`).toBeTruthy();
    }
  });

  it("keeps Arabic and Urdu right-to-left and the rest left-to-right", () => {
    expect(BUILT_IN_LANGUAGES.filter((l) => l.direction === "rtl").map((l) => l.code).sort()).toEqual(["ar", "ur"]);
    expect(BUILT_IN_LANGUAGES.filter((l) => l.direction === "ltr").map((l) => l.code).sort()).toEqual(["de", "en", "es", "fr"]);
  });
});
