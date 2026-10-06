// Decides what to do with dictionary keys that no literal t("…") mentions.
//
// A key is NOT dead just because `t("key")` is absent: StatusBadge builds `admin.status.${value}`
// at runtime, Hero passes `"home.heroEyebrow"` to a CMS-fallback helper as a plain argument, and
// several screens keep key names in data tables (`labelKey`, `titleKey`, quick-reply arrays).
// This reports each unreferenced key against the evidence that could explain it.
//   node scripts/unreferenced-triage.mjs [--json]
import path from "node:path";
import fs from "node:fs";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const out = path.join(ROOT, "node_modules", ".triage");
fs.mkdirSync(out, { recursive: true });
const langs = ["en", "ar", "fr", "es", "ur", "de"];
fs.writeFileSync(
  path.join(out, "e.mjs"),
  `export { en } from ${JSON.stringify(path.join(ROOT, "src/i18n/dictionaries/en.ts"))};`
);
await build({ entryPoints: [path.join(out, "e.mjs")], bundle: true, format: "esm", platform: "node", outfile: path.join(out, "b.mjs"), logLevel: "silent" });
const dicts = await import(pathToFileURL(path.join(out, "b.mjs")).href);

const flat = (o, p = "", acc = []) => {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k;
    if (v && typeof v === "object") flat(v, key, acc);
    else acc.push({ key, value: v });
  }
  return acc;
};
const leaves = flat(dicts.en);

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name) && !p.includes(`${path.sep}dictionaries${path.sep}`)) files.push(p);
  }
})(path.join(ROOT, "src"));
// Scripts and config are allowed to name keys too (recovery/merge tooling, tests).
for (const dir of ["scripts", "tests"]) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (/\.(ts|tsx|mjs|js)$/.test(e.name)) files.push(path.join(abs, e.name));
  }
}

const texts = new Map();
for (const f of files) texts.set(path.relative(ROOT, f).split(path.sep).join("/"), fs.readFileSync(f, "utf8"));

const literalKeys = new Map();
const dynamicPrefixes = new Map();
const KEY_PROPS = /\b(?:titleKey|excerptKey|bodyKey|ctaKey|labelKey|groupNameKey|sectionKey|key|keyName)\s*:\s*"([\w.]+)"/g;
for (const [relFile, text] of texts) {
  for (const m of text.matchAll(/\bt\(\s*"([\w.]+)"/g)) push(literalKeys, m[1], relFile);
  for (const m of text.matchAll(KEY_PROPS)) push(literalKeys, m[1], relFile);
  // Any string literal that looks like a dictionary path (ns.group.leaf) — covers arrays of keys.
  for (const m of text.matchAll(/"([a-z][\w]*(?:\.[\w]+){1,})"/g)) {
    if (leaves.some((l) => l.key === m[1])) push(literalKeys, m[1], relFile);
  }
  // `admin.status.${x}` / "admin.status." + x  → prefix evidence.
  for (const m of text.matchAll(/"([a-z][\w.]*)\.\$\{/g)) push(dynamicPrefixes, m[1] + ".", relFile);
  for (const m of text.matchAll(/`([a-z][\w.]*)\.\$\{/g)) push(dynamicPrefixes, m[1] + ".", relFile);
  for (const m of text.matchAll(/"([a-z][\w.]*\.)"\s*\+/g)) push(dynamicPrefixes, m[1], relFile);
}
function push(map, key, where) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(where);
}

const rows = [];
for (const leaf of leaves) {
  const direct = literalKeys.get(leaf.key);
  if (direct && [...texts.keys()].some((f) => direct.has(f) && f.startsWith("src/") && /\bt\(\s*"/.test(texts.get(f)) && texts.get(f).includes(`t("${leaf.key}"`))) {
    continue; // real t("key") call site
  }
  const dynamic = [...dynamicPrefixes.entries()].filter(([prefix]) => leaf.key.startsWith(prefix));
  if (dynamic.length) { rows.push({ ...leaf, verdict: "DYNAMIC", evidence: dynamic.map(([p, s]) => `${p} in ${[...s][0]}`).join("; ") }); continue; }
  if (direct) { rows.push({ ...leaf, verdict: "LITERAL-ELSEWHERE", evidence: [...direct].slice(0, 3).join(", ") }); continue; }
  rows.push({ ...leaf, verdict: "UNUSED-CANDIDATE", evidence: "" });
}

// A key is only safely removable when the value is not reachable AND it is not the English
// master copy for something the CMS may still be storing verbatim (Hero bridge, section titles):
// those fall back by comparing stored copy to the dictionary value, so removal changes behaviour.
const cmsBridged = new Set();
const heroTexts = texts.get("src/components/Hero.tsx") || "";
for (const leaf of rows) if (heroTexts.includes(`"${leaf.key}"`)) cmsBridged.add(leaf.key);

const counts = { DYNAMIC: 0, "LITERAL-ELSEWHERE": 0, "UNUSED-CANDIDATE": 0 };
for (const r of rows) counts[r.verdict] += 1;
const removable = rows.filter((r) => r.verdict === "UNUSED-CANDIDATE" && !cmsBridged.has(r.key));
const keptByCms = rows.filter((r) => r.verdict === "UNUSED-CANDIDATE" && cmsBridged.has(r.key));

console.log(`keys: ${leaves.length} · no literal t("…") call site: ${rows.length}`);
for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
console.log(`  CMS/hero-bridged (keep): ${keptByCms.length}`);
console.log(`  conclusively removable: ${removable.length}`);
if (process.argv.includes("--json")) {
  fs.writeFileSync(path.join(ROOT, "tmp-i18n", "unreferenced-triage.json"), JSON.stringify({ rows, removable: removable.map((r) => r.key), keptByCms: keptByCms.map((r) => r.key) }, null, 2));
  console.log("wrote tmp-i18n/unreferenced-triage.json");
}
for (const r of removable) console.log(`  - ${r.key} = ${JSON.stringify(String(r.value).slice(0, 58))}`);
