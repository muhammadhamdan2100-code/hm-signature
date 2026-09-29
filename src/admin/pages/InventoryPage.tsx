import React, { useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { Plus, Minus, History, RefreshCw, Package } from "lucide-react";

export const InventoryPage: React.FC = () => {
  const { products, inventoryLogs, adjustStock } = useAdminData();

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [stockChange, setStockChange] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [reason, setReason] = useState("Atelier Restock Batch #2026");

  const targetProduct = products.find((p) => p.id === selectedProductId);

  const handleOpenAdjust = (prodId: string) => {
    setSelectedProductId(prodId);
    setStockChange(10);
    setAdjustType("add");
    setReason("Atelier Restock Batch #2026");
  };

  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    const finalChange = adjustType === "add" ? stockChange : -stockChange;
    adjustStock(selectedProductId, finalChange, reason);
    setSelectedProductId(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            ATELIER FLACON VAULT
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Inventory & Flacon Stock Control
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Track real-time bottle quantities, set low-stock thresholds, and inspect stock movement history logs.
          </p>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-navy2/90 border border-gold/20 rounded-lg overflow-hidden shadow-xl space-y-4">
        <div className="p-4 border-b border-gold/15 bg-navy/40 flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-ivory">
            Current Fragrance Stock Roster ({products.length} SKUs)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-navy text-gold uppercase tracking-widest text-[10px] border-b border-gold/15">
              <tr>
                <th className="py-3 px-4">Fragrance</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Low Limit</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4 text-right">Stock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10 text-ivory">
              {products.map((p) => {
                const isOut = p.stock === 0;
                const isLow = p.stock <= p.lowStockThreshold && p.stock > 0;
                const stockStatus = isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock";

                return (
                  <tr key={p.id} className="hover:bg-navy/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded border border-gold/20 bg-navy flex items-center justify-center">
                          <Package className="w-4 h-4 text-gold" />
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-sm text-ivory">
                            {p.name}
                          </h4>
                          <span className="text-[10px] text-muted">{p.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-gold font-semibold">
                      {p.sku}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm font-bold text-ivory">
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted font-mono">
                      {p.lowStockThreshold} units
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={stockStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenAdjust(p.id)}
                        className="px-3 py-1.5 rounded bg-gold hover:bg-goldLight text-navy font-semibold text-xs transition-colors flex items-center space-x-1 ml-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Adjust Stock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock History Audit Log */}
      <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2 border-b border-gold/15 pb-3">
          <History className="w-4 h-4 text-gold" />
          <h3 className="font-serif text-base font-bold text-ivory">
            Inventory Movement & Stock History Audit Log
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-navy text-gold uppercase tracking-widest text-[10px] border-b border-gold/15">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Fragrance</th>
                <th className="py-2.5 px-3">Change</th>
                <th className="py-2.5 px-3">New Stock</th>
                <th className="py-2.5 px-3">Reason Note</th>
                <th className="py-2.5 px-3">Adjusted By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10 text-ivory">
              {inventoryLogs.map((log) => (
                <tr key={log.id} className="hover:bg-navy/50 transition-colors">
                  <td className="py-3 px-3 text-muted font-mono">{log.date}</td>
                  <td className="py-3 px-3 font-serif font-bold text-ivory">
                    {log.productName} ({log.sku})
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    <span
                      className={log.change > 0 ? "text-emerald-400" : "text-rose-400"}
                    >
                      {log.change > 0 ? `+${log.change}` : log.change}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">{log.newStock} units</td>
                  <td className="py-3 px-3 text-muted">{log.reason}</td>
                  <td className="py-3 px-3 text-gold font-mono text-[11px]">
                    {log.adjustedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={selectedProductId !== null}
        onClose={() => setSelectedProductId(null)}
        title={`Adjust Stock — ${targetProduct?.name || ""}`}
        maxWidth="md"
      >
        {targetProduct && (
          <form onSubmit={handleSaveStock} className="space-y-4">
            <div className="p-3 rounded bg-navy border border-gold/20 flex items-center justify-between text-xs font-sans">
              <span className="text-muted">Current Stock:</span>
              <span className="font-mono font-bold text-gold text-sm">
                {targetProduct.stock} units
              </span>
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Adjustment Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustType("add")}
                  className={`py-2 rounded text-xs font-sans uppercase font-bold flex items-center justify-center space-x-1 border transition-colors ${
                    adjustType === "add"
                      ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                      : "bg-navy text-muted border-gold/20"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Stock</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType("remove")}
                  className={`py-2 rounded text-xs font-sans uppercase font-bold flex items-center justify-center space-x-1 border transition-colors ${
                    adjustType === "remove"
                      ? "bg-rose-950/60 border-rose-500 text-rose-300"
                      : "bg-navy text-muted border-gold/20"
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  <span>Deduct Stock</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Quantity Count *
              </label>
              <input
                type="number"
                min={1}
                required
                value={stockChange}
                onChange={(e) => setStockChange(Number(e.target.value))}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Adjustment Reason / Note *
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Restock batch from laboratory"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-gold/15">
              <button
                type="button"
                onClick={() => setSelectedProductId(null)}
                className="px-4 py-2 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider"
              >
                Confirm Adjustment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
