import { useEffect, useRef, useState } from "react";
import { Coins, Globe2, Languages, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "../context/CurrencyContext";
import { useI18n } from "../i18n/I18nProvider";

type MenuId = "currency" | "language" | "country";

interface Option {
  value: string;
  text: string;
  hint?: string;
}

/**
 * One dropdown shell shared by the three selectors so they inherit the same glass panel,
 * motion and keyboard behaviour the account menu already uses.
 */
function SelectorMenu({
  id,
  open,
  onToggle,
  onClose,
  icon,
  trigger,
  ariaLabel,
  options,
  activeValue,
  onSelect,
  footer,
  alignEnd,
}: {
  id: MenuId;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  icon: React.ReactNode;
  trigger: string;
  ariaLabel: string;
  options: Option[];
  activeValue: string;
  onSelect: (value: string) => void;
  footer?: string;
  alignEnd: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (options.length === 0) return null;

  return (
    <div className="relative inline-flex" ref={wrapRef}>
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={`intl-menu-${id}`}
        title={ariaLabel}
        aria-label={ariaLabel}
        className="inline-flex items-center gap-1.5 min-h-11 px-2 text-[10px] font-mono uppercase tracking-[1.5px] text-muted hover:text-goldLight transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
      >
        {icon}
        <span>{trigger}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={`intl-menu-${id}`}
            role="menu"
            aria-label={ariaLabel}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`absolute mt-2 w-56 bg-navy2 border border-gold/30 rounded-lg shadow-2xl py-2 z-50 ${
              alignEnd ? "right-0 rtl:left-0 rtl:right-auto" : "left-0 rtl:right-0 rtl:left-auto"
            }`}
          >
            {options.map((option) => {
              const selected = option.value === activeValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                  className={`w-full text-start px-4 py-2 text-xs font-sans flex items-center gap-2 transition-colors ${
                    selected ? "text-gold bg-gold/10" : "text-ivory hover:text-gold hover:bg-gold/10"
                  }`}
                >
                  <span className="flex-1 min-w-0 truncate">{option.text}</span>
                  {option.hint && <span className="text-[9px] font-mono text-muted shrink-0">{option.hint}</span>}
                  {selected && <Check size={13} className="text-gold shrink-0" />}
                </button>
              );
            })}
            {footer && (
              <p className="px-4 pt-2 mt-1 border-t border-gold/10 text-[9px] font-mono uppercase tracking-wider text-muted">
                {footer}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function InternationalControls({ variant = "row" }: { variant?: "row" | "stacked" }) {
  const { t, language, languages, setLanguageCode } = useI18n();
  const {
    currency,
    currencies,
    country,
    deliverableCountries,
    setCurrencyCode,
    setCountryCode,
    ratesAreManual,
  } = useCurrency();
  const [open, setOpen] = useState<MenuId | null>(null);

  const close = () => setOpen(null);
  const toggle = (id: MenuId) => setOpen((current) => (current === id ? null : id));

  const enabledCurrencies = currencies.filter((c) => c.enabled);

  const currencyMenu = (
    <SelectorMenu
      id="currency"
      open={open === "currency"}
      onToggle={() => toggle("currency")}
      onClose={close}
      icon={<Coins size={15} strokeWidth={1.3} />}
      trigger={currency.code}
      ariaLabel={t("nav.selectCurrency")}
      activeValue={currency.code}
      onSelect={setCurrencyCode}
      alignEnd={variant === "row"}
      footer={ratesAreManual ? t("international.ratesManualTitle") : undefined}
      options={enabledCurrencies.map((c) => ({
        value: c.code,
        text: `${c.symbol} ${c.name}`,
        hint: c.code,
      }))}
    />
  );

  const languageMenu = (
    <SelectorMenu
      id="language"
      open={open === "language"}
      onToggle={() => toggle("language")}
      onClose={close}
      icon={<Languages size={15} strokeWidth={1.3} />}
      trigger={language.code.toUpperCase()}
      ariaLabel={t("nav.selectLanguage")}
      activeValue={language.code}
      onSelect={setLanguageCode}
      alignEnd={variant === "row"}
      options={languages.map((l) => ({ value: l.code, text: l.nativeName, hint: l.code.toUpperCase() }))}
    />
  );

  const countryMenu = deliverableCountries.length > 1 && (
    <SelectorMenu
      id="country"
      open={open === "country"}
      onToggle={() => toggle("country")}
      onClose={close}
      icon={<Globe2 size={15} strokeWidth={1.3} />}
      trigger={country?.code ?? "--"}
      ariaLabel={t("nav.selectDestination")}
      activeValue={country?.code ?? ""}
      onSelect={setCountryCode}
      alignEnd={variant === "row"}
      options={deliverableCountries.map((c) => ({ value: c.code, text: c.name, hint: c.code }))}
    />
  );

  if (variant === "stacked") {
    return (
      <div className="flex flex-col items-center gap-2">
        {currencyMenu}
        {languageMenu}
        {countryMenu}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {currencyMenu}
      {languageMenu}
      {countryMenu}
    </div>
  );
}
