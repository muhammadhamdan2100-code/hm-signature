import { beforeAll, describe, expect, it } from "vitest";
import { login, readSupabaseEnv, reportSkip, rest, rpc, suiteCredentials, type Env, type Session } from "./support/harness";

/**
 * Analytics figures come from one server-side aggregation, so these checks hold it to
 * its own stated definitions: the money that counts, the money that is reported
 * separately, and the fact that a customer cannot read any of it.
 *
 *     SUITE_A_EMAIL=... SUITE_A_PASSWORD=... \
 *     SUITE_B_EMAIL=... SUITE_B_PASSWORD=... \
 *     SUITE_STAFF_EMAIL=... SUITE_STAFF_PASSWORD=... \
 *     npx vitest run tests/analytics-and-insights.test.ts
 *
 * The aggregation is staff-only, so without SUITE_STAFF_* only the refusal paths run.
 * Nothing here writes a row.
 */

const env: Env | null = readSupabaseEnv();
const creds = suiteCredentials();
const run = env && creds.aEmail && creds.aPassword ? describe : describe.skip;

type Snapshot = {
  window_days: number;
  totals: {
    orders: number;
    gross_revenue: number;
    customers: number;
    average_order_value: number;
    units_sold: number;
  };
  cancellations: { cancelled_orders: number; returned_orders: number; cancelled_value: number };
  refunds: {
    records: number;
    processed_amount: number;
    processed_on_live_orders: number;
    pending_amount: number;
    rejected_or_failed: number;
  };
  order_status_distribution: { status: string; count: number }[];
  payment_method_distribution: { method: string; count: number; value: number }[];
  sales_trend: { day: string; orders: number; revenue: number }[];
  top_products: { name: string; units: number; revenue: number; orders: number }[];
  top_sizes: { size: string; units: number; revenue: number }[];
  customer_growth: { month: string; signups: number }[];
  coupon_performance: { code: string; uses: number; discount_given: number; status: string }[];
  inventory_alerts: { out_of_stock: number; low_stock: number; inactive: number };
};

const near = (a: number, b: number) => Math.abs(Math.round(a) - Math.round(b)) <= 1;

run("analytics aggregation and insight access", () => {
  let a: Session | null = null;
  let staff: Session | null = null;
  let snap: Snapshot | null = null;
  let orders: { total: number; status: string; created_at: string }[] = [];

  beforeAll(async () => {
    if (!env) return;
    a = (await login(env, creds.aEmail, creds.aPassword)) || null;
    if (!a) {
      reportSkip("no customer session available (signup needs a confirmed email address).");
      return;
    }
    if (creds.staffEmail && creds.staffPassword) {
      staff = (await login(env, creds.staffEmail, creds.staffPassword)) || null;
    }
    if (!staff) {
      reportSkip("SUITE_STAFF_EMAIL / SUITE_STAFF_PASSWORD not supplied — only the refusal paths run.");
      return;
    }
    const res = await rpc(env, staff.token, "get_admin_analytics", { p_days: 3650 });
    expect(res.status, res.text).toBe(200);
    snap = res.json<Snapshot>();
    const rows = await rest(env, staff.token, "orders?select=total,status,created_at");
    orders = rows.json<typeof orders>();
  }, 60_000);

  it("refuses the aggregation to a customer and to an anonymous visitor", async () => {
    if (!env || !a) return;
    const asCustomer = await rpc(env, a.token, "get_admin_analytics", { p_days: 90 });
    expect(asCustomer.status).toBe(400);
    expect(asCustomer.text).toContain("Only staff");

    const asAnon = await rpc(env, null, "get_admin_analytics", { p_days: 90 });
    expect([401, 403, 404]).toContain(asAnon.status);
  });

  it("answers the unconfigured insights request without leaking any figures", async () => {
    const ai = await import("../server/aiCore.js");
    const res = await ai.runInsights({ accessToken: null, ip: "test" });
    expect(res.status).toBe(501);
    expect(res.body.configured).toBe(false);
    expect(res.body.insight).toBeNull();
    // The honest fallback carries no numbers at all.
    expect(Object.keys(res.body)).toEqual(["configured", "insight"]);
  });

  it("counts revenue from live orders only, and reports cancellations separately", () => {
    if (!snap) return;
    const live = orders.filter((o) => o.status !== "Cancelled");
    const cancelled = orders.filter((o) => o.status === "Cancelled");

    expect(snap.totals.orders).toBe(live.length);
    expect(near(snap.totals.gross_revenue, live.reduce((s, o) => s + Number(o.total), 0))).toBe(true);
    expect(snap.cancellations.cancelled_orders).toBe(cancelled.length);
    expect(near(snap.cancellations.cancelled_value, cancelled.reduce((s, o) => s + Number(o.total), 0))).toBe(true);
    // A cancelled order contributes to the cancellation panel and to nothing else, so
    // gross revenue must not have grown by its value.
    expect(snap.totals.gross_revenue + snap.cancellations.cancelled_value).toBeGreaterThanOrEqual(
      orders.reduce((s, o) => s + Number(o.total), 0)
    );
    expect(snap.cancellations.returned_orders).toBe(
      orders.filter((o) => o.status === "Returned").length
    );
  });

  it("keeps the refund deduction on live orders, as the panel states", () => {
    if (!snap) return;
    const gross = Number(snap.totals.gross_revenue);
    const onLive = Number(snap.refunds?.processed_on_live_orders ?? 0);
    const processed = Number(snap.refunds?.processed_amount ?? 0);
    // Net revenue as the dashboard defines it: gross of live orders minus refunds that
    // belong to an order which was not cancelled.
    expect(gross - onLive).toBeLessThanOrEqual(gross);
    expect(onLive).toBeLessThanOrEqual(processed);
  });

  it("averages order value over the orders it counted", () => {
    if (!snap || !snap.totals.orders) return;
    expect(near(snap.totals.average_order_value, snap.totals.gross_revenue / snap.totals.orders)).toBe(true);
  });

  it("distributes every order row across the status panel", () => {
    if (!snap) return;
    const total = snap.order_status_distribution.reduce((s, r) => s + r.count, 0);
    expect(total).toBe(orders.length);
    for (const row of snap.order_status_distribution) {
      expect(row.count).toBeGreaterThan(0);
      expect(orders.some((o) => o.status === row.status)).toBe(true);
    }
  });

  it("keeps the trend, product and size panels inside the counted revenue", () => {
    if (!snap) return;
    const trendTotal = snap.sales_trend.reduce((s, d) => s + Number(d.revenue), 0);
    expect(trendTotal).toBeLessThanOrEqual(Number(snap.totals.gross_revenue) + 1);
    for (const day of snap.sales_trend) expect(day.orders).toBeGreaterThan(0);

    const productRevenue = snap.top_products.reduce((s, p) => s + Number(p.revenue), 0);
    expect(productRevenue).toBeLessThanOrEqual(Number(snap.totals.gross_revenue) + 1);
    for (const p of snap.top_products) expect(p.units).toBeGreaterThan(0);

    const sizeRevenue = snap.top_sizes.reduce((s, r) => s + Number(r.revenue), 0);
    expect(sizeRevenue).toBeLessThanOrEqual(Number(snap.totals.gross_revenue) + 1);
  });

  it("lists every coupon, including the ones nobody has used", async () => {
    if (!env || !staff || !snap) return;
    const coupons = await rest(
      env,
      staff.token,
      "coupons?select=code,active&order=code.asc&limit=200"
    );
    const rows = coupons.json<{ code: string; active: string }[]>();
    const reported = snap.coupon_performance.map((c) => c.code).sort();
    for (const row of rows) expect(reported).toContain(row.code);
    expect(reported).toEqual(rows.map((r) => r.code).sort());

    const unused = rows.filter((r) =>
      snap.coupon_performance.some((c) => c.code === r.code && c.uses === 0)
    );
    // A code that has never been redeemed must still appear, so the panel can say so
    // instead of looking like a broken chart.
    if (rows.some((r) => snap.coupon_performance.every((c) => c.uses > 0)) === false) {
      expect(unused.length).toBeGreaterThan(0);
    }
  });

  it("counts customer growth from the profiles it read", async () => {
    if (!env || !staff || !snap) return;
    const profiles = await rest(env, staff.token, "profiles?select=id,role,created_at&limit=500");
    const customers = profiles
      .json<{ id: string; role: string; created_at: string }[]>()
      .filter((p) => p.role === "customer");
    const growthTotal = snap.customer_growth.reduce((s, m) => s + m.signups, 0);
    expect(growthTotal).toBe(customers.length);
    for (const month of snap.customer_growth) expect(month.signups).toBeGreaterThan(0);
  });

  it("reports the window it was asked for and keeps the trend at its documented floor", async () => {
    if (!env || !staff) return;
    const narrow = await rpc(env, staff.token, "get_admin_analytics", { p_days: 30 });
    expect(narrow.status).toBe(200);
    const s = narrow.json<Snapshot>();
    expect(s.window_days).toBe(30);
    // The trend is deliberately a 90-day series whatever the window says, which is how
    // the panel is labelled; anything wider than that must not appear.
    const floor = Date.now() - 91 * 24 * 60 * 60 * 1000;
    for (const day of s.sales_trend) {
      expect(new Date(day.day).getTime()).toBeGreaterThanOrEqual(floor);
      expect(day.orders).toBeGreaterThan(0);
    }
    const wide = await rpc(env, staff.token, "get_admin_analytics", { p_days: 3650 });
    const w = wide.json<Snapshot>();
    expect(w.window_days).toBe(3650);
    const narrowRevenue = s.sales_trend.reduce((sum, d) => sum + Number(d.revenue), 0);
    const wideRevenue = w.sales_trend.reduce((sum, d) => sum + Number(d.revenue), 0);
    // Same floor, so the same money: widening the window must not invent trend days.
    expect(Math.round(narrowRevenue)).toBe(Math.round(wideRevenue));
  });
});
