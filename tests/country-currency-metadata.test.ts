import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  countryByCode,
  countryCurrency,
  flagFor,
} from "../src/lib/countries";
import {
  CURRENCY_CODES,
  CURRENCY_DISPLAY,
  displayCurrency,
  isSettlementPrecisionReady,
  currencyName,
} from "../src/lib/currencyDisplay";
import { formatStoredAmount } from "../src/utils/currency";

/**
 * The country and currency tables are the only place in the storefront that claims what
 * money a place is priced in, so they are checked as data rather than trusted as data.
 * Nothing here touches the database: these are static facts about ISO 3166-1 and ISO 4217.
 */

describe("country table shape", () => {
  it("uses unique, well-formed ISO 3166-1 alpha-2 codes", () => {
    const codes = COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(code).toMatch(/^[A-Z]{2}$/);
  });

  it("names every country and gives it a language", () => {
    for (const c of COUNTRIES) {
      expect(c.name.length, c.code).toBeGreaterThan(1);
      expect(c.lang).toMatch(/^[a-z]{2,3}$/);
    }
  });

  it("is large enough to be a real country list, not the twelve seeded destinations", () => {
    expect(COUNTRIES.length).toBeGreaterThan(200);
  });
});

describe("country to currency mapping", () => {
  // The set the brief names explicitly, plus the shared-currency and multi-currency cases
  // that a naive one-country-one-currency table gets wrong.
  const EXPECTED: Record<string, string> = {
    PK: "PKR", AE: "AED", SA: "SAR", GB: "GBP", US: "USD", FR: "EUR", DE: "EUR", ES: "EUR",
    CA: "CAD", AU: "AUD", QA: "QAR", OM: "OMR",
    // Shared currencies, legitimately.
    ME: "EUR", XK: "EUR", AD: "EUR", MC: "EUR", VA: "EUR", IT: "EUR", PT: "EUR", NL: "EUR",
    CI: "XOF", SN: "XOF", ML: "XOF", CM: "XAF", GA: "XAF", TD: "XAF",
    KN: "XCD", LC: "XCD", VC: "XCD", GD: "XCD", AG: "XCD", DM: "XCD",
    PF: "XPF", NC: "XPF", WF: "XPF",
    LI: "CHF", CH: "CHF",
    NZ: "NZD", CK: "NZD", NU: "NZD", TK: "NZD", PN: "NZD",
    TV: "AUD", KI: "AUD", NR: "AUD", NF: "AUD", CC: "AUD",
    SG: "SGD", BN: "BND",
    LS: "LSL", NA: "NAD", SZ: "SZL", ZA: "ZAR",
    BT: "BTN", IN: "INR",
    // Multi-currency or dollarised economies: the documented default, not an invention.
    EC: "USD", SV: "USD", PA: "PAB", ZW: "USD", TL: "USD", BQ: "USD", TC: "USD", VG: "USD",
    // Neighbours of Pakistan, which the store ships to or may ship to.
    IR: "IRR", AF: "AFN", CN: "CNY", TR: "TRY",
  };

  it.each(Object.entries(EXPECTED))("%s maps to %s", (code, currency) => {
    expect(countryByCode(code)?.currency).toBe(currency);
  });

  it("never points a country at a currency the registry cannot render", () => {
    const unknown = COUNTRIES.filter((c) => !CURRENCY_CODES.includes(c.currency));
    expect(unknown.map((c) => `${c.code}:${c.currency}`)).toEqual([]);
  });

  it("avoids obsolete and invented codes", () => {
    // Withdrawn by ISO 4217; a table that still lists them is quoting dead money.
    const obsolete = ["SLL", "MRO", "ZWD", "ZWL", "TRL", "VEF", "GWP", "GWEU", "XBA", "US1", "CAD2"];
    const used = new Set(COUNTRIES.map((c) => c.currency));
    for (const code of obsolete) expect(used.has(code), code).toBe(false);
  });

  it("keeps every currency code three upper-case letters", () => {
    for (const code of CURRENCY_CODES) expect(code).toMatch(/^[A-Z]{3}$/);
    expect(new Set(CURRENCY_CODES).size).toBe(CURRENCY_CODES.length);
  });

  it("names every currency it can render", () => {
    for (const code of CURRENCY_CODES) {
      expect(currencyName(code), code).not.toBe(code);
    }
    expect(currencyName("")).toBe("");
    expect(currencyName("QQQ")).toBe("QQQ");
  });
});

describe("currency precision comes from the table, not a two-decimal habit", () => {
  const ZERO = ["JPY", "KRW", "VND", "CLP", "RSD", "ISK", "XOF", "XAF", "XPF", "DJF", "BIF", "GNF", "KMF", "UGX", "PYG", "MGA", "MRU", "VUV"];
  const THREE = ["OMR", "KWD", "BHD", "IQD", "JOD", "LYD", "TND"];
  // PKR is deliberately not here: the store handles whole rupees, asserted in
  // tests/admin-order-currency.test.ts.
  const TWO = ["USD", "EUR", "GBP", "AED", "SAR", "CAD", "AUD", "QAR", "INR", "CNY", "CHF", "TRY", "MYR", "SGD", "ZAR"];

  it.each(ZERO)("%s has no minor unit", (code) => {
    expect(displayCurrency(code).minorUnits).toBe(0);
  });

  it.each(THREE)("%s is rendered to three decimals", (code) => {
    expect(displayCurrency(code).minorUnits).toBe(3);
  });

  it.each(TWO)("%s is rendered to two decimals", (code) => {
    expect(displayCurrency(code).minorUnits).toBe(2);
  });

  it("formats each precision from the same amount", () => {
    expect(formatStoredAmount(1500, "JPY")).toBe("¥ 1,500");
    expect(formatStoredAmount(1500, "USD")).toBe("$ 1,500.00");
    expect(formatStoredAmount(1500, "PKR")).toBe("Rs 1,500");
    expect(formatStoredAmount(1500, "OMR")).toBe("ر.ع. 1,500.000");
    expect(formatStoredAmount(1500, "BHD")).toBe("BHD 1,500.000");
  });

  it("gives every currency a symbol nobody else in the table uses", () => {
    const symbols = CURRENCY_CODES.map((c) => CURRENCY_DISPLAY[c].symbol);
    const dupes = symbols.filter((s, i) => symbols.indexOf(s) !== i);
    expect(dupes).toEqual([]);
  });

  it("falls back to the code itself for an unknown currency", () => {
    expect(displayCurrency("XTS")).toEqual({ code: "XTS", symbol: "XTS", minorUnits: 2 });
    expect(displayCurrency(null).code).toBe("");
  });
});

describe("settlement precision the storage cannot hold", () => {
  // orders.total_in_currency is numeric(12, 2) and the loyalty and gift-card restatements
  // round to two, so a three-decimal currency is display-ready but not settlement-ready.
  const THREE_DECIMAL = ["OMR", "KWD", "BHD", "IQD", "JOD", "LYD", "TND"];

  it.each(THREE_DECIMAL)("%s is not settlement-ready", (code) => {
    expect(isSettlementPrecisionReady(code)).toBe(false);
  });

  it.each(["PKR", "USD", "EUR", "CAD", "AUD", "QAR", "JPY"])("%s is settlement-ready", (code) => {
    expect(isSettlementPrecisionReady(code)).toBe(true);
  });
});

describe("flags and unknown places", () => {
  it("builds a flag from the country code", () => {
    // PK is the regional-indicator pair for P and K, computed rather than pasted.
    expect(flagFor("PK")).toBe(String.fromCodePoint(0x1f1f5, 0x1f1f0));
    expect(flagFor("us")).toBe(flagFor("US"));
  });

  it("does not invent a flag or a currency for something it cannot read", () => {
    expect(flagFor("X")).toBe("🏳️");
    expect(flagFor("XYZ")).toBe("🏳️");
    expect(flagFor(null)).toBe("🏳️");
    expect(flagFor("")).toBe("🏳️");
    expect(countryCurrency("ZZ")).toBeNull();
    expect(countryCurrency("")).toBeNull();
  });

  it("describes a known country's money without a rate", () => {
    expect(countryCurrency("CA")).toEqual({ code: "CAD", symbol: "C$", minorUnits: 2, name: "Canadian Dollar" });
    expect(countryCurrency("OM")).toEqual({ code: "OMR", symbol: "ر.ع.", minorUnits: 3, name: "Omani Rial" });
    expect(countryCurrency("JP")).toEqual({ code: "JPY", symbol: "¥", minorUnits: 0, name: "Japanese Yen" });
  });
});
