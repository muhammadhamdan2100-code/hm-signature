// Finds localisation defects that parity alone cannot see:
//   - a call site that does not pass every {token} its value needs (renders literally)
//   - a value passed to t() that the dictionary does not define (renders humanized)
//   - user-visible English still hard-coded in JSX text or in a visible attribute
//   - raw key strings, undefined/NaN leaking into render
//
//   node scripts/leakage-scan.mjs
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const out = path.join(ROOT, "node_modules", ".leak");
fs.mkdirSync(out, { recursive: true });
const langs = ["en", "ar", "fr", "es", "ur", "de"];
fs.writeFileSync(
  path.join(out, "e.mjs"),
  langs.map((l) => `export { ${l} } from ${JSON.stringify(path.join(ROOT, "src/i18n/dictionaries", `${l}.ts`))};`).join("\n")
);
await build({ entryPoints: [path.join(out, "e.mjs")], bundle: true, format: "esm", platform: "node", outfile: path.join(out, "b.mjs"), logLevel: "silent" });
const dicts = await import(pathToFileURL(path.join(out, "b.mjs")).href);

const files = [];
(function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(ent.name) && !p.includes(`${path.sep}dictionaries${path.sep}`)) files.push(p);
  }
})(path.join(ROOT, "src"));

const VALUE_TOKENS = (s) => new Set((String(s).match(/\{\w+\}/g) || []).map((t) => t.slice(1, -1)));
const en = dicts.en;
const lookup = (key) => key.split(".").reduce((a, x) => (a == null ? undefined : a[x]), en);

const problems = { missingToken: [], unknownKey: [], rawKeyRender: [], undefRender: [], hardCoded: [] };

// Attributes and JSX text that reach the screen.
const VISIBLE_ATTRS = ["placeholder", "title", "aria-label", "alt", "label", "emptyMessage", "emptySubtitle", "header", "subtitle", "description"];

for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  const isAdmin = rel.startsWith("src/admin/");
  const src = fs.readFileSync(file, "utf8");
  const lines = src.split("\n");

  lines.forEach((line, i) => {
    // 1. t("k", { ... }) must supply every token the English value contains.
    // `withNodes(t("k"), { from: <jsx/> })` fills the tokens with React nodes instead, so
    // those calls pass their variables to the wrapper and are skipped here.
    if (/withNodes\(\s*$|withNodes\(\s*t\(/.test(line)) return;
    for (const m of line.matchAll(/\bt\(\s*"([\w.]+)"\s*(?:,\s*\{([^}]*)\})?\s*\)/g)) {
      const [, key, vars] = m;
      const value = lookup(key);
      if (typeof value !== "string") {
        if (key.split(".")[0] !== "admin" || !/^\$\{|%s|\$\{/.test(key)) problems.unknownKey.push(`${rel}:${i + 1} ${key}`);
        continue;
      }
      const needed = VALUE_TOKENS(value);
      if (!needed.size) continue;
      const given = new Set(
        vars ? [...vars.matchAll(/(?:^|[{,\s])([A-Za-z_]\w*)\s*(?::|\s*[,}]|\s*$)/g)].map((x) => x[1]) : []
      );
      // A spread or computed vars object cannot be checked statically.
      if (vars && /\.\.\./.test(vars)) continue;
      for (const token of needed) if (!given.has(token)) problems.missingToken.push(`${rel}:${i + 1} ${key} needs {${token}}`);
    }

    // 2. A dotted key rendered as text would be a raw key on screen.
    for (const m of line.matchAll(/>\s*([a-z][\w]*\.[\w.]+)\s*</g)) problems.rawKeyRender.push(`${rel}:${i + 1} ${m[1]}`);

    // 3. Literal undefined/NaN in JSX text.
    for (const m of line.matchAll(/\{\s*(undefined|NaN|null)\s*\}/g)) problems.undefRender.push(`${rel}:${i + 1} ${m[1]}`);

    // 4. Visible English still hard-coded (JSX text or visible attribute), excluding data.
    const text = line.match(/>\s*([A-Z][A-Za-z0-9](?:[A-Za-z0-9 ,.:;&'()/?+%-]*[A-Za-z0-9.!?%>]))\s*</);
    if (text && !/^\s*(\{\/\*|\{`)/.test(line) && !/\bt\(/.test(line)) {
      const words = text[1].trim().split(/\s+/);
      if (words.length >= 2 && !/HM SIGNATURE|JazzCash|Raast|PayFast|Supabase|DHL|SELECT|HTML|JSON|PKR/i.test(text[1]))
        problems.hardCoded.push(`${isAdmin ? "admin " : "STORE "}${rel}:${i + 1} ${JSON.stringify(text[1].trim().slice(0, 60))}`);
    }
    for (const attr of VISIBLE_ATTRS) {
      const m = new RegExp(`${attr}="([A-Z][A-Za-z][^"]{4,})"`).exec(line);
      if (m && !/\blang=/.test(line)) problems.hardCoded.push(`${isAdmin ? "admin " : "STORE "}${rel}:${i + 1} ${attr}=${JSON.stringify(m[1].slice(0, 50))}`);
    }

    // 5. JSX text that wraps across lines: a text-only line sitting between tags. One-line
    //    matching above cannot see it, and the browser QA sweep proved it hides real leakage.
    if (/^[A-Z][A-Za-z][A-Za-z0-9 ,.:;&'()!?/-]{4,}$/.test(line.trim())) {
      const prev = (lines[i - 1] ?? "").trimEnd();
      const next = (lines[i + 1] ?? "").trimStart();
      const inJsx = /[>{]$/.test(prev) || /^</.test(next) || /^{\/\./.test(next);
      const words = line.trim().split(/\s+/);
      if (inJsx && words.length >= 2 && !/\bt\(/.test(line)) {
        problems.hardCoded.push(`${isAdmin ? "admin " : "STORE "}${rel}:${i + 1} jsx-text=${JSON.stringify(line.trim().slice(0, 60))}`);
      }
    }
  });
}

const dedupe = (a) => [...new Set(a)];
const SCOPE = process.argv.includes("--scope") ? process.argv[process.argv.indexOf("--scope") + 1] : null;
for (const [kind, list] of Object.entries(problems)) {
  const items = dedupe(list);
  console.log(`${kind}: ${items.length}`);
  if (kind === "hardCoded") {
    const store = items.filter((x) => x.startsWith("STORE "));
    const adm = items.filter((x) => x.startsWith("admin "));
    console.log(`   STORE ${store.length} / admin ${adm.length}`);
    const chosen = SCOPE === "admin" ? adm : SCOPE === "store" ? store : [...adm, ...store];
    for (const s of chosen.slice(0, SCOPE ? 500 : 30)) console.log(`   - ${s}`);
  } else for (const s of items.slice(0, 30)) console.log(`   - ${s}`);
}
console.log(`\nscanned ${files.length} source files`);
