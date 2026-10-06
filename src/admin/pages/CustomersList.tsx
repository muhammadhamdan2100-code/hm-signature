import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Coins,
  Eye,
  RefreshCw,
  Repeat,
  ShoppingBag,
  Users,
} from "lucide-react";
import { DataTable, type Column } from "../components/DataTable";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import {
  fetchAdminCustomerAggregatesFromDB,
  type CustomerAggregateRow,
} from "../../services/adminOps";
import { formatPKR } from "../../utils/currency";
import { useI18n } from "../../i18n/I18nProvider";

/* ------------------------------------------------------------------ *
 * Every figure below is read straight from the get_admin_customers RPC
 * (fetchAdminCustomerAggregatesFromDB): order counts and lifetime spend
 * exclude cancelled orders, segments are computed server-side.
 * ------------------------------------------------------------------ */

type SortKey = "name" | "ordersCount" | "totalSpent" | "lastOrderDate" | "segment" | "joinedDate";

/* Column labels are dictionary keys; they are resolved with t() where the
   select is rendered, because t() is only available inside a component. */
const SORT_LABEL_KEYS: Record<SortKey, string> = {
  name: "admin.customers.sortClientName",
  ordersCount: "admin.customers.sortOrders",
  totalSpent: "admin.customers.sortTotalSpent",
  lastOrderDate: "admin.customers.sortLastOrder",
  segment: "admin.customers.sortSegment",
  joinedDate: "admin.customers.sortJoined",
};

/* profiles.status is stored lower-case; the admin vocabulary used across this
   dashboard (see fetchAdminCustomersFromDB) renders suspended as "Blocked". */
const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Blocked",
};

const toStatusLabel = (status: string) => {
  const key = (status || "").toLowerCase();
  if (ACCOUNT_STATUS_LABELS[key]) return ACCOUNT_STATUS_LABELS[key];
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
};

const toDateOnly = (value: string | null | undefined) =>
  value ? String(value).replace("T", " ").slice(0, 10) : "";

const controlClass =
"min-w-0 shrink-0 bg-navy border border-gold/20 rounded px-2.5 py-1.5 text-xs text-ivory " +
"w-[calc(50%-4px)] sm:w-auto focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold transition-colors";

const iconButtonClass =
"shrink-0 p-1.5 rounded border border-gold/20 text-gold hover:text-ivory hover:border-gold/60 " +
"disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold";

const TableSkeleton: React.FC = () => (
  <div
    className="bg-navy2/90 rounded-lg border border-gold/20 overflow-hidden shadow-xl"
    aria-hidden="true"
  >
    <div className="p-4 border-b border-gold/15 bg-navy/40">
      <div className="h-8 w-full max-w-sm bg-navy/70 rounded animate-pulse" />
    </div>
    <div className="divide-y divide-gold/10">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="px-4 py-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-navy/70 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 bg-navy/70 rounded animate-pulse" />
            <div className="h-2 w-1/4 bg-navy/60 rounded animate-pulse" />
          </div>
          <div className="hidden sm:block h-3 w-16 bg-navy/60 rounded animate-pulse" />
          <div className="hidden sm:block h-3 w-20 bg-navy/60 rounded animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

export const CustomersList: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [rows, setRows] = useState<CustomerAggregateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [segmentFilter, setSegmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("totalSpent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminCustomerAggregatesFromDB();
      setRows(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "The client directory could not be loaded.";
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* Stat row — only values the database actually returned. */
  const stats = useMemo(() => {
    const totalClients = rows.length;
    const withOrders = rows.filter((r) => r.ordersCount >= 1).length;
    const repeatClients = rows.filter((r) => r.ordersCount >= 2).length;
    const capturedValue = rows.reduce(
      (acc, r) => acc + (Number.isFinite(r.totalSpent) ? r.totalSpent : 0),
      0
    );
    return { totalClients, withOrders, repeatClients, capturedValue };
  }, [rows]);

  const visibleRows = useMemo(() => {
    const filtered = rows.filter((r) => {
      const segmentOk = segmentFilter === "all" || r.segment === segmentFilter;
      const statusOk = statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter;
      return segmentOk && statusOk;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "lastOrderDate") {
        // Clients without orders always sit at the bottom, whichever way we sort.
        if (!a.lastOrderDate && !b.lastOrderDate) return 0;
        if (!a.lastOrderDate) return 1;
        if (!b.lastOrderDate) return -1;
      }

      switch (sortKey) {
        case "ordersCount":
          return dir * (a.ordersCount - b.ordersCount);
        case "totalSpent":
          return dir * (a.totalSpent - b.totalSpent);
        case "lastOrderDate":
          return dir * String(a.lastOrderDate).localeCompare(String(b.lastOrderDate));
        case "segment":
          return dir * String(a.segment || "").localeCompare(String(b.segment || ""));
        case "joinedDate":
          return dir * String(a.joinedDate || "").localeCompare(String(b.joinedDate || ""));
        default:
          return dir * String(a.name || "").localeCompare(String(b.name || ""), undefined, {
            sensitivity: "base",
          });
      }
    });
  }, [rows, segmentFilter, statusFilter, sortKey, sortDir]);

  const columns: Column<CustomerAggregateRow>[] = [
    {
      header: t("admin.customers.customer"),
      accessor: (c) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold flex items-center justify-center text-gold font-serif font-bold text-sm shrink-0">
            {(c.name || "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-sm text-ivory flex items-center gap-1.5">
              <span className="truncate max-w-[160px]">{c.name}</span>
              {c.segment === "VIP" && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-gold">{t("admin.status.vip")}</span>
              )}
            </h3>
            <span className="block text-[10px] font-mono text-muted truncate max-w-[180px]">
              {c.email || t("admin.customerDetail.noEmailOnFile")}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: t("admin.customers.phone"),
      accessor: (c) => (
        <span className="text-xs font-mono text-ivory/90 whitespace-nowrap">
          {c.phone || <span className="text-muted">—</span>}
        </span>
      ),
    },
    {
      header: t("admin.nav.orders"),
      accessor: (c) => (
        <span className="text-xs font-mono font-semibold text-ivory num-lining">
          {c.ordersCount}
        </span>
      ),
    },
    {
      header: t("admin.customers.totalSpent"),
      accessor: (c) => (
        <span className="text-xs font-mono font-bold text-gold num-lining whitespace-nowrap">
          {formatPKR(c.totalSpent)}
        </span>
      ),
    },
    {
      header: t("admin.customers.lastOrder"),
      accessor: (c) =>
        c.lastOrderDate ? (
          <span className="text-xs font-mono text-ivory/80 whitespace-nowrap num-lining">
            {toDateOnly(c.lastOrderDate)}
          </span>
        ) : (
          <span className="text-xs text-muted">{t("admin.customers.noOrdersYet")}</span>
        ),
    },
    {
      header: t("admin.customers.segment"),
      accessor: (c) => <StatusBadge status={c.segment} />,
    },
    {
      header: t("admin.customers.accountStatus"),
      accessor: (c) => <StatusBadge status={toStatusLabel(c.status)} />,
    },
    {
      header: t("admin.orders.action"),
      accessor: (c) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => navigate(`/admin/customers/${c.id}`)}
            aria-label={t("admin.customers.openProfileFor", { name: c.name })}
            className="px-3 py-1.5 rounded bg-navy border border-gold/30 hover:border-gold text-gold hover:text-ivory text-xs font-sans transition-colors flex items-center gap-1 focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t("admin.shared.profile")}</span>
          </button>
        </div>
      ),
      className: "text-end",
    },
  ];

  const toolbar = (
    <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-[270px] lg:w-[290px] xl:w-auto">
      <select
        aria-label={t("admin.customers.filterClientsBySegment")}
        value={segmentFilter}
        onChange={(e) => setSegmentFilter(e.target.value)}
        className={controlClass}
      >
        <option value="all">{t("admin.customers.allSegments")}</option>
        <option value="Unconverted">{t("admin.status.unconverted")}</option>
        <option value="New">{t("admin.status.new")}</option>
        <option value="Returning">{t("admin.status.returning")}</option>
        <option value="VIP">{t("admin.status.vip")}</option>
      </select>

      <select
        aria-label={t("admin.customers.filterClientsByAccountStatus")}
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className={controlClass}
      >
        <option value="all">{t("admin.customers.allStatuses")}</option>
        <option value="active">{t("admin.status.active")}</option>
        <option value="inactive">{t("admin.status.inactive")}</option>
        <option value="suspended">{t("admin.status.suspended")}</option>
      </select>

      <select
        aria-label={t("admin.customers.sortClients")}
        value={sortKey}
        onChange={(e) => setSortKey(e.target.value as SortKey)}
        className={controlClass}
      >
        {(Object.keys(SORT_LABEL_KEYS) as SortKey[]).map((key) => (
          <option key={key} value={key}>
            {t(SORT_LABEL_KEYS[key])}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        aria-label={t("admin.customers.changeSortDirection", {
          direction: sortDir === "asc" ? t("admin.customers.ascending") : t("admin.customers.descending"),
        })}
        title={sortDir === "asc" ? t("admin.customers.ascending") : t("admin.customers.descending")}
        className={iconButtonClass}
      >
        {sortDir === "asc" ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
      </button>

      <button
        type="button"
        onClick={() => void load()}
        disabled={loading}
        aria-label={t("admin.customers.reloadClientDirectory")}
        title={t("admin.customers.reload")}
        className={iconButtonClass}
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );

  const filtersActive = segmentFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-6 animate-fade-in min-w-0">
      {/* Header */}
      <div className="border-b border-gold/20 pb-4">
        <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
          {t("admin.customers.eyebrow")}
        </span>
        <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
          {t("admin.customers.pageTitle")}
        </h1>
        <p className="text-xs text-muted font-sans font-light mt-0.5 max-w-2xl">
          {t("admin.customers.intro")}
        </p>
      </div>

      {/* Stat row */}
      <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-gold/80">
        {t("admin.customers.directoryOverview")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-[118px] rounded-lg bg-navy2/80 border border-gold/20 animate-pulse"
              aria-hidden="true"
            />
          ))
        ) : (
          <>
            <StatCard
              title={t("admin.customers.totalClients")}
              value={stats.totalClients}
              subtitle={t("admin.customers.registeredCustomerAccounts")}
              icon={Users}
              accent
            />
            <StatCard
              title={t("admin.customers.clientsWithOrders")}
              value={stats.withOrders}
              subtitle={t("admin.customers.atLeastOneNonCancelled")}
              icon={ShoppingBag}
            />
            <StatCard
              title={t("admin.customers.repeatClients")}
              value={stats.repeatClients}
              subtitle={t("admin.customers.twoOrMoreOrders")}
              icon={Repeat}
            />
            <StatCard
              title={t("admin.customers.totalCapturedValue")}
              value={formatPKR(stats.capturedValue)}
              subtitle={t("admin.customers.sumOfLifetimeSpendExcludes")}
              icon={Coins}
            />
          </>
        )}
      </div>

      {/* Error state */}
      {error && !loading && (
        <div
          role="alert"
          className="bg-navy2/90 border border-rose-500/30 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded bg-rose-950/50 border border-rose-500/30 text-rose-300 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-base font-bold text-ivory">
                {t("admin.customers.clientDirectory")}
              </h2>
              <p className="text-xs text-muted font-light mt-0.5 break-words">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="px-4 py-2 rounded bg-gold hover:bg-goldLight text-navy text-xs font-sans font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t("admin.customers.retry")}
          </button>
        </div>
      )}

      {/* Directory */}
      {loading ? (
        <div role="status" aria-live="polite" className="space-y-2">
          <span className="sr-only text-xs text-muted">{t("admin.customers.loadingClientDirectory")}</span>
          <TableSkeleton />
        </div>
      ) : (
        !error && (
          <>
            <h2 className="sr-only">{t("admin.customers.clientDirectory")}</h2>
            <DataTable
              columns={columns}
              data={visibleRows}
              keyExtractor={(r) => r.id}
              pageSize={10}
              searchPlaceholder={t("admin.customers.searchNameEmailOrPhone")}
              emptyMessage={
                rows.length === 0
                  ? t("admin.customers.noClientsRegisteredYet")
                  : t("admin.customers.noClientsMatchFilters")
              }
              emptySubtitle={
                rows.length === 0
                  ? t("admin.customers.clientsEmptyBody")
                  : t("admin.customers.clientsFilteredEmptyBody")
              }
              actions={toolbar}
            />
            <p className="text-[10px] text-muted font-light">
              {filtersActive
                ? t("admin.customers.shownSummaryFiltered", {
                    shown: visibleRows.length,
                    total: rows.length,
                  })
                : t("admin.customers.shownSummary", {
                    shown: visibleRows.length,
                    total: rows.length,
                  })}
            </p>
          </>
        )
      )}
    </div>
  );
};
