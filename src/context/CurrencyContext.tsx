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
import { isSupabaseConfigured } from "../lib/supabase";

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

  const resolvedCurrency = useMemo(() => {
    const stored = currencyByCode(enabledCurrencies, currencyCode);
    if (stored) return stored;
    if (!chosenByShopper) {
      const fromCountry = resolvedCountry?.currencyCode
        ? currencyByCode(enabledCurrencies, resolvedCountry.currencyCode)
        : null;
      if (fromCountry) return fromCountry;
      const fromRegion = currencyForRegion(detectRegion(), enabledCurrencies);
      if (fromRegion) return fromRegion;
    }
    return base;
  }, [enabledCurrencies, currencyCode, chosenByShopper, resolvedCountry, base]);

  // Only an explicit choice is remembered. Persisting an inferred value here would lock the
  // shopper out of their destination's own currency the moment the configuration arrives, and
  // would keep honouring a country the store later closes.
  const setCurrencyCode = useCallback(
    (code: string) => {
      const next = currencyByCode(enabledCurrencies, code);
      if (!next) return;
      setCode(next.code);
      write(CURRENCY_KEY, next.code);
      setChosen(true);
      write(CURRENCY_CHOSEN_KEY, "1");
    },
    [enabledCurrencies]
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
    (baseAmount: number) => formatMinor(toMinor(baseAmount, resolvedCurrency), resolvedCurrency),
    [resolvedCurrency]
  );

  const formatIn = useCallback(
    (baseAmount: number, code: string) => {
      const target = currencyByCode(currencies, code) ?? resolvedCurrency;
      return formatMinor(toMinor(baseAmount, target), target);
    },
    [currencies, resolvedCurrency]
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
