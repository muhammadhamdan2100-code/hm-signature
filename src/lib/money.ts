// Money is carried as integer minor units so repeated cart arithmetic cannot drift the
// way binary floats do. Conversion happens once, at the edge, against a rate that the
// database owns.

// Type-only in the other direction (currencyDisplay imports no runtime value from here),
// so this is not a cycle.
import { CURRENCY_DISPLAY } from "./currencyDisplay";

export type RateSource = "manual" | "provider" | "imported";

export interface CurrencyDef {
  code: string;
  name: string;
  symbol: string;
  minorUnits: number;
  /** How many base (PKR) rupees make one unit of this currency. Base currency is 1. */
  rateToBase: number;
  isBase: boolean;
  enabled: boolean;
  rateSource: RateSource;
  rateUpdatedAt: string | null;
  sortOrder: number;
}

const POW10 = [1, 10, 100, 1000];

function pow10(minorUnits: number): number {
  return POW10[minorUnits] ?? 100;
}

export function toMinor(baseAmount: number, currency: Pick<CurrencyDef, "rateToBase" | "minorUnits">): number {
  const value = Number.isFinite(baseAmount) ? baseAmount : 0;
  if (value === 0) return 0;
  return Math.round((value * pow10(currency.minorUnits)) / currency.rateToBase);
}

export function fromMinor(minor: number, currency: Pick<CurrencyDef, "rateToBase" | "minorUnits">): number {
  return (minor * currency.rateToBase) / pow10(currency.minorUnits);
}

export function sumMinor(values: number[]): number {
  return values.reduce((total, value) => total + (Number.isInteger(value) ? value : Math.round(value)), 0);
}

/**
 * The store's own symbol is used instead of Intl's currency display name so the
 * storefront keeps its "Rs 1,370" identity. Grouping separators follow the shopper's
 * locale, but digits are pinned to Latin (`numberingSystem: "latn"`) so an Arabic or
 * Urdu shopper sees "Rs 1,370" exactly as the order record stores it, never Arabic-Indic
 * digits — the price stays verifiable against the checkout total.
 */
export function formatMinor(minor: number, currency: CurrencyDef, locale = "en-US"): string {
  const digits = Math.max(0, Math.min(3, currency.minorUnits));
  const value = minor / pow10(digits);
  let formatter: Intl.NumberFormat;
  try {
    formatter = new Intl.NumberFormat(locale, {
      numberingSystem: "latn",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  } catch {
    formatter = new Intl.NumberFormat("en-US", {
      numberingSystem: "latn",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }
  return `${currency.symbol} ${formatter.format(value)}`;
}

export function formatBase(baseAmount: number, currency: CurrencyDef, locale = "en-US"): string {
  return formatMinor(toMinor(baseAmount, currency), currency, locale);
}

export function isManualRate(currency: CurrencyDef): boolean {
  return currency.rateSource === "manual";
}

export const BASE_CURRENCY_CODE = "PKR";

// Mirrors the seeded `currencies` rows so the storefront can still price a basket if the
// configuration read fails. Rates are the store's own manual figures, not live market data.
// Symbols and exponents are taken from the display registry, the same override
// `mapCurrency` applies to live rows, so a degraded read cannot print a different money.
const FALLBACK_ROWS: CurrencyDef[] = [
  { code: "PKR", name: "Pakistani Rupee", symbol: "Rs", minorUnits: 0, rateToBase: 1, isBase: true, enabled: true, rateSource: "manual", rateUpdatedAt: null, sortOrder: 1 },
  { code: "USD", name: "US Dollar", symbol: "$", minorUnits: 2, rateToBase: 278.5, isBase: false, enabled: true, rateSource: "manual", rateUpdatedAt: null, sortOrder: 2 },
  { code: "AED", name: "UAE Dirham", symbol: "AED", minorUnits: 2, rateToBase: 75.8, isBase: false, enabled: true, rateSource: "manual", rateUpdatedAt: null, sortOrder: 3 },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", minorUnits: 2, rateToBase: 74.3, isBase: false, enabled: true, rateSource: "manual", rateUpdatedAt: null, sortOrder: 4 },
  { code: "GBP", name: "British Pound", symbol: "£", minorUnits: 2, rateToBase: 355, isBase: false, enabled: true, rateSource: "manual", rateUpdatedAt: null, sortOrder: 5 },
  { code: "EUR", name: "Euro", symbol: "€", minorUnits: 2, rateToBase: 302, isBase: false, enabled: true, rateSource: "manual", rateUpdatedAt: null, sortOrder: 6 },
];

export const FALLBACK_CURRENCIES: CurrencyDef[] = FALLBACK_ROWS.map((row) => {
  const meta = CURRENCY_DISPLAY[row.code];
  return meta ? { ...row, symbol: meta.symbol, minorUnits: meta.minorUnits } : row;
});

export function currencyByCode(list: CurrencyDef[], code: string | null | undefined): CurrencyDef | null {
  const wanted = (code || "").toUpperCase();
  return list.find((c) => c.code === wanted) ?? null;
}

export function baseCurrency(list: CurrencyDef[]): CurrencyDef {
  return list.find((c) => c.isBase) ?? currencyByCode(list, BASE_CURRENCY_CODE) ?? FALLBACK_CURRENCIES[0];
}

/**
 * Region hints from the browser, mapped only onto currencies the store supports.
 *
 * Each entry names that region's actual currency rather than the nearest one already
 * configured, so the mapping stays true to ISO 4217 as the currency list grows.
 * `currencyForRegion` still refuses anything the store does not yet enable, so CA/AU/QA/OM
 * resolve to null until those rows exist in `currencies` — correctness here cannot invent
 * a price.
 */
const REGION_CURRENCY: Record<string, string> = {
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
  IT: "EUR",
  NL: "EUR",
  IE: "EUR",
  QA: "QAR",
  OM: "OMR",
};

export function currencyForRegion(region: string | undefined, list: CurrencyDef[]): CurrencyDef | null {
  if (!region) return null;
  const code = REGION_CURRENCY[region.toUpperCase()];
  if (!code) return null;
  const found = currencyByCode(list, code);
  return found && found.enabled ? found : null;
}
