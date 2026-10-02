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
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

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
  title: string;
  note: string;
  icon: LucideIcon;
  rows: DetailRow[];
}> = ({ title, note, icon: Icon, rows }) => {
  const headingId = `detail-${title.replace(/[^A-Za-z0-9]/g, "").toLowerCase()}`;
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
            <dd className="text-xs font-mono text-ivory num-lining text-right whitespace-nowrap">
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
  const [days, setDays] = useState<WindowDays>(30);
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [failure, setFailure] = useState<string | null>(null);
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
          setFailure(
            "The analytics aggregation returned no result. This happens when the session is not a staff session or the RPC call failed."
          );
          setStatus("error");
          return;
        }
        setSnapshot(result);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        setSnapshot(null);
        setFailure(error instanceof Error ? error.message : "Unexpected error while loading analytics.");
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
          : "no dated order rows in this window",
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

  const productColumns: BreakdownColumn<AnalyticsSnapshot["topProducts"][number]>[] = [
    {
      header: "Rank",
      render: (_row, index) => (
        <span className="font-mono text-gold font-bold">#{index + 1}</span>
      ),
    },
    {
      header: "Product",
      render: (row) => (
        <span className="font-serif font-bold text-sm text-ivory">{row.name || "—"}</span>
      ),
    },
    {
      header: "Units",
      align: "right",
      render: (row) => <span className="font-mono num-lining">{whole(row.units)}</span>,
    },
    {
      header: "Orders",
      align: "right",
      render: (row) => <span className="font-mono num-lining">{whole(row.orders)}</span>,
    },
    {
      header: "Revenue",
      align: "right",
      render: (row) => <span className="font-mono num-lining text-gold">{money(row.revenue)}</span>,
    },
  ];

  const couponColumns: BreakdownColumn<AnalyticsSnapshot["couponPerformance"][number]>[] = [
    {
      header: "Code",
      render: (row) => (
        <span className="font-mono text-[11px] font-bold text-gold uppercase">
          {row.code || "—"}
        </span>
      ),
    },
    {
      header: "Status",
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
      header: "Uses",
      align: "right",
      render: (row) => <span className="font-mono num-lining">{whole(row.uses)}</span>,
    },
    {
      header: "Discount Given",
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
            Telemetry & Business Intelligence
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Boutique Performance & Revenue Analytics
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5 max-w-prose">
            Every figure is returned by the server-side aggregation RPC. Series, distributions and
            money values are read straight from the snapshot — no sample data and no estimated
            percentages.
          </p>
        </div>

        <div className="shrink-0">
          <span
            id="analytics-window-label"
            className="block text-[10px] font-mono uppercase tracking-[2px] text-gold font-semibold mb-2"
          >
            Reporting window
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
                {value === 365 ? "12 months" : `${value} days`}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted font-light mt-2 max-w-[18rem] leading-relaxed">
            The window is applied by the aggregation to top products and bottle sizes, and is used
            to slice the daily trend. Lifetime panels carry their own scope label.
          </p>
        </div>
      </header>

      {/* Loading */}
      {status === "loading" && (
        <div className="space-y-6">
          <p role="status" className="flex items-center gap-2 text-xs text-muted">
            <Loader2 className="w-4 h-4 text-gold animate-spin" aria-hidden="true" />
            Querying the boutique analytics aggregation for {days === 365 ? "the last 12 months" : `the last ${days} days`}…
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
                Analytics unavailable
              </h2>
              <p className="text-xs text-muted font-light mt-1 max-w-prose">{failure}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded border border-gold/40 text-[11px] font-mono uppercase tracking-[1.5px] text-gold hover:bg-gold hover:text-navy focus:outline-none focus-visible:ring-1 focus-visible:ring-goldLight transition-colors shrink-0"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Retry request
          </button>
        </div>
      )}

      {/* Honest empty state */}
      {status === "ready" && !view && (
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-10 text-center shadow-xl">
          <div className="p-3 rounded-full bg-navy border border-gold/20 text-gold inline-flex mb-3">
            <Boxes className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="font-serif text-lg text-ivory font-bold">No telemetry yet</h2>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto font-light">
            The aggregation answered for the last {snapshot?.windowDays ?? days} days, but there is
            nothing to report yet: no orders, refunds, cancellations, signups, coupon usage or stock
            alerts. Numbers appear as soon as real activity is recorded.
          </p>
        </div>
      )}

      {view && (
        <>
          {/* Revenue & volume KPIs */}
          <section aria-labelledby="kpis-heading" className="space-y-4">
            <SectionHeading
              id="kpis-heading"
              title="Revenue & Volume"
              note={`Aggregation window reported by the server: ${view.s.windowDays} days. Totals exclude cancelled orders; cancelled and returned rows are reported separately below.`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <StatCard
                title="Net Revenue"
                value={money(view.netRevenue)}
                subtitle={`${money(view.s.totals.grossRevenue)} gross less ${money(view.s.refunds.processedAmount)} processed refunds`}
                icon={DollarSign}
                accent={true}
              />
              <StatCard
                title="Orders"
                value={whole(view.s.totals.orders)}
                subtitle="Non-cancelled order rows"
                icon={ShoppingCart}
              />
              <StatCard
                title="Customers"
                value={whole(view.s.totals.customers)}
                subtitle="Distinct order emails on record"
                icon={Users}
              />
              <StatCard
                title="Average Order Value"
                value={money(view.s.totals.averageOrderValue)}
                subtitle="Mean order total, cancellations excluded"
                icon={TrendingUp}
              />
              <StatCard
                title="Units Sold"
                value={whole(view.s.totals.unitsSold)}
                subtitle="Bottles across non-cancelled orders"
                icon={Package}
              />
              <StatCard
                title="Refund Records"
                value={whole(view.s.refunds.records)}
                subtitle={`${money(view.s.refunds.processedAmount)} processed · ${money(view.s.refunds.pendingAmount)} pending`}
                icon={RotateCcw}
              />
              <StatCard
                title="Cancelled Orders"
                value={whole(view.s.cancellations.cancelledOrders)}
                subtitle={`${money(view.s.cancellations.cancelledValue)} cancelled · ${whole(view.s.cancellations.returnedOrders)} returned`}
                icon={Ban}
              />
              <StatCard
                title="Inventory Alerts"
                value={whole(view.alertTotal)}
                subtitle={`${view.s.inventoryAlerts.outOfStock} out of stock · ${view.s.inventoryAlerts.lowStock} low stock · ${view.s.inventoryAlerts.inactive} inactive`}
                icon={Boxes}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <DetailPanel
                title="Refund Ledger"
                icon={RotateCcw}
                note="Refund rows are counted across all time, which is why they are deducted from lifetime gross revenue."
                rows={[
                  { label: "Refund records", value: whole(view.s.refunds.records) },
                  { label: "Processed amount", value: money(view.s.refunds.processedAmount) },
                  { label: "Pending amount", value: money(view.s.refunds.pendingAmount) },
                  { label: "Rejected or failed", value: whole(view.s.refunds.rejectedOrFailed) },
                ]}
              />
              <DetailPanel
                title="Cancellations & Returns"
                icon={Ban}
                note="Reported for every order row, independent of the window selector."
                rows={[
                  { label: "Cancelled orders", value: whole(view.s.cancellations.cancelledOrders) },
                  { label: "Cancelled value", value: money(view.s.cancellations.cancelledValue) },
                  { label: "Returned orders", value: whole(view.s.cancellations.returnedOrders) },
                ]}
              />
              <DetailPanel
                title="Inventory Alerts"
                icon={Boxes}
                note="Current state of every product variant, not a historical series."
                rows={[
                  { label: "Out of stock", value: whole(view.s.inventoryAlerts.outOfStock) },
                  { label: "Low stock", value: whole(view.s.inventoryAlerts.lowStock) },
                  { label: "Inactive variants", value: whole(view.s.inventoryAlerts.inactive) },
                ]}
              />
            </div>
          </section>

          {/* Trends over time */}
          <section aria-labelledby="trends-heading" className="space-y-6">
            <SectionHeading
              id="trends-heading"
              title="Trends Over Time"
              note="Derived from the daily and monthly rows the aggregation returns. Each chart exposes the same numbers in a collapsible table."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              <ChartCard
                title="Revenue & Order Volume"
                subtitle={`Weekly buckets · ${view.rangeText}`}
                variant="line"
                points={view.trendRevenue}
                secondary={view.trendOrders}
                formatter={money}
                secondaryFormatter={whole}
                primaryLabel="Revenue"
                secondaryLabel="Orders"
                axisLabel="Week starting"
                emptyMessage="No dated order rows fall inside this window yet."
                caption="The aggregation emits daily rows for the last 90 days; they are summed into 7-day buckets so the series stays readable. Weeks between the first and last order with no activity are true zeros."
              />
              <ChartCard
                title="Customer Growth"
                subtitle="Signups per calendar month · all time"
                variant="line"
                points={view.growthPoints}
                formatter={whole}
                primaryLabel="Signups"
                axisLabel="Month"
                emptyMessage="No customer profiles with the customer role yet."
                caption="One row per month of profile creation. The aggregation is not windowed, so this series spans the full lifetime of the boutique."
              />
            </div>
          </section>

          {/* Catalogue signals (window scoped) */}
          <section aria-labelledby="catalogue-heading" className="space-y-6">
            <SectionHeading
              id="catalogue-heading"
              title="Catalogue Signals"
              note={`Product and size rows are windowed by the aggregation to the last ${view.s.windowDays} days, ranked and capped at the server.`}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              <ChartCard
                title="Top Products"
                subtitle={`Revenue per product · last ${view.s.windowDays} days`}
                variant="bar"
                points={view.productPoints}
                formatter={money}
                primaryLabel="Revenue"
                axisLabel="Product"
                emptyMessage="No line items were sold inside this window."
                caption="Revenue is the sum of order line totals per product name, with cancelled orders excluded."
              />
              <ChartCard
                title="Top Bottle Sizes"
                subtitle={`Units per variant size · last ${view.s.windowDays} days`}
                variant="bar"
                points={view.sizePoints}
                secondary={view.sizeRevenue}
                formatter={whole}
                secondaryFormatter={money}
                primaryLabel="Units"
                secondaryLabel="Revenue"
                axisLabel="Size"
                emptyMessage="No sized variants were ordered inside this window."
                caption="Bars show units sold; the ivory series shows the revenue those units generated, scaled to its own maximum."
              />
            </div>
            <div className="min-w-0">
              <AnalyticsBreakdownTable
                title="Top Products Detail"
                subtitle={`Full names, units, orders and revenue · last ${view.s.windowDays} days`}
                caption="Same rows that feed the Top Products chart, with the untruncated product name."
                rows={view.s.topProducts}
                columns={productColumns}
                rowKey={(row, index) => `${row.name}-${index}`}
                emptyMessage="No products sold inside this window."
              />
            </div>
          </section>

          {/* Order & payment mix */}
          <section aria-labelledby="mix-heading" className="space-y-6">
            <SectionHeading
              id="mix-heading"
              title="Order Status & Payment Mix"
              note="Distributions are counted across every row in the database, so they describe the full order book rather than the selected window."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 min-w-0">
              <ChartCard
                title="Order Status"
                subtitle="Order rows by status · all time"
                variant="bar"
                points={view.statusPoints}
                formatter={whole}
                primaryLabel="Orders"
                axisLabel="Status"
                emptyMessage="No orders recorded yet."
                caption="Every order row grouped by its current status, including cancelled and returned rows."
              />
              <ChartCard
                title="Payment Method"
                subtitle="Revenue by method · all time"
                variant="bar"
                points={view.methodPoints}
                secondary={view.methodCounts}
                formatter={money}
                secondaryFormatter={whole}
                primaryLabel="Revenue"
                secondaryLabel="Orders"
                axisLabel="Method"
                emptyMessage="No payment method recorded on any order yet."
                caption="Cancelled orders are excluded from the payment method rollup."
              />
              <ChartCard
                title="Payment Status"
                subtitle="Payment records by status · all time"
                variant="bar"
                points={view.payStatusPoints}
                secondary={view.payStatusValues}
                formatter={whole}
                secondaryFormatter={money}
                primaryLabel="Records"
                secondaryLabel="Value"
                axisLabel="Status"
                emptyMessage="No payment records verified yet."
                caption="Counted from the payments table, one row per recorded payment."
              />
            </div>
          </section>

          {/* Promotions */}
          <section aria-labelledby="promotions-heading" className="space-y-6">
            <SectionHeading
              id="promotions-heading"
              title="Promotions"
              note={`Coupon usage is counted across all time: ${plural(view.couponTracked, "redemption")} recorded against ${plural(view.s.couponPerformance.length, "coupon")} in the catalog.`}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              <ChartCard
                title="Coupon Performance"
                subtitle="Redemptions per coupon code · all time"
                variant="bar"
                points={view.couponPoints}
                secondary={view.couponDiscounts}
                formatter={whole}
                secondaryFormatter={money}
                primaryLabel="Uses"
                secondaryLabel="Discount given"
                axisLabel="Code"
                emptyMessage="No coupons exist in the catalog yet."
                caption="Codes with zero redemptions are returned by the aggregation too, so unused promotions stay visible."
              />
              <AnalyticsBreakdownTable
                title="Coupon Detail"
                subtitle="Code, lifecycle status, uses and discount given"
                caption="Same rows that feed the coupon chart, ranked by discount given."
                rows={view.s.couponPerformance}
                columns={couponColumns}
                rowKey={(row, index) => `${row.code}-${index}`}
                emptyMessage="No coupons exist in the catalog yet."
              />
            </div>
          </section>

          <p className="text-[10px] text-muted/80 font-light border-t border-gold/15 pt-4">
            Figures are re-read from the server aggregation whenever this page mounts or the
            reporting window changes. Where the aggregation carries no comparable prior window, no
            trend or percentage is shown rather than an estimate.
          </p>
        </>
      )}
    </div>
  );
};
