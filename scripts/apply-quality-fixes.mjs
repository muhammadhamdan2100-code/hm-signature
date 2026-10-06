// Queued translation corrections from the manual quality review (NOT parity — actual reading).
// Each pair is matched exactly once, in the named language only, and the script refuses to
// write anything it cannot match uniquely. Run when no other process is editing dictionaries.
//
//   node scripts/apply-quality-fixes.mjs [--dry-run]
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DRY = process.argv.includes("--dry-run");

const FIXES = {
  // French: wrong number/article in the payments labels authored for the COD workflow.
  fr: [
    ['"awaitingCourierCash": "En attente de l’espèces du livreur",', '"awaitingCourierCash": "En attente des espèces du livreur",'],
    ['"collectCash": "Encaisser l’espèce",', '"collectCash": "Encaisser les espèces",'],
  ],
  // German: the polite subject was dropped from the second clause; the courier label read unnaturally.
  de: [
    [
      '"introBody": "Prüfen Sie digitale Zahlungen in Pakistan (JazzCash, Raast, Banküberweisung) und kontrollieren die Nachnahme-Eingänge.",',
      '"introBody": "Prüfen Sie digitale Zahlungen in Pakistan (JazzCash, Raast, Banküberweisung) und kontrollieren Sie die Nachnahme-Eingänge.",',
    ],
    ['"awaitingCourierCash": "Wartet auf Boten-Bargeld",', '"awaitingCourierCash": "Warten auf das Bargeld des Zustellers",'],
  ],
  // Urdu: "مجموعہ" is bookish for a shop navigation word — Pakistani beauty sites use "کلیکشن";
  // the hero used "نشان" where the intended meaning is identity ("پہچان"); one brand name was
  // transliterated although the brand must stay Latin; a two-line heading had reversed word order.
  ur: [
    ['collectionsEyebrow: "ہمارے مجموعے",', 'collectionsEyebrow: "ہماری کلیکشنز",'],
    ['collectionsEmptyTitle: "نیا مجموعہ تیار ہو رہا ہے",', 'collectionsEmptyTitle: "نئی کلیکشن تیار ہو رہی ہے",'],
    // Three navigation labels (storefront navbar, footer, admin sidebar) — all the same word.
    ['collections: "مجموعے",', 'collections: "کلیکشنز",', 3],
    ['featuredTitleLine1: "ہماری پہچان",', 'featuredTitleLine1: "ہماری منفرد",'],
    ['featuredTitleLine2: "کا مجموعہ",', 'featuredTitleLine2: "کلیکشن",'],
    ['heroHeading: "جو آپ ہیں|اس کا",', 'heroHeading: "جو آپ ہیں|آپ کی",'],
    ['heroHeadingAccent: "نشان",', 'heroHeadingAccent: "پہچان",'],
    [
      'valueElegantPackagingBody: "شاہی انداز اور خوبصورتی دکھانے کے لیے بنائی گئی",',
      'valueElegantPackagingBody: "اعلیٰ انداز اور خوبصورتی کے لیے بنائی گئی",',
    ],
    ['heroImageAlt: "ایچ ایم سگنیچر — مسٹک عود",', 'heroImageAlt: "HM Signature — مسٹک عود",'],
    ['promoHint: "اگر آپ کے پاس رعایتی کوڈ ہے تو اسے لکھیں۔",', 'promoHint: "اگر آپ کے پاس رعایتی کوڈ ہے تو اسے درج کریں۔",'],
  ],
  // Arabic: same brand-name rule.
  ar: [
    ['heroImageAlt: "إتش إم سيغنيتشر — ميستيك أود",', 'heroImageAlt: "HM Signature — ميستيك أود",'],
  ],
};

let planned = 0;
for (const [lang, pairs] of Object.entries(FIXES)) {
  const file = path.join(ROOT, "src/i18n/dictionaries", `${lang}.ts`);
  let text = fs.readFileSync(file, "utf8");
  for (const [from, to, expected = 1] of pairs) {
    const n = text.split(from).length - 1;
    if (n !== expected) {
      console.error(`${lang}: REFUSING — ${n} matches (want ${expected}) for ${from.slice(0, 60)}`);
      process.exit(1);
    }
    text = text.split(from).join(to);
    planned += 1;
  }
  if (!DRY) fs.writeFileSync(file, text, "utf8");
  console.log(`${lang}: ${pairs.length} correction(s) ${DRY ? "(dry run)" : "applied"}`);
}
console.log(`${planned} correction(s) total`);
