import { useEffect, useMemo, useRef, useState } from "react";
import { Coins, Languages, Check, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "../context/CurrencyContext";
import { useI18n } from "../i18n/I18nProvider";

type MenuId = "currency" | "language";

interface Option {
  value: string;
  text: string;
  hint?: string;
  /** Availability caveat, e.g. a currency the store has no rate for yet. */
  note?: string;
}

/**
 * One dropdown shell shared by the two selectors so they inherit the same glass panel,
 * motion and keyboard behaviour the account menu already uses.
 *
 * Keyboard model: the panel owns focus. Arrow keys walk the rows, Home and End jump to the
 * ends, Enter or Space chooses, Escape closes and hands focus back to the trigger. A long
 * list (every ISO country) is searchable, because scrolling is not a way to find Oman.
 */
function SelectorMenu({
  id,
  open,
  onToggle,
  onClose,
  trigger,
  triggerTitle,
  ariaLabel,
  options,
  activeValue,
  onSelect,
  footer,
  alignEnd,
  searchable,
  searchLabel,
}: {
  id: MenuId;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  trigger: React.ReactNode;
  triggerTitle: string;
  ariaLabel: string;
  options: Option[];
  activeValue: string;
  onSelect: (value: string) => void;
  footer?: string;
  alignEnd: boolean;
  searchable?: boolean;
  searchLabel?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(-1);

  const visible = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) =>
        o.text.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.hint || "").toLowerCase().includes(q)
    );
  }, [options, query, searchable]);

  // Closing resets the search so the next open starts at the top of the full list.
  useEffect(() => {
    if (open) return;
    setQuery("");
    setCursor(-1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (searchable) searchRef.current?.focus();
    else {
      const active = Math.max(0, visible.findIndex((o) => o.value === activeValue));
      rowRefs.current[active]?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const focusRow = (index: number) => {
    if (visible.length === 0) return;
    const next = (index + visible.length) % visible.length;
    setCursor(next);
    rowRefs.current[next]?.focus();
  };

  const onPanelKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        onClose();
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        event.preventDefault();
        focusRow(cursor + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusRow(cursor - 1);
        break;
      case "Home":
        event.preventDefault();
        focusRow(0);
        break;
      case "End":
        event.preventDefault();
        focusRow(visible.length - 1);
        break;
      case "Tab":
        // Tabbing out of an open panel should not leave an orphan menu behind.
        onClose();
        break;
      default:
        break;
    }
  };

  if (options.length === 0) return null;

  return (
    <div className="relative inline-flex" ref={wrapRef} onKeyDown={onPanelKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={`intl-menu-${id}`}
        title={triggerTitle}
        aria-label={ariaLabel}
        className="inline-flex items-center gap-1.5 min-h-11 px-2 text-[10px] font-mono uppercase tracking-[1.5px] text-muted hover:text-goldLight transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
      >
        {trigger}
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
            className={`absolute mt-2 w-64 bg-navy2 border border-gold/30 rounded-lg shadow-2xl z-50 ${
              alignEnd ? "right-0 rtl:left-0 rtl:right-auto" : "left-0 rtl:right-0 rtl:left-auto"
            }`}
          >
            {searchable && (
              <div className="px-3 pt-2 pb-2 border-b border-gold/10">
                <div className="flex items-center gap-2 bg-navy border border-gold/20 rounded px-2.5 py-1.5">
                  <Search size={13} className="text-gold shrink-0" aria-hidden="true" />
                  <input
                    ref={searchRef}
                    type="text"
                    role="searchbox"
                    aria-label={searchLabel || ariaLabel}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setCursor(-1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        focusRow(0);
                      }
                    }}
                    className="w-full min-w-0 bg-transparent text-xs font-sans text-ivory placeholder:text-muted/70 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="py-1 max-h-[55vh] overflow-y-auto overscroll-contain">
              {visible.length === 0 && (
                <p className="px-4 py-3 text-xs text-muted font-sans">—</p>
              )}
              {visible.map((option, index) => {
                const selected = option.value === activeValue;
                return (
                  <button
                    key={option.value}
                    ref={(el) => {
                      rowRefs.current[index] = el;
                    }}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    tabIndex={index === (cursor < 0 ? Math.max(0, visible.findIndex((o) => o.value === activeValue)) : cursor) ? 0 : -1}
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => {
                      onSelect(option.value);
                      onClose();
                      triggerRef.current?.focus();
                    }}
                    className={`w-full text-start px-4 py-2 text-xs font-sans flex items-center gap-2 transition-colors ${
                      selected ? "text-gold bg-gold/10" : "text-ivory hover:text-gold hover:bg-gold/10"
                    }`}
                  >
                    <span className="flex-1 min-w-0 truncate">
                      {option.text}
                      {option.note && (
                        <span className="block text-[9px] font-mono normal-case tracking-normal text-muted truncate">
                          {option.note}
                        </span>
                      )}
                    </span>
                    {option.hint && <span className="text-[9px] font-mono text-muted shrink-0">{option.hint}</span>}
                    {selected && <Check size={13} className="text-gold shrink-0" />}
                  </button>
                );
              })}
            </div>

            {footer && (
              <p className="px-4 py-2 border-t border-gold/10 text-[9px] font-mono uppercase tracking-wider text-muted">
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
    selectorCurrencies,
    rateIsConfigured,
    hasConfiguredRate,
    setCurrencyCode,
    ratesAreManual,
  } = useCurrency();
  const [open, setOpen] = useState<MenuId | null>(null);

  const close = () => setOpen(null);
  const toggle = (id: MenuId) => setOpen((current) => (current === id ? null : id));

  const currencyTrigger = `${currency.symbol !== currency.code ? `${currency.symbol} ` : ""}${currency.code}`;

  const currencyMenu = (
    <SelectorMenu
      id="currency"
      open={open === "currency"}
      onToggle={() => toggle("currency")}
      onClose={close}
      trigger={
        <>
          <Coins size={15} strokeWidth={1.3} aria-hidden="true" />
          <span>{currencyTrigger}</span>
        </>
      }
      triggerTitle={`${currency.code} — ${currency.name}${rateIsConfigured ? "" : ` · ${t("international.ratePending")}`}`}
      ariaLabel={t("nav.selectCurrency")}
      activeValue={currency.code}
      onSelect={setCurrencyCode}
      alignEnd={variant === "row"}
      footer={
        rateIsConfigured
          ? ratesAreManual
            ? t("international.ratesManualTitle")
            : undefined
          : t("international.rateNotConfigured", { currency: currency.code })
      }
      options={selectorCurrencies.map((c) => ({
        value: c.code,
        text: `${c.symbol} ${c.name}`,
        hint: c.code,
        note: hasConfiguredRate(c.code) ? undefined : t("international.ratePending"),
      }))}
    />
  );

  const languageMenu = (
    <SelectorMenu
      id="language"
      open={open === "language"}
      onToggle={() => toggle("language")}
      onClose={close}
      trigger={
        <>
          <Languages size={15} strokeWidth={1.3} aria-hidden="true" />
          <span>{language.code.toUpperCase()}</span>
        </>
      }
      triggerTitle={language.name}
      ariaLabel={t("nav.selectLanguage")}
      activeValue={language.code}
      onSelect={setLanguageCode}
      alignEnd={variant === "row"}
      options={languages.map((l) => ({ value: l.code, text: l.nativeName, hint: l.code.toUpperCase() }))}
    />
  );

  if (variant === "stacked") {
    return (
      <div className="flex flex-col items-center gap-2">
        {currencyMenu}
        {languageMenu}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {currencyMenu}
      {languageMenu}
    </div>
  );
}
