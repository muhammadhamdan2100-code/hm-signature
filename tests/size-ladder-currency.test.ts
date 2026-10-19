import { describe, expect, it } from "vitest";
import { autoPriceFor } from "../src/data/products";
import { baseRupeesFor, currencyAmountForBase } from "../src/lib/currencyOffer";
import type { CurrencyDef } from "../src/lib/money";

/**
 * The 50 ml ladder read in another money.
 *
 * The shop stores one figure per size, in base rupees, and converts for display — so one 50 ml
 * price is the only input a currency needs. These tests pin that the same anchor produces the
 * proportional size ladder in every priced currency, and that typing the anchor in a foreign
 * currency lands on the rupee figure the storefront then reads back.
 */

const def = (code: string, rateToBase: number, minorUnits = 2): CurrencyDef => ({
  code,
  name: code,
  symbol: code,
  minorUnits,
  rateToBase,
  isBase: false,
  enabled: true,
  sortOrder: 0,
  rateSource: "manual",
});

const USD = def("USD", 278.5);
const AED = def("AED", 75.8);
const OMR = def("OMR", 724.32, 3);
const SIZES = ["10ml", "30ml", "50ml", "100ml"];

const ladder = (anchorRupees: number, currency: CurrencyDef) =>
  SIZES.map((size) => currencyAmountForBase(autoPriceFor(anchorRupees, size), currency));

describe("one 50 ml anchor, read in any currency", () => {
  it("keeps the sizes proportional in rupees", () => {
    expect(SIZES.map((s) => autoPriceFor(13925, s))).toEqual([2785, 8355, 13925, 27850]);
  });

  it("gives the same proportional ladder in dollars", () => {
    // 13,925 rupees is exactly $50 at 278.5, so the ladder must read 10 / 30 / 50 / 100.
    expect(ladder(13925, USD).map((v) => v.toFixed(2))).toEqual(["10.00", "30.00", "50.00", "100.00"]);
  });

  it("keeps each size within one unit of that currency's own rounding", () => {
    // The ladder is rounded to whole rupees first, because that is all the store keeps, so a
    // foreign figure can sit one minor unit off a strict proportional conversion. It must never
    // sit further.
    const anchor = 3500;
    for (const currency of [USD, AED, OMR]) {
      const unit = 1 / 10 ** currency.minorUnits;
      SIZES.forEach((size, index) => {
        const strict = currencyAmountForBase((anchor / 50) * parseInt(size, 10), currency);
        const shown = currencyAmountForBase(autoPriceFor(anchor, size), currency);
        expect(Math.abs(shown - strict), `${currency.code} ${size}`).toBeLessThanOrEqual(unit);
      });
    }
  });

  it("prints a three-decimal currency with three decimals", () => {
    const omrLadder = ladder(36216, OMR).map((v) => v.toFixed(OMR.minorUnits));
    expect(omrLadder).toEqual(["10.000", "30.001", "50.000", "100.000"]);
  });
});

describe("typing the 50 ml price in another currency", () => {
  it("converts to whole rupees, which is all the store keeps", () => {
    expect(baseRupeesFor(50, USD)).toBe(13925);
    expect(Number.isInteger(baseRupeesFor(199, USD))).toBe(true);
  });

  it("reads back the exact figure that was typed", () => {
    for (const currency of [USD, AED, OMR]) {
      const typed = 199;
      expect(currencyAmountForBase(baseRupeesFor(typed, currency), currency)).toBeCloseTo(typed, 1);
    }
  });

  it("derives every other size from it, so no second price entry is needed", () => {
    const anchor = baseRupeesFor(50, USD);
    expect(ladder(anchor, USD).map((v) => v.toFixed(0))).toEqual(["10", "30", "50", "100"]);
  });

  it("refuses to invent a ladder for a currency with no rate", () => {
    const unpriced = def("CHF", 0);
    expect(Number.isNaN(baseRupeesFor(50, unpriced))).toBe(true);
    expect(Number.isNaN(currencyAmountForBase(3500, unpriced))).toBe(true);
  });
});
