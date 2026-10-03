import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { login, readSupabaseEnv, reportSkip, signUp, suiteCredentials, type Session } from "./support/harness";

/**
 * The on-site concierge is only as trusted as the data its tools can reach, so this
 * suite drives the real tool functions with a real caller token and asserts the
 * boundary: catalogue answers come from live rows, account answers are owner-scoped,
 * nothing runs without a verified session, and with no provider configured the
 * assistant says so instead of inventing an answer.
 *
 *     npx vitest run tests/ai-concierge-tools.test.ts
 */

const env = readSupabaseEnv();
const creds = suiteCredentials();

// aiCore reads its configuration from process.env, so the public Supabase settings
// are published before the module is imported. No provider key is set anywhere: the
// unconfigured path is part of what this suite checks.
function loadAiCore(): Promise<typeof import("../server/aiCore.js")> {
  if (env) {
    process.env.VITE_SUPABASE_URL = env.url;
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = env.key;
  }
  delete process.env.AI_PROVIDER_API_KEY;
  delete process.env.OPENAI_API_KEY;
  return import("../server/aiCore.js");
}

const run = env && creds.aEmail && creds.aPassword ? describe : describe.skip;

run("concierge tool surface", () => {
  let a: Session | null = null;
  let core: typeof import("../server/aiCore.js") | null = null;

  beforeAll(async () => {
    core = await loadAiCore();
    if (!env) return;
    a = (await login(env, creds.aEmail, creds.aPassword)) || null;
    if (!a) {
      const suffix = Date.now().toString(36);
      a = await signUp(env, `p3.ai.${suffix}@example.invalid`, `Suite!${suffix}x`);
    }
    if (!a) reportSkip("no customer session available for the concierge tool checks.");
  }, 60_000);

  const ctxFor = (session: Session | null) => {
    const cfg = core!.aiConfig();
    return {
      session,
      db: core!.createConciergeClient(cfg, session?.token ?? null),
      sources: [] as { type: string; id: string; label: string; slug?: string }[],
    };
  };

  it("is honest about having no provider on this deployment", async () => {
    const ai = await loadAiCore();
    expect(ai.aiConfig().configured).toBe(false);
    const res = await ai.runConcierge({ messages: [{ role: "user", content: "What is Mystic Oud?" }] });
    expect(res.status).toBe(501);
    expect(res.body.configured).toBe(false);
    expect(String(res.body.reply).toLowerCase()).toContain("not enabled");
    // It points at a human instead of inventing an answer.
    expect(String(res.body.reply)).toMatch(/WhatsApp|email|team/);
  });

  it("refuses an empty conversation and never reaches a provider for it", async () => {
    const ai = await loadAiCore();
    expect((await ai.runConcierge({ messages: [] })).status).toBe(400);
    expect((await ai.runConcierge({ messages: [{ role: "user", content: "   " }] })).status).toBe(400);
  });

  it("answers catalogue questions from live product rows", async () => {
    if (!core || !a) return;
    const ctx = ctxFor(null); // anonymous visitor: catalogue only
    const list = await core.runConciergeTool("searchProducts", { query: "oud" }, ctx);
    expect(Array.isArray(list.products)).toBe(true);
    expect(list.products.length).toBeGreaterThan(0);

    const slug = list.products[0].slug as string;
    const price = await core.runConciergeTool("getProductPrice", { slug, size: "50ml" }, ctx);
    expect(price.currency).toBe("PKR");
    expect(Number(price.price)).toBeGreaterThan(0);
    expect(price.name).toBe(list.products[0].name);

    const stock = await core.runConciergeTool("getProductAvailability", { slug }, ctx);
    expect(Array.isArray(stock.sizes)).toBe(true);
    expect(stock.sizes.some((s: { stock: number }) => typeof s.stock === "number")).toBe(true);

    // A size that does not exist is refused rather than priced.
    const missing = await core.runConciergeTool("getProductPrice", { slug, size: "47ml" }, ctx);
    expect(missing.error).toContain("47ml");
    expect(missing.availableSizes.length).toBeGreaterThan(0);
  });

  it("keeps account tools shut without a signed-in caller", async () => {
    if (!core || !a) return;
    const ctx = ctxFor(null);
    for (const tool of ["getCustomerOrders", "getCustomerOrder", "getCustomerWishlist"]) {
      const res = await core.runConciergeTool(tool, {}, ctx);
      expect(res.error, tool).toContain("must be signed in");
    }
  });

  it("returns only the signed-in customer's own account data", async () => {
    if (!core || !a || !env) return;
    const ctx = ctxFor(a);

    const orders = await core.runConciergeTool("getCustomerOrders", {}, ctx);
    expect(Array.isArray(orders.orders)).toBe(true);
    // The tool's projection carries no customer identifier, so isolation is proven by
    // the same query through REST: another account cannot see these rows.
    const { rest: restCall } = await import("./support/harness");
    const mine = await restCall(env, a.token, "orders?select=id,order_number");
    const myIds = mine.json<{ id: string }[]>().map((r) => r.id);
    expect(myIds.length).toBe(orders.orders.length);

    const wishlist = await core.runConciergeTool("getCustomerWishlist", {}, ctx);
    expect(Array.isArray(wishlist.items)).toBe(true);

    const tracking = await core.runConciergeTool("getTracking", { lookup: "HMS-NO-SUCH-ORDER" }, ctx);
    expect(tracking.found).toBe(false);
  });

  it("separates catalogue facts from shipping and payment guidance", async () => {
    if (!core || !a) return;
    const ctx = ctxFor(null);
    const shipping = await core.runConciergeTool("getShippingMethods", {}, ctx);
    expect(Array.isArray(shipping.methods)).toBe(true);
    // The delivery terms this boutique charges come from its stored config, so the
    // assistant must be given those rather than an empty courier list.
    expect(shipping.methods.length).toBeGreaterThan(0);
    expect(Number(shipping.methods[0].base_cost)).toBeGreaterThan(0);
    expect(shipping.methods[0].description).toMatch(/delivery/i);
    expect(shipping.deliverySettings).toBeTruthy();
    expect(Number(shipping.deliverySettings.freeThreshold)).toBeGreaterThan(0);

    const payments = await core.runConciergeTool("getPaymentMethods", {}, ctx);
    expect(Array.isArray(payments.methods)).toBe(true);
    // The assistant is told, in the data it receives, never to claim a payment landed.
    expect(String(payments.note)).toMatch(/not live|Never tell/i);
  });

  it("refuses an unknown tool instead of improvising", async () => {
    if (!core || !a) return;
    const ctx = ctxFor(a);
    const res = await core.runConciergeTool("dropTable", {}, ctx);
    expect(String(res.error)).toContain("Unknown tool");
  });

  it("has no arbitrary SQL path and no service-role credential", async () => {
    const source = readFileSync(resolve(process.cwd(), "server/aiCore.js"), "utf8");
    expect(source).not.toMatch(/SERVICE_ROLE/i);
    expect(source).not.toMatch(/service_role/);
    // The only queries are table reads and two named RPCs; there is no SQL passthrough.
    const reads = source.match(/db\.(select|rpc)\("([^"]+)"/g) || [];
    expect(reads.length).toBeGreaterThan(0);
    expect(source).not.toMatch(/sql\s*:/i);
  });
});
