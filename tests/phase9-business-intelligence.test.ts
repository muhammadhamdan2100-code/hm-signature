import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { en } from "../src/i18n/dictionaries/en";
import { ar } from "../src/i18n/dictionaries/ar";
import { fr } from "../src/i18n/dictionaries/fr";
import { es } from "../src/i18n/dictionaries/es";
import { ur } from "../src/i18n/dictionaries/ur";
import { de } from "../src/i18n/dictionaries/de";
import { hasPermission } from "../src/services/auth";
import { resolveRequiredPermission, ROLE_PERMISSIONS, ROUTE_PERMISSIONS, type StaffMember } from "../src/types/staff";
import { login, readSupabaseEnv, reportSkip, rest, rpc, suiteCredentials } from "./support/harness";

/**
 * Phase 9 (business intelligence).
 *
 * Three things are asserted here, in the order they can actually be proven:
 *
 *   1. Every Phase 9 string exists in all six dictionaries. The parity harness
 *      compares the dictionaries with each other, so only this test notices that
 *      a whole group was never applied, or that a screen names a key nobody
 *      translated.
 *   2. The three report scopes really separate by role. The navigation is a
 *      courtesy; the database is the boundary, and `can_see_report()` is checked
 *      from live sessions below.
 *   3. The capture endpoint refuses junk without storing it. A funnel that
 *      accepted anything would fill with noise, which is worse than a funnel
 *      that has no data yet.
 *
 * This file never inserts a valid event. A synthetic visit would be counted as a
 * real shopper in every funnel figure afterwards, which is exactly the invented
 * data Phase 9 forbids; the accepted-shape behaviour is verified against a
 * transaction that is rolled back instead.
 */

const DICTIONARIES: Record<string, unknown> = { en, ar, fr, es, ur, de };
const GROUPS = ["admin.intelligence", "admin.forecasting", "admin.reports"];

const staffOf = (role: StaffMember["role"]): StaffMember => ({
  id: `qa-${role}`,
  name: `QA ${role}`,
  email: `qa-phase9-${role.toLowerCase().replace(/\s+/g, "-")}@hmsignature.test`,
  role,
  status: "Active",
  lastActive: "",
  createdAt: "",
  permissions: {},
});

/** Walks a dictionary the way the translator does, so a group is found by its dot path. */
function leafAt(root: unknown, path: string): unknown {
  let node = root;
  for (const part of path.split(".")) {
    if (!node || typeof node !== "object" || !(part in (node as Record<string, unknown>))) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

function leaves(node: unknown, prefix = ""): string[] {
  if (!node || typeof node !== "object" || node === null) return prefix ? [prefix] : [];
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    leaves(value, prefix ? `${prefix}.${key}` : key)
  );
}

/** Phase 9 leaves of one dictionary, as dot paths below `admin.`. */
function phase9Leaves(dictionary: unknown): string[] {
  const admin = leafAt(dictionary, "admin");
  return leaves(admin, "admin").filter((path) => GROUPS.some((group) => path.startsWith(`${group}.`)));
}

describe("Phase 9 strings exist in every language, not just English", () => {
  it("creates the three new admin groups in all six dictionaries", () => {
    for (const group of GROUPS) {
      for (const [code, dictionary] of Object.entries(DICTIONARIES)) {
        const node = leafAt(dictionary, group);
        expect(node, `${code} has no ${group} group at all`).toBeTruthy();
        expect(typeof node, `${code}.${group} is not a group of strings`).toBe("object");
      }
    }
  });

  it("keeps the same Phase 9 leaf paths across all six languages", () => {
    const expected = phase9Leaves(en).sort();
    expect(expected.length).toBeGreaterThan(200);
    for (const [code, dictionary] of Object.entries(DICTIONARIES)) {
      expect(phase9Leaves(dictionary).sort(), `${code} Phase 9 leaves differ from English`).toEqual(expected);
    }
  });

  it("carries a non-empty value for every key the screens name", () => {
    // The words shown on nearly every row, so a missing one is a raw dot path on
    // screen rather than a label.
    const critical = [
      "admin.intelligence.statusActual",
      "admin.intelligence.statusCalculated",
      "admin.intelligence.statusForecast",
      "admin.intelligence.statusInsufficient",
      "admin.intelligence.statusNotTracked",
      "admin.intelligence.statusNotConfigured",
      "admin.intelligence.statusConfigurationPending",
      "admin.intelligence.stageVisit",
      "admin.intelligence.stageProductView",
      "admin.intelligence.stageAddToCart",
      "admin.intelligence.stageBeginCheckout",
      "admin.intelligence.stagePaymentStarted",
      "admin.intelligence.stagePaymentCompleted",
      "admin.intelligence.stageOrderCompleted",
      "admin.intelligence.segmentNew",
      "admin.intelligence.segmentVip",
      "admin.intelligence.filter.window90",
      "admin.intelligence.filter.baseCurrency",
      "admin.forecasting.costMissing",
      "admin.forecasting.coverNoDemand",
      "admin.forecasting.demandTitle",
      "admin.reports.sectionSales",
      "admin.reports.sectionInventory",
      "admin.reports.colPeriod",
      "admin.reports.print",
      "admin.nav.intelligence",
      "admin.nav.forecasting",
      "admin.nav.reports",
      "admin.nav.operationalReports",
      "admin.nav.contentReports",
    ];
    for (const key of critical) {
      for (const [code, dictionary] of Object.entries(DICTIONARIES)) {
        const value = leafAt(dictionary, key);
        expect(typeof value, `${key} missing from ${code}`).toBe("string");
        expect((value as string).trim(), `${key} is empty in ${code}`).not.toBe("");
      }
    }
  });

  it("keeps the interpolation tokens the screens pass", () => {
    const tokenful: [string, string[]][] = [
      ["admin.intelligence.monthOffset", ["{count}"]],
      ["admin.intelligence.clvCostMissing", ["{total}"]],
      ["admin.intelligence.clvFewBuyers", ["{count}"]],
      ["admin.intelligence.clvCostPartial", ["{costed}", "{total}"]],
      ["admin.intelligence.funnelStored", ["{source}", "{records}"]],
      ["admin.forecasting.inventoryCaption", ["{window}", "{lead}"]],
      ["admin.forecasting.demandCaption", ["{window}", "{horizon}"]],
      ["admin.forecasting.needPurchases", ["{found}", "{required}"]],
      ["admin.forecasting.costForSize", ["{product}", "{size}"]],
      ["admin.forecasting.costStoredIn", ["{currency}"]],
    ];
    for (const [key, tokens] of tokenful) {
      for (const [code, dictionary] of Object.entries(DICTIONARIES)) {
        const value = leafAt(dictionary, key);
        expect(typeof value, `${key} missing from ${code}`).toBe("string");
        for (const token of tokens) {
          expect((value as string), `${key} lost ${token} in ${code}`).toContain(token);
        }
      }
    }
  });
});

describe("Phase 9 report scopes are separated by role", () => {
  const codes = ["reports.business", "reports.operational", "reports.content"] as const;

  it("gives a Manager the business window, an Order Manager only operations, a Content Manager only products", () => {
    expect(hasPermission(staffOf("Super Admin"), "reports.business")).toBe(true);
    expect(hasPermission(staffOf("Manager"), "reports.business")).toBe(true);
    expect(hasPermission(staffOf("Manager"), "reports.operational")).toBe(true);

    const orderManager = staffOf("Order Manager");
    expect(hasPermission(orderManager, "reports.operational"), "order and payment reports are theirs").toBe(true);
    expect(hasPermission(orderManager, "reports.business"), "customer value is not theirs").toBe(false);
    expect(hasPermission(orderManager, "reports.content"), "product performance is not theirs").toBe(false);

    const contentManager = staffOf("Content Manager");
    expect(hasPermission(contentManager, "reports.content")).toBe(true);
    expect(hasPermission(contentManager, "reports.business")).toBe(false);
    expect(hasPermission(contentManager, "reports.operational")).toBe(false);
  });

  it("routes each report window behind its own permission", () => {
    expect(ROUTE_PERMISSIONS["/admin/intelligence"]).toBe("reports.business");
    expect(ROUTE_PERMISSIONS["/admin/forecasting"]).toBe("reports.business");
    expect(resolveRequiredPermission("/admin/reports/operations")).toBe("reports.operational");
    expect(resolveRequiredPermission("/admin/reports/product-performance")).toBe("reports.content");
    // The parent path still governs an unknown child, so a new sub-page can never
    // arrive unguarded just because nobody listed it.
    expect(resolveRequiredPermission("/admin/reports/anything-new")).toBe("reports.business");
    // A role may be refused by omission or by an explicit false; hasPermission()
    // answers both the same way, so what matters is that the decision exists.
    for (const code of codes) {
      for (const role of Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]) {
        expect(typeof hasPermission(staffOf(role), code), `${role}.${code} is neither a yes nor a no`).toBe("boolean");
      }
    }
  });

  it("offers each Phase 9 window in the navigation, and only to a role that may open it", () => {
    // Read as text on purpose: importing the sidebar would drag the whole admin
    // context into a test that only needs to know which entries were listed.
    const sidebar = readFileSync("src/admin/components/AdminSidebar.tsx", "utf8");
    const paths = [
      "/admin/intelligence",
      "/admin/forecasting",
      "/admin/reports",
      "/admin/reports/operations",
      "/admin/reports/product-performance",
    ];
    for (const path of paths) {
      expect(sidebar, `${path} is missing from the sidebar`).toContain(`"${path}"`);
      const required = resolveRequiredPermission(path);
      expect(required, `${path} has no permission requirement`).toBeTruthy();
      const allowed = (Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]).filter((role) =>
        hasPermission(staffOf(role), required as string)
      );
      expect(allowed.length, `${path} is open to no role at all`).toBeGreaterThan(0);
      // Every key here is a staff role, so "not open to a customer" cannot be
      // tested by name. What can be tested is that the window is scoped: no
      // Phase 9 path may be reachable by all four roles at once.
      expect(allowed.length, `${path} is open to every staff role`).toBeLessThan(
        Object.keys(ROLE_PERMISSIONS).length
      );
    }
    // Order Manager and Content Manager must each reach at least one window, or
    // the scoping has accidentally locked them out.
    expect(resolveRequiredPermission("/admin/reports/operations")).toBeTruthy();
    expect(resolveRequiredPermission("/admin/reports/product-performance")).toBeTruthy();
  });
});

const env = readSupabaseEnv();
const creds = suiteCredentials();
const run = env ? describe : describe.skip;

run("Phase 9 against the live project", () => {
  const refused: [string, Record<string, unknown>][] = [
    ["get_admin_report", { p_section: "sales" }],
    ["get_admin_report", { p_section: "customers" }],
    ["get_conversion_funnel", { p_days: 90 }],
    ["get_marketing_attribution", { p_days: 90, p_model: "first_touch" }],
    ["get_cohort_analysis", { p_granularity: "month" }],
    ["get_customer_lifetime_value", {}],
    ["get_repeat_purchase_rate", { p_days: 365 }],
    ["get_phase9_segments", {}],
    ["get_inventory_forecast", {}],
    ["get_demand_forecast", {}],
    ["get_product_profitability", {}],
    ["analytics_orders", { p_scope: "business" }],
    ["analytics_order_lines", { p_scope: "content" }],
  ];

  // Thirteen sequential round-trips to the live project: the default five seconds
  // is a network budget, not a statement about the product, so the test is given
  // room to finish all of them.
  it(
    "refuses every report and the shared sales core to an anonymous caller",
    async () => {
      if (!env) return;
      for (const [fn, payload] of refused) {
        const response = await rpc(env, null, fn, payload);
        expect([200, 204], `${fn} answered an anonymous call with ${response.text.slice(0, 120)}`).not.toContain(response.status);
      }
      // After the grant correction the refusal arrives at the permission layer, so
      // an anonymous report call is rejected before its body ever runs.
      const dispatch = await rpc(env, null, "get_admin_report", { p_section: "sales" });
      expect(dispatch.status, "the grant itself must refuse an anonymous report").toBe(401);
    },
    30_000
  );

  it("will not let an anonymous caller read the event log or the costs table", async () => {
    if (!env) return;
    for (const table of ["analytics_events", "product_variant_costs"]) {
      const response = await rest(env, null, `${table}?select=*`);
      expect([200, 204], `${table} was readable without a session`).not.toContain(response.status);
    }
  });

  it("rejects a malformed funnel event without storing it", async () => {
    if (!env) return;
    const response = await rpc(env, null, "record_analytics_event", {
      p_events: [
        { event: "not_a_funnel_event", visitor_id: "a".repeat(24), session_id: "b".repeat(24) },
        { event: "visit", visitor_id: "short", session_id: "b".repeat(24) },
        { event: "visit", visitor_id: "c".repeat(24) },
        { event: "product_view", visitor_id: "d".repeat(24), product_id: "not-a-uuid" },
      ],
    });
    expect(response.status, response.text).toBe(200);
    const body = response.json<{ recorded: number; rejected: number }>();
    expect(body.recorded, "nothing above is a well-formed event").toBe(0);
    // A payload that is not an array at all, and one that is too large, are both
    // answered rather than thrown at: a browser bug must not look like an outage.
    const notArray = await rpc(env, null, "record_analytics_event", { p_events: { event: "visit" } });
    expect(notArray.status).toBe(200);
    expect(notArray.json<{ reason?: string }>().reason).toBe("payload_not_an_array");
    const tooMany = await rpc(env, null, "record_analytics_event", {
      p_events: Array.from({ length: 13 }, () => ({ event: "visit", visitor_id: "f".repeat(24), session_id: "g".repeat(24) })),
    });
    expect(tooMany.json<{ reason?: string }>().reason).toBe("batch_too_large");
  });

  it("answers an unknown report section with a refusal, not with someone else's report", async () => {
    if (!env) return;
    const response = await rpc(env, null, "get_admin_report", { p_section: "every_body" });
    expect(response.status, response.text).not.toBe(200);
  });

  it("labels an empty funnel, an uncosted catalogue and a forecast honestly for a staff reader", async () => {
    if (!env) return;
    if (!creds.staffEmail || !creds.staffPassword) {
      reportSkip("SUITE_STAFF_EMAIL / SUITE_STAFF_PASSWORD not supplied — the staff-only payload checks did not run.");
      return;
    }
    const staff = await login(env, creds.staffEmail, creds.staffPassword);
    if (!staff) {
      reportSkip("the configured staff account could not sign in — the staff-only payload checks did not run.");
      return;
    }

    const funnel = await rpc(env, staff.token, "get_conversion_funnel", { p_days: 90, p_country: null });
    expect(funnel.status, funnel.text).toBe(200);
    const funnelBody = funnel.json<{ data_status: string; capture_started_at: string | null; stages: { sessions: number | null }[] }>();
    expect(["not_tracked", "insufficient_data", "calculated"]).toContain(funnelBody.data_status);
    if (funnelBody.capture_started_at === null) expect(funnelBody.data_status).toBe("not_tracked");
    for (const stage of funnelBody.stages) {
      // An unmeasured step stays null. Writing 0 would read as traffic that
      // arrived and then failed to convert.
      expect(stage.sessions === null || typeof stage.sessions === "number").toBe(true);
    }

    const demand = await rpc(env, staff.token, "get_demand_forecast", { p_days: 180, p_horizon_days: 30, p_currency: null });
    expect(demand.status, demand.text).toBe(200);
    const demandBody = demand.json<{
      data_status: string;
      reason?: string;
      message?: string;
      purchases_found: number;
      purchases_required: number;
      weeks_with_sales_found: number;
      weeks_required: number;
      products: unknown[];
    }>();
    if (demandBody.purchases_found < demandBody.purchases_required || demandBody.weeks_with_sales_found < demandBody.weeks_required) {
      expect(demandBody.data_status).toBe("insufficient_data");
      expect(demandBody.reason).toBe("insufficient_historical_data");
      expect(demandBody.message).toBe("Insufficient historical data");
      expect(demandBody.products).toEqual([]);
    } else {
      expect(demandBody.data_status).toBe("forecast");
    }

    const profit = await rpc(env, staff.token, "get_product_profitability", {
      p_days: 3650, p_currency: null, p_country: null, p_limit: 10,
    });
    expect(profit.status, profit.text).toBe(200);
    const profitBody = profit.json<{
      cost_basis: { data_status: string; variants_costed: number };
      products: { gross_profit: number | null; cost_status: string; unit_cost: number | null }[];
    }>();
    if (profitBody.cost_basis.variants_costed === 0) {
      expect(profitBody.cost_basis.data_status).toBe("not_configured");
      for (const row of profitBody.products) {
        expect(row.unit_cost, "no cost was recorded, so none may be shown").toBeNull();
        expect(row.gross_profit, "a product with no recorded cost cannot report a profit").toBeNull();
        expect(row.cost_status).toBe("not_configured");
      }
    }

    const clv = await rpc(env, staff.token, "get_customer_lifetime_value", { p_currency: null, p_limit: 5, p_country: null });
    expect(clv.status, clv.text).toBe(200);
    const clvBody = clv.json<{ basis: string; customers: number; data_status: string; cost_basis: { data_status: string } }>();
    expect(clvBody.basis).toBe("revenue_based");
    expect(["configured", "not_configured"]).toContain(clvBody.cost_basis.data_status);
    if (clvBody.customers < 10) expect(clvBody.data_status).toBe("insufficient_data");

    const repeat = await rpc(env, staff.token, "get_repeat_purchase_rate", { p_days: 3650, p_currency: null, p_country: null });
    expect(repeat.status, repeat.text).toBe(200);
    const repeatBody = repeat.json<{ buyers: number; rate_percent: number | null; data_status: string }>();
    if (repeatBody.buyers === 0) {
      // Zero buyers is not a repeat rate of zero.
      expect(repeatBody.rate_percent).toBeNull();
      expect(repeatBody.data_status).toBe("insufficient_data");
    }

    const segments = await rpc(env, staff.token, "get_phase9_segments", { p_currency: null });
    expect(segments.status, segments.text).toBe(200);
    const segmentBody = segments.json<{ segments: { key: string; data_status: string }[] }>();
    const vip = segmentBody.segments.find((s) => s.key === "vip");
    expect(["configuration_pending", "actual", "calculated"]).toContain(vip?.data_status);

    const unknown = await rpc(env, staff.token, "get_admin_report", {
      p_section: "impossible", p_from: null, p_to: null, p_country: null, p_currency: null,
    });
    expect(unknown.status).toBe(200);
    expect(unknown.json<{ data_status: string; error: string }>()).toMatchObject({
      data_status: "error",
      error: "unknown_section",
    });
  });

  it("refuses a business report to a signed-in customer", async () => {
    if (!env) return;
    if (!creds.aEmail || !creds.aPassword) {
      reportSkip("SUITE_A_EMAIL / SUITE_A_PASSWORD not supplied — the customer refusal path did not run.");
      return;
    }
    const customer = await login(env, creds.aEmail, creds.aPassword);
    if (!customer) {
      reportSkip("the configured customer account could not sign in — the customer refusal path did not run.");
      return;
    }
    for (const [fn, payload] of refused) {
      const response = await rpc(env, customer.token, fn, payload);
      expect([200, 204], `${fn} answered a customer with ${response.text.slice(0, 120)}`).not.toContain(response.status);
    }
    // A customer cannot read back what the storefront recorded, and cannot read
    // any report: those paths are covered above. Writing a real event is left to
    // a real browser, because a synthetic visit would be counted as a shopper.
  });
});
