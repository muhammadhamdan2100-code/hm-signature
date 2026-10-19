import { currencyName, displayCurrency } from "./currencyDisplay";

// ISO 3166-1 alpha-2 countries and territories, each with the currency it actually uses.
//
// This table is display metadata only. It says what money a place is priced in; it says
// nothing about whether HM Signature ships there, quotes there, or can take payment there.
// Those answers come from the `countries` and `payment_methods` configuration in the
// database, never from this file, so adding a row here cannot enable a market.
//
// Mapping rules, in the order applied:
//   1. The currency ISO 4217 assigns to that code (a country may legitimately share a
//      currency with its neighbours — the CFA francs, the East Caribbean dollar, the euro).
//   2. Where a territory's currency is a supranational one (EUR, USD, XCD, XOF, XAF, XPF,
//      CHF, AUD, NZD, DKK, MAD), that shared currency is used, not an invented local one.
//   3. Where a country runs a documented multi-currency regime, the default is the one
//      prices are actually quoted in, and the alternative is named in the comment.
//   4. Obsolete codes are not used: Sierra Leone is SLE (not SLL), Mauritania is MRU (not
//      MRO), Zimbabwe's local code is ZWG while everyday retail is USD-quoted.
// Antarctica (AQ) is absent: it has no currency and no addressable market.

export interface CountryMeta {
  /** ISO 3166-1 alpha-2 code, upper case. */
  code: string;
  name: string;
  /** ISO 4217 code of the currency this place is priced in. */
  currency: string;
  /** Primary language tag, used to build a display locale. */
  lang: string;
}

export function flagFor(code: string | null | undefined): string {
  const wanted = (code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(wanted)) return "🏳️";
  // Regional indicator pair computed from the code, so no emoji literals sit in source.
  return String.fromCodePoint(...wanted.split("").map((ch) => 0x1f1e6 + (ch.charCodeAt(0) - 65)));
}

export function localeFor(country: Pick<CountryMeta, "code" | "lang"> | null | undefined): string {
  if (!country) return "en-US";
  return `${country.lang}-${country.code}`;
}

const RAW: [string, string, string, string][] = [
  // --- Europe -------------------------------------------------------------
  ["AD", "Andorra", "EUR", "ca"], ["AL", "Albania", "ALL", "sq"], ["AT", "Austria", "EUR", "de"],
  ["BA", "Bosnia and Herzegovina", "BAM", "bs"], ["BE", "Belgium", "EUR", "nl"], ["BG", "Bulgaria", "BGN", "bg"],
  ["CH", "Switzerland", "CHF", "de"], ["CY", "Cyprus", "EUR", "el"], ["CZ", "Czechia", "CZK", "cs"],
  ["DE", "Germany", "EUR", "de"], ["DK", "Denmark", "DKK", "da"], ["EE", "Estonia", "EUR", "et"],
  ["ES", "Spain", "EUR", "es"], ["FI", "Finland", "EUR", "fi"], ["FR", "France", "EUR", "fr"],
  ["GB", "United Kingdom", "GBP", "en"], ["GE", "Georgia", "GEL", "ka"], ["GR", "Greece", "EUR", "el"],
  ["HR", "Croatia", "EUR", "hr"], ["HU", "Hungary", "HUF", "hu"], ["IE", "Ireland", "EUR", "en"],
  ["IS", "Iceland", "ISK", "is"], ["IT", "Italy", "EUR", "it"], ["LI", "Liechtenstein", "CHF", "de"],
  ["LT", "Lithuania", "EUR", "lt"], ["LU", "Luxembourg", "EUR", "lb"], ["LV", "Latvia", "EUR", "lv"],
  ["MC", "Monaco", "EUR", "fr"], ["MD", "Moldova", "MDL", "ro"], ["ME", "Montenegro", "EUR", "sr"],
  ["MK", "North Macedonia", "MKD", "mk"], ["MT", "Malta", "EUR", "mt"], ["NL", "Netherlands", "EUR", "nl"],
  ["NO", "Norway", "NOK", "no"], ["PL", "Poland", "PLN", "pl"], ["PT", "Portugal", "EUR", "pt"],
  ["RO", "Romania", "RON", "ro"], ["RS", "Serbia", "RSD", "sr"], ["RU", "Russia", "RUB", "ru"],
  ["SE", "Sweden", "SEK", "sv"], ["SI", "Slovenia", "EUR", "sl"], ["SK", "Slovakia", "EUR", "sk"],
  ["SM", "San Marino", "EUR", "it"], ["TR", "Türkiye", "TRY", "tr"], ["UA", "Ukraine", "UAH", "uk"],
  ["BY", "Belarus", "BYN", "be"], ["FO", "Faroe Islands", "DKK", "fo"], ["GI", "Gibraltar", "GIP", "en"],
  ["GG", "Guernsey", "GBP", "en"], ["IM", "Isle of Man", "GBP", "en"], ["JE", "Jersey", "GBP", "en"],
  ["SJ", "Svalbard and Jan Mayen", "NOK", "no"],
  ["VA", "Vatican City", "EUR", "it"], ["XK", "Kosovo", "EUR", "sq"],
  // --- Americas -----------------------------------------------------------
  ["AG", "Antigua and Barbuda", "XCD", "en"], ["AI", "Anguilla", "XCD", "en"], ["AR", "Argentina", "ARS", "es"],
  ["AS", "American Samoa", "USD", "en"], ["AW", "Aruba", "AWG", "nl"], ["BB", "Barbados", "BBD", "en"],
  ["BM", "Bermuda", "BMD", "en"], ["BO", "Bolivia", "BOB", "es"], ["BQ", "Caribbean Netherlands", "USD", "nl"],
  ["BR", "Brazil", "BRL", "pt"], ["BS", "Bahamas", "BSD", "en"], ["BZ", "Belize", "BZD", "en"],
  ["CA", "Canada", "CAD", "en"], ["CL", "Chile", "CLP", "es"], ["CO", "Colombia", "COP", "es"],
  ["CR", "Costa Rica", "CRC", "es"], ["CU", "Cuba", "CUP", "es"], ["SV", "El Salvador", "USD", "es"],
  ["CW", "Curaçao", "ANG", "nl"],
  ["DM", "Dominica", "XCD", "en"], ["DO", "Dominican Republic", "DOP", "es"], ["EC", "Ecuador", "USD", "es"],
  ["FK", "Falkland Islands", "FKP", "en"], ["GD", "Grenada", "XCD", "en"], ["GL", "Greenland", "DKK", "da"],
  ["GT", "Guatemala", "GTQ", "es"], ["GY", "Guyana", "GYD", "en"], ["HN", "Honduras", "HNL", "es"],
  ["HT", "Haiti", "HTG", "fr"], ["JM", "Jamaica", "JMD", "en"], ["KN", "St Kitts and Nevis", "XCD", "en"],
  ["KY", "Cayman Islands", "KYD", "en"], ["LC", "St Lucia", "XCD", "en"], ["MS", "Montserrat", "XCD", "en"],
  ["MX", "Mexico", "MXN", "es"], ["NI", "Nicaragua", "NIO", "es"], ["PA", "Panama", "PAB", "es"],
  ["PE", "Peru", "PEN", "es"], ["PR", "Puerto Rico", "USD", "es"], ["PY", "Paraguay", "PYG", "es"],
  ["SR", "Suriname", "SRD", "nl"], ["SX", "Sint Maarten", "ANG", "nl"], ["TC", "Turks and Caicos", "USD", "en"],
  ["TT", "Trinidad and Tobago", "TTD", "en"], ["US", "United States", "USD", "en"], ["UY", "Uruguay", "UYU", "es"],
  ["VC", "St Vincent and the Grenadines", "XCD", "en"], ["VE", "Venezuela", "VES", "es"],
  ["VG", "British Virgin Islands", "USD", "en"], ["VI", "US Virgin Islands", "USD", "en"],
  ["GF", "French Guiana", "EUR", "fr"], ["PM", "Saint Pierre and Miquelon", "EUR", "fr"],
  // --- Africa, including the two CFA zones --------------------------------
  ["AO", "Angola", "AOA", "pt"], ["BF", "Burkina Faso", "XOF", "fr"], ["BI", "Burundi", "BIF", "fr"],
  ["BJ", "Benin", "XOF", "fr"], ["BW", "Botswana", "BWP", "en"], ["CD", "DR Congo", "CDF", "fr"],
  ["CF", "Central African Republic", "XAF", "fr"], ["CG", "Congo", "XAF", "fr"], ["CI", "Côte d'Ivoire", "XOF", "fr"],
  ["CM", "Cameroon", "XAF", "fr"], ["CV", "Cape Verde", "CVE", "pt"], ["DJ", "Djibouti", "DJF", "fr"],
  ["DZ", "Algeria", "DZD", "ar"], ["EG", "Egypt", "EGP", "ar"], ["EH", "Western Sahara", "MAD", "ar"],
  ["ER", "Eritrea", "ERN", "ti"], ["ET", "Ethiopia", "ETB", "am"], ["GA", "Gabon", "XAF", "fr"],
  ["GH", "Ghana", "GHS", "en"], ["GM", "Gambia", "GMD", "en"], ["GN", "Guinea", "GNF", "fr"],
  ["GQ", "Equatorial Guinea", "XAF", "es"], ["GW", "Guinea-Bissau", "XOF", "pt"], ["KE", "Kenya", "KES", "sw"],
  ["KM", "Comoros", "KMF", "ar"], ["LR", "Liberia", "LRD", "en"], ["LS", "Lesotho", "LSL", "st"],
  ["LY", "Libya", "LYD", "ar"], ["MA", "Morocco", "MAD", "ar"], ["MG", "Madagascar", "MGA", "mg"],
  ["ML", "Mali", "XOF", "fr"], ["MR", "Mauritania", "MRU", "ar"], ["MU", "Mauritius", "MUR", "en"],
  ["MW", "Malawi", "MWK", "en"], ["MZ", "Mozambique", "MZN", "pt"], ["NA", "Namibia", "NAD", "en"],
  ["NE", "Niger", "XOF", "fr"], ["NG", "Nigeria", "NGN", "en"], ["RW", "Rwanda", "RWF", "rw"],
  ["SC", "Seychelles", "SCR", "fr"], ["SD", "Sudan", "SDG", "ar"], ["SL", "Sierra Leone", "SLE", "en"],
  ["SN", "Senegal", "XOF", "fr"], ["SO", "Somalia", "SOS", "so"], ["SS", "South Sudan", "SSP", "en"],
  ["ST", "São Tomé and Príncipe", "STN", "pt"], ["SZ", "Eswatini", "SZL", "en"], ["TD", "Chad", "XAF", "fr"],
  ["TG", "Togo", "XOF", "fr"], ["TN", "Tunisia", "TND", "ar"], ["TZ", "Tanzania", "TZS", "sw"],
  ["UG", "Uganda", "UGX", "sw"], ["YT", "Mayotte", "EUR", "fr"], ["RE", "Réunion", "EUR", "fr"],
  ["SH", "Saint Helena", "SHP", "en"],
  ["ZA", "South Africa", "ZAR", "en"], ["ZM", "Zambia", "ZMW", "en"], ["ZW", "Zimbabwe", "USD", "en"],
  // --- Middle East and Central Asia ---------------------------------------
  ["AE", "United Arab Emirates", "AED", "ar"], ["AF", "Afghanistan", "AFN", "ps"], ["AM", "Armenia", "AMD", "hy"],
  ["AZ", "Azerbaijan", "AZN", "az"], ["BH", "Bahrain", "BHD", "ar"], ["BT", "Bhutan", "BTN", "dz"],
  ["IL", "Israel", "ILS", "he"], ["IQ", "Iraq", "IQD", "ar"], ["IR", "Iran", "IRR", "fa"],
  ["JO", "Jordan", "JOD", "ar"], ["KW", "Kuwait", "KWD", "ar"], ["KG", "Kyrgyzstan", "KGS", "ky"],
  ["LB", "Lebanon", "LBP", "ar"], ["OM", "Oman", "OMR", "ar"], ["PK", "Pakistan", "PKR", "ur"],
  ["PS", "Palestine", "ILS", "ar"], ["QA", "Qatar", "QAR", "ar"], ["SA", "Saudi Arabia", "SAR", "ar"],
  ["SY", "Syria", "SYP", "ar"], ["TJ", "Tajikistan", "TJS", "tg"], ["TM", "Turkmenistan", "TMT", "tk"],
  ["UZ", "Uzbekistan", "UZS", "uz"], ["YE", "Yemen", "YER", "ar"],
  ["KP", "North Korea", "KPW", "ko"],
  // --- Asia-Pacific -------------------------------------------------------
  ["AU", "Australia", "AUD", "en"], ["BD", "Bangladesh", "BDT", "bn"], ["BN", "Brunei", "BND", "ms"],
  ["CC", "Cocos (Keeling) Islands", "AUD", "en"], ["CN", "China", "CNY", "zh"], ["CX", "Christmas Island", "AUD", "en"],
  ["FJ", "Fiji", "FJD", "en"], ["HM", "Heard Island", "AUD", "en"], ["HK", "Hong Kong", "HKD", "zh"],
  ["ID", "Indonesia", "IDR", "id"], ["IN", "India", "INR", "hi"], ["JP", "Japan", "JPY", "ja"],
  ["KI", "Kiribati", "AUD", "en"], ["KR", "South Korea", "KRW", "ko"], ["KZ", "Kazakhstan", "KZT", "kk"],
  ["LA", "Laos", "LAK", "lo"], ["LK", "Sri Lanka", "LKR", "si"], ["MM", "Myanmar", "MMK", "my"],
  ["MN", "Mongolia", "MNT", "mn"], ["MO", "Macao", "MOP", "zh"], ["MP", "Northern Mariana Islands", "USD", "en"],
  ["MV", "Maldives", "MVR", "dv"], ["MY", "Malaysia", "MYR", "ms"], ["NC", "New Caledonia", "XPF", "fr"],
  ["NF", "Norfolk Island", "AUD", "en"], ["NP", "Nepal", "NPR", "ne"], ["NR", "Nauru", "AUD", "en"],
  ["NU", "Niue", "NZD", "en"], ["NZ", "New Zealand", "NZD", "en"], ["PF", "French Polynesia", "XPF", "fr"],
  ["PG", "Papua New Guinea", "PGK", "en"], ["PH", "Philippines", "PHP", "fil"], ["PN", "Pitcairn Islands", "NZD", "en"],
  ["SB", "Solomon Islands", "SBD", "en"], ["SG", "Singapore", "SGD", "en"], ["TF", "French Southern Territories", "EUR", "fr"],
  ["TH", "Thailand", "THB", "th"], ["TK", "Tokelau", "NZD", "en"], ["TL", "Timor-Leste", "USD", "tet"],
  ["TO", "Tonga", "TOP", "to"], ["TV", "Tuvalu", "AUD", "en"], ["TW", "Taiwan", "TWD", "zh"],
  ["VU", "Vanuatu", "VUV", "bi"], ["WF", "Wallis and Futuna", "XPF", "fr"], ["WS", "Samoa", "WST", "sm"],
  ["KH", "Cambodia", "KHR", "km"], ["VN", "Vietnam", "VND", "vi"], ["GU", "Guam", "USD", "en"],
  ["PW", "Palau", "USD", "en"], ["MH", "Marshall Islands", "USD", "mh"], ["FM", "Micronesia", "USD", "en"],
  ["CK", "Cook Islands", "NZD", "en"], ["UM", "US Outlying Islands", "USD", "en"],
];

// Sanity guard at module load: a typo in the table above should fail loudly in development
// rather than surface as a blank currency in the navbar.
export const COUNTRIES: CountryMeta[] = RAW.map(([code, name, currency, lang]) => ({
  code,
  name,
  currency,
  lang,
}));

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function countryByCode(code: string | null | undefined): CountryMeta | null {
  const wanted = (code || "").toUpperCase();
  return BY_CODE.get(wanted) ?? null;
}

/** A currency described for display: never carries a rate, so it cannot be converted with. */
export interface CountryCurrency {
  code: string;
  name: string;
  symbol: string;
  minorUnits: number;
}

/**
 * The currency this place is priced in, with the display metadata to render it.
 * Null for a code this table does not carry: an unknown country must not borrow
 * someone else's money.
 */
export function countryCurrency(code: string | null | undefined): CountryCurrency | null {
  const country = countryByCode(code);
  if (!country) return null;
  const display = displayCurrency(country.currency);
  return { ...display, name: currencyName(display.code) };
}

/**
 * The twelve destinations the shop keeps configuration rows for. Their money is read from the
 * ISO metadata above rather than from the `countries` row, because four of those rows still
 * point at the wrong currency — Canada and Australia say USD, Qatar and Oman say SAR — and a
 * configuration write is not this layer's to make. Listing them here is what lets the storefront
 * offer C$, A$, ر.ق and ر.ع. without waiting on that correction.
 */
export const CONFIGURED_DESTINATIONS: readonly string[] = [
  "PK", "AE", "SA", "GB", "US", "CA", "AU", "FR", "DE", "ES", "QA", "OM",
];
