import React, { useId, useState } from "react";
import { BarChart2, ChevronDown, TrendingUp } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";

/** One real, server-aggregated datum. Nothing here is generated client side. */
export interface ChartPoint {
  label: string;
  value: number;
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Primary series. Empty renders an honest "no rows" panel — never a placeholder. */
  points?: ChartPoint[];
  /** Optional second series. Scaled to its own maximum and always labelled. */
  secondary?: ChartPoint[];
  /** Formatter for the primary series (e.g. formatPKR for money). */
  formatter?: (n: number) => string;
  /** Formatter for the secondary series when its unit differs (e.g. counts). */
  secondaryFormatter?: (n: number) => string;
  caption?: string;
  variant?: "line" | "bar";
  /** @deprecated Legacy alias of `variant`; kept so older call sites compile. */
  type?: "line" | "bar" | "distribution";
  primaryLabel?: string;
  secondaryLabel?: string;
  /** Column header for the categorical axis of the data table. */
  axisLabel?: string;
  emptyMessage?: string;
}

const VIEW_W = 500;
const VIEW_H = 160;
const HEAD_ROOM = 16;
const MAX_TICKS = 8;

const defaultFormatter = (n: number) => Math.round(n).toLocaleString("en-US");

function scaledHeight(value: number, max: number) {
  if (!(max > 0) || !Number.isFinite(value) || value <= 0) return 0;
  const h = (value / max) * (VIEW_H - HEAD_ROOM);
  return h < 1.5 ? 1.5 : h;
}

function tickStep(count: number) {
  return Math.max(1, Math.ceil(count / MAX_TICKS));
}

function describeSeries(
  label: string,
  series: ChartPoint[],
  fmt: (n: number) => string,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  if (series.length === 0) return t("admin.chartCard.seriesNoRows", { label });
  return `${label}: ${series.map((p) => `${p.label} ${fmt(p.value)}`).join("; ")}.`;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  points: seriesProp,
  secondary,
  formatter = defaultFormatter,
  secondaryFormatter,
  caption,
  variant,
  type,
  primaryLabel,
  secondaryLabel,
  axisLabel,
  emptyMessage,
}) => {
  const { t } = useI18n();
  const uid = `cc-${useId().replace(/[^A-Za-z0-9]/g, "")}`;
  const [open, setOpen] = useState(false);

  // Defaults are copy, so they resolve through the dictionary rather than a parameter.
  const primaryLabelText = primaryLabel ?? t("admin.chartCard.value");
  const secondaryLabelText = secondaryLabel ?? t("admin.chartCard.secondary");
  const axisLabelText = axisLabel ?? t("admin.chartCard.bucket");
  const emptyText = emptyMessage ?? t("admin.chartCard.noRowsForPanel");

  const points = seriesProp ?? [];
  const kind: "line" | "bar" = variant ?? (type === "line" ? "line" : "bar");
  const sec = secondary ?? [];
  const hasSecondary = sec.length > 0;
  const fmtSecondary = secondaryFormatter ?? formatter;

  const primaryMax = points.reduce((m, p) => Math.max(m, p.value), 0);
  const secondaryMax = sec.reduce((m, p) => Math.max(m, p.value), 0);
  const primaryTotal = points.reduce((s, p) => s + p.value, 0);
  const secondaryTotal = sec.reduce((s, p) => s + p.value, 0);
  const hasSignal = points.some((p) => p.value !== 0) || sec.some((p) => p.value !== 0);
  const chartVariant: "line" | "bar" = points.length === 1 ? "bar" : kind;

  const altText = [
    describeSeries(primaryLabelText, points, formatter, t),
    hasSecondary ? describeSeries(secondaryLabelText, sec, fmtSecondary, t) : null,
  ]
    .filter(Boolean)
    .join(" ");

  const band = VIEW_W / Math.max(points.length, 1);
  const xAt = (i: number) => (points.length <= 1 ? VIEW_W / 2 : (i * VIEW_W) / Math.max(points.length - 1, 1));
  const yAt = (v: number, max: number) => VIEW_H - scaledHeight(v, max);
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)},${yAt(p.value, primaryMax)}`).join(" ");
  const areaPath =
    points.length > 1
      ? `${linePath} L ${xAt(points.length - 1)},${VIEW_H} L ${xAt(0)},${VIEW_H} Z`
      : "";
  const secLinePath = sec.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)},${yAt(p.value, secondaryMax)}`).join(" ");
  const step = tickStep(points.length);

  return (
    <section
      aria-labelledby={`${uid}-title`}
      className="bg-navy2/90 border border-gold/20 rounded-lg p-4 sm:p-6 shadow-xl space-y-4 min-w-0"
    >
      {/* Header */}
      <div className="border-b border-gold/15 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3
            id={`${uid}-title`}
            className="font-serif text-base sm:text-lg font-bold text-ivory tracking-wide truncate"
          >
            {title}
          </h3>
          <span className="p-1 rounded bg-gold/10 text-gold shrink-0">
            {chartVariant === "line" ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <BarChart2 className="w-4 h-4" />
            )}
          </span>
        </div>
        {subtitle && (
          <p className="text-xs text-muted font-sans font-light mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Derived summary + legend (computed from the series, never hardcoded) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-mono uppercase tracking-[1.5px] text-muted">
        <span>
          {primaryLabelText}{" "}
          <span className="text-gold num-lining normal-case tracking-normal">{formatter(primaryTotal)}</span>
          <span className="text-muted/70 normal-case tracking-normal"> {t("admin.chartCard.totalPeak")} </span>
          <span className="text-gold num-lining normal-case tracking-normal">{formatter(primaryMax)}</span>
        </span>
        {hasSecondary && (
          <span>
            {secondaryLabelText}{" "}
            <span className="text-ivory num-lining normal-case tracking-normal">{fmtSecondary(secondaryTotal)}</span>
            <span className="text-muted/70 normal-case tracking-normal"> {t("admin.chartCard.totalPeak")} </span>
            <span className="text-ivory num-lining normal-case tracking-normal">{fmtSecondary(secondaryMax)}</span>
          </span>
        )}
        <span className="num-lining normal-case tracking-normal">{t("admin.chartCard.pointsCount", { count: points.length })}</span>
        {hasSecondary && (
          <span className="flex items-center gap-3 normal-case tracking-normal font-sans">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-2 rounded-sm bg-gold" aria-hidden="true" />
              {primaryLabelText}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-2 rounded-sm bg-ivory/40" aria-hidden="true" />
              {secondaryLabelText}
            </span>
          </span>
        )}
      </div>

      {/* Visual */}
      {points.length === 0 || !hasSignal ? (
        <div className="h-28 sm:h-32 flex items-center justify-center border border-dashed border-gold/20 rounded bg-navy/40 px-4 text-center">
          <p className="text-xs text-muted font-light">
            {points.length === 0
              ? emptyText
              : points.length === 1
                ? t("admin.chartCard.rowAllZero")
                : t("admin.chartCard.rowsAllZero", { count: points.length })}
          </p>
        </div>
      ) : (
        <div className="min-w-0">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            className="w-full h-36 sm:h-44 overflow-visible"
            role="img"
            aria-labelledby={`${uid}-svg-title ${uid}-svg-desc`}
          >
            <title id={`${uid}-svg-title`}>{`${title} — ${primaryLabelText}`}</title>
            <desc id={`${uid}-svg-desc`}>{altText}</desc>
            <defs>
              <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E0C27A" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#C8A96B" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Grid */}
            {[0.25, 0.5, 0.75, 1].map((f) => (
              <line
                key={f}
                x1="0"
                x2={VIEW_W}
                y1={VIEW_H - f * (VIEW_H - HEAD_ROOM)}
                y2={VIEW_H - f * (VIEW_H - HEAD_ROOM)}
                stroke="rgba(200,169,107,0.12)"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <line
              x1="0"
              x2={VIEW_W}
              y1={VIEW_H}
              y2={VIEW_H}
              stroke="rgba(200,169,107,0.35)"
              vectorEffect="non-scaling-stroke"
            />

            {chartVariant === "line" ? (
              <>
                {hasSecondary && secondaryMax > 0 && (
                  <path
                    d={secLinePath}
                    fill="none"
                    stroke="rgba(246,241,231,0.55)"
                    strokeWidth="2"
                    strokeDasharray="5 4"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                {areaPath && <path d={areaPath} fill={`url(#${uid}-fill)`} opacity="0.45" />}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#C8A96B"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            ) : (
              <>
                {hasSecondary &&
                  sec.map((p, i) => {
                    const h = scaledHeight(p.value, secondaryMax);
                    if (h === 0) return null;
                    return (
                      <rect
                        key={`s-${i}`}
                        x={i * band + band * 0.5}
                        y={VIEW_H - h}
                        width={band * 0.36}
                        height={h}
                        fill="rgba(246,241,231,0.28)"
                      >
                        <title>{`${p.label} — ${secondaryLabelText}: ${fmtSecondary(p.value)}`}</title>
                      </rect>
                    );
                  })}
                {points.map((p, i) => {
                  const h = scaledHeight(p.value, primaryMax);
                  if (h === 0) return null;
                  return (
                    <rect
                      key={`p-${i}`}
                      x={i * band + band * 0.12}
                      y={VIEW_H - h}
                      width={band * 0.36}
                      height={h}
                      fill={`url(#${uid}-fill)`}
                    >
                      <title>{`${p.label} — ${primaryLabelText}: ${formatter(p.value)}`}</title>
                    </rect>
                  );
                })}
              </>
            )}

            {/* Hover / hit targets with per-point text alternatives */}
            {points.map((p, i) => {
              const secPoint = sec[i];
              return (
                <rect
                  key={`hit-${i}`}
                  x={i * band}
                  y="0"
                  width={band}
                  height={VIEW_H}
                  fill="transparent"
                >
                  <title>
                    {`${p.label}: ${primaryLabelText} ${formatter(p.value)}${
                      secPoint ? ` · ${secondaryLabelText} ${fmtSecondary(secPoint.value)}` : ""
                    }`}
                  </title>
                </rect>
              );
            })}
          </svg>

          {/* Axis labels (thinned so they never overflow narrow screens) */}
          <div className="flex border-t border-gold/10 pt-2 mt-1 text-[9px] sm:text-[10px] text-muted font-mono num-lining">
            {points.map((p, i) => (
              <span
                key={`${p.label}-${i}`}
                className={`flex-1 min-w-0 text-center truncate ${i % step === 0 || i === points.length - 1 ? "" : "invisible"}`}
                title={p.label}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Caption + accessible data table toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        {caption && <p className="text-[10px] text-muted font-light sm:max-w-[70%]">{caption}</p>}
        {points.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={`${uid}-table`}
            className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-gold/25 text-[10px] font-mono uppercase tracking-[1.5px] text-muted hover:text-ivory hover:border-gold/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold focus-visible:text-ivory transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
            {open ? t("admin.chartCard.hideData") : t("admin.chartCard.showData")}
          </button>
        )}
      </div>

      {open && (
        <div
          id={`${uid}-table`}
          className="overflow-x-auto border border-gold/20 rounded-lg bg-navy/40 max-h-72"
        >
          <table className="w-full min-w-[240px] text-start text-xs font-sans">
            <caption className="sr-only">{t("admin.chartCard.presentedAsTable", { title })}</caption>
            <thead className="bg-navy text-gold uppercase tracking-[1.5px] text-[10px] border-b border-gold/15">
              <tr>
                <th scope="col" className="px-3 py-2.5 whitespace-nowrap">
                  {axisLabelText}
                </th>
                <th scope="col" className="px-3 py-2.5 text-end whitespace-nowrap">
                  {primaryLabelText}
                </th>
                {hasSecondary && (
                  <th scope="col" className="px-3 py-2.5 text-end whitespace-nowrap">
                    {secondaryLabelText}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10 text-ivory num-lining">
              {points.map((p, i) => {
                const secPoint = sec[i];
                return (
                  <tr key={`${p.label}-${i}`} className="hover:bg-navy/60 transition-colors">
                    <th scope="row" className="px-3 py-2.5 font-sans font-normal text-start">
                      {p.label}
                    </th>
                    <td className="px-3 py-2.5 text-end whitespace-nowrap font-mono text-gold">
                      {formatter(p.value)}
                    </td>
                    {hasSecondary && (
                      <td className="px-3 py-2.5 text-end whitespace-nowrap font-mono">
                        {secPoint ? fmtSecondary(secPoint.value) : "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
