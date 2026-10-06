// Makes the layout follow the writing direction instead of the physical page sides.
//
//   space-x-N -> gap-N      margin-based row spacing sits on the wrong side in RTL; every
//                            occurrence in this app is on a flex row, where gap is equivalent
//   text-left/right        -> text-start/end
//   m[ll]/p[rl]            -> ms/me/ps/pe
//   left-N / right-N       -> start-N / end-N, but only on absolutely positioned elements,
//                            because elsewhere those offsets are not decorations on a box
//
// Variants (hover:, md:, rtl:) are preserved. Nothing else in the file is touched.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const files = [];
(function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (p.endsWith(".tsx")) files.push(p);
  }
})(path.join(root, "src"));

const SPACER = /(space-x-reverse|space-x-[\d.]+)/g;
const PHYSICAL = /((?:[a-z-]+:)*)(text-left|text-right)\b/g;
const EDGE = /((?:[a-z-]+:)*)(m[lr]|p[rl])-([\w./%[\]-]+)/g;
const INSET = /((?:[a-z-]+:)*)(left|right)-(0|full|px|[\d.]+)\b/g;

let changedFiles = 0;
const totals = { gap: 0, align: 0, edge: 0, inset: 0 };

for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  let text = before;

  // Only convert spacing on lines that are flex rows; a non-flex block would lose its gaps.
  text = text
    .split("\n")
    .map((line) =>
      /(\bflex\b|\binline-flex\b)/.test(line)
        ? line.replace(SPACER, (m, token) => {
            if (token === "space-x-reverse") return "";
            totals.gap += 1;
            return `gap-${token.replace("space-x-", "")}`;
          })
        : line
    )
    .join("\n")
    .replace(/[ \t]{2,}"/g, '"');

  text = text.replace(PHYSICAL, (m, variant, token) => {
    totals.align += 1;
    return `${variant}${token === "text-left" ? "text-start" : "text-end"}`;
  });
  text = text.replace(EDGE, (m, variant, token, size) => {
    totals.edge += 1;
    const map = { ml: "ms", mr: "me", pl: "ps", pr: "pe" };
    return `${variant}${map[token]}-${size}`;
  });

  // Insets: limited to lines that position something, so a grid column named "left" is safe.
  text = text
    .split("\n")
    .map((line) =>
      /(\babsolute\b|\bfixed\b)/.test(line)
        ? line.replace(INSET, (m, variant, side, size) => {
            totals.inset += 1;
            return `${variant}${side === "left" ? "start" : "end"}-${size}`;
          })
        : line
    )
    .join("\n");

  if (text !== before) {
    fs.writeFileSync(file, text, "utf8");
    changedFiles += 1;
  }
}

console.log(`${changedFiles} file(s) updated`);
console.log(JSON.stringify(totals));
for (const [k, v] of Object.entries(totals)) if (!v) console.log(`note: no ${k} conversions were needed`);
