// Applies the recovered English admin copy to en.ts as a real nested namespace.
//
// Only the `admin` block is rewritten; every other line of en.ts is copied through unchanged,
// and the result is syntax-checked before it is written back. A flat dotted key such as
// "nav.localization" is reported too, because lookup() walks dot paths and can never reach it.
//
//   node scripts/apply-admin-en.mjs [--dry-run]
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const EN = path.join(root, "src/i18n/dictionaries/en.ts");
const DRY = process.argv.includes("--dry-run");

const auto = JSON.parse(fs.readFileSync(path.join(root, "tmp-i18n/admin-en.json"), "utf8"));
const manual = JSON.parse(fs.readFileSync(path.join(root, "tmp-i18n/admin-en-manual.json"), "utf8"));
const overlay = { ...auto.values, ...manual };
delete overlay._comment;

// Every admin key referenced in source must be covered before the block is written.
// Sidebar entries reference their label through `labelKey:`, so those count as references too.
const referenced = new Set();
(function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
      walk(p);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const text = fs.readFileSync(p, "utf8");
      for (const m of text.matchAll(/\bt\(\s*"(admin\.[\w.]+)"/g)) referenced.add(m[1]);
      for (const m of text.matchAll(/(?:labelKey|groupNameKey):\s*"(admin\.[\w.]+)"/g)) referenced.add(m[1]);
    }
  }
})(path.join(root, "src"));

const uncovered = [...referenced].filter((k) => !(k in overlay)).sort();
const invented = Object.keys(overlay).filter((k) => !referenced.has(k)).sort();

if (uncovered.length) {
  console.error(`refusing to write: ${uncovered.length} admin key(s) still have no English value`);
  for (const k of uncovered.slice(0, 30)) console.error(`  - ${k}`);
  process.exit(1);
}

/** Locates the current `admin` block so it can be replaced as a whole. */
function existingAdminBlock(source) {
  const lines = source.split("\n");
  const open = lines.findIndex((l) => /^  admin: \{$/.test(l));
  if (open === -1) throw new Error("no `admin: {` block found in en.ts");
  let close = open + 1;
  while (close < lines.length && !/^  \},?$/.test(lines[close])) close += 1;
  if (close >= lines.length) throw new Error("the admin block never closes");
  return { start: open, end: close, text: lines.slice(open + 1, close).join("\n") };
}

const source = fs.readFileSync(EN, "utf8");
const block = existingAdminBlock(source);

// The block is generated from the map alone, which makes re-runs byte-identical. Anything
// already in en.ts must therefore be present in the map, or the rewrite would lose it.
const groupNames = [...new Set([...block.text.matchAll(/^\s{4}"?([A-Za-z][\w]*)"? \{$/gm)].map((m) => m[1]))];
const leafNames = [...new Set([...block.text.matchAll(/^\s{6}"?([A-Za-z][\w]*)"?:(?! \{)/gm)].map((m) => m[1]))];
const lost = [
  ...groupNames.filter((g) => !Object.keys(overlay).some((k) => k.startsWith(`admin.${g}.`))),
  ...leafNames.filter((l) => !Object.keys(overlay).some((k) => k.split(".").pop() === l)),
];
if (lost.length) {
  console.error(`refusing to write: ${lost.length} existing admin entr(ies) not in the map`);
  for (const k of lost.slice(0, 20)) console.error(`  - ${k}`);
  process.exit(1);
}

const nested = {};
for (const [key, value] of Object.entries(overlay)) {
  const parts = key.split("."); // admin.<group>.<leaf>
  if (parts.length !== 3 || parts[0] !== "admin") {
    console.error(`refusing to write: ${key} is not an admin.<group>.<leaf> path`);
    process.exit(1);
  }
  const [, group, leaf] = parts;
  (nested[group] ??= {})[leaf] = value;
}

const quote = (s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n")}"`;
const rendered = ["  admin: {"];
for (const group of Object.keys(nested).sort()) {
  rendered.push(`    ${quote(group)}: {`);
  for (const [name, value] of Object.entries(nested[group])) rendered.push(`      ${quote(name)}: ${quote(String(value))},`);
  rendered.push("    },");
}
rendered.push("  },");

const lines = source.split("\n");
const output = [...lines.slice(0, block.start), ...rendered, ...lines.slice(block.end + 1)].join("\n");

const outDir = path.join(root, "node_modules", ".admin-en-check");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "en.ts"), output, "utf8");
await build({
  entryPoints: [path.join(outDir, "en.ts")],
  bundle: false,
  format: "esm",
  platform: "neutral",
  outfile: path.join(outDir, "en.mjs"),
  logLevel: "silent",
});
const parsed = await import(pathToFileURL(path.join(outDir, "en.mjs")).href);

let count = 0;
(function walk(node) {
  for (const value of Object.values(node)) {
    if (value && typeof value === "object") walk(value);
    else count += 1;
  }
})(parsed.en.admin);
if (count !== Object.keys(overlay).length)
  throw new Error(`block holds ${count} leaves but the map holds ${Object.keys(overlay).length}`);
for (const [key, value] of Object.entries(overlay)) {
  const [, group, leaf] = key.split(".");
  if (parsed.en.admin?.[group]?.[leaf] !== value) throw new Error(`${key} did not survive the rewrite`);
}

console.log(`admin keys in overlay:      ${Object.keys(overlay).length}`);
console.log(`admin leaves in new block:  ${count}`);
console.log(`referenced admin keys:      ${referenced.size}`);
console.log(`uncovered:                  0`);
console.log(`groups:                     ${Object.keys(nested).length}`);
console.log(`not referenced anywhere:    ${invented.length}${invented.length ? ` (${invented.slice(0, 6).join(", ")})` : ""}`);

if (DRY) console.log("dry run — en.ts untouched");
else {
  fs.writeFileSync(EN, output, "utf8");
  console.log("en.ts admin namespace written");
}
