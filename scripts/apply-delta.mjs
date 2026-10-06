// Merges translation deltas produced by the localization agents into the six dictionaries.
//
// Dictionary writes are deliberately single-threaded: earlier concurrent edits created
// duplicated groups whose later definition silently shadowed reviewed translations. Agents
// therefore only write JSON deltas, and this script is the sole path into en/ar/fr/es/ur/de.
//
//   node scripts/apply-delta.mjs tmp-i18n/delta-*.json [--dry-run]
//
// Delta shape: { "admin.dashboard.publishedFragrances": { "en": "...", "ar": "...", "fr": "...",
// "es": "...", "ur": "...", "de": "..." } }
import fs from "node:fs";
import path from "node:path";
import { transform } from "esbuild";

const ROOT = path.resolve(import.meta.dirname, "..");
const LANGS = ["en", "ar", "fr", "es", "ur", "de"];
const DRY = process.argv.includes("--dry-run");

const deltaFiles = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!deltaFiles.length) {
  console.error("usage: node scripts/apply-delta.mjs <delta.json ...> [--dry-run]");
  process.exit(1);
}

const delta = {};
for (const file of deltaFiles) {
  const raw = JSON.parse(fs.readFileSync(path.resolve(ROOT, file), "utf8"));
  for (const [key, values] of Object.entries(raw)) {
    if (key in delta && JSON.stringify(delta[key]) !== JSON.stringify(values)) {
      console.error(`CONFLICT — ${key} defined twice with different values in ${file}`);
      process.exit(1);
    }
    const missing = LANGS.filter((l) => typeof values[l] !== "string" || values[l].trim() === "");
    if (missing.length) {
      console.error(`REFUSING — ${key} has no value for ${missing.join(", ")}`);
      process.exit(1);
    }
    delta[key] = values;
  }
}

const keys = Object.keys(delta).sort();
// Insert longest parent paths first so a chain ("admin.a.b" then "admin.a") builds top-down
// and the deeper group already exists when its siblings are written.
const byParent = new Map();
for (const key of keys) {
  const parent = key.split(".").slice(0, -1).join(".");
  if (!byParent.has(parent)) byParent.set(parent, []);
  byParent.get(parent).push(key);
}
const parents = [...byParent.keys()].sort((a, b) => b.split(".").length - a.split(".").length);

function linesOf(lang) {
  return fs.readFileSync(path.join(ROOT, "src/i18n/dictionaries", `${lang}.ts`), "utf8").split("\n");
}

function isInfo(line) {
  const t = line.trim();
  return !t || t.startsWith("//") || t.startsWith("/*") || t.startsWith("*");
}
const indentOf = (line) => line.length - line.trimStart().length;

function namePattern(name) {
  return new RegExp(`^"?${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"?\\s*:\\s*\\{$`);
}
function leafPattern(name) {
  return new RegExp(`^"?${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"?\\s*:`);
}

function findRootObject(lines) {
  let openLine = -1;
  for (let n = 0; n < lines.length; n++) if (/^export const \w+\s*[:=].*\{\s*$/.test(lines[n])) { openLine = n; break; }
  if (openLine < 0) throw new Error("dictionary has no `export const x = {` header");
  let bodyEnd = lines.length - 1;
  for (let n = lines.length - 1; n > openLine; n--) {
    if (/^\};?\s*$/.test(lines[n])) { bodyEnd = n - 1; break; }
  }
  return { openLine, bodyStart: openLine + 1, bodyEnd };
}

// Locates a group by dot path and returns the line range of its body.
function findGroup(lines, dotted) {
  const parts = dotted.split(".").filter(Boolean);
  if (!parts.length) {
    const root = findRootObject(lines);
    return { exists: true, openLine: root.openLine, indent: 0, bodyStart: root.bodyStart, bodyEnd: root.bodyEnd };
  }
  let start = 0;
  let end = lines.length - 1;
  let indent = 0;
  for (let i = 0; i < parts.length; i++) {
    const want = i === 0 ? new RegExp(`^\\s*${parts[i]}\\s*:\\s*\\{$`) : namePattern(parts[i]);
    let found = -1;
    for (let n = start; n <= end; n++) {
      if (isInfo(lines[n])) continue;
      if (i === 0) {
        if (want.test(lines[n])) { found = n; break; }
        continue;
      }
      if (indentOf(lines[n]) === indent + 2 && want.test(lines[n].trim())) { found = n; break; }
    }
    if (found < 0) return { exists: false, found: parts.slice(0, i), bodyStart: start, bodyEnd: end };
    indent = indentOf(lines[found]);
    let bodyEnd = end;
    for (let n = found + 1; n <= end; n++) {
      if (isInfo(lines[n])) continue;
      if (indentOf(lines[n]) <= indent) { bodyEnd = n - 1; break; }
    }
    start = found + 1;
    end = bodyEnd;
    if (i === parts.length - 1) return { exists: true, openLine: found, indent, bodyStart: start, bodyEnd: end };
  }
  return { exists: false, found: parts, bodyStart: start, bodyEnd: end };
}

function lastContentLine(lines, from, to) {
  let last = from - 1;
  for (let n = from; n <= to; n++) if (!isInfo(lines[n])) last = n;
  return last;
}

// Existing siblings decide whether this dictionary writes keys quoted or bare; a brand-new
// group follows the file's dominant storefront style (bare identifiers).
function siblingQuoted(lines, from, to) {
  for (let n = from; n <= to; n++) {
    if (isInfo(lines[n])) continue;
    if (/^\s*"\w+"?\s*:/.test(lines[n])) return true;
    if (/^\s*\w+\s*:/.test(lines[n])) return false;
  }
  return false;
}

const edited = new Map();
let inserted = 0;
let skipped = 0;
const problems = [];

for (const lang of LANGS) {
  const file = path.join(ROOT, "src/i18n/dictionaries", `${lang}.ts`);
  const lines = linesOf(lang);
  edited.set(lang, lines);

  for (const parent of parents) {
    for (const key of byParent.get(parent)) {
      const leafName = key.split(".").pop();
      const value = delta[key][lang];

      const at = findGroup(lines, parent);
      if (!at.exists) {
        // Build the missing chain, innermost first, anchored in the deepest real ancestor.
        const anchorPath = at.found.join(".");
        const root = findRootObject(lines);
        const anchor = anchorPath
          ? findGroup(lines, anchorPath)
          : { exists: true, bodyStart: root.bodyStart, bodyEnd: root.bodyEnd, indent: 0 };
        if (!anchor.exists) {
          problems.push(`${lang}: cannot locate ${anchorPath} for ${key}`);
          continue;
        }
        const missingParts = parent ? parent.split(".").slice(anchorPath ? anchorPath.split(".").length : 0) : [];
        const atInsert = lastContentLine(lines, anchor.bodyStart, anchor.bodyEnd);
        const quoted = siblingQuoted(lines, anchor.bodyStart, anchor.bodyEnd);
        const chunk = [];
        missingParts.forEach((part, i) => {
          const p = anchor.indent + 2 + i * 2;
          chunk.push(`${" ".repeat(p)}${quoted ? JSON.stringify(part) : part}: {`);
        });
        chunk.push(
          `${" ".repeat(anchor.indent + missingParts.length * 2 + 2)}${JSON.stringify(leafName)}: ${JSON.stringify(value)},`
        );
        for (let i = missingParts.length - 1; i >= 0; i--) {
          chunk.push(`${" ".repeat(anchor.indent + 2 + i * 2)}},`);
        }
        lines.splice(atInsert + 1, 0, ...chunk);
        inserted += 1;
        continue;
      }

      // Duplicate guard: a repeated name in one parent is legal JS but the later definition
      // wins, so it must never be written silently.
      let existing = -1;
      for (let n = at.bodyStart; n <= at.bodyEnd; n++) {
        if (isInfo(lines[n])) continue;
        if (indentOf(lines[n]) === at.indent + 2 && leafPattern(leafName).test(lines[n].trim())) { existing = n; break; }
      }
      if (existing >= 0) {
        const current = lines[existing];
        if (current.includes(JSON.stringify(value))) { skipped += 1; continue; }
        problems.push(`${lang}: ${key} already exists with a different value (line ${existing + 1}) — refusing to duplicate`);
        continue;
      }
      const atInsert = lastContentLine(lines, at.bodyStart, at.bodyEnd);
      const quoted = siblingQuoted(lines, at.bodyStart, at.bodyEnd);
      lines.splice(atInsert + 1, 0, `${" ".repeat(at.indent + 2)}${quoted ? JSON.stringify(leafName) : leafName}: ${JSON.stringify(value)},`);
      inserted += 1;
    }
  }
}

if (problems.length) {
  console.error("REFUSING to write — resolve these first:");
  for (const p of problems.slice(0, 40)) console.error(`   - ${p}`);
  process.exit(1);
}

for (const lang of LANGS) {
  const text = edited.get(lang).join("\n");
  await transform(text, { loader: "ts" }); // syntax gate before anything touches disk
}

if (DRY) {
  console.log(`${keys.length} key(s) ready, ${inserted} insert(s), ${skipped} already present (dry run)`);
} else {
  for (const lang of LANGS) {
    const file = path.join(ROOT, "src/i18n/dictionaries", `${lang}.ts`);
    fs.writeFileSync(file, edited.get(lang).join("\n"), "utf8");
  }
  console.log(`${keys.length} key(s): ${inserted} insert(s), ${skipped} already present — written to all six dictionaries`);
}
