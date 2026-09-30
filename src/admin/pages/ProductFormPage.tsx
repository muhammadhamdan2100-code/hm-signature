import React, { useState, useEffect } from "react";
import { useAdminData, type AdminProduct } from "../context/AdminDataContext";
import { type ProductVariant, generateDefaultVariants, roundCleanPrice } from "../../data/products";
import { ImageUploader } from "../components/ImageUploader";
import { GoogleSeoPreview } from "../components/GoogleSeoPreview";
import { Breadcrumb } from "../components/Breadcrumb";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export const ProductFormPage: React.FC = () => {
  const { products, categories, collections, addProduct, updateProduct } = useAdminData();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditing = Boolean(id && id !== "new");
  const existingProduct = products.find((p) => p.id === id);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState<number>(3500);
  const [salePrice, setSalePrice] = useState<number | undefined>(undefined);
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState(categories[0]?.name || "Woody Oriental");
  const [collection, setCollection] = useState(collections[0]?.name || "Unisex Collection");
  const [gender, setGender] = useState<"men" | "women" | "unisex">("unisex");
  const [fragranceType, setFragranceType] = useState("Extrait de Parfum");
  const [size, setSize] = useState("50ml");
  const [concentration, setConcentration] = useState("Extrait de Parfum (25-30% Oil)");
  const [stock, setStock] = useState<number>(50);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);

  const [topNotes, setTopNotes] = useState<string>("Bergamot, Saffron, Pink Pepper");
  const [heartNotes, setHeartNotes] = useState<string>("Bulgarian Rose, Oud Wood, Cedar");
  const [baseNotes, setBaseNotes] = useState<string>("Amber, Vanilla, Leather");

  const [description, setDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [images, setImages] = useState<string[]>(["texture-velvet"]);
  const [photos, setPhotos] = useState<string[]>([]);

  const [featured, setFeatured] = useState(false);
  const [bestseller, setBestseller] = useState(false);
  const [newArrival, setNewArrival] = useState(true);
  const [active, setActive] = useState(true);

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  // Bottle Sizes / ML Variants State
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Populate data if editing
  useEffect(() => {
    if (isEditing && existingProduct) {
      setName(existingProduct.name);
      setSlug(existingProduct.slug);
      setPrice(existingProduct.price);
      setSalePrice(existingProduct.salePrice);
      setSku(existingProduct.sku);
      setCategory(existingProduct.category);
      setCollection(existingProduct.collection);
      setGender(existingProduct.gender);
      setFragranceType(existingProduct.fragranceType);
      setSize(existingProduct.size);
      setConcentration(existingProduct.concentration);
      setStock(existingProduct.stock);
      setLowStockThreshold(existingProduct.lowStockThreshold);
      setTopNotes(existingProduct.topNotes.join(", "));
      setHeartNotes(existingProduct.heartNotes.join(", "));
      setBaseNotes(existingProduct.baseNotes.join(", "));
      setDescription(existingProduct.description);
      setFullDescription(existingProduct.fullDescription);
      setImages(existingProduct.images);
      setPhotos(existingProduct.photos || []);
      setFeatured(existingProduct.featured);
      setBestseller(existingProduct.bestseller);
      setNewArrival(existingProduct.newArrival);
      setActive(existingProduct.active);
      setSeoTitle(existingProduct.seoTitle || `${existingProduct.name} — HM Signature`);
      setSeoDescription(existingProduct.seoDescription || existingProduct.description);

      if (existingProduct.variants && existingProduct.variants.length > 0) {
        setVariants(existingProduct.variants);
      } else {
        setVariants(generateDefaultVariants(existingProduct.price, existingProduct.sku, existingProduct.stock));
      }
    } else if (!isEditing) {
      setVariants(generateDefaultVariants(price, sku || "HM-PRD", stock));
    }
  }, [isEditing, existingProduct]);

  // Auto generate slug & SKU from name if creating
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generatedSlug);
      const generatedSku = `HM-${val.slice(0, 3).toUpperCase()}-100`;
      setSku(generatedSku);
      setSeoTitle(`${val} — HM Signature Extrait de Parfum`);
    }
  };

  // Update base price & sync 50ml variant price
  const handlePriceChange = (newPrice: number) => {
    setPrice(newPrice);
    setVariants((prev) =>
      prev.map((v) => (v.size.toLowerCase() === "50ml" ? { ...v, price: newPrice } : v))
    );
  };

  // Variant Editor Handlers
  const handleUpdateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // If updating 50ml price, sync base product price
      if (field === "price" && updated[index].size.toLowerCase() === "50ml") {
        setPrice(Number(value));
      }
      return updated;
    });
  };

  const handleAddVariant = (presetSize: string = "100ml") => {
    const defaultPrice =
      presetSize.toLowerCase() === "10ml"
        ? roundCleanPrice(price * 0.3)
        : presetSize.toLowerCase() === "30ml"
        ? roundCleanPrice(price * 0.7)
        : presetSize.toLowerCase() === "50ml"
        ? price
        : roundCleanPrice(price * 1.7);

    const newV: ProductVariant = {
      id: "v-" + Date.now() + Math.random().toString(36).substring(2, 5),
      size: presetSize,
      price: defaultPrice,
      sku: `${sku || "HM-PRD"}-${presetSize.toUpperCase()}`,
      stock: stock || 30,
      active: true,
    };
    setVariants((prev) => [...prev, newV]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parseNotes = (str: string) =>
      str.split(",").map((s) => s.trim()).filter(Boolean);

    const productPayload: Omit<AdminProduct, "id" | "createdAt"> = {
      name,
      slug,
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : undefined,
      sku: sku || `HM-${name.slice(0, 3).toUpperCase()}-100`,
      category,
      collection,
      gender,
      fragranceType,
      size,
      concentration,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      topNotes: parseNotes(topNotes),
      heartNotes: parseNotes(heartNotes),
      baseNotes: parseNotes(baseNotes),
      description,
      fullDescription: fullDescription || description,
      images,
      photos,
      featured,
      bestseller,
      newArrival,
      active,
      seoTitle: seoTitle || `${name} — HM Signature`,
      seoDescription: seoDescription || description,
      variants,
    };

    if (isEditing && existingProduct) {
      updateProduct(existingProduct.id, productPayload);
    } else {
      addProduct(productPayload);
    }

    navigate("/admin/products");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in max-w-5xl mx-auto font-sans">
      <Breadcrumb
        items={[
          { label: "Products", path: "/admin/products" },
          { label: isEditing ? name || "Edit Product" : "New Fragrance" },
        ]}
      />

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="p-2 rounded text-muted hover:text-gold hover:bg-navy2 transition-colors border border-gold/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
              {isEditing ? "EDIT FRAGRANCE RECORD" : "CREATE NEW FRAGRANCE"}
            </span>
            <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight">
              {isEditing ? `Editing "${name}"` : "Add Signature Extrait"}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="px-4 py-2 rounded text-xs uppercase tracking-wider text-muted hover:text-ivory border border-gold/20 hover:border-gold/40"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs uppercase tracking-wider transition-colors flex items-center space-x-2 shadow-lg"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? "Save Changes" : "Publish Fragrance"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Column (Main Information & Variants Editor) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              Fragrance Identity & Nomenclature
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Royal Amber Oud"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="royal-amber-oud"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  Base SKU Code *
                </label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="HM-ROU-100"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  Fragrance Family / Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                Short Teaser Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A rich, magnetic blend of oud and amber..."
                className="w-full bg-navy border border-gold/30 rounded p-3 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                Full Atelier Story & Formulation
              </label>
              <textarea
                rows={4}
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="Handcrafted in small batches using rare botanical extracts..."
                className="w-full bg-navy border border-gold/30 rounded p-3 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          {/* Bottle Sizes & ML Variants Manager */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gold/15 pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-ivory">
                  Bottle Sizes & ML Variants
                </h3>
                <p className="text-xs text-muted font-light">
                  Manage variant prices, sale prices, SKUs, stock limits, and active availability for each size.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAddVariant("100ml")}
                className="px-3 py-1.5 bg-gold/15 border border-gold/30 text-gold hover:bg-gold hover:text-navy rounded text-xs uppercase font-bold transition-all flex items-center space-x-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Size</span>
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted text-[10px] uppercase font-mono">Add Preset Size:</span>
              {["10ml", "30ml", "50ml", "100ml"].map((pz) => {
                const exists = variants.some((v) => v.size.toLowerCase() === pz.toLowerCase());
                return (
                  <button
                    key={pz}
                    type="button"
                    disabled={exists}
                    onClick={() => handleAddVariant(pz)}
                    className={`px-2.5 py-1 rounded border text-[11px] font-mono transition-all ${
                      exists
                        ? "bg-navy/40 border-gold/10 text-muted/40 cursor-not-allowed"
                        : "bg-navy border-gold/30 text-gold hover:bg-gold/15 hover:border-gold"
                    }`}
                  >
                    {exists ? `✓ ${pz}` : `+ ${pz}`}
                  </button>
                );
              })}
            </div>

            {/* Variants Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy text-gold uppercase tracking-wider text-[10px] border-b border-gold/15">
                  <tr>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Price (PKR)</th>
                    <th className="py-2.5 px-3">Sale Price</th>
                    <th className="py-2.5 px-3">Variant SKU</th>
                    <th className="py-2.5 px-3">Stock</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10 text-ivory">
                  {variants.map((v, idx) => (
                    <tr key={v.id || idx} className="hover:bg-navy/40 transition-colors">
                      {/* Size */}
                      <td className="py-2.5 px-3 w-28">
                        <input
                          type="text"
                          required
                          value={v.size}
                          onChange={(e) => handleUpdateVariant(idx, "size", e.target.value)}
                          className="w-full bg-navy border border-gold/20 rounded px-2 py-1 text-xs text-gold font-mono font-bold focus:outline-none focus:border-gold"
                        />
                      </td>
                      {/* Price */}
                      <td className="py-2.5 px-3 w-32">
                        <input
                          type="number"
                          required
                          value={v.price}
                          onChange={(e) => handleUpdateVariant(idx, "price", Number(e.target.value))}
                          className="w-full bg-navy border border-gold/20 rounded px-2 py-1 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                        />
                      </td>
                      {/* Sale Price */}
                      <td className="py-2.5 px-3 w-32">
                        <input
                          type="number"
                          value={v.salePrice || ""}
                          onChange={(e) =>
                            handleUpdateVariant(idx, "salePrice", e.target.value ? Number(e.target.value) : undefined)
                          }
                          placeholder="Optional"
                          className="w-full bg-navy border border-gold/20 rounded px-2 py-1 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                        />
                      </td>
                      {/* SKU */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => handleUpdateVariant(idx, "sku", e.target.value)}
                          placeholder="SKU"
                          className="w-full bg-navy border border-gold/20 rounded px-2 py-1 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                        />
                      </td>
                      {/* Stock */}
                      <td className="py-2.5 px-3 w-24">
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => handleUpdateVariant(idx, "stock", Number(e.target.value))}
                          className="w-full bg-navy border border-gold/20 rounded px-2 py-1 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                        />
                      </td>
                      {/* Status Toggle */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={v.active !== false}
                          onChange={(e) => handleUpdateVariant(idx, "active", e.target.checked)}
                          className="rounded border-gold/30 bg-navy text-gold focus:ring-0 cursor-pointer"
                        />
                      </td>
                      {/* Remove Action */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-1 text-muted hover:text-rose-400 transition-colors"
                          title="Remove size variant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Olfactory Pyramid (Notes) */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              Olfactory Pyramid (Fragrance Notes)
            </h3>
            <p className="text-xs text-muted font-light">
              Comma-separated list of key essence notes.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gold mb-1 uppercase tracking-wider font-semibold">
                  Top Notes (Initial Opening)
                </label>
                <input
                  type="text"
                  value={topNotes}
                  onChange={(e) => setTopNotes(e.target.value)}
                  placeholder="Bergamot, Saffron, Pink Pepper"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-gold mb-1 uppercase tracking-wider font-semibold">
                  Heart / Middle Notes (Core Heart)
                </label>
                <input
                  type="text"
                  value={heartNotes}
                  onChange={(e) => setHeartNotes(e.target.value)}
                  placeholder="Bulgarian Rose, Oud Wood, Cedar"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-gold mb-1 uppercase tracking-wider font-semibold">
                  Base Notes (Dry Down Longevity)
                </label>
                <input
                  type="text"
                  value={baseNotes}
                  onChange={(e) => setBaseNotes(e.target.value)}
                  placeholder="Amber, Vanilla, Leather, White Musk"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          </div>

          {/* Product Media Uploader */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              Product Visuals & Presentation Cards
            </h3>
            <ImageUploader images={images} onChange={(newImgs) => setImages(newImgs)} />
          </div>

          {/* SEO Metadata */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              SEO Engine Optimization & Snippet Preview
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  SEO Meta Title
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Royal Amber Oud — HM Signature Extrait"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  SEO Meta Description
                </label>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Discover Royal Amber Oud extrait de parfum..."
                  className="w-full bg-navy border border-gold/30 rounded p-3 text-xs text-ivory focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <GoogleSeoPreview
              title={seoTitle}
              description={seoDescription}
              url={`https://hmsignature.com/product/${slug}`}
            />
          </div>
        </div>

        {/* Right Sidebar Column (Base 50ml Pricing, Stock, Badges, Status) */}
        <div className="space-y-6">
          {/* Base Pricing & Stock Card */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              Base 50ml Reference Price
            </h3>

            <div>
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                50ml Base Price (PKR) *
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-gold font-mono font-bold text-base focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                Special Sale Price (PKR)
              </label>
              <input
                type="number"
                value={salePrice || ""}
                onChange={(e) =>
                  setSalePrice(e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="Optional promo price"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  Stock Units *
                </label>
                <input
                  type="number"
                  required
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  Low Limit
                </label>
                <input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              Flacon Specifications
            </h3>

            <div>
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                Gender Classification
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold capitalize"
              >
                <option value="unisex">Unisex</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                Base Flacon Size
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="50ml"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                Concentration Tier
              </label>
              <input
                type="text"
                value={concentration}
                onChange={(e) => setConcentration(e.target.value)}
                placeholder="Extrait de Parfum (25-30% Oil)"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
                Collection Assignment
              </label>
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              >
                {collections.map((col) => (
                  <option key={col.id} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visibility & Flags */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-3">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              Visibility & Badges
            </h3>

            <label className="flex items-center space-x-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-gold/30 bg-navy text-gold focus:ring-0"
              />
              <span className="text-xs text-ivory">Active in Boutique</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded border-gold/30 bg-navy text-gold focus:ring-0"
              />
              <span className="text-xs text-ivory">Featured Fragrance</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={bestseller}
                onChange={(e) => setBestseller(e.target.checked)}
                className="rounded border-gold/30 bg-navy text-gold focus:ring-0"
              />
              <span className="text-xs text-ivory">Bestseller Badge</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={newArrival}
                onChange={(e) => setNewArrival(e.target.checked)}
                className="rounded border-gold/30 bg-navy text-gold focus:ring-0"
              />
              <span className="text-xs text-ivory">New Arrival Badge</span>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
};
