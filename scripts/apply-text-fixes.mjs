// Applies an exact-string list of translation corrections to the dictionaries.
// Every entry must match the expected number of times or the whole run aborts before
// writing anything, so a stale assumption can never half-edit a dictionary.
//
//   node scripts/apply-text-fixes.mjs tmp-i18n/ur-fixes-2.json [--dry-run]
//
// Entry: { "lang": "ur", "from": "...", "to": "...", "expected": 1 }
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const DRY = process.argv.includes("--dry-run");
if (!args.length) {
  console.error("usage: node scripts/apply-text-fixes.mjs <fixes.json> [--dry-run]");
  process.exit(1);
}

const fixes = JSON.parse(fs.readFileSync(path.resolve(ROOT, args[0]), "utf8"));
const byLang = new Map();
for (const f of fixes) {
  if (!f.lang || typeof f.from !== "string" || typeof f.to !== "string") {
    console.error("every entry needs lang, from and to");
    process.exit(1);
  }
  if (!byLang.has(f.lang)) byLang.set(f.lang, []);
  byLang.get(f.lang).push(f);
}

const texts = new Map();
let counted = 0;
for (const [lang, list] of byLang) {
  const file = path.join(ROOT, "src/i18n/dictionaries", `${lang}.ts`);
  let text = fs.readFileSync(file, "utf8");
  for (const f of list) {
    const n = text.split(f.from).length - 1;
    const want = f.expected ?? 1;
    if (n !== want) {
      console.error(`${lang}: REFUSING — ${n} match(es) for ${want}: ${f.from.slice(0, 70)}`);
      process.exit(1);
    }
    if (text.includes(f.to) && n === want && f.to.includes(f.from)) {
      console.error(`${lang}: REFUSING — ${f.to.slice(0, 50)} already contains the target text`);
      process.exit(1);
    }
    text = text.split(f.from).join(f.to);
    counted += 1;
  }
  texts.set(lang, text);
}

if (DRY) {
  console.log(`${counted} correction(s) across ${byLang.size} dictionary/dictionaries (dry run)`);
} else {
  for (const [lang, text] of texts) {
    fs.writeFileSync(path.join(ROOT, "src/i18n/dictionaries", `${lang}.ts`), text, "utf8");
  }
  console.log(`${counted} correction(s) applied to ${byLang.size} dictionary/dictionaries`);
}
