import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Boxes,
  DollarSign,
  Loader2,
  Package,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ChartCard, type ChartPoint } from "../components/ChartCard";
import {
  AnalyticsBreakdownTable,
  type BreakdownColumn,
} from "../components/AnalyticsBreakdownTable";
import { StatCard } from "../components/StatCard";
import { fetchAnalyticsFromDB, type AnalyticsSnapshot } from "../../services/adminOps";
import { formatPKR } from "../../utils/currency";
import { useI18n } from "../../i18n/I18nProvider";

/* ------------------------------------------------------------------ *
 * Window selector + formatting helpers
 * ------------------------------------------------------------------ */

const WINDOWS = [30, 90, 365] as const;
type WindowDays = (typeof WINDOWS)[number];

const DAY_MS = 86_400_000;
const MONTHS = [
"Jan", "Feb", "Mar", "Apr", "May", "Jun",
"Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Shared currency helper — renders e.g. "Rs 12,400". */
const money = (n: number) => formatPKR(n);
const whole = (n: number) => Math.round(n).toLocaleString("en-US");

function parseIsoDay(iso: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function dayLabel(ts: number): string {
  const d = new Date(ts);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

function monthLabel(ym: string): string {
  const ts = parseIsoDay(`${ym}-01`);
  if (ts === null) return ym || "—";
  const d = new Date(ts);
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
}

/** Chart ticks stay short; the full value is always in the data table. */
function clip(text: string, max = 12): string {
  const clean = (text || "").trim();
  if (!clean) return "—";
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

interface WeeklyBucket {
  startTs: number;
  revenue: number;
  orders: number;
}

/**
 * Aggregates the RPC's daily rows into 7-day buckets so a 90-point series stays
 * readable. Days outside the requested window are dropped, and empty weeks
 * between the first and last populated week are filled with true zeros.
 */
function toWeeklyBuckets(
  trend: AnalyticsSnapshot["salesTrend"],
  windowDays: number
): { buckets: WeeklyBucket[]; from: number | null; to: number | null } {
  const todayUtc = Math.floor(Date.now() / DAY_MS) * DAY_MS;
  const windowStart = todayUtc - (windowDays - 1) * DAY_MS;

  const rows: { ts: number; revenue: number; orders: number }[] = [];
  for (const row of trend) {
    const ts = parseIsoDay(row.day);
    if (ts !== null && ts >= windowStart) {
      rows.push({ ts, revenue: row.revenue, orders: row.orders });
    }
  }
  if (rows.length === 0) return { buckets: [], from: null, to: null };

  const totals = new Map<number, WeeklyBucket>();
  for (const row of rows) {
    const startTs = windowStart + Math.floor((row.ts - windowStart) / (7 * DAY_MS)) * 7 * DAY_MS;
    const bucket = totals.get(startTs) ?? { startTs, revenue: 0, orders: 0 };
    bucket.revenue += row.revenue;
    bucket.orders += row.orders;
    totals.set(startTs, bucket);
  }

  const firstTs = Math.min(...totals.keys());
  const lastTs = Math.max(...totals.keys());
  const buckets: WeeklyBucket[] = [];
  for (let ts = firstTs; ts <= lastTs; ts += 7 * DAY_MS) {
    buckets.push(totals.get(ts) ?? { startTs: ts, revenue: 0, orders: 0 });
  }
  return { buckets, from: firstTs, to: lastTs };
}

function snapshotHasData(s: AnalyticsSnapshot): boolean {
  const alerts = s.inventoryAlerts;
  return (
    s.totals.orders > 0 ||
    s.totals.customers > 0 ||
    s.totals.unitsSold > 0 ||
    s.refunds.records > 0 ||
    s.cancellations.cancelledOrders > 0 ||
    s.cancellations.returnedOrders > 0 ||
    s.salesTrend.length > 0 ||
    s.topProducts.length > 0 ||
    s.topSizes.length > 0 ||
    s.orderStatusDistribution.length > 0 ||
    s.paymentMethodDistribution.length > 0 ||
    s.paymentStatusDistribution.length > 0 ||
    s.customerGrowth.length > 0 ||
    s.couponPerformance.length > 0 ||
    alerts.outOfStock + alerts.lowStock + alerts.inactive > 0
  );
}

/* ------------------------------------------------------------------ *
 * Local presentational helpers (brand card vocabulary only)
 * ------------------------------------------------------------------ */

const SkeletonPanel: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    aria-hidden="true"
    className={`bg-navy2/80 border border-gold/20 rounded-lg p-5 shadow-xl animate-pulse ${className}`}
  >
    <div className="h-2.5 w-1/3 bg-gold/15 rounded" />
    <div className="mt-4 h-7 w-2/3 bg-gold/10 rounded" />
    <div className="mt-5 h-2 w-full bg-gold/10 rounded" />
    <div className="mt-2 h-2 w-4/5 bg-gold/10 rounded" />
    <div className="mt-2 h-2 w-3/5 bg-gold/10 rounded" />
  </div>
);

interface DetailRow {
  label: string;
  value: string;
}

const DetailPanel: React.FC<{
  /** Stable ASCII id: the heading anchor cannot be derived from a translated title. */
  id: string;
  title: string;
  note: string;
  icon: LucideIcon;
  rows: DetailRow[];
}> = ({ id, title, note, icon: Icon, rows }) => {
  const headingId = `detail-${id}`;
  return (
    <section
      aria-labelledby={headingId}
      className="bg-navy2/90 border border-gold/20 rounded-lg p-5 shadow-xl min-w-0"
    >
      <div className="flex items-center justify-between gap-3 border-b border-gold/15 pb-3">
        <h3 id={headingId} className="font-serif text-base font-bold text-ivory tracking-wide">
          {title}
        </h3>
        <span className="p-1.5 rounded bg-gold/10 text-gold shrink-0">
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <dl className="mt-3 space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-[11px] text-muted font-light">{row.label}</dt>
            <dd className="text-xs font-mono text-ivory num-lining text-end whitespace-nowrap">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[10px] text-muted/80 font-light leading-relaxed">{note}</p>
    </section>
  );
};

const SectionHeading: React.FC<{ id: string; title: string; note: string }> = ({
  id,
  title,
  note,
}) => (
  <div className="border-b border-gold/15 pb-2">
    <h2 id={id} className="font-serif text-lg font-bold text-ivory tracking-wide">
      {title}
    </h2>
    <p className="text-[11px] text-muted font-light mt-0.5 max-w-prose">{note}</p>
  </div>
);

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export const AnalyticsPage: React.FC = () => {
  const { t } = useI18n();
  const [days, setDays] = useState<WindowDays>(30);
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  /**
   * Copy is stored as a dictionary key so a language change re-renders it; the raw server
   * message is kept separately because it is data, not UI text.
   */
  const [failure, setFailure] = useState<{ key: string; detail: string | null } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    setStatus("loading");
    setFailure(null);

    fetchAnalyticsFromDB(days)
      .then((result) => {
        if (!mounted) return;
        if (!result) {
          setSnapshot(null);
          setFailure({ key: "admin.analytics.noResultMessage", detail: null });
          setStatus("error");
          return;
        }
        setSnapshot(result);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        setSnapshot(null);
        setFailure({
          key: "admin.analytics.unexpectedError",
          detail: error instanceof Error ? error.message : null,
        });
        setStatus("error");
      });

    return () => {
      mounted = false;
    };
  }, [days, attempt]);

  const view = useMemo(() => {
    if (status !== "ready" || !snapshot || !snapshotHasData(snapshot)) return null;
    const s = snapshot;
    const weekly = toWeeklyBuckets(s.salesTrend, s.windowDays || days);

    const trendRevenue: ChartPoint[] = weekly.buckets.map((b) => ({
      label: dayLabel(b.startTs),
      value: b.revenue,
    }));
    const trendOrders: ChartPoint[] = weekly.buckets.map((b) => ({
      label: dayLabel(b.startTs),
      value: b.orders,
    }));

    return {
      s,
      netRevenue: s.totals.grossRevenue - s.refunds.processedAmount,
      alertTotal:
        s.inventoryAlerts.outOfStock + s.inventoryAlerts.lowStock + s.inventoryAlerts.inactive,
      rangeText:
        weekly.from !== null && weekly.to !== null
          ? `${dayLabel(weekly.from)} – ${dayLabel(weekly.to)}`
          : null,
      trendRevenue,
      trendOrders,
      growthPoints: s.customerGrowth.map((g) => ({
        label: monthLabel(g.month),
        value: g.signups,
      })),
      productPoints: s.topProducts.map((p) => ({ label: clip(p.name), value: p.revenue })),
      sizePoints: s.topSizes.map((z) => ({ label: clip(z.size, 8), value: z.units })),
      sizeRevenue: s.topSizes.map((z) => ({ label: clip(z.size, 8), value: z.revenue })),
      statusPoints: s.orderStatusDistribution.map((r) => ({
        label: clip(r.status, 10),
        value: r.count,
      })),
      methodPoints: s.paymentMethodDistribution.map((r) => ({
        label: clip(r.method, 10),
        value: r.value,
      })),
      methodCounts: s.paymentMethodDistribution.map((r) => ({
        label: clip(r.method, 10),
        value: r.count,
      })),
      payStatusPoints: s.paymentStatusDistribution.map((r) => ({
        label: clip(r.status, 10),
        value: r.count,
      })),
      payStatusValues: s.paymentStatusDistribution.map((r) => ({
        label: clip(r.status, 10),
        value: r.value,
      })),
      couponPoints: s.couponPerformance.map((c) => ({ label: clip(c.code, 10), value: c.uses })),
      couponDiscounts: s.couponPerformance.map((c) => ({
        label: clip(c.code, 10),
        value: c.discountGiven,
      })),
      couponTracked: s.couponPerformance.reduce((sum, c) => sum + c.uses, 0),
    };
  }, [status, snapshot, days]);

  /** English has one plural form; every other language needs its own noun per count. */
  const countPhrase = (count: number, oneKey: string, manyKey: string) =>
    t(count === 1 ? oneKey : manyKey, { count });

  const productColumns: BreakdownColumn<AnalyticsSnapshot["topProducts"][number]>[] = [
    {
      header: t("admin.analytics.rank"),
      render: (_row, index) => (
        <span className="font-mono text-gold font-bold">#{index + 1}</span>
      ),
    },
    {
      header: t("admin.analytics.product"),
      render: (row) => (
        <span className="font-serif font-bold text-sm text-ivory">{row.name || "—"}</span>
      ),
    },
    {
      header: t("admin.analytics.units"),
      align: "right",
      render: (row) => <span className="font-mono num-lining">{whole(row.units)}</span>,
    },
    {
      header: t("admin.analytics.orders"),
      align: "right",
      render: (row) => <span className="font-mono num-lining">{whole(row.orders)}</span>,
    },
    {
      header: t("admin.analytics.revenue"),
      align: "right",
      render: (row) => <span className="font-mono num-lining text-gold">{money(row.revenue)}</span>,
    },
  ];

  const couponColumns: BreakdownColumn<AnalyticsSnapshot["couponPerformance"][number]>[] = [
    {
      header: t("admin.analytics.code"),
      render: (row) => (
        <span className="font-mono text-[11px] font-bold text-gold uppercase">
          {row.code || "—"}
        </span>
      ),
    },
    {
      header: t("admin.shared.status"),
      render: (row) => (
        <span
          className={`text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded border ${
            row.status === "active"
              ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
              : "bg-navy/60 text-muted border-gold/20"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: t("admin.analytics.uses"),
      align: "right",
      render: (row) => <span className="font-mono num-lining">{whole(row.uses)}</span>,
    },
    {
      header: t("admin.analytics.discountGivenHeader"),
      align: "right",
      render: (row) => (
        <span className="font-mono num-lining text-gold">{money(row.discountGiven)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans min-w-0">
      {/* Header + window selector */}
      <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 border-b border-gold/20 pb-4">
        <div className="min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            {t("admin.analytics.eyebrow")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.analytics.pageTitle")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5 max-w-prose">
            {t("admin.analytics.pageIntro")}
          </p>
        </div>

        <div className="shrink-0">
          <span
            id="analytics-window-label"
            className="block text-[10px] font-mono uppercase tracking-[2px] text-gold font-semibold mb-2"
          >
            {t("admin.analytics.reportingWindow")}
          </span>
          <div
            role="group"
            aria-labelledby="analytics-window-label"
            className="inline-flex items-center gap-1 bg-navy/80 p-1 rounded border border-gold/20"
          >
            {WINDOWS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDays(value)}
                aria-pressed={days === value}
                className={`px-3 py-1.5 rounded text-[11px] font-sans transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                  days === value
                    ? "bg-gold text-navy font-semibold shadow"
                    : "text-muted hover:text-ivory"
                }`}
              >
                {value === 365
                  ? t("admin.analytics.windowMonths")
                  : t("admin.analytics.windowDays", { count: value })}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted font-light mt-2 max-w-[18rem] leading-relaxed">
            {t("admin.analytics.windowHint")}
          </p>
        </div>
      </header>

      {/* Loading */}
      {status === "loading" && (
        <div className="space-y-6">
          <p role="status" className="flex items-center gap-2 text-xs text-muted">
            <Loader2 className="w-4 h-4 text-gold animate-spin" aria-hidden="true" />
            {days === 365
              ? t("admin.analytics.loadingMonths")
              : t("admin.analytics.loadingDays", { count: days })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonPanel key={i} className="h-36" />
            ))}
          </div>
          <SkeletonPanel className="h-56" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SkeletonPanel className="h-48" />
            <SkeletonPanel className="h-48" />
            <SkeletonPanel className="h-48" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonPanel className="h-64" />
            <SkeletonPanel className="h-64" />
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div
          role="alert"
          className="bg-navy2/90 border border-gold/25 rounded-lg p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5"
        >
          <div className="flex items-start gap-3 min-w-0">
            <AlertTriangle className="w-5 h-5 text-gold shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-serif text-lg font-bold text-ivory tracking-wide">
                {t("admin.analytics.unavailableTitle")}
              </h2>
              <p className="text-xs text-muted font-light mt-1 max-w-prose">
                {failure
                  ? failure.detail ?? t(failure.key)
                  : t("admin.analytics.unexpectedError")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded border border-gold/40 text-[11px] font-mono uppercase tracking-[1.5px] text-gold hover:bg-gold hover:text-navy focus:outline-none focus-visible:ring-1 focus-visible:ring-goldLight transition-colors shrink-0"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            {t("admin.analytics.retryRequest")}
          </button>
        </div>
      )}

      {/* Honest empty state */}
      {status === "ready" && !view && (
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-10 text-center shadow-xl">
          <div className="p-3 rounded-full bg-navy border border-gold/20 text-gold inline-flex mb-3">
            <Boxes className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="font-serif text-lg text-ivory font-bold">{t("admin.analytics.emptyTitle")}</h2>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto font-light">
            {t("admin.analytics.emptyBody", { days: snapshot?.windowDays ?? days })}
          </p>
        </div>
      )}

      {view && (
        <>
          {/* Revenue & volume KPIs */}
          <section aria-labelledby="kpis-heading" className="space-y-4">
            <SectionHeading
              id="kpis-heading"
              title={t("admin.analytics.revenueVolume")}
              note={t("admin.analytics.revenueVolumeNote", { days: view.s.windowDays })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <StatCard
                title={t("admin.analytics.netRevenue")}
                value={money(view.netRevenue)}
                subtitle={t("admin.analytics.netRevenueSubtitle", {
                  gross: money(view.s.totals.grossRevenue),
                  refunds: money(view.s.refunds.processedAmount),
                })}
                icon={DollarSign}
                accent={true}
              />
              <StatCard
                title={t("admin.analytics.orders")}
                value={whole(view.s.totals.orders)}
                subtitle={t("admin.analytics.ordersSubtitle")}
                icon={ShoppingCart}
              />
              <StatCard
                title={t("admin.analytics.customers")}
                value={whole(view.s.totals.customers)}
                subtitle={t("admin.analytics.customersSubtitle")}
                icon={Users}
              />
              <StatCard
                title={t("admin.analytics.averageOrderValue")}
                value={money(view.s.totals.averageOrderValue)}
                subtitle={t("admin.analytics.averageOrderValueSubtitle")}
                icon={TrendingUp}
              />
              <StatCard
                title={t("admin.analytics.unitsSold")}
                value={whole(view.s.totals.unitsSold)}
                subtitle={t("admin.analytics.unitsSoldSubtitle")}
                icon={Package}
              />
              <StatCard
                title={t("admin.refunds.refundRecords")}
                value={whole(view.s.refunds.records)}
                subtitle={t("admin.analytics.refundRecordsSubtitle", {
                  processed: money(view.s.refunds.processedAmount),
                  pending: money(view.s.refunds.pendingAmount),
                })}
                icon={RotateCcw}
              />
              <StatCard
                title={t("admin.dashboard.cancelledOrders")}
                value={whole(view.s.cancellations.cancelledOrders)}
                subtitle={t("admin.analytics.cancelledOrdersSubtitle", {
                  cancelled: money(view.s.cancellations.cancelledValue),
                  returned: whole(view.s.cancellations.returnedOrders),
                })}
                icon={Ban}
              />
              <StatCard
                title={t("admin.analytics.inventoryAlerts")}
                value={whole(view.alertTotal)}
                subtitle={t("admin.analytics.inventoryAlertsSubtitle", {
                  outOfStock: view.s.inventoryAlerts.outOfStock,
                  lowStock: view.s.inventoryAlerts.lowStock,
                  inactive: view.s.inventoryAlerts.inactive,
                })}
                icon={Boxes}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <DetailPanel
                id="refunds"
                title={t("admin.refunds.refundLedger")}
                icon={RotateCcw}
                note={t("admin.analytics.refundLedgerNote")}
                rows={[
                  { label: t("admin.analytics.refundRecordsLabel"), value: whole(view.s.refunds.records) },
                  { label: t("admin.analytics.processedAmount"), value: money(view.s.refunds.processedAmount) },
                  { label: t("admin.analytics.pendingAmount"), value: money(view.s.refunds.pendingAmount) },
                  { label: t("admin.analytics.rejectedOrFailed"), value: whole(view.s.refunds.rejectedOrFailed) },
                ]}
              />
              <DetailPanel
                id="cancellations"
                title={t("admin.analytics.cancellationsReturns")}
                icon={Ban}
                note={t("admin.analytics.cancellationsNote")}
                rows={[
                  { label: t("admin.analytics.cancelledOrdersLabel"), value: whole(view.s.cancellations.cancelledOrders) },
                  { label: t("admin.analytics.cancelledValue"), value: money(view.s.cancellations.cancelledValue) },
                  { label: t("admin.analytics.returnedOrders"), value: whole(view.s.cancellations.returnedOrders) },
                ]}
              />
              <DetailPanel
                id="inventory"
                title={t("admin.analytics.inventoryAlerts")}
                icon={Boxes}
                note={t("admin.analytics.inventoryAlertsNote")}
                rows={[
                  { label: t("common.outOfStock"), value: whole(view.s.inventoryAlerts.outOfStock) },
                  { label: t("admin.analytics.lowStockLabel"), value: whole(view.s.inventoryAlerts.lowStock) },
                  { label: t("admin.analytics.inactiveVariants"), value: whole(view.s.inventoryAlerts.inactive) },
                ]}
              />
            </div>
          </section>

          {/* Trends over time */}
          <section aria-labelledby="trends-heading" className="space-y-6">
            <SectionHeading
              id="trends-heading"
              title={t("admin.analytics.trendsOverTime")}
              note={t("admin.analytics.trendsNote")}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              <ChartCard
                title={t("admin.analytics.revenueOrderVolume")}
                subtitle={t("admin.analytics.weeklyBucketsSubtitle", {
                  range: view.rangeText ?? t("admin.analytics.noDatedOrderRows"),
                })}
                variant="line"
                points={view.trendRevenue}
                secondary={view.trendOrders}
                formatter={money}
                secondaryFormatter={whole}
                primaryLabel={t("admin.analytics.revenue")}
                secondaryLabel={t("admin.analytics.orders")}
                axisLabel={t("admin.analytics.weekStarting")}
                emptyMessage={t("admin.analytics.trendEmpty")}
                caption={t("admin.analytics.trendCaption")}
              />
              <ChartCard
                title={t("admin.analytics.customerGrowth")}
                subtitle={t("admin.analytics.customerGrowthSubtitle")}
                variant="line"
                points={view.growthPoints}
                formatter={whole}
                primaryLabel={t("admin.analytics.signups")}
                axisLabel={t("admin.analytics.month")}
                emptyMessage={t("admin.analytics.customerGrowthEmpty")}
                caption={t("admin.analytics.customerGrowthCaption")}
              />
            </div>
          </section>

          {/* Catalogue signals (window scoped) */}
          <section aria-labelledby="catalogue-heading" className="space-y-6">
            <SectionHeading
              id="catalogue-heading"
              title={t("admin.analytics.catalogueSignals")}
              note={t("admin.analytics.catalogueNote", { days: view.s.windowDays })}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              <ChartCard
                title={t("admin.analytics.topProducts")}
                subtitle={t("admin.analytics.topProductsSubtitle", { days: view.s.windowDays })}
                variant="bar"
                points={view.productPoints}
                formatter={money}
                primaryLabel={t("admin.analytics.revenue")}
                axisLabel={t("admin.analytics.product")}
                emptyMessage={t("admin.analytics.topProductsEmpty")}
                caption={t("admin.analytics.topProductsCaption")}
              />
              <ChartCard
                title={t("admin.analytics.topBottleSizes")}
                subtitle={t("admin.analytics.topBottleSizesSubtitle", { days: view.s.windowDays })}
                variant="bar"
                points={view.sizePoints}
                secondary={view.sizeRevenue}
                formatter={whole}
                secondaryFormatter={money}
                primaryLabel={t("admin.analytics.units")}
                secondaryLabel={t("admin.analytics.revenue")}
                axisLabel={t("admin.inventory.size")}
                emptyMessage={t("admin.analytics.topBottleSizesEmpty")}
                caption={t("admin.analytics.topBottleSizesCaption")}
              />
            </div>
            <div className="min-w-0">
              <AnalyticsBreakdownTable
                title={t("admin.analytics.topProductsDetail")}
                sectionId="top-products"
                subtitle={t("admin.analytics.topProductsDetailSubtitle", { days: view.s.windowDays })}
                caption={t("admin.analytics.topProductsDetailCaption")}
                rows={view.s.topProducts}
                columns={productColumns}
                rowKey={(row, index) => `${row.name}-${index}`}
                emptyMessage={t("admin.analytics.topProductsDetailEmpty")}
              />
            </div>
          </section>

          {/* Order & payment mix */}
          <section aria-labelledby="mix-heading" className="space-y-6">
            <SectionHeading
              id="mix-heading"
              title={t("admin.analytics.orderStatusMix")}
              note={t("admin.analytics.orderStatusMixNote")}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 min-w-0">
              <ChartCard
                title={t("admin.analytics.orderStatus")}
                subtitle={t("admin.analytics.orderStatusSubtitle")}
                variant="bar"
                points={view.statusPoints}
                formatter={whole}
                primaryLabel={t("admin.analytics.orders")}
                axisLabel={t("admin.shared.status")}
                emptyMessage={t("admin.analytics.orderStatusEmpty")}
                caption={t("admin.analytics.orderStatusCaption")}
              />
              <ChartCard
                title={t("admin.analytics.paymentMethod")}
                subtitle={t("admin.analytics.paymentMethodSubtitle")}
                variant="bar"
                points={view.methodPoints}
                secondary={view.methodCounts}
                formatter={money}
                secondaryFormatter={whole}
                primaryLabel={t("admin.analytics.revenue")}
                secondaryLabel={t("admin.analytics.orders")}
                axisLabel={t("admin.analytics.method")}
                emptyMessage={t("admin.analytics.paymentMethodEmpty")}
                caption={t("admin.analytics.paymentMethodCaption")}
              />
              <ChartCard
                title={t("admin.analytics.paymentStatus")}
                subtitle={t("admin.analytics.paymentStatusSubtitle")}
                variant="bar"
                points={view.payStatusPoints}
                secondary={view.payStatusValues}
                formatter={whole}
                secondaryFormatter={money}
                primaryLabel={t("admin.analytics.records")}
                secondaryLabel={t("admin.chartCard.value")}
                axisLabel={t("admin.shared.status")}
                emptyMessage={t("admin.analytics.paymentStatusEmpty")}
                caption={t("admin.analytics.paymentStatusCaption")}
              />
            </div>
          </section>

          {/* Promotions */}
          <section aria-labelledby="promotions-heading" className="space-y-6">
            <SectionHeading
              id="promotions-heading"
              title={t("admin.analytics.promotions")}
              note={t("admin.analytics.promotionsNote", {
                redemptions: countPhrase(
                  view.couponTracked,
                  "admin.analytics.redemptionOne",
                  "admin.analytics.redemptions"
                ),
                coupons: countPhrase(
                  view.s.couponPerformance.length,
                  "admin.analytics.couponOne",
                  "admin.analytics.coupons"
                ),
              })}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              <ChartCard
                title={t("admin.analytics.couponPerformance")}
                subtitle={t("admin.analytics.couponPerformanceSubtitle")}
                variant="bar"
                points={view.couponPoints}
                secondary={view.couponDiscounts}
                formatter={whole}
                secondaryFormatter={money}
                primaryLabel={t("admin.analytics.uses")}
                secondaryLabel={t("admin.analytics.discountGivenLabel")}
                axisLabel={t("admin.analytics.code")}
                emptyMessage={t("admin.analytics.couponEmpty")}
                caption={t("admin.analytics.couponPerformanceCaption")}
              />
              <AnalyticsBreakdownTable
                title={t("admin.analytics.couponDetail")}
                sectionId="coupons"
                subtitle={t("admin.analytics.couponDetailSubtitle")}
                caption={t("admin.analytics.couponDetailCaption")}
                rows={view.s.couponPerformance}
                columns={couponColumns}
                rowKey={(row, index) => `${row.code}-${index}`}
                emptyMessage={t("admin.analytics.couponEmpty")}
              />
            </div>
          </section>

          <p className="text-[10px] text-muted/80 font-light border-t border-gold/15 pt-4">
            {t("admin.analytics.footerNote")}
          </p>
        </>
      )}
    </div>
  );
};
