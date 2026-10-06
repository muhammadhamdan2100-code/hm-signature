import React, { useEffect, useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { Plus, Minus, History, RefreshCw, Package } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";

export const InventoryPage: React.FC = () => {
  const { t } = useI18n();
  const { products, categories, inventoryLogs, adjustStock, inventoryPosition, refreshInventoryPosition, contentName } = useAdminData();
  // Merchandising names come from the database translated per language; the stored row keeps its
  // source text, so only what is displayed changes.
  const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]));
  const productIdByName = new Map(products.map((pr) => [pr.name, pr.id]));
  const [positionLoading, setPositionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setPositionLoading(true);
    Promise.resolve(refreshInventoryPosition()).finally(() => {
      if (mounted) setPositionLoading(false);
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            {t("admin.inventory.atelierFlaconVault")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.inventory.inventoryFlaconStockControl")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            {t("admin.inventory.trackRealTimeBottle")}
          </p>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-navy2/90 border border-gold/20 rounded-lg overflow-hidden shadow-xl space-y-4">
        <div className="p-4 border-b border-gold/15 bg-navy/40 flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-ivory">
            {t("admin.inventory.currentFragranceStockRoster", { count: products.length })}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs font-sans">
            <thead className="bg-navy text-gold uppercase tracking-widest text-[10px] border-b border-gold/15">
              <tr>
                <th className="py-3 px-4">{t("admin.inventory.fragrance")}</th>
                <th className="py-3 px-4">{t("admin.inventory.sku")}</th>
                <th className="py-3 px-4">{t("admin.inventory.currentStock")}</th>
                <th className="py-3 px-4">{t("admin.inventory.lowLimit")}</th>
                <th className="py-3 px-4">{t("admin.inventory.stockStatus")}</th>
                <th className="py-3 px-4 text-end">{t("admin.inventory.stockAction")}</th>
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
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded border border-gold/20 bg-navy flex items-center justify-center">
                          <Package className="w-4 h-4 text-gold" />
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-sm text-ivory">
                            {contentName("product", p.id, p.name)}
                          </h4>
                          <span className="text-[10px] text-muted">{contentName("category", categoryIdByName.get(p.category), p.category)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-gold font-semibold">
                      {p.sku}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm font-bold text-ivory">
                        {t("admin.inventory.units", { count: p.stock })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted font-mono">
                      {t("admin.inventory.units", { count: p.lowStockThreshold })}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={stockStatus} />
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button
                        onClick={() => handleOpenAdjust(p.id)}
                        className="px-3 py-1.5 rounded bg-gold hover:bg-goldLight text-navy font-semibold text-xs transition-colors flex items-center gap-1 ms-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t("admin.inventory.adjustStock")}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-size inventory position, computed from the ledger */}
      <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold/15 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gold" />
            <h3 className="font-serif text-base font-bold text-ivory">
              {t("admin.inventory.inventoryPositionByBottleSize")}
            </h3>
          </div>
          <button
            onClick={refreshInventoryPosition}
            className="px-3 py-1.5 rounded border border-gold/30 text-gold hover:bg-gold hover:text-navy text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${positionLoading ? "animate-spin" : ""}`} />
            <span>{t("admin.inventory.recalculate")}</span>
          </button>
        </div>

        <p className="text-[11px] text-muted font-light">
          {t("admin.inventory.reservedUnitsAreStock")}
        </p>

        {inventoryPosition.length === 0 && !positionLoading ? (
          <p className="text-xs text-muted font-light py-4 text-center">
            {t("admin.inventory.noSizeLevelMovements")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs font-sans">
              <thead className="bg-navy text-gold uppercase tracking-widest text-[10px] border-b border-gold/15">
                <tr>
                  <th className="py-2.5 px-3">{t("admin.inventory.fragrance")}</th>
                  <th className="py-2.5 px-3">{t("admin.inventory.size")}</th>
                  <th className="py-2.5 px-3">{t("admin.inventory.onHand")}</th>
                  <th className="py-2.5 px-3">{t("admin.inventory.lowLimit")}</th>
                  <th className="py-2.5 px-3">{t("admin.inventory.reserved")}</th>
                  <th className="py-2.5 px-3">{t("admin.inventory.sold")}</th>
                  <th className="py-2.5 px-3" title={t("admin.inventory.unitsPutBackOnThe")}>{t("admin.inventory.restocked")}</th>
                  <th className="py-2.5 px-3">{t("admin.inventory.adjustments")}</th>
                  <th className="py-2.5 px-3">{t("admin.inventory.unitsDay")}</th>
                  <th className="py-2.5 px-3">{t("admin.inventory.lastMovement")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 text-ivory">
                {inventoryPosition.map((row) => (
                  <tr key={row.variantId} className="hover:bg-navy/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-serif font-bold text-ivory">{contentName("product", productIdByName.get(row.productName), row.productName)}</span>
                      <span className="block text-[10px] text-muted font-mono">{row.sku}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-gold">{row.size}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{row.onHand}</td>
                    <td className="py-2.5 px-3 font-mono text-muted">{row.lowStockThreshold}</td>
                    <td className="py-2.5 px-3 font-mono">{row.reservedInOpenOrders}</td>
                    <td className="py-2.5 px-3 font-mono">{row.soldUnits}</td>
                    <td className="py-2.5 px-3 font-mono">{row.restockedUnits}</td>
                    <td className="py-2.5 px-3 font-mono">{row.netAdjustments}</td>
                    <td className="py-2.5 px-3 font-mono">{row.dailyVelocity}</td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-muted">
                      {row.lastMovement ? String(row.lastMovement).replace("T", " ").slice(0, 16) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock History Audit Log */}
      <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
          <History className="w-4 h-4 text-gold" />
          <h3 className="font-serif text-base font-bold text-ivory">
            {t("admin.inventory.inventoryMovementStock")}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs font-sans">
            <thead className="bg-navy text-gold uppercase tracking-widest text-[10px] border-b border-gold/15">
              <tr>
                <th className="py-2.5 px-3">{t("admin.inventory.date")}</th>
                <th className="py-2.5 px-3">{t("admin.inventory.fragrance")}</th>
                <th className="py-2.5 px-3">{t("admin.inventory.change")}</th>
                <th className="py-2.5 px-3">{t("admin.inventory.newStock")}</th>
                <th className="py-2.5 px-3">{t("admin.inventory.reasonNote")}</th>
                <th className="py-2.5 px-3">{t("admin.inventory.adjustedBy")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10 text-ivory">
              {inventoryLogs.map((log) => (
                <tr key={log.id} className="hover:bg-navy/50 transition-colors">
                  <td className="py-3 px-3 text-muted font-mono">{log.date}</td>
                  <td className="py-3 px-3 font-serif font-bold text-ivory">
                    {contentName("product", log.productId, log.productName)} ({log.sku})
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    <span
                      className={log.change > 0 ? "text-emerald-400" : "text-rose-400"}
                    >
                      {log.change > 0 ? `+${log.change}` : log.change}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">{t("admin.inventory.units", { count: log.newStock })}</td>
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
        title={t("admin.inventory.adjustStockName", { name: targetProduct?.name || "" })}
        maxWidth="md"
      >
        {targetProduct && (
          <form onSubmit={handleSaveStock} className="space-y-4">
            <div className="p-3 rounded bg-navy border border-gold/20 flex items-center justify-between text-xs font-sans">
              <span className="text-muted">{t("admin.inventory.currentStock2")}</span>
              <span className="font-mono font-bold text-gold text-sm">
                {t("admin.inventory.units", { count: targetProduct.stock })}
              </span>
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.inventory.adjustmentMode")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustType("add")}
                  className={`py-2 rounded text-xs font-sans uppercase font-bold flex items-center justify-center gap-1 border transition-colors ${
                    adjustType === "add"
                      ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                      : "bg-navy text-muted border-gold/20"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("admin.inventory.addStock")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType("remove")}
                  className={`py-2 rounded text-xs font-sans uppercase font-bold flex items-center justify-center gap-1 border transition-colors ${
                    adjustType === "remove"
                      ? "bg-rose-950/60 border-rose-500 text-rose-300"
                      : "bg-navy text-muted border-gold/20"
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  <span>{t("admin.inventory.deductStock")}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.inventory.quantityCount")}
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
                {t("admin.inventory.adjustmentReasonNote")}
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("admin.inventory.restockBatchFromLaboratory")}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gold/15">
              <button
                type="button"
                onClick={() => setSelectedProductId(null)}
                className="px-4 py-2 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20"
              >
                {t("admin.modal.cancel")}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider"
              >
                {t("admin.inventory.confirmAdjustment")}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
