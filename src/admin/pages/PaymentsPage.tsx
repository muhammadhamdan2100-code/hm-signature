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

// "Verification Pending" is a real status written by submit_payment_proof once a
// customer attaches evidence, so it needs the same staff actions as "Pending".
const AWAITING_STAFF_STATUSES: PaymentStatus[] = ["Pending", "Verification Pending"];
const isAwaitingStaffAction = (status: PaymentStatus) => AWAITING_STAFF_STATUSES.includes(status);

export const PaymentsPage: React.FC = () => {
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
      setRefundError("Refund amount must be greater than zero.");
      return;
    }
    if (refundAmount > remainingRefundable(refundTarget)) {
      setRefundError(`Refund exceeds remaining refundable amount (Rs. ${remainingRefundable(refundTarget).toLocaleString()}).`);
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
      setRefundError(res.error || "Refund could not be recorded.");
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
      header: "Order & Date",
      accessor: (p) => (
        <div>
          <span className="font-mono font-bold text-gold text-xs block">{p.orderNumber}</span>
          <span className="text-[10px] font-mono text-muted">{p.date}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Client",
      accessor: (p) => (
        <div>
          <span className="font-serif font-bold text-xs text-ivory block">{p.customerName}</span>
          <span className="text-[10px] text-muted truncate max-w-[140px] block">{p.customerEmail}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Amount",
      accessor: (p) => (
        <span className="font-mono font-bold text-gold text-xs">
          Rs. {p.amount.toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Payment Method",
      accessor: (p) => (
        <div className="flex items-center space-x-1.5">
          {getMethodIcon(p.method)}
          <span className="text-xs text-ivory font-medium">{p.method}</span>
        </div>
      ),
    },
    {
      header: "Reference / Note",
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
      header: "Status",
      accessor: (p) => <StatusBadge status={p.status} />,
      sortable: true,
    },
    {
      header: "Refunds",
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
              {pendingOnly ? "Refund Pending" : total >= p.amount ? "Fully Refunded" : "Partial Refund"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Actions",
      accessor: (p) => (
        <div className="flex items-center space-x-2 justify-end">
          {isAwaitingStaffAction(p.status) && p.method === "Cash on Delivery" && (
            <button
              onClick={() => markCodCollected(p.id)}
              className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/40 rounded text-[10px] uppercase font-bold transition-colors"
            >
              Collect Cash
            </button>
          )}

          {isAwaitingStaffAction(p.status) && p.method !== "Cash on Delivery" && (
            <>
              <button
                onClick={() => verifyPayment(p.id)}
                className="px-2 py-1 bg-gold hover:bg-goldLight text-navy font-bold rounded text-[10px] uppercase transition-colors"
              >
                Verify
              </button>
              <button
                onClick={() => rejectPayment(p.id)}
                className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 rounded text-[10px] uppercase font-bold transition-colors"
              >
                Reject
              </button>
            </>
          )}

          {(p.status === "Paid" || p.status === "Verified") && remainingRefundable(p) > 0 && (
            <button
              onClick={() => openRefundModal(p)}
              className="px-2 py-1 bg-navy hover:bg-navy2 text-gold border border-gold/40 hover:border-gold rounded text-[10px] uppercase font-bold transition-colors flex items-center space-x-1"
              title="Issue refund for this payment"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Refund</span>
            </button>
          )}

          <button
            onClick={() => navigate(`/admin/orders/${p.orderId}`)}
            className="p-1 text-muted hover:text-gold transition-colors"
            title="View Order"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            FINANCIAL AUDIT & VERIFICATION
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Boutique Payment Gateway Management
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Verify Pakistan digital transfers (JazzCash, Raast, Bank Transfer) and audit Cash on Delivery collections.
          </p>
        </div>
        <Link
          to="/admin/payments/refunds"
          className="px-4 py-2 rounded text-xs font-sans uppercase tracking-wider text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 flex items-center space-x-1.5 shrink-0"
        >
          <ArrowLeftRight className="w-4 h-4 text-gold" />
          <span>Refund Ledger</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Verified Settlement"
          value={`Rs. ${totalVerifiedAmount.toLocaleString()}`}
          subtitle="Settled & verified payments"
          icon={Building2}
          accent={true}
        />
        <StatCard
          title="Digital Pending Verification"
          value={pendingVerificationCount}
          subtitle={`Verification Pending ${digitalAwaitingVerificationCount} · Awaiting proof ${pendingVerificationCount - digitalAwaitingVerificationCount}`}
          icon={Clock}
        />
        <StatCard
          title="COD Pending Collection"
          value={codPendingCount}
          subtitle="Awaiting courier delivery cash"
          icon={Truck}
        />
        <StatCard
          title="Total Transactions"
          value={payments.length}
          subtitle="All payment records"
          icon={CreditCard}
        />
      </div>

      {/* Method Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-navy2/90 border border-gold/20 p-4 rounded-lg">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gold shrink-0 mr-2">
            Payment Method:
          </span>
          {[
            { id: "all", label: "All Methods" },
            { id: "Cash on Delivery", label: "COD" },
            { id: "JazzCash", label: "JazzCash" },
            { id: "Raast", label: "Raast" },
            { id: "Bank Transfer", label: "Bank Transfer" },
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

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gold shrink-0">
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-navy border border-gold/20 px-3 py-1.5 text-xs text-ivory rounded focus:outline-none focus:border-gold"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Verification Pending">Verification Pending</option>
            <option value="Verified">Verified</option>
            <option value="Paid">Paid (COD Collected)</option>
            <option value="Failed">Failed</option>
            <option value="Rejected">Rejected</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        keyExtractor={(p) => p.id}
        searchPlaceholder="Search by order number, client name, email, or transaction reference..."
      />

      {/* Issue Refund Modal */}
      <Modal
        isOpen={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        title="Issue Refund"
        subtitle={refundTarget ? `Order ${refundTarget.orderNumber} • ${refundTarget.method} • Paid Rs. ${refundTarget.amount.toLocaleString()} • Remaining Rs. ${remainingRefundable(refundTarget).toLocaleString()}` : undefined}
      >
        <form onSubmit={handleRefundSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1 uppercase tracking-wider">Refund Amount (PKR) *</label>
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
            <label className="block text-xs text-muted mb-1 uppercase tracking-wider">Refund / Bank Reference</label>
            <input
              type="text"
              value={refundReference}
              onChange={(e) => setRefundReference(e.target.value)}
              placeholder="e.g. HBL-REF-88213"
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1 uppercase tracking-wider">Reason</label>
            <input
              type="text"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Damaged flacon on delivery"
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1 uppercase tracking-wider">Internal Notes</label>
            <textarea
              rows={2}
              value={refundNotes}
              onChange={(e) => setRefundNotes(e.target.value)}
              placeholder="Optional note for finance records"
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1 uppercase tracking-wider">Refund Status</label>
            <select
              value={refundStatus}
              onChange={(e) => setRefundStatus(e.target.value as "processed" | "pending")}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              <option value="processed">Processed — funds returned</option>
              <option value="pending">Pending — bank transfer in progress</option>
            </select>
          </div>
          {refundError && (
            <p className="text-xs text-rose-300 font-mono">{refundError}</p>
          )}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setRefundTarget(null)}
              className="px-4 py-2 rounded text-xs text-muted hover:text-ivory uppercase font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={refundBusy}
              className="px-4 py-2 bg-gold text-navy font-bold rounded text-xs uppercase hover:bg-goldLight disabled:opacity-50"
            >
              {refundBusy ? "Processing…" : "Record Refund"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
