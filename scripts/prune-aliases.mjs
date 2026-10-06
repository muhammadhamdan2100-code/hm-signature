// Deletes unreferenced dictionary keys ONLY when two proofs hold:
//   1. no literal anywhere in src/, scripts/ or tests/ names the key, and no dynamic prefix
//      construction can reach it (scripts/unreferenced-triage.mjs decides that); and
//   2. another key carrying the byte-identical English value IS referenced — so the string is
//      demonstrably still on screen through that sibling and this entry is a superseded alias.
// Anything failing either proof is left in place and reported as retained.
//   node scripts/prune-aliases.mjs [--apply]
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const APPLY = process.argv.includes("--apply");
const LANGS = ["en", "ar", "fr", "es", "ur", "de"];
const out = path.join(ROOT, "node_modules", ".prune");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "e.mjs"), LANGS.map((l) => `export { ${l} } from ${JSON.stringify(path.join(ROOT, "src/i18n/dictionaries", `${l}.ts`))};`).join("\n"));
await build({ entryPoints: [path.join(out, "e.mjs")], bundle: true, format: "esm", platform: "node", outfile: path.join(out, "b.mjs"), logLevel: "silent" });
const dicts = await import(pathToFileURL(path.join(out, "b.mjs")).href);

const flat = (o, p = "", acc = []) => {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k;
    if (v && typeof v === "object") flat(v, key, acc);
    else acc.push({ key, value: String(v) });
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
for (const dir of ["scripts", "tests"]) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) if (/\.(ts|tsx|mjs|js)$/.test(e.name)) files.push(path.join(abs, e.name));
}
const texts = files.map((f) => fs.readFileSync(f, "utf8"));

const mentioned = (key) => texts.some((t) => t.includes(`"${key}"`) || t.includes(`'${key}'`) || t.includes('`' + key + '`'));
const calledDirectly = (key) => texts.some((t) => t.includes(`t("${key}"`));
const dynamicReachable = (key) => {
  for (const t of texts) {
    for (const m of t.matchAll(/["'`]([a-z][\w.]*)\.\$\{/g)) if (key.startsWith(m[1] + ".")) return true;
    for (const m of t.matchAll(/"([a-z][\w.]*\.)"\s*\+/g)) if (key.startsWith(m[1])) return true;
  }
  return false;
};

const referencedValueToKey = new Map();
for (const l of leaves) if (calledDirectly(l.key) || (mentioned(l.key) && !l.key.startsWith("admin."))) {
  if (!referencedValueToKey.has(l.value)) referencedValueToKey.set(l.value, []);
  referencedValueToKey.get(l.value).push(l.key);
}

const PROTECTED = /^(status\.|seo\.|faq\.|home\.hero)/;
const doomed = [];
const retained = [];
for (const l of leaves) {
  if (calledDirectly(l.key) || mentioned(l.key) || dynamicReachable(l.key)) continue;
  if (PROTECTED.test(l.key)) { retained.push(l); continue; }
  const siblings = (referencedValueToKey.get(l.value) || []).filter((k) => k !== l.key);
  if (siblings.length) doomed.push({ ...l, twin: siblings[0] });
  else retained.push(l);
}

console.log(`superseded aliases to delete: ${doomed.length}`);
for (const d of doomed) console.log(`  - ${d.key} = ${JSON.stringify(d.value.slice(0, 40))}  (identical copy served by ${d.twin})`);
console.log(`unreferenced but retained (no twin proof, or reachable only in ways not provable): ${retained.length}`);
for (const r of retained.slice(0, 60)) console.log(`  = ${r.key} = ${JSON.stringify(r.value.slice(0, 44))}`);

if (!APPLY) { console.log("\ndry run — pass --apply to remove from all six dictionaries"); process.exit(0); }

// Line removal: walk each dictionary with an indent stack, delete the leaf line for a doomed key
// in every language, then syntax-check before writing.
const byParent = new Map();
for (const d of doomed) {
  const parts = d.key.split(".");
  const parent = parts.slice(0, -1).join(".");
  if (!byParent.has(parent)) byParent.set(parent, []);
  byParent.get(parent).push(parts[parts.length - 1]);
}
for (const lang of LANGS) {
  const file = path.join(ROOT, "src/i18n/dictionaries", `${lang}.ts`);
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const stack = [];
  const drop = new Set();
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    const indent = line.length - line.trimStart().length;
    while (stack.length && stack.at(-1).indent >= indent) stack.pop();
    const open = /^"?([A-Za-z][\w]*)"?: \{$/.exec(trimmed);
    const name = open?.[1] ?? /^"?([A-Za-z][\w]*)"?:/.exec(trimmed)?.[1];
    if (!name) return;
    const parent = stack.map((s) => s.name).join(".");
    if (!open && byParent.get(parent)?.includes(name)) drop.add(i);
    if (open) stack.push({ name, indent });
  });
  const kept = lines.filter((_, i) => !drop.has(i));
  await (await import("esbuild")).transform(kept.join("\n"), { loader: "ts" });
  if (kept.join("\n") !== lines.join("\n")) fs.writeFileSync(file, kept.join("\n"), "utf8");
  console.log(`${lang}: removed ${lines.length - kept.length} line(s)`);
}
