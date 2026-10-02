import { Check, X } from "lucide-react";

export interface OrderTimelineEvent {
  status: string;
  note?: string;
  date?: string;
}

export interface OrderTimelineProps {
  events: OrderTimelineEvent[];
  compact?: boolean;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Order events arrive as "YYYY-MM-DD HH:MM" (or a raw ISO stamp from other
// services). Formatting from the string parts keeps the atelier's local date
// intact — parsing through Date() would shift it by the viewer's timezone.
export function formatOrderStamp(value?: string): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value.trim());
  if (!match) return value;

  const [, year, month, day, hour, minute] = match;
  const monthIndex = Number(month) - 1;
  if (monthIndex < 0 || monthIndex > 11) return value;

  // A midnight-only timestamp is a date, not a time of day.
  const hasTime = hour !== undefined && minute !== undefined && !(hour === "00" && minute === "00");
  return `${Number(day)} ${MONTH_NAMES[monthIndex]} ${year}${hasTime ? ` · ${hour}:${minute}` : ""}`;
}

function isExceptionStatus(status: string): boolean {
  return /cancel|return|refund|fail|reject/i.test(status);
}

function isTerminalStatus(status: string): boolean {
  return /deliver|complet|close/i.test(status);
}

/**
 * Pure presentational fulfilment timeline. It renders exactly the events it is
 * given — no fetching, no invented steps — oldest first, newest step highlighted.
 */
export function OrderTimeline({ events, compact = false }: OrderTimelineProps) {
  const steps = events ?? [];

  if (steps.length === 0) {
    return (
      <p className="text-[11px] text-muted italic font-light bg-navy/50 border border-gold/15 rounded-lg px-3.5 py-3 leading-relaxed">
        No status updates have been recorded for this order yet.
      </p>
    );
  }

  const currentIdx = steps.length - 1;

  return (
    <ol className="relative">
      {steps.map((event, idx) => {
        const isCurrent = idx === currentIdx;
        const isLast = idx === steps.length - 1;
        const exception = isExceptionStatus(event.status);
        const stamp = formatOrderStamp(event.date);
        const note = event.note?.trim();

        const dotTone = exception
          ? "bg-rose-950/70 border-rose-500/50 text-rose-300"
          : isCurrent
          ? "bg-gold border-gold text-navy shadow-lg ring-1 ring-gold/40"
          : "bg-gold/80 border-gold text-navy";

        const cardTone = exception
          ? "bg-rose-950/30 border-rose-500/30"
          : isCurrent
          ? "bg-navy border-gold shadow-lg ring-1 ring-gold/30"
          : "bg-navy/70 border-gold/15";

        return (
          <li
            key={`${event.status}-${idx}`}
            aria-current={isCurrent ? "step" : undefined}
            className={`relative flex gap-3 ${compact ? "pb-3" : "pb-4 sm:gap-4"} last:pb-0`}
          >
            {!isLast && (
              <span
                aria-hidden="true"
                className={`absolute bottom-0 w-px -translate-x-1/2 bg-gold/20 ${
                  compact ? "left-2.5 top-6" : "left-3 top-8"
                }`}
              />
            )}

            <span
              aria-hidden="true"
              className={`relative z-10 shrink-0 rounded-full border flex items-center justify-center ${
                compact ? "w-5 h-5" : "w-6 h-6"
              } ${dotTone}`}
            >
              {exception ? (
                <X className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
              ) : isCurrent ? (
                <span className="w-2 h-2 rounded-full bg-navy animate-pulse" />
              ) : (
                <Check className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
              )}
            </span>

            <div className={`min-w-0 flex-1 rounded-lg border p-3 ${cardTone}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h4
                  className={`font-serif font-bold leading-tight ${
                    compact ? "text-sm" : "text-sm sm:text-base"
                  } ${isCurrent ? "text-gold" : exception ? "text-rose-200" : "text-ivory"}`}
                >
                  {event.status}
                </h4>
                {stamp && (
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted shrink-0 num-lining">
                    {stamp}
                  </p>
                )}
              </div>

              {isCurrent && (
                <span
                  className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-[1.5px] border ${
                    exception
                      ? "border-rose-500/40 bg-rose-950/50 text-rose-200"
                      : "border-gold/40 bg-gold/10 text-gold"
                  }`}
                >
                  {exception ? "Final status" : isTerminalStatus(event.status) ? "Delivered" : "Current status"}
                </span>
              )}

              {note && (
                <p className="mt-1.5 text-[11px] sm:text-xs text-muted font-light leading-relaxed break-words">
                  {note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default OrderTimeline;
