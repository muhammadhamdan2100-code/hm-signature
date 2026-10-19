import type { CurrencyDef } from "./money";

// Display metadata for every currency HM Signature may have to print. This file deliberately
// holds no exchange rates: a currency cannot be priced or converted here, only rendered.
// Conversion stays the database's job (`currencies.rate_to_base`), because guessing a rate
// would silently invent money.
//
// Symbols follow one rule: a distinct, widely-recognised glyph where the shopper will already
// know it, and the ISO code everywhere else. That matters because "$" alone is ambiguous —
// USD, CAD, AUD, HKD, SGD, MXN and a dozen others all print a dollar sign — so each of those
// carries its own qualifier. Every symbol in the table is unique; a regression test enforces it.
//
// Minor units are the ISO 4217 exponent: 0 = no subunit in circulation (JPY, KRW, VND, CLP,
// ISK, RSD, the CFA francs), 2 = hundredths, 3 = thousandths (OMR, KWD, BHD, IQD, JOD,
// LYD, TND). Precision must come from this table, never from a blanket two-decimal assumption.

export interface CurrencyDisplay {
  code: string;
  symbol: string;
  /** ISO 4217 minor-unit exponent: 0, 2 or 3. */
  minorUnits: number;
}

// Minor units follow ISO 4217, with two deliberate exceptions: PKR is handled in whole
// rupees by the store (mirroring the seeded `currencies.minor_units = 0`), and a few
// currencies whose subunit is not decimal in practice (the dong, the Ariary, the ouguiya)
// are written down without decimals by the people who use them.
const ZERO_DECIMAL = new Set([
  "PKR", "BIF", "CLP", "DJF", "GNF", "ISK", "JPY", "KMF", "KRW", "MGA", "MRU", "PYG", "RSD", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

const THREE_DECIMAL = new Set(["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"]);

// Glyphs that are unambiguous on their own. Anything absent renders as its ISO code.
// The ten currencies the shop prices destinations in carry the sign the owner specified;
// the rest keep the widely-known glyph so a code never borrows another currency's identity.
const GLYPHS: Record<string, string> = {
  PKR: "Rs",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  SAR: "ر.س",
  QAR: "ر.ق",
  OMR: "ر.ع.",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  CNY: "CN¥",
  KRW: "₩",
  INR: "₹",
  TRY: "₺",
  RUB: "₽",
  BRL: "R$",
  ILS: "₪",
  VND: "₫",
  THB: "฿",
  PHP: "₱",
  NGN: "₦",
  UAH: "₴",
  NZD: "NZ$",
  HKD: "HK$",
  SGD: "S$",
  MXN: "MX$",
  ARS: "AR$",
  COP: "COL$",
  CLP: "CLP$",
  PEN: "S/",
  ZAR: "R",
  CHF: "Fr",
  PLN: "zł",
  HUF: "Ft",
  CZK: "Kč",
  MAD: "DH",
};

/** Every ISO 4217 code this storefront can render. Order is alphabetical for review. */
export const CURRENCY_CODES: string[] = [
  "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
  "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL",
  "BSD", "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHF", "CLP", "CNY",
  "COP", "CRC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD", "EGP",
  "ERN", "ETB", "EUR", "FJD", "FKP", "GBP", "GEL", "GHS", "GIP", "GMD",
  "GNF", "GTQ", "GYD", "HKD", "HNL", "HTG", "HUF", "IDR", "ILS", "INR",
  "IQD", "IRR",
  "ISK", "JMD", "JOD", "JPY", "KES", "KGS", "KHR", "KMF", "KPW", "KRW",
  "KWD", "KYD", "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD",
  "MDL", "MGA", "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK",
  "MXN", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR",
  "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD",
  "RUB", "RWF", "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SOS",
  "SRD", "SSP", "STN", "SYP", "SZL", "THB", "TJS", "TMT", "TND", "TOP",
  "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "USD", "UYU", "UZS", "VES",
  "VND", "VUV", "WST", "XAF", "XCD", "XOF", "XPF", "YER", "ZAR", "ZMW",
  "ZWG",
];

export const CURRENCY_DISPLAY: Record<string, CurrencyDisplay> = Object.fromEntries(
  CURRENCY_CODES.map((code) => [
    code,
    {
      code,
      symbol: GLYPHS[code] ?? code,
      minorUnits: ZERO_DECIMAL.has(code) ? 0 : THREE_DECIMAL.has(code) ? 3 : 2,
    },
  ])
);

// Currency names are kept out of CurrencyDisplay so that type stays exactly
// { code, symbol, minorUnits } — the shape the console's formatter tests pin.
const NAMES: Record<string, string> = {
  AED: "UAE Dirham", AFN: "Afghan Afghani", ALL: "Albanian Lek", AMD: "Armenian Dram",
  ANG: "Netherlands Antillean Guilder", AOA: "Kwanza", ARS: "Argentine Peso", AUD: "Australian Dollar",
  AWG: "Aruban Florin", AZN: "Azerbaijani Manat", BAM: "Convertible Mark", BBD: "Barbados Dollar",
  BDT: "Taka", BGN: "Bulgarian Lev", BHD: "Bahraini Dinar", BIF: "Burundi Franc",
  BMD: "Bermudian Dollar", BND: "Brunei Dollar", BOB: "Boliviano", BRL: "Brazilian Real",
  BSD: "Bahamian Dollar", BTN: "Ngultrum", BWP: "Pula", BYN: "Belarusian Ruble",
  BZD: "Belize Dollar", CAD: "Canadian Dollar", CDF: "Congolese Franc", CHF: "Swiss Franc",
  CLP: "Chilean Peso", CNY: "Chinese Yuan", COP: "Colombian Peso", CRC: "Costa Rican Colón",
  CUP: "Cuban Peso", CVE: "Cape Verde Escudo", CZK: "Czech Koruna", DJF: "Djibouti Franc",
  DKK: "Danish Krone",
  DOP: "Dominican Peso", DZD: "Algerian Dinar", EGP: "Egyptian Pound", ERN: "Nakfa",
  ETB: "Ethiopian Birr", EUR: "Euro", FJD: "Fiji Dollar", FKP: "Falkland Islands Pound",
  GBP: "British Pound", GEL: "Georgian Lari", GHS: "Ghana Cedi", GIP: "Gibraltar Pound",
  GMD: "Dalasi", GNF: "Guinea Franc", GTQ: "Quetzal", GYD: "Guyana Dollar",
  HKD: "Hong Kong Dollar", HNL: "Lempira", HTG: "Gourde", HUF: "Forint", IDR: "Rupiah",
  ILS: "New Israeli Sheqel", INR: "Indian Rupee", IQD: "Iraqi Dinar", IRR: "Iranian Rial",
  ISK: "Iceland Krona", JMD: "Jamaican Dollar", JOD: "Jordanian Dinar", JPY: "Japanese Yen",
  KES: "Kenyan Shilling", KGS: "Som", KHR: "Riel", KMF: "Comorian Franc",
  KPW: "North Korean Won", KRW: "South Korean Won", KWD: "Kuwaiti Dinar", KYD: "Cayman Islands Dollar",
  KZT: "Tenge", LAK: "Lao Kip", LBP: "Lebanese Pound", LKR: "Sri Lanka Rupee",
  LRD: "Liberian Dollar", LSL: "Loti", LYD: "Libyan Dinar", MAD: "Moroccan Dirham",
  MDL: "Moldovan Leu", MGA: "Malagasy Ariary", MKD: "Denar", MMK: "Kyat",
  MNT: "Tugrik", MOP: "Pataca", MRU: "Ouguiya", MUR: "Mauritius Rupee",
  MVR: "Rufiyaa", MWK: "Malawi Kwacha", MXN: "Mexican Peso", MYR: "Malaysian Ringgit",
  MZN: "Mozambique Metical", NAD: "Namibia Dollar", NGN: "Naira", NIO: "Cordoba Oro",
  NOK: "Norwegian Krone", NPR: "Nepalese Rupee", NZD: "New Zealand Dollar", OMR: "Omani Rial",
  PAB: "Balboa", PEN: "Sol", PGK: "Kina", PHP: "Philippine Peso",
  PKR: "Pakistani Rupee", PLN: "Zloty", PYG: "Guarani", QAR: "Qatari Rial",
  RON: "Romanian Leu", RSD: "Serbian Dinar", RUB: "Russian Ruble", RWF: "Rwanda Franc", SAR: "Saudi Riyal",
  SBD: "Solomon Islands Dollar", SCR: "Seychelles Rupee", SDG: "Sudanese Pound", SEK: "Swedish Krona",
  SGD: "Singapore Dollar", SHP: "Saint Helena Pound", SLE: "Leone", SOS: "Somali Shilling",
  SRD: "Surinam Dollar", SSP: "South Sudanese Pound", STN: "Dobra", SYP: "Syrian Pound",
  SZL: "Lilangeni", THB: "Baht", TJS: "Somoni", TMT: "Turkmenistan New Manat",
  TND: "Tunisian Dinar", TOP: "Pa’anga", TRY: "Turkish Lira", TTD: "Trinidad and Tobago Dollar",
  TWD: "New Taiwan Dollar", TZS: "Tanzanian Shilling", UAH: "Hryvnia", UGX: "Uganda Shilling",
  USD: "US Dollar", UYU: "Peso Uruguayo", UZS: "Uzbekistan Sum", VES: "Bolívar Soberano",
  VND: "Dong", VUV: "Vatu", WST: "Tala", XAF: "CFA Franc BEAC",
  XCD: "East Caribbean Dollar", XOF: "CFA Franc BCEAO", XPF: "CFP Franc", YER: "Yemeni Rial",
  ZAR: "Rand", ZMW: "Zambian Kwacha", ZWG: "Zimbabwe Gold",
};

export function currencyName(code: string | null | undefined): string {
  const wanted = (code || "").toUpperCase();
  return NAMES[wanted] ?? wanted;
}

/**
 * Metadata for a currency code. Unknown codes keep their code as the symbol and two
 * decimals rather than borrowing another currency's identity, so a stale or unexpected
 * snapshot still prints as itself instead of masquerading as dollars.
 */
export function displayCurrency(code: string | null | undefined): CurrencyDisplay {
  const wanted = (code || "").toUpperCase();
  return CURRENCY_DISPLAY[wanted] ?? { code: wanted, symbol: wanted, minorUnits: 2 };
}

/**
 * A read-only `CurrencyDef` for rendering. `rateToBase` is a neutral placeholder and is
 * never consulted by the formatter, which uses only the symbol and the decimal count —
 * the amount it is handed has already been converted by the database.
 */
export function displayCurrencyDef(code: string | null | undefined): CurrencyDef {
  const display = displayCurrency(code);
  return {
    ...display,
    name: currencyName(display.code),
    rateToBase: 1,
    isBase: display.code === "PKR",
    enabled: true,
    rateSource: "manual",
    rateUpdatedAt: null,
    sortOrder: 0,
  };
}

/**
 * The store's settlement columns keep two decimals (`orders.total_in_currency` is
 * numeric(12, 2), and the loyalty and gift-card restatements round to 2). A currency that
 * needs three can be displayed from this table but must not be described as ready for
 * transactional settlement until that storage is widened.
 */
export const SETTLEMENT_STORAGE_DECIMALS = 2;

export function isSettlementPrecisionReady(code: string | null | undefined): boolean {
  return displayCurrency(code).minorUnits <= SETTLEMENT_STORAGE_DECIMALS;
}
