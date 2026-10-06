import React, { useState } from "react";
import { useAdminData, type SeoEntry } from "../context/AdminDataContext";
import { DataTable, type Column } from "../components/DataTable";
import { GoogleSeoPreview } from "../components/GoogleSeoPreview";
import { Modal } from "../components/Modal";
import { Edit } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";

export const SeoPage: React.FC = () => {
  const { t } = useI18n();
  const { seoEntries, updateSeoEntry } = useAdminData();

  const [editingEntry, setEditingEntry] = useState<SeoEntry | null>(null);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImage, setOgImage] = useState("");

  const handleOpenEdit = (entry: SeoEntry) => {
    setEditingEntry(entry);
    setMetaTitle(entry.metaTitle);
    setMetaDescription(entry.metaDescription);
    setCanonicalUrl(entry.canonicalUrl);
    setOgImage(entry.ogImage);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    updateSeoEntry(editingEntry.id, {
      metaTitle,
      metaDescription,
      canonicalUrl,
      ogImage,
    });
    setEditingEntry(null);
  };

  const columns: Column<SeoEntry>[] = [
    {
      header: t("admin.seo.pageTarget"),
      accessor: (s) => (
        <div>
          <h4 className="font-serif font-bold text-sm text-ivory">{s.page}</h4>
          <span className="text-[10px] font-mono text-gold">{s.path}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.seo.googleMetaTitle"),
      accessor: (s) => (
        <span className="text-xs font-sans text-ivory line-clamp-1 max-w-xs">
          {s.metaTitle}
        </span>
      ),
    },
    {
      header: t("admin.seo.metaDescription"),
      accessor: (s) => (
        <p className="text-xs text-muted font-light line-clamp-1 max-w-md">
          {s.metaDescription}
        </p>
      ),
    },
    {
      header: t("admin.seo.canonicalUrl"),
      accessor: (s) => (
        <span className="text-[11px] font-mono text-emerald-400 truncate max-w-[150px] block">
          {s.canonicalUrl}
        </span>
      ),
    },
    {
      header: t("admin.seo.action"),
      accessor: (s) => (
        <div className="flex items-center justify-end">
          <button
            onClick={() => handleOpenEdit(s)}
            className="px-3 py-1.5 rounded bg-navy border border-gold/30 hover:border-gold text-gold hover:text-ivory text-xs font-sans transition-colors flex items-center gap-1"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{t("admin.seo.manageSeo")}</span>
          </button>
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
            {t("admin.seo.eyebrow")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.seo.title")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            {t("admin.seo.introBody")}
          </p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={seoEntries}
        keyExtractor={(s) => s.id}
        searchPlaceholder={t("admin.seo.searchPageNameMetaTitle")}
        emptyMessage={t("admin.seo.noSeoRecords")}
      />

      {/* Edit SEO Modal */}
      <Modal
        isOpen={editingEntry !== null}
        onClose={() => setEditingEntry(null)}
        title={t("admin.seo.editSeoMetadataNamed", { name: editingEntry?.page || "" })}
        maxWidth="xl"
      >
        {editingEntry && (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.seo.googleSearchTitleTagRequired")}
              </label>
              <input
                type="text"
                required
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.seo.googleMetaDescriptionRequired")}
              </label>
              <textarea
                rows={3}
                required
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded p-3 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  {t("admin.seo.canonicalLinkUrl")}
                </label>
                <input
                  type="text"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  {t("admin.seo.socialOpenGraphImageUrl")}
                </label>
                <input
                  type="text"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            {/* Snippet Preview */}
            <div className="pt-2">
              <GoogleSeoPreview
                title={metaTitle}
                description={metaDescription}
                url={canonicalUrl}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gold/15">
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20"
              >
                {t("admin.modal.cancel")}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider"
              >
                {t("admin.seo.saveSeoMetadata")}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
