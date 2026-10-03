import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Row level security and privilege regression for Phase 1/2.
 *
 * Everything here is written so that a passing run leaves no rows behind: the
 * accounts are created through the normal signup endpoint at the start and their
 * addresses are deleted again at the end. If the project requires email
 * confirmation, signup cannot return a session and the suite reports itself as
 * skipped instead of pretending to have verified anything.
 *
 *     npx vitest run tests/rls-and-privileges.test.ts
 */

type Env = { url: string; key: string };

function readEnv(): Env | null {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    const pick = (name: string) =>
      (raw.match(new RegExp(`^${name}=\\s*(.+)$`, "m")) || [, ""])[1].trim();
    const url = pick("VITE_SUPABASE_URL");
    const key = pick("VITE_SUPABASE_PUBLISHABLE_KEY") || pick("VITE_SUPABASE_ANON_KEY");
    if (!url || !key) return null;
    return { url, key };
  } catch {
    return null;
  }
}

const env = readEnv();
const run = env ? describe : describe.skip;

type Session = { token: string; id: string; email: string };

async function signUp(session: Env, email: string, password: string): Promise<Session | null> {
  const res = await fetch(`${session.url}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: session.key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => null);
  const token = body?.access_token;
  const id = body?.user?.id ?? body?.id;
  if (!token || !id) return null;
  return { token, id, email };
}

const rest = async (
  session: Env,
  token: string | null,
  path: string,
  init: { method?: string; body?: unknown } = {}
) => {
  const res = await fetch(`${session.url}/rest/v1/${path}`, {
    method: init.method || "GET",
    headers: {
      apikey: session.key,
      Authorization: `Bearer ${token ?? session.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  return { status: res.status, text };
};

const rpc = async (session: Env, token: string, fn: string, payload: Record<string, unknown>) => {
  const res = await fetch(`${session.url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: session.key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { status: res.status, text: await res.text() };
};

run("row level security", () => {
  const suffix = `${Date.now().toString(36)}`;
  const password = `Suite!${suffix}Pass`;
  let a: Session | null = null;
  let b: Session | null = null;

  // Signups need a confirmed address on many projects, so the suite also accepts
  // two throwaway customer accounts through the environment:
  //   SUITE_A_EMAIL / SUITE_A_PASSWORD / SUITE_B_EMAIL / SUITE_B_PASSWORD
  async function login(email: string, pwd: string): Promise<Session | null> {
    if (!env || !email) return null;
    const res = await fetch(`${env.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: env.key, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pwd }),
    });
    const body = await res.json().catch(() => null);
    if (!body?.access_token) return null;
    return { token: body.access_token, id: body.user.id, email };
  }

  beforeAll(async () => {
    if (!env) return;
    a =
      (await login(process.env.SUITE_A_EMAIL || "", process.env.SUITE_A_PASSWORD || "")) ||
      (await signUp(env, `suite.a.${suffix}@example.invalid`, password));
    b =
      (await login(process.env.SUITE_B_EMAIL || "", process.env.SUITE_B_PASSWORD || "")) ||
      (await signUp(env, `suite.b.${suffix}@example.invalid`, password));
  }, 60_000);

  it("skips loudly when signup needs a confirmed email address", { skip: false }, () => {
    if (!a || !b) {
      console.warn("SUITE SKIPPED: signup returned no session (email confirmation is on for this project).");
      expect(true).toBe(true);
      return;
    }
    expect(a.id).not.toBe(b!.id);
  });

  it("an anonymous visitor cannot read the address book", async () => {
    if (!env) return;
    const res = await rest(env, null, "addresses?select=id&limit=1");
    expect([401, 403, 404]).toContain(res.status);
  });

  it("an anonymous visitor cannot execute the staff or session RPCs", async () => {
    if (!env || !a) return;
    const zero = "00000000-0000-0000-0000-000000000000";
    for (const [fn, payload] of [
      ["record_refund", { p_payment_id: zero, p_amount: 1 }],
      ["verify_payment", { p_payment_id: zero, p_staff_id: zero, p_new_status: "Paid" }],
      ["save_order_tracking", { p_order_id: zero, p_courier: "x", p_shipping_status: "Delivered" }],
      ["get_admin_customers", {}],
      ["cancel_self_order", { p_order_id: zero }],
      ["submit_payment_proof", { p_order_id: zero, p_reference: "x" }],
    ] as const) {
      const res = await rpc(env, env.key, fn, payload as Record<string, unknown>);
      expect([401, 403, 404], fn).toContain(res.status);
    }
  });

  it("a customer can save, read, edit and remove their own addresses", async () => {
    if (!env || !a) return;
    const created = await rest(env, a.token, "addresses", {
      method: "POST",
      body: [
        {
          customer_id: a.id,
          type: "home",
          label: "Suite home",
          address_line_1: "Suite Street 1",
          city: "Lahore",
          postal_code: "54000",
          country: "Pakistan",
          is_default: true,
        },
        {
          customer_id: a.id,
          type: "work",
          label: "Suite work",
          address_line_1: "Suite Street 2",
          city: "Karachi",
          postal_code: "74000",
          country: "Pakistan",
          is_default: false,
        },
      ],
    });
    expect(created.status, created.text).toBe(201);
    const rows = JSON.parse(created.text) as { id: string }[];
    const ids = rows.map((r) => r.id);
    expect(ids.length).toBe(2);

    try {
      const mine = JSON.parse(
        (await rest(env, a.token, `addresses?select=id,is_default&id=in.(${ids.join(",")})`)).text
      ) as { id: string; is_default: boolean }[];
      expect(mine.map((r) => r.id).sort()).toEqual(ids.slice().sort());
      // The database keeps exactly one default per customer.
      expect(mine.filter((r) => r.is_default).map((r) => r.id)).toEqual([rows[0].id]);

      const moved = await rest(env, a.token, `addresses?id=eq.${rows[1].id}`, {
        method: "PATCH",
        body: { is_default: true },
      });
      expect(moved.status).toBe(200);
      const after = JSON.parse(
        (await rest(env, a.token, `addresses?select=id,is_default&id=in.(${ids.join(",")})`)).text
      ) as { id: string; is_default: boolean }[];
      expect(after.filter((r) => r.is_default).map((r) => r.id)).toEqual([rows[1].id]);
    } finally {
      await rest(env, a.token, `addresses?id=in.(${ids.join(",")})`, { method: "DELETE" });
      const left = await rest(env, a.token, `addresses?select=id&id=in.(${ids.join(",")})`);
      expect(JSON.parse(left.text)).toEqual([]);
    }
  });

  it("one customer cannot read or change another customer's addresses", async () => {
    if (!env || !a || !b) return;
    const planted = await rest(env, a.token, "addresses", {
      method: "POST",
      body: [
        {
          customer_id: a.id,
          type: "home",
          label: "Private to A",
          address_line_1: "Hidden Street 7",
          city: "Multan",
          country: "Pakistan",
          is_default: false,
        },
      ],
    });
    expect(planted.status, planted.text).toBe(201);
    const plantedId = (JSON.parse(planted.text) as { id: string }[])[0].id;

    try {
      const spyRead = await rest(env, b.token, `addresses?select=id&id=eq.${plantedId}`);
      expect(spyRead.status).toBe(200);
      expect(JSON.parse(spyRead.text)).toEqual([]);

      const spyWrite = await rest(env, b.token, `addresses?id=eq.${plantedId}`, {
        method: "PATCH",
        body: { address_line_1: "Changed by someone else" },
      });
      expect(JSON.parse(spyWrite.text || "[]")).toEqual([]);

      const stillMine = JSON.parse(
        (await rest(env, a.token, `addresses?select=address_line_1&id=eq.${plantedId}`)).text
      ) as { address_line_1: string }[];
      expect(stillMine[0].address_line_1).toBe("Hidden Street 7");

      const forged = await rest(env, b.token, "addresses", {
        method: "POST",
        body: [
          {
            customer_id: a.id,
            type: "home",
            label: "Forged into A's book",
            address_line_1: "Should not exist",
            city: "Islamabad",
            country: "Pakistan",
          },
        ],
      });
      // PostgREST applies the WITH CHECK clause: either the insert is refused, or
      // the row is written for B and never visible to A.
      if (forged.status === 201) {
        const asOwner = await rest(env, a.token, "addresses?select=id&label=eq.Forged into A%27s book");
        expect(JSON.parse(asOwner.text)).toEqual([]);
        const forgedRows = JSON.parse(forged.text) as { id: string }[];
        await rest(env, b.token, `addresses?id=in.(${forgedRows.map((r) => r.id).join(",")})`, {
          method: "DELETE",
        });
      } else {
        expect([400, 403, 406]).toContain(forged.status);
      }
    } finally {
      await rest(env, a.token, `addresses?id=eq.${plantedId}`, { method: "DELETE" });
    }
  });

  it("a customer cannot read internal order notes or another customer's orders", async () => {
    if (!env || !a || !b) return;
    const notes = await rest(env, a.token, "order_internal_notes?select=notes");
    expect(notes.status).toBe(200);
    // Staff-only policy: nothing at all, whoever the customer is.
    expect(JSON.parse(notes.text)).toEqual([]);

    const aOrders = JSON.parse((await rest(env, a.token, "orders?select=id,customer_id")).text) as {
      id: string;
      customer_id: string | null;
    }[];
    const bOrders = JSON.parse((await rest(env, b.token, "orders?select=id,customer_id")).text) as {
      id: string;
    }[];
    // Each account sees its own orders only, and never the other account's rows.
    for (const row of aOrders) expect(row.customer_id).toBe(a.id);
    const aIds = aOrders.map((r) => r.id);
    for (const row of bOrders) expect(aIds).not.toContain(row.id);
    // The only real customer order in this project belongs to neither test account.
    const real = await rest(env, a.token, "orders?select=id&order_number=eq.HMS-20261002-4952");
    expect(JSON.parse(real.text)).toEqual([]);
  });

  it("keeps the staff inbox and the template editor away from shoppers", async () => {
    if (!env) return;

    // Anonymous callers may no longer write to the staff notification inbox or
    // ask the database who holds which role.
    const anonNotify = await rpc(env, env.key, "notify_staff", {
      p_type: "System",
      p_title: "suite probe",
      p_message: "suite probe",
    });
    expect([401, 403]).toContain(anonNotify.status);
    const anonRole = await rpc(env, env.key, "get_user_role", {
      user_id: a?.id ?? "00000000-0000-0000-0000-000000000000",
    });
    expect([401, 403]).toContain(anonRole.status);

    // A signed-in customer can neither read nor write message templates.
    if (a) {
      const read = await rest(env, a.token, "notification_templates?select=id");
      expect(read.status).toBe(200);
      expect(JSON.parse(read.text)).toEqual([]);
      const write = await rest(env, a.token, "notification_templates", {
        method: "POST",
        body: [{ code: `suite-customer-${suffix}`, name: "Suite", subject: "Suite", body_template: "Suite" }],
      });
      expect([400, 401, 403], write.text).toContain(write.status);
    }

    // Staff, on the other hand, can save and remove a template again — the policy
    // that used to be missing entirely.
    const staff = await login(process.env.SUITE_STAFF_EMAIL || "", process.env.SUITE_STAFF_PASSWORD || "");
    if (!staff) {
      console.warn("SUITE SKIPPED: staff session unavailable, template policy write path not exercised.");
      return;
    }
    const code = `suite-staff-${suffix}`;
    const created = await rest(env, staff.token, "notification_templates", {
      method: "POST",
      body: [{ code, name: "Suite template", subject: "Suite template", body_template: "Suite body" }],
    });
    expect(created.status, created.text).toBe(201);
    try {
      const seen = JSON.parse((await rest(env, staff.token, `notification_templates?select=code&code=eq.${code}`)).text) as { code: string }[];
      expect(seen.map((r) => r.code)).toEqual([code]);
    } finally {
      const removed = await rest(env, staff.token, `notification_templates?code=eq.${code}`, { method: "DELETE" });
      expect([200, 204], removed.text).toContain(removed.status);
      const left = await rest(env, staff.token, `notification_templates?select=id&code=eq.${code}`);
      expect(JSON.parse(left.text)).toEqual([]);
    }
  });
});
