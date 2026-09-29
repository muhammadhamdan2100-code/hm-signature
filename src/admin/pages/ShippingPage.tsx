import React, { useState } from "react";
import { useAdminData, type ShippingMethod } from "../context/AdminDataContext";
import { Modal } from "../components/Modal";
import { Truck, Edit } from "lucide-react";

export const ShippingPage: React.FC = () => {
  const { shippingMethods, updateShippingMethod } = useAdminData();

  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [charge, setCharge] = useState<number>(0);
  const [freeThreshold, setFreeThreshold] = useState<number>(5000);
  const [estimatedDelivery, setEstimatedDelivery] = useState("2 - 3 Business Days");
  const [active, setActive] = useState(true);

  const handleOpenEdit = (m: ShippingMethod) => {
    setEditingMethod(m);
    setName(m.name);
    setDescription(m.description);
    setCharge(m.charge);
    setFreeThreshold(m.freeThreshold);
    setEstimatedDelivery(m.estimatedDelivery);
    setActive(m.active);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod) return;
    updateShippingMethod(editingMethod.id, {
      name,
      description,
      charge: Number(charge),
      freeThreshold: Number(freeThreshold),
      estimatedDelivery,
      active,
    });
    setEditingMethod(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            EXPRESS BOUTIQUE LOGISTICS
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Shipping Charges & Delivery Rates
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Configure white-glove courier methods, free shipping order thresholds, and estimated transit times.
          </p>
        </div>
      </div>

      {/* Grid of Shipping Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shippingMethods.map((m) => (
          <div
            key={m.id}
            className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl hover:border-gold/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-gold/15 pb-3">
                <div className="p-2 rounded bg-navy border border-gold/20 text-gold">
                  <Truck className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                    m.active
                      ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                      : "bg-navy text-muted border-gold/20"
                  }`}
                >
                  {m.active ? "Active Method" : "Disabled"}
                </span>
              </div>

              <h3 className="font-serif text-lg font-bold text-ivory">{m.name}</h3>
              <p className="text-xs text-muted font-light leading-relaxed">
                {m.description}
              </p>

              <div className="pt-2 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted">Rate Charge:</span>
                  <span className="text-gold font-bold">
                    {m.charge === 0 ? "Complimentary (Rs. 0)" : `Rs. ${m.charge}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted">Free Threshold:</span>
                  <span className="text-ivory">Above Rs. {m.freeThreshold.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted">Estimated Delivery:</span>
                  <span className="text-gold">{m.estimatedDelivery}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gold/15">
              <button
                onClick={() => handleOpenEdit(m)}
                className="w-full py-2 rounded bg-navy border border-gold/30 hover:border-gold text-gold hover:text-ivory font-semibold text-xs font-sans uppercase tracking-wider transition-colors flex items-center justify-center space-x-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Configure Method</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Shipping Method Modal */}
      <Modal
        isOpen={editingMethod !== null}
        onClose={() => setEditingMethod(null)}
        title={`Configure Shipping Method — ${editingMethod?.name || ""}`}
      >
        {editingMethod && (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Method Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Service Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded p-3 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  Base Charge (PKR)
                </label>
                <input
                  type="number"
                  value={charge}
                  onChange={(e) => setCharge(Number(e.target.value))}
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-gold font-mono font-bold focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  Free Shipping Minimum (PKR)
                </label>
                <input
                  type="number"
                  value={freeThreshold}
                  onChange={(e) => setFreeThreshold(Number(e.target.value))}
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Estimated Transit Time
              </label>
              <input
                type="text"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                placeholder="2 - 3 Business Days"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <label className="flex items-center space-x-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-gold/30 bg-navy text-gold focus:ring-0"
              />
              <span className="text-xs text-ivory">Active Method at Checkout</span>
            </label>

            <div className="pt-4 flex justify-end space-x-3 border-t border-gold/15">
              <button
                type="button"
                onClick={() => setEditingMethod(null)}
                className="px-4 py-2 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider"
              >
                Save Configuration
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
