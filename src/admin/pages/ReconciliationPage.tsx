import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchDuplicatePaymentEventsFromDB,
  fetchPaymentReconciliationFromDB,
  RECONCILIATION_STATES,
  type ReconciliationRow,
} from "../../services/adminOps";
import { DataTable, type Column } from "../components/DataTable";
import { StatCard } from "../components/StatCard";
import { Scale, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { formatPKR } from "../../utils/currency";

const WINDOWS = [30, 90, 365] as const;

const STATE_TONE: Record<string, string> = {
  matched: "text-emerald-300 border-emerald-500/30 bg-emerald-950/40",
  pending: "text-gold border-gold/30 bg-navy",
  failed: "text-rose-300 border-rose-500/30 bg-rose-950/40",
  amount_mismatch: "text-rose-300 border-rose-500/30 bg-rose-950/40",
  missing_payment_record: "text-amber-300 border-amber-500/30 bg-amber-950/30",
  unrefunded_cancellation: "text-amber-300 border-amber-500/30 bg-amber-950/30",
  refund_discrepancy: "text-rose-300 border-rose-500/30 bg-rose-950/40",
  review: "text-muted border-gold/20 bg-navy",
};

const money = (value: number, currency: string) =>
  currency && currency !== "PKR" ? `${currency} ${value.toLocaleString()}` : formatPKR(value);

const shortDate = (iso: string | null) => (iso ? iso.replace("T", " ").slice(0, 16) : "—");

export const ReconciliationPage: React.FC = () => {
  const [days, setDays] = useState<number>(90);
  const [rows, setRows] = useState<ReconciliationRow[]>([]);
  const [duplicates, setDuplicates] = useState<Awaited<ReturnType<typeof fetchDuplicatePaymentEventsFromDB>>>([]);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [recon, dupes] = await Promise.all([
      fetchPaymentReconciliationFromDB(days),
      fetchDuplicatePaymentEventsFromDB(days),
    ]);
    setRows(recon);
    setDuplicates(dupes);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of rows) map[row.state] = (map[row.state] ?? 0) + 1;
    return map;
  }, [rows]);

  const visible = useMemo(
    () => (stateFilter === "all" ? rows : rows.filter((r) => r.state === stateFilter)),
    [rows, stateFilter]
  );

  const needsAttention = rows.filter((r) =>
    ["amount_mismatch", "missing_payment_record", "refund_discrepancy", "unrefunded_cancellation", "review"].includes(
      r.state
    )
  );

  const columns: Column<ReconciliationRow>[] = [
    {
      header: "Order",
      accessor: (r) => (
        <div>
          <Link to={`/admin/orders/${r.orderId}`} className="font-mono text-xs font-bold text-gold hover:text-goldLight block">
            {r.orderNumber}
          </Link>
          <span className="text-[10px] font-mono text-muted">{shortDate(r.orderCreatedAt)}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Provider / Method",
      accessor: (r) => (
        <div>
          <span className="text-xs text-ivory block">{r.method}</span>
          <span className="text-[10px] font-mono text-muted uppercase">{r.provider}</span>
        </div>
      ),
    },
    {
      header: "Expected",
      accessor: (r) => (
        <span className="font-mono text-xs text-ivory">{money(r.expectedAmount, r.currency)}</span>
      ),
      sortable: true,
    },
    {
      header: "Recorded",
      accessor: (r) => (
        <span className={`font-mono text-xs ${r.difference === 0 ? "text-emerald-300" : "text-rose-300"}`}>
          {money(r.recordedAmount, r.currency)}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Difference",
      accessor: (r) =>
        r.difference === 0 ? (
          <span className="text-[10px] font-mono text-muted">—</span>
        ) : (
          <span className="text-[10px] font-mono text-rose-300">{r.difference.toLocaleString()}</span>
        ),
      sortable: true,
    },
    {
      header: "References",
      accessor: (r) => (
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono text-gold/90 block truncate max-w-[150px]">
            {r.providerReference || "no provider id"}
          </span>
          <span className="text-[10px] font-mono text-muted block truncate max-w-[150px]">
            {r.paymentReference || "no stated reference"}
          </span>
        </div>
      ),
    },
    {
      header: "Order / Payment status",
      accessor: (r) => (
        <div>
          <span className="text-xs text-ivory block">{r.orderStatus}</span>
          <span className="text-[10px] font-mono text-muted">
            {r.paymentStatus} · {r.paymentState}
          </span>
        </div>
      ),
    },
    {
      header: "Refunded",
      accessor: (r) => (
        <span className="font-mono text-[10px] text-muted">
          {r.refundedAmount > 0 ? money(r.refundedAmount, r.currency) : "—"}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Reconciliation",
      accessor: (r) => (
        <span
          className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${STATE_TONE[r.state] ?? STATE_TONE.review}`}
        >
          {r.state.replace(/_/g, " ")}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Payment date",
      accessor: (r) => <span className="text-[10px] font-mono text-muted">{shortDate(r.paymentDate)}</span>,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            FINANCIAL CONTROL
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5 flex items-center space-x-2">
            <Scale className="w-5 h-5 text-gold" />
            <span>Payment Reconciliation</span>
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-1 max-w-2xl leading-relaxed">
            Compares each order's recorded total with its payment record, provider transaction and processed
            refunds. This view only reports: nothing here marks an order paid, and a mismatch is never
            corrected automatically.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setDays(w)}
              className={`px-3 py-1.5 rounded text-[11px] font-mono uppercase tracking-wider border transition-colors ${
                days === w
                  ? "bg-gold text-navy border-gold font-bold"
                  : "text-muted border-gold/20 hover:text-ivory hover:border-gold/40"
              }`}
            >
              {w}d
            </button>
          ))}
          <button
            onClick={load}
            className="px-3 py-1.5 rounded text-[11px] font-sans uppercase tracking-wider text-muted border border-gold/20 hover:text-gold hover:border-gold/40"
          >
            Reload
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Orders in window"
          value={rows.length.toLocaleString()}
          subtitle={loading ? "Loading…" : `Last ${days} days`}
          icon={Clock}
        />
        <StatCard
          title="Matched"
          value={(counts.matched ?? 0).toLocaleString()}
          subtitle="Recorded amount equals the order total"
          icon={CheckCircle2}
        />
        <StatCard
          title="Awaiting payment"
          value={(counts.pending ?? 0).toLocaleString()}
          subtitle="No confirmation recorded yet"
          icon={Clock}
        />
        <StatCard
          title="Needs attention"
          value={needsAttention.length.toLocaleString()}
          subtitle="Mismatch, missing record or refund question"
          icon={AlertTriangle}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStateFilter("all")}
          className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded border ${
            stateFilter === "all" ? "text-navy bg-gold border-gold" : "text-muted border-gold/20 hover:text-ivory"
          }`}
        >
          all ({rows.length})
        </button>
        {RECONCILIATION_STATES.map((state) => (
          <button
            key={state}
            onClick={() => setStateFilter(state)}
            className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded border ${
              stateFilter === state ? "text-navy bg-gold border-gold" : STATE_TONE[state] ?? "text-muted border-gold/20"
            }`}
          >
            {state.replace(/_/g, " ")} ({counts[state] ?? 0})
          </button>
        ))}
      </div>

      {!loading && rows.length === 0 && (
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6">
          <p className="text-xs text-muted font-sans leading-relaxed">
            No orders were returned for this window. That is either a genuinely empty period or the
            staff-only reconciliation query was refused for the current session — reloading with a staff
            sign-in distinguishes the two.
          </p>
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-500/40 rounded-lg p-5 space-y-2">
          <h2 className="font-serif text-base text-rose-100 font-bold">Repeated provider transactions</h2>
          {duplicates.map((d) => (
            <p key={d.providerReference} className="text-xs font-mono text-rose-200">
              {d.providerReference} recorded {d.occurrences} times for {d.orderNumbers}
            </p>
          ))}
        </div>
      )}

      <div className="bg-navy2/90 border border-gold/20 rounded-lg p-2 shadow-xl">
        <DataTable
          columns={columns}
          data={visible}
          keyExtractor={(r) => r.orderId}
          emptyMessage="No orders match this filter."
          searchPlaceholder="Search order number or reference…"
        />
      </div>
    </div>
  );
};
