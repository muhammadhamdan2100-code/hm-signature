import React, { useState } from "react";
import { useAdminData, type Coupon } from "../context/AdminDataContext";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, ConfirmDialog } from "../components/Modal";
import { Plus, Edit, Trash2, Tag, RefreshCw } from "lucide-react";

export const CouponsPage: React.FC = () => {
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useAdminData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"Percentage" | "Fixed">("Percentage");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrder, setMinOrder] = useState<number>(5000);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(2000);
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [perCustomerLimit, setPerCustomerLimit] = useState<number>(1);
  const [startDate, setStartDate] = useState("2026-09-01");
  const [expiryDate, setExpiryDate] = useState("2026-12-31");
  const [active, setActive] = useState(true);

  const handleGenerateCode = () => {
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    setCode(`HM-${randomHex}`);
  };

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setCode("");
    handleGenerateCode();
    setDiscountType("Percentage");
    setDiscountValue(10);
    setMinOrder(5000);
    setMaxDiscount(2000);
    setUsageLimit(100);
    setPerCustomerLimit(1);
    setStartDate("2026-09-01");
    setExpiryDate("2026-12-31");
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinOrder(c.minOrder);
    setMaxDiscount(c.maxDiscount);
    setUsageLimit(c.usageLimit);
    setPerCustomerLimit(c.perCustomerLimit);
    setStartDate(c.startDate);
    setExpiryDate(c.expiryDate);
    setActive(c.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code,
      discountType,
      discountValue: Number(discountValue),
      minOrder: Number(minOrder),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      usageLimit: Number(usageLimit),
      perCustomerLimit: Number(perCustomerLimit),
      startDate,
      expiryDate,
      active,
    };

    if (editingCoupon) {
      updateCoupon(editingCoupon.id, payload);
    } else {
      addCoupon(payload);
    }
    setIsModalOpen(false);
  };

  const columns: Column<Coupon>[] = [
    {
      header: "Voucher Code",
      accessor: (c) => (
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-gold shrink-0" />
          <span className="font-mono font-bold text-gold text-sm">{c.code}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Discount Value",
      accessor: (c) => (
        <span className="font-mono text-ivory font-bold text-xs">
          {c.discountType === "Percentage"
            ? `${c.discountValue}% OFF`
            : `Rs. ${c.discountValue} OFF`}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Min Order",
      accessor: (c) => <span className="font-mono text-muted">Rs. {c.minOrder}</span>,
      sortable: true,
    },
    {
      header: "Usage Count",
      accessor: (c) => (
        <span className="font-mono text-xs text-ivory">
          {c.usedCount} / {c.usageLimit}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Valid Period",
      accessor: (c) => (
        <span className="text-[11px] font-mono text-muted">
          {c.startDate} to {c.expiryDate}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Status",
      accessor: (c) => <StatusBadge status={c.active ? "Active" : "Inactive"} />,
      sortable: true,
    },
    {
      header: "Actions",
      accessor: (c) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handleOpenEdit(c)}
            className="p-1.5 rounded text-muted hover:text-gold hover:bg-navy transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(c.id)}
            className="p-1.5 rounded text-muted hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            PROMOTIONAL DISCOUNTS & VOUCHERS
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Coupons & Exclusive Client Offers
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Create percentage discounts or fixed value promo codes for boutique checkouts.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center space-x-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* Coupons Table */}
      <DataTable
        columns={columns}
        data={coupons}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search coupon code..."
        emptyMessage="No promo codes found"
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? "Edit Voucher Code" : "Create Exclusive Promo Code"}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              Voucher Code *
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="LUXURY10"
                className="flex-1 bg-navy border border-gold/30 rounded px-3 py-2 text-xs font-mono font-bold text-gold uppercase focus:outline-none focus:border-gold"
              />
              <button
                type="button"
                onClick={handleGenerateCode}
                className="px-3 py-2 bg-navy border border-gold/30 hover:border-gold text-gold text-xs rounded font-sans flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed">Fixed Amount (PKR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Discount Value *
              </label>
              <input
                type="number"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-gold font-mono font-bold focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Minimum Order Value (PKR)
              </label>
              <input
                type="number"
                value={minOrder}
                onChange={(e) => setMinOrder(Number(e.target.value))}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Maximum Discount (PKR)
              </label>
              <input
                type="number"
                value={maxDiscount || ""}
                onChange={(e) =>
                  setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="Unlimited if empty"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Total Global Uses Limit
              </label>
              <input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Limit Per Client
              </label>
              <input
                type="number"
                value={perCustomerLimit}
                onChange={(e) => setPerCustomerLimit(Number(e.target.value))}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <label className="flex items-center space-x-3 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-gold/30 bg-navy text-gold focus:ring-0"
            />
            <span className="text-xs text-ivory">Active Coupon Status</span>
          </label>

          <div className="pt-4 flex justify-end space-x-3 border-t border-gold/15">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider"
            >
              Save Coupon
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteCoupon(deleteId);
        }}
        title="Delete Coupon Code"
        message="Are you sure you want to permanently delete this voucher code?"
        confirmText="Delete Voucher"
        isDanger={true}
      />
    </div>
  );
};
