import React, { useState } from "react";
import { useAdminData, type Category } from "../context/AdminDataContext";
import { Modal, ConfirmDialog } from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";
import { Plus, Edit, Trash2 } from "lucide-react";

export const CategoriesPage: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useAdminData();

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
            OLFACTORY TAXONOMY
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Fragrance Families & Categories
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Organize extraits de parfum into Woody Oriental, Floral Amber, Fresh Woods, and spicy gourmands.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center space-x-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
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
                <div className="absolute top-3 right-3 flex items-center space-x-2">
                  <StatusBadge status={cat.active ? "Active" : "Inactive"} />
                </div>
                <div className="bg-navy/80 backdrop-blur border border-gold/30 px-3 py-1 rounded">
                  <span className="text-[10px] font-mono text-gold uppercase tracking-wider">
                    {cat.productCount} Products
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-2 font-sans">
                <h3 className="font-serif text-lg font-bold text-ivory group-hover:text-gold transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] font-mono text-gold/80">/{cat.slug}</p>
                <p className="text-xs text-muted font-light leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gold/15 bg-navy/40 flex items-center justify-end space-x-2">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="px-3 py-1.5 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 transition-colors flex items-center space-x-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setDeleteId(cat.id)}
                className="px-3 py-1.5 rounded text-xs font-sans text-rose-400 hover:text-rose-200 border border-rose-500/20 hover:bg-rose-950/40 transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Olfactory Category" : "Create Fragrance Family"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              Category Name *
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
              placeholder="e.g. Woody Oriental"
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              Slug
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
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sensual floral bouquets layered over warm golden vanilla..."
              className="w-full bg-navy border border-gold/30 rounded p-3 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              Texture Theme Banner
            </label>
            <select
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              <option value="texture-velvet">Velvet Crimson</option>
              <option value="texture-marble-dark">Dark Obsidian Marble</option>
              <option value="texture-marble-champagne">Champagne Marble</option>
              <option value="texture-stone-beige">Stone Beige</option>
              <option value="texture-wood">Ebony Wood</option>
              <option value="texture-navy">Midnight Navy</option>
            </select>
          </div>

          <label className="flex items-center space-x-3 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-gold/30 bg-navy text-gold focus:ring-0"
            />
            <span className="text-xs text-ivory">Active in Boutique Navbar</span>
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
              Save Category
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
        title="Delete Olfactory Category"
        message="Are you sure you want to delete this fragrance category?"
        confirmText="Delete Category"
        isDanger={true}
      />
    </div>
  );
};
