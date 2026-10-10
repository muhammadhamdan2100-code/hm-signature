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
 * shipping_providers returned live rows to anon); after it is GREEN. A run that leaves
 * no rows is required, so the one write probe deletes exactly the row it created.
 *
 *     npx vitest run tests/phase10-security-hardening.test.ts
 */

const env = readSupabaseEnv();
const run = env ? describe : describe.skip;

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
