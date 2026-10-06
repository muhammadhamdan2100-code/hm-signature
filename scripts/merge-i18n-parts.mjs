// Merges src/i18n/dictionaries/_parts/*.en.ts into en.ts.
//
// Surgical on purpose: it inserts missing lines into the existing file instead of
// regenerating it, so the header comments and the already-reviewed formatting survive.
// A one-shot rewrite of en.ts duplicated a namespace and dropped those comments, which is
// the failure this version is written to avoid.
//
//   node scripts/merge-i18n-parts.mjs [--dry-run]

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../src/i18n/dictionaries");
const EN = join(ROOT, "en.ts");
const PARTS = join(ROOT, "_parts");
const DRY = process.argv.includes("--dry-run");

/** `[{ ns, key, value }]` for every namespace/leaf currently in en.ts. */
function readEn(source) {
  const leaves = [];
  let ns = null;
  let pending = null;
  for (const line of source.split("\n")) {
    const open = /^  "?([A-Za-z][\w]*)"?: \{$/.exec(line);
    if (open) {
      ns = open[1];
      pending = null;
      continue;
    }
    if (ns && /^  \},?$/.test(line)) {
      ns = null;
      pending = null;
      continue;
    }
    const key = ns && /^    (?:"([^"]+)"|([A-Za-z][\w]*)):/.exec(line);
    if (key) {
      const name = key[1] ?? key[2];
      leaves.push({ ns, key: name });
      pending = `${ns}.${name}`;
      continue;
    }
    if (pending && /^\s{6,}\S/.test(line)) {
      /* continuation of a wrapped value; already counted under its key */
    }
  }
  return leaves;
}

/** Every `export const <ns> = { … }` block in a parts file, with its entry lines. */
function readParts(source, fileName) {
  const blocks = [];
  let current = null;
  for (const line of source.split("\n")) {
    const open = /^export const ([A-Za-z][\w]*) = \{$/.exec(line);
    if (open && !current) {
      current = { ns: open[1], entries: [] };
      continue;
    }
    if (current && /^\};$/.test(line)) {
      blocks.push(current);
      current = null;
      continue;
    }
    if (current && line.trim() && !line.trim().startsWith("//")) current.entries.push(line.trim());
  }
  if (current) throw new Error(`${fileName}: unclosed export const ${current.ns}`);
  return blocks;
}

/** Splits a block's raw lines into `key -> value`, one flat line each. */
function toEntries(rawEntries) {
  const pairs = [];
  let buffer = null;
  for (const entry of rawEntries) {
    // Placeholders such as {name} appear inside the translated text, so nesting must NOT be
    // tracked by counting braces here; only a line that opens with a key starts an entry.
    const starts = /^"([^"]+)":(?:\s.*)?$|^([A-Za-z][\w]*):(?:\s.*)?$/.exec(entry);
    const inline = starts ? entry.replace(/^"[^"]+"?:\s*/, "").replace(/^[A-Za-z][\w]*:\s*/, "").replace(/,$/, "") : null;
    if (starts) {
      if (buffer) pairs.push(buffer);
      buffer = { key: (starts[1] ?? starts[2]).trim(), value: inline || "" };
    } else if (buffer) {
      const text = entry.replace(/,$/, "");
      buffer.value = buffer.value ? `${buffer.value} ${text}` : text;
    }
  }
  if (buffer) pairs.push(buffer);
  for (const pair of pairs) {
    if (!pair.value) throw new Error(`entry ${pair.key} has no value`);
  }
  return pairs;
}

const quote = (name) => (/^[\w]+$/.test(name) ? name : JSON.stringify(name));

const source = readFileSync(EN, "utf8");
const existing = new Set(readEn(source).map((leaf) => `${leaf.ns}.${leaf.key}`));
const namespaces = new Set(readEn(source).map((leaf) => leaf.ns));

const additions = new Map(); // namespace -> [{key, value}]
const conflicts = [];
let added = 0;

for (const file of readdirSync(PARTS).filter((f) => f.endsWith(".ts")).sort()) {
  for (const block of readParts(readFileSync(join(PARTS, file), "utf8"), file)) {
    // `homeAdditional`, `adminLead`, `commonExtra` all extend their base namespace.
    const base = block.ns.replace(/(Additional|Lead|Extra)$/, "");
    const ns = base !== block.ns ? base : block.ns;
    for (const { key, value } of toEntries(block.entries)) {
      const id = `${ns}.${key}`;
      if (existing.has(id)) {
        conflicts.push(`${id} (${file}) — already present, kept`);
        continue;
      }
      existing.add(id); // so a key duplicated across two parts files is only taken once
      if (!additions.has(ns)) additions.set(ns, []);
      additions.get(ns).push({ key, value, file });
      added += 1;
    }
  }
}

const lines = source.split("\n");
for (const [ns, items] of additions) {
  if (!namespaces.has(ns)) {
    // New namespace: insert the whole block just before the object's closing "};"
    const block = [`  ${quote(ns)}: {`, ...items.map((i) => `    ${quote(i.key)}: ${i.value},`), "  },"];
    const last = lines.map((l, i) => [l, i]).filter(([l]) => /^\};$/.test(l)).pop();
    if (!last) throw new Error("could not locate the end of the en object");
    lines.splice(last[1], 0, ...block);
    namespaces.add(ns);
    continue;
  }
  // Existing namespace: append its new leaves before the closing "  }," line.
  const open = lines.findIndex((l) => new RegExp(`^  "?${ns}"?: \\{$`).test(l));
  if (open === -1) throw new Error(`namespace ${ns} vanished`);
  let close = open + 1;
  while (close < lines.length && !/^  \},?$/.test(lines[close])) close += 1;
  lines.splice(close, 0, ...items.map((i) => `    ${quote(i.key)}: ${i.value},`));
}

const output = lines.join("\n");

console.log(`${DRY ? "dry run —" : "merged"} ${added} key(s) across ${additions.size} namespace(s)`);
for (const [ns, items] of additions) console.log(`  ${ns}: +${items.length}`);
if (conflicts.length) {
  console.log(`skipped ${conflicts.length} already-present key(s):`);
  for (const line of conflicts.slice(0, 12)) console.log(`  ${line}`);
  if (conflicts.length > 12) console.log(`  …and ${conflicts.length - 12} more`);
}

if (!DRY && added > 0) writeFileSync(EN, output, "utf8");
