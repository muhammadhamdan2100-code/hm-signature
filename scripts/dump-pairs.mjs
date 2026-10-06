// Prints en -> <language> value pairs for one namespace so a human can actually read the
// translations. Parity counts cannot tell you whether the wording is natural.
//   node scripts/dump-pairs.mjs ur home
//   node scripts/dump-pairs.mjs ur --all
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const out = path.join(ROOT, "node_modules", ".dump-pairs");
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

const target = process.argv[2] ?? "ur";
const scope = process.argv[3] === "--all" ? "" : (process.argv[3] ?? "");
const en = flat(dicts.en);
const other = flat(dicts[target]);
const keys = Object.keys(en).filter((k) => !scope || k === scope || k.startsWith(`${scope}.`));
for (const k of keys) console.log(`${k}\n  en: ${en[k]}\n  ${target}: ${other[k]}`);
console.log(`\n# ${keys.length} pair(s) — ${target}`);
