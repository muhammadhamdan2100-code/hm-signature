import { describe, expect, it } from "vitest";
import { settlementCurrencyFor } from "../src/lib/currencyOffer";
import { CONFIGURED_DESTINATIONS, countryCurrency } from "../src/lib/countries";

/**
 * Which money the checkout asks the payment rails in.
 *
 * A rail is stored against the currencies it can actually collect, so a shopper browsing a
 * price estimate in Canadian dollars still has to be shown the rails that serve their address.
 * Asking them in the browsing currency is what left the payment step empty.
 */

const BASE = "PKR";

/** The twelve destinations as the store configures them today. */
const liveRows = CONFIGURED_DESTINATIONS.map((code) => ({
  code,
  currencyCode: countryCurrency(code)?.code ?? null,
}));

describe("the money the checkout asks the rails in", () => {
  it("asks a Pakistani destination in rupees, whatever is on screen", () => {
    for (const browsing of ["PKR", "AED", "SAR", "GBP", "USD", "CAD", "AUD", "EUR", "QAR", "OMR"]) {
      expect(settlementCurrencyFor(liveRows, "PK", BASE), browsing).toBe("PKR");
    }
  });

  it("gives one answer per destination, whatever money is on screen", () => {
    // The bug this closes: the answer used to move with the shopper's browsing currency, so
    // displaying Canadian dollars asked the rails for a currency none of them collects in.
    const browsing = ["PKR", "AED", "SAR", "GBP", "USD", "CAD", "AUD", "EUR", "QAR", "OMR"];
    for (const code of CONFIGURED_DESTINATIONS) {
      const answers = new Set(browsing.map(() => settlementCurrencyFor(liveRows, code, BASE)));
      expect(answers.size, code).toBe(1);
      expect([...answers][0], code).toBe(countryCurrency(code)?.code ?? BASE);
    }
  });

  it("asks each of the twelve destinations in that destination's own money", () => {
    const expected: Record<string, string> = {
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
    for (const code of CONFIGURED_DESTINATIONS) {
      expect(settlementCurrencyFor(liveRows, code, BASE), code).toBe(expected[code]);
    }
  });
});

describe("what decides the answer", () => {
  const rows = [
    { code: "PK", currencyCode: "PKR" },
    { code: "CA", currencyCode: "CAD" },
    { code: "ZZ", currencyCode: null },
    { code: "QQ", currencyCode: "XTS" },
  ];

  it("follows the admin's row even where it disagrees with ISO metadata", () => {
    // The shop's configuration is the authority on what it settles in, not the ISO table.
    expect(settlementCurrencyFor(rows, "QQ", BASE)).toBe("XTS");
  });

  it("falls back to what a country spends when its row carries no currency", () => {
    expect(settlementCurrencyFor([{ code: "US", currencyCode: null }], "US", BASE)).toBe("USD");
  });

  it("falls back to the base currency when the destination is unknown", () => {
    expect(settlementCurrencyFor(rows, "ZZ", BASE)).toBe(BASE);
    expect(settlementCurrencyFor(rows, "NOT_A_COUNTRY", BASE)).toBe(BASE);
  });

  it("answers the base currency rather than crashing on an empty destination", () => {
    expect(settlementCurrencyFor(rows, null, BASE)).toBe(BASE);
    expect(settlementCurrencyFor(rows, "", BASE)).toBe(BASE);
  });

  it("reads a lower-case country code as the same destination", () => {
    expect(settlementCurrencyFor(rows, "ca", BASE)).toBe("CAD");
    expect(settlementCurrencyFor(rows, "us", BASE)).toBe("USD");
  });

  it("still knows a destination's money before the configuration rows arrive", () => {
    // The first render has no rows yet; the rails must not be asked in the browsing currency.
    expect(settlementCurrencyFor([], "CA", BASE)).toBe("CAD");
    expect(settlementCurrencyFor([], "PK", BASE)).toBe("PKR");
  });
});
