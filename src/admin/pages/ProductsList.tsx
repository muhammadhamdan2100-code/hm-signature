import React, { useState } from "react";
import { useAdminData, type AdminProduct } from "../context/AdminDataContext";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, ConfirmDialog } from "../components/Modal";
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Sparkles,
  Package,
  Droplets,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n/I18nProvider";

export const ProductsList: React.FC = () => {
  const { t } = useI18n();
  const {
    products,
    categories,
    collections,
    contentName,
    deleteProduct,
    bulkDeleteProducts,
    bulkToggleProductStatus,
    duplicateProduct,
  } = useAdminData();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<AdminProduct | null>(null);

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    if (filterGender !== "all" && p.gender !== filterGender) return false;
    if (filterStatus === "active" && !p.active) return false;
    if (filterStatus === "inactive" && p.active) return false;
    if (filterStatus === "lowstock" && p.stock > p.lowStockThreshold) return false;
    return true;
  });

  const categoriesList = Array.from(new Set(products.map((p) => p.category)));
  // Merchandising copy is translated in the database. Rows keep their stored source text so an
  // editor still edits the English source; only what is displayed follows the console language.
  const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]));
  const collectionIdByName = new Map(collections.map((c) => [c.name, c.id]));
  const showCategory = (name: string) => contentName("category", categoryIdByName.get(name), name);
  const showCollection = (name: string) => contentName("collection", collectionIdByName.get(name), name);
  const showGender = (gender: string) => {
    const key = (gender || "").toLowerCase();
    if (key === "men") return t("admin.shared.men");
    if (key === "women") return t("admin.shared.women");
    if (key === "unisex") return t("admin.shared.unisex");
    return gender;
  };

  // Table columns configuration
  const columns: Column<AdminProduct>[] = [
    {
      header: t("admin.products.fragrance"),
      accessor: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded border border-gold/20 bg-navy flex items-center justify-center overflow-hidden shrink-0">
            {p.photos && p.photos[0] ? (
              <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-5 h-5 text-gold" />
            )}
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-ivory tracking-wide">
              {contentName("product", p.id, p.name)}
            </h4>
            <span className="text-[10px] font-mono text-gold/80 block">{p.sku}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.products.categoryGender"),
      accessor: (p) => (
        <div>
          <span className="text-xs text-ivory block font-medium">{showCategory(p.category)}</span>
          <span className="text-[10px] text-muted capitalize">{showGender(p.gender)} • {p.variants?.length ? p.variants.map((v) => v.size).join(" / ") : p.size}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.products.price"),
      accessor: (p) => (
        <div>
          <span className="text-xs font-mono font-semibold text-gold block">
            Rs. {p.price.toLocaleString()}
          </span>
          {p.salePrice && (
            <span className="text-[10px] font-mono text-muted line-through">
              Rs. {p.salePrice.toLocaleString()}
            </span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.products.stockLowestSize"),
      accessor: (p) => {
        const isLow = p.stock <= p.lowStockThreshold;
        return (
          <div>
            <span
              className={`text-xs font-mono font-bold ${
                isLow ? "text-rose-400" : "text-emerald-300"
              }`}
            >
              {t("admin.inventory.units", { count: p.stock })}
            </span>
            {isLow && (
              <span className="text-[9px] uppercase tracking-wider text-rose-400 block">
                {t("admin.status.lowstock")}
              </span>
            )}
          </div>
        );
      },
      sortable: true,
    },
    {
      header: t("admin.shared.status"),
      accessor: (p) => (
        <div className="space-y-1">
          <StatusBadge status={p.active ? "Active" : "Inactive"} />
          {p.featured && (
            <span className="inline-flex items-center text-[9px] font-mono uppercase tracking-wider text-gold bg-gold/10 px-1.5 py-0.5 rounded border border-gold/30 ms-1">
              <Sparkles className="w-2.5 h-2.5 me-0.5" /> {t("admin.collections.featured")}
            </span>
          )}
        </div>
      ),
    },
    {
      header: t("admin.products.actions"),
      accessor: (p) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setQuickViewProduct(p)}
            className="p-1.5 rounded text-muted hover:text-gold hover:bg-navy transition-colors"
            title={t("admin.products.quickViewProductDetails")}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/admin/products/${p.id}`)}
            className="p-1.5 rounded text-muted hover:text-gold hover:bg-navy transition-colors"
            title={t("admin.products.editProduct")}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => duplicateProduct(p.id)}
            className="p-1.5 rounded text-muted hover:text-gold hover:bg-navy transition-colors"
            title={t("admin.products.duplicateProduct")}
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTargetId(p.id)}
            className="p-1.5 rounded text-muted hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            title={t("admin.products.deleteProduct")}
          >
            <Trash2 className="w-4 h-4" />
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
            {t("admin.products.eyebrow")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.products.title")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            {t("admin.products.introBody")}
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/products/new")}
          className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center gap-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("admin.products.addNewPerfume")}</span>
        </button>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        keyExtractor={(p) => p.id}
        selectable={true}
        selectedIds={selectedIds}
        onSelectRow={(id) => {
          setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
          );
        }}
        onSelectAll={(ids) => setSelectedIds(ids)}
        searchPlaceholder={t("admin.products.searchByNameSkuOr")}
        emptyMessage={t("admin.products.noPerfumesFound")}
        emptySubtitle={t("admin.products.tryResettingYourCategoryOr")}
        filterControls={
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-navy border border-gold/20 rounded px-3 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              <option value="all">{t("admin.products.allFamilies")}</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {showCategory(cat)}
                </option>
              ))}
            </select>

            {/* Gender Filter */}
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="bg-navy border border-gold/20 rounded px-3 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              <option value="all">{t("admin.products.allGenders")}</option>
              <option value="men">{t("admin.products.men")}</option>
              <option value="women">{t("admin.products.women")}</option>
              <option value="unisex">{t("admin.products.unisex")}</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-navy border border-gold/20 rounded px-3 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              <option value="all">{t("admin.products.allStatuses")}</option>
              <option value="active">{t("admin.products.activeOnly")}</option>
              <option value="inactive">{t("admin.products.inactiveOnly")}</option>
              <option value="lowstock">{t("admin.products.lowStockOnly")}</option>
            </select>
          </div>
        }
        actions={
          selectedIds.length > 0 ? (
            <div className="flex items-center gap-2 bg-navy p-1 rounded border border-gold/30">
              <span className="text-[11px] font-mono text-gold px-2">
                {t("admin.products.nSelected", { count: selectedIds.length })}
              </span>
              <button
                onClick={() => bulkToggleProductStatus(selectedIds, true)}
                className="p-1 rounded text-emerald-300 hover:bg-emerald-950/60"
                title={t("admin.products.activateSelected")}
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => bulkToggleProductStatus(selectedIds, false)}
                className="p-1 rounded text-amber-300 hover:bg-amber-950/60"
                title={t("admin.products.deactivateSelected")}
              >
                <XCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsBulkDeleteOpen(true)}
                className="p-1 rounded text-rose-400 hover:bg-rose-950/60"
                title={t("admin.products.deleteSelected")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) deleteProduct(deleteTargetId);
        }}
        title={t("admin.products.deleteFragranceRecord")}
        message={t("admin.products.deleteConfirmMessage")}
        confirmText={t("admin.products.deleteProduct2")}
        isDanger={true}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={() => {
          bulkDeleteProducts(selectedIds);
          setSelectedIds([]);
        }}
        title={t("admin.products.deleteNProducts", { count: selectedIds.length })}
        message={t("admin.products.bulkDeleteConfirmMessage", { count: selectedIds.length })}
        confirmText={t("admin.products.deleteAllSelected")}
        isDanger={true}
      />

      {/* Fragrance Quick View Modal */}
      {quickViewProduct && (
        <Modal
          isOpen={Boolean(quickViewProduct)}
          onClose={() => setQuickViewProduct(null)}
          title={quickViewProduct.name}
          subtitle={t("admin.products.skuCategoryLine", {
            sku: quickViewProduct.sku,
            category: quickViewProduct.category,
          })}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Visual */}
              <div className="space-y-3">
                <div className="w-full h-56 rounded-lg bg-navy border border-gold/30 flex items-center justify-center overflow-hidden relative">
                  {quickViewProduct.photos && quickViewProduct.photos[0] ? (
                    <img
                      src={quickViewProduct.photos[0]}
                      alt={quickViewProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center space-y-2">
                      <Package className="w-12 h-12 text-gold mx-auto" />
                      <span className="text-xs text-muted font-serif italic block">
                        {t("admin.products.placeholderCaption")}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 start-3">
                    <StatusBadge status={quickViewProduct.active ? "Active" : "Inactive"} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                  <div className="bg-navy/80 p-2.5 rounded border border-gold/15">
                    <span className="text-[10px] text-muted block uppercase tracking-wider">
                      {t("admin.products.price")}
                    </span>
                    <span className="text-sm font-mono font-bold text-gold">
                      Rs. {quickViewProduct.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-navy/80 p-2.5 rounded border border-gold/15">
                    <span className="text-[10px] text-muted block uppercase tracking-wider">
                      {t("admin.products.inventoryStock")}
                    </span>
                    <span
                      className={`text-sm font-mono font-bold ${
                        quickViewProduct.stock <= quickViewProduct.lowStockThreshold
                          ? "text-rose-400"
                          : "text-emerald-300"
                      }`}
                    >
                      {t("admin.inventory.units", { count: quickViewProduct.stock })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fragrance Architecture Details */}
              <div className="space-y-4 font-sans text-xs">
                <div>
                  <span className="text-[10px] text-gold font-mono uppercase tracking-[2px] block">
                    {t("admin.products.specsClassification")}
                  </span>
                  <div className="mt-1 space-y-1 text-ivory">
                    <p><span className="text-muted">{t("admin.products.collection")}</span> {showCollection(quickViewProduct.collection)}</p>
                    <p><span className="text-muted">{t("admin.products.fragranceType")}</span> {quickViewProduct.fragranceType}</p>
                    <p><span className="text-muted">{t("admin.products.concentration")}</span> {quickViewProduct.concentration}</p>
                    <p><span className="text-muted">{t("admin.products.targetGender")}</span> <span className="capitalize">{showGender(quickViewProduct.gender)}</span></p>
                    <p><span className="text-muted">{t("admin.products.availableSizes")}</span> {quickViewProduct.variants?.length ? quickViewProduct.variants.map((v) => v.size).join(", ") : quickViewProduct.size}</p>
                  </div>
                </div>

                <div className="border-t border-gold/15 pt-3">
                  <span className="text-[10px] text-gold font-mono uppercase tracking-[2px] block flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> {t("admin.products.olfactoryPyramid")}
                  </span>
                  <div className="mt-2 space-y-2 bg-navy/60 p-3 rounded border border-gold/10">
                    <div>
                      <span className="text-[10px] text-gold font-semibold uppercase block">{t("admin.products.topNotes")}</span>
                      <span className="text-ivory font-light">{quickViewProduct.topNotes.join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gold font-semibold uppercase block">{t("admin.products.heartNotes")}</span>
                      <span className="text-ivory font-light">{quickViewProduct.heartNotes.join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gold font-semibold uppercase block">{t("admin.products.baseNotes")}</span>
                      <span className="text-ivory font-light">{quickViewProduct.baseNotes.join(", ")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-gold/15 pt-3">
              <span className="text-[10px] text-gold font-mono uppercase tracking-[2px] block">
                {t("admin.products.descriptionLabel")}
              </span>
              <p className="text-xs text-muted leading-relaxed font-light mt-1">
                {quickViewProduct.description}
              </p>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-gold/15 pt-4">
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="px-4 py-2 rounded text-xs text-muted hover:text-ivory border border-gold/20"
              >
                {t("admin.orderDetail.closePreview")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = quickViewProduct.id;
                  setQuickViewProduct(null);
                  navigate(`/admin/products/${id}`);
                }}
                className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                <span>{t("admin.products.editFullProduct")}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
