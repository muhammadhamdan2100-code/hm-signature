// Builds ENGLISH_MASTER_CONTENT.md: the complete English source inventory for manual
// translation. Nothing is translated or rewritten here — every string is read verbatim from
// its real source (dictionaries, seed catalogue data, CMS defaults, live admin screens) and
// annotated with where it is used.
//   node scripts/build-master-inventory.mjs
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const out = path.join(ROOT, "node_modules", ".master-inventory");
fs.mkdirSync(out, { recursive: true });

const LANGS = ["en", "ar", "fr", "es", "ur", "de"];
fs.writeFileSync(
  path.join(out, "e.mjs"),
  [
    `export { en } from ${JSON.stringify(path.join(ROOT, "src/i18n/dictionaries/en.ts"))};`,
    `export * as seed from ${JSON.stringify(path.join(ROOT, "src/data/products.ts"))};`,
  ].join("\n")
);
await build({ entryPoints: [path.join(out, "e.mjs")], bundle: true, format: "esm", platform: "node", outfile: path.join(out, "b.mjs"), logLevel: "silent", define: { "import.meta.env": "{}" } });
const mod = await import(pathToFileURL(path.join(out, "b.mjs")).href);
const en = mod.en;
const seed = mod.seed;

const flat = (o, p = "", acc = []) => {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k;
    if (v && typeof v === "object") flat(v, key, acc);
    else acc.push({ key, value: v });
  }
  return acc;
};
const leaves = flat(en);

// ---- where each key is used -------------------------------------------------------------
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name) && !p.includes(`${path.sep}dictionaries${path.sep}`)) files.push(p);
  }
})(path.join(ROOT, "src"));

const usage = new Map();
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const patterns = [/\bt\(\s*"([\w.]+)"/g, /\b(?:titleKey|excerptKey|bodyKey|ctaKey|labelKey|groupNameKey|sectionKey):\s*"([\w.]+)"/g];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      if (!usage.has(m[1])) usage.set(m[1], new Set());
      usage.get(m[1]).add(rel(file));
    }
  }
}

// ---- routes -----------------------------------------------------------------------------
const appText = fs.readFileSync(path.join(ROOT, "src/App.tsx"), "utf8");
const routes = [...appText.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<(\w+)/g)].map((m) => ({ path: m[1], component: m[2] }));
const adminApp = fs.readFileSync(path.join(ROOT, "src/admin/AdminApp.tsx"), "utf8");
const adminRoutes = [...adminApp.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<(\w+)/g)].map((m) => ({ path: m[1], component: m[2] }));

// ---- CMS defaults (homepage config) -----------------------------------------------------
function sliceObject(source, marker) {
  const start = source.indexOf(marker);
  if (start < 0) return null;
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return null;
}
const adc = fs.readFileSync(path.join(ROOT, "src/admin/context/AdminDataContext.tsx"), "utf8");
let homepage = null;
try {
  const literal = sliceObject(adc, "export const DEFAULT_HOMEPAGE_CONFIG");
  if (literal) homepage = new Function(`return ${literal}`)();
} catch {
  homepage = null;
}

// ---- classification ---------------------------------------------------------------------
const SECTION_BY_PREFIX = [
  ["admin.", "Admin Panel"],
  ["seo.", "SEO"],
  ["legal.", "Legal & Policy Pages"],
  ["faq.", "FAQ"],
  ["journal.", "Journal"],
  ["contact.", "Contact"],
  ["track.", "Order Tracking"],
  ["auth.", "Authentication"],
  ["account.", "Authentication"],
  ["checkout.", "Checkout"],
  ["shipping.", "Checkout"],
  ["tax.", "Checkout"],
  ["international.", "Currency, Country & International"],
  ["cart.", "Cart"],
  ["product.", "Product Details"],
  ["scentFinder.", "Scent Finder"],
  ["shop.", "Collections & Shop"],
  ["home.", "Homepage"],
  ["nav.", "Navbar"],
  ["footer.", "Footer"],
  ["common.", "System Messages"],
  ["status.", "System Messages"],
  ["validation.", "System Messages"],
];
const sectionFor = (key) => SECTION_BY_PREFIX.find(([p]) => key.startsWith(p))?.[1] ?? "System Messages";

const TYPE_RULES = [
  [/placeholder|hint$/i, "Placeholder"],
  [/^alt|ImageAlt|image/i, "Image alt text"],
  [/seo|homeTitle|homeDescription/i, "SEO metadata"],
  [/error|failed|invalid|required|missing/i, "Error / validation message"],
  [/^(saved|updated|created|deleted|confirmed|sent|success)/i, "Success message"],
  [/toast/i, "Toast message"],
  [/cta|^btn|button/i, "Button / CTA"],
  [/^(save|close|cancel|apply|back|continue|retry|delete|edit|add|remove|view|open|clear|confirm|submit|reset|load)$/i, "Small UI label"],
  [/^aria|srOnly|labelAria|aria/i, "Accessibility label"],
  [/Title|Heading|^title/i, "Heading"],
  [/subtitle|eyebrow|section/i, "Subheading / eyebrow"],
  [/label|column|header/i, "Label / column header"],
  [/status/i, "Status label"],
  [/body|intro|description|note|message|story|excerpt|answer|question|faq/i, "Body copy"],
];
const typeFor = (key, value) => {
  const leaf = key.split(".").pop();
  const hit = TYPE_RULES.find(([re]) => re.test(leaf) || re.test(value));
  return hit ? hit[1] : value.split(/\s+/).length <= 2 ? "Small UI label" : "Body copy";
};

const contextFor = (key) => {
  const [ns, group, ...rest] = key.split(".");
  const human = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").toLowerCase();
  const parts = [sectionFor(key), ...[group, ...rest].filter(Boolean).map(human)].filter(Boolean);
  return [...new Set(parts)].join(" — ");
};

const REVIEW = (entry) => {
  const notes = [];
  if (!usage.has(entry.key)) notes.push("not referenced by a literal t()/key prop — confirm the call site or drop it");
  if (/[,،]$/.test(entry.value.trim())) notes.push("value ends with a comma — possible truncated or split sentence");
  if (/\be\.g\.|example:/i.test(entry.value)) notes.push("sample/example content — decide per language whether to localise the example");
  if (/[{]\w+[}]/.test(entry.value)) notes.push(`interpolation: ${[...entry.value.matchAll(/\{(\w+)\}/g)].map((m) => "{" + m[1] + "}").join(", ")}`);
  if (/^\|/.test(entry.value) || entry.value.includes("|")) notes.push("contains \"|\" = deliberate line break in the design");
  if (entry.value.split(/\s+/).length === 1 && /^[A-Z]/.test(entry.value) && entry.value.length <= 7) notes.push("very short string — translate by UI context, not by dictionary habit");
  return notes;
};

const lines = [];
const push = (s = "") => lines.push(s);
push("# HM Signature — Complete English Master Content");
push();
push("Extracted verbatim from the project by `scripts/build-master-inventory.mjs`. English is the master");
push("source: nothing here has been rewritten, shortened or paraphrased. `[REVIEW POSSIBLE]` marks an entry");
push("whose wording or wiring a human should check before translating it blindly.");
push();
push(`- Translation keys in the English dictionary: **${leaves.length}**`);
push(`- Keys referenced from source by a literal \`t("…")\` / \`labelKey\` / \`titleKey\`: **${leaves.filter((l) => usage.has(l.key)).length}**`);
push(`- Customer-facing routes: **${routes.length}** · admin routes: **${adminRoutes.length}**`);
push(`- Supported languages to translate into: en, ar, ur, fr, es, de (\`${LANGS.join(", ")}\`)`);
push();
push("## Route inventory");
push();
push("| Route | Screen |");
push("| --- | --- |");
for (const r of routes) push(`| \`${r.path}\` | ${r.component} |`);
push();
push("### Admin routes");
push();
push("| Route | Screen |");
push("| --- | --- |");
for (const r of adminRoutes) push(`| \`${r.path}\` | ${r.component} |`);
push();

// ---- dictionary entries, grouped by section then namespace -----------------------------
const bySection = new Map();
for (const leaf of leaves) {
  const s = sectionFor(leaf.key);
  if (!bySection.has(s)) bySection.set(s, []);
  bySection.get(s).push(leaf);
}
const SECTION_ORDER = [
  "Homepage", "Navbar", "Collections & Shop", "Product Details", "Scent Finder", "Cart", "Checkout",
  "Currency, Country & International", "Order Tracking", "Authentication", "FAQ", "Journal", "Contact",
  "Legal & Policy Pages", "Footer", "System Messages", "SEO", "Admin Panel",
];
for (const section of [...SECTION_ORDER, ...[...bySection.keys()].filter((s) => !SECTION_ORDER.includes(s))]) {
  const entries = bySection.get(section);
  if (!entries?.length) continue;
  push(`## ${section}`);
  push();
  push(`_${entries.length} string(s)_`);
  push();
  for (const entry of entries) {
    const usedBy = [...(usage.get(entry.key) || [])];
    const notes = REVIEW(entry);
    push("```");
    push(`KEY: ${entry.key}`);
    push(`EXACT ENGLISH: ${entry.value}`);
    push(`CONTEXT: ${contextFor(entry.key)}`);
    push("SOURCE: translation file (src/i18n/dictionaries/en.ts)");
    push(`TYPE: ${typeFor(entry.key, entry.value)}`);
    push(`USED WHERE: ${usedBy.length ? usedBy.slice(0, 4).join(", ") + (usedBy.length > 4 ? ` (+${usedBy.length - 4} more)` : "") : "no literal call site found"}`);
    push(`NOTES: ${notes.length ? notes.join(" · ") : "—"}${notes.some((n) => /comma|example|not referenced/.test(n)) ? " · [REVIEW POSSIBLE]" : ""}`);
    push("```");
    push();
  }
}

// ---- seed catalogue / database content --------------------------------------------------
push("## Database Content");
push();
push("_These values live in database rows (seeded from `src/data/products.ts`) and are the English_");
push("_master copy for the product/category/collection content that the `content_translations`_");
push("_mechanism overrides per language. IDs, SKUs and slugs are technical and must NOT be translated._");
push();
const products = Array.isArray(seed.products) ? seed.products : [];
const list = (v) => (Array.isArray(v) ? v.join(", ") : v == null || v === "" ? "—" : String(v));
for (const p of products) {
  push("```");
  push(`PRODUCT ID: ${p.id ?? "—"}`);
  push(`SKU: ${p.sku ?? "—"}   (technical — do not translate)`);
  push(`SLUG: ${p.slug ?? "—"}   (technical — do not translate)`);
  push(`EXACT ENGLISH (name): ${p.name ?? "—"}`);
  push(`short description: ${p.description ?? "—"}`);
  push(`full description: ${p.fullDescription ?? "—"}`);
  push(`fragrance family: ${p.fragranceFamily ?? "—"}`);
  push(`category: ${p.category ?? "—"}`);
  push(`concentration: ${p.concentration ?? "—"}`);
  push(`top notes: ${(p.topNotes || p.notes?.top || []).join(", ")}`);
  push(`heart notes: ${(p.heartNotes || p.notes?.heart || []).join(", ")}`);
  push(`base notes: ${(p.baseNotes || p.notes?.base || []).join(", ")}`);
  push(`ingredients: ${list(p.ingredients)}`);
  push(`longevity: ${p.longevity ?? "—"}`);
  push(`sillage: ${p.sillage ?? "—"}`);
  push(`occasion: ${list(p.occasions ?? p.occasion)}`);
  push(`season: ${list(p.seasons)}`);
  push(`gender: ${p.gender ?? "—"}`);
  push(`intensity: ${p.intensity ?? "—"}`);
  push(`sizes: ${(p.sizes || []).map((s) => (typeof s === "string" ? s : `${s.size}/${s.price}`)).join(", ") || "—"}`);
  push(`variants: ${(p.variants || []).map((v) => `${v.size} → stock ${v.stock}`).join(", ") || "—"}`);
  push(`image alt: ${p.imageAlt ?? p.alt ?? "—"}`);
  push(`SEO title: ${p.seoTitle ?? "—"}`);
  push(`SEO description: ${p.seoDescription ?? "—"}`);
  push(`story / atelier copy: ${p.story ?? p.atelierStory ?? "—"}`);
  push(`badge/labels: ${[p.badge, p.label, p.tag].filter(Boolean).join(", ") || "—"}`);
  push("```");
  push();
}
for (const [name, key] of [["Categories", "categories"], ["Collections", "collections"]]) {
  const rows = Array.isArray(seed[key]) ? seed[key] : [];
  for (const row of rows) {
    push("```");
    push(`${name.toUpperCase()} ID: ${row.id ?? row.slug ?? "—"}`);
    push(`slug: ${row.slug ?? "—"}   (technical — do not translate)`);
    push(`EXACT ENGLISH (name): ${row.name ?? "—"}`);
    push(`description: ${row.description ?? "—"}`);
    push(`texture/theme label: ${row.texture ?? "—"}`);
    push("```");
    push();
  }
}

if (homepage) {
  push("## CMS");
  push();
  push("_Default homepage records held in `DEFAULT_HOMEPAGE_CONFIG` (AdminDataContext). The same fields_");
  push("_are editable by staff in Homepage CMS, and are translated either through `content_translations`_");
  push("_or, for unedited values, through the dictionary keys listed above._");
  push();
  const walkCms = (node, prefix) => {
    if (typeof node === "string") {
      if (!node.trim()) return;
      push("```");
      push(`KEY: cms.${prefix}`);
      push(`EXACT ENGLISH: ${node}`);
      push(`CONTEXT: stored homepage content — ${prefix}`);
      push("SOURCE: CMS (homepage config, database row)");
      push(`TYPE: ${/cta|button|text$/i.test(prefix) ? "Button / CTA" : /image$|imageAlt/i.test(prefix) ? "Image alt text" : /title|heading/i.test(prefix) ? "Heading" : "Body copy"}`);
      push("USED WHERE: storefront homepage sections");
      push(`NOTES: ${node.includes("|") ? 'contains "|" = deliberate line break' : "—"} · edited values are shown exactly as typed by staff`);
      push("```");
      push();
      return;
    }
    if (Array.isArray(node)) return node.forEach((v, i) => walkCms(v, `${prefix}[${i}]`));
    if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) walkCms(v, `${prefix}.${k}`);
  };
  walkCms(homepage, "homepage");
}

// ---- hardcoded strings outside the translation system -----------------------------------
push("## Hardcoded Strings");
push();
push("_User-facing English found OUTSIDE the i18n system (JSX text, wrapped JSX text, and visible_");
push("_attributes). Each must be classified by a human before it is moved into the dictionaries._");
push();
const VISIBLE_ATTRS = ["placeholder", "title", "aria-label", "alt", "label", "emptyMessage", "emptySubtitle", "header", "subtitle", "description"];
const hard = [];
for (const file of files) {
  const text = fs.readFileSync(file, "utf8").split("\n");
  const scope = rel(file).startsWith("src/admin/") ? "admin" : "storefront";
  text.forEach((line, i) => {
    const jsx = line.match(/>\s*([A-Z][A-Za-z0-9](?:[A-Za-z0-9 ,.:;&'()/?+%-]*[A-Za-z0-9.!?%>]))\s*</);
    if (jsx && !/\bt\(/.test(line) && jsx[1].trim().split(/\s+/).length >= 2) hard.push({ scope, where: `${rel(file)}:${i + 1}`, kind: "JSX text", value: jsx[1].trim() });
    if (/^[A-Z][A-Za-z][A-Za-z0-9 ,.:;&'()!?/-]{4,}$/.test(line.trim())) {
      const prev = (text[i - 1] ?? "").trimEnd();
      const next = (text[i + 1] ?? "").trimStart();
      if ((/[>{]$/.test(prev) || /^</.test(next)) && !/\bt\(/.test(line) && line.trim().split(/\s+/).length >= 2) {
        hard.push({ scope, where: `${rel(file)}:${i + 1}`, kind: "wrapped JSX text", value: line.trim() });
      }
    }
    for (const attr of VISIBLE_ATTRS) {
      const m = new RegExp(`${attr}="([A-Z][A-Za-z][^"]{4,})"`).exec(line);
      if (m && !/\blang=/.test(line)) hard.push({ scope, where: `${rel(file)}:${i + 1}`, kind: `${attr} attribute`, value: m[1] });
    }
  });
}
const seenHard = new Set();
const uniqueHard = hard.filter((h) => { const k = h.where + h.value; if (seenHard.has(k)) return false; seenHard.add(k); return true; });
push(`_${uniqueHard.length} raw candidates found (many are brand names, sample values or technical identifiers — classified below)_`);
push();
push("| Scope | Where | Kind | Exact English |");
push("| --- | --- | --- | --- |");
for (const h of uniqueHard) push(`| ${h.scope} | \`${h.where}\` | ${h.kind} | ${h.value.replace(/\|/g, "\\|")} |`);
push();

push("## Localization Architecture Notes");
push();
push("- One entity row per product/category/collection; per-language copy lives in");
push("  `content_translations` keyed by `(entity_type, entity_ref, language_code)` with a flat JSON");
push("  payload of the translated fields. Nothing is duplicated per language.");
push("- Interface copy lives in the six dictionaries; `Dict = typeof en` makes English the shape");
push("  authority, and `tests/i18n-dictionaries.test.ts` enforces identical leaf-key sets,");
push("  placeholder parity, direction metadata, and that no value is leftover source code.");
push("- `translateFor()` falls back English → humanized label only as a safety net; a missing key");
push("  is a build failure, never a UI state.");
push("- Currency codes (PKR, AED, SAR, USD, GBP, EUR), SKUs, IDs, slugs, routes, email addresses and");
push("  interpolation tokens must never be translated. `{token}` names are fixed across languages.");
push("- RTL is driven by the `languages` table (`ar`, `ur`); layout uses logical CSS utilities only.");
push("- SEO: `useSeoMeta` writes localized title/description/canonical/og:locale/og:locale:alternate");
push("  plus hreflang alternates; `api/sitemap.js` lists the same six language codes.");
push();

fs.writeFileSync(path.join(ROOT, "ENGLISH_MASTER_CONTENT.md"), lines.join("\n"), "utf8");
console.log(`ENGLISH_MASTER_CONTENT.md written: ${leaves.length} dictionary keys, ${uniqueHard.length} hardcoded candidates, ${products.length} products, ${adminRoutes.length} admin routes`);
console.log(`homepage CMS literal parsed: ${homepage ? "yes" : "NO — parse failed"}`);
