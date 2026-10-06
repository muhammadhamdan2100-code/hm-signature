import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BUILT_IN_LANGUAGES,
  DEFAULT_LANGUAGE,
  translateFor,
  type LanguageMeta,
  type Translator,
} from "./index";
import { fetchLanguages } from "../services/internationalConfig";
import { setActiveContentLanguage } from "../services/localizedContent";
import { isSupabaseConfigured } from "../lib/supabase";

const LANGUAGE_KEY = "hm-signature-language";

interface I18nContextType {
  t: Translator;
  language: LanguageMeta;
  languages: LanguageMeta[];
  direction: "ltr" | "rtl";
  locale: string;
  ready: boolean;
  setLanguageCode: (code: string) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function storedLanguage(): string {
  try {
    return (localStorage.getItem(LANGUAGE_KEY) || "").trim().toLowerCase();
  } catch {
    return "";
  }
}

/**
 * `?lang=ar` is the address the hreflang alternates point at, so a crawler or a shared
 * link arriving with it is honoured — and remembered, because the same person usually
 * browses on from there.
 */
function languageFromUrl(): string {
  if (typeof window === "undefined") return "";
  const wanted = (new URLSearchParams(window.location.search).get("lang") || "").trim().toLowerCase();
  return BUILT_IN_LANGUAGES.some((l) => l.code === wanted) ? wanted : "";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [languages, setLanguages] = useState<LanguageMeta[]>(BUILT_IN_LANGUAGES);
  const [code, setCode] = useState(() => languageFromUrl() || storedLanguage());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!isSupabaseConfigured()) {
        if (alive) setReady(true);
        return;
      }
      const rows = await fetchLanguages();
      if (!alive) return;
      const translated = rows
        .filter((row) => row.enabled && BUILT_IN_LANGUAGES.some((b) => b.code === row.code))
        .map((row) => ({
          code: row.code,
          name: row.name,
          nativeName: row.nativeName,
          direction: row.direction,
          locale: row.locale,
        }));
      if (translated.length > 0) {
        // The database owns ordering and labels; a dictionary always wins on direction,
        // because the layout can only be right if it matches the copy.
        const ordered = BUILT_IN_LANGUAGES.map(
          (builtIn) => translated.find((t) => t.code === builtIn.code) ?? builtIn
        );
        setLanguages(ordered);
      }
      setReady(true);
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const language = useMemo(() => {
    const wanted = code || DEFAULT_LANGUAGE;
    return languages.find((l) => l.code === wanted) ?? languages.find((l) => l.code === DEFAULT_LANGUAGE) ?? BUILT_IN_LANGUAGES[0];
  }, [code, languages]);

  // Direction belongs on the document, not on a wrapper: it is what makes form controls,
  // text flow and the browser's own widgets follow the script.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = language.code;
    root.dir = language.direction;
    // Catalogue services read the active language synchronously, so it is published here
    // before any page asks for products.
    setActiveContentLanguage(language.code);
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_KEY, language.code);
    } catch {
      /* storage may be unavailable in private mode */
    }
  }, [language.code]);

  const setLanguageCode = useCallback(
    (next: string) => {
      const wanted = (next || "").toLowerCase();
      if (!languages.some((l) => l.code === wanted)) return;
      setCode(wanted);
    },
    [languages]
  );

  const t = useMemo(() => translateFor(language.code), [language.code]);

  // Memoised so a provider re-render does not hand every useI18n() consumer a new object —
  // admin pages subscribe to several contexts, and an unstable value amplifies re-render storms.
  const value: I18nContextType = useMemo(
    () => ({
      t,
      language,
      languages,
      direction: language.direction,
      locale: language.locale,
      ready,
      setLanguageCode,
    }),
    [t, language, languages, ready, setLanguageCode]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
