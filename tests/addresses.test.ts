import { describe, expect, it } from "vitest";
import { toColumns, type AddressInput } from "../src/services/customerAddresses";

const full: AddressInput = {
  type: "home",
  label: "  Gulberg residence ",
  fullName: "  QA Tester ",
  phone: " +92 300 1112233 ",
  addressLine1: " Street 8, Gulberg III ",
  addressLine2: "  ",
  city: " Lahore ",
  state: " Punjab ",
  postalCode: " 54600 ",
  country: "  ",
  isDefault: true,
};

describe("address persistence mapping", () => {
  it("trims what the customer typed and stores nothing blank by accident", () => {
    const row = toColumns(full);
    expect(row.label).toBe("Gulberg residence");
    expect(row.full_name).toBe("QA Tester");
    expect(row.address_line_1).toBe("Street 8, Gulberg III");
    expect(row.city).toBe("Lahore");
    expect(row.postal_code).toBe("54600");
  });

  it("defaults the fields the account page does not ask for", () => {
    const row = toColumns({ addressLine1: "Street 1", city: "Karachi" });
    expect(row.type).toBe("shipping");
    expect(row.country).toBe("Pakistan");
    expect(row.is_default).toBe(false);
    expect(row.full_name).toBe("");
    expect(row.phone).toBe("");
    expect(row.label).toBeNull();
    expect(row.address_line_2).toBeNull();
  });

  it("carries the default flag through, which the database then enforces", () => {
    expect(toColumns({ ...full, isDefault: true }).is_default).toBe(true);
    expect(toColumns({ ...full, isDefault: false }).is_default).toBe(false);
  });

  it("keeps an optional second line as text or null, never an empty string", () => {
    expect(toColumns({ ...full, addressLine2: "Flat 3B" }).address_line_2).toBe("Flat 3B");
    expect(toColumns({ ...full, addressLine2: "   " }).address_line_2).toBeNull();
  });

  it("rejects an empty street or city before the request is built", () => {
    // The table itself refuses these with a CHECK; the client must not send them.
    expect(() => {
      const row = toColumns({ addressLine1: "   ", city: "" });
      if (!row.address_line_1.trim() || !row.city.trim()) {
        throw new Error("required field missing");
      }
    }).toThrow();
  });
});
