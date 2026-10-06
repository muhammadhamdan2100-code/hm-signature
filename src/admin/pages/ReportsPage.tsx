import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { AnalyticsBreakdownTable, type BreakdownColumn } from "../components/AnalyticsBreakdownTable";
import { DataGap, ErrorPanel, FilterBar, LoadingPanel, MetricStatus, Panel, useReportFormat } from "../components/Phase9Shared";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import {
  fetchAdminReport,
  REPORT_SECTIONS,
  REPORT_SCOPES,
  type AdminReportPayload,
  type ReportFilters,
} from "../../services/businessIntelligence";
import { downloadCsv, downloadXlsx, exportFileName, type ExportContext } from "../../lib/reportExport";
import { fetchCountries } from "../../services/internationalConfig";

/**
 * Phase 9 report window: the five sections, each read through
 * `get_admin_report()`, plus the exports.
 *
 * Which tabs appear is decided twice — here, from the signed-in staff member's
 * permissions, and again in Postgres for every call. A tab that cannot be opened
 * is not merely hidden: the endpoint refuses it.
 *
 * Exports are built in the browser from the rows already on screen. That keeps a
 * service key out of the path, and means the file can only ever contain the
 * columns the authorised reader was shown.
 */

const PERMISSION_FOR_SECTION: Record<string, string> = {
  sales: "reports.business",
  customers: "reports.business",
  products: "reports.content",
  payments: "reports.operational",
  inventory: "reports.operational",
};

const SECTION_LABEL_KEYS: Record<string, string> = {
  sales: "admin.reports.sectionSales",
  customers: "admin.reports.sectionCustomers",
  products: "admin.reports.sectionProducts",
  payments: "admin.reports.sectionPayments",
  inventory: "admin.reports.sectionInventory",
};

const SECTION_NOTE_KEYS: Record<string, string> = {
  sales: "admin.reports.noteSales",
  customers: "admin.reports.noteCustomers",
  products: "admin.reports.noteProducts",
  payments: "admin.reports.notePayments",
  inventory: "admin.reports.noteInventory",
};

const COLUMN_LABEL_KEYS: Record<string, string> = {
  period: "admin.reports.colPeriod",
  orders: "admin.reports.colOrders",
  purchases: "admin.reports.colPurchases",
  units: "admin.reports.colUnits",
  gross: "admin.reports.colGross",
  discounts: "admin.reports.colDiscounts",
  refunds: "admin.reports.colRefunds",
  net: "admin.reports.colNet",
  average_order_value: "admin.reports.colAverageOrderValue",
  customer: "admin.reports.colCustomer",
  first_order: "admin.reports.colFirstOrder",
  last_order: "admin.reports.colLastOrder",
  repeat_buyer: "admin.reports.colRepeatBuyer",
  product: "admin.reports.colProduct",
  revenue: "admin.reports.colRevenue",
  share_percent: "admin.reports.colShare",
  method: "admin.reports.colMethod",
  currency: "admin.reports.colCurrency",
  settled: "admin.reports.colSettled",
  awaiting: "admin.reports.colAwaiting",
  failed: "admin.reports.colFailed",
  settled_amount: "admin.reports.colSettledAmount",
  awaiting_amount: "admin.reports.colAwaitingAmount",
  refunded_amount: "admin.reports.colRefundedAmount",
  size: "admin.reports.colSize",
  sku: "admin.reports.colSku",
  on_hand: "admin.reports.colOnHand",
  reserved: "admin.reports.colReserved",
  available: "admin.reports.colAvailable",
  low_stock_threshold: "admin.reports.colLowStockThreshold",
  sold_in_window: "admin.reports.colSoldInWindow",
  status: "admin.reports.colStatus",
};

export function ReportsPage({ initialSection }: { initialSection?: string } = {}) {
  const { t, locale } = useI18n();
  const staff = getCurrentStaff();
  const [filters, setFilters] = useState<ReportFilters>({ from: null, to: null, country: null, currency: null });
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [payload, setPayload] = useState<AdminReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const allowedSections = useMemo(
    () => REPORT_SECTIONS.filter((section) => hasPermission(staff, PERMISSION_FOR_SECTION[section])),
    [staff]
  );

  const [section, setSection] = useState<string>(() => {
    const wanted = initialSection && REPORT_SECTIONS.includes(initialSection as (typeof REPORT_SECTIONS)[number])
      ? initialSection
      : null;
    if (wanted && hasPermission(staff, PERMISSION_FOR_SECTION[wanted])) return wanted;
    return REPORT_SECTIONS.filter((s) => hasPermission(staff, PERMISSION_FOR_SECTION[s]))[0] || "sales";
  });

  useEffect(() => {
    fetchCountries()
      .then((rows) => setCountries(rows.map((r) => ({ code: r.code, name: r.name }))))
      .catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    if (!allowedSections.includes(section as (typeof REPORT_SECTIONS)[number]) && allowedSections.length) {
      setSection(allowedSections[0]);
    }
  }, [allowedSections, section]);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    setNotice(null);
    const report = await fetchAdminReport(section, filters);
    setPayload(report);
    if (!report) setFailed(true);
    else if (report.data_status === "error") setNotice(t("admin.reports.unknownSection"));
    setLoading(false);
  }, [section, filters, t]);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = useReportFormat(payload?.currency || filters.currency);

  const labelForColumn = useCallback(
    // The payload names its own columns, and this map is the only place their
    // translation keys live, so an unknown column falls back to a real key
    // rather than rendering a raw dot-path on screen or into a file.
    (key: string) => t(COLUMN_LABEL_KEYS[key] || "admin.reports.colPeriod"),
    [t]
  );

  const renderCell = useCallback(
    (kind: string, value: unknown): React.ReactNode => {
      if (value === null || value === undefined || value === "") {
        return <span className="text-muted">—</span>;
      }
      if (kind === "money") return <span className="text-gold num-lining whitespace-nowrap">{fmt.money(Number(value))}</span>;
      if (kind === "percent") return <span className="text-ivory num-lining">{fmt.percent(Number(value))}</span>;
      if (kind === "count" || kind === "number") return <span className="text-ivory num-lining">{fmt.number(Number(value))}</span>;
      if (kind === "date") return <span className="text-muted whitespace-nowrap">{fmt.date(String(value))}</span>;
      if (kind === "boolean") {
        return (
          <span className={`text-[10px] font-mono uppercase tracking-[1.2px] ${value ? "text-emerald-300" : "text-muted"}`}>
            {value ? t("admin.reports.yes") : t("admin.reports.no")}
          </span>
        );
      }
      return <span className="text-ivory">{String(value)}</span>;
    },
    [fmt, t]
  );

  const columns: BreakdownColumn<Record<string, string | number | boolean | null>>[] = useMemo(
    () =>
      (payload?.columns || []).map((column) => ({
        header: labelForColumn(column.label_key),
        align: column.kind === "text" || column.kind === "date" || column.kind === "boolean" ? ("left" as const) : ("right" as const),
        render: (row: Record<string, string | number | boolean | null>) => renderCell(column.kind, row[column.key]),
      })),
    [payload, renderCell, labelForColumn]
  );

  const exportContext: ExportContext = useMemo(
    () => ({
      label: labelForColumn,
      title: t(SECTION_LABEL_KEYS[payload?.section || section] || "admin.reports.title"),
    }),
    // The exporter needs the resolved header text, which is the same source the
    // table uses, so the two can never drift apart.
    [payload?.section, section, t, labelForColumn]
  );

  const meta = useMemo(
    () => [
      ["Report", t(SECTION_LABEL_KEYS[payload?.section || section] || "admin.reports.title")],
      ["Scope", payload?.scope || REPORT_SCOPES[section] || ""],
      ["Window", `${filters.from || t("admin.reports.allTime")} → ${filters.to || new Date().toISOString().slice(0, 10)}`],
      ["Country", payload?.country || filters.country || t("admin.reports.allCountries")],
      ["Currency", payload?.currency === "base" || !filters.currency ? t("admin.reports.baseCurrency") : filters.currency],
      ["Data status", payload?.data_status || ""],
      ["Generated", new Date().toISOString()],
      ["Locale", locale],
    ],
    [payload, section, filters, t, locale]
  );

  const exportCsv = () => {
    if (!payload?.rows?.length) return;
    downloadCsv(payload, exportContext, exportFileName(payload.section, filters, "csv"));
    setNotice(t("admin.reports.exportedCsv"));
  };

  const exportXlsx = () => {
    if (!payload?.rows?.length) return;
    downloadXlsx(payload, exportContext, meta, exportFileName(payload.section, filters, "xlsx"));
    setNotice(t("admin.reports.exportedXlsx"));
  };

  const visible = allowedSections.length > 0;

  return (
    <div className="space-y-6 pb-10 admin-print-sheet">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl text-ivory tracking-wide">{t("admin.reports.title")}</h1>
        <p className="text-xs sm:text-sm text-muted font-light max-w-3xl">{t("admin.reports.subtitle")}</p>
      </header>

      {!visible ? (
        <DataGap status="not_configured" note={t("admin.reports.noSections")} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 print:hidden" role="tablist" aria-label={t("admin.reports.title")}>
            {allowedSections.map((allowed) => (
              <button
                key={allowed}
                type="button"
                role="tab"
                aria-selected={section === allowed}
                onClick={() => setSection(allowed)}
                className={`px-3 py-1.5 rounded border text-[10px] font-mono uppercase tracking-[1.5px] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                  section === allowed ? "border-gold/60 bg-gold/10 text-gold" : "border-gold/20 text-muted hover:text-ivory hover:border-gold/45"
                }`}
              >
                {t(SECTION_LABEL_KEYS[allowed])}
              </button>
            ))}
          </div>

          <FilterBar
            filters={filters}
            onChange={setFilters}
            windowDays={0}
            onWindowChange={() => undefined}
            countries={countries}
          />

          <Panel
            id="report"
            title={t(SECTION_LABEL_KEYS[payload?.section || section] || "admin.reports.title")}
            subtitle={t(SECTION_NOTE_KEYS[payload?.section || section] || "admin.reports.subtitle")}
            status={payload?.data_status}
            actions={
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={!payload?.rows?.length}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-gold/25 text-[10px] font-mono uppercase tracking-[1.5px] text-muted hover:text-ivory hover:border-gold/55 disabled:opacity-40 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                >
                  <Download className="w-3.5 h-3.5 text-gold" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={exportXlsx}
                  disabled={!payload?.rows?.length}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-gold/25 text-[10px] font-mono uppercase tracking-[1.5px] text-muted hover:text-ivory hover:border-gold/55 disabled:opacity-40 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-gold" />
                  XLSX
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-gold/25 text-[10px] font-mono uppercase tracking-[1.5px] text-muted hover:text-ivory hover:border-gold/55 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                >
                  <Printer className="w-3.5 h-3.5 text-gold" />
                  {t("admin.reports.print")}
                </button>
              </div>
            }
          >
            {loading ? <LoadingPanel label={t("admin.reports.loading")} /> : null}
            {failed ? <ErrorPanel message={t("admin.reports.loadFailed")} onRetry={load} /> : null}
            {notice ? (
              <p className="text-[11px] text-gold font-light" role="status">
                {notice}
              </p>
            ) : null}
            {payload && !loading ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono uppercase tracking-[1.4px] text-muted">
                  <span>
                    {t("admin.reports.rows")}: <span className="text-ivory num-lining">{fmt.number(payload.rows.length)}</span>
                  </span>
                  <span>
                    {t("admin.reports.currency")}:{" "}
                    <span className="text-ivory">{payload.currency === "base" ? t("admin.reports.baseCurrency") : payload.currency}</span>
                  </span>
                  <span>
                    {t("admin.reports.scope")}: <span className="text-ivory">{payload.scope}</span>
                  </span>
                  <MetricStatus status={payload.data_status} />
                </div>
                {payload.data_status === "insufficient_data" ? (
                  <DataGap status="insufficient_data" note={t(SECTION_NOTE_KEYS[payload.section] || "admin.reports.subtitle")} />
                ) : null}
                <AnalyticsBreakdownTable
                  sectionId={`report-${payload.section}`}
                  title={t(SECTION_LABEL_KEYS[payload.section] || "admin.reports.title")}
                  rows={payload.rows}
                  columns={columns}
                  rowKey={(_row, index) => `${payload.section}-${index}`}
                  emptyMessage={t("admin.reports.empty")}
                />
              </div>
            ) : null}
          </Panel>
        </>
      )}
    </div>
  );
}

export default ReportsPage;
