/**
 * Scent finder matching.
 *
 * Pure and side-effect free so it can be unit tested on its own: the inputs are
 * the shopper's answers and the catalogue already returned by
 * `getCatalogProducts()`. A product can only earn points (or a "why this
 * matched" line) from attributes it actually declares — missing occasions,
 * seasons, intensity or notes are skipped, never guessed.
 */

import type { Product } from "../data/products";
import {
  FRAGRANCE_FAMILIES,
  INTENSITY_OPTIONS,
  OCCASION_OPTIONS,
  SEASON_OPTIONS,
  compareSizes,
  sizeToMl,
} from "../data/products";

/** Answer value used when the shopper skips a question. */
export const UNSPECIFIED = "undecided";

/** Relative importance. Family > intensity > season/occasion > leaning > notes. */
export const SCORE_WEIGHTS = {
  family: 34,
  intensity: 22,
  season: 14,
  occasion: 12,
  leaning: 10,
  notes: 8,
} as const;

/** Below this, we say so plainly instead of forcing a recommendation. */
export const MATCH_FLOOR = 30;

/** A perfectly aligned scent, used for the "strong match" wording only. */
export const STRONG_MATCH_SCORE = 62;

export interface FinderAnswers {
  family: string;
  intensity: string;
  occasion: string;
  season: string;
  leaning: string;
  intent: string;
  notesText: string;
}

export type FinderAnswerKey = keyof FinderAnswers;

export interface FinderOption {
  value: string;
  label: string;
  caption?: string;
}

export interface FinderStep {
  key: FinderAnswerKey;
  /** Short editorial label shown above the question. */
  eyebrow: string;
  question: string;
  help: string;
  /** Free-text steps have no options. */
  options?: FinderOption[];
  freeText?: boolean;
  placeholder?: string;
  skippable: boolean;
}

export interface RankedProduct {
  product: Product;
  score: number;
  reasons: string[];
  matchedAttributes: string[];
}

export interface FinderSize {
  size: string;
  price: number;
  stock: number;
  sku?: string;
  lowStockThreshold?: number;
}

export const defaultFinderAnswers = (): FinderAnswers => ({
  family: UNSPECIFIED,
  intensity: UNSPECIFIED,
  occasion: UNSPECIFIED,
  season: UNSPECIFIED,
  leaning: UNSPECIFIED,
  intent: UNSPECIFIED,
  notesText: "",
});

const INTENSITY_CAPTIONS: Record<string, string> = {
  Light: "A close veil, kept near the skin.",
  Moderate: "Clearly there, without announcing itself.",
  Strong: "Fills the space around you.",
  Enormous: "Our most assertive declaration.",
};

/** "Gifting" is a merchandising tag, not a wearing moment — the finder asks for moments. */
const OCCASION_CHOICES: FinderOption[] = OCCASION_OPTIONS.filter((o) => o !== "Gifting").map((o) => ({
  value: o,
  label: o,
}));

const SEASON_CHOICES: FinderOption[] = SEASON_OPTIONS.map((s) => ({
  value: s,
  label: s === "All Season" ? "All season" : s,
}));

const INTENSITY_CHOICES: FinderOption[] = INTENSITY_OPTIONS.map((i) => ({
  value: i,
  label: i,
  caption: INTENSITY_CAPTIONS[i],
}));

/**
 * The consultation itself, as data (no JSX here, so it stays testable).
 * The family step's options are built from the live catalogue at runtime — see
 * `familyOptionsForCatalogue`.
 */
export const FINDER_STEPS: FinderStep[] = [
  {
    key: "family",
    eyebrow: "Family",
    question: "Which family draws you first?",
    help: "These are the families our collection is grouped by today.",
    options: [],
    skippable: true,
  },
  {
    key: "intensity",
    eyebrow: "Projection",
    question: "How present should it feel?",
    help: "We describe projection as the atelier declares it — not a promise about hours.",
    options: INTENSITY_CHOICES,
    skippable: true,
  },
  {
    key: "occasion",
    eyebrow: "Occasion",
    question: "Where will it be worn?",
    help: "Pick the moment you have in mind.",
    options: OCCASION_CHOICES,
    skippable: true,
  },
  {
    key: "season",
    eyebrow: "Season",
    question: "Which season is in mind?",
    help: "Weight and warmth are usually chosen with the calendar in hand.",
    options: SEASON_CHOICES,
    skippable: true,
  },
  {
    key: "leaning",
    eyebrow: "For whom",
    question: "Whose skin will it live on?",
    help: "A direction, not a rule — every composition here can be worn by anyone.",
    options: [
      { value: "masculine", label: "A masculine character" },
      { value: "feminine", label: "A feminine character" },
      { value: "versatile", label: "Versatile — written for anyone" },
    ],
    skippable: true,
  },
  {
    key: "intent",
    eyebrow: "Purpose",
    question: "Is this for you, or for someone else?",
    help: "This only changes how we frame the result.",
    options: [
      { value: "self", label: "For myself" },
      { value: "gift", label: "For someone else" },
    ],
    skippable: true,
  },
  {
    key: "notesText",
    eyebrow: "Notes",
    question: "Scents you have loved",
    help: "Optional. Name a note — we compare it only with notes each fragrance actually declares.",
    freeText: true,
    placeholder: "Bergamot, oud, vanilla…",
    skippable: true,
  },
];

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/** Light plural folding — applied identically to both sides, so consistency matters more than grammar. */
const stemWord = (word: string): string => {
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (/(?:ss|sh|ch|x|z)es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
};

const normalize = (value: string): string =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenSet = (value: string): string[] => normalize(value).split(" ").filter(Boolean).map(stemWord);

const sentenceCase = (value: string): string => {
  const clean = normalize(value);
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : clean;
};

const lower = (value: string): string => normalize(value);

/** Words that carry no note information in a free-text answer. */
const NOTE_STOPWORDS = new Set([
  "and", "the", "for", "with", "that", "this", "some", "very", "also", "like", "love", "loved",
  "loves", "liked", "likes", "wear", "wore", "wearing", "scent", "scents", "fragrance",
  "fragrances", "perfume", "smell", "note", "notes", "smells", "wears", "ones", "one", "any",
  "anything", "something", "everything", "been", "have", "has", "had", "but", "not", "was",
  "were", "you", "your", "yours", "into", "from", "about", "mostly", "usually", "prefer",
  "preferred", "prefers", "trying", "tried", "try", "used", "use", "using", "new", "old",
  "smelled", "similar", "kind", "types", "type", "feel", "feels", "fresh", "sweet", "warm",
]);

/* ------------------------------------------------------------------ */
/* Dimension scoring                                                   */
/* ------------------------------------------------------------------ */

const SEASON_ALLIES: Record<string, string[]> = {
  spring: ["summer", "autumn"],
  summer: ["spring"],
  autumn: ["winter", "spring"],
  winter: ["autumn"],
};

const OCCASION_ALLIES: Record<string, string[]> = {
  day: ["everyday", "office"],
  everyday: ["day", "office"],
  office: ["day", "everyday"],
  evening: ["night out", "wedding"],
  "night out": ["evening", "wedding"],
  wedding: ["evening", "night out"],
};

const GENDER_BY_LEANING: Record<string, Product["gender"][]> = {
  masculine: ["men", "unisex"],
  feminine: ["women", "unisex"],
  versatile: ["unisex", "men", "women"],
};

const isSet = (value: string | undefined): boolean => !!value && value !== UNSPECIFIED;

const familyMatch = (chosen: string, declared: string): number => {
  const a = new Set(tokenSet(chosen));
  const b = new Set(tokenSet(declared));
  if (a.size && [...a].every((t) => b.has(t)) && [...b].every((t) => a.has(t))) return 1;
  if (normalize(chosen) === normalize(declared)) return 1;
  const shared = [...a].filter((t) => b.has(t));
  return shared.length ? 0.45 : 0;
};

const intensityMatch = (chosen: string, declared: string): { factor: number; direction: number } => {
  const ladder: readonly string[] = INTENSITY_OPTIONS;
  const wanted = ladder.findIndex((i) => normalize(i) === normalize(chosen));
  const actual = ladder.findIndex((i) => normalize(i) === normalize(declared));
  if (wanted < 0 || actual < 0) return { factor: 0, direction: 0 };
  const diff = actual - wanted;
  const factor = diff === 0 ? 1 : Math.abs(diff) === 1 ? 0.5 : Math.abs(diff) === 2 ? 0.22 : 0;
  return { factor, direction: diff };
};

const listMatch = (
  chosen: string,
  declared: string[],
  allies: Record<string, string[]>,
): { factor: number; value: string | null } => {
  const values = (declared || []).filter((v) => typeof v === "string" && v.trim());
  if (!values.length) return { factor: 0, value: null };

  const wanted = normalize(chosen);
  const allLabel = normalize("All Season");

  const exact = values.find((v) => normalize(v) === wanted);
  if (exact) return { factor: 1, value: exact };

  const declaredAll = values.find((v) => normalize(v) === allLabel);
  if (declaredAll) return { factor: wanted === allLabel ? 1 : 0.85, value: declaredAll };
  if (wanted === allLabel) {
    const first = values.find((v) => normalize(v) !== allLabel);
    return first ? { factor: 0.5, value: first } : { factor: 0, value: null };
  }

  const friendly = allies[wanted] || [];
  const near = values.find((v) => friendly.some((f) => normalize(f) === normalize(v) || normalize(v).includes(f)));
  if (near) return { factor: 0.5, value: near };

  return { factor: 0, value: null };
};

const leaningFactor = (chosen: string, gender: Product["gender"]): number => {
  const order = GENDER_BY_LEANING[chosen];
  if (!order) return 0;
  const idx = order.indexOf(gender);
  if (idx === 0) return 1;
  if (idx === 1) return chosen === "versatile" ? 0.35 : 0.5;
  return 0;
};

/** Note names the product declares, in top → heart → base order. */
const declaredNotes = (product: Product): string[] =>
  [...(product.topNotes || []), ...(product.heartNotes || []), ...(product.baseNotes || [])]
    .map((n) => String(n || "").trim())
    .filter(Boolean);

/** Distinct note names in the shopper's free text that a product really declares. */
export function matchedNoteNames(text: string, product: Product): string[] {
  const notes = declaredNotes(product);
  if (!notes.length) return [];
  const haystack = normalize(text);
  if (!haystack) return [];
  const asked = new Set(tokenSet(text).filter((t) => t.length > 2 && !NOTE_STOPWORDS.has(t)));

  const hits: string[] = [];
  notes.forEach((note) => {
    if (hits.includes(note)) return;
    const noteNorm = normalize(note);
    if (haystack.includes(noteNorm)) {
      hits.push(note);
      return;
    }
    const noteWords = new Set(tokenSet(note));
    let shared = false;
    asked.forEach((word) => {
      if (word.length > 2 && noteWords.has(word)) shared = true;
    });
    if (shared) hits.push(note);
  });
  return hits;
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

interface DimensionResult {
  points: number;
  reason?: string;
  attribute?: string;
}

const familyDimension = (answers: FinderAnswers, product: Product): DimensionResult => {
  if (!isSet(answers.family)) return { points: 0 };
  const declared = (product.fragranceFamily || product.category || "").trim();
  if (!declared) return { points: 0 };

  const factor = familyMatch(answers.family, declared);
  if (!factor) return { points: 0 };
  const label = sentenceCase(declared);
  return {
    points: SCORE_WEIGHTS.family * factor,
    attribute: factor === 1 ? "family" : "family:adjacent",
    reason:
      factor === 1
        ? `${label} matches the family you chose.`
        : `Its ${label} character overlaps with the family you chose.`,
  };
};

const intensityDimension = (answers: FinderAnswers, product: Product): DimensionResult => {
  if (!isSet(answers.intensity) || !product.intensity) return { points: 0 };
  const { factor, direction } = intensityMatch(answers.intensity, product.intensity);
  if (!factor) return { points: 0 };
  return {
    points: SCORE_WEIGHTS.intensity * factor,
    attribute: factor === 1 ? "intensity" : "intensity:adjacent",
    reason:
      factor === 1
        ? `Declared ${lower(product.intensity)} projection — the level you asked for.`
        : `Its ${lower(product.intensity)} projection sits a step ${direction > 0 ? "above" : "below"} the level you chose.`,
  };
};

const seasonDimension = (answers: FinderAnswers, product: Product): DimensionResult => {
  if (!isSet(answers.season)) return { points: 0 };
  const { factor, value } = listMatch(answers.season, product.seasons || [], SEASON_ALLIES);
  if (!factor || !value) return { points: 0 };
  const wanted = lower(answers.season);
  const listed = lower(value);
  const declaredAllSeason = listed === "all season";

  let reason: string;
  if (declaredAllSeason && wanted !== "all season") {
    reason = `Marked all season, so it answers your ${wanted} brief.`;
  } else if (wanted === "all season" && !declaredAllSeason) {
    reason = `Marked ${listed}, which covers part of the year you described.`;
  } else if (factor === 1) {
    reason = `Listed for ${listed} — the season you named.`;
  } else {
    reason = `Its ${listed} listing covers part of your ${wanted} brief.`;
  }

  return {
    points: SCORE_WEIGHTS.season * factor,
    attribute: factor === 1 ? "season" : "season:adjacent",
    reason,
  };
};

const occasionDimension = (answers: FinderAnswers, product: Product): DimensionResult => {
  if (!isSet(answers.occasion)) return { points: 0 };
  const { factor, value } = listMatch(answers.occasion, product.occasions || [], OCCASION_ALLIES);
  if (!factor || !value) return { points: 0 };
  return {
    points: SCORE_WEIGHTS.occasion * factor,
    attribute: factor === 1 ? "occasion" : "occasion:adjacent",
    reason:
      factor === 1
        ? `Listed for ${lower(value)} wear, as you described.`
        : `Its ${lower(value)} listing sits close to your ${lower(answers.occasion)} moment.`,
  };
};

const leaningDimension = (answers: FinderAnswers, product: Product): DimensionResult => {
  if (!isSet(answers.leaning) || !product.gender) return { points: 0 };
  const factor = leaningFactor(answers.leaning, product.gender);
  if (!factor) return { points: 0 };
  const word = product.gender === "unisex" ? "versatile" : product.gender === "men" ? "masculine" : "feminine";
  return {
    points: SCORE_WEIGHTS.leaning * factor,
    attribute: "leaning",
    reason: word === "versatile" ? "Composed as a versatile scent, suited to anyone." : `Composed as a ${word} scent.`,
  };
};

const notesDimension = (answers: FinderAnswers, product: Product): DimensionResult => {
  const text = (answers.notesText || "").trim();
  if (!text) return { points: 0 };
  const hits = matchedNoteNames(text, product);
  if (!hits.length) return { points: 0 };
  const counted = hits.slice(0, 4);
  const named = counted.map(lower).slice(0, 3).join(", ");
  return {
    points: SCORE_WEIGHTS.notes * (counted.length / 4),
    attribute: "notes",
    reason: hits.length > 3
      ? `It declares ${named} and more of the notes you mentioned.`
      : `It declares ${named} — the notes you mentioned.`,
  };
};

/** Score a single product. Exported for focused unit tests. */
export function scoreProduct(answers: FinderAnswers, product: Product): RankedProduct {
  const dimensions = [
    familyDimension(answers, product),
    intensityDimension(answers, product),
    seasonDimension(answers, product),
    occasionDimension(answers, product),
    leaningDimension(answers, product),
    notesDimension(answers, product),
  ];

  let points = 0;
  const reasons: string[] = [];
  const matchedAttributes: string[] = [];

  dimensions.forEach((d) => {
    points += d.points;
    if (d.reason && d.attribute) {
      reasons.push(d.reason);
      matchedAttributes.push(d.attribute);
    }
  });

  return {
    product,
    score: Math.round(points),
    reasons,
    matchedAttributes,
  };
}

/**
 * Rank the whole catalogue. Nothing is filtered here — the caller decides how
 * many results to show and whether any clear `MATCH_FLOOR`.
 */
export function scoreProducts(answers: FinderAnswers, products: Product[]): RankedProduct[] {
  const gift = answers.intent === "gift";
  return (products || [])
    .map((product) => scoreProduct(answers, product))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const preferA = gift ? a.product.featured : a.product.bestseller;
      const preferB = gift ? b.product.featured : b.product.bestseller;
      if (preferA !== preferB) return preferA ? -1 : 1;
      const altA = gift ? a.product.bestseller : a.product.featured;
      const altB = gift ? b.product.bestseller : b.product.featured;
      if (altA !== altB) return altA ? -1 : 1;
      if (a.score > 0 && b.score > 0 && a.reasons.length !== b.reasons.length) {
        return b.reasons.length - a.reasons.length;
      }
      return String(a.product.name).localeCompare(String(b.product.name));
    });
}

/** Recommendations worth showing: those that clear the floor, capped at three. */
export function selectRecommendations(
  ranked: RankedProduct[],
  options?: { limit?: number; floor?: number },
): { matches: RankedProduct[]; hasConfidentMatch: boolean } {
  const limit = options?.limit ?? 3;
  const floor = options?.floor ?? MATCH_FLOOR;
  const matches = (ranked || []).filter((r) => r.score >= floor && r.reasons.length > 0).slice(0, limit);
  return { matches, hasConfidentMatch: matches.length > 0 };
}

/* ------------------------------------------------------------------ */
/* Presentation helpers (still pure)                                   */
/* ------------------------------------------------------------------ */

const GENERIC_FAMILY_LABELS = new Set(["haute parfumerie", "unclassified", ""]);

/**
 * Family choices built from what the catalogue actually groups by, so we never
 * offer a family no listed product belongs to. Falls back to the documented
 * list only while nothing in the catalogue is grouped yet.
 */
export function familyOptionsForCatalogue(products: Product[]): FinderOption[] {
  const found: string[] = [];
  (products || []).forEach((p) => {
    const label = String(p.fragranceFamily || p.category || "").trim();
    if (!label || GENERIC_FAMILY_LABELS.has(label.toLowerCase())) return;
    if (!found.some((f) => normalize(f) === normalize(label))) found.push(label);
  });

  if (found.length === 0) {
    return FRAGRANCE_FAMILIES.map((f) => ({ value: f, label: f }));
  }
  return found.sort((a, b) => a.localeCompare(b)).map((f) => ({ value: f, label: f }));
}

/** The shopper's own words back to them, as refine chips. */
export function describeAnswers(answers: FinderAnswers): { key: FinderAnswerKey; label: string; specified: boolean }[] {
  const labels: Record<FinderAnswerKey, (a: FinderAnswers) => string> = {
    family: (a) => (isSet(a.family) ? lower(a.family) : ""),
    intensity: (a) => (isSet(a.intensity) ? `${lower(a.intensity)} projection` : ""),
    occasion: (a) => (isSet(a.occasion) ? lower(a.occasion) : ""),
    season: (a) => (isSet(a.season) ? lower(a.season) : ""),
    leaning: (a) =>
      a.leaning === "masculine"
        ? "a masculine character"
        : a.leaning === "feminine"
          ? "a feminine character"
          : a.leaning === "versatile"
            ? "versatile"
            : "",
    intent: (a) => (a.intent === "gift" ? "a gift" : a.intent === "self" ? "for yourself" : ""),
    notesText: (a) => {
      const words = tokenSet(a.notesText).filter((t) => t.length > 2 && !NOTE_STOPWORDS.has(t));
      return words.length ? `notes: ${words.slice(0, 4).join(", ")}` : "";
    },
  };

  return (Object.keys(labels) as FinderAnswerKey[]).map((key) => {
    const text = labels[key](answers);
    return { key, label: text || "not specified", specified: Boolean(text) };
  });
}

/** Honest result wording — never a performance or longevity claim. */
export function resultHeading(matches: number, answers: FinderAnswers): string {
  const gift = answers.intent === "gift";
  if (gift) return matches === 1 ? "One considered gift" : `${matches} considered gifts`;
  return matches === 1 ? "One scent worth trying" : `${matches} scents worth trying`;
}

/** Sizes and real variant prices, oldest rule of the house: no invented size. */
export function sizesFor(product: Product): FinderSize[] {
  const active = (product.variants || []).filter((v) => v.active !== false && sizeToMl(v.size) > 0);
  if (active.length) {
    return active
      .map((v) => ({
        size: v.size,
        price: typeof v.salePrice === "number" && v.salePrice > 0 ? v.salePrice : v.price,
        stock: Number.isFinite(v.stock) ? v.stock : 0,
        sku: v.sku,
        lowStockThreshold: v.lowStockThreshold,
      }))
      .sort((a, b) => compareSizes(a.size, b.size));
  }
  return [{ size: product.size || "50ml", price: product.price, stock: product.stock }];
}

export function availabilityLabel(size: FinderSize): { text: string; available: boolean } {
  if (size.stock <= 0) return { text: "Out of stock", available: false };
  const threshold = size.lowStockThreshold ?? 5;
  if (size.stock <= threshold) return { text: `Only ${size.stock} left`, available: true };
  return { text: "In stock", available: true };
}
