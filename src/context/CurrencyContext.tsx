import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  baseCurrency,
  currencyByCode,
  currencyForRegion,
  FALLBACK_CURRENCIES,
  formatMinor,
  toMinor,
  type CurrencyDef,
} from "../lib/money";
import { fetchCurrencies, fetchCountries, type CountryRule } from "../services/internationalConfig";
import { countryCurrency } from "../lib/countries";
import { buildSelectorCurrencies, hasUsableRate } from "../lib/currencyOffer";
import { isSupabaseConfigured } from "../lib/supabase";
import { useI18n } from "../i18n/I18nProvider";

const CURRENCY_KEY = "hm-signature-currency";
const COUNTRY_KEY = "hm-signature-country";
const CURRENCY_CHOSEN_KEY = "hm-signature-currency-chosen";

function read(key: string): string {
  try {
    return (localStorage.getItem(key) || "").trim();
  } catch {
    return "";
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage may be unavailable in private mode */
  }
}

interface CurrencyContextType {
  ready: boolean;
  currencies: CurrencyDef[];
  countries: CountryRule[];
  deliverableCountries: CountryRule[];
  currency: CurrencyDef;
  /**
   * What the navbar's currency control offers: every currency the shop prices in, plus the
   * own money of each configured destination even where no rate exists yet. Deduplicated by
   * code, so France, Germany and Spain contribute one EUR.
   */
  selectorCurrencies: CurrencyDef[];
  /** Whether the currency on screen has a configured rate, so prices really are converted. */
  rateIsConfigured: boolean;
  /** The same question for any code, used by the selector's per-row state. */
  hasConfiguredRate: (code: string) => boolean;
  country: CountryRule | null;
  setCurrencyCode: (code: string) => void;
  setCountryCode: (code: string) => void;
  format: (baseAmount: number) => string;
  formatIn: (baseAmount: number, code: string) => string;
  ratesAreManual: boolean;
  currencyChosenByShopper: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

function detectRegion(): string | undefined {
  const langs = typeof navigator !== "undefined" ? navigator.languages || [navigator.language] : [];
  for (const tag of langs) {
    const parts = (tag || "").split("-");
    if (parts.length > 1) return parts[parts.length - 1];
  }
  return undefined;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // The shopper's language decides number grouping; digits stay Latin (see money.ts).
  const { locale } = useI18n();
  const [currencies, setCurrencies] = useState<CurrencyDef[]>(FALLBACK_CURRENCIES);
  const [countries, setCountries] = useState<CountryRule[]>([]);
  const [ready, setReady] = useState(false);
  const [currencyCode, setCode] = useState(() => read(CURRENCY_KEY).toUpperCase());
  const [countryCode, setCountry] = useState(() => read(COUNTRY_KEY).toUpperCase());
  const [chosenByShopper, setChosen] = useState(() => read(CURRENCY_CHOSEN_KEY) === "1");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!isSupabaseConfigured()) {
        if (alive) setReady(true);
        return;
      }
      const [rateRows, countryRows] = await Promise.all([fetchCurrencies(), fetchCountries()]);
      if (!alive) return;
      if (rateRows.length > 0) setCurrencies(rateRows);
      setCountries(countryRows);
      setReady(true);
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const enabledCurrencies = useMemo(() => currencies.filter((c) => c.enabled), [currencies]);

  const base = useMemo(() => baseCurrency(currencies), [currencies]);

  // A saved destination decides the currency unless the shopper has picked one by hand.
  const resolvedCountry = useMemo(() => {
    if (countryCode) {
      const stored = countries.find((c) => c.code === countryCode);
      if (stored) return stored;
    }
    return countries.find((c) => c.enabled) ?? null;
  }, [countries, countryCode]);

  const deliverableCountries = useMemo(() => countries.filter((c) => c.enabled), [countries]);

  // Priced currencies first, then each configured destination's own money even where the shop
  // has no rate for it. A rate-less entry is selectable and renders as itself in the list, but
  // `format` refuses to convert with it — see `rateIsConfigured`.
  const selectorCurrencies = useMemo(() => buildSelectorCurrencies(enabledCurrencies), [enabledCurrencies]);

  const hasConfiguredRate = useCallback(
    (code: string) => hasUsableRate(currencyByCode(selectorCurrencies, code)),
    [selectorCurrencies]
  );

  // A saved destination decides the currency unless the shopper has picked one by hand. The
  // destination's money is read from ISO metadata, not from the `countries` row, because four of
  // those rows still name the wrong currency for their country.
  const resolvedCurrency = useMemo(() => {
    const stored = currencyByCode(selectorCurrencies, currencyCode);
    if (stored) return stored;
    if (!chosenByShopper) {
      const inferred = countryCurrency(resolvedCountry?.code ?? null)?.code;
      const fromCountry = inferred ? currencyByCode(selectorCurrencies, inferred) : null;
      if (fromCountry) return fromCountry;
      const fromRegion = currencyForRegion(detectRegion(), selectorCurrencies);
      if (fromRegion) return fromRegion;
    }
    return base;
  }, [selectorCurrencies, currencyCode, chosenByShopper, resolvedCountry, base]);

  const rateIsConfigured = hasUsableRate(resolvedCurrency);

  // Only an explicit choice is remembered. Persisting an inferred value here would lock the
  // shopper out of their destination's own currency the moment the configuration arrives, and
  // would keep honouring a country the store later closes.
  const setCurrencyCode = useCallback(
    (code: string) => {
      const next = currencyByCode(selectorCurrencies, code);
      if (!next) return;
      setCode(next.code);
      write(CURRENCY_KEY, next.code);
      setChosen(true);
      write(CURRENCY_CHOSEN_KEY, "1");
    },
    [selectorCurrencies]
  );

  const setCountryCode = useCallback(
    (code: string) => {
      const next = (code || "").toUpperCase();
      // Only a configured destination can be remembered; anything else is ignored here and
      // refused again by the database when the order is priced.
      if (!countries.some((c) => c.code === next)) return;
      setCountry(next);
      write(COUNTRY_KEY, next);
    },
    [countries]
  );

  const format = useCallback(
    (baseAmount: number) => {
      // No rate, no conversion. The rupee price is printed as itself and the selector explains
      // why, rather than inventing a figure in a currency nobody supplied a rate for.
      const target = rateIsConfigured ? resolvedCurrency : base;
      return formatMinor(toMinor(baseAmount, target), target, locale);
    },
    [resolvedCurrency, rateIsConfigured, base, locale]
  );

  const formatIn = useCallback(
    (baseAmount: number, code: string) => {
      const wanted = currencyByCode(selectorCurrencies, code) ?? resolvedCurrency;
      const target = hasUsableRate(wanted) ? wanted : base;
      return formatMinor(toMinor(baseAmount, target), target, locale);
    },
    [selectorCurrencies, resolvedCurrency, base, locale]
  );

  const ratesAreManual = useMemo(
    () => currencies.some((c) => !c.isBase && c.rateSource === "manual"),
    [currencies]
  );

  const value: CurrencyContextType = {
    ready,
    currencies,
    countries,
    deliverableCountries,
    currency: resolvedCurrency,
    selectorCurrencies,
    rateIsConfigured,
    hasConfiguredRate,
    country: resolvedCountry,
    setCurrencyCode,
    setCountryCode,
    format,
    formatIn,
    ratesAreManual,
    currencyChosenByShopper: chosenByShopper,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextType {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
