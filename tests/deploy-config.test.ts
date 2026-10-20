import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Deployment-configuration guards. These read the real files rather than a copy, so a later edit
 * that weakens routing or the content-security policy fails here instead of on a deployed site.
 *
 * Why this file is strict: commit 2e9cc53 removed the serverless tier and, with it, the whole
 * `headers` + `rewrites` block of vercel.json. Every deep link (product pages, /account/orders,
 * /admin) then 404ed at the platform while the app itself kept passing its own tests, because the
 * assertions below had been replaced with `expect(true)` placeholders. Do not re-void them.
 *
 * Limitation stated plainly: this checks how the configured patterns behave as path matchers and
 * that the files the router depends on exist. Vercel's own routing order (Functions, headers,
 * rewrites) cannot be exercised from a checkout — that is verified against a deployment.
 */

type Rewrite = { source: string; destination: string };
type Header = { key: string; value: string };
type VercelConfig = {
  buildCommand?: string;
  outputDirectory?: string;
  framework?: string;
  rewrites?: Rewrite[];
  crons?: { path: string; schedule: string }[];
  headers?: { source: string; headers: Header[] }[];
};

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");
const config = JSON.parse(read("vercel.json")) as VercelConfig;

const globalHeaders = config.headers?.find((h) => h.source === "/(.*)")?.headers ?? [];
const header = (key: string) => globalHeaders.find((h) => h.key === key)?.value ?? "";
const csp = header("Content-Security-Policy");
const directive = (name: string) =>
  csp
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${name} `)) ?? "";

const rewrites = config.rewrites ?? [];
// The single-page fallback is identified by its destination, not its position, so adding another
// rewrite in front of it cannot silently change what this file asserts.
const spaRewrite = rewrites.find((r) => r.destination === "/index.html");
const rewriteSource = spaRewrite?.source ?? "";
// Vercel turns a `source` into a path matcher; the compiled form is what is asserted.
const servedByFallback = (path: string) => new RegExp(`^${rewriteSource}$`).test(path);

/** Every path the storefront router can be asked to render, taken from the router itself. */
function declaredRoutes(): string[] {
  const app = read("src/App.tsx");
  const params = ["mystic-oud", "12"];
  let i = 0;
  return [...app.matchAll(/<Route\s+path="([^"]*)"/g)]
    .map((m) => m[1])
    .filter((p) => p !== "*")
    .map((p) =>
      p
        .replace(/:([A-Za-z0-9_]+)/g, () => params[i++ % params.length])
        .replace(/\*$/, "dashboard")
    );
}

describe("vercel.json build target", () => {
  it("builds the Vite SPA into dist", () => {
    expect(config.buildCommand).toBe("npm run build");
    expect(config.outputDirectory).toBe("dist");
    expect(config.framework).toBe("vite");
  });
});

describe("vercel.json routing configuration", () => {
  it("keeps a single-page fallback rewrite", () => {
    expect(spaRewrite, "vercel.json lost the /index.html fallback — deep links 404 in production").toBeDefined();
  });

  it("serves every declared route on a cold load", () => {
    const routes = declaredRoutes();
    // A parse failure would silently reduce coverage to nothing, so assert the extraction worked.
    expect(routes.length).toBeGreaterThan(20);
    for (const route of routes) {
      if (route === "/") continue;
      expect(servedByFallback(route), `${route} is not covered by the SPA fallback`).toBe(true);
    }
    expect(routes).toContain("/product/mystic-oud");
  });

  it("sends nothing but the fallback rewrite to index.html", () => {
    // Any other rewrite is a route that used to be a serverless function; those endpoints do not
    // exist on this deployment, so pointing at them resurrects a 404 for a crawler or a browser.
    for (const rule of rewrites) {
      if (rule.destination === "/index.html") continue;
      expect(rule.destination, `${rule.source} rewrites to the dead API layer`).not.toMatch(/^\/api\//);
    }
  });

  it("uses no scheduler while the deployment ships no functions", () => {
    expect(config.crons ?? []).toEqual([]);
  });
});

describe("SEO documents", () => {
  it("ships robots.txt and sitemap.xml as real files", () => {
    // With a catch-all fallback, an absent /robots.txt returns the SPA's HTML with status 200 —
    // a soft 404 a crawler indexes as content. The files must exist next to index.html.
    expect(read("public/robots.txt")).toMatch(/^User-agent: \*/m);
    expect(read("public/sitemap.xml")).toMatch(/^<\?xml /);
    expect(read("public/sitemap.xml")).toContain("<urlset");
  });

  it("lists only paths that render real content", () => {
    const locs = [...read("public/sitemap.xml").matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(10);
    expect(locs).toContain("/");
    // Admin, cart and checkout are indexed by accident if listed, and never rendered for a bot.
    for (const path of locs) {
      expect(path).not.toMatch(/^\/(admin|cart|checkout|account|order-confirmation)/);
    }
  });

  it("disallows the surfaces a shopper must never see in an index", () => {
    const robots = read("public/robots.txt");
    for (const path of ["/admin/", "/account/", "/checkout"]) {
      expect(robots, `robots.txt does not disallow ${path}`).toContain(`Disallow: ${path}`);
    }
    expect(robots).toContain("Sitemap:");
  });
});

describe("content-security policy", () => {
  it("is sent on every path", () => {
    expect(csp, "vercel.json lost the Content-Security-Policy header").not.toBe("");
  });

  it("allows no inline or eval'd script", () => {
    const scriptSrc = directive("script-src");
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).not.toContain("unsafe-inline");
    expect(scriptSrc).not.toContain("unsafe-eval");
    expect(directive("object-src")).toBe("object-src 'none'");
    expect(directive("base-uri")).toBe("base-uri 'self'");
  });

  it("confines data requests to Supabase and this origin", () => {
    const connectSrc = directive("connect-src");
    expect(connectSrc).toContain("https://*.supabase.co");
    expect(connectSrc).toContain("wss://*.supabase.co");
    // A wildcard here would let a compromised component phone home anywhere.
    expect(connectSrc).not.toMatch(/\s\*\s*$/);
    expect(connectSrc).not.toContain("http:");
  });

  it("cannot be framed and refuses mixed content", () => {
    expect(directive("frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(header("X-Frame-Options")).toBe("DENY");
  });

  it("sends the rest of the header set", () => {
    expect(header("X-Content-Type-Options")).toBe("nosniff");
    expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header("Strict-Transport-Security")).toMatch(/max-age=\d{8,}/);
    expect(header("Cross-Origin-Opener-Policy")).toBe("same-origin");
    const permissions = header("Permissions-Policy");
    for (const capability of ["camera=()", "microphone=()", "geolocation=()", "payment=()"]) {
      expect(permissions, `Permissions-Policy does not deny ${capability}`).toContain(capability);
    }
  });

  it("caches hashed build assets forever and nothing else", () => {
    const assetHeaders = config.headers?.find((h) => h.source === "/assets/(.*)")?.headers ?? [];
    expect(assetHeaders.find((h) => h.key === "Cache-Control")?.value).toMatch(/max-age=31536000, immutable/);
  });
});

describe("environment documentation", () => {
  it("documents every variable the server code reads", () => {
    const example = read(".env.example");
    const names = new Set([...example.matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]));
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
