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
import { useI18n } from "../../i18n/I18nProvider";

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
  const { t } = useI18n();
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
      header: t("admin.shared.order"),
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
      header: t("admin.reconciliation.providerMethod"),
      accessor: (r) => (
        <div>
          <span className="text-xs text-ivory block">{r.method}</span>
          <span className="text-[10px] font-mono text-muted uppercase">{r.provider}</span>
        </div>
      ),
    },
    {
      header: t("admin.reconciliation.expected"),
      accessor: (r) => (
        <span className="font-mono text-xs text-ivory">{money(r.expectedAmount, r.currency)}</span>
      ),
      sortable: true,
    },
    {
      header: t("admin.reconciliation.recorded"),
      accessor: (r) => (
        <span className={`font-mono text-xs ${r.difference === 0 ? "text-emerald-300" : "text-rose-300"}`}>
          {money(r.recordedAmount, r.currency)}
        </span>
      ),
      sortable: true,
    },
    {
      header: t("admin.reconciliation.difference"),
      accessor: (r) =>
        r.difference === 0 ? (
          <span className="text-[10px] font-mono text-muted">—</span>
        ) : (
          <span className="text-[10px] font-mono text-rose-300">{r.difference.toLocaleString()}</span>
        ),
      sortable: true,
    },
    {
      header: t("admin.reconciliation.references"),
      accessor: (r) => (
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono text-gold/90 block truncate max-w-[150px]">
            {r.providerReference || t("admin.reconciliation.noProviderId")}
          </span>
          <span className="text-[10px] font-mono text-muted block truncate max-w-[150px]">
            {r.paymentReference || t("admin.reconciliation.noStatedReference")}
          </span>
        </div>
      ),
    },
    {
      header: t("admin.reconciliation.orderPaymentStatus"),
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
      header: t("admin.status.refunded"),
      accessor: (r) => (
        <span className="font-mono text-[10px] text-muted">
          {r.refundedAmount > 0 ? money(r.refundedAmount, r.currency) : "—"}
        </span>
      ),
      sortable: true,
    },
    {
      header: t("admin.nav.reconciliation"),
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
      header: t("admin.reconciliation.paymentDate"),
      accessor: (r) => <span className="text-[10px] font-mono text-muted">{shortDate(r.paymentDate)}</span>,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            {t("admin.reconciliation.financialControl")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5 flex items-center gap-2">
            <Scale className="w-5 h-5 text-gold" />
            <span>{t("admin.reconciliation.paymentReconciliation")}</span>
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-1 max-w-2xl leading-relaxed">
            {t("admin.reconciliation.intro")}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            {t("admin.reconciliation.reload")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={t("admin.reconciliation.ordersInWindow")}
          value={rows.length.toLocaleString()}
            subtitle={loading ? t("admin.shared.loading") : t("admin.reconciliation.lastDays", { days })}
          icon={Clock}
        />
        <StatCard
          title={t("admin.reconciliation.matched")}
          value={(counts.matched ?? 0).toLocaleString()}
          subtitle={t("admin.reconciliation.recordedAmountEqualsTheOrder")}
          icon={CheckCircle2}
        />
        <StatCard
          title={t("admin.reconciliation.awaitingPayment")}
          value={(counts.pending ?? 0).toLocaleString()}
          subtitle={t("admin.reconciliation.noConfirmationRecordedYet")}
          icon={Clock}
        />
        <StatCard
          title={t("admin.reconciliation.needsAttention")}
          value={needsAttention.length.toLocaleString()}
          subtitle={t("admin.reconciliation.mismatchMissingRecordOrRefund")}
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
          {t("admin.reconciliation.allStatesCount", { count: rows.length })}
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
            {t("admin.reconciliation.emptyWindowBody")}
          </p>
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-500/40 rounded-lg p-5 space-y-2">
          <h2 className="font-serif text-base text-rose-100 font-bold">{t("admin.reconciliation.repeatedProviderTransactions")}</h2>
          {duplicates.map((d) => (
            <p key={d.providerReference} className="text-xs font-mono text-rose-200">
              {t("admin.reconciliation.duplicatePaymentNote", {
                reference: d.providerReference,
                count: d.occurrences,
                orders: d.orderNumbers,
              })}
            </p>
          ))}
        </div>
      )}

      <div className="bg-navy2/90 border border-gold/20 rounded-lg p-2 shadow-xl">
        <DataTable
          columns={columns}
          data={visible}
          keyExtractor={(r) => r.orderId}
          emptyMessage={t("admin.reconciliation.noOrdersMatchThisFilter")}
          searchPlaceholder={t("admin.reconciliation.searchOrderNumberOrReference")}
        />
      </div>
    </div>
  );
};
