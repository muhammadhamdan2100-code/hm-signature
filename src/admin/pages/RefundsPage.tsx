import React from "react";
import { useAdminData, type PaymentRecord } from "../context/AdminDataContext";
import { DataTable, type Column } from "../components/DataTable";
import { StatCard } from "../components/StatCard";
import { ArrowLeftRight, Banknote, RotateCcw, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPKR } from "../../utils/currency";
import { useI18n } from "../../i18n/I18nProvider";

export const RefundsPage: React.FC = () => {
  const { t } = useI18n();
  const { refunds, payments } = useAdminData();

  const paymentById = (id: string): PaymentRecord | undefined =>
    payments.find((p) => p.id === id);

  const totalRefunded = refunds
    .filter((r) => r.status === "processed")
    .reduce((acc, r) => acc + r.amount, 0);

  const pendingRefunds = refunds.filter((r) => r.status === "pending").length;

  const columns: Column<(typeof refunds)[0]>[] = [
    {
      header: t("admin.refunds.orderDate"),
      accessor: (r) => (
        <div>
          <span className="font-mono font-bold text-gold text-xs block">{r.orderNumber}</span>
          <span className="text-[10px] font-mono text-muted">{r.date}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.refunds.client"),
      accessor: (r) => (
        <span className="font-serif font-bold text-xs text-ivory">{r.customerName}</span>
      ),
      sortable: true,
    },
    {
      header: t("admin.refunds.originalPayment"),
      accessor: (r) => {
        const p = paymentById(r.paymentId);
        return (
          <div>
            <span className="font-mono text-[11px] text-ivory block">
              {formatPKR(p?.amount ?? 0)}
            </span>
            <span className="text-[10px] text-muted">{p?.method || "—"}</span>
          </div>
        );
      },
    },
    {
      header: t("admin.refunds.refundAmount"),
      accessor: (r) => (
        <span className="font-mono font-bold text-rose-300 text-xs">
          − {formatPKR(r.amount)}
          {r.currency && r.currency !== "PKR" ? ` ${r.currency}` : ""}
        </span>
      ),
      sortable: true,
    },
    {
      header: t("admin.refunds.refundStatus"),
      accessor: (r) => (
        <span
          className={`text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded border ${
            r.status === "processed"
              ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
              : r.status === "pending"
              ? "bg-amber-950/60 text-amber-300 border-amber-800/50"
              : "bg-rose-950/60 text-rose-300 border-rose-800/50"
          }`}
        >
          {r.status}
        </span>
      ),
      sortable: true,
    },
    {
      header: t("admin.refunds.referenceReason"),
      accessor: (r) => (
        <div>
          <span className="font-mono text-[10px] text-gold/90 block font-semibold">
            {r.reference || "N/A"}
          </span>
          {r.reason && (
            <span className="text-[10px] text-muted italic block truncate max-w-[180px]">{r.reason}</span>
          )}
        </div>
      ),
    },
    {
      header: t("admin.refunds.notes"),
      accessor: (r) => (
        <span className="text-[10px] text-muted font-light max-w-[200px] truncate block">
          {r.notes || "—"}
        </span>
      ),
    },
    {
      header: t("admin.shared.order"),
      accessor: (r) => (
        <Link
          to={`/admin/orders/${r.orderId}`}
          className="text-[10px] uppercase font-bold text-gold hover:text-goldLight"
        >
          {t("admin.refunds.viewArrow")}
        </Link>
      ),
      className: "text-end",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            {t("admin.refunds.financialAuditVerification")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.refunds.refundLedger")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            {t("admin.refunds.manualRefundRecordsNote")}
          </p>
        </div>
        <Link
          to="/admin/payments"
          className="px-4 py-2 rounded text-xs font-sans uppercase tracking-wider text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeftRight className="w-4 h-4 text-gold" />
          <span>{t("admin.refunds.backToPayments")}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t("admin.refunds.totalRefunded")}
          value={formatPKR(totalRefunded)}
          subtitle={t("admin.refunds.processedRefunds")}
          icon={Wallet}
          accent={true}
        />
        <StatCard
          title={t("admin.refunds.pendingRefunds")}
          value={pendingRefunds}
          subtitle={t("admin.refunds.awaitingBankSettlement")}
          icon={Banknote}
        />
        <StatCard
          title={t("admin.refunds.refundRecords")}
          value={refunds.length}
          subtitle={t("admin.refunds.allRefundEntries")}
          icon={RotateCcw}
        />
      </div>

      {refunds.length === 0 ? (
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-10 text-center">
          <RotateCcw className="w-8 h-8 text-gold/40 mx-auto mb-3" />
          <p className="text-sm font-serif text-ivory">{t("admin.refunds.noRefundsRecordedYet")}</p>
          <p className="text-xs text-muted mt-1">
            {t("admin.refunds.refundsAppearHereNote")}
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={refunds} keyExtractor={(r) => r.id} searchPlaceholder={t("admin.refunds.searchRefundsByOrderClient")} />
      )}
    </div>
  );
};
