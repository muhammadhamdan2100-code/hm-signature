import { beforeAll, describe, expect, it } from "vitest";
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
 * Phase 7 international commerce, verified against the real database.
 *
 * What is asserted here is the contract the storefront depends on: prices, shipping and
 * tax come from configuration the browser cannot edit; an unopened destination is refused
 * in words rather than priced; a display currency is only a view of the same base total;
 * and an order remembers the country, tax and currency it was placed with.
 *
 * Nothing in this file writes configuration. Every attempted write is expected to be
 * refused or filtered, and each is followed by a re-read — a request that row-level
 * security silently swallows is acceptable, a change is not.
 */

const env: Env | null = readSupabaseEnv();
const run = env ? describe : describe.skip;

type Quote = {
  error?: string;
  total?: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  tax_rate?: number;
  currency?: string;
  country_code?: string;
  total_in_currency?: number;
  currency_rate_to_base?: number;
  currency_minor_units?: number;
};

type VariantRow = { id: string; price: number; sale_price: number | null; stock: number; size: string };
type CountryRow = {
  code: string;
  name: string;
  enabled: boolean;
  shipping_fee: number | null;
  free_shipping_threshold: number | null;
  tax_enabled: boolean;
  tax_rate: number | null;
  currency_code: string | null;
};
type CurrencyRow = { code: string; rate_to_base: number; minor_units: number; enabled: boolean; rate_source: string };

let variant: VariantRow | null = null;
let countries: CountryRow[] = [];
let currencies: CurrencyRow[] = [];

async function quote(items: unknown[], countryCode: string | null, currency = "PKR"): Promise<Quote> {
  const res = await rpc(env!, null, "quote_order", {
    p_items: items,
    p_country_code: countryCode,
    p_currency: currency,
    p_coupon_code: null,
  });
  expect(res.status).toBe(200);
  return res.json<Quote>();
}

beforeAll(async () => {
  if (!env) return;

  const variants = await rest(
    env,
    null,
    "product_variants?select=id,price,sale_price,stock,size&active=is.true&stock=gt.1&order=price.asc&limit=1"
  );
  const rows = variants.json<VariantRow[]>();
  variant = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

  const countryRes = await rest(env, null, "countries?select=code,name,enabled,shipping_fee,free_shipping_threshold,tax_enabled,tax_rate,currency_code&order=sort_order.asc");
  countries = countryRes.json<CountryRow[]>();

  const currencyRes = await rest(env, null, "currencies?select=code,rate_to_base,minor_units,enabled,rate_source&order=sort_order.asc");
  currencies = currencyRes.json<CurrencyRow[]>();

  if (!variant) reportSkip("no active variant with stock to price");
});

run("international configuration is public and honest", () => {
  it("lets an anonymous visitor read the destination rules", () => {
    expect(countries.length).toBeGreaterThan(0);
    const home = countries.find((c) => c.code === "PK");
    expect(home?.enabled).toBe(true);
    expect(home?.shipping_fee).not.toBeNull();
  });

  it("keeps every unopened destination closed rather than half-priced", () => {
    const closed = countries.filter((c) => !c.enabled);
    expect(closed.length).toBeGreaterThan(0);
    for (const country of closed) {
      expect(country.shipping_fee ?? null, `${country.code} is disabled but carries a fee`).toBeNull();
    }
  });

  it("labels exchange rates as the atelier's own figures, not a live feed", () => {
    expect(currencies.length).toBeGreaterThanOrEqual(6);
    for (const row of currencies) {
      expect(["manual", "provider", "imported"]).toContain(row.rate_source);
    }
    expect(currencies.filter((c) => c.enabled).length).toBeGreaterThanOrEqual(6);
  });

  it("offers six interface languages with Arabic and Urdu as the right-to-left ones", async () => {
    const res = await rest(env!, null, "languages?select=code,direction,enabled,is_default&order=sort_order.asc");
    const rows = res.json<{ code: string; direction: string; enabled: boolean; is_default: boolean }[]>();
    expect(rows.map((r) => r.code).sort()).toEqual(["ar", "de", "en", "es", "fr", "ur"]);
    expect(rows.filter((r) => r.direction === "rtl").map((r) => r.code).sort()).toEqual(["ar", "ur"]);
    expect(rows.find((r) => r.code === "ar")?.direction).toBe("rtl");
    expect(rows.filter((r) => r.is_default).map((r) => r.code)).toEqual(["en"]);
  });
});

run("server-side pricing of a basket", () => {
  it("adds the destination's shipping fee below its free threshold", async () => {
    if (!variant) return;
    const price = Number(variant.sale_price ?? variant.price);
    const home = countries.find((c) => c.code === "PK")!;
    const q = await quote([{ variant_id: variant.id, quantity: 1 }], "PK");
    expect(q.error).toBeUndefined();
    expect(q.subtotal).toBeCloseTo(price, 2);
    expect(q.country_code).toBe("PK");
    expect(q.shipping).toBeCloseTo(Number(home.shipping_fee), 2);
    expect(q.tax).toBeCloseTo(0, 2);
    expect(q.total).toBeCloseTo(price + Number(home.shipping_fee), 2);
  });

  it("drops the fee once the goods clear the destination threshold", async () => {
    if (!variant) return;
    const home = countries.find((c) => c.code === "PK")!;
    const threshold = Number(home.free_shipping_threshold ?? 0);
    const price = Number(variant.sale_price ?? variant.price);
    const quantity = Math.min(50, Math.ceil((threshold + 1) / price));
    const q = await quote([{ variant_id: variant.id, quantity }], "PK");
    expect(q.error).toBeUndefined();
    if ((q.subtotal ?? 0) >= threshold) expect(q.shipping).toBe(0);
  });

  it("refuses a destination the store has not opened", async () => {
    if (!variant) return;
    const closed = countries.find((c) => !c.enabled);
    expect(closed).toBeTruthy();
    const q = await quote([{ variant_id: variant!.id, quantity: 1 }], closed!.code);
    expect(q.total).toBeUndefined();
    expect(q.error ?? "").toContain(closed!.name);
  });

  it("refuses a country that is not configured at all", async () => {
    if (!variant) return;
    const q = await quote([{ variant_id: variant.id, quantity: 1 }], "ZZ");
    expect(q.error).toBeTruthy();
    expect(q.total).toBeUndefined();
  });

  it("asks for a destination instead of guessing one", async () => {
    if (!variant) return;
    const q = await quote([{ variant_id: variant.id, quantity: 1 }], null);
    expect(q.error).toBeTruthy();
  });

  it("rejects a malformed item rather than raising a database error", async () => {
    const q = await quote([{ variant_id: "not-a-uuid", quantity: 1 }], "PK");
    expect(q.error).toBeTruthy();
    const negative = await quote([{ variant_id: variant?.id ?? "00000000-0000-0000-0000-000000000000", quantity: 0 }], "PK");
    expect(negative.error).toBeTruthy();
  });

  it("expresses the same total in another currency without changing it", async () => {
    if (!variant) return;
    const pkr = await quote([{ variant_id: variant.id, quantity: 2 }], "PK", "PKR");
    const usdRow = currencies.find((c) => c.code === "USD")!;
    const usd = await quote([{ variant_id: variant.id, quantity: 2 }], "PK", "USD");
    expect(usd.error).toBeUndefined();
    // Base totals are identical; only the display figure differs.
    expect(usd.total).toBeCloseTo(Number(pkr.total ?? 0), 2);
    const expected = Math.round((Number(pkr.total ?? 0) / Number(usdRow.rate_to_base)) * 100) / 100;
    expect(usd.total_in_currency).toBeCloseTo(expected, 2);
    expect(usd.currency_minor_units).toBe(usdRow.minor_units);
  });

  it("will not price in a currency the store does not offer", async () => {
    if (!variant) return;
    const q = await quote([{ variant_id: variant.id, quantity: 1 }], "PK", "XBT");
    expect(q.error).toBeTruthy();
  });
});

run("configuration cannot be moved from the client", () => {
  it("refuses a customer trying to change a destination", async () => {
    const creds = suiteCredentials();
    const session: Session | null = await login(env!, creds.aEmail, creds.aPassword);
    if (!session) {
      reportSkip("no suite customer account");
      return;
    }
    const before = countries.find((c) => c.code === "PK")!;
    const attempt = await rpc(env!, session.token, "save_country_rule", {
      p_code: "PK",
      p_rule: { enabled: true, currency_code: "PKR", shipping_fee: 1, free_shipping_threshold: 2, tax_enabled: true, tax_rate: 50 },
    });
    expect(attempt.status).toBeGreaterThanOrEqual(400);

    const after = (await rest(env!, session.token, "countries?select=code,enabled,shipping_fee,tax_rate&code=eq.PK")).json<CountryRow[]>();
    expect(after[0].shipping_fee).toBe(before.shipping_fee);
    expect(after[0].tax_rate).toBe(before.tax_rate);
  });

  it("refuses an anonymous attempt to re-rate a currency", async () => {
    const attempt = await rpc(env!, null, "save_currency", {
      p_code: "USD",
      p_name: "US Dollar",
      p_symbol: "$",
      p_minor_units: 2,
      p_rate_to_base: 1,
      p_enabled: true,
      p_sort_order: 2,
    });
    expect(attempt.status).toBeGreaterThanOrEqual(400);

    const after = (await rest(env!, null, "currencies?select=code,rate_to_base&code=eq.USD")).json<CurrencyRow[]>();
    expect(Number(after[0].rate_to_base)).toBe(Number(currencies.find((c) => c.code === "USD")!.rate_to_base));
  });

  it("filters a direct PATCH on the configuration tables", async () => {
    const creds = suiteCredentials();
    const session = await login(env!, creds.staffEmail, creds.staffPassword);
    if (!session) {
      reportSkip("no suite staff account");
      return;
    }
    const patch = await rest(env!, session.token, "currencies?code=eq.USD", {
      method: "PATCH",
      body: { rate_to_base: 1 },
    });
    // PostgREST answers 204 for a row that row-level security hid; only the re-read proves it.
    expect([200, 204, 401, 403]).toContain(patch.status);
    const after = (await rest(env!, null, "currencies?select=code,rate_to_base&code=eq.USD")).json<CurrencyRow[]>();
    expect(Number(after[0].rate_to_base)).toBe(Number(currencies.find((c) => c.code === "USD")!.rate_to_base));
  });
});

run("orders keep their own money history", () => {
  it("records a currency snapshot column set on every order", async () => {
    const res = await rest(
      env!,
      null,
      "orders?select=order_number,currency,tax_amount,tax_rate,destination_country,total_in_currency&limit=1"
    );
    // A guest may not read orders, so 401/403 still proves the columns exist: an unknown
    // column would have answered 400 with a schema error.
    if (res.status === 400 && /currency|tax_amount|destination_country/.test(res.text)) {
      expect.unreachable(`orders is missing a Phase 7 column: ${res.text}`);
    }
  });

  it("leaves a historical order at the base currency with no tax", async () => {
    const creds = suiteCredentials();
    const session = await login(env!, creds.staffEmail, creds.staffPassword);
    if (!session) {
      reportSkip("no suite staff account");
      return;
    }
    const res = await rest(
      env!,
      session.token,
      "orders?select=order_number,subtotal,discount_amount,shipping_cost,total,currency,currency_rate_to_base,tax_amount,tax_rate,destination_country&order_number=eq.HMS-20261002-4952"
    );
    const rows = res.json<any[]>();
    if (!Array.isArray(rows) || rows.length === 0) {
      reportSkip("staff session cannot read the historical order");
      return;
    }
    const order = rows[0];
    expect(order.currency).toBe("PKR");
    expect(Number(order.currency_rate_to_base)).toBe(1);
    expect(Number(order.tax_amount)).toBe(0);
    expect(order.destination_country).toBeNull();
    expect(Number(order.total)).toBeCloseTo(
      Number(order.subtotal) - Number(order.discount_amount) + Number(order.shipping_cost),
      2
    );
  });
});
