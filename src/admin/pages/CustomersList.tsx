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

/* ------------------------------------------------------------------ *
 * Every figure below is read straight from the get_admin_customers RPC
 * (fetchAdminCustomerAggregatesFromDB): order counts and lifetime spend
 * exclude cancelled orders, segments are computed server-side.
 * ------------------------------------------------------------------ */

type SortKey = "name" | "ordersCount" | "totalSpent" | "lastOrderDate" | "segment" | "joinedDate";

const SORT_LABELS: Record<SortKey, string> = {
  name: "Sort: Client name",
  ordersCount: "Sort: Orders",
  totalSpent: "Sort: Total spent",
  lastOrderDate: "Sort: Last order",
  segment: "Sort: Segment",
  joinedDate: "Sort: Joined",
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
      header: "Customer",
      accessor: (c) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold flex items-center justify-center text-gold font-serif font-bold text-sm shrink-0">
            {(c.name || "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-sm text-ivory flex items-center gap-1.5">
              <span className="truncate max-w-[160px]">{c.name}</span>
              {c.segment === "VIP" && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-gold">VIP</span>
              )}
            </h3>
            <span className="block text-[10px] font-mono text-muted truncate max-w-[180px]">
              {c.email || "No email on file"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Phone",
      accessor: (c) => (
        <span className="text-xs font-mono text-ivory/90 whitespace-nowrap">
          {c.phone || <span className="text-muted">—</span>}
        </span>
      ),
    },
    {
      header: "Orders",
      accessor: (c) => (
        <span className="text-xs font-mono font-semibold text-ivory num-lining">
          {c.ordersCount}
        </span>
      ),
    },
    {
      header: "Total Spent",
      accessor: (c) => (
        <span className="text-xs font-mono font-bold text-gold num-lining whitespace-nowrap">
          {formatPKR(c.totalSpent)}
        </span>
      ),
    },
    {
      header: "Last Order",
      accessor: (c) =>
        c.lastOrderDate ? (
          <span className="text-xs font-mono text-ivory/80 whitespace-nowrap num-lining">
            {toDateOnly(c.lastOrderDate)}
          </span>
        ) : (
          <span className="text-xs text-muted">No orders yet</span>
        ),
    },
    {
      header: "Segment",
      accessor: (c) => <StatusBadge status={c.segment} />,
    },
    {
      header: "Account Status",
      accessor: (c) => <StatusBadge status={toStatusLabel(c.status)} />,
    },
    {
      header: "Action",
      accessor: (c) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => navigate(`/admin/customers/${c.id}`)}
            aria-label={`Open profile for ${c.name}`}
            className="px-3 py-1.5 rounded bg-navy border border-gold/30 hover:border-gold text-gold hover:text-ivory text-xs font-sans transition-colors flex items-center gap-1 focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  const toolbar = (
    <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-[270px] lg:w-[290px] xl:w-auto">
      <select
        aria-label="Filter clients by segment"
        value={segmentFilter}
        onChange={(e) => setSegmentFilter(e.target.value)}
        className={controlClass}
      >
        <option value="all">All segments</option>
        <option value="Unconverted">Unconverted</option>
        <option value="New">New</option>
        <option value="Returning">Returning</option>
        <option value="VIP">VIP</option>
      </select>

      <select
        aria-label="Filter clients by account status"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className={controlClass}
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="suspended">Suspended</option>
      </select>

      <select
        aria-label="Sort clients"
        value={sortKey}
        onChange={(e) => setSortKey(e.target.value as SortKey)}
        className={controlClass}
      >
        {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
          <option key={key} value={key}>
            {SORT_LABELS[key]}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        aria-label={`Change sort direction (currently ${sortDir === "asc" ? "ascending" : "descending"})`}
        title={sortDir === "asc" ? "Ascending" : "Descending"}
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
        aria-label="Reload client directory"
        title="Reload"
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
          Client Relations
        </span>
        <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
          Registered Clients
        </h1>
        <p className="text-xs text-muted font-sans font-light mt-0.5 max-w-2xl">
          Order counts, lifetime spend and segments come from the customer aggregates query and
          exclude cancelled orders.
        </p>
      </div>

      {/* Stat row */}
      <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-gold/80">
        Directory overview
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
              title="Total Clients"
              value={stats.totalClients}
              subtitle="Registered customer accounts"
              icon={Users}
              accent
            />
            <StatCard
              title="Clients With Orders"
              value={stats.withOrders}
              subtitle="At least one non-cancelled order"
              icon={ShoppingBag}
            />
            <StatCard
              title="Repeat Clients"
              value={stats.repeatClients}
              subtitle="Two or more orders"
              icon={Repeat}
            />
            <StatCard
              title="Total Captured Value"
              value={formatPKR(stats.capturedValue)}
              subtitle="Sum of lifetime spend, excludes cancelled"
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
                Client directory unavailable
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
            Retry
          </button>
        </div>
      )}

      {/* Directory */}
      {loading ? (
        <div role="status" aria-live="polite" className="space-y-2">
          <span className="sr-only text-xs text-muted">Loading client directory…</span>
          <TableSkeleton />
        </div>
      ) : (
        !error && (
          <>
            <h2 className="sr-only">Client directory</h2>
            <DataTable
              columns={columns}
              data={visibleRows}
              keyExtractor={(r) => r.id}
              pageSize={10}
              searchPlaceholder="Search name, email or phone..."
              emptyMessage={
                rows.length === 0
                  ? "No clients registered yet"
                  : "No clients match these filters"
              }
              emptySubtitle={
                rows.length === 0
                  ? "Customer accounts created on the storefront appear here, together with their order activity."
                  : "Adjust the search term or clear the segment and status filters."
              }
              actions={toolbar}
            />
            <p className="text-[10px] text-muted font-light">
              {visibleRows.length} of {rows.length} clients shown
              {filtersActive ? " (filtered)" : ""}. Search is applied to the loaded client records.
              Lifetime spend and order counts exclude cancelled orders; “Last Order” reflects the most
              recent order of any status.
            </p>
          </>
        )
      )}
    </div>
  );
};
