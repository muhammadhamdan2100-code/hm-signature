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

export const ProductsList: React.FC = () => {
  const {
    products,
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

  // Table columns configuration
  const columns: Column<AdminProduct>[] = [
    {
      header: "Fragrance",
      accessor: (p) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded border border-gold/20 bg-navy flex items-center justify-center overflow-hidden shrink-0">
            {p.photos && p.photos[0] ? (
              <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-5 h-5 text-gold" />
            )}
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-ivory tracking-wide">
              {p.name}
            </h4>
            <span className="text-[10px] font-mono text-gold/80 block">{p.sku}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Category & Gender",
      accessor: (p) => (
        <div>
          <span className="text-xs text-ivory block font-medium">{p.category}</span>
          <span className="text-[10px] text-muted capitalize">{p.gender} • {p.variants?.length ? p.variants.map((v) => v.size).join(" / ") : p.size}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Price",
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
      header: "Stock (lowest size)",
      accessor: (p) => {
        const isLow = p.stock <= p.lowStockThreshold;
        return (
          <div>
            <span
              className={`text-xs font-mono font-bold ${
                isLow ? "text-rose-400" : "text-emerald-300"
              }`}
            >
              {p.stock} units
            </span>
            {isLow && (
              <span className="text-[9px] uppercase tracking-wider text-rose-400 block">
                Low Stock
              </span>
            )}
          </div>
        );
      },
      sortable: true,
    },
    {
      header: "Status",
      accessor: (p) => (
        <div className="space-y-1">
          <StatusBadge status={p.active ? "Active" : "Inactive"} />
          {p.featured && (
            <span className="inline-flex items-center text-[9px] font-mono uppercase tracking-wider text-gold bg-gold/10 px-1.5 py-0.5 rounded border border-gold/30 ml-1">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Featured
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (p) => (
        <div className="flex items-center space-x-1.5 justify-end">
          <button
            onClick={() => setQuickViewProduct(p)}
            className="p-1.5 rounded text-muted hover:text-gold hover:bg-navy transition-colors"
            title="Quick view product details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/admin/products/${p.id}`)}
            className="p-1.5 rounded text-muted hover:text-gold hover:bg-navy transition-colors"
            title="Edit product"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => duplicateProduct(p.id)}
            className="p-1.5 rounded text-muted hover:text-gold hover:bg-navy transition-colors"
            title="Duplicate product"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTargetId(p.id)}
            className="p-1.5 rounded text-muted hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            title="Delete product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            CATALOG CONTROL
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Fragrance Products Directory
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Manage luxury perfumes, stock levels, pricing, notes, and collection assignments.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/products/new")}
          className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center space-x-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Perfume</span>
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
        searchPlaceholder="Search by name, SKU, or category..."
        emptyMessage="No perfumes found"
        emptySubtitle="Try resetting your category or status filters, or add a new fragrance to the catalog."
        filterControls={
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-navy border border-gold/20 rounded px-3 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              <option value="all">All Families</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Gender Filter */}
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="bg-navy border border-gold/20 rounded px-3 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              <option value="all">All Genders</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-navy border border-gold/20 rounded px-3 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="lowstock">Low Stock Only</option>
            </select>
          </div>
        }
        actions={
          selectedIds.length > 0 ? (
            <div className="flex items-center space-x-2 bg-navy p-1 rounded border border-gold/30">
              <span className="text-[11px] font-mono text-gold px-2">
                {selectedIds.length} Selected
              </span>
              <button
                onClick={() => bulkToggleProductStatus(selectedIds, true)}
                className="p-1 rounded text-emerald-300 hover:bg-emerald-950/60"
                title="Activate Selected"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => bulkToggleProductStatus(selectedIds, false)}
                className="p-1 rounded text-amber-300 hover:bg-amber-950/60"
                title="Deactivate Selected"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsBulkDeleteOpen(true)}
                className="p-1 rounded text-rose-400 hover:bg-rose-950/60"
                title="Delete Selected"
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
        title="Delete Fragrance Record"
        message="Are you sure you want to delete this perfume from the catalog? This action cannot be undone."
        confirmText="Delete Product"
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
        title={`Delete ${selectedIds.length} Products`}
        message={`Are you sure you want to permanently delete these ${selectedIds.length} products?`}
        confirmText="Delete All Selected"
        isDanger={true}
      />

      {/* Fragrance Quick View Modal */}
      {quickViewProduct && (
        <Modal
          isOpen={Boolean(quickViewProduct)}
          onClose={() => setQuickViewProduct(null)}
          title={quickViewProduct.name}
          subtitle={`SKU: ${quickViewProduct.sku} • ${quickViewProduct.category}`}
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
                        HM Signature Extrait De Parfum
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <StatusBadge status={quickViewProduct.active ? "Active" : "Inactive"} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                  <div className="bg-navy/80 p-2.5 rounded border border-gold/15">
                    <span className="text-[10px] text-muted block uppercase tracking-wider">
                      Price
                    </span>
                    <span className="text-sm font-mono font-bold text-gold">
                      Rs. {quickViewProduct.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-navy/80 p-2.5 rounded border border-gold/15">
                    <span className="text-[10px] text-muted block uppercase tracking-wider">
                      Inventory Stock
                    </span>
                    <span
                      className={`text-sm font-mono font-bold ${
                        quickViewProduct.stock <= quickViewProduct.lowStockThreshold
                          ? "text-rose-400"
                          : "text-emerald-300"
                      }`}
                    >
                      {quickViewProduct.stock} units
                    </span>
                  </div>
                </div>
              </div>

              {/* Fragrance Architecture Details */}
              <div className="space-y-4 font-sans text-xs">
                <div>
                  <span className="text-[10px] text-gold font-mono uppercase tracking-[2px] block">
                    SPECS & CLASSIFICATION
                  </span>
                  <div className="mt-1 space-y-1 text-ivory">
                    <p><span className="text-muted">Collection:</span> {quickViewProduct.collection}</p>
                    <p><span className="text-muted">Fragrance Type:</span> {quickViewProduct.fragranceType}</p>
                    <p><span className="text-muted">Concentration:</span> {quickViewProduct.concentration}</p>
                    <p><span className="text-muted">Target Gender:</span> <span className="capitalize">{quickViewProduct.gender}</span></p>
                    <p><span className="text-muted">Available Sizes:</span> {quickViewProduct.variants?.length ? quickViewProduct.variants.map((v) => v.size).join(", ") : quickViewProduct.size}</p>
                  </div>
                </div>

                <div className="border-t border-gold/15 pt-3">
                  <span className="text-[10px] text-gold font-mono uppercase tracking-[2px] block flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> OLFACTORY PYRAMID
                  </span>
                  <div className="mt-2 space-y-2 bg-navy/60 p-3 rounded border border-gold/10">
                    <div>
                      <span className="text-[10px] text-gold font-semibold uppercase block">Top Notes:</span>
                      <span className="text-ivory font-light">{quickViewProduct.topNotes.join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gold font-semibold uppercase block">Heart Notes:</span>
                      <span className="text-ivory font-light">{quickViewProduct.heartNotes.join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gold font-semibold uppercase block">Base Notes:</span>
                      <span className="text-ivory font-light">{quickViewProduct.baseNotes.join(", ")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-gold/15 pt-3">
              <span className="text-[10px] text-gold font-mono uppercase tracking-[2px] block">
                DESCRIPTION
              </span>
              <p className="text-xs text-muted leading-relaxed font-light mt-1">
                {quickViewProduct.description}
              </p>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-end space-x-3 border-t border-gold/15 pt-4">
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="px-4 py-2 rounded text-xs text-muted hover:text-ivory border border-gold/20"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = quickViewProduct.id;
                  setQuickViewProduct(null);
                  navigate(`/admin/products/${id}`);
                }}
                className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs uppercase tracking-wider transition-colors flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Full Product</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
