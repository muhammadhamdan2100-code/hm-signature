import { supabase } from "../lib/supabase";

/**
 * Phase 9 business intelligence read path.
 *
 * Every figure is aggregated inside Postgres behind `can_see_report()`, so a
 * role that may not open a window cannot fetch its rows even by calling the
 * endpoint directly. The payloads carry their own `data_status`; the reader must
 * render that status rather than assume a number exists. A `null` here means the
 * report has no measurement, and is never drawn as a zero.
 */

export type DataStatus =
  | "actual"
  | "calculated"
  /** A cost record exists for at least one size. */
  | "configured"
  | "forecast"
  | "insufficient_data"
  | "not_tracked"
  | "not_configured"
  | "configuration_pending"
  | "error";

export interface ReportFilters {
  /** ISO `YYYY-MM-DD`. */
  from?: string | null;
  to?: string | null;
  country?: string | null;
  currency?: string | null;
}

export interface CohortCell {
  step: number;
  retained: number;
  revenue: number;
  rate: number;
}

export interface CohortRow {
  cohort: string;
  buyers: number;
  reliable: boolean;
  cells: CohortCell[];
}

export interface CohortReport {
  data_status: DataStatus;
  reason?: string;
  granularity: string;
  periods: number;
  buyers: number;
  cohorts: CohortRow[];
  currency: string;
  basis?: string;
  note?: string;
  dimensions?: { key: string; data_status: DataStatus; note?: string }[];
}

export interface ClvCustomer {
  customer_id: string | null;
  orders: number;
  net_revenue: number;
  discounts: number;
  refunded: number;
  span_days: number;
  first_on: string | null;
  last_on: string | null;
  average_order_value: number;
  orders_per_month: number | null;
}

export interface ClvReport {
  data_status: DataStatus;
  basis: string;
  customers: number;
  mean_lifetime_revenue: number;
  median_lifetime_revenue: number;
  total_net_revenue: number;
  currency: string;
  cost_basis: { configured: boolean; variants_costed: number; variants_total: number; data_status: DataStatus };
  customers_list: ClvCustomer[];
  note?: string;
}

export interface RepeatRateReport {
  data_status: DataStatus;
  window_days: number;
  buyers: number;
  repeat_buyers: number;
  purchases: number;
  rate_percent: number | null;
  average_purchases_per_buyer: number | null;
  definition: string;
  note?: string;
}

export interface FunnelStage {
  key: string;
  seq: number;
  /** null means the step was never measured, which is not the same as nobody arriving. */
  sessions: number | null;
  event_hits: number;
  measured_from: string | null;
  stored_source: string | null;
  stored_records: number | null;
  data_status: DataStatus;
}

export interface FunnelReport {
  data_status: DataStatus;
  window_days: number;
  capture_started_at: string | null;
  purchases_in_window: number;
  visit_to_purchase_percent: number | null;
  stages: FunnelStage[];
  note?: string;
}

export interface AttributionChannel {
  source: string;
  medium: string;
  campaign: string;
  visitors: number;
  orders: number;
  revenue: number;
  data_status: DataStatus;
}

export interface AttributionReport {
  data_status: DataStatus;
  model: string;
  window_days: number;
  capture_started_at: string | null;
  currency: string;
  channels: AttributionChannel[];
  landing_pages: { path: string; visits: number }[];
  referrers: { host: string; visits: number }[];
  purchases_in_window: number;
  attributed_purchases: number;
  coverage_percent: number | null;
  coupon_attribution: { code: string; purchases: number; revenue: number; discount_given?: number }[];
  campaign_records: { name: string; type: string | null; status: string; sent: number; engagement_status: DataStatus }[];
  note?: string;
}

export interface ProfitRow {
  product_id: string | null;
  product_name: string;
  units: number;
  revenue: number;
  discounts: number;
  refunds: number;
  net_revenue: number;
  unit_cost: number | null;
  cost: number | null;
  gross_profit: number | null;
  gross_margin_percent: number | null;
  cost_status: DataStatus;
}

export interface ProfitabilityReport {
  data_status: DataStatus;
  window_days: number;
  currency: string;
  basis: string;
  cost_basis: {
    variants_costed: number;
    variants_total: number;
    currency_code: string;
    data_status: DataStatus;
    display: string | null;
  };
  products: ProfitRow[];
  note?: string;
}

export interface CoverRow {
  product_id: string;
  product_name: string;
  variant_id: string;
  size: string;
  sku: string;
  on_hand: number;
  reserved_in_open_orders: number;
  available_to_sell: number;
  low_stock_threshold: number;
  sold_in_window: number;
  velocity_per_day: number;
  days_of_cover: number | null;
  cover_status: string;
  projected_stockout_on: string | null;
  suggested_reorder_units: number | null;
  data_status: DataStatus;
}

export interface InventoryForecastReport {
  data_status: DataStatus;
  window_days: number;
  lead_time_days: number;
  basis: string;
  cover: CoverRow[];
  seasonality: { data_status: DataStatus; note: string };
  note?: string;
}

export interface DemandRow {
  product_id: string;
  product_name: string;
  weeks_sold: number;
  units_in_window: number;
  weekly_mean_units: number;
  weekly_stdev_units: number | null;
  forecast_units: number;
  forecast_low: number;
  forecast_high: number;
  horizon_days: number;
  method: string;
  data_status: DataStatus;
}

export interface DemandForecastReport {
  data_status: DataStatus;
  reason?: string;
  message?: string;
  window_days: number;
  horizon_days: number;
  purchases_found: number;
  weeks_with_sales_found: number;
  purchases_required: number;
  weeks_required: number;
  products: DemandRow[];
  inputs?: { key: string; available: boolean; rows?: number; weeks?: number }[];
  caveat?: { basis: string; excludes: string[]; note: string };
  note?: string;
}

export interface SegmentEntry {
  value: string;
  customers: number;
}

export interface SegmentRow {
  key: string;
  rule: string;
  customers: number | SegmentEntry[];
  data_status: DataStatus;
  note?: string;
  tiers?: { code: string; rank: number; enabled: boolean; min_lifetime_spend: number | null; min_points: number | null }[];
}

export interface SegmentsReport {
  data_status: DataStatus;
  currency: string;
  buyers: number;
  segments: SegmentRow[];
  note?: string;
}

export type ReportColumnKind = "text" | "number" | "money" | "percent" | "count" | "date" | "boolean";

export interface ReportColumn {
  key: string;
  label_key: string;
  kind: ReportColumnKind;
}

export interface AdminReportPayload {
  section: string;
  scope: string;
  currency: string;
  from_date: string | null;
  to_date: string | null;
  country: string | null;
  columns: ReportColumn[];
  rows: Record<string, string | number | boolean | null>[];
  data_status: DataStatus;
  note?: string;
  error?: string;
  sections?: string[];
}

export interface CostBasisStatus {
  variants_total: number;
  variants_costed: number;
  currency_code: string;
  coverage_percent: number;
}

function pickFilters(filters: ReportFilters) {
  return {
    p_from: filters.from || null,
    p_to: filters.to || null,
    p_country: filters.country || null,
    p_currency: filters.currency || null,
  };
}

async function call<T>(fn: string, args: Record<string, unknown>, label: string): Promise<T | null> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    console.warn(`${label}:`, error.message);
    return null;
  }
  return (data ?? null) as T | null;
}

export function fetchCohortReport(
  granularity: "month" | "quarter" = "month",
  filters: ReportFilters = {}
): Promise<CohortReport | null> {
  return call<CohortReport>(
    "get_cohort_analysis",
    { p_granularity: granularity, p_periods: 12, p_currency: filters.currency || null, p_country: filters.country || null },
    "fetchCohortReport"
  );
}

export function fetchLifetimeValue(filters: ReportFilters = {}): Promise<ClvReport | null> {
  return call<ClvReport>(
    "get_customer_lifetime_value",
    { p_currency: filters.currency || null, p_limit: 25, p_country: filters.country || null },
    "fetchLifetimeValue"
  );
}

export function fetchRepeatPurchaseRate(days = 365, filters: ReportFilters = {}): Promise<RepeatRateReport | null> {
  return call<RepeatRateReport>(
    "get_repeat_purchase_rate",
    { p_days: days, p_currency: filters.currency || null, p_country: filters.country || null },
    "fetchRepeatPurchaseRate"
  );
}

export function fetchConversionFunnel(days = 90, filters: ReportFilters = {}): Promise<FunnelReport | null> {
  return call<FunnelReport>(
    "get_conversion_funnel",
    { p_days: days, p_country: filters.country || null },
    "fetchConversionFunnel"
  );
}

export function fetchMarketingAttribution(
  model: "first_touch" | "last_touch" = "first_touch",
  days = 90,
  filters: ReportFilters = {}
): Promise<AttributionReport | null> {
  return call<AttributionReport>(
    "get_marketing_attribution",
    { p_model: model, p_days: days, p_currency: filters.currency || null, p_country: filters.country || null },
    "fetchMarketingAttribution"
  );
}

export function fetchProductProfitability(
  days = 90,
  filters: ReportFilters = {}
): Promise<ProfitabilityReport | null> {
  return call<ProfitabilityReport>(
    "get_product_profitability",
    { p_days: days, p_currency: filters.currency || null, p_country: filters.country || null, p_limit: 50 },
    "fetchProductProfitability"
  );
}

export function fetchInventoryForecast(days = 90, leadTimeDays = 14): Promise<InventoryForecastReport | null> {
  return call<InventoryForecastReport>(
    "get_inventory_forecast",
    { p_days: days, p_lead_time_days: leadTimeDays },
    "fetchInventoryForecast"
  );
}

export function fetchDemandForecast(
  horizonDays = 30,
  days = 180,
  filters: ReportFilters = {}
): Promise<DemandForecastReport | null> {
  return call<DemandForecastReport>(
    "get_demand_forecast",
    { p_days: days, p_horizon_days: horizonDays, p_currency: filters.currency || null },
    "fetchDemandForecast"
  );
}

export function fetchCustomerSegments(filters: ReportFilters = {}): Promise<SegmentsReport | null> {
  return call<SegmentsReport>("get_phase9_segments", { p_currency: filters.currency || null }, "fetchCustomerSegments");
}

export function fetchAdminReport(section: string, filters: ReportFilters = {}): Promise<AdminReportPayload | null> {
  return call<AdminReportPayload>("get_admin_report", { p_section: section, ...pickFilters(filters) }, "fetchAdminReport");
}

export function fetchCostBasisStatus(): Promise<CostBasisStatus | null> {
  return call<CostBasisStatus>("cost_basis_status", {}, "fetchCostBasisStatus");
}

/**
 * Records the house cost of one selling size, or clears it when `unitCost` is
 * null. Guarded by manage_products in the database, so this cannot be used to
 * price a product the caller may not edit.
 */
export async function saveVariantCost(
  variantId: string,
  unitCost: number | null,
  note?: string
): Promise<{ ok: boolean; error: string | null }> {
  const { data, error } = await supabase.rpc("save_variant_cost", {
    p_variant_id: variantId,
    p_unit_cost: unitCost,
    p_note: note || null,
  });
  if (error) return { ok: false, error: error.message };
  const result = (data ?? {}) as { saved?: boolean; error?: string };
  if (!result.saved) return { ok: false, error: result.error || "not_saved" };
  return { ok: true, error: null };
}

/**
 * Recorded costs by selling size. Read directly from the staff-readable table,
 * so a size with no row simply has no entry here — which is what "not
 * configured" means, and why it must not be rendered as a zero.
 */
export async function fetchVariantCosts(): Promise<Record<string, { unitCost: number; note: string | null }>> {
  const { data, error } = await supabase
    .from("product_variant_costs")
    .select("variant_id,unit_cost,note")
    .order("variant_id");
  if (error) {
    console.warn("fetchVariantCosts:", error.message);
    return {};
  }
  const out: Record<string, { unitCost: number; note: string | null }> = {};
  for (const row of (data as { variant_id: string; unit_cost: number; note: string | null }[]) || []) {
    out[row.variant_id] = { unitCost: Number(row.unit_cost), note: row.note ?? null };
  }
  return out;
}

export const REPORT_SECTIONS = ["sales", "customers", "products", "payments", "inventory"] as const;
export type ReportSection = (typeof REPORT_SECTIONS)[number];

/** Which report scope a role may open. Kept beside the data so the UI can hide a tab it cannot read. */
export const REPORT_SCOPES: Record<string, "business" | "operational" | "content"> = {
  sales: "business",
  customers: "business",
  products: "content",
  payments: "operational",
  inventory: "operational",
};
