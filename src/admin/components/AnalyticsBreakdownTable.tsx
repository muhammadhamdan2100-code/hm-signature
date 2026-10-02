import React from "react";

export interface BreakdownColumn<T> {
  header: string;
  align?: "left" | "right";
  render: (row: T, index: number) => React.ReactNode;
}

interface AnalyticsBreakdownTableProps<T> {
  title: string;
  subtitle?: string;
  caption?: string;
  rows: T[];
  columns: BreakdownColumn<T>[];
  rowKey: (row: T, index: number) => string;
  emptyMessage?: string;
}

/**
 * Detail table for analytics panels whose rows carry more than one measure
 * (units + orders + revenue, uses + discount + status). Visual style and class
 * vocabulary match ChartCard so the admin surfaces stay consistent.
 */
export function AnalyticsBreakdownTable<T>({
  title,
  subtitle,
  caption,
  rows,
  columns,
  rowKey,
  emptyMessage = "The aggregation returned no rows for this panel.",
}: AnalyticsBreakdownTableProps<T>) {
  return (
    <section
      aria-labelledby={`breakdown-${title.replace(/[^A-Za-z0-9]/g, "").toLowerCase()}`}
      className="bg-navy2/90 border border-gold/20 rounded-lg p-4 sm:p-6 shadow-xl space-y-4 min-w-0"
    >
      <div className="border-b border-gold/15 pb-3">
        <h3
          id={`breakdown-${title.replace(/[^A-Za-z0-9]/g, "").toLowerCase()}`}
          className="font-serif text-base sm:text-lg font-bold text-ivory tracking-wide truncate"
        >
          {title}
        </h3>
        {subtitle && <p className="text-xs text-muted font-sans font-light mt-0.5">{subtitle}</p>}
      </div>

      <div className="overflow-x-auto border border-gold/20 rounded-lg bg-navy/40 max-h-72">
        <table className="w-full min-w-[320px] text-left text-xs font-sans">
          <caption className="sr-only">{`${title}. ${caption ?? ""}`}</caption>
          <thead className="sticky top-0 bg-navy text-gold uppercase tracking-[1.5px] text-[10px] border-b border-gold/15">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.header}
                  scope="col"
                  className={`px-3 py-2.5 whitespace-nowrap ${col.align === "right" ? "text-right" : "text-left"}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gold/10 text-ivory num-lining">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center">
                  <p className="text-xs text-muted font-light">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={rowKey(row, idx)} className="hover:bg-navy/60 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.header}
                      className={`px-3 py-2.5 align-middle ${col.align === "right" ? "text-right" : "text-left"}`}
                    >
                      {col.render(row, idx)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {caption && <p className="text-[10px] text-muted font-light">{caption}</p>}
    </section>
  );
}
