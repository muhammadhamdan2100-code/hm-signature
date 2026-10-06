import React, { useState } from "react";
import {
  useAdminData,
  type PaymentMethod,
  type PaymentRecord,
  type PaymentStatus,
} from "../context/AdminDataContext";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { StatCard } from "../components/StatCard";
import { Modal } from "../components/Modal";
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Truck,
  Clock,
  Eye,
  RotateCcw,
  ArrowLeftRight,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nProvider";

// "Verification Pending" is a real status written by submit_payment_proof once a
// customer attaches evidence, so it needs the same staff actions as "Pending".
const AWAITING_STAFF_STATUSES: PaymentStatus[] = ["Pending", "Verification Pending"];
const isAwaitingStaffAction = (status: PaymentStatus) => AWAITING_STAFF_STATUSES.includes(status);

export const PaymentsPage: React.FC = () => {
  const { t } = useI18n();
  const { payments, refunds, verifyPayment, rejectPayment, markCodCollected, createRefund } = useAdminData();
  const navigate = useNavigate();

  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Refund modal state
  const [refundTarget, setRefundTarget] = useState<PaymentRecord | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReference, setRefundReference] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [refundStatus, setRefundStatus] = useState<"processed" | "pending">("processed");
  const [refundError, setRefundError] = useState("");
  const [refundBusy, setRefundBusy] = useState(false);

  const refundedSoFar = (paymentId: string) =>
    refunds
      .filter((r) => r.paymentId === paymentId && (r.status === "processed" || r.status === "pending"))
      .reduce((acc, r) => acc + r.amount, 0);

  const remainingRefundable = (p: PaymentRecord) => Math.max(0, p.amount - refundedSoFar(p.id));

  const openRefundModal = (p: PaymentRecord) => {
    setRefundTarget(p);
    setRefundAmount(remainingRefundable(p));
    setRefundReference("");
    setRefundReason("");
    setRefundNotes("");
    setRefundStatus("processed");
    setRefundError("");
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      setRefundError(t("admin.payments.refundAmountAboveZero"));
      return;
    }
    if (refundAmount > remainingRefundable(refundTarget)) {
      setRefundError(t("admin.payments.refundExceedsRemaining", { amount: remainingRefundable(refundTarget).toLocaleString() }));
      return;
    }
    setRefundBusy(true);
    setRefundError("");
    const res = await createRefund({
      paymentId: refundTarget.id,
      amount: refundAmount,
      currency: "PKR",
      reference: refundReference || undefined,
      reason: refundReason || undefined,
      notes: refundNotes || undefined,
      status: refundStatus,
    });
    setRefundBusy(false);
    if (!res.success) {
      setRefundError(res.error || t("admin.adminDataContext.refundCouldNotBeRecorded"));
      return;
    }
    setRefundTarget(null);
  };

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    if (methodFilter !== "all" && p.method !== methodFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  // Calculations
  const totalVerifiedAmount = payments
    .filter((p) => p.status === "Verified" || p.status === "Paid")
    .reduce((acc, p) => acc + p.amount, 0);

  // Every digital payment that still needs a staff decision, counted explicitly
  // by status so "Verification Pending" rows are never hidden from the totals.
  const digitalAwaitingVerificationCount = payments.filter(
    (p) => p.method !== "Cash on Delivery" && p.status === "Verification Pending"
  ).length;

  const pendingVerificationCount = payments.filter(
    (p) => p.method !== "Cash on Delivery" && isAwaitingStaffAction(p.status)
  ).length;

  const codPendingCount = payments.filter(
    (p) => p.method === "Cash on Delivery" && isAwaitingStaffAction(p.status)
  ).length;

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case "Cash on Delivery":
        return <Truck className="w-3.5 h-3.5 text-amber-400" />;
      case "JazzCash":
        return <Smartphone className="w-3.5 h-3.5 text-rose-400" />;
      case "Raast":
        return <Banknote className="w-3.5 h-3.5 text-emerald-400" />;
      case "Bank Transfer":
        return <Building2 className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 text-gold" />;
    }
  };

  const columns: Column<(typeof payments)[0]>[] = [
    {
      header: t("admin.payments.orderAndDate"),
      accessor: (p) => (
        <div>
          <span className="font-mono font-bold text-gold text-xs block">{p.orderNumber}</span>
          <span className="text-[10px] font-mono text-muted">{p.date}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.refunds.client"),
      accessor: (p) => (
        <div>
          <span className="font-serif font-bold text-xs text-ivory block">{p.customerName}</span>
          <span className="text-[10px] text-muted truncate max-w-[140px] block">{p.customerEmail}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.payments.amount"),
      accessor: (p) => (
        <span className="font-mono font-bold text-gold text-xs">
          Rs. {p.amount.toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      header: t("admin.payments.paymentMethodColumn"),
      accessor: (p) => (
        <div className="flex items-center gap-1.5">
          {getMethodIcon(p.method)}
          <span className="text-xs text-ivory font-medium">{p.method}</span>
        </div>
      ),
    },
    {
      header: t("admin.payments.referenceNote"),
      accessor: (p) => (
        <div>
          <span className="font-mono text-[10px] text-gold/90 block font-semibold">
            {p.referenceId || "N/A"}
          </span>
          {p.proofNote && (
            <span className="text-[10px] text-muted italic block truncate max-w-[160px]">
              {p.proofNote}
            </span>
          )}
        </div>
      ),
    },
    {
      header: t("admin.shared.status"),
      accessor: (p) => <StatusBadge status={p.status} />,
      sortable: true,
    },
    {
      header: t("admin.payments.refunds"),
      accessor: (p) => {
        const done = refunds.filter((r) => r.paymentId === p.id);
        if (done.length === 0) return <span className="text-[10px] text-muted font-mono">—</span>;
        const total = refundedSoFar(p.id);
        const pendingOnly = done.every((r) => r.status === "pending");
        return (
          <div className="space-y-0.5">
            <span className="font-mono text-[11px] text-gold block">
              Rs. {total.toLocaleString()} / {p.amount.toLocaleString()}
            </span>
            <span className={`text-[9px] font-mono uppercase tracking-wider ${pendingOnly ? "text-amber-300" : "text-rose-300"}`}>
              {pendingOnly
                ? t("admin.payments.refundPending")
                : total >= p.amount
                  ? t("admin.payments.fullyRefunded")
                  : t("admin.payments.partialRefund")}
            </span>
          </div>
        );
      },
    },
    {
      header: t("admin.products.actions"),
      accessor: (p) => (
        <div className="flex items-center gap-2 justify-end">
          {isAwaitingStaffAction(p.status) && p.method === "Cash on Delivery" && (
            <button
              onClick={() => markCodCollected(p.id)}
              className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/40 rounded text-[10px] uppercase font-bold transition-colors"
            >
              {t("admin.payments.collectCash")}
            </button>
          )}

          {isAwaitingStaffAction(p.status) && p.method !== "Cash on Delivery" && (
            <>
              <button
                onClick={() => verifyPayment(p.id)}
                className="px-2 py-1 bg-gold hover:bg-goldLight text-navy font-bold rounded text-[10px] uppercase transition-colors"
              >
                {t("admin.payments.verify")}
              </button>
              <button
                onClick={() => rejectPayment(p.id)}
                className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 rounded text-[10px] uppercase font-bold transition-colors"
              >
                {t("admin.payments.reject")}
              </button>
            </>
          )}

          {(p.status === "Paid" || p.status === "Verified") && remainingRefundable(p) > 0 && (
            <button
              onClick={() => openRefundModal(p)}
              className="px-2 py-1 bg-navy hover:bg-navy2 text-gold border border-gold/40 hover:border-gold rounded text-[10px] uppercase font-bold transition-colors flex items-center gap-1"
              title={t("admin.payments.issueRefundForThisPayment")}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t("admin.payments.refund")}</span>
            </button>
          )}

          <button
            onClick={() => navigate(`/admin/orders/${p.orderId}`)}
            className="p-1 text-muted hover:text-gold transition-colors"
            title={t("admin.payments.viewOrder")}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
      className: "text-end",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            {t("admin.refunds.financialAuditVerification")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.payments.title")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            {t("admin.payments.introBody")}
          </p>
        </div>
        <Link
          to="/admin/payments/refunds"
          className="px-4 py-2 rounded text-xs font-sans uppercase tracking-wider text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeftRight className="w-4 h-4 text-gold" />
          <span>{t("admin.refunds.refundLedger")}</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("admin.payments.totalVerifiedSettlement")}
          value={`Rs. ${totalVerifiedAmount.toLocaleString()}`}
          subtitle={t("admin.payments.settledVerifiedPayments")}
          icon={Building2}
          accent={true}
        />
        <StatCard
          title={t("admin.payments.digitalPendingVerification")}
          value={pendingVerificationCount}
          subtitle={t("admin.payments.digitalPendingSubtitle", {
            pendingProof: digitalAwaitingVerificationCount,
            awaitingProof: pendingVerificationCount - digitalAwaitingVerificationCount,
          })}
          icon={Clock}
        />
        <StatCard
          title={t("admin.payments.codPendingCollection")}
          value={codPendingCount}
          subtitle={t("admin.payments.awaitingCourierCash")}
          icon={Truck}
        />
        <StatCard
          title={t("admin.payments.totalTransactions")}
          value={payments.length}
          subtitle={t("admin.payments.allPaymentRecords")}
          icon={CreditCard}
        />
      </div>

      {/* Method Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-navy2/90 border border-gold/20 p-4 rounded-lg">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gold shrink-0 me-2">
            {t("admin.payments.paymentMethodLabel")}
          </span>
          {[
            { id: "all", label: t("admin.payments.allMethods") },
            { id: "Cash on Delivery", label: t("admin.payments.cod") },
            { id: "JazzCash", label: "JazzCash" },
            { id: "Raast", label: "Raast" },
            { id: "Bank Transfer", label: t("admin.payments.bankTransfer") },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMethodFilter(m.id)}
              className={`px-3 py-1.5 rounded text-xs uppercase font-semibold transition-colors shrink-0 ${
                methodFilter === m.id
                  ? "bg-gold text-navy font-bold shadow-md"
                  : "bg-navy/60 text-muted hover:text-ivory border border-gold/15"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gold shrink-0">
            {t("admin.shared.status")}
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-navy border border-gold/20 px-3 py-1.5 text-xs text-ivory rounded focus:outline-none focus:border-gold"
          >
            <option value="all">{t("admin.products.allStatuses")}</option>
            <option value="Pending">{t("status.pending")}</option>
            <option value="Verification Pending">{t("status.verificationpending")}</option>
            <option value="Verified">{t("status.verified")}</option>
            <option value="Paid">{t("admin.payments.paidCodCollected")}</option>
            <option value="Failed">{t("admin.payments.failed")}</option>
            <option value="Rejected">{t("admin.status.rejected")}</option>
            <option value="Refunded">{t("admin.status.refunded")}</option>
          </select>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        keyExtractor={(p) => p.id}
        searchPlaceholder={t("admin.payments.searchByOrderClientOrReference")}
      />

      {/* Issue Refund Modal */}
      <Modal
        isOpen={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        title={t("admin.payments.issueRefund")}
        subtitle={
          refundTarget
            ? t("admin.payments.refundSubtitle", {
                order: refundTarget.orderNumber,
                method: refundTarget.method,
                paid: refundTarget.amount.toLocaleString(),
                remaining: remainingRefundable(refundTarget).toLocaleString(),
              })
            : undefined
        }
      >
        <form onSubmit={handleRefundSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1 uppercase tracking-wider">{t("admin.payments.refundAmountPkr")} *</label>
            <input
              type="number"
              required
              min={1}
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1 uppercase tracking-wider">{t("admin.payments.refundBankReference")}</label>
            <input
              type="text"
              value={refundReference}
              onChange={(e) => setRefundReference(e.target.value)}
              placeholder={t("admin.payments.refundReferencePlaceholder")}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1 uppercase tracking-wider">{t("admin.payments.reason")}</label>
            <input
              type="text"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder={t("admin.payments.reasonPlaceholder")}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1 uppercase tracking-wider">{t("admin.orderDetail.internalNotes")}</label>
            <textarea
              rows={2}
              value={refundNotes}
              onChange={(e) => setRefundNotes(e.target.value)}
              placeholder={t("admin.payments.financeRecordNotePlaceholder")}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1 uppercase tracking-wider">{t("admin.refunds.refundStatus")}</label>
            <select
              value={refundStatus}
              onChange={(e) => setRefundStatus(e.target.value as "processed" | "pending")}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              <option value="processed">{t("admin.payments.refundProcessedOption")}</option>
              <option value="pending">{t("admin.payments.refundPendingOption")}</option>
            </select>
          </div>
          {refundError && (
            <p className="text-xs text-rose-300 font-mono">{refundError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRefundTarget(null)}
              className="px-4 py-2 rounded text-xs text-muted hover:text-ivory uppercase font-bold"
            >
              {t("admin.modal.cancel")}
            </button>
            <button
              type="submit"
              disabled={refundBusy}
              className="px-4 py-2 bg-gold text-navy font-bold rounded text-xs uppercase hover:bg-goldLight disabled:opacity-50"
            >
              {refundBusy ? t("admin.payments.processing") : t("admin.payments.recordRefund")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
