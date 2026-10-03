import { describe, expect, it } from "vitest";
import {
  autoPriceFor,
  deriveVariantSku,
  effectiveVariantPrice,
  generateDefaultVariants,
  roundCleanPrice,
  sanitizeSkuCode,
} from "../src/data/products";

// The rule the storefront, the cart, checkout and place_order all have to agree on:
// size price = (50ml base / 50) x ml, rounded to a whole rupee.
describe("automatic volume pricing", () => {
  const base = 3000;

  it("prices every supported size from the 50ml base", () => {
    expect(autoPriceFor(base, "10ml")).toBe(600);
    expect(autoPriceFor(base, "30ml")).toBe(1800);
    expect(autoPriceFor(base, "75ml")).toBe(4500);
    expect(autoPriceFor(base, "100ml")).toBe(6000);
    expect(autoPriceFor(base, "50ml")).toBe(3000);
  });

  it("keeps working for a size that was typed by hand", () => {
    expect(autoPriceFor(3100, "42ml")).toBe(2604);
  });

  it("falls back to the base price instead of inventing zero", () => {
    expect(autoPriceFor(0, "50ml")).toBe(0);
    expect(autoPriceFor(3000, "ml")).toBe(3000);
  });

  it("rounds a displayed price to a clean rupee value", () => {
    expect(roundCleanPrice(4537)).toBe(4550);
    expect(roundCleanPrice(0)).toBe(0);
  });
});

describe("the price the customer sees", () => {
  it("is the sale price when one exists, otherwise the list price", () => {
    expect(effectiveVariantPrice({ price: 4500, salePrice: 3900 })).toBe(3900);
    expect(effectiveVariantPrice({ price: 4500 })).toBe(4500);
    // A sale price of 0 is still a price; the database rejects it separately
    // (sale_price < price), so the client must not quietly ignore it.
    expect(effectiveVariantPrice({ price: 4500, salePrice: 0 })).toBe(0);
  });

  it("builds the default ladder from the base price", () => {
    const ladder = generateDefaultVariants(3000, "HM-TEST", 50);
    expect(ladder.map((v) => v.size)).toEqual(["10ml", "30ml", "50ml", "100ml"]);
    expect(ladder.map((v) => v.price)).toEqual([600, 1800, 3000, 6000]);
    expect(ladder.every((v) => v.auto)).toBe(true);
  });
});

describe("variant SKUs", () => {
  it("never carries a space or lower case from the base code", () => {
    expect(sanitizeSkuCode("hm qvf")).toBe("HMQVF");
    expect(sanitizeSkuCode("HM-QVF")).toBe("HM-QVF");
  });

  it("derives a missing or placeholder code from the base SKU and the size", () => {
    // A space is dropped, not converted to a hyphen: "hm qa" becomes HMQA.
    expect(deriveVariantSku("hm qa", "75ml", "")).toBe("HMQA-75ML");
    expect(deriveVariantSku("HM QA -100", "10ml", "HM-PRD-10ML")).toBe("HMQA-100-10ML");
  });

  it("leaves a code someone wrote by itself alone", () => {
    expect(deriveVariantSku("HM-QVF", "50ml", "MY-OFFICE-CODE")).toBe("MY-OFFICE-CODE");
  });

  it("produces one distinct code per size for the same product", () => {
    const sizes = ["10ml", "30ml", "50ml", "75ml", "100ml"];
    const skus = sizes.map((size) => deriveVariantSku("HM-UNIQUE", size, ""));
    expect(new Set(skus).size).toBe(sizes.length);
  });
});
