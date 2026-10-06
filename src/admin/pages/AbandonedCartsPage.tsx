import React, { useState } from "react";
import { useAdminData, type AbandonedCart } from "../context/AdminDataContext";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { ShoppingCart, Send, DollarSign } from "lucide-react";
import { formatPKR } from "../../utils/currency";
import { useI18n } from "../../i18n/I18nProvider";

export const AbandonedCartsPage: React.FC = () => {
  const { t } = useI18n();
  const { abandonedCarts, sendCartRecoveryReminder, markCartRecovered, clearCartRecoveryState } =
    useAdminData();

  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [customNote, setCustomNote] = useState(
    t("admin.abandonedCarts.recoveryMessageDraftDefault")
  );
  const [discountCode, setDiscountCode] = useState("");

  const [filterType, setFilterType] = useState("all");

  const filteredCarts = [...abandonedCarts].filter((c) => {
    if (filterType === "high") return c.cartValue >= 5000;
    if (filterType === "pending") return c.status === "Pending";
    if (filterType === "reminder") return c.status === "Reminder Sent";
    if (filterType === "recovered") return c.status === "Recovered";
    return true;
  });

  const unrecoveredValue = abandonedCarts
    .filter((c) => c.status !== "Recovered")
    .reduce((acc, c) => acc + c.cartValue, 0);

  const handleSendReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCart) return;
    sendCartRecoveryReminder(selectedCart.id);
    setSelectedCart(null);
  };

  const fmtStamp = (iso?: string | null) =>
    iso ? String(iso).replace("T", " ").slice(0, 16) : "";

  const columns: Column<AbandonedCart>[] = [
    {
      header: t("admin.shared.clientContact"),
      accessor: (c) => (
        <div>
          <h4 className="font-serif font-bold text-sm text-ivory">{c.customerName}</h4>
          <span className="text-[11px] font-mono text-gold">{c.customerEmail}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.abandonedCarts.cartContents"),
      accessor: (c) => (
        <div className="space-y-0.5">
          {c.items.map((item, idx) => (
            <span key={idx} className="text-xs text-ivory block font-medium">
              {item.quantity}x {item.productName} ({formatPKR(item.price)})
            </span>
          ))}
        </div>
      ),
    },
    {
      header: t("admin.abandonedCarts.cartValue"),
      accessor: (c) => (
        <span className="font-mono font-bold text-gold text-xs">
          {formatPKR(c.cartValue)}
        </span>
      ),
      sortable: true,
    },
    {
      header: t("admin.abandonedCarts.abandonedDate"),
      accessor: (c) => <span className="text-xs text-muted font-mono">{c.abandonedDate}</span>,
      sortable: true,
    },
    {
      header: t("admin.shared.status"),
      accessor: (c) => (
        <div className="space-y-1">
          <StatusBadge status={c.status} />
          {c.reminderSentAt && (
            <span className="block text-[10px] font-mono text-muted">Reminded {fmtStamp(c.reminderSentAt)}</span>
          )}
          {c.recoveredAt && (
            <span className="block text-[10px] font-mono text-muted">Recovered {fmtStamp(c.recoveredAt)}</span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.abandonedCarts.recoveryAction"),
      accessor: (c) => (
        <div className="flex flex-col items-end gap-1.5">
          {c.status === "Recovered" ? (
            <button
              onClick={() => clearCartRecoveryState(c.id)}
              className="px-3 py-1.5 rounded border border-gold/20 text-[11px] font-sans text-muted hover:text-ivory uppercase tracking-wider"
            >
              {t("admin.abandonedCarts.reopenBag")}
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setSelectedCart(c);
                }}
                className="px-3 py-1.5 rounded bg-gold hover:bg-goldLight text-navy font-semibold text-xs font-sans uppercase tracking-wider flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t("admin.abandonedCarts.recordReminder")}</span>
              </button>
              <button
                onClick={() => markCartRecovered(c.id)}
                className="px-3 py-1.5 rounded border border-gold/30 text-[11px] font-sans text-gold hover:bg-gold/10 uppercase tracking-wider"
              >
                {t("admin.abandonedCarts.markRecovered")}
              </button>
            </>
          )}
        </div>
      ),
      className: "text-end",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            {t("admin.abandonedCarts.cartRecoveryConcierge")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.abandonedCarts.abandonedShoppingBagsTitle")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            {t("admin.abandonedCarts.recoverUncompletedCheckouts")}
          </p>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-navy2/90 border border-gold/20 p-5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
              {t("admin.abandonedCarts.totalUnrecoveredValue")}
            </span>
            <span className="text-2xl font-serif text-gold font-bold block mt-1">
              {formatPKR(unrecoveredValue)}
            </span>
          </div>
          <ShoppingCart className="w-6 h-6 text-gold" />
        </div>

        <div className="bg-navy2/90 border border-gold/20 p-5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
              {t("admin.abandonedCarts.abandonedCartsCount")}
            </span>
            <span className="text-2xl font-serif text-ivory font-bold block mt-1">
              {t("admin.abandonedCarts.bagsCount", { count: abandonedCarts.length })}
            </span>
          </div>
          <ShoppingCart className="w-6 h-6 text-muted" />
        </div>

        <div className="bg-navy2/90 border border-gold/20 p-5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
              {t("admin.abandonedCarts.highValueCarts", { amount: formatPKR(5000) })}
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
        searchPlaceholder={t("admin.abandonedCarts.searchClientNameEmail")}
        emptyMessage={t("admin.abandonedCarts.noAbandonedCarts")}
        filterControls={
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-navy border border-gold/20 rounded px-3 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
          >
            <option value="all">{t("admin.abandonedCarts.allCarts")}</option>
            <option value="high">{t("admin.abandonedCarts.highValueOption", { amount: formatPKR(5000) })}</option>
            <option value="pending">{t("admin.abandonedCarts.pendingReminder")}</option>
            <option value="reminder">{t("admin.abandonedCarts.reminderRecorded")}</option>
            <option value="recovered">{t("admin.status.recovered")}</option>
          </select>
        }
      />

      {/* Record Recovery Reminder Modal */}
      <Modal
        isOpen={selectedCart !== null}
        onClose={() => setSelectedCart(null)}
        title={t("admin.abandonedCarts.recordReminderTitle", { name: selectedCart?.customerName || "" })}
      >
        {selectedCart && (
          <form onSubmit={handleSendReminder} className="space-y-4">
            <div className="p-3 rounded bg-navy border border-gold/20 font-sans text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted">{t("admin.abandonedCarts.recipient")}</span>
                <span className="text-gold font-mono">{selectedCart.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t("admin.abandonedCarts.cartValue2")}</span>
                <span className="text-ivory font-mono font-bold">
                  {formatPKR(selectedCart.cartValue)}
                </span>
              </div>
            </div>

            <p className="text-[11px] font-sans text-muted leading-relaxed border-l-2 border-gold/30 ps-3">
              {t("admin.abandonedCarts.nothingIsEmailedNote")}
            </p>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.abandonedCarts.conciergeMessageDraft")}
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
                {t("admin.abandonedCarts.voucherCodeToQuoteLater")}
              </label>
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder={t("admin.primaryAdminSecurityCard.none")}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-gold font-mono font-bold uppercase focus:outline-none focus:border-gold"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gold/15">
              <button
                type="button"
                onClick={() => setSelectedCart(null)}
                className="px-4 py-2 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20"
              >
                {t("admin.modal.cancel")}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t("admin.abandonedCarts.recordReminder")}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
