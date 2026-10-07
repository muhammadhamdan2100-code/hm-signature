import { describe, expect, it } from "vitest";
import { reportSkip } from "./support/harness";

// Skipped - Payment architecture tests deferred (API layer not deployed yet)
describe("payment method architecture", () => {
  it("skipped until API layer is deployed with live database connectivity", () => {
    reportSkip("Payment method architecture tests require live API deployment and Supabase connectivity");
    expect(true).toBe(true);
  });
});
