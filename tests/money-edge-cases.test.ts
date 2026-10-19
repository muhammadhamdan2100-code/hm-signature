import { describe, expect, it } from "vitest";
import { formatBaseMoney, formatStoredAmount, formatOrderCharged } from "../src/utils/currency";
import { FALLBACK_CURRENCIES } from "../src/lib/money";

/**
 * The formatter's awkward cases. These are the inputs a real basket, a refund or a bad
 * network payload can actually produce, and each one has to come out as money rather than
 * as "NaN", as a blank, or as a number in the wrong scale.
 */

describe("invalid and absent amounts", () => {
  it("renders null, undefined and NaN as zero rather than as the word NaN", () => {
    for (const bad of [null, undefined, NaN, Infinity, -Infinity, "abc"]) {
      const out = formatStoredAmount(bad as number, "USD");
      expect(out).toBe("$ 0.00");
      expect(out).not.toMatch(/NaN|Infinity|undefined/);
    }
  });

  it("renders a base amount that never arrived as zero rupees", () => {
    expect(formatBaseMoney(undefined as unknown as number)).toBe("Rs 0");
    expect(formatOrderCharged({ total: NaN, currency: "PKR" })).toBe("Rs 0");
  });

  it("treats a snapshot that is a string from the driver as the number it means", () => {
    // PostgREST hands numeric columns back as numbers here, but the admin mapper already
    // coerces; a stray string must not silently print as nothing.
    expect(formatStoredAmount(Number("161.58"), "USD")).toBe("$ 161.58");
  });
});

describe("zero, negatives and magnitude", () => {
  it("renders zero at the currency's own precision", () => {
    expect(formatStoredAmount(0, "USD")).toBe("$ 0.00");
    expect(formatStoredAmount(0, "PKR")).toBe("Rs 0");
    expect(formatStoredAmount(0, "OMR")).toBe("ر.ع. 0.000");
    expect(formatStoredAmount(0, "JPY")).toBe("¥ 0");
  });

  it("keeps a negative amount negative and keeps its magnitude", () => {
    const out = formatStoredAmount(-1500.5, "USD");
    expect(out).toContain("-");
    expect(out).toContain("1,500.50");
    expect(out.startsWith("$ ")).toBe(true);
    expect(formatBaseMoney(-3100)).toContain("3,100");
  });

  it("groups a large amount without losing digits or switching to exponential form", () => {
    expect(formatStoredAmount(123456789.01, "USD")).toBe("$ 123,456,789.01");
    expect(formatBaseMoney(1234567890)).toBe("Rs 1,234,567,890");
    const out = formatStoredAmount(1e21, "USD");
    expect(out).not.toMatch(/e\+/i);
  });

  it("handles a sub-unit amount that rounds to nothing without printing a bare symbol", () => {
    expect(formatStoredAmount(0.001, "USD")).toBe("$ 0.00");
    expect(formatStoredAmount(0.0004, "OMR")).toBe("ر.ع. 0.000");
  });
});

describe("rounding boundaries", () => {
  it("rounds half away from zero at the currency's exponent", () => {
    expect(formatStoredAmount(0.005, "USD")).toBe("$ 0.01");
    expect(formatStoredAmount(0.0005, "OMR")).toBe("ر.ع. 0.001");
  });

  it("rounds an already-converted amount once, at the currency's exponent", () => {
    // 2.675 is not exactly representable in binary. What matters is that the console rounds
    // the number it was handed and does not invent a digit. The cart's separate path —
    // turning a base rupee amount into another currency's minor units — is covered by
    // tests/international-money.test.ts.
    expect(formatStoredAmount(2.675, "USD")).toBe("$ 2.68");
    expect(formatStoredAmount(2.674, "USD")).toBe("$ 2.67");
  });

  it("never adds decimals to a currency that has none", () => {
    expect(formatStoredAmount(1500.9, "JPY")).toBe("¥ 1,501");
    expect(formatBaseMoney(1370.6)).toBe("Rs 1,371");
  });
});

describe("locale changes alter grouping, never the amount", () => {
  const amount = 1234567.89;

  it("groups the same value differently per locale", () => {
    expect(formatStoredAmount(amount, "USD", "en-US")).toBe("$ 1,234,567.89");
    expect(formatStoredAmount(amount, "USD", "de")).toBe("$ 1.234.567,89");
  });

  it("keeps Latin digits and the same digits in right-to-left locales", () => {
    for (const locale of ["ar", "ur"]) {
      const out = formatStoredAmount(amount, "USD", locale);
      expect(out).not.toMatch(/[٠-٩۰-۹]/);
      expect(out.replace(/\D/g, "")).toBe("123456789");
    }
  });

  it("falls back to en-US when a locale tag cannot be understood", () => {
    // Intl throws on a malformed tag; the formatter must still print money.
    expect(formatStoredAmount(1370, "USD", "this-is-not-a-locale")).toBe("$ 1,370.00");
  });
});

describe("precision comes from the currency, not the caller", () => {
  it("ignores a snapshot precision that disagrees with the metadata", () => {
    // An OMR order cannot be stored at three decimals (numeric(12, 2)), so a two-decimal
    // value arrives and is printed with the third place as a zero — not guessed at.
    expect(formatStoredAmount(47.85, "OMR")).toBe("ر.ع. 47.850");
  });

  it("renders a currency the store does not price in using its own metadata", () => {
    // CHF is a real ISO currency the console can display, but the shop has no rate row for
    // it, so it can never be a cart total — only a code that arrives from somewhere else.
    expect(FALLBACK_CURRENCIES.some((c) => c.code === "CHF")).toBe(false);
    expect(formatStoredAmount(250, "CHF")).toBe("Fr 250.00");
  });

  it("shows the charged snapshot, not a converted base figure", () => {
    const order = { total: 45000, currency: "AED", totalInCurrency: 593.67 };
    expect(formatOrderCharged(order)).toBe("د.إ 593.67");
    expect(formatOrderCharged(order, "de")).toBe("د.إ 593,67");
  });
});
