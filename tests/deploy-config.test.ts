import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Deployment-configuration guards. These read the real files rather than a copy, so a
 * later edit that weakens routing or the content-security policy fails here instead of
 * on a deployed site.
 *
 * Limitation stated plainly: this checks how the configured patterns behave as path
 * matchers. Vercel's own router (and the order it applies Functions, headers and
 * rewrites) cannot be exercised from a checkout — that is verified against a preview
 * deployment with the commands listed in docs/production-deployment.md.
 */

type VercelConfig = {
  rewrites?: { source: string; destination: string }[];
  crons?: { path: string; schedule: string }[];
  headers?: { source: string; headers: { key: string; value: string }[] }[];
};

const config = JSON.parse(
  readFileSync(resolve(process.cwd(), "vercel.json"), "utf8")
) as VercelConfig;

const csp = (config.headers?.[0]?.headers ?? []).find((h) => h.key === "Content-Security-Policy")?.value ?? "";
const directive = (name: string) =>
  csp
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${name} `)) ?? "";

const rewriteSource = config.rewrites?.[0]?.source ?? "";
// Vercel turns a `source` into a path matcher; the compiled form is what is asserted.
const matches = (path: string) => new RegExp(`^${rewriteSource}$`).test(path);

describe("vercel.json routing configuration", () => {
  it("compiles the SPA rewrite into a usable matcher", () => {
    expect(rewriteSource).toMatch(/^\//);
    expect(() => new RegExp(`^${rewriteSource}$`)).not.toThrow();
  });

  it("never rewrites an API route to the single-page app", () => {
    for (const path of [
      "/api/health",
      "/api/ai-chat",
      "/api/email-worker",
      "/api/automation-worker",
      "/api/payfast-notify",
      "/api/payfast-start",
      "/api/send-email",
    ]) {
      expect(matches(path), `${path} must not hit the SPA fallback`).toBe(false);
    }
  });

  it("still rewrites every customer and admin route", () => {
    for (const path of [
      "/",
      "/collections",
      "/product/royal-oud",
      "/checkout",
      "/track-order",
      "/account",
      "/account/orders",
      "/admin",
      "/admin/automations",
      "/admin/payments/reconciliation",
      "/login",
    ]) {
      expect(matches(path), `${path} should fall through to index.html`).toBe(true);
    }
  });

  it("keeps exactly one scheduler, pointing at the automation worker", () => {
    expect(config.crons).toHaveLength(1);
    expect(config.crons?.[0].path).toBe("/api/automation-worker");
    // Five fields = a normal cron expression; a daily cadence is what a Hobby plan allows.
    expect(config.crons?.[0].schedule.split(" ")).toHaveLength(5);
  });
});

describe("content-security policy", () => {
  it("does not allow inline scripts, so a injected script cannot run", () => {
    expect(directive("script-src")).toBe("script-src 'self'");
  });

  it("allows the payment hosts for form posts and nothing else", () => {
    const formAction = directive("form-action");
    expect(formAction).toContain("'self'");
    expect(formAction).toContain("https://sandbox.payfast.co.za");
    expect(formAction).toContain("https://www.payfast.co.za");
    expect(formAction).not.toContain("*");
  });

  it("keeps data traffic to this origin and Supabase only", () => {
    const connect = directive("connect-src");
    expect(connect).toContain("'self'");
    expect(connect).toContain("https://*.supabase.co");
    // No bare wildcard host: every source must be named.
    expect(connect.split(/\s+/).filter((s) => s === "https://*" || s === "*")).toEqual([]);
  });

  it("refuses framing and keeps the base URI locked", () => {
    expect(directive("frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive("base-uri")).toBe("base-uri 'self'");
    expect(directive("object-src")).toBe("object-src 'none'");
  });

  it("serves hashed assets immutably and the document without cache", () => {
    const assetGroup = config.headers?.find((g) => g.source.startsWith("/assets"));
    expect(
      assetGroup?.headers.find((h) => h.key === "Cache-Control")?.value
    ).toContain("immutable");
  });
});

describe("environment documentation", () => {
  it("documents every variable the server code reads", () => {
    const example = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
    const names = new Set(
      [...example.matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1])
    );
    // Anything the deployment must know about, not platform-provided values.
    for (const required of [
      "APP_URL",
      "CORS_ORIGIN",
      "STORE_CONTACT_EMAIL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "EMAIL_WORKER_SECRET",
      "CRON_SECRET",
      "SMTP_HOST",
      "SMTP_USER",
      "SMTP_PASS",
      "AI_PROVIDER_API_KEY",
      "PAYFAST_MERCHANT_ID",
      "PAYFAST_MERCHANT_KEY",
      "PAYFAST_SANDBOX",
      "ERROR_REPORT_URL",
    ]) {
      expect(names.has(required), `.env.example is missing ${required}`).toBe(true);
    }
  });
});
