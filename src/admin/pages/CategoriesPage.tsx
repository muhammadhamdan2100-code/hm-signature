import React, { useState } from "react";
import { useAdminData, type Category } from "../context/AdminDataContext";
import { Modal, ConfirmDialog } from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";

export const CategoriesPage: React.FC = () => {
  const { t } = useI18n();
  const { categories, addCategory, updateCategory, deleteCategory, contentName } = useAdminData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("texture-velvet");
  const [active, setActive] = useState(true);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("texture-velvet");
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setImage(cat.image);
    setActive(cat.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        description,
        image,
        active,
      });
    } else {
      addCategory({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        description,
        image,
        active,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            {t("admin.categories.olfactoryTaxonomy")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.categories.fragranceFamiliesCategories")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            {t("admin.categories.organizeExtraitsDeParfum")}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center gap-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("admin.categories.newCategory")}</span>
        </button>
      </div>

      {/* Grid of Categories Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-navy2/90 border border-gold/20 rounded-lg overflow-hidden shadow-xl hover:border-gold/40 transition-all group flex flex-col justify-between"
          >
            <div>
              {/* Image Banner */}
              <div className={`h-28 w-full ${cat.image} relative p-4 flex items-end`}>
                <div className="absolute top-3 end-3 flex items-center gap-2">
                  <StatusBadge status={cat.active ? "Active" : "Inactive"} />
                </div>
                <div className="bg-navy/80 backdrop-blur border border-gold/30 px-3 py-1 rounded">
                  <span className="text-[10px] font-mono text-gold uppercase tracking-wider">
                    {t("admin.categories.productsCount", { count: cat.productCount })}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-2 font-sans">
                <h3 className="font-serif text-lg font-bold text-ivory group-hover:text-gold transition-colors">
                  {contentName("category", cat.id, cat.name)}
                </h3>
                <p className="text-[11px] font-mono text-gold/80">/{cat.slug}</p>
                <p className="text-xs text-muted font-light leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gold/15 bg-navy/40 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="px-3 py-1.5 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 transition-colors flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{t("admin.categories.edit")}</span>
              </button>
              <button
                onClick={() => setDeleteId(cat.id)}
                className="px-3 py-1.5 rounded text-xs font-sans text-rose-400 hover:text-rose-200 border border-rose-500/20 hover:bg-rose-950/40 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t("admin.categories.delete")}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? t("admin.categories.editOlfactoryCategory") : t("admin.categories.createFragranceFamily")}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              {t("admin.categories.categoryNameRequired")}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingCategory) {
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }
              }}
              placeholder={t("admin.categories.woodyOrientalPlaceholder")}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              {t("admin.categories.slug")}
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="woody-oriental"
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              {t("admin.categories.description")}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("admin.categories.sensualFloralBouquets")}
              className="w-full bg-navy border border-gold/30 rounded p-3 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              {t("admin.categories.textureThemeBanner")}
            </label>
            <select
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              <option value="texture-velvet">{t("admin.categories.velvetCrimson")}</option>
              <option value="texture-marble-dark">{t("admin.categories.darkObsidianMarble")}</option>
              <option value="texture-marble-champagne">{t("admin.categories.champagneMarble")}</option>
              <option value="texture-stone-beige">{t("admin.categories.stoneBeige")}</option>
              <option value="texture-wood">{t("admin.categories.ebonyWood")}</option>
              <option value="texture-navy">{t("admin.categories.midnightNavy")}</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-gold/30 bg-navy text-gold focus:ring-0"
            />
            <span className="text-xs text-ivory">{t("admin.categories.activeInBoutiqueNavbar")}</span>
          </label>

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
              {t("admin.categories.saveCategory")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteCategory(deleteId);
        }}
        title={t("admin.categories.deleteOlfactoryCategory")}
        message={t("admin.categories.deleteCategoryConfirm")}
        confirmText={t("admin.categories.deleteCategory")}
        isDanger={true}
      />
    </div>
  );
};
