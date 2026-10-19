import { describe, expect, it } from "vitest";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  OTP_LENGTH,
  enabledProviders,
  normalizeOtp,
  normalizePhone,
  passwordProblem,
} from "../src/services/authFlow";

/**
 * The rules a visitor must not be able to walk around: what counts as a password, what counts as
 * a recovery code, and which sign-in buttons the project is actually allowed to show.
 */

describe("a password the shop will store", () => {
  it("refuses anything shorter than the stated minimum", () => {
    expect(passwordProblem("a1" + "x".repeat(MIN_PASSWORD_LENGTH - 3))).toBe("tooShort");
    expect(passwordProblem("a1" + "x".repeat(MIN_PASSWORD_LENGTH - 2))).toBe(null);
  });

  it("refuses a password so long the hash would silently truncate it", () => {
    const base = "a1" + "x".repeat(MAX_PASSWORD_LENGTH - 2);
    expect(passwordProblem(base)).toBe(null);
    expect(passwordProblem(base + "x")).toBe("tooLong");
  });

  it("needs both a letter and a number", () => {
    expect(passwordProblem("abcdefgh")).toBe("needsNumber");
    expect(passwordProblem("12345678")).toBe("needsLetter");
    expect(passwordProblem("abcdefg1")).toBe(null);
  });

  it("refuses the passwords a guesser tries first, whatever the case", () => {
    expect(passwordProblem("password1")).toBe("tooCommon");
    expect(passwordProblem("Password1")).toBe("tooCommon");
    expect(passwordProblem("Qwerty123")).toBe("tooCommon");
  });

  it("accepts a long passphrase with a single digit", () => {
    expect(passwordProblem("scent-of-the-himalayas-9")).toBe(null);
  });
});

describe("the recovery code", () => {
  it("takes exactly the digits GoTrue sends", () => {
    expect(normalizeOtp("418203")).toBe("418203");
    expect(OTP_LENGTH).toBe(6);
  });

  it("forgives the spaces and dashes a password manager inserts", () => {
    expect(normalizeOtp("418 203")).toBe("418203");
    expect(normalizeOtp("418-203")).toBe("418203");
  });

  it("refuses anything that is not a code, so no request is wasted", () => {
    expect(normalizeOtp("")).toBe(null);
    expect(normalizeOtp("41820")).toBe(null);
    expect(normalizeOtp("4182031")).toBe(null);
    expect(normalizeOtp("abc123")).toBe(null);
    expect(normalizeOtp("41820e")).toBe(null);
  });
});

describe("the sign-in buttons a project may show", () => {
  it("shows nothing for a project with no provider configured", () => {
    // This is the live HM Signature answer today: email only, until OAuth apps are added.
    expect(enabledProviders({ external: { email: { enabled: true }, google: { enabled: false } } })).toEqual([]);
  });

  it("shows a provider as soon as the auth server says it has credentials", () => {
    const list = enabledProviders({ external: { google: { enabled: true }, facebook: { enabled: true } } });
    expect(list.map((p) => p.id).sort()).toEqual(["facebook", "google"]);
    expect(list.find((p) => p.id === "google")?.label).toBe("Google");
  });

  it("offers phone as a code sign-in, not as a redirect", () => {
    const list = enabledProviders({ external: { phone: { enabled: true } } });
    expect(list).toEqual([{ id: "phone", label: "Phone", kind: "otp" }]);
  });

  it("survives a missing or malformed settings document", () => {
    expect(enabledProviders(null)).toEqual([]);
    expect(enabledProviders({})).toEqual([]);
    expect(enabledProviders({ external: "unexpected" })).toEqual([]);
  });
});

describe("a phone number the SMS provider will accept", () => {
  it("normalises what a shopper types into E.164", () => {
    expect(normalizePhone("+92 300 8472910")).toBe("+923008472910");
    expect(normalizePhone("+92 (300) 847-2910")).toBe("+923008472910");
  });

  it("refuses anything that cannot be a number", () => {
    expect(normalizePhone("")).toBe(null);
    expect(normalizePhone("3008472910")).toBe(null); // no country code
    expect(normalizePhone("00923008472910")).toBe(null); // trunk prefix is not E.164
    expect(normalizePhone("+12")).toBe(null);
    expect(normalizePhone("+92300abc8472")).toBe(null);
  });
});
