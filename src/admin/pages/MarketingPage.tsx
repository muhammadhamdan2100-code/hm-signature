import React, { useState } from "react";
import { useAdminData, campaignDisplayState, type Campaign } from "../context/AdminDataContext";
import { Modal, ConfirmDialog } from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";

export const MarketingPage: React.FC = () => {
  const { campaigns, addCampaign, updateCampaign, deleteCampaign } =
    useAdminData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-10-15");
  const [discountPercentage, setDiscountPercentage] = useState<number>(15);
  const [bannerImage, setBannerImage] = useState("texture-wood");
  const [status, setStatus] = useState<Campaign["status"]>("Draft");

  const handleOpenAdd = () => {
    setEditingCampaign(null);
    setName("");
    setStartDate("2026-10-01");
    setEndDate("2026-10-15");
    setDiscountPercentage(15);
    setBannerImage("texture-wood");
    setStatus("Draft");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Campaign) => {
    setEditingCampaign(c);
    setName(c.name);
    setStartDate(c.startDate);
    setEndDate(c.endDate);
    setDiscountPercentage(c.discountPercentage);
    setBannerImage(c.bannerImage);
    setStatus(c.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      startDate,
      endDate,
      discountPercentage: Number(discountPercentage),
      bannerImage,
      status,
      targetProducts: [],
    };

    if (editingCampaign) {
      updateCampaign(editingCampaign.id, payload);
    } else {
      addCampaign(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            CAMPAIGNS & PROMOTIONAL BANNERS
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Marketing & Private Atelier Campaigns
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Launch seasonal sales, flash campaigns, and homepage promotional spotlight banners.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center space-x-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Campaign</span>
        </button>
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((c) => {
          const state = campaignDisplayState(c);
          return (
          <div
            key={c.id}
            className="bg-navy2/90 border border-gold/20 rounded-lg overflow-hidden shadow-xl hover:border-gold/40 transition-all group flex flex-col justify-between"
          >
            <div>
              {/* Banner Texture Header */}
              <div className={`h-28 w-full ${c.bannerImage} relative p-4 flex flex-col justify-between`}>
                <div className="flex items-center justify-between">
                  <StatusBadge status={state.label} />
                  {state.live && (
                    <span className="text-xs font-mono font-bold text-navy bg-gold px-2.5 py-0.5 rounded shadow">
                      {c.discountPercentage}% OFF
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-2 font-sans">
                <h3 className="font-serif text-lg font-bold text-ivory group-hover:text-gold transition-colors">
                  {c.name}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-muted font-mono">
                  <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>
                    {c.startDate} to {c.endDate}
                  </span>
                </div>
                {!state.live && c.status === "Sending" && (
                  <p className="text-[11px] text-muted font-sans">
                    Recorded as sending but outside its date window — not presented as an offer.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gold/15 bg-navy/40 flex items-center justify-end space-x-2">
              <button
                onClick={() => handleOpenEdit(c)}
                className="px-3 py-1.5 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 transition-colors flex items-center space-x-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setDeleteId(c.id)}
                className="px-3 py-1.5 rounded text-xs font-sans text-rose-400 hover:text-rose-200 border border-rose-500/20 hover:bg-rose-950/40 transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCampaign ? "Edit Marketing Campaign" : "Launch New Campaign"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              Campaign Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Autumn Private Atelier Sale"
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            />
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
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Discount Percentage (%)
              </label>
              <input
                type="number"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-gold font-mono font-bold focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Campaign Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Campaign["status"])}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              >
                <option value="Draft">Draft — not presented anywhere</option>
                <option value="Scheduled">Scheduled — starts on its start date</option>
                <option value="Sending">Sending — live inside its date window</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] font-sans text-muted leading-relaxed border-l-2 border-gold/30 pl-3">
            Coupons are the only thing that changes a price. A campaign recorded here is an
            internal plan: it does not discount a product until a matching coupon is created in
            Coupons, and checkout totals are always recalculated server-side.
          </p>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              Banner Texture Style
            </label>
            <select
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              <option value="texture-wood">Ebony Wood</option>
              <option value="texture-velvet">Velvet Crimson</option>
              <option value="texture-marble-dark">Dark Marble</option>
              <option value="texture-marble-champagne">Champagne Marble</option>
            </select>
          </div>

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
              Save Campaign
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteCampaign(deleteId);
        }}
        title="Delete Marketing Campaign"
        message="Are you sure you want to delete this campaign?"
        confirmText="Delete Campaign"
        isDanger={true}
      />
    </div>
  );
};
