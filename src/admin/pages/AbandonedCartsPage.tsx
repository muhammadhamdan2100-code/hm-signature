import React, { useState } from "react";
import { useAdminData, type AbandonedCart } from "../context/AdminDataContext";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { ShoppingCart, Send, DollarSign } from "lucide-react";

export const AbandonedCartsPage: React.FC = () => {
  const { abandonedCarts, sendCartRecoveryReminder } = useAdminData();

  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [customNote, setCustomNote] = useState(
    "Dear Client, we noticed you left your signature extraits in your boutique bag. Enjoy complimentary express delivery on your order today."
  );
  const [discountCode, setDiscountCode] = useState("WELCOME15");

  const [filterType, setFilterType] = useState("all");

  const filteredCarts = [...abandonedCarts].filter((c) => {
    if (filterType === "high") return c.cartValue >= 5000;
    if (filterType === "pending") return c.status === "Pending";
    return true;
  });

  const totalAbandonedValue = abandonedCarts.reduce((acc, c) => acc + c.cartValue, 0);

  const handleSendReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCart) return;
    sendCartRecoveryReminder(selectedCart.id, `${customNote} (Voucher Code: ${discountCode})`);
    setSelectedCart(null);
  };

  const columns: Column<AbandonedCart>[] = [
    {
      header: "Client & Contact",
      accessor: (c) => (
        <div>
          <h4 className="font-serif font-bold text-sm text-ivory">{c.customerName}</h4>
          <span className="text-[11px] font-mono text-gold">{c.customerEmail}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Cart Contents",
      accessor: (c) => (
        <div className="space-y-0.5">
          {c.items.map((item, idx) => (
            <span key={idx} className="text-xs text-ivory block font-medium">
              {item.quantity}x {item.productName} (Rs. {item.price.toLocaleString()})
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Cart Value",
      accessor: (c) => (
        <span className="font-mono font-bold text-gold text-xs">
          Rs. {c.cartValue.toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Abandoned Date",
      accessor: (c) => <span className="text-xs text-muted font-mono">{c.abandonedDate}</span>,
      sortable: true,
    },
    {
      header: "Status",
      accessor: (c) => <StatusBadge status={c.status} />,
      sortable: true,
    },
    {
      header: "Recovery Action",
      accessor: (c) => (
        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              setSelectedCart(c);
            }}
            className="px-3 py-1.5 rounded bg-gold hover:bg-goldLight text-navy font-semibold text-xs font-sans uppercase tracking-wider flex items-center space-x-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Reminder</span>
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
            CART RECOVERY CONCIERGE
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Abandoned Shopping Bags & Recovery Reminders
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Recover uncompleted boutique checkouts by sending personalized invitation notes and exclusive vouchers.
          </p>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-navy2/90 border border-gold/20 p-5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
              Total Unrecovered Value
            </span>
            <span className="text-2xl font-serif text-gold font-bold block mt-1">
              Rs. {totalAbandonedValue.toLocaleString()}
            </span>
          </div>
          <ShoppingCart className="w-6 h-6 text-gold" />
        </div>

        <div className="bg-navy2/90 border border-gold/20 p-5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
              Abandoned Carts Count
            </span>
            <span className="text-2xl font-serif text-ivory font-bold block mt-1">
              {abandonedCarts.length} Bags
            </span>
          </div>
          <ShoppingCart className="w-6 h-6 text-muted" />
        </div>

        <div className="bg-navy2/90 border border-gold/20 p-5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
              High Value Carts (&gt; Rs.5k)
            </span>
            <span className="text-2xl font-serif text-emerald-300 font-bold block mt-1">
              {abandonedCarts.filter((c) => c.cartValue >= 5000).length}
            </span>
          </div>
          <DollarSign className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredCarts}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search client name, email..."
        emptyMessage="No abandoned carts"
        filterControls={
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-navy border border-gold/20 rounded px-3 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
          >
            <option value="all">All Carts</option>
            <option value="high">High Value (&gt; Rs. 5,000)</option>
            <option value="pending">Pending Reminder</option>
          </select>
        }
      />

      {/* Send Recovery Reminder Modal */}
      <Modal
        isOpen={selectedCart !== null}
        onClose={() => setSelectedCart(null)}
        title={`Send Cart Recovery Reminder — ${selectedCart?.customerName || ""}`}
      >
        {selectedCart && (
          <form onSubmit={handleSendReminder} className="space-y-4">
            <div className="p-3 rounded bg-navy border border-gold/20 font-sans text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted">Recipient:</span>
                <span className="text-gold font-mono">{selectedCart.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Cart Value:</span>
                <span className="text-ivory font-mono font-bold">
                  Rs. {selectedCart.cartValue.toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Personalised Concierge Message
              </label>
              <textarea
                rows={4}
                required
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded p-3 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Attach Incentive Voucher Code
              </label>
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="WELCOME15"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-gold font-mono font-bold uppercase focus:outline-none focus:border-gold"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-gold/15">
              <button
                type="button"
                onClick={() => setSelectedCart(null)}
                className="px-4 py-2 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Email Reminder</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
