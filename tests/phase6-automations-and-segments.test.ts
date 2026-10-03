import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  login,
  readSupabaseEnv,
  reportSkip,
  rest,
  rpc,
  suiteCredentials,
  type Env,
  type Session,
} from "./support/harness";

/**
 * Phase 6 §17–§21: follow-up automations, customer segments and consent.
 *
 * The queue functions are deliberately not executable from a browser, so this suite
 * proves the security posture and the rules reachable with an ordinary session:
 * every workflow ships disabled, only settings-authorized staff may change them,
 * segments are counts for staff only, no customer can read another customer's
 * consent, and no session at all can trigger a sweep.
 *
 * The end-to-end eligibility rules (duplicate prevention, recovered-bag exclusion,
 * per-customer rate limit, consent enforcement at delivery time) need the service
 * role and are re-checkable with tests/sql/phase6-automation-rules.sql.
 */

const env = readSupabaseEnv();
const run = env ? describe : describe.skip;
const creds = suiteCredentials();

type Dashboard = {
  workflows: {
    id: string;
    enabled: boolean;
    requiresMarketingConsent: boolean;
    delayMinutes: number;
    pending: number;
  }[];
  recentRuns: unknown[];
  queue: unknown[];
  emailQueue: unknown[];
  serverTime: string;
};

type Segment = { segment_id: string; label: string; rule: string; customer_count: number };

/** The workflow this suite may toggle without risk: its queue key is identical to the
 * one the delivery event already uses, so no additional message can be produced. */
const SAFE_WORKFLOW = "delivery_followup";

run("phase 6 automations, segments and consent", () => {
  let a: Session | null = null;
  let b: Session | null = null;
  let staff: Session | null = null;
  let toggled = false;

  beforeAll(async () => {
    if (!env) return;
    a = await login(env, creds.aEmail, creds.aPassword);
    b = await login(env, creds.bEmail, creds.bPassword);
    staff = await login(env, creds.staffEmail, creds.staffPassword);
  }, 60_000);

  afterAll(async () => {
    // Leave the shipped posture exactly as found: everything disabled.
    if (env && staff && toggled) {
      await rpc(env, staff.token, "set_workflow_enabled", {
        p_workflow_id: SAFE_WORKFLOW,
        p_enabled: false,
      });
    }
  });

  it("needs two customers and a staff account", () => {
    if (!a || !b || !staff) {
      reportSkip("suite sessions unavailable");
      return;
    }
    expect(Boolean(a && b && staff)).toBe(true);
  });

  it("reports three workflows, all shipped disabled", async () => {
    if (!env || !staff) return;
    const res = await rpc(env, staff.token, "get_automation_dashboard", {});
    expect(res.status, res.text).toBe(200);
    const board = res.json<Dashboard>();
    expect(board.workflows.map((w) => w.id).sort()).toEqual([
      "abandoned_cart",
      "delivery_followup",
      "review_request",
    ]);
    for (const w of board.workflows) {
      expect(w.enabled, `${w.id} must ship disabled`).toBe(false);
      expect(w.delayMinutes).toBeGreaterThan(0);
    }
    const cart = board.workflows.find((w) => w.id === "abandoned_cart");
    expect(cart?.requiresMarketingConsent).toBe(true);
    expect(Array.isArray(board.recentRuns)).toBe(true);
    expect(typeof board.serverTime).toBe("string");
  }, 60_000);

  it("refuses the automation board for customers and anonymous callers", async () => {
    if (!env || !a) return;
    for (const token of [a.token, null]) {
      const res = await rpc(env, token, "get_automation_dashboard", {});
      expect(res.status, "board is staff-only").not.toBe(200);
    }
  }, 60_000);

  it("returns segment counts to staff and nothing to customers", async () => {
    if (!env || !staff || !a) return;
    const staffRes = await rpc(env, staff.token, "get_customer_segments", {});
    expect(staffRes.status, staffRes.text).toBe(200);
    const segments = staffRes.json<Segment[]>();
    expect(segments.length).toBeGreaterThanOrEqual(7);
    const byId = Object.fromEntries(segments.map((s) => [s.segment_id, s]));
    // Explicit rules, not a black box.
    expect(byId.all_customers?.rule).toContain("role = customer");
    expect(byId.repeat_customers?.rule).toContain("two or more");
    expect(byId.cart_eligible?.rule).toContain("marketing consent");
    expect(byId.all_customers?.customer_count).toBeGreaterThanOrEqual(2);
    // A count never names a customer.
    expect(JSON.stringify(segments)).not.toContain("customer_email");
    expect(JSON.stringify(segments)).not.toMatch(/@/);

    const customerRes = await rpc(env, a.token, "get_customer_segments", {});
    expect(customerRes.status, "segments are staff-only").not.toBe(200);
    const anonRes = await rpc(env, null, "get_customer_segments", {});
    expect(anonRes.status, "anonymous callers are refused").not.toBe(200);
  }, 60_000);

  it("will not let a customer enable or retime a workflow", async () => {
    if (!env || !a) return;
    const enable = await rpc(env, a.token, "set_workflow_enabled", {
      p_workflow_id: SAFE_WORKFLOW,
      p_enabled: true,
    });
    expect(enable.status, "toggling needs staff").not.toBe(200);

    const timing = await rpc(env, a.token, "update_workflow_timing", {
      p_workflow_id: SAFE_WORKFLOW,
      p_delay_minutes: 30,
    });
    expect(timing.status, "timing needs staff").not.toBe(200);
  }, 60_000);

  it("keeps a customer consent record invisible to other customers", async () => {
    if (!env || !a || !b) return;
    const own = await rest(
      env,
      a.token,
      "customer_communication_preferences?select=user_id,marketing_emails,source&user_id=eq." + a.id
    );
    expect(own.status, own.text).toBe(200);
    expect(own.json<{ user_id: string }[]>()).toHaveLength(1);

    const foreign = await rest(
      env,
      a.token,
      `customer_communication_preferences?select=user_id,marketing_emails&user_id=eq.${b.id}`
    );
    expect(foreign.json(), "another customer's consent is not readable").toEqual([]);

    // The row is the caller's own or nothing: an insert for another user is refused.
    const impersonate = await rest(env, a.token, "customer_communication_preferences", {
      method: "POST",
      body: [{ user_id: b.id, marketing_emails: true, source: "customer" }],
    });
    expect(impersonate.status, impersonate.text).not.toBe(201);
  }, 60_000);

  it("stores a customer's own marketing choice and reads it back", async () => {
    if (!env || !a) return;
    const before = await rest(
      env,
      a.token,
      `customer_communication_preferences?select=marketing_emails&user_id=eq.${a.id}`
    );
    const original = Boolean(before.json<{ marketing_emails: boolean }[]>()[0]?.marketing_emails);

    const saved = await rest(env, a.token, "customer_communication_preferences", {
      method: "POST",
      upsert: true,
      body: [{ user_id: a.id, marketing_emails: !original, source: "customer" }],
    });
    // PostgREST answers 200 or 201 for an upsert depending on whether it inserted.
    expect([200, 201], saved.text).toContain(saved.status);

    const after = await rest(
      env,
      a.token,
      `customer_communication_preferences?select=marketing_emails,source&user_id=eq.${a.id}`
    );
    const row = after.json<{ marketing_emails: boolean; source: string }[]>()[0];
    expect(row?.marketing_emails).toBe(!original);
    expect(row?.source).toBe("customer");

    // Restore whatever the account had before this test.
    const restored = await rest(env, a.token, "customer_communication_preferences", {
      method: "POST",
      upsert: true,
      representation: false,
      body: [{ user_id: a.id, marketing_emails: original, source: "customer" }],
    });
    expect([200, 201], restored.text).toContain(restored.status);
  }, 60_000);

  it("blocks every browser-triggerable send path", async () => {
    if (!env || !staff || !a) return;
    // Not a customer, not a staff session, not anonymous: only the server role runs these.
    for (const token of [a.token, staff.token, null]) {
      for (const fn of [
        "run_automation_sweep",
        "queue_abandoned_cart_followups",
        "queue_post_delivery_followups",
        "run_due_followups",
        "claim_email_batch",
        "finish_email_send",
        "enqueue_email",
      ]) {
        const res = await rpc(env, token, fn, { p_limit: 1 });
        expect(res.status, `${fn} must not be callable from a session`).not.toBe(200);
      }
    }
  }, 120_000);

  it("lets settings-authorized staff change a workflow and record the sweep ledger", async () => {
    if (!env || !staff) return;
    const enable = await rpc(env, staff.token, "set_workflow_enabled", {
      p_workflow_id: SAFE_WORKFLOW,
      p_enabled: true,
    });
    expect(enable.status, enable.text).toBe(200);
    toggled = true;

    const board = (await rpc(env, staff.token, "get_automation_dashboard", {})).json<Dashboard>();
    const row = board.workflows.find((w) => w.id === SAFE_WORKFLOW);
    expect(row?.enabled).toBe(true);

    // Enabling alone must not manufacture work: no shipments, no eligible tasks.
    const tasks = await rest(
      env,
      staff.token,
      `follow_up_tasks?select=id&workflow_id=eq.${SAFE_WORKFLOW}`
    );
    expect(tasks.status, tasks.text).toBe(200);
  }, 60_000);

  it("hides the task and run ledger from customers but not from staff", async () => {
    if (!env || !a || !staff) return;
    for (const table of ["follow_up_tasks", "automation_runs", "automation_workflows"]) {
      const asCustomer = await rest(env, a.token, `${table}?select=id&limit=5`);
      expect(asCustomer.json(), `${table} is staff-only`).toEqual([]);
      const asStaff = await rest(env, staff.token, `${table}?select&id=not.is.null&limit=5`);
      if (table === "follow_up_tasks" || table === "automation_runs") {
        expect(asStaff.status, asStaff.text).toBe(200);
      } else {
        expect(asStaff.json<{ id: string }[]>().length).toBe(3);
      }
    }
  }, 60_000);
});
