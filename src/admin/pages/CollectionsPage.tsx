import React, { useState } from "react";
import { useAdminData, type Collection } from "../context/AdminDataContext";
import { Modal, ConfirmDialog } from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";
import { Plus, Edit, Trash2, Sparkles, Check } from "lucide-react";

export const CollectionsPage: React.FC = () => {
  const { collections, products, addCollection, updateCollection, deleteCollection } =
    useAdminData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("texture-marble-champagne");
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const handleOpenAdd = () => {
    setEditingCollection(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("texture-marble-champagne");
    setFeatured(false);
    setActive(true);
    setSelectedProductIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col: Collection) => {
    setEditingCollection(col);
    setName(col.name);
    setSlug(col.slug);
    setDescription(col.description);
    setImage(col.image);
    setFeatured(col.featured);
    setActive(col.active);
    setSelectedProductIds(col.productIds || []);
    setIsModalOpen(true);
  };

  const handleToggleProduct = (prodId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      description,
      image,
      featured,
      active,
      productIds: selectedProductIds,
    };

    if (editingCollection) {
      updateCollection(editingCollection.id, payload);
    } else {
      addCollection(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            CURATED ANTHOLOGIES
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Boutique Collections & Gift Anthologies
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Manage signature lines (Men's, Women's, Unisex, Oud Collection, Luxury Gift Sets).
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center space-x-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Grid of Collection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((col) => (
          <div
            key={col.id}
            className="bg-navy2/90 border border-gold/20 rounded-lg overflow-hidden shadow-xl hover:border-gold/40 transition-all group flex flex-col justify-between"
          >
            <div>
              {/* Texture Banner */}
              <div className={`h-32 w-full ${col.image} relative p-4 flex flex-col justify-between`}>
                <div className="flex items-center justify-between">
                  <StatusBadge status={col.active ? "Active" : "Inactive"} />
                  {col.featured && (
                    <span className="inline-flex items-center text-[9px] font-mono uppercase tracking-wider text-navy bg-gold px-2 py-0.5 rounded font-bold">
                      <Sparkles className="w-3 h-3 mr-1" /> Featured
                    </span>
                  )}
                </div>
                <div className="bg-navy/80 backdrop-blur border border-gold/30 px-3 py-1 rounded self-start">
                  <span className="text-[10px] font-mono text-gold uppercase tracking-wider">
                    {col.productIds?.length || 0} Fragrances Assigned
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-2 font-sans">
                <h3 className="font-serif text-lg font-bold text-ivory group-hover:text-gold transition-colors">
                  {col.name}
                </h3>
                <p className="text-[11px] font-mono text-gold/80">/{col.slug}</p>
                <p className="text-xs text-muted font-light leading-relaxed">
                  {col.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gold/15 bg-navy/40 flex items-center justify-end space-x-2">
              <button
                onClick={() => handleOpenEdit(col)}
                className="px-3 py-1.5 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 transition-colors flex items-center space-x-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit & Assign</span>
              </button>
              <button
                onClick={() => setDeleteId(col.id)}
                className="px-3 py-1.5 rounded text-xs font-sans text-rose-400 hover:text-rose-200 border border-rose-500/20 hover:bg-rose-950/40 transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCollection ? "Edit Fragrance Collection" : "Create New Collection"}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Collection Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingCollection) {
                    setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                  }
                }}
                placeholder="e.g. Oud Collection"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="oud-collection"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Precious Royal Oud oils blended with saffron..."
              className="w-full bg-navy border border-gold/30 rounded p-3 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              Texture Theme
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

          <div className="flex items-center space-x-6 py-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-gold/30 bg-navy text-gold focus:ring-0"
              />
              <span className="text-xs text-ivory">Active Collection</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded border-gold/30 bg-navy text-gold focus:ring-0"
              />
              <span className="text-xs text-ivory">Featured on Homepage Grid</span>
            </label>
          </div>

          {/* Product Selector List */}
          <div className="border-t border-gold/15 pt-4">
            <label className="block text-xs font-sans text-gold uppercase tracking-wider font-semibold mb-2">
              Assign Fragrances to Collection ({selectedProductIds.length} Selected)
            </label>

            <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded bg-navy border border-gold/20">
              {products.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => handleToggleProduct(p.id)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? "bg-navy2 border border-gold/40 text-ivory"
                        : "hover:bg-navy2/50 text-muted"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected
                            ? "bg-gold border-gold text-navy"
                            : "border-gold/30 bg-navy"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-semibold text-ivory">{p.name}</span>
                      <span className="text-[10px] font-mono text-gold/80">({p.sku})</span>
                    </div>
                    <span className="font-mono text-gold">Rs. {p.price.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
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
              Save Collection
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteCollection(deleteId);
        }}
        title="Delete Fragrance Collection"
        message="Are you sure you want to delete this collection?"
        confirmText="Delete Collection"
        isDanger={true}
      />
    </div>
  );
};
