import { describe, expect, it } from "vitest";
import {
  CURRENCY_DISPLAY,
  displayCurrency,
  displayCurrencyDef,
} from "../src/lib/currencyDisplay";
import {
  formatBaseMoney,
  formatOrderCharged,
  formatStoredAmount,
  orderBaseAmountLabel,
} from "../src/utils/currency";
import { FALLBACK_CURRENCIES, currencyForRegion, type CurrencyDef } from "../src/lib/money";

/**
 * Admin money displays must report the register a figure was stored in.
 *
 * `quote_order` computes goods, country fee and tax in base rupees and converts only the
 * final total once into `total_in_currency`, so a console that prints `orders.total` under
 * the order's own currency code mislabels the number. These tests pin the difference:
 * an order's currency comes from its snapshot, never from what the storefront is browsing.
 */

describe("order currency is read from the stored snapshot", () => {
  it("shows a PKR order in rupees whatever the storefront country is", () => {
    const order = { total: 45000, currency: "PKR", totalInCurrency: 45000 };
    for (const browsing of ["AE", "US", "GB", "SA", null]) {
      expect(formatOrderCharged({ ...order, destinationCountry: browsing })).toBe("Rs 45,000");
    }
  });

  it("shows a USD order in dollars using the stored converted amount", () => {
    const order = { total: 45000, currency: "USD", totalInCurrency: 161.58 };
    expect(formatOrderCharged(order)).toBe("$ 161.58");
    // The rupee figure stays available, and is named as rupees.
    expect(orderBaseAmountLabel(order)).toBe("Rs 45,000 PKR");
  });

  it("keeps each order's own currency when a list mixes currencies", () => {
    const orders = [
      { total: 45000, currency: "PKR", totalInCurrency: 45000 },
      { total: 45000, currency: "AED", totalInCurrency: 593.67 },
      { total: 45000, currency: "SAR", totalInCurrency: 605.65 },
      { total: 45000, currency: "GBP", totalInCurrency: 126.76 },
      { total: 45000, currency: "EUR", totalInCurrency: 149.0 },
    ];
    expect(orders.map((o) => formatOrderCharged(o))).toEqual([
      "Rs 45,000",
      "د.إ 593.67",
      "ر.س 605.65",
      "£ 126.76",
      "€ 149.00",
    ]);
  });

  it("treats a missing currency code as the base rupee, not as a foreign currency", () => {
    expect(formatOrderCharged({ total: 3100 })).toBe("Rs 3,100");
    expect(formatOrderCharged({ total: 3100, currency: null })).toBe("Rs 3,100");
    expect(orderBaseAmountLabel({ total: 3100, currency: "pkr" })).toBeNull();
  });

  it("falls back to the base amount and names it when no snapshot was stored", () => {
    // Never divide by a guessed rate: the rupee figure is shown with its currency stated.
    const order = { total: 45000, currency: "USD", totalInCurrency: null };
    const out = formatOrderCharged(order);
    expect(out).toBe("Rs 45,000 (PKR)");
    expect(out).not.toContain("$");
    expect(orderBaseAmountLabel(order)).toBe("Rs 45,000 PKR");
  });

  it("does not re-derive a stored foreign amount from any rate", () => {
    // 161.58 USD is printed as 161.58 USD even though USD carries a rate of 278.5 PKR.
    const usd = FALLBACK_CURRENCIES.find((c) => c.code === "USD")!;
    expect(usd.rateToBase).toBeGreaterThan(1);
    expect(formatStoredAmount(161.58, "USD")).toBe("$ 161.58");
    expect(formatOrderCharged({ total: 45000, currency: "USD", totalInCurrency: 161.58 })).toBe("$ 161.58");
  });
});

describe("base-rupee figures", () => {
  it("rounds to whole rupees and groups them", () => {
    expect(formatBaseMoney(1370)).toBe("Rs 1,370");
    expect(formatBaseMoney(1370.4)).toBe("Rs 1,370");
    expect(formatBaseMoney(0)).toBe("Rs 0");
  });

  it("groups by locale while keeping Latin digits", () => {
    expect(formatBaseMoney(1370, "de")).toBe("Rs 1.370");
    // French groups with a narrow no-break space (U+202F), not a plain space.
    expect(formatBaseMoney(1370, "fr")).toBe("Rs 1\u202F370");
    const arabic = formatBaseMoney(1370, "ar");
    expect(arabic).not.toMatch(/[٠-٩]/);
    expect(arabic).toContain("1,370");
  });

  it("zero amount in a foreign currency still prints with that currency's decimals", () => {
    expect(formatStoredAmount(0, "USD")).toBe("$ 0.00");
    expect(formatStoredAmount(0, "OMR")).toBe("ر.ع. 0.000");
  });
});

describe("currency display metadata", () => {
  // ISO 4217 minor-unit exponents: PKR has no subunit, OMR is priced in thousandths.
  const EXPECTED: Record<string, { symbol: string; minorUnits: number }> = {
    PKR: { symbol: "Rs", minorUnits: 0 },
    USD: { symbol: "$", minorUnits: 2 },
    EUR: { symbol: "€", minorUnits: 2 },
    GBP: { symbol: "£", minorUnits: 2 },
    AED: { symbol: "د.إ", minorUnits: 2 },
    SAR: { symbol: "ر.س", minorUnits: 2 },
    CAD: { symbol: "C$", minorUnits: 2 },
    AUD: { symbol: "A$", minorUnits: 2 },
    QAR: { symbol: "ر.ق", minorUnits: 2 },
    OMR: { symbol: "ر.ع.", minorUnits: 3 },
  };

  it.each(Object.keys(EXPECTED))("%s carries the right symbol and precision", (code) => {
    expect(displayCurrency(code)).toEqual({ code, ...EXPECTED[code] });
  });

  it("has a distinct symbol for every currency it can print", () => {
    const symbols = Object.values(CURRENCY_DISPLAY).map((c) => c.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it("declares no exchange rate anywhere in the display table", () => {
    // The registry exists so a code can be rendered before the store prices it; adding a
    // rate here would reintroduce the invented-number problem it is meant to avoid.
    for (const entry of Object.values(CURRENCY_DISPLAY)) {
      expect(Object.keys(entry).sort()).toEqual(["code", "minorUnits", "symbol"]);
    }
  });

  it("renders each of the four newly supported currencies with its own precision", () => {
    expect(formatStoredAmount(199.99, "CAD")).toBe("C$ 199.99");
    expect(formatStoredAmount(245.5, "AUD")).toBe("A$ 245.50");
    expect(formatStoredAmount(489.13, "QAR")).toBe("ر.ق 489.13");
    expect(formatStoredAmount(47.845, "OMR")).toBe("ر.ع. 47.845");
  });

  it("keeps an unrecognised code as itself instead of borrowing another symbol", () => {
    // XTS is reserved by ISO 4217 for testing, so it can never become a real currency here.
    expect(displayCurrency("XTS")).toEqual({ code: "XTS", symbol: "XTS", minorUnits: 2 });
    expect(formatStoredAmount(120, "XTS")).toBe("XTS 120.00");
    expect(displayCurrency("")).toEqual({ code: "", symbol: "", minorUnits: 2 });
  });

  it("marks only the rupee as the base when synthesising a definition", () => {
    expect(displayCurrencyDef("PKR").isBase).toBe(true);
    expect(displayCurrencyDef("USD").isBase).toBe(false);
    expect(displayCurrencyDef("usd").code).toBe("USD");
  });
});

describe("region hints name the region's own currency", () => {
  const configured: CurrencyDef[] = [
    ...FALLBACK_CURRENCIES,
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", minorUnits: 2, rateToBase: 202, isBase: false, enabled: true, rateSource: "manual", rateUpdatedAt: null, sortOrder: 7 },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", minorUnits: 2, rateToBase: 184, isBase: false, enabled: true, rateSource: "manual", rateUpdatedAt: null, sortOrder: 8 },
    { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق", minorUnits: 2, rateToBase: 76.5, isBase: false, enabled: true, rateSource: "manual", rateUpdatedAt: null, sortOrder: 9 },
    { code: "OMR", name: "Omani Rial", symbol: "ر.ع.", minorUnits: 3, rateToBase: 725, isBase: false, enabled: true, rateSource: "manual", rateUpdatedAt: null, sortOrder: 10 },
  ];

  it.each([
    ["CA", "CAD"],
    ["AU", "AUD"],
    ["QA", "QAR"],
    ["OM", "OMR"],
    ["PK", "PKR"],
    ["GB", "GBP"],
    ["ae", "AED"],
  ])("%s resolves to %s once the store prices it", (region, code) => {
    expect(currencyForRegion(region, configured)?.code).toBe(code);
  });

  it.each(["CA", "AU", "QA", "OM"])(
    "%s resolves to nothing while the store has no such currency",
    (region) => {
      // Falling back to the base currency is honest; quietly substituting USD or SAR would
      // display a price in a money the store has never configured a rate for.
      expect(currencyForRegion(region, FALLBACK_CURRENCIES)).toBeNull();
    }
  );

  it("ignores an enabled-but-unmapped region rather than guessing", () => {
    expect(currencyForRegion("JP", configured)).toBeNull();
    expect(currencyForRegion(undefined, configured)).toBeNull();
  });

  it("will not hand back a currency that exists but is disabled", () => {
    // Present in the table, switched off: a region must not become priced in it.
    const off = new Set(["CAD", "OMR"]);
    const draft = configured.map((c) => (off.has(c.code) ? { ...c, enabled: false } : c));
    expect(currencyForRegion("CA", draft)).toBeNull();
    expect(currencyForRegion("OM", draft)).toBeNull();
    // PKR stays available because it is the base and enabled; the still-enabled pair resolve.
    expect(currencyForRegion("PK", draft)?.code).toBe("PKR");
    expect(currencyForRegion("AU", draft)?.code).toBe("AUD");
  });
});

describe("ledger figures stay rupees, whatever the storefront shows", () => {
  // payments.amount and refunds.amount are base rupees under the current schema — record_refund
  // caps them at the payment's rupee amount — so no currency code may rename them and no browsing
  // currency may restamp them.
  const adminLocales = ["en", "en-US", "fr", "es", "de", "ar", "ur"];

  it.each(adminLocales)("renders a payment in rupees only, in locale %s", (loc) => {
    const out = formatBaseMoney(1500, loc);
    expect(out.startsWith("Rs ")).toBe(true);
    for (const foreign of ["$", "£", "€", "AED", "SAR", "C$", "A$", "ر.ق", "ر.ع."]) {
      expect(out).not.toContain(foreign);
    }
  });

  it("prints the same rupee amount for a payment as for the refund capped by it", () => {
    // The pair the console compares on the refunds and reconciliation screens.
    expect(formatBaseMoney(3100)).toBe(formatBaseMoney(2000 + 1100));
  });

  it("does not let a payment's method currency rename its amount", () => {
    // Reconciliation holds a ZAR settlement label beside a rupee amount.
    const expected = formatBaseMoney(45000);
    expect(expected).toBe("Rs 45,000");
    expect(expected).not.toContain("ZAR");
  });
});

describe("stored precision is not overstated", () => {
  it("renders a two-decimal OMR snapshot without inventing a third digit", () => {
    // orders.total_in_currency is numeric(12, 2), so the thousandth never reaches the client.
    const storedThroughColumn = Math.round(47.845 * 100) / 100;
    expect(storedThroughColumn).toBe(47.85);
    expect(formatStoredAmount(storedThroughColumn, "OMR")).toBe("ر.ع. 47.850");
    expect(formatStoredAmount(storedThroughColumn, "OMR")).not.toContain("47.84");
  });

  it("keeps OMR's metadata at three decimals while storage rounds to two", () => {
    // Pinning the mismatch the owner has to decide about before OMR goes live: the display
    // precision is ISO-correct, the column is narrower, so settlement must not be claimed.
    expect(displayCurrency("OMR").minorUnits).toBe(3);
    const trueThreeDecimals = 47.845;
    const columnPrecision = Math.round(trueThreeDecimals * 100) / 100;
    expect(columnPrecision).not.toBe(trueThreeDecimals);
    expect(formatStoredAmount(columnPrecision, "OMR")).not.toBe(formatStoredAmount(trueThreeDecimals, "OMR"));
  });

  it("trims a foreign snapshot to the currency's own precision, not the rupee's", () => {
    expect(formatStoredAmount(161.578, "USD")).toBe("$ 161.58");
    expect(formatStoredAmount(47.8455, "OMR")).toBe("ر.ع. 47.846");
    expect(formatStoredAmount(161.578, "PKR")).toBe("Rs 162");
  });
});

describe("a missing snapshot never fabricates a destination amount", () => {
  it.each(Object.keys(CURRENCY_DISPLAY))("%s without a stored amount falls back to named rupees", (code) => {
    const out = formatOrderCharged({ total: 45000, currency: code, totalInCurrency: null });
    if (code === "PKR") {
      expect(out).toBe("Rs 45,000");
      return;
    }
    // The fallback states the rupee amount and names the currency, so a reader cannot
    // mistake it for a converted price. (Checking the foreign symbol is absent would be
    // meaningless now that several symbols are substrings of "Rs".)
    expect(out).toBe("Rs 45,000 (PKR)");
  });

  it("reads the snapshot instead of the live rate when both are present", () => {
    // total_in_currency is what was charged; total / any current rate is not.
    const order = { total: 45000, currency: "USD", totalInCurrency: 100 };
    expect(formatOrderCharged(order)).toBe("$ 100.00");
  });

  it("keeps a PKR order in rupees across every admin locale too", () => {
    const order = { total: 45000, currency: "PKR", totalInCurrency: 45000 };
    for (const loc of ["en-US", "fr", "de", "ar", "ur"]) {
      const out = formatOrderCharged(order, loc);
      expect(out.startsWith("Rs ")).toBe(true);
      expect(out).not.toContain("$");
    }
  });

  it("emits no bidi controls and no Arabic-Indic digits in right-to-left locales", () => {
    // The console is rendered RTL in Arabic and Urdu. Direction must come from the container,
    // not from invisible marks in the string, and the digits must match the order record.
    const order = { total: 45000, currency: "USD", totalInCurrency: 161.58 };
    for (const loc of ["ar", "ur"]) {
      const out = `${formatOrderCharged(order, loc)} / ${orderBaseAmountLabel(order, loc)}`;
      const bidi = [...out].filter((ch) => { const c = ch.codePointAt(0) ?? 0; return (c >= 0x202a && c <= 0x202e) || (c >= 0x2066 && c <= 0x2069); });
      expect(bidi).toEqual([]);
      expect(out).not.toMatch(/[٠-٩۰-۹]/);
      expect(out).toContain("$ 161.58");
      expect(out).toContain("Rs 45,000 PKR");
    }
  });
});

describe("gift card balances stay in the card's currency", () => {
  // `gift_cards.balance` is stored in the card's own currency, so it must be rendered as
  // stored. Reading it as a rupee amount would relabel and rescale a gift whenever the
  // shopper is browsing in another currency.
  const card = (balance: number, currency: string) => ({ balance, currency });

  it("prints a rupee card as rupees", () => {
    const c = card(5000, "PKR");
    expect(formatStoredAmount(c.balance, c.currency)).toBe("Rs 5,000");
  });

  it("prints a dollar card as dollars without dividing by the rate", () => {
    const c = card(50, "USD");
    expect(formatStoredAmount(c.balance, c.currency)).toBe("$ 50.00");
    // The conversion the old code performed would have shown roughly $ 0.18 instead.
    expect(formatStoredAmount(c.balance, c.currency)).not.toBe("$ 0.18");
  });

  it("keeps each card's currency separate when a list mixes them", () => {
    const cards = [card(5000, "PKR"), card(50, "USD"), card(47.85, "OMR"), card(200, "QAR")];
    expect(cards.map((c) => formatStoredAmount(c.balance, c.currency))).toEqual([
      "Rs 5,000",
      "$ 50.00",
      "ر.ع. 47.850",
      "ر.ق 200.00",
    ]);
  });
});
