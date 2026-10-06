import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { FALLBACK_CURRENCIES, type CurrencyDef, type RateSource } from "../lib/money";

// Country, currency and language configuration lives in the database. Visitors read it
// through public select policies; every write goes through a function that demands
// `manage_settings`, so this module never issues a direct table update.

export interface CountryRule {
  code: string;
  name: string;
  enabled: boolean;
  currencyCode: string | null;
  shippingFee: number | null;
  freeShippingThreshold: number | null;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
  deliveryMethod: string | null;
  notes: string | null;
  restrictions: string | null;
  taxEnabled: boolean;
  taxRate: number | null;
  taxLabel: string | null;
  sortOrder: number;
}

export interface LanguageDef {
  code: string;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  enabled: boolean;
  isDefault: boolean;
  locale: string;
  sortOrder: number;
}

export interface CountryDraft {
  enabled: boolean;
  currencyCode: string | null;
  shippingFee: number | null;
  freeShippingThreshold: number | null;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
  deliveryMethod: string | null;
  notes: string | null;
  restrictions: string | null;
  taxEnabled: boolean;
  taxRate: number | null;
  taxLabel: string | null;
}

export interface PricingQuote {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  taxRate: number;
  taxLabel: string | null;
  countryCode: string;
  countryName: string;
  deliveryMethod: string | null;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
  currency: string;
  currencySymbol: string;
  currencyMinorUnits: number;
  currencyRateToBase: number;
  totalInCurrency: number;
  rateSource: RateSource;
}

export interface PricingFailure {
  error: string;
}

export type PricingResult = PricingQuote | PricingFailure;

export interface BasketLine {
  variant_id: string;
  quantity: number;
}

function isQuote(value: Record<string, any>): value is Record<string, any> & { country_code: string } {
  return typeof value.country_code === "string";
}

function mapCurrency(row: any): CurrencyDef {
  return {
    code: String(row.code).toUpperCase(),
    name: row.name,
    symbol: row.symbol,
    minorUnits: Number(row.minor_units ?? 2),
    rateToBase: Number(row.rate_to_base ?? 1),
    isBase: Boolean(row.is_base),
    enabled: Boolean(row.enabled),
    rateSource: (row.rate_source ?? "manual") as RateSource,
    rateUpdatedAt: row.rate_updated_at ?? null,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function mapCountry(row: any): CountryRule {
  return {
    code: String(row.code).toUpperCase(),
    name: row.name,
    enabled: Boolean(row.enabled),
    currencyCode: row.currency_code ?? null,
    shippingFee: row.shipping_fee === null || row.shipping_fee === undefined ? null : Number(row.shipping_fee),
    freeShippingThreshold:
      row.free_shipping_threshold === null || row.free_shipping_threshold === undefined
        ? null
        : Number(row.free_shipping_threshold),
    deliveryDaysMin: row.delivery_days_min === null || row.delivery_days_min === undefined ? null : Number(row.delivery_days_min),
    deliveryDaysMax: row.delivery_days_max === null || row.delivery_days_max === undefined ? null : Number(row.delivery_days_max),
    deliveryMethod: row.delivery_method ?? null,
    notes: row.notes ?? null,
    restrictions: row.restrictions ?? null,
    taxEnabled: Boolean(row.tax_enabled),
    taxRate: row.tax_rate === null || row.tax_rate === undefined ? null : Number(row.tax_rate),
    taxLabel: row.tax_label ?? null,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function mapLanguage(row: any): LanguageDef {
  return {
    code: String(row.code).toLowerCase(),
    name: row.name,
    nativeName: row.native_name ?? row.name,
    direction: row.direction === "rtl" ? "rtl" : "ltr",
    enabled: Boolean(row.enabled),
    isDefault: Boolean(row.is_default),
    locale: row.locale ?? row.code,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function fetchCurrencies(): Promise<CurrencyDef[]> {
  if (!isSupabaseConfigured()) return FALLBACK_CURRENCIES;
  const { data, error } = await supabase
    .from("currencies")
    .select("code,name,symbol,minor_units,rate_to_base,is_base,enabled,rate_source,rate_updated_at,sort_order")
    .order("sort_order", { ascending: true });
  if (error || !data || data.length === 0) return FALLBACK_CURRENCIES;
  return data.map(mapCurrency);
}

export async function fetchCountries(): Promise<CountryRule[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("countries")
    .select("code,name,enabled,currency_code,shipping_fee,free_shipping_threshold,delivery_days_min,delivery_days_max,delivery_method,notes,restrictions,tax_enabled,tax_rate,tax_label,sort_order")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data.map(mapCountry);
}

export async function fetchLanguages(): Promise<LanguageDef[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("languages")
    .select("code,name,native_name,direction,enabled,is_default,locale,sort_order")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data.map(mapLanguage);
}

// ---------------------------------------------------------------------------
// Checkout pricing
// ---------------------------------------------------------------------------

export async function quoteOrder(
  items: BasketLine[],
  countryCode: string | null,
  currencyCode: string,
  couponCode?: string | null
): Promise<PricingResult> {
  if (!isSupabaseConfigured()) return { error: "Store configuration is unavailable." };
  const { data, error } = await supabase.rpc("quote_order", {
    p_items: items,
    p_country_code: countryCode,
    p_currency: currencyCode,
    p_coupon_code: couponCode && couponCode.trim() ? couponCode.trim() : null,
  });
  if (error) return { error: error.message };
  const row = (data ?? {}) as Record<string, any>;
  if (typeof row.error === "string") return { error: row.error };
  if (!isQuote(row)) return { error: "Pricing is unavailable right now. Please try again." };
  return {
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    shipping: Number(row.shipping),
    tax: Number(row.tax),
    total: Number(row.total),
    taxRate: Number(row.tax_rate ?? 0),
    taxLabel: row.tax_label ?? null,
    countryCode: row.country_code,
    countryName: row.country_name,
    deliveryMethod: row.delivery_method ?? null,
    deliveryDaysMin: row.delivery_days_min === null || row.delivery_days_min === undefined ? null : Number(row.delivery_days_min),
    deliveryDaysMax: row.delivery_days_max === null || row.delivery_days_max === undefined ? null : Number(row.delivery_days_max),
    currency: row.currency,
    currencySymbol: row.currency_symbol,
    currencyMinorUnits: Number(row.currency_minor_units ?? 2),
    currencyRateToBase: Number(row.currency_rate_to_base ?? 1),
    totalInCurrency: Number(row.total_in_currency ?? 0),
    rateSource: (row.rate_source ?? "manual") as RateSource,
  };
}

// ---------------------------------------------------------------------------
// Staff configuration
// ---------------------------------------------------------------------------

export type SaveResult = { ok: true } | { ok: false; message: string };

function saveError(error: { message?: string } | null, fallback: string): SaveResult {
  return { ok: false, message: error?.message || fallback };
}

export async function saveCurrency(currency: CurrencyDef): Promise<SaveResult> {
  const { data, error } = await supabase.rpc("save_currency", {
    p_code: currency.code,
    p_name: currency.name,
    p_symbol: currency.symbol,
    p_minor_units: currency.minorUnits,
    p_rate_to_base: currency.rateToBase,
    p_enabled: currency.enabled,
    p_sort_order: currency.sortOrder,
  });
  if (error) return saveError(error, "Could not save that currency.");
  return data === true ? { ok: true } : { ok: false, message: "The currency was not changed." };
}

export async function saveLanguage(language: LanguageDef): Promise<SaveResult> {
  const { data, error } = await supabase.rpc("save_language", {
    p_code: language.code,
    p_enabled: language.enabled,
    p_is_default: language.isDefault,
  });
  if (error) return saveError(error, "Could not save that language.");
  return data === true ? { ok: true } : { ok: false, message: "The language was not changed." };
}

export async function saveCountryRule(code: string, draft: CountryDraft): Promise<SaveResult> {
  const { data, error } = await supabase.rpc("save_country_rule", {
    p_code: code,
    p_rule: {
      enabled: draft.enabled,
      currency_code: draft.currencyCode,
      shipping_fee: draft.shippingFee,
      free_shipping_threshold: draft.freeShippingThreshold,
      delivery_days_min: draft.deliveryDaysMin,
      delivery_days_max: draft.deliveryDaysMax,
      delivery_method: draft.deliveryMethod,
      notes: draft.notes,
      restrictions: draft.restrictions,
      tax_enabled: draft.taxEnabled,
      tax_rate: draft.taxRate,
      tax_label: draft.taxLabel,
    },
  });
  if (error) return saveError(error, "Could not save that destination.");
  return data === true ? { ok: true } : { ok: false, message: "The destination was not changed." };
}
