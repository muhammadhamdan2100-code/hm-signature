import React, { useState, useEffect } from "react";
import { useAdminData, type AdminProduct } from "../context/AdminDataContext";
import { ImageUploader } from "../components/ImageUploader";
import { GoogleSeoPreview } from "../components/GoogleSeoPreview";
import { Breadcrumb } from "../components/Breadcrumb";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export const ProductFormPage: React.FC = () => {
  const { products, categories, collections, addProduct, updateProduct } =
    useAdminData();
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
  const [size, setSize] = useState("100ML");
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
    }
  }, [isEditing, existingProduct]);

  // Auto generate slug from name if creating
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generatedSlug);
      setSku(`HM-${val.slice(0, 3).toUpperCase()}-100`);
      setSeoTitle(`${val} — HM Signature Extrait de Parfum`);
    }
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
    };

    if (isEditing && existingProduct) {
      updateProduct(existingProduct.id, productPayload);
    } else {
      addProduct(productPayload);
    }

    navigate("/admin/products");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in max-w-5xl mx-auto">
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
            className="px-4 py-2 rounded text-xs font-sans uppercase tracking-wider text-muted hover:text-ivory border border-gold/20 hover:border-gold/40"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider transition-colors flex items-center space-x-2 shadow-lg"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? "Save Changes" : "Publish Fragrance"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Column (Main Information) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              Fragrance Identity & Nomenclature
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
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
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
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
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  SKU Code *
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
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
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
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
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
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
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
                <label className="block text-xs font-sans text-gold mb-1 uppercase tracking-wider font-semibold">
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
                <label className="block text-xs font-sans text-gold mb-1 uppercase tracking-wider font-semibold">
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
                <label className="block text-xs font-sans text-gold mb-1 uppercase tracking-wider font-semibold">
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
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
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
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
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

        {/* Right Sidebar Column (Pricing, Stock, Badges, Status) */}
        <div className="space-y-6">
          {/* Pricing & Stock Card */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              Pricing & Inventory
            </h3>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Regular Price (PKR) *
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-gold font-mono font-bold text-base focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
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
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
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
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
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
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
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
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Bottle Size
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="100ML"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
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
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
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
