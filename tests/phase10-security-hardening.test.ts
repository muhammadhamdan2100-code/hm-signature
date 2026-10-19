import { describe, expect, it } from "vitest";
import { readSupabaseEnv, rest } from "./support/harness";

/**
 * PHASE 10 authorization regression — enforcement layer, not UI.
 *
 * These tables back the enterprise platform (staff permissions, the audit ledger,
 * multi-location inventory, fulfillment, CRM, accounting, the workflow queue). None of
 * them is read directly by the React client, so under a correct posture an anonymous
 * visitor — holding only the public anon key — must be denied every row. Before the
 * Phase 10 security-hardening migration this suite is RED (locations and
 * shipping_providers returned live rows to anon); after it is GREEN.
 *
 * The read probes below send nothing that can change a row, so they run by default and are
 * the evidence that the hole is still open. The two WRITE probes are opt-in, because this
 * suite runs against the live project: `HARDENING_WRITE_PROBE=1` is required to attempt an
 * INSERT or PATCH at all. Without it they report skipped instead of leaving a real
 * production row that a cleanup delete would have to chase.
 *
 *     npx vitest run tests/phase10-security-hardening.test.ts
 *     HARDENING_WRITE_PROBE=1 npx vitest run tests/phase10-security-hardening.test.ts
 */

const env = readSupabaseEnv();
const run = env ? describe : describe.skip;
const runWrites = env && process.env.HARDENING_WRITE_PROBE === "1" ? describe : describe.skip;

// Tables proven to hold configuration/rows that must never be public.
const DATA_BEARING = ["locations", "shipping_providers"];

// The full set of Phase 10 tables that have no legitimate anonymous read path.
const ALL_PROTECTED = [
  "staff_permissions",
  "audit_log",
  "audit_events",
  "locations",
  "location_stock",
  "stock_reservations",
  "stock_transfers",
  "fulfillments",
  "pick_lists",
  "packing_slips",
  "returns",
  "shipping_providers",
  "shipping_rates",
  "shipments",
  "crm_customers",
  "crm_events",
  "accounting_invoices",
  "accounting_payments",
  "accounting_refunds",
  "workflow_events",
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
run("Phase 10 authorization (RLS enforcement against the anon key)", () => {
  it.each(DATA_BEARING)(
    "anon cannot read live rows from %s (the confirmed public leak)",
    async (table) => {
      const res = await rest(env!, null, `${table}?select=*&limit=200`);
      const rows = res.status < 400 ? res.json<unknown[]>() : [];
      // A 4xx (denied) is a pass; a 2xx must expose zero rows.
      expect(
        res.status >= 400 ? 0 : Array.isArray(rows) ? rows.length : 1,
        `anon exposed ${JSON.stringify(rows).slice(0, 160)}`
      ).toBe(0);
    }
  );

  it.each(ALL_PROTECTED)("anon SELECT on %s exposes no data", async (table) => {
    const res = await rest(env!, null, `${table}?select=*&limit=200`);
    if (res.status >= 400) return; // denied outright — secure
    const rows = res.json<unknown[]>();
    expect(Array.isArray(rows) ? rows.length : 1).toBe(0);
  });
});

runWrites("Phase 10 write probes (opt-in — these touch the live project)", () => {
  it("anon cannot append a fabricated row to the audit ledger (and cleans up if it could)", async () => {
    // Attempt the tamper. With RLS enforced the insert is rejected and nothing is created.
    const probe = {
      actor_role: "anon_probe",
      action: "phase10.test.tamper_probe",
      resource_type: "test",
      source: "test",
      success: true,
    };
    const ins = await rest(env!, null, "audit_log", { method: "POST", body: probe });
    if (ins.status < 400) {
      // The insert was accepted — that IS the vulnerability. Remove exactly what we added,
      // then fail so the hole cannot be reported as fixed.
      const created = ins.json<{ id?: string }[]>();
      const id = Array.isArray(created) ? created[0]?.id : undefined;
      if (id) await rest(env!, null, `audit_log?id=eq.${id}`, { method: "DELETE" });
      expect(false, `anon inserted audit_log row ${id} — the ledger is writable by visitors`).toBe(true);
    }
    expect(ins.status).toBeGreaterThanOrEqual(400);
  });

  it("anon cannot modify inventory to fake stock", async () => {
    const upd = await rest(env!, null, "location_stock?location_id=is.null", {
      method: "PATCH",
      body: { available: 999999 },
    });
    // RLS denies it (4xx) or it matches no rows without changing anything. Either way an
    // anonymous PATCH must not report a successful update of a real row.
    expect(upd.status).toBeLessThan(500);
    if (upd.status < 400) {
      const rows = upd.json<unknown[]>();
      expect(Array.isArray(rows) ? rows.length : 1).toBe(0);
    }
  });
});

/**
 * The privilege layer, measured with statements that cannot change a row.
 *
 * Every filter below matches nothing, so these probes ask one question only: was the statement
 * permitted at all? PostgREST checks the table privilege before it looks at any row, so a 2xx
 * here means the public key still holds that privilege — and `representation: false` is what
 * keeps a permitted-but-empty DELETE from reporting 404 and passing by accident.
 *
 * This suite is RED until 20261019180000_anon_privilege_lockdown.sql is applied, and is the
 * proof that it worked.
 */
const WRITE_PROTECTED: Record<string, string> = {
  products: "slug=eq.__qa_no_row__",
  coupons: "code=eq.__QA_NO_ROW__",
  site_settings: "key=eq.__qa_no_row__",
  orders: "order_number=eq.__QA-NO-ROW__",
  payments: "id=eq.00000000-0000-0000-0000-000000000000",
  profiles: "id=eq.00000000-0000-0000-0000-000000000000",
  categories: "slug=eq.__qa_no_row__",
  collections: "slug=eq.__qa_no_row__",
  product_variants: "id=eq.00000000-0000-0000-0000-000000000000",
  audit_log: "id=eq.00000000-0000-0000-0000-000000000000",
  staff_permissions: "id=eq.00000000-0000-0000-0000-000000000000",
  locations: "code=eq.__qa_no_row__",
};

run("Anon holds no write privilege on the shop's own data (zero-row probes)", () => {
  it.each(Object.entries(WRITE_PROTECTED))("anon cannot DELETE from %s", async (table, filter) => {
    const del = await rest(env!, null, `${table}?${filter}`, { method: "DELETE", representation: false });
    expect(
      del.status,
      `anon DELETE on ${table} answered ${del.status} — the table privilege is still granted to the public key`
    ).toBeGreaterThanOrEqual(400);
  });
});

run("A visitor cannot enumerate the shop's discount codes", () => {
  it("listing coupons as anon yields no rows", async () => {
    const res = await rest(env!, null, "coupons?select=code&limit=50");
    if (res.status >= 400) return; // denied outright — secure
    const rows = res.json<{ code?: string }[]>();
    expect(
      Array.isArray(rows) ? rows.length : 1,
      `anon listed ${Array.isArray(rows) ? rows.map((r) => r.code).join(",") : "an unreadable response"}`
    ).toBe(0);
  });
});

/**
 * The privilege that `REVOKE ... FROM anon` cannot reach.
 *
 * PostgreSQL has no deny: when a function's EXECUTE arrives through the default `PUBLIC` grant,
 * revoking it from `anon` alone changes nothing, and the acl text still looks clean. The only way
 * back is to revoke from `PUBLIC` and re-grant the roles that legitimately need it — which is what
 * 20261019200000 does for the warehouse, fulfilment and audit functions.
 *
 * A 401 is asserted rather than "not 200", because before the fix `adjust_location_stock` answered
 * 500 — it had entered the body and failed there. Only a privilege denial keeps it out.
 */
const PRIVATE_RPCS: Array<[string, Record<string, unknown>]> = [
  [
    "adjust_location_stock",
    {
      p_location_id: "00000000-0000-0000-0000-000000000000",
      p_variant_id: "00000000-0000-0000-0000-000000000000",
      p_quantity: 0,
      p_movement_type_code: "probe",
    },
  ],
  [
    "reserve_order_stock",
    {
      p_order_id: "00000000-0000-0000-0000-000000000000",
      p_location_id: "00000000-0000-0000-0000-000000000000",
      p_variant_id: "00000000-0000-0000-0000-000000000000",
      p_quantity: 1,
    },
  ],
  ["release_reservation", { p_reservation_id: "00000000-0000-0000-0000-000000000000" }],
  ["get_location_stock", { p_location_id: "00000000-0000-0000-0000-000000000000", p_variant_id: "00000000-0000-0000-0000-000000000000" }],
  ["create_fulfillment_from_order", { p_order_id: "00000000-0000-0000-0000-000000000000" }],
  ["generate_fulfillment_number", {}],
  // `publish_audit_event` and `write_audit_log` are also revoked at the database, but they are
  // internal helpers whose argument shape the browser never learns: through REST they answer 404
  // "no such signature" whether or not the privilege exists, so asserting on them here would
  // prove nothing. They are covered by the privilege catalog in the migration's verify section.
];

run("Anon cannot run the warehouse or audit RPCs (PUBLIC-default privilege)", () => {
  it.each(PRIVATE_RPCS)("rpc/%s is not executable by the public key", async (fn, payload) => {
    const res = await rest(env!, null, `rpc/${fn}`, { method: "POST", body: payload });
    expect(res.status, `anon ran ${fn} and got ${res.status}: ${res.text.slice(0, 120)}`).toBe(401);
  });

  it("leaves the shopper's own lookups reachable, so this is a lockdown and not an outage", async () => {
    const tracking = await rest(env!, null, "rpc/get_order_tracking", {
      method: "POST",
      body: { p_lookup: "HMS-00000000-0000", p_email: "probe@example.com" },
    });
    expect(tracking.status).toBeLessThan(400);
    const quote = await rest(env!, null, "rpc/quote_order", {
      method: "POST",
      body: { p_items: [], p_country_code: "PK" },
    });
    expect(quote.status).toBeLessThan(400);
    const coupon = await rest(env!, null, "rpc/checkout_coupon", { method: "POST", body: { p_code: "WELCOME10" } });
    expect(coupon.status).toBeLessThan(400);
  });
});
