import React, { useState } from "react";
import { useAdminData, type PaymentMethod } from "../context/AdminDataContext";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { StatCard } from "../components/StatCard";
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Truck,
  Clock,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PaymentsPage: React.FC = () => {
  const { payments, verifyPayment, rejectPayment, markCodCollected } = useAdminData();
  const navigate = useNavigate();

  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const pendingVerificationCount = payments.filter(
    (p) => p.status === "Pending" && p.method !== "Cash on Delivery"
  ).length;

  const codPendingCount = payments.filter(
    (p) => p.method === "Cash on Delivery" && p.status === "Pending"
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
      header: "Actions",
      accessor: (p) => (
        <div className="flex items-center space-x-2 justify-end">
          {p.status === "Pending" && p.method === "Cash on Delivery" && (
            <button
              onClick={() => markCodCollected(p.id)}
              className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/40 rounded text-[10px] uppercase font-bold transition-colors"
            >
              Collect Cash
            </button>
          )}

          {p.status === "Pending" && p.method !== "Cash on Delivery" && (
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
          subtitle="JazzCash, Raast & Bank Proofs"
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
            <option value="Verified">Verified</option>
            <option value="Paid">Paid (COD Collected)</option>
            <option value="Rejected">Rejected</option>
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
    </div>
  );
};
