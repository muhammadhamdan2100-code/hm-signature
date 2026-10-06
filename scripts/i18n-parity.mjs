// Reports dictionary key parity plus referenced/missing keys, so "missing = 0" is a
// measured number rather than an impression.
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "node_modules", ".i18n-parity");
fs.mkdirSync(out, { recursive: true });
const entry = path.join(out, "entry.mjs");
fs.writeFileSync(
  entry,
  [
    `export { en } from ${JSON.stringify(path.join(root, "src/i18n/dictionaries/en.ts"))};`,
    `export { ar } from ${JSON.stringify(path.join(root, "src/i18n/dictionaries/ar.ts"))};`,
    `export { fr } from ${JSON.stringify(path.join(root, "src/i18n/dictionaries/fr.ts"))};`,
    `export { es } from ${JSON.stringify(path.join(root, "src/i18n/dictionaries/es.ts"))};`,
    `export { ur } from ${JSON.stringify(path.join(root, "src/i18n/dictionaries/ur.ts"))};`,
    `export { de } from ${JSON.stringify(path.join(root, "src/i18n/dictionaries/de.ts"))};`,
  ].join("\n")
);
await build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: path.join(out, "bundle.mjs"),
  logLevel: "silent",
});
const dicts = await import(pathToFileURL(path.join(out, "bundle.mjs")).href);

function flatten(obj, prefix = "", acc = []) {
  for (const [key, value] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") flatten(value, p, acc);
    else acc.push({ path: p, value });
  }
  return acc;
}

const languages = ["en", "ar", "fr", "es", "ur", "de"];
const maps = {};
for (const lang of languages) maps[lang] = new Map(flatten(dicts[lang]).map((e) => [e.path, e.value]));

const enKeys = [...maps.en.keys()];
console.log(`en leaves: ${enKeys.length}`);

// Referenced keys: every t("a.b.c") literal in src, plus dynamic *Key props that
// resolve to a dictionary path through the *_Key data tables.
const files = [];
(function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(ent.name) && !p.includes(`${path.sep}dictionaries${path.sep}`)) files.push(p);
  }
})(path.join(root, "src"));

const referenced = new Set();
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/\bt\(\s*"([a-z][\w]*(?:\.[\w]+)+)"/g)) referenced.add(m[1]);
  for (const m of text.matchAll(/\b(?:titleKey|excerptKey|bodyKey|ctaKey|labelKey|groupNameKey|sectionKey):\s*"([\w.]+)"/g))
    referenced.add(m[1]);
}
const refList = [...referenced].sort();
const missingFromEn = refList.filter((k) => !maps.en.has(k));
const adminRef = refList.filter((k) => k.startsWith("admin."));
const adminMissing = adminRef.filter((k) => !maps.en.has(k));

console.log(`referenced keys: ${refList.length}`);
console.log(`  admin.* referenced: ${adminRef.length}`);
console.log(`  admin.* missing from en: ${adminMissing.length}`);
console.log(`  any referenced key missing from en: ${missingFromEn.length}`);
if (missingFromEn.length) console.log(missingFromEn.slice(0, 40).map((k) => `    - ${k}`).join("\n"));

const unused = enKeys.filter((k) => !referenced.has(k));
console.log(`en keys never referenced by a literal t("..."): ${unused.length}`);

// A duplicated nested group (`payments: {…}` twice) is legal JavaScript and the last one wins,
// so the key-set comparison above cannot see it: 40 reviewed translations can vanish silently.
// This walks the source text with an indent stack and reports any repeated name in one parent.
function duplicateNames(lang) {
  const text = fs.readFileSync(path.join(root, "src/i18n/dictionaries", `${lang}.ts`), "utf8");
  const stack = [];
  const seen = new Map();
  const dupes = [];
  text.split("\n").forEach((line, number) => {
    if (!line.trim() || line.trim().startsWith("//")) return;
    const indent = line.length - line.trimStart().length;
    while (stack.length && stack.at(-1).indent >= indent) stack.pop();
    const open = /^"?([A-Za-z][\w]*)"?: \{$/.exec(line.trim());
    const leaf = /^"?([A-Za-z][\w]*)"?: (?!)/.exec(line.trim());
    const name = open?.[1] ?? leaf?.[1];
    if (!name) return;
    const parent = stack.map((s) => s.name).join(".");
    const key = `${parent}.${name}`;
    if (seen.has(key)) dupes.push(`${key} (lines ${seen.get(key)} and ${number + 1})`);
    else seen.set(key, number + 1);
    if (open) stack.push({ name, indent });
  });
  return dupes;
}

for (const lang of languages) {
  const dupes = duplicateNames(lang);
  if (dupes.length) {
    console.error(`${lang}: DUPLICATE KEYS IN SOURCE — the later definition wins and the earlier is dead:`);
    for (const d of dupes.slice(0, 10)) console.error(`   - ${d}`);
    process.exitCode = 1;
  }
}
console.log(`duplicate nested keys across all six dictionaries: ${languages.reduce((n, l) => n + duplicateNames(l).length, 0)}`);

let emptyValues = 0;
for (const lang of languages)
  for (const [, value] of maps[lang]) if (typeof value !== "string" || value.trim() === "") emptyValues++;
console.log(`empty/non-string values across all dictionaries: ${emptyValues}`);

for (const lang of languages) {
  if (lang === "en") continue;
  const missing = enKeys.filter((k) => !maps[lang].has(k));
  const extra = [...maps[lang].keys()].filter((k) => !maps.en.has(k));
  const latin = [...maps[lang].entries()].filter(
    ([k, v]) =>
      (lang === "ar" || lang === "ur") &&
      typeof v === "string" &&
      !/[؀-ۿؠ-٩ݐ-ݿ]/.test(v) &&
      !/^[\s\d\-–—.,:;!?%$/€£"'+*()°#&@=[\]{}|_]/.test(v)
  );
  console.log(
    `${lang}: leaves ${maps[lang].size} | missing vs en ${missing.length} | extra ${extra.length}` +
      (latin.length ? ` | no-native-script ${latin.length}` : "")
  );
  if (missing.length) console.log(missing.slice(0, 12).map((k) => `    - ${k}`).join("\n"));
  if (extra.length) console.log(extra.slice(0, 12).map((k) => `    + ${k}`).join("\n"));
}
