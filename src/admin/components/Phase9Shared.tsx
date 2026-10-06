import React from "react";
import { CalendarClock, Info, TriangleAlert } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { useCurrency } from "../../context/CurrencyContext";
import { baseCurrency, currencyByCode, formatMinor, type CurrencyDef } from "../../lib/money";
import type { DataStatus, ReportFilters } from "../../services/businessIntelligence";

/**
 * Shared vocabulary for the Phase 9 surfaces.
 *
 * The rule these components exist to enforce: a metric and a gap look different.
 * `MetricStatus` names how a figure was produced, and `DataGap` is what renders
 * when there is no figure — never a dash pretending to be a zero.
 */

const STATUS_KEYS: Record<DataStatus, string> = {
  actual: "admin.intelligence.statusActual",
  configured: "admin.intelligence.statusConfigured",
  calculated: "admin.intelligence.statusCalculated",
  forecast: "admin.intelligence.statusForecast",
  insufficient_data: "admin.intelligence.statusInsufficient",
  not_tracked: "admin.intelligence.statusNotTracked",
  not_configured: "admin.intelligence.statusNotConfigured",
  configuration_pending: "admin.intelligence.statusConfigurationPending",
  error: "admin.intelligence.statusError",
};

const STATUS_TONE: Record<DataStatus, string> = {
  actual: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30",
  configured: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30",
  calculated: "bg-gold/10 text-gold border-gold/40",
  forecast: "bg-amber-950/40 text-amber-300 border-amber-500/30",
  insufficient_data: "bg-navy2 text-muted border-gold/20",
  not_tracked: "bg-navy2 text-muted border-gold/20",
  not_configured: "bg-rose-950/30 text-rose-300 border-rose-500/30",
  configuration_pending: "bg-amber-950/40 text-amber-300 border-amber-500/30",
  error: "bg-rose-950/40 text-rose-300 border-rose-500/30",
};

export const MetricStatus: React.FC<{ status: DataStatus | string; className?: string }> = ({
  status,
  className = "",
}) => {
  const { t } = useI18n();
  const key = status as DataStatus;
  return (
    <span
      data-status={key}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-mono uppercase tracking-[1.2px] shrink-0 ${
        STATUS_TONE[key] ?? STATUS_TONE.calculated
      } ${className}`}
    >
      {t(STATUS_KEYS[key] ?? "admin.intelligence.statusCalculated")}
    </span>
  );
};

interface PanelProps {
  title: string;
  status?: DataStatus | string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  id: string;
}

export const Panel: React.FC<PanelProps> = ({ title, status, subtitle, children, actions, id }) => (
  <section
    aria-labelledby={`panel-${id}`}
    data-panel={id}
    data-status={status}
    className="bg-navy2/90 border border-gold/20 rounded-lg p-4 sm:p-6 shadow-xl space-y-4 min-w-0"
  >
    <div className="border-b border-gold/15 pb-3 flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id={`panel-${id}`} className="font-serif text-base sm:text-lg font-bold text-ivory tracking-wide">
            {title}
          </h3>
          {status ? <MetricStatus status={status} /> : null}
        </div>
        {subtitle ? <p className="text-xs text-muted font-sans font-light mt-0.5">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
    {children}
  </section>
);

interface DataGapProps {
  status: DataStatus | string;
  note?: string | null;
  /** e.g. the number of purchases a forecast needs, when the gap is a threshold. */
  detail?: React.ReactNode;
}

export const DataGap: React.FC<DataGapProps> = ({ status, note, detail }) => {
  const { t } = useI18n();
  const heading = t(STATUS_KEYS[status as DataStatus] ?? "admin.intelligence.statusInsufficient");
  const negative = status === "not_configured" || status === "error";
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-dashed border-gold/25 bg-navy/40 p-4"
      role="note"
    >
      <span className={`p-1.5 rounded shrink-0 ${negative ? "bg-rose-950/40 text-rose-300" : "bg-gold/10 text-gold"}`}>
        {negative ? <TriangleAlert className="w-4 h-4" /> : <Info className="w-4 h-4" />}
      </span>
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] font-mono uppercase tracking-[1.5px] text-gold">{heading}</p>
        {note ? <p className="text-xs text-muted font-light leading-relaxed">{note}</p> : null}
        {detail ? <div className="text-xs text-ivory/80 font-light pt-1">{detail}</div> : null}
      </div>
    </div>
  );
}

export const LoadingPanel: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 rounded-lg border border-gold/15 bg-navy/40 p-6 text-xs text-muted">
    <span className="animate-spin h-4 w-4 rounded-full border-2 border-gold/30 border-t-gold" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export const ErrorPanel: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-950/20 p-4">
      <p className="text-xs text-rose-200 font-light">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-3 py-1.5 rounded border border-gold/30 text-[10px] font-mono uppercase tracking-[1.5px] text-muted hover:text-ivory hover:border-gold/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold transition-colors"
      >
        {t("admin.intelligence.retry")}
      </button>
    </div>
  );
};

/**
 * Formatters bound to the report's own currency.
 *
 * The database already converted the figures, so these must not convert again:
 * they only apply the symbol and the decimal count of the currency named in the
 * payload.
 */
export function useReportFormat(currencyCode?: string | null) {
  const { locale } = useI18n();
  const { currencies } = useCurrency();
  const resolved: CurrencyDef =
    currencyByCode(currencies, currencyCode && currencyCode !== "base" ? currencyCode : null) ??
    baseCurrency(currencies);

  return {
    currency: resolved,
    money: (value: number | null | undefined): string => {
      if (value === null || value === undefined || !Number.isFinite(value)) return "—";
      const minor = Math.round(value * Math.pow(10, resolved.minorUnits));
      return formatMinor(minor, resolved, locale);
    },
    number: (value: number | null | undefined, digits = 0): string => {
      if (value === null || value === undefined || !Number.isFinite(value)) return "—";
      return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
    },
    percent: (value: number | null | undefined): string => {
      if (value === null || value === undefined || !Number.isFinite(value)) return "—";
      return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
    },
    date: (value: string | null | undefined): string => {
      if (!value) return "—";
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "2-digit" }).format(parsed);
    },
    dateTime: (value: string | null | undefined): string => {
      if (!value) return "—";
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsed);
    },
  };
}

const chip =
  "px-3 py-1.5 rounded border text-[10px] font-mono uppercase tracking-[1.5px] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold";
const chipOn = "border-gold/60 bg-gold/10 text-gold";
const chipOff = "border-gold/20 text-muted hover:text-ivory hover:border-gold/45";
const field =
  "w-full min-w-0 rounded border border-gold/20 bg-navy px-3 py-2 text-xs font-sans text-ivory focus:border-gold focus:outline-none";

export const WINDOWS = [7, 30, 90, 365] as const;

// Translation keys stay literal: the parity harness reads the source, and a
// computed key is invisible to it.
const WINDOW_KEYS: Record<number, string> = {
  7: "admin.intelligence.filter.window7",
  30: "admin.intelligence.filter.window30",
  90: "admin.intelligence.filter.window90",
  365: "admin.intelligence.filter.window365",
};

interface FilterBarProps {
  filters: ReportFilters;
  onChange: (next: ReportFilters) => void;
  windowDays: number;
  onWindowChange: (days: number) => void;
  countries: { code: string; name: string }[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  windowDays,
  onWindowChange,
  countries,
}) => {
  const { t } = useI18n();
  const { currencies } = useCurrency();
  const enabled = currencies.filter((c) => c.enabled);

  return (
    <div className="rounded-lg border border-gold/20 bg-navy2/70 p-4 space-y-3 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[1.5px] text-muted">
          <CalendarClock className="w-3.5 h-3.5 text-gold" />
          {t("admin.intelligence.filter.window")}
        </span>
        {WINDOWS.map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => onWindowChange(days)}
            aria-pressed={windowDays === days}
            className={`${chip} ${windowDays === days ? chipOn : chipOff}`}
          >
            {t(WINDOW_KEYS[days])}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-[1.5px] text-muted">{t("admin.intelligence.filter.from")}</span>
          <input
            type="date"
            value={filters.from || ""}
            max={filters.to || undefined}
            onChange={(e) => onChange({ ...filters, from: e.target.value || null })}
            className={field}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-[1.5px] text-muted">{t("admin.intelligence.filter.to")}</span>
          <input
            type="date"
            value={filters.to || ""}
            min={filters.from || undefined}
            onChange={(e) => onChange({ ...filters, to: e.target.value || null })}
            className={field}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-[1.5px] text-muted">{t("admin.intelligence.filter.country")}</span>
          <select
            value={filters.country || ""}
            onChange={(e) => onChange({ ...filters, country: e.target.value || null })}
            className={field}
          >
            <option value="">{t("admin.intelligence.filter.allCountries")}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-[1.5px] text-muted">{t("admin.intelligence.filter.currency")}</span>
          <select
            value={filters.currency || ""}
            onChange={(e) => onChange({ ...filters, currency: e.target.value || null })}
            className={field}
          >
            <option value="">{t("admin.intelligence.filter.baseCurrency")}</option>
            {enabled.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-muted font-light">
          {filters.from || filters.to ? t("admin.intelligence.filter.customRange") : t(WINDOW_KEYS[windowDays] ?? "admin.intelligence.filter.window90")}
          {" · "}
          {filters.currency || t("admin.intelligence.filter.baseCurrency")}
        </p>
        <button
          type="button"
          onClick={() => onChange({ from: null, to: null, country: null, currency: null })}
          className={`${chip} ${chipOff}`}
        >
          {t("admin.intelligence.filter.reset")}
        </button>
      </div>
    </div>
  );
};

export { chip, chipOn, chipOff, field };
