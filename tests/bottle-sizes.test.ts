import { describe, expect, it } from "vitest";
import {
  hasDuplicateSize,
  isValidSizeLabel,
  normalizeSizeLabel,
  sizeToMl,
} from "../src/data/products";

describe("bottle size labels", () => {
  it("accepts the presets and any whole millilitre size", () => {
    for (const size of ["10ml", "30ml", "50ml", "75ml", "100ml", "42ml", "250ml", "1000ml"]) {
      expect(isValidSizeLabel(size), size).toBe(true);
    }
  });

  it("rejects sizes the database CHECK would refuse", () => {
    for (const size of ["75cl", "0ml", "ml", "50 ml", "-50ml", "50", "10000ml", "abc", ""]) {
      expect(isValidSizeLabel(size), size).toBe(false);
    }
  });

  it("normalises case and stray spacing before storing", () => {
    expect(normalizeSizeLabel(" 75ML ")).toBe("75ml");
    expect(normalizeSizeLabel("100Ml")).toBe("100ml");
  });

  it("reads the millilitre value back out", () => {
    expect(sizeToMl("75ml")).toBe(75);
    expect(sizeToMl("10ml")).toBe(10);
  });
});

describe("duplicate size prevention", () => {
  const list = [{ size: "10ml" }, { size: "50ml" }, { size: "100ml" }];

  it("treats a differently typed repeat as the same size", () => {
    expect(hasDuplicateSize(list, "50ML")).toBe(true);
    expect(hasDuplicateSize(list, " 75ml ")).toBe(false);
  });

  it("lets a row keep its own size while editing it", () => {
    expect(hasDuplicateSize(list, "50ml", 1)).toBe(false);
    expect(hasDuplicateSize(list, "100ml", 1)).toBe(true);
  });
});
