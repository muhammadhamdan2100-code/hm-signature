import { describe, expect, it } from "vitest";
import {
  BASE_CURRENCY_CODE,
  FALLBACK_CURRENCIES,
  currencyByCode,
  currencyForRegion,
  formatMinor,
  toMinor,
} from "../src/lib/money";

/**
 * Table-driven currency-model correctness. Complements international-money (conversion
 * arithmetic) and i18n-locale-currency (digit rendering) by asserting the authoritative
 * offline currency table is right and that per-currency formatting honours precision.
 */

// Authoritative expected metadata for the currencies HM Signature supports (ISO 4217).
// PKR is the base and has 0 minor units; the others use 2. Symbols must be distinct so no
// two supported currencies can be confused for one another in the UI.
const EXPECTED: Record<string, { symbol: string; minorUnits: number }> = {
  PKR: { symbol: "Rs", minorUnits: 0 },
  USD: { symbol: "$", minorUnits: 2 },
  AED: { symbol: "د.إ", minorUnits: 2 },
  SAR: { symbol: "ر.س", minorUnits: 2 },
  GBP: { symbol: "£", minorUnits: 2 },
  EUR: { symbol: "€", minorUnits: 2 },
};

describe("supported currency model", () => {
  const supported = FALLBACK_CURRENCIES.filter((c) => c.enabled);

  it("declares exactly the expected supported currencies", () => {
    expect(supported.map((c) => c.code).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it.each(Object.keys(EXPECTED))("%s has the correct symbol and minor-unit precision", (code) => {
    const c = currencyByCode(FALLBACK_CURRENCIES, code)!;
    expect(c.symbol).toBe(EXPECTED[code].symbol);
    expect(c.minorUnits).toBe(EXPECTED[code].minorUnits);
  });

  it("keeps one base currency and it is the declared base", () => {
    const bases = supported.filter((c) => c.isBase);
    expect(bases.map((c) => c.code)).toEqual([BASE_CURRENCY_CODE]);
  });

  it("no two supported currencies share a symbol (the shared-symbol trap)", () => {
    const symbols = supported.map((c) => c.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it.each(Object.keys(EXPECTED))("%s renders with its own precision", (code) => {
    const c = currencyByCode(FALLBACK_CURRENCIES, code)!;
    // One whole base unit (1 PKR) expressed in this currency.
    const out = formatMinor(toMinor(1, c), c, "en-US");
    const number = out.slice(c.symbol.length + 1);
    if (c.minorUnits === 0) expect(number).not.toContain(".");
    else expect(number).toMatch(/\.\d{2}$/);
    expect(out.startsWith(`${c.symbol} `)).toBe(true);
  });
});

describe("region → currency mapping stays within supported currencies", () => {
  // The region table may only resolve to an enabled, supported currency or null; it must never
  // invent a currency the store does not price in. A region whose own currency is not yet
  // configured (CA/AU/QA/OM until CAD, AUD, QAR and OMR are added) resolves to null rather
  // than to a neighbouring currency, so the shopper sees the base price instead of a wrong one.
  it.each(["PK", "AE", "SA", "GB", "US", "FR", "DE", "ES", "ca", "au", "qa", "om", "xx"])(
    "region %s maps to an enabled supported currency or null",
    (region) => {
      const resolved = currencyForRegion(region, FALLBACK_CURRENCIES);
      if (resolved) {
        expect(FALLBACK_CURRENCIES.some((c) => c.code === resolved.code && c.enabled)).toBe(true);
      }
    }
  );
});
