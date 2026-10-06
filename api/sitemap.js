// Vercel serverless function — GET /api/sitemap (rewritten from /sitemap.xml)
//
// The origin is taken from the request, so staging and production each describe
// themselves and neither leaks the other's URLs. Product entries come from the live
// catalogue through the same public read policies a visitor uses; there is no
// service-role key in this file and no hardcoded product list to go stale.
import { supabasePublishableKey, supabaseUrl } from "./_config.js";

export const maxDuration = 10;

const STATIC_PATHS = [
  "/",
  "/collections",
  "/bestsellers",
  "/men",
  "/women",
  "/scent-finder",
  "/discover",
  "/gift-finder",
  "/gift-cards",
  "/journal",
  "/boutiques",
  "/contact",
  "/ingredients",
  "/faq",
  "/shipping-delivery",
  "/returns-exchanges",
  "/privacy-policy",
  "/terms-conditions",
  "/refund-policy",
  "/parent-company",
];

const LANGUAGES = ["en", "ar", "fr", "es", "ur", "de"];

const escape = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function originOf(req) {
  const configured =
    process.env.APP_URL || process.env.VITE_SITE_URL || "";
  if (configured) return configured.replace(/\/+$/, "");
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host =
    req.headers["x-forwarded-host"] ||
    req.headers.host ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "";
  if (!host) return "";
  if (host.startsWith("http")) return host.replace(/\/+$/, "");
  return `${proto}://${host}`;
}

async function liveProductPaths() {
  const url0 = supabaseUrl();
  const key = supabasePublishableKey();
  if (!url0 || !key) return [];
  const url = `${url0}/rest/v1/products?select=slug,updated_at&active=eq.true&order=slug.asc`;
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return [];
  const rows = await res.json();
  return Array.isArray(rows)
    ? rows
        .filter((row) => typeof row.slug === "string" && row.slug.length > 0)
        .map((row) => ({ path: `/product/${row.slug}`, lastmod: row.updated_at }))
    : [];
}

function urlBlock(origin, path, lastmod) {
  const clean = path.split("?")[0];
  const loc = `${origin}${clean}`;
  const alts = LANGUAGES.map(
    (code) => `  <xhtml:link rel="alternate" hreflang="${code}" href="${escape(`${loc}?lang=${code}`)}" />`
  ).join("\n");
  return [
    "<url>",
    `  <loc>${escape(loc)}</loc>`,
    lastmod ? `  <lastmod>${escape(String(lastmod).slice(0, 10))}</lastmod>` : null,
    alts,
    `  <xhtml:link rel="alternate" hreflang="x-default" href="${escape(loc)}" />`,
    "</url>",
  ]
    .filter(Boolean)
    .join("\n");
}

const handler = async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const origin = originOf(req);
  if (!origin) {
    res.status(503).type("text/plain").send("Origin could not be determined.\n");
    return;
  }

  // A preview or staging host must not publish a second sitemap of the same content.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    res.status(200).type("application/xml; charset=utf-8").send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n');
    return;
  }

  let products = [];
  try {
    products = await liveProductPaths();
  } catch {
    products = [];
  }

  const entries = [
    ...STATIC_PATHS.map((path) => ({ path })),
    ...products,
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map((entry) => urlBlock(origin, entry.path, entry.lastmod)),
    "</urlset>",
    "",
  ].join("\n");

  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.status(200).type("application/xml; charset=utf-8").send(xml);
};

export default handler;
