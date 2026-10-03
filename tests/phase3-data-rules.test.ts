import { beforeAll, describe, expect, it } from "vitest";
import {
  login,
  readSupabaseEnv,
  reportSkip,
  rest,
  rpc,
  suiteCredentials,
  signUp,
  type Env,
  type Session,
} from "./support/harness";

/**
 * Phase 3 moderation, cart-recovery and notification rules, exercised against the
 * real database the way the browser does it: a customer's own submission, the
 * staff-only recovery RPC, and who may read which notification.
 *
 *     SUITE_A_EMAIL=... SUITE_A_PASSWORD=... \
 *     SUITE_B_EMAIL=... SUITE_B_PASSWORD=... \
 *     [SUITE_STAFF_EMAIL=... SUITE_STAFF_PASSWORD=...] \
 *     npx vitest run tests/phase3-data-rules.test.ts
 *
 * Signup on this project needs a confirmed address, so without the environment
 * accounts the suite reports that it skipped. Every row this suite writes belongs to
 * one of the suite accounts and is removed again by the same case; no other record is
 * touched.
 */

const env: Env | null = readSupabaseEnv();
const creds = suiteCredentials();
const run =
  env && creds.aEmail && creds.aPassword && creds.bEmail && creds.bPassword ? describe : describe.skip;

const uuidZero = "00000000-0000-4000-9000-000000000000";

run("phase 3 moderation, recovery and notification rules", () => {
  let a: Session | null = null;
  let b: Session | null = null;
  let staff: Session | null = null;
  let products: string[] = [];
  let nextProduct = 0;

  beforeAll(async () => {
    if (!env) return;
    a = (await login(env, creds.aEmail, creds.aPassword)) || null;
    b = (await login(env, creds.bEmail, creds.bPassword)) || null;
    if (!a || !b) {
      const suffix = Date.now().toString(36);
      a = a || (await signUp(env, `p3.a.${suffix}@example.invalid`, `Suite!${suffix}x`));
      b = b || (await signUp(env, `p3.b.${suffix}@example.invalid`, `Suite!${suffix}x`));
    }
    if (creds.staffEmail && creds.staffPassword) {
      staff = (await login(env, creds.staffEmail, creds.staffPassword)) || null;
    }
    if (!a || !b) {
      reportSkip("no customer sessions available (signup needs a confirmed email address).");
      return;
    }
    const rows = await rest(env, null, "products?select=id&active=eq.true&limit=50");
    products = rows.json<{ id: string }[]>().map((r) => r.id);
    if (!products.length) reportSkip("the catalogue has no active product to review.");
  }, 60_000);

  /** Removes whatever the suite accounts left on one product from an earlier case. */
  async function clearSuiteReviews(productId: string) {
    for (const owner of [a, b]) {
      if (!owner) continue;
      const found = await rest(env!, owner.token, `reviews?select=id,status&product_id=eq.${productId}`);
      for (const row of found.json<{ id: string; status: string }[]>()) {
        const mine = await rest(env!, owner.token, `reviews?id=eq.${row.id}`, { method: "DELETE" });
        if (mine.json<{ id: string }[]>().length === 0 && staff) {
          await rest(env!, staff.token, `reviews?id=eq.${row.id}`, { method: "DELETE" });
        }
      }
    }
  }

  /**
   * Creates one Pending review as the customer, runs the case against its id and
   * guarantees the row is gone again afterwards.
   */
  async function withReview(
    title: string,
    overrides: Record<string, unknown>,
    body: (id: string, productId: string) => Promise<void>
  ) {
    const productId = products[nextProduct++ % products.length];
    expect(productId, "no active product to attach a suite review to").toBeTruthy();
    await clearSuiteReviews(productId);

    const created = await rest(env!, a!.token, "reviews", {
      method: "POST",
      body: [
        {
          product_id: productId,
          customer_name: "Phase 3 Suite",
          customer_email: a!.email,
          rating: 5,
          title,
          comment: "Suite fixture row. It is removed again when the case ends.",
          status: "Pending",
          ...overrides,
        },
      ],
    });
    expect(created.status, created.text).toBe(201);
    const id = created.json<{ id: string }[]>()[0].id;

    try {
      await body(id, productId);
    } finally {
      await clearSuiteReviews(productId);
    }
  }

  it("needs two customer sessions and a usable catalogue", () => {
    expect(Boolean(a && b), "customer sessions unavailable — see the skip notice").toBe(true);
    expect(products.length).toBeGreaterThan(0);
  });

  it("stores a customer submission as Pending even when Approved is requested", async () => {
    if (!env || !a) return;
    await withReview(`suite-self-approve-${Date.now()}`, { status: "Approved", verified_purchase: true }, async (id) => {
      const stored = await rest(
        env,
        a!.token,
        `reviews?select=id,status,verified_purchase,user_id,customer_email&id=eq.${id}`
      );
      const [row] = stored.json<
        { status: string; verified_purchase: boolean; user_id: string; customer_email: string }[]
      >();
      expect(row.status).toBe("Pending");
      expect(row.user_id).toBe(a!.id);
      // A purchase claim cannot be typed in either; it is derived from real orders.
      expect(row.verified_purchase).toBe(false);
      expect(row.customer_email).toBe(a!.email);
    });
  });

  it("does not leak an unapproved review to the public or to another customer", async () => {
    if (!env || !a || !b) return;
    await withReview(`suite-private-${Date.now()}`, {}, async (id) => {
      expect((await rest(env, null, `reviews?select=id&id=eq.${id}`)).json()).toEqual([]);
      expect((await rest(env, b!.token, `reviews?select=id&id=eq.${id}`)).json()).toEqual([]);
      expect((await rest(env, a!.token, `reviews?select=id&id=eq.${id}`)).json()).toHaveLength(1);
    });
  });

  it("refuses a second review from the same customer for the same fragrance", async () => {
    if (!env || !a) return;
    const productId = products[nextProduct++ % products.length];
    await clearSuiteReviews(productId);
    try {
      const first = await rest(env, a.token, "reviews", {
        method: "POST",
        body: [
          {
            product_id: productId,
            customer_name: "Phase 3 Suite",
            customer_email: a.email,
            rating: 5,
            title: `suite-first-${Date.now()}`,
            comment: "First submission for this fragrance.",
            status: "Pending",
          },
        ],
      });
      expect(first.status, first.text).toBe(201);

      const again = await rest(env, a.token, "reviews", {
        method: "POST",
        body: [
          {
            product_id: productId,
            customer_name: "Phase 3 Suite",
            customer_email: a.email,
            rating: 4,
            title: `suite-second-${Date.now()}`,
            comment: "Second submission for the same fragrance.",
            status: "Pending",
          },
        ],
      });
      expect(again.status).toBe(409);
      expect(again.text).toContain("uniq_review_customer_product");
    } finally {
      await clearSuiteReviews(productId);
    }
  });

  it("refuses a rating outside the 1-5 scale", async () => {
    if (!env || !a) return;
    const productId = products[nextProduct++ % products.length];
    const bad = await rest(env, a.token, "reviews", {
      method: "POST",
      body: [
        {
          product_id: productId,
          customer_name: "Phase 3 Suite",
          customer_email: a.email,
          rating: 9,
          title: `suite-rating-${Date.now()}`,
          comment: "Rating above the permitted maximum.",
          status: "Pending",
        },
      ],
    });
    expect(bad.status).toBe(400);
    expect(bad.text).toContain("reviews_rating_check");
    await clearSuiteReviews(productId);
  });

  it("will not let a customer approve their own review", async () => {
    if (!env || !a) return;
    await withReview(`suite-self-moderate-${Date.now()}`, {}, async (id) => {
      const attempt = await rest(env, a!.token, `reviews?id=eq.${id}`, {
        method: "PATCH",
        body: { status: "Approved" },
      });
      expect(attempt.json()).toEqual([]);
      const after = await rest(env, a!.token, `reviews?select=status&id=eq.${id}`);
      expect(after.json<{ status: string }[]>()[0].status).toBe("Pending");
    });
  });

  it("lets the author withdraw a Pending review but never another customer's", async () => {
    if (!env || !a || !b) return;
    await withReview(`suite-withdraw-${Date.now()}`, {}, async (id) => {
      expect((await rest(env, b!.token, `reviews?id=eq.${id}`, { method: "DELETE" })).json()).toEqual([]);
      const withdrawn = await rest(env, a!.token, `reviews?id=eq.${id}`, { method: "DELETE" });
      expect(withdrawn.status, withdrawn.text).toBe(200);
      expect(withdrawn.json<{ id: string }[]>()).toHaveLength(1);
      expect((await rest(env, a!.token, `reviews?select=id&id=eq.${id}`)).json()).toEqual([]);
    });
  });

  it("publishes on staff approval and keeps a rejected review private", async () => {
    if (!env || !a || !staff) {
      reportSkip("SUITE_STAFF_EMAIL / SUITE_STAFF_PASSWORD not supplied — moderation path not exercised.");
      return;
    }
    await withReview(`suite-moderate-${Date.now()}`, {}, async (id) => {
      const approved = await rest(env, staff!.token, `reviews?id=eq.${id}`, {
        method: "PATCH",
        body: { status: "Approved" },
      });
      expect(approved.status, approved.text).toBe(200);
      expect((await rest(env, null, `reviews?select=id,status&id=eq.${id}`)).json()).toEqual([
        { id, status: "Approved" },
      ]);

      const rejected = await rest(env, staff!.token, `reviews?id=eq.${id}`, {
        method: "PATCH",
        body: { status: "Rejected" },
      });
      expect(rejected.status).toBe(200);
      expect((await rest(env, null, `reviews?select=id&id=eq.${id}`)).json()).toEqual([]);
    });
  });

  it("refuses cart recovery to a customer and to an anonymous visitor", async () => {
    if (!env || !a) return;
    const asCustomer = await rpc(env, a.token, "mark_cart_recovery", {
      p_cart_id: uuidZero,
      p_action: "reminder",
    });
    expect(asCustomer.status).toBe(400);
    expect(asCustomer.text).toContain("Only staff members");

    const asAnon = await rpc(env, null, "mark_cart_recovery", {
      p_cart_id: uuidZero,
      p_action: "reminder",
    });
    expect([401, 403, 404]).toContain(asAnon.status);

    const queueAsCustomer = await rpc(env, a.token, "get_abandoned_carts", { p_hours: 24 });
    expect(queueAsCustomer.status).toBe(400);
    expect(queueAsCustomer.text).toContain("Only staff members");
  });

  it("records one reminder per bag, refuses the second, and will not invent a recovery", async () => {
    if (!env || !b || !staff) {
      reportSkip("SUITE_B_* and SUITE_STAFF_* credentials are needed for the recovery path.");
      return;
    }
    // Customer B owns the bag: B has ordered nothing, so "recovered" must be refused
    // on evidence rather than accepted. A customer owns exactly one bag, so an
    // existing bag is reused and only one created here is deleted afterwards.
    const existing = await rest(env, b.token, `cart?select=id&user_id=eq.${b.id}`);
    let cartId = existing.json<{ id: string }[]>()[0]?.id;
    let createdHere = false;
    if (!cartId) {
      const cart = await rest(env, b.token, "cart", { method: "POST", body: [{ user_id: b.id }] });
      expect(cart.status, cart.text).toBe(201);
      cartId = cart.json<{ id: string }[]>()[0].id;
      createdHere = true;
    }

    // Any earlier reminder must be cleared first or the duplicate guard fires early.
    await rpc(env, staff.token, "mark_cart_recovery", { p_cart_id: cartId, p_action: "reset" });

    try {
      const first = await rpc(env, staff.token, "mark_cart_recovery", {
        p_cart_id: cartId,
        p_action: "reminder",
      });
      expect(first.status, first.text).toBe(200);

      const second = await rpc(env, staff.token, "mark_cart_recovery", {
        p_cart_id: cartId,
        p_action: "reminder",
      });
      expect(second.status).toBe(400);
      expect(second.text).toContain("already sent");

      const recovered = await rpc(env, staff.token, "mark_cart_recovery", {
        p_cart_id: cartId,
        p_action: "recovered",
      });
      expect(recovered.status).toBe(400);
      expect(recovered.text).toContain("cannot be marked recovered");

      const cleared = await rpc(env, staff.token, "mark_cart_recovery", {
        p_cart_id: cartId,
        p_action: "reset",
      });
      expect(cleared.status, cleared.text).toBe(200);

      const check = await rest(env, staff.token, `cart?select=reminder_sent_at,recovered_at&id=eq.${cartId}`);
      const [row] = check.json<{ reminder_sent_at: string | null; recovered_at: string | null }[]>();
      expect(row.reminder_sent_at).toBeNull();
      expect(row.recovered_at).toBeNull();
    } finally {
      if (createdHere) await rest(env, b.token, `cart?id=eq.${cartId}`, { method: "DELETE" });
    }
  });

  it("hides internal notifications from customers and keeps ownership scoped", async () => {
    if (!env || !a || !b) return;
    const internal = await rest(env, a.token, "notifications?select=id&user_id=is.null");
    expect(internal.status).toBe(200);
    expect(internal.json()).toEqual([]);

    const mine = await rest(env, a.token, "notifications?select=id,user_id");
    const myRows = mine.json<{ id: string; user_id: string | null }[]>();
    for (const row of myRows) expect(row.user_id).toBe(a.id);

    const theirs = await rest(env, b.token, "notifications?select=id");
    const theirIds = theirs.json<{ id: string }[]>().map((r) => r.id);
    for (const row of myRows) expect(theirIds).not.toContain(row.id);

    if (staff) {
      const staffRead = await rest(env, staff.token, "notifications?select=id&user_id=is.null&limit=1");
      expect(staffRead.status, staffRead.text).toBe(200);
    }
  });
});
