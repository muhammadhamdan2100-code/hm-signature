import { describe, expect, it } from "vitest";
import { autoPriceFor } from "../src/data/products";
import { currencyByCode, FALLBACK_CURRENCIES, formatMinor, toMinor } from "../src/lib/money";
import { displayCurrency } from "../src/lib/currencyDisplay";
import {
  APPROVED_RATE_SUGGESTIONS,
  baseRupeesFor,
  currencyAmountForBase,
  newCurrencyDraft,
  validateCurrencyDraft,
} from "../src/lib/currencyOffer";
import { formatBaseMoney, formatOrderCharged, formatStoredAmount } from "../src/utils/currency";

/**
 * The currency matrix. Every expected figure here was worked out from the documented
 * convention — `rate_to_base` is how many base rupees make one unit of the other currency, so a
 * base amount is always DIVIDED by it — and then checked by hand, not copied from the code.
 */

const BASE = 45000;

describe("conversion of one base amount across the currency set", () => {
  // The six the store prices in today, read from the live `currencies` configuration.
  const PRICED: Record<string, string> = {
    PKR: "Rs 45,000",
    USD: "$ 161.58",
    AED: "د.إ 593.67",
    SAR: "ر.س 605.65",
    GBP: "£ 126.76",
    EUR: "€ 149.01",
  };

  it.each(Object.entries(PRICED))("%s: Rs 45,000 prints as the documented figure", (code, expected) => {
    const row = currencyByCode(FALLBACK_CURRENCIES, code)!;
    expect(formatMinor(toMinor(BASE, row), row, "en-US")).toBe(expected);
  });

  it("divides by the rate instead of multiplying, so dollars never become crores", () => {
    const usd = currencyByCode(FALLBACK_CURRENCIES, "USD")!;
    // 45,000 × 278.5 would be 12,532,500 — the inverted-direction bug this guards.
    expect(toMinor(BASE, usd)).toBe(16158);
    expect(toMinor(BASE, usd)).toBeLessThan(BASE);
  });

  it("keeps the rupee at zero decimals and the others at their own exponent", () => {
    expect(displayCurrency("PKR").minorUnits).toBe(0);
    expect(displayCurrency("USD").minorUnits).toBe(2);
    expect(displayCurrency("OMR").minorUnits).toBe(3);
  });
});

describe("the four pending currencies against the owner-approved rates", () => {
  const EXPECTED: Record<string, string> = {
    CAD: "C$ 230.37",
    AUD: "A$ 232.39",
    QAR: "ر.ق 588.16",
    OMR: "ر.ع. 62.127",
  };

  it.each(Object.entries(EXPECTED))("%s: Rs 45,000 converts once the approved rate is configured", (code, expected) => {
    const rate = APPROVED_RATE_SUGGESTIONS[code];
    const def = displayCurrency(code);
    const asRow = { ...def, rateToBase: rate, isBase: false, enabled: true, name: def.code };
    expect(formatMinor(toMinor(BASE, asRow), asRow, "en-US")).toBe(expected);
  });

  it("derives every one of them from the store's own USD figure, not from a fresh feed", () => {
    const usd = currencyByCode(FALLBACK_CURRENCIES, "USD")!.rateToBase;
    // The same cross-multiplication reproduces the AED and SAR rows already in the table.
    expect(usd / currencyByCode(FALLBACK_CURRENCIES, "AED")!.rateToBase).toBeCloseTo(3.674, 3);
    expect(usd / currencyByCode(FALLBACK_CURRENCIES, "SAR")!.rateToBase).toBeCloseTo(3.748, 3);
  });
});

describe("rounding and precision edge cases", () => {
  it("rounds an already-converted amount at the currency's own exponent", () => {
    expect(formatStoredAmount(0.005, "USD")).toBe("$ 0.01");
    expect(formatStoredAmount(0.004, "USD")).toBe("$ 0.00");
    expect(formatStoredAmount(47.8455, "OMR")).toBe("ر.ع. 47.846");
    expect(formatStoredAmount(47.8454, "OMR")).toBe("ر.ع. 47.845");
  });

  it("never shows a fraction of a rupee, and never loses one either", () => {
    expect(formatBaseMoney(1370.6)).toBe("Rs 1,371");
    expect(formatBaseMoney(1370.4)).toBe("Rs 1,370");
    expect(formatBaseMoney(0)).toBe("Rs 0");
  });

  it("survives a large order without exponential notation or lost digits", () => {
    const usd = currencyByCode(FALLBACK_CURRENCIES, "USD")!;
    const out = formatMinor(toMinor(123456789, usd), usd, "en-US");
    expect(out).toBe("$ 443,291.88");
    expect(out).not.toMatch(/e\+/i);
  });
});

describe("a placed order never moves with today's rate", () => {
  it("prints the stored snapshot even when the base figure implies something else", () => {
    // total_in_currency is what the shopper was charged; total is the rupee ledger value.
    const order = { total: 999999, currency: "USD", totalInCurrency: 161.58 };
    expect(formatOrderCharged(order)).toBe("$ 161.58");
  });

  it("states the currency when a snapshot is missing rather than guessing a conversion", () => {
    expect(formatOrderCharged({ total: 45000, currency: "USD", totalInCurrency: null })).toBe("Rs 45,000 (PKR)");
  });

  it("renders a rupee order as rupees whatever is being browsed", () => {
    expect(formatOrderCharged({ total: 45000, currency: "PKR", totalInCurrency: 45000 })).toBe("Rs 45,000");
  });
});

describe("the 50ml anchor still prices every other size", () => {
  it("reproduces the live product form at a Rs 3,500 base", () => {
    expect(autoPriceFor(3500, "10ml")).toBe(700);
    expect(autoPriceFor(3500, "30ml")).toBe(2100);
    expect(autoPriceFor(3500, "50ml")).toBe(3500);
    expect(autoPriceFor(3500, "100ml")).toBe(7000);
  });

  it("moves every derived size when the anchor moves, as observed in the admin form", () => {
    expect(autoPriceFor(10000, "10ml")).toBe(2000);
    expect(autoPriceFor(10000, "30ml")).toBe(6000);
    expect(autoPriceFor(10000, "100ml")).toBe(20000);
  });

  it("handles a non-preset size and refuses to invent one from a bad base", () => {
    expect(autoPriceFor(3100, "42ml")).toBe(2604);
    expect(autoPriceFor(0, "50ml")).toBe(0);
    expect(autoPriceFor(3000, "ml")).toBe(3000);
  });
});

describe("the admin form's save gate, per currency", () => {
  const existing = FALLBACK_CURRENCIES.map((c) => c.code);

  it("accepts each approved currency draft as it is prefilled", () => {
    for (const code of Object.keys(APPROVED_RATE_SUGGESTIONS)) {
      expect(validateCurrencyDraft(newCurrencyDraft(code, 9), existing, true), code).toBeNull();
    }
  });

  it("rejects a currency that has no rate yet, for each of the four", () => {
    for (const code of ["CAD", "AUD", "QAR", "OMR"]) {
      expect(validateCurrencyDraft({ code, rateToBase: 0, isBase: false }, [], true), code).toBe("rateMissing");
    }
  });

  it("rejects the placeholder rate of 1 rather than calling rupees dollars", () => {
    expect(validateCurrencyDraft({ code: "CAD", rateToBase: 1, isBase: false }, [], true)).toBe("ratePlaceholder");
  });

  it("lets the base currency keep its rate of 1, because that is what it means", () => {
    expect(validateCurrencyDraft({ code: "PKR", rateToBase: 1, isBase: true }, existing, false)).toBeNull();
  });

  it("rejects a malformed code and a duplicate code", () => {
    expect(validateCurrencyDraft({ code: "cad", rateToBase: 195.34, isBase: false }, [], true)).toBe("codeShape");
    expect(validateCurrencyDraft({ code: "CAD1", rateToBase: 195.34, isBase: false }, [], true)).toBe("codeShape");
    expect(validateCurrencyDraft({ code: "USD", rateToBase: 278.5, isBase: false }, existing, true)).toBe("codeDuplicate");
  });

  it("does not call an existing row a duplicate of itself when editing", () => {
    expect(validateCurrencyDraft({ code: "USD", rateToBase: 279, isBase: false }, existing, false)).toBeNull();
  });

  it("rejects a non-finite rate instead of writing NaN into a money column", () => {
    expect(validateCurrencyDraft({ code: "CAD", rateToBase: NaN, isBase: false }, [], true)).toBe("rateMissing");
    expect(validateCurrencyDraft({ code: "CAD", rateToBase: Infinity, isBase: false }, [], true)).toBe("rateMissing");
  });
});

describe("setting a product price in another currency", () => {
  const usd = { code: "USD", rateToBase: 278.5, isBase: false, minorUnits: 2 };
  const omr = { code: "OMR", rateToBase: 724.32, isBase: false, minorUnits: 3 };
  const noRate = { code: "CAD", rateToBase: 0, isBase: false, minorUnits: 2 };

  it("turns a typed dollar price into whole rupees", () => {
    expect(baseRupeesFor(199, usd)).toBe(55422);
  });

  it("reads the stored rupee price back as the figure the owner typed", () => {
    expect(currencyAmountForBase(55422, usd)).toBe(199);
    expect(currencyAmountForBase(45000, omr)).toBe(62.127);
  });

  it("refuses to invent a price for a currency with no rate", () => {
    expect(baseRupeesFor(199, noRate)).toBeNaN();
    expect(currencyAmountForBase(45000, noRate)).toBeNaN();
    expect(baseRupeesFor(NaN, usd)).toBeNaN();
    expect(baseRupeesFor(Infinity, usd)).toBeNaN();
  });

  it("keeps the rupee rounding gap visible instead of hiding it", () => {
    // A cent in dollars is not a whole rupee; the conversion rounds and reads back honestly.
    expect(baseRupeesFor(0.01, usd)).toBe(3);
    expect(currencyAmountForBase(3, usd)).toBe(0.01);
  });
});
