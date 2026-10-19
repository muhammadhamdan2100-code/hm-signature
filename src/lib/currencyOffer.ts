import { CONFIGURED_DESTINATIONS, countryCurrency } from "./countries";
import { currencyName, displayCurrency, displayCurrencyDef } from "./currencyDisplay";
import type { CurrencyDef } from "./money";

// What the navbar's currency control offers, and what counts as a usable rate. Kept apart
// from the provider so both rules can be read and tested without rendering anything.

/**
 * A rate is usable only when the store configured one. The base rupee is its own rate;
 * anything else needs a positive, finite number. Absence and zero mean the same thing here
 * on purpose: a missing rate must never be read as parity with the rupee.
 */
export function hasUsableRate(
  currency: Pick<CurrencyDef, "rateToBase" | "isBase"> | null | undefined
): boolean {
  if (!currency) return false;
  return currency.isBase || (Number.isFinite(currency.rateToBase) && currency.rateToBase > 0);
}

/**
 * Rupees that an amount written in another currency stands for.
 *
 * This is an input convenience, not a second price: the database keeps product prices in base
 * rupees, so whatever the owner types in dollars is converted once, when they apply it, using
 * that currency's own configured rate. NaN is returned when there is no usable rate, so a
 * missing rate can never quietly write a rupee figure.
 */
export function baseRupeesFor(
  amountInCurrency: number,
  currency: Pick<CurrencyDef, "rateToBase" | "isBase"> | null | undefined
): number {
  if (!hasUsableRate(currency) || !Number.isFinite(amountInCurrency)) return NaN;
  return Math.round(amountInCurrency * (currency as CurrencyDef).rateToBase);
}

/** The same figure in reverse: what the stored rupee price currently reads as in `currency`. */
export function currencyAmountForBase(
  baseRupees: number,
  currency: Pick<CurrencyDef, "rateToBase" | "isBase" | "minorUnits"> | null | undefined
): number {
  if (!hasUsableRate(currency) || !Number.isFinite(baseRupees)) return NaN;
  const def = currency as CurrencyDef;
  const factor = Math.pow(10, def.minorUnits);
  return Math.round((baseRupees / def.rateToBase) * factor) / factor;
}

/**
 * The priced currencies first, in the shop's own order, then the own money of every
 * configured destination even where no rate exists yet. Codes are deduplicated, so France,
 * Germany and Spain contribute a single EUR entry.
 *
 * A rate-less entry is a display promise, not a conversion promise: it carries
 * `rateToBase: 0`, which `hasUsableRate` refuses to convert with, so `format` keeps printing
 * rupees and says why.
 */
export function buildSelectorCurrencies(priced: readonly CurrencyDef[]): CurrencyDef[] {
  const list: CurrencyDef[] = [];
  const seen = new Set<string>();
  for (const row of priced) {
    const code = (row.code || "").toUpperCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    list.push(row);
  }
  for (const destination of CONFIGURED_DESTINATIONS) {
    const code = countryCurrency(destination)?.code;
    if (!code || seen.has(code)) continue;
    seen.add(code);
    list.push({ ...displayCurrencyDef(code), rateToBase: 0, sortOrder: 500 + list.length });
  }
  return list;
}

/** The currencies the shop's twelve destinations are priced in, in destination order. */
export function configuredDestinationCurrencies(): string[] {
  const codes: string[] = [];
  for (const destination of CONFIGURED_DESTINATIONS) {
    const code = countryCurrency(destination)?.code;
    if (code && !codes.includes(code)) codes.push(code);
  }
  return codes;
}

/**
 * Rates the owner approved on 2026-10-13, cross-derived from the store's own USD figure
 * (278.5 PKR) rather than from a fresh feed: CAD and AUD from that day's mid-market, QAR and
 * OMR from their official USD pegs. They are a starting point offered in the admin's
 * add-currency form, not a hidden second source of truth — saving is what writes them.
 */
export const APPROVED_RATE_SUGGESTIONS: Record<string, number> = {
  CAD: 195.34,
  AUD: 193.64,
  QAR: 76.51,
  OMR: 724.32,
};

/**
 * A blank row for the add-currency form. Everything the ISO tables already know — name, symbol,
 * decimal count — is filled in so the staff member only has to supply the one number the
 * database owns: how many rupees make one unit. Rate 0 means "not configured yet", which the
 * form refuses to save rather than writing a parity placeholder.
 */
export function newCurrencyDraft(code: string, nextSortOrder: number): CurrencyDef {
  const upper = (code || "").toUpperCase().trim();
  const display = displayCurrency(upper);
  return {
    code: upper,
    name: currencyName(upper),
    symbol: display.symbol,
    minorUnits: display.minorUnits,
    rateToBase: APPROVED_RATE_SUGGESTIONS[upper] ?? 0,
    isBase: false,
    enabled: false,
    rateSource: "manual",
    rateUpdatedAt: null,
    sortOrder: nextSortOrder,
  };
}

/** Why a currency draft cannot be saved. The UI owns the wording; this owns the rule. */
export type CurrencyDraftProblem = "codeShape" | "codeDuplicate" | "rateMissing" | "ratePlaceholder";

/**
 * The money a destination's payment rails actually settle in.
 *
 * Rails are configured against real settlement currencies — cash on delivery collects rupees, a
 * bank transfer lands in a PKR account, a gateway charges the currency it was opened for. The
 * currency a shopper is *browsing* in is an estimate layered on top, so asking the rail list in
 * the browsing currency asks the wrong question and answers "none". A destination's configured
 * row wins, then what ISO says that country spends, then the base rupee — never an empty list.
 */
export function settlementCurrencyFor(
  destinations: readonly { code: string; currencyCode: string | null }[],
  countryCode: string | null | undefined,
  baseCode: string
): string {
  const wanted = (countryCode || "").toUpperCase();
  return destinations.find((d) => d.code === wanted)?.currencyCode || countryCurrency(wanted)?.code || baseCode;
}

/**
 * The form's checks, kept apart from the component so they can be proven.
 *
 * These are the polite version. `save_currency` repeats the code shape, the minor-units set and
 * `rate_to_base > 0` server-side, and the primary key rejects a duplicate code, so bypassing the
 * browser still cannot write a bad record — this only decides which message staff see first.
 */
export function validateCurrencyDraft(
  draft: Pick<CurrencyDef, "code" | "rateToBase" | "isBase">,
  existingCodes: Iterable<string>,
  isNew: boolean
): CurrencyDraftProblem | null {
  if (isNew) {
    if (!/^[A-Z]{3}$/.test(draft.code)) return "codeShape";
    for (const code of existingCodes) if (code === draft.code) return "codeDuplicate";
  }
  if (!Number.isFinite(draft.rateToBase) || draft.rateToBase <= 0) return "rateMissing";
  // One rupee per unit is the shape of an unfilled field, not a configured rate. A currency the
  // shop has no figure for must stay unpriced rather than be silently declared equal to the rupee.
  if (!draft.isBase && draft.rateToBase === 1) return "ratePlaceholder";
  return null;
}
