// Same rule as tests/i18n-dictionaries.test.ts, printed per language with the offending values:
// which dictionary entries are still byte-identical to English outside the shared-vocabulary set.
//   node scripts/english-identity.mjs
import path from "node:path";
import fs from "node:fs";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const out = path.join(ROOT, "node_modules", ".eng-identity");
fs.mkdirSync(out, { recursive: true });
const langs = ["en", "ar", "fr", "es", "ur", "de"];
fs.writeFileSync(
  path.join(out, "e.mjs"),
  langs.map((l) => `export { ${l} } from ${JSON.stringify(path.join(ROOT, "src/i18n/dictionaries", `${l}.ts`))};`).join("\n")
);
await build({ entryPoints: [path.join(out, "e.mjs")], bundle: true, format: "esm", platform: "node", outfile: path.join(out, "b.mjs"), logLevel: "silent" });
const dicts = await import(pathToFileURL(path.join(out, "b.mjs")).href);

const flat = (o, p = "", acc = {}) => {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k;
    if (v && typeof v === "object") flat(v, key, acc);
    else acc[key] = v;
  }
  return acc;
};
const en = flat(dicts.en);

const SHARED = [
  "Collections", "Contact", "Journal", "Menu", "Total", "Subtotal", "No", "Error", "FAQ",
  "OCCASION", "CONCENTRATION", "DESCRIPTION", "CONTACT", "CONFIRMATION", "MESSAGE",
  "instructions", "Restrictions", "Date", "Actions", "Action", "Permissions", "Description",
  "Notes", "Client", "segment", "Segment", "Code", "Name", "Symbol", "Status", "Live",
  "Maintenance", "Marketing", "Notifications", "International", "Commerce", "Dashboard",
  "Workflow", "Occasion", "Cookies", "page.", "BOUTIQUE", "unisex", "EDITORIAL", "optional",
  "Optional", "VIP", "SKU", "SKU:", "Slug", "Slug:", "URL", "base (1)", "Detail {number}",
  "{count} points", "{label} ({rate}%)", "+ {size}", "SKU: {sku} • {category}",
  "JOURNAL · 0{n}", "HAUTE PARFUMERIE", "HM Signature — Haute Parfumerie",
  "HM Signature — Mystic Oud", "client@domain.com", "JazzCash Wallet", "Raast Instant ID",
  "Oud & Amber", "September 2026", "Coupons", "Admin",
  "Source", "Promotions", "Visible", "Occasions", "Photos", "Stock", "Projection","MANUAL", "{hours} h", "{minutes} min", "{days} d",
];
const shared = new Set(SHARED);

let flagged = 0;
for (const lang of langs.slice(1)) {
  const other = flat(dicts[lang]);
  const all = Object.keys(en).filter((k) => other[k] === en[k]);
  const bad = all.filter((k) => !shared.has(String(en[k]).trim()));
  flagged += bad.length;
  console.log(`${lang}: ${all.length} identical to English, ${bad.length} outside the shared-vocabulary set`);
  for (const k of bad) console.log(`   - ${k} = ${JSON.stringify(String(en[k]))}`);
}
console.log(`\nshared-vocabulary set carries ${SHARED.length} justified value(s)`);
if (flagged) process.exitCode = 1;
