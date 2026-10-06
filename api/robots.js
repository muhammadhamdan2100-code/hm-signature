// Vercel serverless function — GET /api/robots (rewritten from /robots.txt)
//
// Preview and staging hosts must not index a second copy of the storefront, so the
// answer depends on which environment is serving it rather than on a committed file.
import { appBaseUrl } from "./_config.js";

export const maxDuration = 5;

const DISALLOWED = [
  "/admin",
  "/account",
  "/cart",
  "/checkout",
  "/order-confirmation",
  "/login",
  "/api/",
];

const originOf = (req) => {
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host =
    req.headers["x-forwarded-host"] ||
    req.headers.host ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "";
  if (host) return (host.startsWith("http") ? host : `${proto}://${host}`).replace(/\/+$/, "");
  return appBaseUrl().replace(/\/+$/, "");
};

const handler = (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).type("text/plain").send("Method not allowed.\n");
    return;
  }

  const lines = ["User-agent: *"];
  const production = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";

  if (production) {
    lines.push("Allow: /");
    for (const path of DISALLOWED) lines.push(`Disallow: ${path}`);
    const origin = originOf(req);
    if (origin) lines.push(`Sitemap: ${origin}/sitemap.xml`);
  } else {
    // Any non-production host is told to index nothing.
    lines.length = 0;
    lines.push("User-agent: *", "Disallow: /");
  }

  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.status(200).type("text/plain; charset=utf-8").send(`${lines.join("\n")}\n`);
};

export default handler;
