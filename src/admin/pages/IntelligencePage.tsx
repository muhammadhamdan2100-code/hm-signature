import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Funnel,
  Megaphone,
  Repeat2,
  Tags,
  Users,
  Wallet,
} from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { AnalyticsBreakdownTable, type BreakdownColumn } from "../components/AnalyticsBreakdownTable";
import {
  DataGap,
  ErrorPanel,
  FilterBar,
  LoadingPanel,
  MetricStatus,
  Panel,
  useReportFormat,
} from "../components/Phase9Shared";
import {
  fetchConversionFunnel,
  fetchCohortReport,
  fetchCustomerSegments,
  fetchLifetimeValue,
  fetchMarketingAttribution,
  fetchRepeatPurchaseRate,
  type AttributionReport,
  type ClvReport,
  type CohortReport,
  type FunnelReport,
  type ReportFilters,
  type RepeatRateReport,
  type SegmentsReport,
} from "../../services/businessIntelligence";
import { fetchCountries } from "../../services/internationalConfig";

/**
 * Phase 9 intelligence: who buys, how often, what they are worth, how they
 * arrive, and which step of the visit turns into an order.
 *
 * Every panel below answers independently. One failing read never blanks the
 * page, and a panel whose data does not exist says which of the three reasons it
 * has: not enough of it, or none of it was ever measured.
 */

interface Load<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function usePhase9<T>(loader: () => Promise<T | null>, deps: unknown[]): Load<T> & { reload: () => void } {
  const [state, setState] = useState<Load<T>>({ data: null, loading: true, error: null });
  const [nonce, setNonce] = useState(0);
  const load = loader;

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ data: prev.data, loading: true, error: null }));
    load()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: data ? null : "empty" });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, loading: false, error: "failed" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { ...state, reload: () => setNonce((n) => n + 1) };
}

const STAGE_KEYS: Record<string, string> = {
  visit: "admin.intelligence.stageVisit",
  product_view: "admin.intelligence.stageProductView",
  add_to_cart: "admin.intelligence.stageAddToCart",
  begin_checkout: "admin.intelligence.stageBeginCheckout",
  payment_started: "admin.intelligence.stagePaymentStarted",
  payment_completed: "admin.intelligence.stagePaymentCompleted",
  order_completed: "admin.intelligence.stageOrderCompleted",
};

const SEGMENT_RULE_KEYS: Record<string, string> = {
  new_customer: "admin.intelligence.ruleNew",
  returning_customer: "admin.intelligence.ruleReturning",
  frequent_buyer: "admin.intelligence.ruleFrequent",
  high_value: "admin.intelligence.ruleHighValue",
  vip: "admin.intelligence.ruleVip",
  at_risk: "admin.intelligence.ruleAtRisk",
  dormant: "admin.intelligence.ruleDormant",
  unconverted: "admin.intelligence.ruleUnconverted",
  by_country: "admin.intelligence.ruleByCountry",
  fragrance_affinity: "admin.intelligence.ruleFragranceAffinity",
  product_affinity: "admin.intelligence.ruleProductAffinity",
};

// The cohort report names which of its four dimensions the data can actually split.
const DIMENSION_NOTE_KEYS: Record<string, string> = {
  country: "admin.intelligence.noteDimensionCountry",
  acquisition_source: "admin.intelligence.noteDimensionSource",
  segment: "admin.intelligence.noteDimensionSegment",
};

const SEGMENT_KEYS: Record<string, string> = {
  new_customer: "admin.intelligence.segmentNew",
  returning_customer: "admin.intelligence.segmentReturning",
  frequent_buyer: "admin.intelligence.segmentFrequent",
  high_value: "admin.intelligence.segmentHighValue",
  vip: "admin.intelligence.segmentVip",
  at_risk: "admin.intelligence.segmentAtRisk",
  dormant: "admin.intelligence.segmentDormant",
  unconverted: "admin.intelligence.segmentUnconverted",
  by_country: "admin.intelligence.segmentByCountry",
  fragrance_affinity: "admin.intelligence.segmentFragranceAffinity",
  product_affinity: "admin.intelligence.segmentProductAffinity",
};

const SECTION_ORDER = [
  { id: "repeat", icon: Repeat2, labelKey: "admin.intelligence.navRepeat" },
  { id: "cohort", icon: ClipboardList, labelKey: "admin.intelligence.navCohorts" },
  { id: "clv", icon: Wallet, labelKey: "admin.intelligence.navValue" },
  { id: "funnel", icon: Funnel, labelKey: "admin.intelligence.navFunnel" },
  { id: "attribution", icon: Megaphone, labelKey: "admin.intelligence.navAttribution" },
  { id: "segments", icon: Tags, labelKey: "admin.intelligence.navSegments" },
];

export function IntelligencePage() {
  const { t } = useI18n();
  const [filters, setFilters] = useState<ReportFilters>({ from: null, to: null, country: null, currency: null });
  const [windowDays, setWindowDays] = useState(365);
  const [granularity, setGranularity] = useState<"month" | "quarter">("month");
  const [model, setModel] = useState<"first_touch" | "last_touch">("first_touch");
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    fetchCountries()
      .then((rows) => setCountries(rows.map((r) => ({ code: r.code, name: r.name }))))
      .catch(() => setCountries([]));
  }, []);

  const repeat = usePhase9<RepeatRateReport>(
    () => fetchRepeatPurchaseRate(windowDays, filters),
    [windowDays, filters.from, filters.to, filters.country, filters.currency]
  );
  const cohort = usePhase9<CohortReport>(
    () => fetchCohortReport(granularity, filters),
    [granularity, filters.country, filters.currency]
  );
  const clv = usePhase9<ClvReport>(
    () => fetchLifetimeValue(filters),
    [filters.country, filters.currency]
  );
  const funnel = usePhase9<FunnelReport>(
    () => fetchConversionFunnel(windowDays, filters),
    [windowDays, filters.country]
  );
  const attribution = usePhase9<AttributionReport>(
    () => fetchMarketingAttribution(model, windowDays, filters),
    [model, windowDays, filters.country, filters.currency]
  );
  const segments = usePhase9<SegmentsReport>(() => fetchCustomerSegments(filters), [filters.currency]);

  const fmt = useReportFormat(clv.data?.currency || cohort.data?.currency || filters.currency);

  const maxStep = useMemo(() => {
    const steps = (cohort.data?.cohorts || []).flatMap((c) => c.cells.map((cell) => cell.step));
    return steps.length ? Math.max(...steps) : 0;
  }, [cohort.data]);

  const reloadAll = useCallback(() => {
    repeat.reload();
    cohort.reload();
    clv.reload();
    funnel.reload();
    attribution.reload();
    segments.reload();
  }, [repeat, cohort, clv, funnel, attribution, segments]);

  const repeatColumns: BreakdownColumn<AttributionReport["channels"][number]>[] = [
    { header: t("admin.intelligence.attrSource"), align: "left", render: (r) => <span className="text-ivory">{r.source}</span> },
    { header: t("admin.intelligence.attrMedium"), align: "left", render: (r) => <span className="text-muted">{r.medium}</span> },
    { header: t("admin.intelligence.attrCampaign"), align: "left", render: (r) => <span className="text-muted truncate">{r.campaign}</span> },
    { header: t("admin.intelligence.attrVisitors"), align: "right", render: (r) => <span className="text-gold num-lining">{fmt.number(r.visitors)}</span> },
    { header: t("admin.intelligence.attrOrders"), align: "right", render: (r) => <span className="text-ivory num-lining">{fmt.number(r.orders)}</span> },
    { header: t("admin.intelligence.attrRevenue"), align: "right", render: (r) => <span className="text-gold num-lining">{fmt.money(r.revenue)}</span> },
  ];

  const clvColumns: BreakdownColumn<ClvReport["customers_list"][number]>[] = [
    { header: t("admin.intelligence.clvCustomer"), align: "left", render: (r) => <span className="text-ivory truncate">{(r.customer_id || "—").slice(0, 8)}</span> },
    { header: t("admin.intelligence.clvOrders"), align: "right", render: (r) => <span className="text-ivory num-lining">{fmt.number(r.orders)}</span> },
    { header: t("admin.intelligence.clvNet"), align: "right", render: (r) => <span className="text-gold num-lining">{fmt.money(r.net_revenue)}</span> },
    { header: t("admin.intelligence.clvDiscounts"), align: "right", render: (r) => <span className="text-muted num-lining">{fmt.money(r.discounts)}</span> },
    { header: t("admin.intelligence.clvRefunded"), align: "right", render: (r) => <span className="text-muted num-lining">{fmt.money(r.refunded)}</span> },
    { header: t("admin.intelligence.clvAvgOrder"), align: "right", render: (r) => <span className="text-ivory num-lining">{fmt.money(r.average_order_value)}</span> },
    { header: t("admin.intelligence.clvFirst"), align: "left", render: (r) => <span className="text-muted whitespace-nowrap">{fmt.date(r.first_on)}</span> },
    { header: t("admin.intelligence.clvLast"), align: "left", render: (r) => <span className="text-muted whitespace-nowrap">{fmt.date(r.last_on)}</span> },
  ];

  return (
    <div className="space-y-6 pb-10">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl text-ivory tracking-wide">{t("admin.intelligence.title")}</h1>
        <p className="text-xs sm:text-sm text-muted font-light max-w-3xl">{t("admin.intelligence.subtitle")}</p>
        <nav aria-label={t("admin.intelligence.title")} className="flex flex-wrap gap-2 pt-1">
          {SECTION_ORDER.map((section) => (
            <a
              key={section.id}
              href={`#phase9-${section.id}`}
              className="inline-flex items-center gap-1.5 rounded border border-gold/20 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[1.4px] text-muted hover:text-ivory hover:border-gold/45 transition-colors"
            >
              <section.icon className="w-3.5 h-3.5 text-gold" />
              {t(section.labelKey)}
            </a>
          ))}
        </nav>
      </header>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        windowDays={windowDays}
        onWindowChange={setWindowDays}
        countries={countries}
      />

      {/* 9.3 Repeat purchase rate */}
      <section id="phase9-repeat" className="scroll-mt-24">
        <Panel
          id="repeat"
          title={t("admin.intelligence.repeatTitle")}
          subtitle={t("admin.intelligence.repeatSubtitle")}
          status={repeat.data?.data_status}
        >
          {repeat.loading && !repeat.data ? <LoadingPanel label={t("admin.intelligence.loading")} /> : null}
          {repeat.error ? <ErrorPanel message={t("admin.intelligence.loadFailed")} onRetry={repeat.reload} /> : null}
          {repeat.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label={t("admin.intelligence.repeatRate")} value={fmt.percent(repeat.data.rate_percent)} />
                <Stat label={t("admin.intelligence.buyers")} value={fmt.number(repeat.data.buyers)} />
                <Stat label={t("admin.intelligence.repeatBuyers")} value={fmt.number(repeat.data.repeat_buyers)} />
                <Stat
                  label={t("admin.intelligence.averagePurchases")}
                  value={repeat.data.average_purchases_per_buyer === null ? "—" : fmt.number(repeat.data.average_purchases_per_buyer, 2)}
                />
              </div>
              {repeat.data.data_status === "insufficient_data" ? (
                <DataGap status={repeat.data.data_status} note={t("admin.intelligence.explainInsufficient")} />
              ) : null}
            </div>
          ) : null}
        </Panel>
      </section>

      {/* 9.1 Cohort analysis */}
      <section id="phase9-cohort" className="scroll-mt-24">
        <Panel
          id="cohort"
          title={t("admin.intelligence.cohortTitle")}
          subtitle={t("admin.intelligence.cohortSubtitle")}
          status={cohort.data?.data_status}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGranularity("month")}
                aria-pressed={granularity === "month"}
                className={`px-3 py-1.5 rounded border text-[10px] font-mono uppercase tracking-[1.4px] ${granularity === "month" ? "border-gold/60 bg-gold/10 text-gold" : "border-gold/20 text-muted hover:text-ivory"}`}
              >
                {t("admin.intelligence.cohortMonthly")}
              </button>
              <button
                type="button"
                onClick={() => setGranularity("quarter")}
                aria-pressed={granularity === "quarter"}
                className={`px-3 py-1.5 rounded border text-[10px] font-mono uppercase tracking-[1.4px] ${granularity === "quarter" ? "border-gold/60 bg-gold/10 text-gold" : "border-gold/20 text-muted hover:text-ivory"}`}
              >
                {t("admin.intelligence.cohortQuarterly")}
              </button>
            </div>
          }
        >
          {cohort.loading && !cohort.data ? <LoadingPanel label={t("admin.intelligence.loading")} /> : null}
          {cohort.error ? <ErrorPanel message={t("admin.intelligence.loadFailed")} onRetry={cohort.reload} /> : null}
          {cohort.data ? (
            <div className="space-y-4">
              {cohort.data.data_status === "insufficient_data" && !cohort.data.cohorts.length ? (
                <DataGap status="insufficient_data" note={t("admin.intelligence.explainInsufficient")} />
              ) : null}
              {cohort.data.cohorts.length ? (
                <div className="relative overflow-x-auto border border-gold/20 rounded-lg bg-navy/40">
                  <table className="w-full min-w-[520px] text-start text-xs font-sans">
                    <caption className="sr-only">{t("admin.intelligence.cohortCaption")}</caption>
                    <thead className="sticky top-0 bg-navy text-gold uppercase tracking-[1.5px] text-[10px] border-b border-gold/15">
                      <tr>
                        <th scope="col" className="px-3 py-2.5 text-start whitespace-nowrap">{t("admin.intelligence.cohortColumn")}</th>
                        <th scope="col" className="px-3 py-2.5 text-end whitespace-nowrap">{t("admin.intelligence.buyers")}</th>
                        {Array.from({ length: maxStep + 1 }, (_, step) => (
                          <th key={step} scope="col" className="px-2 py-2.5 text-end whitespace-nowrap font-mono">
                            {t("admin.intelligence.monthOffset", { count: step })}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold/10 text-ivory num-lining">
                      {cohort.data.cohorts.map((row) => (
                        <tr key={row.cohort} className="hover:bg-navy/60">
                          <th scope="row" className="px-3 py-2.5 text-start font-sans font-normal whitespace-nowrap">
                            {row.cohort}
                            {!row.reliable ? (
                              <span className="ms-2 text-[9px] font-mono uppercase tracking-[1.2px] text-muted" title={t("admin.intelligence.cohortSmall")}>
                                {t("admin.intelligence.cohortUnreliable")}
                              </span>
                            ) : null}
                          </th>
                          <td className="px-3 py-2.5 text-end text-gold">{fmt.number(row.buyers)}</td>
                          {Array.from({ length: maxStep + 1 }, (_, step) => {
                            const cell = row.cells.find((c) => c.step === step);
                            return (
                              <td key={step} className="px-2 py-2.5 text-end whitespace-nowrap">
                                {cell ? (
                                  <span
                                    className="text-ivory"
                                    title={`${fmt.number(cell.retained)} · ${fmt.money(cell.revenue)}`}
                                  >
                                    {fmt.percent(cell.rate)}
                                  </span>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {cohort.data.dimensions?.length ? (
                <ul className="space-y-1.5">
                  {cohort.data.dimensions.map((dimension) => (
                    <li key={dimension.key} className="flex flex-wrap items-center gap-2 text-[11px] text-muted font-light">
                      <MetricStatus status={dimension.data_status} />
                      <span className="capitalize">{dimension.key.replace(/_/g, " ")}</span>
                      {DIMENSION_NOTE_KEYS[dimension.key] ? <span className="basis-full sm:basis-auto">— {t(DIMENSION_NOTE_KEYS[dimension.key])}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </Panel>
      </section>

      {/* 9.2 Customer lifetime value */}
      <section id="phase9-clv" className="scroll-mt-24">
        <Panel
          id="clv"
          title={t("admin.intelligence.clvTitle")}
          subtitle={t("admin.intelligence.clvSubtitle")}
          status={clv.data?.data_status}
        >
          {clv.loading && !clv.data ? <LoadingPanel label={t("admin.intelligence.loading")} /> : null}
          {clv.error ? <ErrorPanel message={t("admin.intelligence.loadFailed")} onRetry={clv.reload} /> : null}
          {clv.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label={t("admin.intelligence.clvMean")} value={fmt.money(clv.data.mean_lifetime_revenue)} />
                <Stat label={t("admin.intelligence.clvMedian")} value={fmt.money(clv.data.median_lifetime_revenue)} />
                <Stat label={t("admin.intelligence.clvTotal")} value={fmt.money(clv.data.total_net_revenue)} />
                <Stat label={t("admin.intelligence.clvCustomers")} value={fmt.number(clv.data.customers)} />
              </div>
              <DataGap
                status={clv.data.cost_basis.data_status === "configured" ? "calculated" : "not_configured"}
                note={
                  clv.data.cost_basis.data_status === "configured"
                    ? t("admin.intelligence.clvCostPartial", {
                        costed: clv.data.cost_basis.variants_costed,
                        total: clv.data.cost_basis.variants_total,
                      })
                    : t("admin.intelligence.clvCostMissing", { total: clv.data.cost_basis.variants_total })
                }
              />
              {clv.data.data_status === "insufficient_data" ? (
                <DataGap status="insufficient_data" note={t("admin.intelligence.clvFewBuyers", { count: clv.data.customers })} />
              ) : null}
              <AnalyticsBreakdownTable
                sectionId="clv-customers"
                title={t("admin.intelligence.clvTop")}
                rows={clv.data.customers_list}
                columns={clvColumns}
                rowKey={(row) => row.customer_id || row.first_on || String(Math.random())}
                emptyMessage={t("admin.intelligence.clvEmpty")}
              />
            </div>
          ) : null}
        </Panel>
      </section>

      {/* 9.4 Conversion funnel */}
      <section id="phase9-funnel" className="scroll-mt-24">
        <Panel
          id="funnel"
          title={t("admin.intelligence.funnelTitle")}
          subtitle={t("admin.intelligence.funnelSubtitle")}
          status={funnel.data?.data_status}
        >
          {funnel.loading && !funnel.data ? <LoadingPanel label={t("admin.intelligence.loading")} /> : null}
          {funnel.error ? <ErrorPanel message={t("admin.intelligence.loadFailed")} onRetry={funnel.reload} /> : null}
          {funnel.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Stat
                  label={t("admin.intelligence.funnelCaptureStarted")}
                  value={funnel.data.capture_started_at ? fmt.dateTime(funnel.data.capture_started_at) : t("admin.intelligence.funnelNotStarted")}
                />
                <Stat label={t("admin.intelligence.funnelPurchases")} value={fmt.number(funnel.data.purchases_in_window)} />
                <Stat
                  label={t("admin.intelligence.funnelVisitToPurchase")}
                  value={fmt.percent(funnel.data.visit_to_purchase_percent)}
                />
              </div>
              <ol className="space-y-2">
                {funnel.data.stages.map((stage, index, all) => {
                  const previous = all[index - 1];
                  const step =
                    stage.sessions !== null && previous && previous.sessions !== null && previous.sessions > 0
                      ? (stage.sessions / previous.sessions) * 100
                      : null;
                  return (
                    <li
                      key={stage.key}
                      data-stage={stage.key}
                      data-sessions={stage.sessions === null ? "" : String(stage.sessions)}
                      className="rounded-lg border border-gold/15 bg-navy/50 p-3 sm:p-4 flex flex-wrap items-center gap-x-4 gap-y-2"
                    >
                      <span className="text-[10px] font-mono uppercase tracking-[1.5px] text-gold w-6 shrink-0 num-lining">
                        {stage.seq}
                      </span>
                      <span className="min-w-0 flex-1 text-xs text-ivory">{t(STAGE_KEYS[stage.key] || "admin.intelligence.stageVisit")}</span>
                      <MetricStatus status={stage.data_status} />
                      <span className="text-sm font-serif text-gold num-lining min-w-[4.5rem] text-end">
                        {stage.sessions === null ? "—" : fmt.number(stage.sessions)}
                      </span>
                      <span className="text-[10px] text-muted font-mono uppercase tracking-[1.2px] min-w-[5rem] text-end">
                        {step === null ? "—" : fmt.percent(step)}
                      </span>
                      {stage.stored_records !== null ? (
                        <span className="basis-full text-[10px] text-muted font-light sm:basis-auto">
                          {t("admin.intelligence.funnelStored", { source: stage.stored_source || "", records: stage.stored_records })}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
              {funnel.data.data_status === "not_tracked" ? (
                <DataGap status="not_tracked" note={t("admin.intelligence.funnelNotTrackedNote")} />
              ) : null}
            </div>
          ) : null}
        </Panel>
      </section>

      {/* 9.8 Marketing attribution */}
      <section id="phase9-attribution" className="scroll-mt-24">
        <Panel
          id="attribution"
          title={t("admin.intelligence.attrTitle")}
          subtitle={t("admin.intelligence.attrSubtitle")}
          status={attribution.data?.data_status}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModel("first_touch")}
                aria-pressed={model === "first_touch"}
                className={`px-3 py-1.5 rounded border text-[10px] font-mono uppercase tracking-[1.4px] ${model === "first_touch" ? "border-gold/60 bg-gold/10 text-gold" : "border-gold/20 text-muted hover:text-ivory"}`}
              >
                {t("admin.intelligence.attrFirstTouch")}
              </button>
              <button
                type="button"
                onClick={() => setModel("last_touch")}
                aria-pressed={model === "last_touch"}
                className={`px-3 py-1.5 rounded border text-[10px] font-mono uppercase tracking-[1.4px] ${model === "last_touch" ? "border-gold/60 bg-gold/10 text-gold" : "border-gold/20 text-muted hover:text-ivory"}`}
              >
                {t("admin.intelligence.attrLastTouch")}
              </button>
            </div>
          }
        >
          {attribution.loading && !attribution.data ? <LoadingPanel label={t("admin.intelligence.loading")} /> : null}
          {attribution.error ? <ErrorPanel message={t("admin.intelligence.loadFailed")} onRetry={attribution.reload} /> : null}
          {attribution.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label={t("admin.intelligence.attrPurchases")} value={fmt.number(attribution.data.purchases_in_window)} />
                <Stat label={t("admin.intelligence.attrAttributed")} value={fmt.number(attribution.data.attributed_purchases)} />
                <Stat label={t("admin.intelligence.attrCoverage")} value={fmt.percent(attribution.data.coverage_percent)} />
                <Stat
                  label={t("admin.intelligence.attrCaptureStarted")}
                  value={attribution.data.capture_started_at ? fmt.dateTime(attribution.data.capture_started_at) : t("admin.intelligence.funnelNotStarted")}
                />
              </div>
              <AnalyticsBreakdownTable
                sectionId="attribution-channels"
                title={t("admin.intelligence.attrChannels")}
                rows={attribution.data.channels}
                columns={repeatColumns}
                rowKey={(row) => `${row.source}|${row.medium}|${row.campaign}`}
                emptyMessage={t("admin.intelligence.attrNoChannels")}
              />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <MiniList
                  title={t("admin.intelligence.attrLanding")}
                  rows={attribution.data.landing_pages.map((l) => ({ label: l.path, value: fmt.number(l.visits) }))}
                  empty={t("admin.intelligence.attrNothingYet")}
                />
                <MiniList
                  title={t("admin.intelligence.attrReferrers")}
                  rows={attribution.data.referrers.map((r) => ({ label: r.host, value: fmt.number(r.visits) }))}
                  empty={t("admin.intelligence.attrNothingYet")}
                />
                <MiniList
                  title={t("admin.intelligence.attrCoupons")}
                  rows={attribution.data.coupon_attribution.map((c) => ({
                    label: c.code,
                    value: `${fmt.number(c.purchases)} · ${fmt.money(c.revenue)}`,
                  }))}
                  empty={t("admin.intelligence.attrNoCoupons")}
                />
              </div>
              <MiniList
                title={t("admin.intelligence.attrCampaigns")}
                rows={attribution.data.campaign_records.map((c) => ({
                  label: c.name || "—",
                  value: `${c.status} · ${fmt.number(c.sent)}`,
                }))}
                empty={t("admin.intelligence.attrNoCampaigns")}
              />
              {attribution.data.data_status === "not_tracked" ? (
                <DataGap status="not_tracked" note={t("admin.intelligence.attrNotTrackedNote")} />
              ) : null}
            </div>
          ) : null}
        </Panel>
      </section>

      {/* 9.9 Segmentation */}
      <section id="phase9-segments" className="scroll-mt-24">
        <Panel
          id="segments"
          title={t("admin.intelligence.segTitle")}
          subtitle={t("admin.intelligence.segSubtitle")}
          status={segments.data?.data_status}
        >
          {segments.loading && !segments.data ? <LoadingPanel label={t("admin.intelligence.loading")} /> : null}
          {segments.error ? <ErrorPanel message={t("admin.intelligence.loadFailed")} onRetry={segments.reload} /> : null}
          {segments.data ? (
            <div className="space-y-3">
              {segments.data.segments.map((segment) => (
                <div key={segment.key} className="rounded-lg border border-gold/15 bg-navy/50 p-3 sm:p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <Users className="w-3.5 h-3.5 text-gold shrink-0" />
                    <h4 className="font-serif text-sm text-ivory tracking-wide min-w-0 flex-1">
                      {t(SEGMENT_KEYS[segment.key] || "admin.intelligence.title")}
                    </h4>
                    <MetricStatus status={segment.data_status} />
                    <span className="text-sm font-serif text-gold num-lining">
                      {typeof segment.customers === "number" ? fmt.number(segment.customers) : fmt.number(segment.customers.length)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted font-light">{t(SEGMENT_RULE_KEYS[segment.key] || "admin.intelligence.segSubtitle")}</p>
                  {segment.key === "vip" ? <p className="text-[11px] text-ivory/70 font-light">{t("admin.intelligence.segVipNote")}</p> : null}
                  {Array.isArray(segment.customers) ? (
                    <ul className="flex flex-wrap gap-2 pt-1">
                      {segment.customers.length ? (
                        segment.customers.map((entry) => (
                          <li
                            key={entry.value}
                            className="rounded border border-gold/20 bg-navy px-2 py-1 text-[10px] font-mono uppercase tracking-[1.2px] text-muted"
                          >
                            <span className="text-ivory">{entry.value}</span> · {fmt.number(entry.customers)}
                          </li>
                        ))
                      ) : (
                        <li className="text-[11px] text-muted font-light">{t("admin.intelligence.segEmpty")}</li>
                      )}
                    </ul>
                  ) : null}
                  {segment.tiers ? (
                    <ul className="flex flex-wrap gap-2 pt-1">
                      {segment.tiers.map((tier) => (
                        <li key={tier.code} className="text-[10px] font-mono uppercase tracking-[1.2px] text-muted">
                          {tier.code}
                          {tier.min_lifetime_spend === null && tier.min_points === null
                            ? ` ${t("admin.intelligence.segThresholdUnset")}`
                            : ` ${fmt.money(tier.min_lifetime_spend ?? 0)}`}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </Panel>
      </section>

      {repeat.error || cohort.error || clv.error || funnel.error || attribution.error || segments.error ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={reloadAll}
            className="px-3 py-1.5 rounded border border-gold/30 text-[10px] font-mono uppercase tracking-[1.5px] text-muted hover:text-ivory hover:border-gold/60 transition-colors"
          >
            {t("admin.intelligence.retryAll")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-gold/15 bg-navy/50 p-3 min-w-0">
    <p className="text-[10px] font-mono uppercase tracking-[1.5px] text-gold truncate" title={label}>
      {label}
    </p>
    <p className="font-serif text-lg sm:text-xl text-ivory num-lining mt-1 break-words">{value}</p>
  </div>
);

const MiniList: React.FC<{ title: string; rows: { label: string; value: string }[]; empty: string }> = ({
  title,
  rows,
  empty,
}) => (
  <div className="rounded-lg border border-gold/15 bg-navy/50 p-3 min-w-0">
    <h4 className="text-[10px] font-mono uppercase tracking-[1.5px] text-gold truncate" title={title}>
      {title}
    </h4>
    {rows.length ? (
      <ul className="mt-2 space-y-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-baseline justify-between gap-3 text-[11px] min-w-0">
            <span className="text-ivory truncate" title={row.label}>
              {row.label}
            </span>
            <span className="text-muted num-lining shrink-0">{row.value}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-2 text-[11px] text-muted font-light">{empty}</p>
    )}
  </div>
);

export default IntelligencePage;
