import { describe, expect, it } from "vitest";
import {
  APPROVED_RATE_SUGGESTIONS,
  buildSelectorCurrencies,
  configuredDestinationCurrencies,
  hasUsableRate,
  newCurrencyDraft,
} from "../src/lib/currencyOffer";
import { countryCurrency } from "../src/lib/countries";
import { displayCurrency } from "../src/lib/currencyDisplay";
import { FALLBACK_CURRENCIES, toMinor } from "../src/lib/money";

/**
 * The navbar's currency offer, and the line between "this shop can render this money" and
 * "this shop can price a basket in it". The twelve destinations the store configures all have
 * to appear, but only the ones carrying a real rate may change a displayed price.
 */

const offer = buildSelectorCurrencies(FALLBACK_CURRENCIES);
const byCode = new Map(offer.map((c) => [c.code, c]));

const euroZoneDestinations = (): string[] => ["FR", "DE", "ES"].filter((c) => countryCurrency(c)?.code === "EUR");

describe("the twelve destinations and their own money", () => {
  const MAPPINGS: Record<string, string> = {
    PK: "PKR",
    AE: "AED",
    SA: "SAR",
    GB: "GBP",
    US: "USD",
    CA: "CAD",
    AU: "AUD",
    FR: "EUR",
    DE: "EUR",
    ES: "EUR",
    QA: "QAR",
    OM: "OMR",
  };

  it("maps each of the twelve countries to the currency its shoppers pay in", () => {
    for (const [country, code] of Object.entries(MAPPINGS)) {
      expect(countryCurrency(country)?.code, country).toBe(code);
    }
  });

  it("does not answer Canada or Australia with the US dollar", () => {
    expect(countryCurrency("CA")?.code).not.toBe("USD");
    expect(countryCurrency("AU")?.code).not.toBe("USD");
  });

  it("does not answer Qatar or Oman with the Saudi riyal", () => {
    expect(countryCurrency("QA")?.code).not.toBe("SAR");
    expect(countryCurrency("OM")?.code).not.toBe("SAR");
  });

  it("keeps the country code and the currency code as separate facts", () => {
    for (const country of Object.keys(MAPPINGS)) {
      const meta = countryCurrency(country);
      expect(meta?.code).not.toBe(country);
    }
  });
});

describe("the currency the selector offers", () => {
  it("offers exactly the ten unique currencies of the twelve destinations", () => {
    expect(offer.map((c) => c.code)).toEqual(["PKR", "USD", "AED", "SAR", "GBP", "EUR", "CAD", "AUD", "QAR", "OMR"]);
  });

  it("has no duplicate entry", () => {
    const codes = offer.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("contributes one EUR for the three eurozone destinations", () => {
    expect(euroZoneDestinations().length).toBe(3);
    expect(offer.filter((c) => c.code === "EUR")).toHaveLength(1);
  });

  it("names every option with its symbol and ISO code, never a bare code", () => {
    for (const entry of offer) {
      expect(entry.name.length).toBeGreaterThan(3);
      expect(entry.symbol).toBeTruthy();
    }
  });

  it("carries the symbols the shop specified", () => {
    expect(byCode.get("PKR")?.symbol).toBe("Rs");
    expect(byCode.get("USD")?.symbol).toBe("$");
    expect(byCode.get("GBP")?.symbol).toBe("£");
    expect(byCode.get("EUR")?.symbol).toBe("€");
    expect(byCode.get("AED")?.symbol).toBe("د.إ");
    expect(byCode.get("SAR")?.symbol).toBe("ر.س");
    expect(byCode.get("CAD")?.symbol).toBe("C$");
    expect(byCode.get("AUD")?.symbol).toBe("A$");
    expect(byCode.get("QAR")?.symbol).toBe("ر.ق");
    expect(byCode.get("OMR")?.symbol).toBe("ر.ع.");
  });

  it("writes OMR to three decimals and the zero-decimal currencies to none", () => {
    expect(byCode.get("OMR")?.minorUnits).toBe(3);
    expect(byCode.get("PKR")?.minorUnits).toBe(0);
    expect(byCode.get("CAD")?.minorUnits).toBe(2);
  });

  it("lists each destination currency even where the store has no rate row for it", () => {
    expect(configuredDestinationCurrencies()).toEqual(["PKR", "AED", "SAR", "GBP", "USD", "CAD", "AUD", "EUR", "QAR", "OMR"]);
  });
});

describe("rates: what may convert and what may not", () => {
  // The six currencies the store actually prices in today, read from the live configuration.
  const PRICED = ["PKR", "USD", "AED", "SAR", "GBP", "EUR"];
  const UNPRICED = ["CAD", "AUD", "QAR", "OMR"];

  it("accepts conversion for a currency with a configured rate", () => {
    for (const code of PRICED) expect(hasUsableRate(byCode.get(code)), code).toBe(true);
  });

  it("refuses conversion for a currency with no configured rate", () => {
    for (const code of UNPRICED) expect(hasUsableRate(byCode.get(code)), code).toBe(false);
  });

  it("stores no rate as zero rather than as parity with the rupee", () => {
    for (const code of UNPRICED) expect(byCode.get(code)?.rateToBase).toBe(0);
  });

  it("would produce an unusable figure if a missing rate were ever converted with", () => {
    // Documents why the formatter checks `hasUsableRate` first: dividing by an absent rate is
    // not a price, and a silent 1 would relabel rupees as dollars.
    const omr = byCode.get("OMR");
    expect(Number.isFinite(toMinor(45000, omr!))).toBe(false);
  });

  it("converts a priced currency by dividing rupees by PKR-per-unit", () => {
    const aed = byCode.get("AED")!;
    expect(aed.rateToBase).toBeGreaterThan(1);
    expect(toMinor(45000, aed)).toBe(59367);
  });

  it("reads the same symbols from the degraded fallback as from the registry", () => {
    for (const row of FALLBACK_CURRENCIES) {
      expect(row.symbol, row.code).toBe(displayCurrency(row.code).symbol);
      expect(row.minorUnits, row.code).toBe(displayCurrency(row.code).minorUnits);
    }
  });
});

describe("the admin's add-currency form", () => {
  it("fills everything the ISO tables know from the code alone", () => {
    const draft = newCurrencyDraft("cad", 7);
    expect(draft.code).toBe("CAD");
    expect(draft.name).toBe("Canadian Dollar");
    expect(draft.symbol).toBe("C$");
    expect(draft.minorUnits).toBe(2);
    expect(draft.isBase).toBe(false);
    expect(draft.enabled).toBe(false);
    expect(draft.rateSource).toBe("manual");
  });

  it("offers the rate the owner approved instead of leaving the field blank", () => {
    expect(newCurrencyDraft("OMR", 9).rateToBase).toBe(724.32);
    expect(newCurrencyDraft("OMR", 9).minorUnits).toBe(3);
    expect(newCurrencyDraft("QAR", 8).rateToBase).toBe(76.51);
  });

  it("leaves a currency with no approved rate at zero, which the form refuses to save", () => {
    expect(newCurrencyDraft("CHF", 10).rateToBase).toBe(0);
  });

  it("suggests rates for exactly the four currencies the owner priced", () => {
    expect(Object.keys(APPROVED_RATE_SUGGESTIONS).sort()).toEqual(["AUD", "CAD", "OMR", "QAR"]);
    for (const [code, rate] of Object.entries(APPROVED_RATE_SUGGESTIONS)) {
      expect(rate, code).toBeGreaterThan(1);
    }
  });

  it("keeps a code the tables do not know as itself rather than borrowing a name", () => {
    const draft = newCurrencyDraft("XTS", 11);
    expect(draft.name).toBe("XTS");
    expect(draft.symbol).toBe("XTS");
  });
});
