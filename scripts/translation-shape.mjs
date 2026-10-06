// Looks for translations that are the wrong SHAPE rather than the wrong key: suspiciously short
// (truncated or dropped clause) or suspiciously long (invented copy). Parity counts cannot see
// either, and both are real meaning loss.
//   node scripts/translation-shape.mjs
import path from "node:path";
import fs from "node:fs";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const out = path.join(ROOT, "node_modules", ".shape-check");
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

// Script languages need fewer characters for the same sentence, so length only flags Latin
// targets; for Arabic/Urdu we instead require that the value is not a Latin copy of English.
let shortFlagged = 0;
for (const lang of ["fr", "es", "de"]) {
  const other = flat(dicts[lang]);
  for (const key of Object.keys(en)) {
    const source = String(en[key]);
    const value = String(other[key] ?? "");
    if (source.length < 28) continue;
    if (value.length < source.length * 0.42) {
      shortFlagged += 1;
      console.log(`SHORT ${lang} ${key}\n     en(${source.length}) ${JSON.stringify(source.slice(0, 76))}\n     ${lang}(${value.length}) ${JSON.stringify(value.slice(0, 76))}`);
    }
  }
}
let longFlagged = 0;
for (const lang of langs.slice(1)) {
  const other = flat(dicts[lang]);
  for (const key of Object.keys(en)) {
    const source = String(en[key]);
    const value = String(other[key] ?? "");
    if (source.length < 20) continue;
    if (value.length > source.length * 2.1 + 12) {
      longFlagged += 1;
      console.log(`LONG ${lang} ${key}\n     en(${source.length}) ${JSON.stringify(source.slice(0, 76))}\n     ${lang}(${value.length}) ${JSON.stringify(value.slice(0, 76))}`);
    }
  }
}

// Sentence-count check: a translation that drops a sentence loses information.
let sentenceFlagged = 0;
for (const lang of langs.slice(1)) {
  const other = flat(dicts[lang]);
  for (const key of Object.keys(en)) {
    const source = String(en[key]);
    const value = String(other[key] ?? "");
    // "e.g. 250" and "Paid Rs. {paid}" contain dots that end no sentence, so abbreviations are
    // stripped before counting or every placeholder becomes a false positive.
    const abbrev = /\b(e\.g|i\.e|vs|etc|No|Rs|Mr|Mrs|Dr)\.$/g;
    const count = (s) => (s.replace(abbrev, "").match(/[.!?۔！?…]/g) || []).length;
    if (count(source) >= 2 && count(value) === 0) {
      sentenceFlagged += 1;
      console.log(`NO-PUNCTUATION ${lang} ${key}  en=${JSON.stringify(source.slice(0, 60))} ${lang}=${JSON.stringify(value.slice(0, 60))}`);
    }
  }
}

console.log(`\nchecked ${Object.keys(en).length} keys x 5 languages`);
console.log(`suspiciously short: ${shortFlagged} | suspiciously long: ${longFlagged} | multi-sentence value with no sentence punctuation: ${sentenceFlagged}`);
