import React, { useState } from "react";
import { useAdminData, campaignDisplayState, type Campaign } from "../context/AdminDataContext";
import { Modal, ConfirmDialog } from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";

export const MarketingPage: React.FC = () => {
  const { t } = useI18n();
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
            {t("admin.marketing.eyebrow")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.marketing.title")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            {t("admin.marketing.intro")}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center gap-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("admin.marketing.launchCampaign")}</span>
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
                      {t("admin.coupons.percentOff", { percent: c.discountPercentage })}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-2 font-sans">
                <h3 className="font-serif text-lg font-bold text-ivory group-hover:text-gold transition-colors">
                  {c.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted font-mono">
                  <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>
                    {t("admin.coupons.validPeriodRange", { start: c.startDate, end: c.endDate })}
                  </span>
                </div>
                {!state.live && c.status === "Sending" && (
                  <p className="text-[11px] text-muted font-sans">
                    {t("admin.marketing.outsideWindowNote")}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gold/15 bg-navy/40 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(c)}
                className="px-3 py-1.5 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 transition-colors flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{t("admin.marketing.edit")}</span>
              </button>
              <button
                onClick={() => setDeleteId(c.id)}
                className="px-3 py-1.5 rounded text-xs font-sans text-rose-400 hover:text-rose-200 border border-rose-500/20 hover:bg-rose-950/40 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t("admin.marketing.delete")}</span>
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
        title={editingCampaign ? t("admin.marketing.editTitle") : t("admin.marketing.launchNewTitle")}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              {t("admin.marketing.campaignTitleRequired")}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("admin.marketing.campaignTitlePlaceholder")}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.marketing.startDate")}
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
                {t("admin.marketing.endDate")}
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
                {t("admin.marketing.discountPercentage")}
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
                {t("admin.marketing.campaignStatus")}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Campaign["status"])}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              >
                <option value="Draft">{t("admin.marketing.statusDraftOption")}</option>
                <option value="Scheduled">{t("admin.marketing.statusScheduledOption")}</option>
                <option value="Sending">{t("admin.marketing.statusSendingOption")}</option>
                <option value="Completed">{t("admin.marketing.statusCompletedOption")}</option>
                <option value="Cancelled">{t("admin.status.cancelled")}</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] font-sans text-muted leading-relaxed border-l-2 border-gold/30 ps-3">
            {t("admin.marketing.couponsOnlyNote")}
          </p>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              {t("admin.marketing.bannerTextureStyle")}
            </label>
            <select
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              <option value="texture-wood">{t("admin.marketing.ebonyWood")}</option>
              <option value="texture-velvet">{t("admin.imageUploader.velvetCrimson")}</option>
              <option value="texture-marble-dark">{t("admin.imageUploader.darkMarble")}</option>
              <option value="texture-marble-champagne">{t("admin.imageUploader.champagneMarble")}</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gold/15">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20"
            >
              {t("admin.modal.cancel")}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider"
            >
              {t("admin.marketing.saveCampaign")}
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
        title={t("admin.marketing.deleteCampaignTitle")}
        message={t("admin.marketing.deleteCampaignConfirm")}
        confirmText={t("admin.marketing.deleteCampaign")}
        isDanger={true}
      />
    </div>
  );
};
