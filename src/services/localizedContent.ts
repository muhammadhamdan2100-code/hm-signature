import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { BUILT_IN_LANGUAGES } from "../i18n";

// Customer-facing marketing text is localized by lookup, never by duplicating a product.
// A row keeps its id, SKU, price, stock and order history; only the words are replaced,
// and only when a bundle exists for the language the shopper is reading in.

export type EntityKind = "product" | "category" | "collection" | "homepage_section" | "fragrance_note";

export type TranslationBundle = Record<string, string>;

type Cache = {
  language: string;
  map: Map<string, TranslationBundle>;
};

// English is the source language: its rows live on the entities themselves, so nothing is
// fetched for it and every field falls through to the original value.
const SOURCE_LANGUAGE = "en";

let cache: Cache | null = null;
// The provider publishes the language from an effect, and a page's own effect runs BEFORE its
// provider's — so a cold load used to fetch the catalogue as English and keep it. Reading the
// same two sources here means the very first request already carries the shopper's language.
let activeLanguage = initialContentLanguage();
// A read is either usable (cache it) or failed (let the next navigation try again).
type BundleRead = { map: Map<string, TranslationBundle>; usable: boolean };

let inflight: Promise<BundleRead> | null = null;

function initialContentLanguage(): string {
  if (typeof window === "undefined") return SOURCE_LANGUAGE;
  const wanted = [
    (new URLSearchParams(window.location.search).get("lang") || "").trim().toLowerCase(),
    (() => {
      try {
        return (localStorage.getItem("hm-signature-language") || "").trim().toLowerCase();
      } catch {
        return "";
      }
    })(),
  ].find((code) => BUILT_IN_LANGUAGES.some((l) => l.code === code));
  return wanted || SOURCE_LANGUAGE;
}

export function setActiveContentLanguage(code: string): void {
  const next = (code || SOURCE_LANGUAGE).toLowerCase();
  if (next === activeLanguage) return;
  activeLanguage = next;
  cache = null;
  inflight = null;
}

export function getActiveContentLanguage(): string {
  return activeLanguage;
}

const refKey = (kind: EntityKind, ref: string) => `${kind}:${ref}`;

async function loadBundleMap(language: string): Promise<Map<string, TranslationBundle>> {
  if (cache && cache.language === language) return cache.map;
  if (!isSupabaseConfigured() || language === SOURCE_LANGUAGE) {
    const empty = new Map<string, TranslationBundle>();
    cache = { language, map: empty };
    return empty;
  }
  // One request per language, not one per product: a catalogue of six fragrances would
  // otherwise turn every page view into a dozen round trips.
  if (!inflight) {
    inflight = readBundles(language)
      .then((result) => {
        // A failed read must not be remembered as "this language has no translations",
        // otherwise one dropped request pins the shopper to English text for the whole
        // session, so the in-flight promise is dropped and only a clean read is cached.
        if (result.error) {
          inflight = null;
          if (import.meta.env?.DEV) console.warn("i18n: translation read failed", language, result.error);
        }
        return { map: result.map, usable: !result.error };
      })
      .catch(() => {
        inflight = null;
        return { map: new Map<string, TranslationBundle>(), usable: false };
      });
  }
  const pending = inflight;
  const read = await pending;
  if (read.usable) cache = { language, map: read.map };
  return read.map;
}

async function readBundles(
  language: string,
  attempt = 1
): Promise<{ map: Map<string, TranslationBundle>; error: string | null }> {
  const { data, error } = await supabase
    .from("content_translations")
    .select("entity_type, entity_ref, payload")
    .eq("language_code", language);
  if (error) {
    // The bundle read is one small request; a dropped connection is far more likely than a
    // real outage, so retry once before giving the page its source text.
    if (attempt < 2) return readBundles(language, attempt + 1);
    return { map: new Map<string, TranslationBundle>(), error: error.message };
  }
  const map = new Map<string, TranslationBundle>();
  for (const row of Array.isArray(data) ? data : []) {
    const payload = row.payload;
    if (!payload || typeof payload !== "object") continue;
    const flat: TranslationBundle = {};
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      if (typeof value === "string" && value.trim()) flat[key] = value;
    }
    if (Object.keys(flat).length > 0) map.set(refKey(row.entity_type, row.entity_ref), flat);
  }
  return { map, error: null };
}

/**
 * The one accessor other services use: a translated field for one entity, or the caller's
 * own source value when no bundle, no field, or no text exists. An empty translation can
 * never blank out a product name.
 */
export async function translateField(
  kind: EntityKind,
  ref: string | null | undefined,
  field: string,
  fallback: string
): Promise<string> {
  if (!ref) return fallback;
  const map = await loadBundleMap(activeLanguage);
  return map.get(refKey(kind, ref))?.[field] || fallback;
}

export async function translateEntity(
  kind: EntityKind,
  ref: string | null | undefined
): Promise<TranslationBundle> {
  if (!ref) return {};
  const map = await loadBundleMap(activeLanguage);
  return map.get(refKey(kind, ref)) ?? {};
}

/** Bulk read used by the catalogue: every bundle for the active language in one pass. */
export async function readTranslationMap(language?: string): Promise<Map<string, TranslationBundle>> {
  return loadBundleMap((language || activeLanguage).toLowerCase());
}

export function bundleFor(map: Map<string, TranslationBundle>, kind: EntityKind, ref: string | null | undefined): TranslationBundle {
  if (!ref) return {};
  return map.get(refKey(kind, ref)) ?? {};
}

export const SOURCE_LANGUAGE_CODE = SOURCE_LANGUAGE;

/**
 * Replaces only the copy fields of a catalogue row. Anything numeric, structural or
 * identifying is copied through untouched by the caller, so a translation can never move
 * a price, a stock level or a SKU.
 */
export function applyBundle<T extends Record<string, any>>(target: T, bundle: TranslationBundle, fields: Record<string, string>): T {
  const next: Record<string, any> = { ...target };
  for (const [bundleKey, targetKey] of Object.entries(fields)) {
    const value = bundle[bundleKey];
    if (typeof value === "string" && value.trim()) next[targetKey as string] = value;
  }
  return next as T;
}

export async function saveTranslation(input: {
  entityType: EntityKind;
  entityRef: string;
  language: string;
  values: TranslationBundle;
}): Promise<{ ok: boolean; message?: string }> {
  const { data, error } = await supabase.rpc("save_content_translation", {
    p_entity_type: input.entityType,
    p_entity_ref: input.entityRef,
    p_language: input.language,
    p_values: input.values,
  });
  if (error) return { ok: false, message: error.message };
  // The reader caches per language, so a saved bundle has to invalidate it or staff would
  // keep seeing the words from before they pressed save.
  cache = null;
  inflight = null;
  return { ok: Boolean(data) };
}

export async function deleteTranslation(input: {
  entityType: EntityKind;
  entityRef: string;
  language: string;
}): Promise<{ ok: boolean; message?: string }> {
  const { data, error } = await supabase.rpc("delete_content_translation", {
    p_entity_type: input.entityType,
    p_entity_ref: input.entityRef,
    p_language: input.language,
  });
  if (error) return { ok: false, message: error.message };
  cache = null;
  inflight = null;
  return { ok: Boolean(data) };
}
