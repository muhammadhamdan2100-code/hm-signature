import React, { useEffect, useRef, useState } from "react";
import { useAdminData, type AdminProduct } from "../context/AdminDataContext";
import {
  type ProductVariant,
  generateDefaultVariants,
  autoPriceFor,
  isValidSizeLabel,
  normalizeSizeLabel,
  hasDuplicateSize,
  sanitizeSkuCode,
  SIZE_PRESETS,
  FRAGRANCE_FAMILIES,
  OCCASION_OPTIONS,
  SEASON_OPTIONS,
  INTENSITY_OPTIONS,
} from "../../data/products";
import { ImageUploader } from "../components/ImageUploader";
import { GoogleSeoPreview } from "../components/GoogleSeoPreview";
import { Breadcrumb } from "../components/Breadcrumb";
import { useI18n } from "../../i18n/I18nProvider";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Unlock,
  RotateCcw,
  ImagePlus,
  Check,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

type Intensity = NonNullable<AdminProduct["intensity"]>;

const SHORT_DESCRIPTION_MAX = 160;

export const ProductFormPage: React.FC = () => {
  const { t } = useI18n();
  const { products, categories, collections, addProduct, updateProduct } = useAdminData();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Resolved at render because `t` is only available inside a component; the size rule
  // sentence is reused verbatim inside three separate validation messages.
  const sizeInputError = t("admin.productForm.sizeInputError");

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

  // Fragrance Profile
  const [shortDescription, setShortDescription] = useState("");
  const [fragranceFamily, setFragranceFamily] = useState("");
  const [scentProfile, setScentProfile] = useState("");
  const [intensity, setIntensity] = useState<Intensity | "">("");
  const [occasions, setOccasions] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);

  const [topNotes, setTopNotes] = useState<string>("Bergamot, Saffron, Pink Pepper");
  const [heartNotes, setHeartNotes] = useState<string>("Bulgarian Rose, Oud Wood, Cedar");
  const [baseNotes, setBaseNotes] = useState<string>("Amber, Vanilla, Leather");

  const [description, setDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [images, setImages] = useState<string[]>(["texture-velvet"]);
  const [photos, setPhotos] = useState<string[]>([]);
  // Alt text is keyed by image URL so ordering changes never mis-assign a caption.
  const [photoAlts, setPhotoAlts] = useState<Record<string, string>>({});

  const [featured, setFeatured] = useState(false);
  const [bestseller, setBestseller] = useState(false);
  const [newArrival, setNewArrival] = useState(true);
  const [active, setActive] = useState(true);

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  // Bottle Sizes / ML Variants State
  // A fresh form starts on the standard ladder so the size table is never empty;
  // the populate effect replaces it as soon as a record is loaded.
  const [variants, setVariants] = useState<ProductVariant[]>(() =>
    generateDefaultVariants(3500, "HM-PRD", 50)
  );
  // Guards the reset below: React keeps this component mounted when the route
  // moves from /admin/products/:id to /admin/products/new, so without it the
  // "new" form opens pre-filled with the fragrance that was just edited.
  const previousRouteId = useRef<string | undefined>(undefined);
  const lastSkuSeed = useRef<string>("");
  const [pricingError, setPricingError] = useState<string>("");
  const [customSizeOpen, setCustomSizeOpen] = useState(false);
  const [customSizeValue, setCustomSizeValue] = useState("");
  const [openPhotoPickerId, setOpenPhotoPickerId] = useState<string | null>(null);

  // Populate data if editing
  useEffect(() => {
    const routeChanged = previousRouteId.current !== id;
    previousRouteId.current = id;

    if (!isEditing && routeChanged) {
      setName("");
      setSlug("");
      setSku("");
      lastSkuSeed.current = "";
      setPrice(3500);
      setSalePrice(undefined);
      setSize("50ml");
      setStock(50);
      setLowStockThreshold(10);
      setShortDescription("");
      setFragranceFamily("");
      setScentProfile("");
      setIntensity("");
      setOccasions([]);
      setSeasons([]);
      setTopNotes("Bergamot, Saffron, Pink Pepper");
      setHeartNotes("Bulgarian Rose, Oud Wood, Cedar");
      setBaseNotes("Amber, Vanilla, Leather");
      setDescription("");
      setFullDescription("");
      setPhotos([]);
      setPhotoAlts({});
      setSeoTitle("");
      setSeoDescription("");
      setFeatured(false);
      setBestseller(false);
      setNewArrival(true);
      setActive(true);
      setPricingError("");
      setCustomSizeValue("");
      setCustomSizeOpen(false);
      setVariants(generateDefaultVariants(3500, "HM-PRD", 50));
    }

    if (isEditing && existingProduct) {
      setName(existingProduct.name);
      setSlug(existingProduct.slug);
      setPrice(existingProduct.price);
      setSalePrice(existingProduct.salePrice);
      setSku(existingProduct.sku);
      lastSkuSeed.current = existingProduct.sku || "";
      setCategory(existingProduct.category);
      setCollection(existingProduct.collection);
      setGender(existingProduct.gender);
      setFragranceType(existingProduct.fragranceType);
      setSize(existingProduct.size);
      setConcentration(existingProduct.concentration);
      setStock(existingProduct.stock);
      setLowStockThreshold(existingProduct.lowStockThreshold);
      setShortDescription(existingProduct.shortDescription ?? "");
      setFragranceFamily(existingProduct.fragranceFamily ?? "");
      setScentProfile(existingProduct.scentProfile ?? "");
      setIntensity(existingProduct.intensity ?? "");
      setOccasions(existingProduct.occasions ?? []);
      setSeasons(existingProduct.seasons ?? []);
      setTopNotes(existingProduct.topNotes.join(", "));
      setHeartNotes(existingProduct.heartNotes.join(", "));
      setBaseNotes(existingProduct.baseNotes.join(", "));
      setDescription(existingProduct.description);
      setFullDescription(existingProduct.fullDescription);
      setImages(existingProduct.images);
      setPhotos(existingProduct.photos || []);
      setPhotoAlts(
        Object.fromEntries(
          (existingProduct.photos || []).map((url, i) => [url, existingProduct.photoAlts?.[i] || ""])
        )
      );
      setFeatured(existingProduct.featured);
      setBestseller(existingProduct.bestseller);
      setNewArrival(existingProduct.newArrival);
      setActive(existingProduct.active);
      setSeoTitle(existingProduct.seoTitle || `${existingProduct.name} — HM Signature`);
      setSeoDescription(existingProduct.seoDescription || existingProduct.description);

      if (existingProduct.variants && existingProduct.variants.length > 0) {
        setVariants(
          existingProduct.variants.map((v) => ({
            ...v,
            lowStockThreshold: v.lowStockThreshold ?? existingProduct.lowStockThreshold,
          }))
        );
      } else {
        setVariants(generateDefaultVariants(existingProduct.price, existingProduct.sku, existingProduct.stock));
      }
    } else if (!isEditing && routeChanged) {
      setVariants(generateDefaultVariants(3500, "HM-PRD", 50));
    }
  }, [id, isEditing, existingProduct]);

  // Auto generate slug & SKU from name if creating
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generatedSlug);
      // Only alphanumerics reach the code: "QA Verify" used to yield "HM-QA -100"
      // with a space inside the SKU.
      const skuSeed = val.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
      const generatedSku = `HM-${skuSeed || "PRD"}-100`;
      handleSkuChange(generatedSku);
      setSeoTitle(`${val} — HM Signature Extrait de Parfum`);
    }
  };

  // The base code is the seed for every size row, so it may not carry spaces, and
  // rows whose SKU is still auto-derived (or the "HM-PRD" placeholder) must follow
  // it. A hand-written variant SKU is left alone.
  const handleSkuChange = (val: string) => {
    const clean = sanitizeSkuCode(val);
    const seed = lastSkuSeed.current;
    setSku(clean);
    lastSkuSeed.current = clean;
    setVariants((prevVariants) =>
      prevVariants.map((v) => {
        const ml = normalizeSizeLabel(v.size).toUpperCase();
        // Derived by the placeholder, by the seed this row was built from, or
        // still blank. Anything else was typed by hand and stays untouched.
        const isAutoRow =
          !v.sku || /^HM-PRD-\d+ML$/.test(v.sku) || (!!seed && v.sku === `${seed}-${ml}`);
        return isAutoRow && clean ? { ...v, sku: `${clean}-${ml}` } : v;
      })
    );
  };

  // Re-derive every automatic row from the current base price, leaving manual rows untouched.
  const recomputePrices = (base: number, list: ProductVariant[]): ProductVariant[] =>
    list.map((v) => {
      if (normalizeSizeLabel(v.size) === "50ml") return { ...v, price: base };
      return v.auto !== false ? { ...v, price: autoPriceFor(base, v.size) } : v;
    });

  // Update base price & recalculate all automatic variant prices
  const handlePriceChange = (newPrice: number) => {
    setPrice(newPrice);
    setVariants((prev) => recomputePrices(newPrice, prev));
  };

  const isBaseRow = (v: ProductVariant) => normalizeSizeLabel(v.size) === "50ml";
  const isAutoRow = (v: ProductVariant) => !isBaseRow(v) && v.auto !== false;

  const handleOverrideVariant = (index: number) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, auto: false } : v)));
  };

  const handleResetAutoVariant = (index: number) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, auto: true, price: autoPriceFor(price, v.size) } : v))
    );
  };

  const hasSizeAt = (list: ProductVariant[], label: string, exceptIndex = -1) =>
    hasDuplicateSize(list, label, exceptIndex);

  // Variant Editor Handlers
  const handleUpdateVariant = (index: number, field: keyof ProductVariant, value: string | number | boolean | undefined | string[]) => {
    if (field === "price" && isBaseRow(variants[index])) {
      const base = Number(value);
      setPrice(base);
      setVariants((prev) => recomputePrices(base, prev.map((v, i) => (i === index ? { ...v, price: base } : v))));
      return;
    }

    setVariants((prev) => {
      const updated = prev.map((v, i) => (i === index ? { ...v, [field]: value } : v));
      if (field === "size") return recomputePrices(price, updated);
      if (field === "price") return updated.map((v, i) => (i === index ? { ...v, auto: false } : v));
      return updated;
    });
  };

  const handleAddVariant = (presetSize: string) => {
    const label = presetSize.trim();
    if (!isValidSizeLabel(label)) {
      setPricingError(
        t("admin.productForm.sizeRejectedOnAdd", { size: label, hint: sizeInputError })
      );
      return;
    }
    const norm = normalizeSizeLabel(label);
    if (variants.some((v) => normalizeSizeLabel(v.size) === norm)) {
      setPricingError(t("admin.productForm.duplicateSizeRow", { size: norm }));
      return;
    }
    const newV: ProductVariant = {
      id: "v-" + Date.now() + Math.random().toString(36).substring(2, 5),
      size: norm,
      price: autoPriceFor(price, norm),
      sku: `${sku || "HM-PRD"}-${norm.toUpperCase()}`,
      stock: stock || 30,
      active: true,
      auto: true,
      lowStockThreshold: Number(lowStockThreshold) || 0,
      images: [],
    };
    setVariants((prev) => [...prev, newV]);
    setPricingError("");
  };

  const handleAddCustomSize = () => {
    const label = customSizeValue.trim();
    const wasDuplicate = variants.some((v) => normalizeSizeLabel(v.size) === normalizeSizeLabel(label));
    handleAddVariant(label);
    if (isValidSizeLabel(label) && !wasDuplicate) {
      setCustomSizeValue("");
      setCustomSizeOpen(false);
    }
  };

  const handleRemoveVariant = (index: number) => {
    const removed = variants[index];
    if (removed && openPhotoPickerId === removed.id) setOpenPhotoPickerId(null);
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleChip = (list: string[], value: string, setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const availablePhotos = Array.from(new Set([...images, ...photos]));

  const toggleVariantPhoto = (index: number, url: string) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== index) return v;
        const current = v.images || [];
        const next = current.includes(url) ? current.filter((u) => u !== url) : [...current, url];
        return { ...v, images: next };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!Number.isFinite(price) || price <= 0) {
      setPricingError(t("admin.productForm.basePriceRequiredError"));
      return;
    }

    const invalidSize = variants.find((v) => !isValidSizeLabel(v.size));
    if (invalidSize) {
      setPricingError(
        t("admin.productForm.invalidBottleSizeError", {
          size: invalidSize.size || t("admin.productForm.emptySizeValue"),
          hint: sizeInputError,
        })
      );
      return;
    }

    const seenSizes = new Set<string>();
    for (const v of variants) {
      const norm = normalizeSizeLabel(v.size);
      if (seenSizes.has(norm)) {
        setPricingError(t("admin.productForm.duplicateSizeSubmitError", { size: norm }));
        return;
      }
      seenSizes.add(norm);
    }

    const badVariant = variants.find(
      (v) => !Number.isFinite(Number(v.price)) || Number(v.price) <= 0 ||
        (v.salePrice !== undefined && (!Number.isFinite(Number(v.salePrice)) || Number(v.salePrice) <= 0 || Number(v.salePrice) >= Number(v.price)))
    );
    if (badVariant) {
      setPricingError(t("admin.productForm.invalidVariantPriceError", { size: badVariant.size }));
      return;
    }
    setPricingError("");

    const parseNotes = (str: string) =>
      str.split(",").map((s) => s.trim()).filter(Boolean);

    const finalPhotos = Array.from(new Set([
      ...photos,
      ...images.filter((s) => /^https?:\/\//.test(s)),
    ]));

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
      shortDescription: shortDescription.trim() || undefined,
      fragranceFamily: fragranceFamily.trim() || undefined,
      scentProfile: scentProfile.trim() || undefined,
      intensity: intensity || undefined,
      occasions,
      seasons,
      topNotes: parseNotes(topNotes),
      heartNotes: parseNotes(heartNotes),
      baseNotes: parseNotes(baseNotes),
      description,
      fullDescription: fullDescription || description,
      images,
      photos: finalPhotos,
      photoAlts: finalPhotos.map((url) => photoAlts[url] || ""),
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

  const trimmedCustomSize = customSizeValue.trim();
  const customSizeValid = trimmedCustomSize === "" ? false : isValidSizeLabel(trimmedCustomSize);
  const customSizeDuplicate = customSizeValid && hasSizeAt(variants, trimmedCustomSize);
  const customSizeError =
    trimmedCustomSize === ""
      ? ""
      : !customSizeValid
        ? sizeInputError
        : customSizeDuplicate
          ? t("admin.productForm.customSizeDuplicateError", {
              size: normalizeSizeLabel(trimmedCustomSize),
            })
          : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in max-w-5xl mx-auto font-sans">
      <Breadcrumb
        items={[
          { label: t("admin.nav.products"), path: "/admin/products" },
          {
            label: isEditing
              ? name || t("admin.productForm.editProductCrumb")
              : t("admin.productForm.newFragrance"),
          },
        ]}
      />

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="p-2 rounded text-muted hover:text-gold hover:bg-navy2 transition-colors border border-gold/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
              {isEditing
                ? t("admin.productForm.editFragranceRecord")
                : t("admin.productForm.createNewFragrance")}
            </span>
            <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight">
              {isEditing
                ? t("admin.productForm.editingFragranceTitle", { name })
                : t("admin.productForm.addSignatureExtrait")}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="px-4 py-2 rounded text-xs uppercase tracking-wider text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            {t("admin.modal.cancel")}
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-goldLight"
          >
            <Save className="w-4 h-4" />
            <span>
              {isEditing ? t("admin.productForm.saveChanges") : t("admin.productForm.publishFragrance")}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Column (Main Information & Variants Editor) */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* General Information */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              {t("admin.productForm.identityHeading")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-name" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  {t("admin.productForm.productNameRequired")}
                </label>
                <input
                  id="product-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t("admin.productForm.productNamePlaceholder")}
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                />
              </div>

              <div>
                <label htmlFor="product-slug" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  {t("admin.productForm.urlSlugRequired")}
                </label>
                <input
                  id="product-slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="royal-amber-oud"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-sku" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  {t("admin.productForm.baseSkuRequired")}
                </label>
                <input
                  id="product-sku"
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => handleSkuChange(e.target.value)}
                  placeholder="HM-ROU-100"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                />
              </div>

              <div>
                <label htmlFor="product-category" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  {t("admin.productForm.familyCategoryLabel")}
                </label>
                <select
                  id="product-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
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
              <label htmlFor="product-teaser" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                {t("admin.productForm.shortTeaserLabel")}
              </label>
              <textarea
                id="product-teaser"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("admin.productForm.shortTeaserPlaceholder")}
                className="w-full bg-navy border border-gold/30 rounded p-3 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
              />
            </div>

            <div>
              <label htmlFor="product-story" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                {t("admin.productForm.atelierStoryLabel")}
              </label>
              <textarea
                id="product-story"
                rows={4}
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder={t("admin.productForm.atelierStoryPlaceholder")}
                className="w-full bg-navy border border-gold/30 rounded p-3 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
              />
            </div>
          </div>

          {/* Fragrance Profile */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <div className="border-b border-gold/15 pb-2">
              <h3 className="font-serif text-base font-bold text-ivory">
                {t("admin.productForm.profileHeading")}
              </h3>
              <p className="text-xs text-muted font-light">
                {t("admin.productForm.profileHelp")}
              </p>
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor="short-description" className="block text-xs text-muted uppercase tracking-wider">
                  {t("admin.productForm.shortDescriptionLabel")}
                </label>
                <span
                  className="text-[10px] font-mono text-muted tabular-nums"
                  aria-live="polite"
                >
                  {shortDescription.length}/{SHORT_DESCRIPTION_MAX}
                </span>
              </div>
              <input
                id="short-description"
                type="text"
                maxLength={SHORT_DESCRIPTION_MAX}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder={t("admin.productForm.shortDescriptionPlaceholder")}
                aria-describedby="short-description-help"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
              />
              <p id="short-description-help" className="text-[10px] text-muted mt-1">
                {t("admin.productForm.shortDescriptionHelp", { max: SHORT_DESCRIPTION_MAX })}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fragrance-family" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  {t("admin.productForm.fragranceFamilyLabel")}
                </label>
                <input
                  id="fragrance-family"
                  type="text"
                  list="fragrance-family-options"
                  value={fragranceFamily}
                  onChange={(e) => setFragranceFamily(e.target.value)}
                  placeholder="Woody Oriental"
                  aria-describedby="fragrance-family-help"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                />
                <datalist id="fragrance-family-options">
                  {FRAGRANCE_FAMILIES.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
                <p id="fragrance-family-help" className="text-[10px] text-muted mt-1">
                  {t("admin.productForm.fragranceFamilyHelp")}
                </p>
              </div>

              <div>
                <label htmlFor="intensity" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  {t("admin.productForm.intensityLabel")}
                </label>
                <select
                  id="intensity"
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value as Intensity | "")}
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                >
                  <option value="">{t("admin.productForm.notSet")}</option>
                  {INTENSITY_OPTIONS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="scent-profile" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                {t("admin.productForm.scentProfileLabel")}
              </label>
              <input
                id="scent-profile"
                type="text"
                value={scentProfile}
                onChange={(e) => setScentProfile(e.target.value)}
                placeholder={t("admin.productForm.scentProfilePlaceholder")}
                aria-describedby="scent-profile-help"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
              />
              <p id="scent-profile-help" className="text-[10px] text-muted mt-1">
                {t("admin.productForm.scentProfileHelp")}
              </p>
            </div>

            <fieldset className="pt-1">
              <legend className="text-xs text-muted uppercase tracking-wider mb-2">
                {t("admin.productForm.occasionsLegend")}
              </legend>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set([...OCCASION_OPTIONS, ...occasions])).map((opt) => {
                  const on = occasions.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleChip(occasions, opt, setOccasions)}
                      className={`px-2.5 py-1 rounded border text-[11px] font-sans transition-colors flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                        on
                          ? "bg-gold text-navy border-gold font-semibold"
                          : "bg-navy text-muted border-gold/25 hover:text-ivory hover:border-gold/50"
                      }`}
                    >
                      {on && <Check className="w-3 h-3" />}
                      {opt}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-xs text-muted uppercase tracking-wider mb-2">
                {t("admin.productForm.seasonsLegend")}
              </legend>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set([...SEASON_OPTIONS, ...seasons])).map((opt) => {
                  const on = seasons.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleChip(seasons, opt, setSeasons)}
                      className={`px-2.5 py-1 rounded border text-[11px] font-sans transition-colors flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                        on
                          ? "bg-gold text-navy border-gold font-semibold"
                          : "bg-navy text-muted border-gold/25 hover:text-ivory hover:border-gold/50"
                      }`}
                    >
                      {on && <Check className="w-3 h-3" />}
                      {opt}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {/* Bottle Sizes & ML Variants Manager */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gold/15 pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-ivory">
                  {t("admin.productForm.variantsHeading")}
                </h3>
                <p className="text-xs text-muted font-light">
                  {t("admin.productForm.variantsHelp")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomSizeOpen((o) => !o)}
                aria-expanded={customSizeOpen}
                aria-controls="custom-size-form"
                className="px-3 py-1.5 bg-gold/15 border border-gold/30 text-gold hover:bg-gold hover:text-navy rounded text-xs uppercase font-bold transition-all flex items-center gap-1 shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("admin.productForm.addCustomSize")}</span>
              </button>
            </div>

            {pricingError && (
              <div
                id="pricing-error"
                role="alert"
                className="px-3 py-2 rounded border border-rose-800/60 bg-rose-950/50 text-rose-300 text-xs font-sans"
              >
                {pricingError}
              </div>
            )}

            {/* Inline Custom Size Input */}
            {customSizeOpen && (
              <div id="custom-size-form" className="flex flex-wrap items-start gap-2">
                <div>
                  <label htmlFor="custom-size" className="block text-[10px] uppercase tracking-wider text-muted mb-1">
                    {t("admin.productForm.newSizeLabel")}
                  </label>
                  <input
                    id="custom-size"
                    type="text"
                    value={customSizeValue}
                    onChange={(e) => setCustomSizeValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomSize();
                      }
                    }}
                    placeholder="75ml"
                    aria-invalid={customSizeError ? true : undefined}
                    aria-describedby={customSizeError ? "custom-size-error" : "custom-size-help"}
                    className={`bg-navy border rounded px-3 py-1.5 text-xs text-gold font-mono focus:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                      customSizeError ? "border-rose-700" : "border-gold/30 focus-visible:border-gold"
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomSize}
                  disabled={!customSizeValid || customSizeDuplicate}
                  className="mt-[18px] px-3 py-1.5 bg-gold text-navy font-semibold text-xs rounded hover:bg-goldLight disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                >
                  {t("admin.productForm.addRow")}
                </button>
                <p id="custom-size-help" className={customSizeError ? "hidden" : "text-[10px] text-muted mt-[22px]"}>
                  {t("admin.productForm.newSizeHelp")}
                </p>
                {customSizeError && (
                  <p id="custom-size-error" role="alert" className="text-[10px] text-rose-400 mt-[22px]">
                    {customSizeError}
                  </p>
                )}
              </div>
            )}

            {/* Quick Presets Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted text-[10px] uppercase font-mono" id="preset-sizes-label">
                {t("admin.productForm.addPresetSize")}
              </span>
              {SIZE_PRESETS.map((pz) => {
                const exists = hasSizeAt(variants, pz);
                return (
                  <button
                    key={pz}
                    type="button"
                    disabled={exists}
                    onClick={() => handleAddVariant(pz)}
                    aria-describedby="preset-sizes-label"
                    className={`px-2.5 py-1 rounded border text-[11px] font-mono transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                      exists
                        ? "bg-navy/40 border-gold/10 text-muted/40 cursor-not-allowed"
                        : "bg-navy border-gold/30 text-gold hover:bg-gold/15 hover:border-gold"
                    }`}
                  >
                    {exists
                      ? t("admin.productForm.presetAdded", { size: pz })
                      : t("admin.productForm.presetAdd", { size: pz })}
                  </button>
                );
              })}
            </div>

            {/* Variants Table */}
            <div
              className="max-w-full min-w-0 overflow-x-auto"
              role="region"
              aria-label={t("admin.productForm.variantsRegionLabel")}
              tabIndex={0}
            >
              <table className="w-full text-start text-xs border-collapse min-w-[900px]">
                <thead className="bg-navy text-gold uppercase tracking-wider text-[10px] border-b border-gold/15">
                  <tr>
                    <th scope="col" className="py-2.5 px-3">{t("admin.inventory.size")}</th>
                    <th scope="col" className="py-2.5 px-3">{t("admin.productForm.pricePkrColumn")}</th>
                    <th scope="col" className="py-2.5 px-3">{t("admin.productForm.salePriceColumn")}</th>
                    <th scope="col" className="py-2.5 px-3">{t("admin.productForm.variantSkuColumn")}</th>
                    <th scope="col" className="py-2.5 px-3">{t("admin.productForm.stockColumn")}</th>
                    <th scope="col" className="py-2.5 px-3">{t("admin.productForm.lowStockAlertColumn")}</th>
                    <th scope="col" className="py-2.5 px-3 text-center">{t("admin.shared.status")}</th>
                    <th scope="col" className="py-2.5 px-3">{t("admin.productForm.photosColumn")}</th>
                    <th scope="col" className="py-2.5 px-3 text-end">{t("admin.orders.action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10 text-ivory">
                  {variants.map((v, idx) => {
                    const sizeInvalid = !isValidSizeLabel(v.size);
                    const sizeDuplicate = !sizeInvalid && hasSizeAt(variants, v.size, idx);
                    const sizeCellError = sizeInvalid || sizeDuplicate;
                    const rowId = `variant-${v.id || idx}`;
                    const sizeErrorId = `${rowId}-size-error`;
                    const pickerOpen = openPhotoPickerId === v.id;
                    const assignedCount = (v.images || []).length;

                    return (
                      <React.Fragment key={v.id || idx}>
                        <tr className={`hover:bg-navy/40 transition-colors ${sizeCellError ? "bg-rose-950/20" : ""}`}>
                          {/* Size */}
                          <td className="py-2.5 px-3 w-28">
                            <label htmlFor={`${rowId}-size`} className="sr-only">
                              {t("admin.productForm.bottleSizeForRow", { row: idx + 1 })}
                            </label>
                            <input
                              id={`${rowId}-size`}
                              type="text"
                              required
                              value={v.size}
                              onChange={(e) => handleUpdateVariant(idx, "size", e.target.value)}
                              aria-invalid={sizeCellError ? true : undefined}
                              aria-describedby={sizeCellError ? sizeErrorId : undefined}
                              className={`w-full bg-navy border rounded px-2 py-1 text-xs text-gold font-mono font-bold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                                sizeCellError ? "border-rose-700" : "border-gold/20 focus-visible:border-gold"
                              }`}
                            />
                            {sizeInvalid && (
                              <p id={sizeErrorId} role="alert" className="mt-1 text-[10px] leading-tight text-rose-400">
                                {sizeInputError}
                              </p>
                            )}
                            {!sizeInvalid && sizeDuplicate && (
                              <p id={sizeErrorId} role="alert" className="mt-1 text-[10px] leading-tight text-rose-400">
                                {t("admin.productForm.sizeUsedByAnotherRow")}
                              </p>
                            )}
                          </td>
                          {/* Price — 50ml row is the base price; others are AUTO (calculated) or MANUAL (override) */}
                          <td className="py-2.5 px-3 w-44">
                            {isBaseRow(v) ? (
                              <div className="space-y-0.5">
                                <label htmlFor={`${rowId}-price`} className="sr-only">
                                  {t("admin.productForm.basePriceSrLabel")}
                                </label>
                                <input
                                  id={`${rowId}-price`}
                                  type="number"
                                  required
                                  min={1}
                                  value={v.price}
                                  onChange={(e) => handleUpdateVariant(idx, "price", Number(e.target.value))}
                                  className="w-full bg-navy border border-gold/40 rounded px-2 py-1 text-xs text-gold font-mono font-bold focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                                />
                                <span className="text-[9px] font-mono tracking-widest text-gold/70">
                                  {t("admin.productForm.basePriceBadge")}
                                </span>
                              </div>
                            ) : isAutoRow(v) ? (
                              <div className="flex items-center gap-1.5">
                                <label htmlFor={`${rowId}-price`} className="sr-only">
                                  {t("admin.productForm.autoPriceSrLabel", { size: v.size })}
                                </label>
                                <input
                                  id={`${rowId}-price`}
                                  type="text"
                                  readOnly
                                  value={autoPriceFor(price, v.size)}
                                  className="w-full bg-navy/50 border border-gold/15 rounded px-2 py-1 text-xs text-muted font-mono cursor-default"
                                  title={t("admin.productForm.autoPriceTitle")}
                                />
                                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-gold/10 text-gold border border-gold/25 shrink-0">
                                  {t("admin.productForm.autoBadge")}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOverrideVariant(idx)}
                                  title={t("admin.productForm.overridePriceTitle")}
                                  aria-label={t("admin.productForm.overridePriceAria", { size: v.size })}
                                  className="p-1 text-muted hover:text-gold transition-colors shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <label htmlFor={`${rowId}-price`} className="sr-only">
                                  {t("admin.productForm.manualPriceSrLabel", { size: v.size })}
                                </label>
                                <input
                                  id={`${rowId}-price`}
                                  type="number"
                                  required
                                  min={1}
                                  value={v.price}
                                  onChange={(e) => handleUpdateVariant(idx, "price", Number(e.target.value))}
                                  className="w-full bg-navy border border-gold/20 rounded px-2 py-1 text-xs text-ivory font-mono focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                                />
                                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/50 shrink-0">
                                  {t("admin.productForm.manualBadge")}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleResetAutoVariant(idx)}
                                  title={t("admin.productForm.resetAutoTitle")}
                                  aria-label={t("admin.productForm.resetAutoAria", { size: v.size })}
                                  className="p-1 text-muted hover:text-gold transition-colors shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                          {/* Sale Price */}
                          <td className="py-2.5 px-3 w-32">
                            <label htmlFor={`${rowId}-sale`} className="sr-only">
                              {t("admin.productForm.salePriceSrLabel", { size: v.size })}
                            </label>
                            <input
                              id={`${rowId}-sale`}
                              type="number"
                              value={v.salePrice || ""}
                              onChange={(e) =>
                                handleUpdateVariant(idx, "salePrice", e.target.value ? Number(e.target.value) : undefined)
                              }
                              placeholder={t("admin.productForm.optionalPlaceholder")}
                              className="w-full bg-navy border border-gold/20 rounded px-2 py-1 text-xs text-ivory font-mono focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                            />
                          </td>
                          {/* SKU */}
                          <td className="py-2.5 px-3">
                            <label htmlFor={`${rowId}-sku`} className="sr-only">
                              {t("admin.productForm.variantSkuSrLabel", { size: v.size })}
                            </label>
                            <input
                              id={`${rowId}-sku`}
                              type="text"
                              value={v.sku}
                              onChange={(e) => handleUpdateVariant(idx, "sku", e.target.value)}
                              placeholder={t("admin.inventory.sku")}
                              className="w-full bg-navy border border-gold/20 rounded px-2 py-1 text-xs text-ivory font-mono focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                            />
                          </td>
                          {/* Stock */}
                          <td className="py-2.5 px-3 w-24">
                            <label htmlFor={`${rowId}-stock`} className="sr-only">
                              {t("admin.productForm.stockSrLabel", { size: v.size })}
                            </label>
                            <input
                              id={`${rowId}-stock`}
                              type="number"
                              value={v.stock}
                              onChange={(e) => handleUpdateVariant(idx, "stock", Number(e.target.value))}
                              className="w-full bg-navy border border-gold/20 rounded px-2 py-1 text-xs text-ivory font-mono focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                            />
                          </td>
                          {/* Low-stock threshold */}
                          <td className="py-2.5 px-3 w-28">
                            <label htmlFor={`${rowId}-low`} className="sr-only">
                              {t("admin.productForm.lowStockSrLabel", { size: v.size })}
                            </label>
                            <input
                              id={`${rowId}-low`}
                              type="number"
                              min={0}
                              value={v.lowStockThreshold ?? lowStockThreshold}
                              onChange={(e) =>
                                handleUpdateVariant(idx, "lowStockThreshold", Number(e.target.value))
                              }
                              className="w-full bg-navy border border-gold/20 rounded px-2 py-1 text-xs text-ivory font-mono focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                            />
                          </td>
                          {/* Status Toggle */}
                          <td className="py-2.5 px-3 text-center">
                            <label htmlFor={`${rowId}-active`} className="sr-only">
                              {t("admin.productForm.activeSrLabel", { size: v.size })}
                            </label>
                            <input
                              id={`${rowId}-active`}
                              type="checkbox"
                              checked={v.active !== false}
                              onChange={(e) => handleUpdateVariant(idx, "active", e.target.checked)}
                              className="rounded border-gold/30 bg-navy text-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold cursor-pointer"
                            />
                          </td>
                          {/* Photos */}
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => setOpenPhotoPickerId(pickerOpen ? null : v.id)}
                              disabled={availablePhotos.length === 0}
                              aria-expanded={pickerOpen}
                              aria-controls={`${rowId}-photos`}
                              className="px-2 py-1 rounded border border-gold/30 text-[11px] font-mono text-gold hover:bg-gold/15 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-gold flex items-center gap-1"
                            >
                              <ImagePlus className="w-3.5 h-3.5" />
                              {assignedCount > 0
                                ? t("admin.productForm.photosAssigned", { count: assignedCount })
                                : t("admin.productForm.assignPhotos")}
                            </button>
                          </td>
                          {/* Remove Action */}
                          <td className="py-2.5 px-3 text-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(idx)}
                              aria-label={t("admin.productForm.removeVariantAria", { size: v.size })}
                              className="p-1 text-muted hover:text-rose-400 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>

                        {/* Per-variant photo assignment picker */}
                        {pickerOpen && (
                          <tr className="bg-navy/60">
                            <td colSpan={9} className="px-3 py-3">
                              <p id={`${rowId}-photos`} className="text-[10px] uppercase tracking-wider text-muted mb-2">
                                {t("admin.productForm.photosShownFor", { size: v.size })}
                              </p>
                              {availablePhotos.length === 0 ? (
                                <p className="text-xs text-muted">
                                  {t("admin.productForm.uploadPhotosFirst")}
                                </p>
                              ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
                                  {availablePhotos.map((url, pIdx) => {
                                    const assigned = (v.images || []).includes(url);
                                    return (
                                      <button
                                        key={`${url}-${pIdx}`}
                                        type="button"
                                        onClick={() => toggleVariantPhoto(idx, url)}
                                        aria-pressed={assigned}
                                        aria-label={
                                          assigned
                                            ? t("admin.productForm.removePhotoAria", {
                                                number: pIdx + 1,
                                                size: v.size,
                                              })
                                            : t("admin.productForm.assignPhotoAria", {
                                                number: pIdx + 1,
                                                size: v.size,
                                              })
                                        }
                                        className={`relative h-16 rounded border overflow-hidden transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                                          assigned ? "border-gold ring-1 ring-gold" : "border-gold/20 hover:border-gold/50"
                                        }`}
                                      >
                                        {url.startsWith("texture-") ? (
                                          <span className={`h-full w-full block ${url}`} />
                                        ) : (
                                          <img
                                            src={url}
                                            alt=""
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLElement).style.display = "none";
                                            }}
                                          />
                                        )}
                                        {assigned && (
                                          <span className="absolute top-1 end-1 p-0.5 rounded-full bg-gold text-navy">
                                            <Check className="w-3 h-3" />
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Olfactory Pyramid (Notes) */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              {t("admin.productForm.notesHeading")}
            </h3>
            <p className="text-xs text-muted font-light">
              {t("admin.productForm.notesHelp")}
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="top-notes" className="block text-xs text-gold mb-1 uppercase tracking-wider font-semibold">
                  {t("admin.productForm.topNotesLabel")}
                </label>
                <input
                  id="top-notes"
                  type="text"
                  value={topNotes}
                  onChange={(e) => setTopNotes(e.target.value)}
                  placeholder="Bergamot, Saffron, Pink Pepper"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                />
              </div>

              <div>
                <label htmlFor="heart-notes" className="block text-xs text-gold mb-1 uppercase tracking-wider font-semibold">
                  {t("admin.productForm.heartNotesLabel")}
                </label>
                <input
                  id="heart-notes"
                  type="text"
                  value={heartNotes}
                  onChange={(e) => setHeartNotes(e.target.value)}
                  placeholder="Bulgarian Rose, Oud Wood, Cedar"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                />
              </div>

              <div>
                <label htmlFor="base-notes" className="block text-xs text-gold mb-1 uppercase tracking-wider font-semibold">
                  {t("admin.productForm.baseNotesLabel")}
                </label>
                <input
                  id="base-notes"
                  type="text"
                  value={baseNotes}
                  onChange={(e) => setBaseNotes(e.target.value)}
                  placeholder="Amber, Vanilla, Leather, White Musk"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                />
              </div>
            </div>
          </div>

          {/* Product Media Uploader */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              {t("admin.productForm.visualsHeading")}
            </h3>
            <ImageUploader
              images={images}
              onChange={(newImgs) => setImages(newImgs)}
              altTexts={images.map((url) => photoAlts[url] || "")}
              onAltTextsChange={(alts) =>
                setPhotoAlts((prev) => {
                  const next = { ...prev };
                  images.forEach((url, i) => {
                    next[url] = alts[i] ?? "";
                  });
                  return next;
                })
              }
            />
          </div>

          {/* SEO Metadata */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              {t("admin.productForm.seoHeading")}
            </h3>

            <div className="space-y-3">
              <div>
                <label htmlFor="seo-title" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  {t("admin.productForm.seoTitleLabel")}
                </label>
                <input
                  id="seo-title"
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Royal Amber Oud — HM Signature Extrait"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                />
              </div>

              <div>
                <label htmlFor="seo-description" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  {t("admin.productForm.seoDescriptionLabel")}
                </label>
                <textarea
                  id="seo-description"
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder={t("admin.productForm.seoDescriptionPlaceholder")}
                  className="w-full bg-navy border border-gold/30 rounded p-3 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
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
        <div className="space-y-6 min-w-0">
          {/* Base Pricing & Stock Card */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              {t("admin.productForm.basePriceHeading")}
            </h3>

            <div>
              <label htmlFor="base-price" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                {t("admin.productForm.basePriceRequiredLabel")}
              </label>
              <input
                id="base-price"
                type="number"
                required
                value={price}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-gold font-mono font-bold text-base focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
              />
            </div>

            <div>
              <label htmlFor="sale-price" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                {t("admin.productForm.specialSalePriceLabel")}
              </label>
              <input
                id="sale-price"
                type="number"
                value={salePrice || ""}
                onChange={(e) =>
                  setSalePrice(e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder={t("admin.productForm.promoPricePlaceholder")}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label htmlFor="stock-units" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  {t("admin.productForm.stockUnitsRequired")}
                </label>
                <input
                  id="stock-units"
                  type="number"
                  required
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                />
              </div>

              <div>
                <label htmlFor="low-limit" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                  {t("admin.inventory.lowLimit")}
                </label>
                <input
                  id="low-limit"
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  aria-describedby="low-limit-help"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                />
                <p id="low-limit-help" className="text-[10px] text-muted mt-1">
                  {t("admin.productForm.lowLimitHelp")}
                </p>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-2">
              {t("admin.productForm.specsHeading")}
            </h3>

            <div>
              <label htmlFor="gender" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                {t("admin.productForm.genderLabel")}
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as "men" | "women" | "unisex")}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold capitalize"
              >
                <option value="unisex">{t("admin.products.unisex")}</option>
                <option value="men">{t("admin.products.men")}</option>
                <option value="women">{t("admin.products.women")}</option>
              </select>
            </div>

            <div>
              <label htmlFor="base-flacon-size" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                {t("admin.productForm.baseFlaconSizeLabel")}
              </label>
              <input
                id="base-flacon-size"
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="50ml"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
              />
            </div>

            <div>
              <label htmlFor="concentration" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                {t("admin.productForm.concentrationLabel")}
              </label>
              <input
                id="concentration"
                type="text"
                value={concentration}
                onChange={(e) => setConcentration(e.target.value)}
                placeholder="Extrait de Parfum (25-30% Oil)"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
              />
            </div>

            <div>
              <label htmlFor="collection" className="block text-xs text-muted mb-1 uppercase tracking-wider">
                {t("admin.productForm.collectionLabel")}
              </label>
              <select
                id="collection"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
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
              {t("admin.productForm.visibilityHeading")}
            </h3>

            <label htmlFor="flag-active" className="flex items-center gap-3 cursor-pointer py-1">
              <input
                id="flag-active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-gold/30 bg-navy text-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              />
              <span className="text-xs text-ivory">{t("admin.productForm.activeInBoutique")}</span>
            </label>

            <label htmlFor="flag-featured" className="flex items-center gap-3 cursor-pointer py-1">
              <input
                id="flag-featured"
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded border-gold/30 bg-navy text-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              />
              <span className="text-xs text-ivory">{t("admin.productForm.featuredFragrance")}</span>
            </label>

            <label htmlFor="flag-bestseller" className="flex items-center gap-3 cursor-pointer py-1">
              <input
                id="flag-bestseller"
                type="checkbox"
                checked={bestseller}
                onChange={(e) => setBestseller(e.target.checked)}
                className="rounded border-gold/30 bg-navy text-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              />
              <span className="text-xs text-ivory">{t("admin.productForm.bestsellerBadge")}</span>
            </label>

            <label htmlFor="flag-new" className="flex items-center gap-3 cursor-pointer py-1">
              <input
                id="flag-new"
                type="checkbox"
                checked={newArrival}
                onChange={(e) => setNewArrival(e.target.checked)}
                className="rounded border-gold/30 bg-navy text-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              />
              <span className="text-xs text-ivory">{t("admin.productForm.newArrivalBadge")}</span>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
};
