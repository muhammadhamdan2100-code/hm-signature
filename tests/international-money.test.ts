import { describe, expect, it } from "vitest";
import {
  FALLBACK_CURRENCIES,
  baseCurrency,
  currencyByCode,
  currencyForRegion,
  formatBase,
  formatMinor,
  fromMinor,
  isManualRate,
  sumMinor,
  toMinor,
  type CurrencyDef,
} from "../src/lib/money";
import { formatPKR } from "../src/utils/currency";

/**
 * Phase 7 money rules: arithmetic happens in integer minor units, the base currency is
 * Pakistani Rupees, and every other currency is a display view of that same number.
 * These tests pin the conversion so a rate change can never rewrite an old total.
 */

const find = (code: string): CurrencyDef => {
  const hit = currencyByCode(FALLBACK_CURRENCIES, code);
  if (!hit) throw new Error(`${code} is missing from the fallback list`);
  return hit;
};

describe("minor-unit conversion", () => {
  it("treats the base currency as a pass-through rounded to whole rupees", () => {
    const pkr = find("PKR");
    expect(pkr.minorUnits).toBe(0);
    expect(toMinor(1370, pkr)).toBe(1370);
    expect(toMinor(1438.5, pkr)).toBe(1439);
  });

  it("divides by the stored rate for a display currency", () => {
    // Rs 1,370 at Rs 278.50 per dollar is $4.92, exactly what the database quotes.
    expect(toMinor(1370, find("USD"))).toBe(492);
    expect(toMinor(1370, find("AED"))).toBe(1807);
  });

  it("round-trips a value back to the base currency within one half minor unit", () => {
    // Rounding to the display currency's own precision is lossy by design; what must
    // never happen is a loss larger than half of its smallest coin.
    for (const code of ["USD", "AED", "SAR", "GBP", "EUR"]) {
      const currency = find(code);
      const minor = toMinor(9850, currency);
      const tolerance = currency.rateToBase / Math.pow(10, currency.minorUnits) / 2;
      expect(Math.abs(fromMinor(minor, currency) - 9850)).toBeLessThanOrEqual(tolerance + 1e-9);
    }
  });

  it("accumulates in integers so repeated additions cannot drift", () => {
    // A two-decimal view of the base currency: 0.10 + 0.20 must land on exactly 0.35
    // after adding a third line, which float addition would not guarantee.
    const cented: CurrencyDef = { ...find("PKR"), minorUnits: 2 };
    const line = toMinor(0.1, cented);
    const other = toMinor(0.2, cented);
    expect([line, other]).toEqual([10, 20]);
    expect(sumMinor([line, other, 5])).toBe(35);
    expect(formatMinor(35, cented)).toBe("Rs 0.35");
  });

  it("answers a non-finite amount with zero instead of NaN", () => {
    expect(toMinor(Number.NaN, find("PKR"))).toBe(0);
    expect(toMinor(Infinity, find("USD"))).toBe(0);
  });
});

describe("display formatting", () => {
  it("keeps the atelier's own symbols and grouping", () => {
    expect(formatBase(1370, find("PKR"))).toBe("Rs 1,370");
    expect(formatBase(1370, find("USD"))).toBe("$ 4.92");
    expect(formatBase(1370, find("GBP"))).toBe("£ 3.86");
    expect(formatBase(1370, find("EUR"))).toBe("€ 4.54");
  });

  it("shows zero-decimal rupees without a decimal tail", () => {
    expect(formatBase(3050, find("PKR"))).toBe("Rs 3,050");
  });

  it("leaves the legacy PKR helper working for anything not yet migrated", () => {
    expect(formatPKR(3050)).toBe("Rs 3,050");
    expect(formatPKR(1370.4)).toBe("Rs 1,370");
  });
});

describe("currency selection", () => {
  it("maps a browser region onto a supported currency only", () => {
    expect(currencyForRegion("AE", FALLBACK_CURRENCIES)?.code).toBe("AED");
    expect(currencyForRegion("gb", FALLBACK_CURRENCIES)?.code).toBe("GBP");
    expect(currencyForRegion("CA", FALLBACK_CURRENCIES)?.code).toBe("USD");
    expect(currencyForRegion("JP", FALLBACK_CURRENCIES)).toBeNull();
    expect(currencyForRegion(undefined, FALLBACK_CURRENCIES)).toBeNull();
  });

  it("refuses an unknown or mis-cased code", () => {
    expect(currencyByCode(FALLBACK_CURRENCIES, "usd")).toBe(find("USD"));
    expect(currencyByCode(FALLBACK_CURRENCIES, "xyz")).toBeNull();
    expect(currencyByCode(FALLBACK_CURRENCIES, "")).toBeNull();
  });

  it("keeps one base currency", () => {
    expect(baseCurrency(FALLBACK_CURRENCIES).code).toBe("PKR");
    expect(FALLBACK_CURRENCIES.filter((c) => c.isBase)).toHaveLength(1);
  });

  it("declares every seeded rate as manual, never live", () => {
    expect(isManualRate(find("USD"))).toBe(true);
    expect(FALLBACK_CURRENCIES.some((c) => c.rateSource === "provider")).toBe(false);
  });
});
