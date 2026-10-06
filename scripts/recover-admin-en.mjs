// Recovers the original English copy for admin.* translation keys from git HEAD.
//
// The key leaves were generated from the sentences they replaced, so a candidate is only
// accepted when the leaf words are a prefix of the candidate's words. That makes the match
// self-validating: a wrong pairing fails the test instead of silently shipping wrong copy.
// Diff hunk order is used only to break ties between equally valid candidates.
//
//   node scripts/recover-admin-en.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const git = (args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const adminFiles = [];
(function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
      walk(p);
    } else if (/\.(ts|tsx)$/.test(ent.name) && /t\(\s*"admin\./.test(fs.readFileSync(p, "utf8")))
      adminFiles.push(p);
  }
})(path.join(root, "src"));

function literals(line) {
  const found = [];
  for (const m of line.matchAll(/(["'`])((?:\\.|(?!\1)[^\\\n])*?)\1/g)) {
    const text = m[2].replace(/\\(["'`\\])/g, "$1").trim();
    if (text.length > 1 && /[A-Za-z]{2}/.test(text)) found.push(text);
  }
  for (const m of line.matchAll(/>([^<>{}\n]{2,})</g)) {
    const text = m[1].trim();
    if (text.length > 1 && /[A-Za-z]{2}/.test(text)) found.push(text);
  }
  // JSX text that sits on its own line inside a multi-line element.
  const bare = line.trim();
  if (
    bare.length > 1 &&
    !/[<>{};=|]/.test(bare) &&
    !/^[*/]/.test(bare) &&
    !/^["'`]/.test(bare) &&
    !/[A-Za-z]\/[A-Za-z]/.test(bare) &&
    !/^(import|export|from|const|let|return|await|function|if|else|case|break|default|type|interface|class)$/.test(
      bare.split(/\s+/)[0]
    ) &&
    /[A-Za-z]{2}/.test(bare) &&
    found.length === 0
  )
    found.push(bare);
  return found;
}

function words(s) {
  return s
    .replace(/\$\{[^}]*\}/g, " ")
    .replace(/\{(\w+)\}/g, " ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// `searchByNameSkuOr` -> [search, by, name, sku, or]; a trailing digit is a de-duplication
// suffix the generator added (`cartValue2`), not part of the sentence.
const leafWords = (key) => {
  let leaf = key.split(".").pop() ?? key;
  leaf = leaf.replace(/\d+$/, "");
  return words(leaf.replace(/([a-z0-9])([A-Z])/g, "$1 $2"));
};

// Placeholders must survive recovery: `${x}` becomes the {token} the call site passes.
function withSlots(value, callLine, key) {
  const call = new RegExp(`t\\(\\s*"${key.replace(/\./g, "\\.")}"\\s*,\\s*\\{([^}]*)\\}`).exec(callLine);
  if (!call) return value;
  const names = [...call[1].matchAll(/(\w+)\s*:/g)].map((m) => m[1]);
  const slots = [...value.matchAll(/\$\{[^}]*\}/g)].length;
  if (!slots || !names.length) return value;
  let i = 0;
  const filled = value.replace(/\$\{[^}]*\}/g, () => `{${names[Math.min(i++, names.length - 1)]}}`);
  return filled;
}

const recovered = new Map();
const ambiguous = [];
const unresolvedKeys = [];

for (const abs of adminFiles) {
  const rel = path.relative(root, abs).split(path.sep).join("/");
  const working = fs.readFileSync(abs, "utf8");
  const keys = [...new Set([...working.matchAll(/\bt\(\s*"(admin\.[\w.]+)"/g)].map((m) => m[1]))];

  let headLines = [];
  try {
    headLines = git(["show", `HEAD:${rel}`]).split("\n");
  } catch {
    headLines = [];
  }

  // Candidate pool with document position, so ties resolve to the earliest unused literal.
  const pool = [];
  headLines.forEach((line, index) => {
    for (const text of literals(line)) if (!pool.some((c) => c.text === text)) pool.push({ text, line: index, used: false });
  });

  const callLineOf = (key) => working.split("\n").find((l) => l.includes(`"${key}"`)) ?? "";

  // Order keys by their position in the new file: that mirrors the old document order.
  const positioned = keys
    .map((key) => ({ key, line: working.split("\n").findIndex((l) => l.includes(`"${key}"`)) }))
    .sort((a, b) => a.line - b.line);

  for (const { key } of positioned) {
    const leaf = leafWords(key);
    const score = (text) => {
      const w = words(text);
      if (!leaf.length) return null;
      // Tier 1: the leaf is a literal prefix of the sentence.
      if (leaf.length <= w.length && leaf.every((x, i) => w[i] === x)) return 3;
      // Tier 2: every leaf word appears in order, with at most two words skipped in total
      // (covers "Mark as recovered" -> markRecovered and reworded fragments).
      let i = 0;
      let skipped = 0;
      for (const word of w) {
        if (i < leaf.length && word === leaf[i]) i += 1;
        else if (i > 0 && i < leaf.length) skipped += 1;
      }
      if (i === leaf.length && skipped <= 2) return 2;
      // Tier 3: the generator sometimes appended a role word ("Note", "Title", "Help") that is
      // not in the sentence. Accept the longest run that starts at word 0 when it covers most
      // of the leaf; every tier-3 pick is printed for manual review.
      let head = 0;
      while (head < leaf.length && head < w.length && leaf[head] === w[head]) head += 1;
      if (head >= 2 && head / leaf.length >= 0.6 && text.length <= 160) return 1;
      return null;
    };
    const candidates = pool
      .filter((c) => !c.used)
      .map((c) => ({ c, s: score(c.text) }))
      .filter((x) => x.s !== null)
      .sort((a, b) => b.s - a.s || a.c.line - b.c.line);
    if (!candidates.length) {
      unresolvedKeys.push({ key, file: rel, leaf: leaf.join(" ") });
      continue;
    }
    const chosen = candidates[0].c;
    if (candidates.length > 1 && candidates[0].s === candidates[1].s)
      ambiguous.push({ key, file: rel, tier: candidates[0].s, options: candidates.map((x) => x.c.text) });
    chosen.used = true;
    recovered.set(key, {
      value: withSlots(chosen.text, callLineOf(key), key),
      file: rel,
      tier: candidates[0].s,
    });
  }
}

const allKeys = [...new Set(adminFiles.flatMap((f) => [...fs.readFileSync(f, "utf8").matchAll(/\bt\(\s*"(admin\.[\w.]+)"/g)].map((m) => m[1])))];
const missing = allKeys.filter((k) => !recovered.has(k)).sort();

const report = {
  generatedBy: "scripts/recover-admin-en.mjs",
  referencedAdminKeys: allKeys.length,
  recovered: recovered.size,
  unresolved: missing,
  ambiguous: ambiguous.slice(0, 60),
  values: Object.fromEntries([...recovered].sort().map(([k, v]) => [k, v.value])),
  provenance: Object.fromEntries([...recovered].sort().map(([k, v]) => [k, v.file])),
};

fs.mkdirSync(path.join(root, "tmp-i18n"), { recursive: true });
fs.writeFileSync(path.join(root, "tmp-i18n/admin-en.json"), JSON.stringify(report, null, 2), "utf8");

console.log(`files referencing admin keys: ${adminFiles.length}`);
console.log(`referenced admin keys:        ${allKeys.length}`);
console.log(`recovered from HEAD:          ${recovered.size}`);
console.log(`ambiguous (first used):       ${ambiguous.length}`);
const loose = [...recovered].filter(([, v]) => v.value.tier === 1);
console.log(`tier-3 (needs review):        ${loose.length}`);
for (const [k, v] of loose) console.log(`  ${k}\n      <= ${JSON.stringify(v.value)}  (${v.file})`);

for (const u of unresolvedKeys) {
  let pool = [];
  try {
    pool = [...new Set(git(["show", `HEAD:${u.file}`]).split("\n").flatMap((l) => literals(l)))];
  } catch {
    pool = [];
  }
  const leaf = u.leaf.split(" ");
  const ranked = pool
    .map((text) => {
      const w = words(text);
      return { text, hit: leaf.filter((x) => w.includes(x)).length / Math.max(1, leaf.length) };
    })
    .filter((x) => x.hit > 0)
    .sort((a, b) => b.hit - a.hit)
    .slice(0, 6);
  console.log(`\n- ${u.key}   [${u.leaf}]   (${u.file})`);
  for (const r of ranked) console.log(`      ${Math.round(r.hit * 100)}%  ${JSON.stringify(r.text)}`);
  if (!ranked.length) console.log("      (no overlapping literal found in HEAD)");
}
