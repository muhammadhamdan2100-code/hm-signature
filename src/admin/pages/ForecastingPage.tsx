import { useCallback, useEffect, useMemo, useState } from "react";
import { PackageSearch, TrendingUp } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { AnalyticsBreakdownTable, type BreakdownColumn } from "../components/AnalyticsBreakdownTable";
import { DataGap, ErrorPanel, FilterBar, LoadingPanel, Panel, useReportFormat } from "../components/Phase9Shared";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import {
  fetchDemandForecast,
  fetchInventoryForecast,
  fetchProductProfitability,
  fetchVariantCosts,
  saveVariantCost,
  type DemandForecastReport,
  type InventoryForecastReport,
  type ProfitabilityReport,
  type ReportFilters,
} from "../../services/businessIntelligence";

/**
 * Phase 9 forecasting: what a fragrance earns, what it costs the house, and how
 * long the stock lasts.
 *
 * Two of these three panels exist mainly to say "not yet" honestly. Gross margin
 * stays empty until a real cost is recorded against a size, and a demand curve
 * stays empty until enough completed purchases have accumulated to average. The
 * inputs each one refuses without are printed in the panel, so the gap is
 * legible as a gap rather than as a flat line.
 */

const COVER_STATUS_KEYS: Record<string, string> = {
  healthy: "admin.forecasting.coverHealthy",
  low_stock: "admin.forecasting.coverLow",
  out_of_stock: "admin.forecasting.coverOut",
  below_lead_time: "admin.forecasting.coverBelowLeadTime",
  order_soon: "admin.forecasting.coverOrderSoon",
  no_recorded_demand: "admin.forecasting.coverNoDemand",
};

export function ForecastingPage() {
  const { t } = useI18n();
  const { products } = useAdminData();
  const canCost = hasPermission(getCurrentStaff(), "products.manage");
  const [filters, setFilters] = useState<ReportFilters>({ from: null, to: null, country: null, currency: null });
  const [windowDays, setWindowDays] = useState(90);
  const [leadTime, setLeadTime] = useState(14);
  const [horizon, setHorizon] = useState(30);

  const [profit, setProfit] = useState<ProfitabilityReport | null>(null);
  const [cover, setCover] = useState<InventoryForecastReport | null>(null);
  const [demand, setDemand] = useState<DemandForecastReport | null>(null);
  const [costs, setCosts] = useState<Record<string, { unitCost: number; note: string | null }>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [profitability, inventory, demandReport, costRows] = await Promise.all([
        fetchProductProfitability(windowDays, filters),
        fetchInventoryForecast(windowDays, leadTime),
        fetchDemandForecast(horizon, Math.max(windowDays, 180), filters),
        fetchVariantCosts(),
      ]);
      const anything = profitability || inventory || demandReport;
      setProfit(profitability);
      setCover(inventory);
      setDemand(demandReport);
      setCosts(costRows);
      if (!anything) setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [windowDays, leadTime, horizon, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = useReportFormat(profit?.currency || filters.currency);

  const sizes = useMemo(
    () =>
      products.flatMap((product) =>
        (product.variants || [])
          .filter((variant) => variant.active)
          .map((variant) => ({
            variantId: variant.id,
            productId: product.id,
            product: product.name,
            size: variant.size,
            sku: variant.sku,
            price: variant.salePrice ?? variant.price,
            stock: variant.stock,
          }))
      ),
    [products]
  );

  const commitCost = async (variantId: string) => {
    const raw = (drafts[variantId] ?? "").trim();
    setSaveError(null);
    if (raw === "") {
      if (!costs[variantId]) return;
      setSaving(variantId);
      const cleared = await saveVariantCost(variantId, null);
      setSaving(null);
      if (!cleared.ok) {
        setSaveError(t("admin.forecasting.costSaveFailed"));
        return;
      }
      await load();
      return;
    }
    const value = Number(raw.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(value) || value < 0) {
      setSaveError(t("admin.forecasting.costMustBeNumber"));
      return;
    }
    setSaving(variantId);
    const result = await saveVariantCost(variantId, Math.round(value * 100) / 100);
    setSaving(null);
    if (!result.ok) {
      setSaveError(t("admin.forecasting.costSaveFailed"));
      return;
    }
    await load();
  };

  const profitColumns: BreakdownColumn<ProfitabilityReport["products"][number]>[] = [
    { header: t("admin.forecasting.product"), align: "left", render: (r) => <span className="text-ivory">{r.product_name}</span> },
    { header: t("admin.forecasting.units"), align: "right", render: (r) => <span className="text-ivory num-lining">{fmt.number(r.units)}</span> },
    { header: t("admin.forecasting.revenue"), align: "right", render: (r) => <span className="text-gold num-lining">{fmt.money(r.revenue)}</span> },
    { header: t("admin.forecasting.discounts"), align: "right", render: (r) => <span className="text-muted num-lining">{fmt.money(r.discounts)}</span> },
    { header: t("admin.forecasting.refunds"), align: "right", render: (r) => <span className="text-muted num-lining">{fmt.money(r.refunds)}</span> },
    { header: t("admin.forecasting.net"), align: "right", render: (r) => <span className="text-ivory num-lining">{fmt.money(r.net_revenue)}</span> },
    {
      header: t("admin.forecasting.unitCost"),
      align: "right",
      render: (r) =>
        r.unit_cost === null ? (
          <span className="text-[10px] font-mono uppercase tracking-[1.2px] text-rose-300">{t("admin.forecasting.costMissing")}</span>
        ) : (
          <span className="text-muted num-lining">{fmt.money(r.unit_cost)}</span>
        ),
    },
    {
      header: t("admin.forecasting.grossProfit"),
      align: "right",
      render: (r) => <span className="text-ivory num-lining">{r.gross_profit === null ? "—" : fmt.money(r.gross_profit)}</span>,
    },
    {
      header: t("admin.forecasting.grossMargin"),
      align: "right",
      render: (r) => <span className="text-ivory num-lining">{fmt.percent(r.gross_margin_percent)}</span>,
    },
  ];

  const coverColumns: BreakdownColumn<InventoryForecastReport["cover"][number]>[] = [
    { header: t("admin.forecasting.product"), align: "left", render: (r) => <span className="text-ivory">{r.product_name}</span> },
    { header: t("admin.forecasting.size"), align: "left", render: (r) => <span className="text-muted">{r.size}</span> },
    { header: t("admin.forecasting.onHand"), align: "right", render: (r) => <span className="text-ivory num-lining">{fmt.number(r.on_hand)}</span> },
    { header: t("admin.forecasting.reserved"), align: "right", render: (r) => <span className="text-muted num-lining">{fmt.number(r.reserved_in_open_orders)}</span> },
    { header: t("admin.forecasting.available"), align: "right", render: (r) => <span className="text-gold num-lining">{fmt.number(r.available_to_sell)}</span> },
    { header: t("admin.forecasting.soldWindow"), align: "right", render: (r) => <span className="text-muted num-lining">{fmt.number(r.sold_in_window)}</span> },
    { header: t("admin.forecasting.velocity"), align: "right", render: (r) => <span className="text-muted num-lining">{fmt.number(r.velocity_per_day, 3)}</span> },
    { header: t("admin.forecasting.daysOfCover"), align: "right", render: (r) => <span className="text-ivory num-lining">{fmt.number(r.days_of_cover)}</span> },
    {
      header: t("admin.forecasting.stockout"),
      align: "left",
      render: (r) => <span className="text-muted whitespace-nowrap">{r.projected_stockout_on ? fmt.date(r.projected_stockout_on) : "—"}</span>,
    },
    {
      header: t("admin.forecasting.suggestedOrder"),
      align: "right",
      render: (r) => <span className="text-ivory num-lining">{r.suggested_reorder_units === null ? "—" : fmt.number(r.suggested_reorder_units)}</span>,
    },
    {
      header: t("admin.forecasting.status"),
      align: "left",
      render: (r) => (
        <span className="text-[10px] font-mono uppercase tracking-[1.2px] text-gold">
          {t(COVER_STATUS_KEYS[r.cover_status] || "admin.forecasting.coverNoDemand")}
        </span>
      ),
    },
  ];

  const demandColumns: BreakdownColumn<DemandForecastReport["products"][number]>[] = [
    { header: t("admin.forecasting.product"), align: "left", render: (r) => <span className="text-ivory">{r.product_name}</span> },
    { header: t("admin.forecasting.weeksSold"), align: "right", render: (r) => <span className="text-muted num-lining">{fmt.number(r.weeks_sold)}</span> },
    { header: t("admin.forecasting.unitsWindow"), align: "right", render: (r) => <span className="text-muted num-lining">{fmt.number(r.units_in_window)}</span> },
    { header: t("admin.forecasting.weeklyMean"), align: "right", render: (r) => <span className="text-ivory num-lining">{fmt.number(r.weekly_mean_units, 2)}</span> },
    {
      header: t("admin.forecasting.forecastUnits"),
      align: "right",
      render: (r) => (
        <span className="text-gold num-lining">
          {fmt.number(r.forecast_units, 1)}
          <span className="text-muted"> ({fmt.number(r.forecast_low, 1)}–{fmt.number(r.forecast_high, 1)})</span>
        </span>
      ),
    },
    { header: t("admin.forecasting.horizon"), align: "right", render: (r) => <span className="text-muted num-lining">{t("admin.forecasting.horizonDays", { count: r.horizon_days })}</span> },
  ];

  return (
    <div className="space-y-6 pb-10">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl text-ivory tracking-wide">{t("admin.forecasting.title")}</h1>
        <p className="text-xs sm:text-sm text-muted font-light max-w-3xl">{t("admin.forecasting.subtitle")}</p>
      </header>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        windowDays={windowDays}
        onWindowChange={setWindowDays}
        countries={[]}
      />

      {error ? <ErrorPanel message={t("admin.forecasting.loadFailed")} onRetry={load} /> : null}

      {/* 9.5 Product profitability */}
      <Panel
        id="profitability"
        title={t("admin.forecasting.profitTitle")}
        subtitle={t("admin.forecasting.profitSubtitle")}
        status={profit?.data_status}
      >
        {loading && !profit ? <LoadingPanel label={t("admin.forecasting.loading")} /> : null}
        {profit ? (
          <div className="space-y-4">
            {profit.cost_basis.data_status === "not_configured" ? (
              <DataGap
                status="not_configured"
                note={t("admin.forecasting.costMissingNote", { total: profit.cost_basis.variants_total })}
              />
            ) : (
              <DataGap
                status="calculated"
                note={t("admin.forecasting.costPartialNote", {
                  costed: profit.cost_basis.variants_costed,
                  total: profit.cost_basis.variants_total,
                })}
              />
            )}
            {profit.data_status === "insufficient_data" ? (
              <DataGap status="insufficient_data" note={t("admin.forecasting.profitNoPurchases")} />
            ) : null}
            <AnalyticsBreakdownTable
              sectionId="profitability"
              title={t("admin.forecasting.profitTable")}
              rows={profit.products}
              columns={profitColumns}
              rowKey={(row) => row.product_id || row.product_name}
              emptyMessage={t("admin.forecasting.profitEmpty")}
              caption={t("admin.forecasting.profitCaption")}
            />
          </div>
        ) : null}
      </Panel>

      {/* Cost of goods, recorded by the house */}
      <Panel
        id="costs"
        title={t("admin.forecasting.costTitle")}
        subtitle={t("admin.forecasting.costSubtitle")}
        status={profit?.cost_basis.data_status === "configured" ? "actual" : "not_configured"}
      >
        {!canCost ? (
          <DataGap status="not_configured" note={t("admin.forecasting.costNoPermission")} />
        ) : (
          <div className="space-y-3">
            {saveError ? <p className="text-[11px] text-rose-300">{saveError}</p> : null}
            <div className="relative max-h-[28rem] overflow-auto border border-gold/20 rounded-lg bg-navy/40">
              <table className="w-full min-w-[420px] text-start text-xs font-sans">
                <caption className="sr-only">{t("admin.forecasting.costSubtitle")}</caption>
                <thead className="sticky top-0 bg-navy text-gold uppercase tracking-[1.5px] text-[10px] border-b border-gold/15">
                  <tr>
                    <th scope="col" className="px-3 py-2.5 text-start">{t("admin.forecasting.product")}</th>
                    <th scope="col" className="px-3 py-2.5 text-start">{t("admin.forecasting.size")}</th>
                    <th scope="col" className="px-3 py-2.5 text-end">{t("admin.forecasting.sellingPrice")}</th>
                    <th scope="col" className="px-3 py-2.5 text-end">{t("admin.forecasting.unitCost")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10 text-ivory">
                  {sizes.map((row) => (
                    <tr key={row.variantId} className="hover:bg-navy/60">
                      <th scope="row" className="px-3 py-2 text-start font-sans font-normal text-ivory">{row.product}</th>
                      <td className="px-3 py-2 text-muted">{row.size}</td>
                      <td className="px-3 py-2 text-end text-muted num-lining">{fmt.money(row.price)}</td>
                      <td className="px-3 py-2 text-end">
                        <label className="sr-only" htmlFor={`cost-${row.variantId}`}>
                          {t("admin.forecasting.costForSize", { product: row.product, size: row.size })}
                        </label>
                        <div className="flex items-center gap-2 justify-end">
                          <input
                            id={`cost-${row.variantId}`}
                            inputMode="decimal"
                            value={drafts[row.variantId] ?? (costs[row.variantId] ? String(costs[row.variantId].unitCost) : "")}
                            placeholder="—"
                            disabled={saving === row.variantId}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [row.variantId]: e.target.value }))}
                            onBlur={() => commitCost(row.variantId)}
                            className="w-24 rounded border border-gold/20 bg-navy px-2 py-1 text-end text-xs text-ivory focus:border-gold focus:outline-none disabled:opacity-50"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!sizes.length ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-muted font-light">
                        {t("admin.forecasting.costNoSizes")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted font-light">{t("admin.forecasting.costStoredIn", { currency: profit?.cost_basis.currency_code || "PKR" })}</p>
          </div>
        )}
      </Panel>

      {/* 9.6 Inventory forecasting */}
      <Panel
        id="inventory"
        title={t("admin.forecasting.inventoryTitle")}
        subtitle={t("admin.forecasting.inventorySubtitle")}
        status={cover?.data_status}
        actions={
          <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[1.4px] text-muted">
            {t("admin.forecasting.leadTime")}
            <input
              type="number"
              min={1}
              max={180}
              value={leadTime}
              onChange={(e) => setLeadTime(Math.min(180, Math.max(1, Number(e.target.value) || 1)))}
              className="w-20 rounded border border-gold/20 bg-navy px-2 py-1 text-xs text-ivory focus:border-gold focus:outline-none"
            />
            {t("admin.forecasting.days")}
          </label>
        }
      >
        {loading && !cover ? <LoadingPanel label={t("admin.forecasting.loading")} /> : null}
        {cover ? (
          <div className="space-y-4">
            {cover.data_status === "insufficient_data" ? (
              <DataGap status="insufficient_data" note={t("admin.forecasting.coverNoPurchases")} />
            ) : null}
            <DataGap
              status={cover.seasonality.data_status}
              note={t("admin.forecasting.seasonalityNote")}
            />
            <AnalyticsBreakdownTable
              sectionId="inventory-cover"
              title={t("admin.forecasting.inventoryTable")}
              rows={cover.cover}
              columns={coverColumns}
              rowKey={(row) => row.variant_id}
              emptyMessage={t("admin.forecasting.inventoryEmpty")}
              caption={t("admin.forecasting.inventoryCaption", { window: cover.window_days, lead: cover.lead_time_days })}
            />
          </div>
        ) : null}
      </Panel>

      {/* 9.7 Demand forecasting */}
      <Panel
        id="demand"
        title={t("admin.forecasting.demandTitle")}
        subtitle={t("admin.forecasting.demandSubtitle")}
        status={demand?.data_status}
        actions={
          <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[1.4px] text-muted">
            {t("admin.forecasting.horizon")}
            <input
              type="number"
              min={7}
              max={180}
              value={horizon}
              onChange={(e) => setHorizon(Math.min(180, Math.max(7, Number(e.target.value) || 7)))}
              className="w-20 rounded border border-gold/20 bg-navy px-2 py-1 text-xs text-ivory focus:border-gold focus:outline-none"
            />
            {t("admin.forecasting.days")}
          </label>
        }
      >
        {loading && !demand ? <LoadingPanel label={t("admin.forecasting.loading")} /> : null}
        {demand ? (
          <div className="space-y-4">
            {demand.data_status === "insufficient_data" ? (
              <DataGap
                status="insufficient_data"
                note={t("admin.forecasting.demandInsufficient")}
                detail={
                  <ul className="space-y-1">
                    <li className="flex items-center gap-2">
                      <PackageSearch className="w-3.5 h-3.5 text-gold" />
                      {t("admin.forecasting.needPurchases", { found: demand.purchases_found, required: demand.purchases_required })}
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-gold" />
                      {t("admin.forecasting.needWeeks", { found: demand.weeks_with_sales_found, required: demand.weeks_required })}
                    </li>
                    {demand.inputs ? (
                      <li className="flex flex-wrap gap-2 pt-1">
                        {demand.inputs.map((input) => (
                          <span
                            key={input.key}
                            className="rounded border border-gold/20 bg-navy px-2 py-1 text-[10px] font-mono uppercase tracking-[1.2px] text-muted"
                          >
                            {input.key.replace(/_/g, " ")} · {input.available ? "yes" : "no"}
                          </span>
                        ))}
                      </li>
                    ) : null}
                  </ul>
                }
              />
            ) : null}
            {demand.products.length ? <p className="text-[11px] text-muted font-light">{t("admin.forecasting.demandCaveat")}</p> : null}
            <AnalyticsBreakdownTable
              sectionId="demand-forecast"
              title={t("admin.forecasting.demandTable")}
              rows={demand.products}
              columns={demandColumns}
              rowKey={(row) => row.product_id}
              emptyMessage={t("admin.forecasting.demandEmpty")}
              caption={t("admin.forecasting.demandCaption", { window: demand.window_days, horizon: demand.horizon_days })}
            />
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

export default ForecastingPage;
