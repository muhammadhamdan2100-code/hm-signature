// Lists dictionary keys no source file references, grouped so near-duplicate wording left
// behind by a conversion pass is visible. Parity counts cannot see dead keys.
//   node scripts/unreferenced-keys.mjs [--words]
import path from "node:path";
import fs from "node:fs";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const out = path.join(ROOT, "node_modules", ".unused-keys");
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

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name) && !p.includes(`${path.sep}dictionaries${path.sep}`)) files.push(p);
  }
})(path.join(ROOT, "src"));

const referenced = new Set();
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/\bt\(\s*"([a-z][\w.]*)"/g)) referenced.add(m[1]);
  for (const m of text.matchAll(/\b(?:titleKey|excerptKey|bodyKey|ctaKey|labelKey|groupNameKey|sectionKey):\s*"([\w.]+)"/g))
    referenced.add(m[1]);
}

const unused = Object.keys(en).filter((k) => !referenced.has(k));
const grouped = {};
for (const k of unused) {
  const ns = k.split(".").slice(0, 2).join(".");
  grouped[ns] = (grouped[ns] || 0) + 1;
}
console.log(`unreferenced keys: ${unused.length} of ${Object.keys(en).length}`);
console.log(Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, v]) => `${k}=${v}`).join(", "));

// A single-word label nobody references is harmless housekeeping; an unused multi-word
// sentence usually means two keys were authored for the same string.
const multi = unused.filter((k) => String(en[k]).split(/\s+/).length > 3);
console.log(`\nunreferenced multi-word values: ${multi.length}`);
if (process.argv.includes("--words")) for (const k of multi) console.log(`   ${k} = ${JSON.stringify(String(en[k]).slice(0, 70))}`);
