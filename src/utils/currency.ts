import { formatMinor } from "../lib/money";
import { displayCurrencyDef } from "../lib/currencyDisplay";

// The console reports money in two different registers and confusing them mislabels an
// order, so this module keeps them apart by name:
//
//   * base  — aggregate figures the database stores in Pakistani rupees (`orders.total`,
//     `payments.amount`, `refunds.amount`, dashboard and report roll-ups).
//   * stored — a figure the database already expressed in a snapshot currency
//     (`orders.total_in_currency` alongside `orders.currency`).
//
// Nothing here converts. Re-deriving a foreign amount from a live rate would rewrite
// history; a rate change must not move an order that was already charged.

const BASE_CURRENCY = "PKR";
const CONSOLE_LOCALE = "en-US";

/** Base-currency (PKR) figure. Grouping follows the locale; digits stay Latin. */
export function formatBaseMoney(amount: number, locale = CONSOLE_LOCALE): string {
  // A missing total is printed as zero, never as the word "NaN" on a customer's receipt.
  const value = Number.isFinite(amount) ? amount : 0;
  return formatMinor(Math.round(value), displayCurrencyDef(BASE_CURRENCY), locale);
}

/**
 * A value the payload already carries in `code`, rendered with that currency's own symbol
 * and decimal precision. Used for order snapshots and provider settlement figures.
 */
export function formatStoredAmount(
  amountInCurrency: number,
  code: string | null | undefined,
  locale = CONSOLE_LOCALE
): string {
  const def = displayCurrencyDef(code);
  const value = Number.isFinite(amountInCurrency) ? amountInCurrency : 0;
  return formatMinor(Math.round(value * Math.pow(10, def.minorUnits)), def, locale);
}

/** The subset of an order this module needs; matches the `Order` shape in AdminDataContext. */
export interface OrderMoneySnapshot {
  total: number;
  currency?: string | null;
  totalInCurrency?: number | null;
}

/**
 * What the customer was actually charged, in the currency recorded when the order was
 * placed. A PKR order prints as PKR whatever the storefront is currently browsing in.
 * When no converted amount was stored, the base figure is returned with its currency
 * named, so the reader knows which register they are looking at instead of guessing.
 */
export function formatOrderCharged(
  order: OrderMoneySnapshot,
  locale = CONSOLE_LOCALE
): string {
  const code = (order.currency || BASE_CURRENCY).toUpperCase();
  if (code === BASE_CURRENCY) return formatBaseMoney(order.total, locale);
  const charged = order.totalInCurrency;
  if (charged === null || charged === undefined || !Number.isFinite(charged)) {
    return `${formatBaseMoney(order.total, locale)} (${BASE_CURRENCY})`;
  }
  return formatStoredAmount(charged, code, locale);
}

/**
 * The rupee figure behind an order, shown next to `formatOrderCharged` only when the two
 * differ, so a foreign-currency order still exposes the base amount the books run on.
 */
export function orderBaseAmountLabel(order: OrderMoneySnapshot, locale = CONSOLE_LOCALE): string | null {
  const code = (order.currency || BASE_CURRENCY).toUpperCase();
  if (code === BASE_CURRENCY) return null;
  return `${formatBaseMoney(order.total, locale)} ${BASE_CURRENCY}`;
}

export function formatPKR(amount: number, locale = CONSOLE_LOCALE): string {
  return formatBaseMoney(amount, locale);
}
