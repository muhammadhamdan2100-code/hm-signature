import { en } from "./dictionaries/en";

export type Dict = typeof en;

export interface LanguageMeta {
  code: string;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  locale: string;
}

// Built-in mirror of the `languages` table, used before the configuration arrives and as
// the ceiling of what the interface can render: a row added in the database without a
// dictionary here will stay English rather than show empty text.
export const BUILT_IN_LANGUAGES: LanguageMeta[] = [
  { code: "en", name: "English", nativeName: "English", direction: "ltr", locale: "en-US" },
  { code: "ar", name: "Arabic", nativeName: "العربية", direction: "rtl", locale: "ar-AE" },
  { code: "fr", name: "French", nativeName: "Français", direction: "ltr", locale: "fr-FR" },
  { code: "es", name: "Spanish", nativeName: "Español", direction: "ltr", locale: "es-ES" },
  { code: "ur", name: "Urdu", nativeName: "اردو", direction: "rtl", locale: "ur-PK" },
  { code: "de", name: "German", nativeName: "Deutsch", direction: "ltr", locale: "de-DE" },
];

export const DEFAULT_LANGUAGE = "en";

// Keys are looked up as dot paths, so a missing leaf can fall back to English copy while a
// partially translated dictionary still renders.
export function lookup(source: unknown, path: string): string | null {
  let node: any = source;
  for (const part of path.split(".")) {
    if (node === null || typeof node !== "object") return null;
    node = node[part];
  }
  return typeof node === "string" ? node : null;
}

export type Translator = (key: string, vars?: Record<string, string | number>) => string;

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

// English is the only dictionary that ships with the app: it is the fallback every other
// language is measured against, and it is what a first visit renders. The other five are 200-270 KB
// of text each, so they are fetched the first time a shopper actually chooses that language -
// loading all six up front cost more JavaScript than the entire rest of the storefront combined.
export const dictionaries: Record<string, Dict> = { en };

const loaders: Record<string, () => Promise<Record<string, unknown>>> = {
  ar: () => import("./dictionaries/ar"),
  fr: () => import("./dictionaries/fr"),
  es: () => import("./dictionaries/es"),
  ur: () => import("./dictionaries/ur"),
  de: () => import("./dictionaries/de"),
};

/**
 * Fetch one dictionary, once. A language with no loader is not a failure: the caller keeps
 * rendering English, which is what an untranslated interface is supposed to do.
 */
export function loadDictionary(code: string): Promise<void> {
  const wanted = (code || "").toLowerCase();
  if (dictionaries[wanted] || !loaders[wanted]) return Promise.resolve();
  return loaders[wanted]().then((mod) => {
    const dict = ((mod as { default?: Dict }).default ?? (mod as Record<string, Dict>)[wanted]) as Dict | undefined;
    // Set it last: a half-published dictionary would render a page in two languages.
    if (dict) dictionaries[wanted] = dict;
  });
}

export function dictionaryReady(code: string): boolean {
  const wanted = (code || "").toLowerCase();
  return !!dictionaries[wanted] || !loaders[wanted];
}

export function translateFor(code: string): Translator {
  const dict = dictionaries[code] ?? dictionaries[DEFAULT_LANGUAGE];
  const fallback = dictionaries[DEFAULT_LANGUAGE];
  return (key, vars) => {
    const hit = lookup(dict, key);
    // A missing string must never surface its own key to a customer: fall back to the
    // English source, and if even that is absent, to a readable version of the name.
    const text = hit ?? lookup(fallback, key) ?? humanize(key);
    if (hit === null && import.meta.env?.DEV) console.warn("i18n: missing key", key);
    return interpolate(text, vars);
  };
}

function humanize(key: string): string {
  const leaf = key.split('.').pop() ?? key;
  return leaf.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").toLowerCase();
}
