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
 * Phase 5 transactional email queue.
 *
 * Business events must enqueue server-side and nothing else: a customer cannot
 * read the queue, cannot claim anyone else's rows, and cannot drive the worker
 * primitives from the browser. An order is placed for one throwaway account and
 * everything the test creates is removed again.
 */

const env = readSupabaseEnv();
const run = env ? describe : describe.skip;
const creds = suiteCredentials();

type QueueRow = {
  id: number;
  event_key: string;
  template: string;
  recipient_kind: "customer" | "staff";
  recipient_email: string | null;
  status: string;
  attempts: number;
  order_ref: string | null;
};

run("transactional email queue", () => {
  let a: Session | null = null;
  let b: Session | null = null;
  let staff: Session | null = null;
  let orderNumber = "";
  let orderId = "";
  let variantId = "";
  let productId = "";

  const queueFor = async (token: string | null) =>
    (
      await rest(env!, token, `email_outbox?select=id,event_key,template,recipient_kind,recipient_email,status,attempts,order_ref&order=id.asc`)
    ).json<QueueRow[]>();

  const queueForOrder = async (token: string | null, reference: string) =>
    (
      await rest(
        env!,
        token,
        `email_outbox?select=id,event_key,template,recipient_kind,recipient_email,status,attempts,order_ref&order_ref=eq.${reference}&order=id.asc`
      )
    ).json<QueueRow[]>();

  beforeAll(async () => {
    if (!env) return;
    const c = suiteCredentials();
    a = await login(env, c.aEmail, c.aPassword);
    b = await login(env, c.bEmail, c.bPassword);
    staff = await login(env, c.staffEmail, c.staffPassword);

    const products = await rest(env, a?.token ?? null, "products?select=id&active=eq.true&limit=1");
    productId = products.json<{ id: string }[]>()[0]?.id ?? "";
    const variants = await rest(
      env,
      a?.token ?? null,
      `product_variants?select=id,price,stock&product_id=eq.${productId}&active=eq.true&order=price.asc&limit=1`
    );
    variantId = variants.json<{ id: string }[]>()[0]?.id ?? "";
  }, 60_000);

  afterAll(async () => {
    if (!env || !a) return;
    // The queue holds no secrets and belongs to no one: a customer's DELETE
    // should remove nothing, so cleanup runs as staff.
    if (orderNumber) {
      const purge = await rest(env, staff?.token ?? null, `email_outbox?order_ref=eq.${orderNumber}`, {
        method: "DELETE",
      });
      expect([200, 204], purge.text).toContain(purge.status);
    }
  });

  it("needs two customers, a staff account and a priced variant", () => {
    if (!a || !b || !staff || !variantId) {
      reportSkip("suite sessions or catalogue rows unavailable");
      return;
    }
    expect(Boolean(a && b && staff)).toBe(true);
  });

  it("places an order and sees exactly one confirmation plus one staff notice", async () => {
    if (!env || !a || !staff || !variantId) return;

    // Recorded through the staff path rather than place_order on purpose: the
    // queue is driven by the orders INSERT trigger, and a real checkout would
    // deduct live stock that a test has no business consuming.
    const reference = `HMS-QAQUEUE-${Date.now().toString().slice(-6)}`;
    const created = await rest(env, staff.token, "orders", {
      method: "POST",
      body: [
        {
          order_number: reference,
          customer_id: a.id,
          customer_name: "Queue Fixture",
          customer_email: a.email,
          customer_phone: "+923000000001",
          shipping_address: { line1: "Queue Street 1", city: "Lahore", country: "Pakistan" },
          status: "Pending",
          payment_status: "Pending",
          payment_method: "Bank Transfer",
          subtotal: 5000,
          discount_amount: 0,
          shipping_cost: 250,
          total: 5250,
        },
      ],
    });
    expect(created.status, created.text).toBe(201);

    const rows = created.json<{ id: string; order_number: string }[]>();
    orderId = rows[0].id;
    orderNumber = rows[0].order_number;

    const queue = await queueForOrder(staff.token, orderNumber);
    const templates = queue.map((r) => r.template).sort();
    expect(templates).toEqual(["admin_new_order", "order_confirmation"]);
    expect(queue.every((r) => r.status === "pending")).toBe(true);

    const customerRow = queue.find((r) => r.recipient_kind === "customer");
    const staffRow = queue.find((r) => r.recipient_kind === "staff");
    expect(customerRow?.recipient_email?.toLowerCase()).toBe(a.email.toLowerCase());
    // Staff rows deliberately carry no address: the worker resolves the inbox.
    expect(staffRow?.recipient_email).toBe(null);
  }, 60_000);

  it("customers cannot read the queue at all", async () => {
    if (!env || !a || !b) return;
    for (const session of [a, b]) {
      const rows = await queueFor(session.token);
      expect(rows, "queue contents are staff-only").toEqual([]);
    }
  });

  it("a customer may only claim their own queued messages", async () => {
    if (!env || !a || !b || !orderNumber) return;

    // B can call the self-claim RPC but must receive nothing: the rows belong to A.
    const wrong = await rpc(env, b.token, "claim_email_batch_for_self", { p_limit: 5 });
    expect(wrong.status, wrong.text).toBe(200);
    expect(wrong.json<QueueRow[]>(), "no foreign rows may be claimed").toEqual([]);

    // A can claim their own, and every returned row carries A's address.
    const mine = await rpc(env, a.token, "claim_email_batch_for_self", { p_limit: 5 });
    expect(mine.status, mine.text).toBe(200);
    const claimed = mine.json<QueueRow[]>();
    expect(claimed.length).toBeGreaterThan(0);
    for (const row of claimed) {
      expect(row.recipient_kind).toBe("customer");
      expect(row.recipient_email?.toLowerCase()).toBe(a.email.toLowerCase());
      expect(row.status).toBe("sending");
    }
  }, 60_000);

  it("the queue worker primitives are not reachable from the browser", async () => {
    if (!env) return;
    const tokens = [env.key, a?.token ?? env.key, staff?.token ?? env.key];
    for (const [fn, payload] of [
      ["claim_email_batch", { p_limit: 1 }],
      ["finish_email_send", { p_id: 1, p_status: "sent" }],
    ] as const) {
      for (const token of tokens) {
        const res = await rpc(env, token, fn, payload as Record<string, unknown>);
        expect([401, 403, 404], `${fn} via ${token === env.key ? "anon" : "session"}`).toContain(res.status);
      }
    }
  });

  it("the stats view is scoped: staff see counts, a customer sees none", async () => {
    if (!env || !staff || !a) return;
    const asStaff = await rpc(env, staff.token, "get_email_queue_stats", {});
    expect(asStaff.status, asStaff.text).toBe(200);
    const totals = asStaff.json<{ queue_status: string; row_count: number }[]>();
    expect(totals.some((t) => t.queue_status === "sending")).toBe(true);

    const asCustomer = await rpc(env, a.token, "get_email_queue_stats", {});
    expect(asCustomer.status, asCustomer.text).toBe(200);
    expect(asCustomer.json(), "RLS gives a customer no queue rows to count").toEqual([]);
  });

  it("a second update with the same status does not enqueue a duplicate", async () => {
    if (!env || !staff || !orderNumber || !orderId) return;
    const before = await queueForOrder(staff.token, orderNumber);
    const beforeConfirmations = before.filter((r) => r.template === "order_confirmation").length;

    for (let i = 0; i < 2; i += 1) {
      const updated = await rest(
        env,
        staff.token,
        `orders?id=eq.${orderId}`,
        { method: "PATCH", body: { status: "Shipped", courier_name: "Queue Fixture Courier", tracking_id: `TQ${i}` } }
      );
      expect([200, 204, 206], updated.text).toContain(updated.status);
    }

    const after = await queueForOrder(staff.token, orderNumber);
    expect(after.filter((r) => r.template === "order_confirmation").length).toBe(beforeConfirmations);
    const shipped = after.filter((r) => r.template === "order_shipped");
    // Repeating a status never re-sends; the first Shipped transition produced one row.
    expect(shipped.length).toBe(1);
  }, 60_000);

  it("removes every row the suite created", async () => {
    if (!env || !staff || !orderNumber || !orderId) return;
    const purge = await rest(env, staff.token, `email_outbox?order_ref=eq.${orderNumber}`, { method: "DELETE" });
    expect([200, 204], purge.text).toContain(purge.status);
    const left = await queueForOrder(staff.token, orderNumber);
    expect(left).toEqual([]);

    // The fixture order must not linger in the store's records — including the
    // staff and customer notification rows its triggers produced.
    const notices = await rest(
      env,
      staff.token,
      `notifications?or=(title.ilike.%2A${orderNumber}%2A,message.ilike.%2A${orderNumber}%2A)`,
      { method: "DELETE" }
    );
    expect([200, 204], notices.text).toContain(notices.status);

    const history = await rest(env, staff.token, `order_status_history?order_id=eq.${orderId}`, { method: "DELETE" });
    expect([200, 204], history.text).toContain(history.status);
    const notes = await rest(env, staff.token, `order_internal_notes?order_id=eq.${orderId}`, { method: "DELETE" });
    expect([200, 204], notes.text).toContain(notes.status);
    const payments = await rest(env, staff.token, `payments?order_id=eq.${orderId}`, { method: "DELETE" });
    expect([200, 204], payments.text).toContain(payments.status);
    const items = await rest(env, staff.token, `order_items?order_id=eq.${orderId}`, { method: "DELETE" });
    expect([200, 204], items.text).toContain(items.status);
    const removed = await rest(env, staff.token, `orders?id=eq.${orderId}`, { method: "DELETE" });
    expect([200, 204], removed.text).toContain(removed.status);

    const check = await rest(env, staff.token, `orders?select=id&id=eq.${orderId}`);
    expect(check.json()).toEqual([]);
  }, 60_000);
});
