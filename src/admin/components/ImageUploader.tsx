import React, { useState } from "react";
import {
  UploadCloud,
  Star,
  Trash2,
  Plus,
  Image as ImageIcon,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { uploadProductImageToStorage } from "../../services/adminCatalog";
import { useI18n } from "../../i18n/I18nProvider";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  altTexts?: string[];
  onAltTextsChange?: (altTexts: string[]) => void;
}

/** `key` is the stored texture identifier; only `labelKey` is display copy. */
const PRESET_TEXTURES = [
  { key: "texture-velvet", labelKey: "admin.imageUploader.velvetCrimson" },
  { key: "texture-marble-dark", labelKey: "admin.imageUploader.darkMarble" },
  { key: "texture-marble-champagne", labelKey: "admin.imageUploader.champagneMarble" },
  { key: "texture-stone-beige", labelKey: "admin.imageUploader.beigeStone" },
  { key: "texture-wood", labelKey: "admin.imageUploader.richEbonyWood" },
  { key: "texture-navy", labelKey: "admin.imageUploader.midnightSapphire" },
];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  altTexts,
  onAltTextsChange,
}) => {
  const { t } = useI18n();
  const [customUrl, setCustomUrl] = useState("");
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadErrorId] = useState(() => `upload-error-${Math.random().toString(36).slice(2, 8)}`);

  // Alt text is controlled when the parent provides it, otherwise kept locally.
  const isControlled = altTexts !== undefined;
  const [internalAlts, setInternalAlts] = useState<string[]>(() => images.map(() => ""));
  const alts = altTexts ?? internalAlts;
  const writeAlts = (next: string[]) => {
    onAltTextsChange?.(next);
    if (!isControlled) setInternalAlts(next);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const updated = [...images];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);
    const nextAlts = [...alts];
    const [selectedAlt] = nextAlts.splice(index, 1);
    nextAlts.unshift(selectedAlt ?? "");
    onChange(updated);
    writeAlts(nextAlts);
  };

  const handleMove = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const updated = [...images];
    const nextAlts = [...alts];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    [nextAlts[index], nextAlts[target]] = [nextAlts[target] ?? "", nextAlts[index] ?? ""];
    onChange(updated);
    writeAlts(nextAlts);
  };

  const handleDelete = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
    writeAlts(alts.filter((_, i) => i !== index));
  };

  const handleSetAlt = (index: number, value: string) => {
    const nextAlts = [...alts];
    nextAlts[index] = value;
    writeAlts(nextAlts);
  };

  const handleAddTexture = (key: string) => {
    if (images.includes(key)) return;
    onChange([...images, key]);
    writeAlts([...alts, ""]);
  };

  const handleAddCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!customUrl.trim()) return;
    onChange([...images, customUrl.trim()]);
    writeAlts([...alts, ""]);
    setCustomUrl("");
    setIsAddingUrl(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const publicUrl = await uploadProductImageToStorage(file);
      if (publicUrl) {
        newUrls.push(publicUrl);
      }
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
      writeAlts([...alts, ...newUrls.map(() => "")]);
    } else {
      setUploadError(t("admin.imageUploader.uploadFailed"));
    }
    setIsUploading(false);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone & Quick Textures */}
      <div className="p-6 rounded-lg border-2 border-dashed border-gold/30 bg-navy/40 hover:border-gold/60 transition-colors flex flex-col items-center justify-center text-center">
        <label className="cursor-pointer flex flex-col items-center">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={isUploading}
            aria-describedby={uploadError ? uploadErrorId : undefined}
            className="hidden"
          />
          <div className="p-3 rounded-full bg-navy border border-gold/20 text-gold mb-3 hover:bg-navy2 transition-colors">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gold" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          <p className="text-xs font-sans font-medium text-ivory tracking-wide">
            {isUploading
              ? t("admin.imageUploader.uploadingPhotography")
              : t("admin.imageUploader.clickOrDragToUpload")}
          </p>
          <p className="text-[11px] font-sans text-muted mt-1">
            {t("admin.imageUploader.supportedFormats")}
          </p>
        </label>

        {uploadError && (
          <p id={uploadErrorId} role="status" className="text-xs text-rose-400 mt-2 font-sans">
            {uploadError}
          </p>
        )}

        {/* Quick Texture Selectors */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {PRESET_TEXTURES.map((texture) => (
            <button
              key={texture.key}
              type="button"
              onClick={() => handleAddTexture(texture.key)}
              aria-pressed={images.includes(texture.key)}
              className={`px-2.5 py-1 rounded text-[11px] font-sans border transition-colors flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                images.includes(texture.key)
                  ? "bg-gold text-navy border-gold font-semibold"
                  : "bg-navy2 text-muted border-gold/20 hover:text-ivory hover:border-gold/40"
              }`}
            >
              <span>{t(texture.labelKey)}</span>
              {images.includes(texture.key) && <Check className="w-3 h-3 ms-1" />}
            </button>
          ))}
        </div>

        {/* Custom URL Input Toggle */}
        <div className="mt-4">
          {!isAddingUrl ? (
            <button
              type="button"
              onClick={() => setIsAddingUrl(true)}
              className="inline-flex items-center text-xs text-gold hover:text-goldLight underline tracking-wider focus:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
            >
              <Plus className="w-3.5 h-3.5 me-1" /> {t("admin.imageUploader.addCustomImageUrl")}
            </button>
          ) : (
            <form onSubmit={handleAddCustomUrl} className="flex items-center gap-2 mt-2">
              <label htmlFor="custom-image-url" className="sr-only">
                {t("admin.imageUploader.customImageUrlLabel")}
              </label>
              <input
                id="custom-image-url"
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="/products/sample-image.jpg or https://…"
                className="bg-navy border border-gold/30 rounded px-3 py-1.5 text-xs text-ivory placeholder-muted focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold w-64"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-gold text-navy font-semibold text-xs rounded hover:bg-goldLight focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                {t("admin.shared.add")}
              </button>
              <button
                type="button"
                onClick={() => setIsAddingUrl(false)}
                className="px-2 py-1.5 text-muted hover:text-ivory text-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
              >
                {t("admin.modal.cancel")}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {images.map((img, idx) => {
            const isPrimary = idx === 0;
            const altValue = alts[idx] ?? "";
            const altId = `alt-${idx}`;
            const altHelpId = `alt-help-${idx}`;

            return (
              <div
                key={`${img}-${idx}`}
                className={`relative group rounded-lg border overflow-hidden transition-all duration-300 ${
                  isPrimary
                    ? "border-gold ring-1 ring-gold shadow-[0_0_15px_rgba(200,169,107,0.2)]"
                    : "border-gold/20 hover:border-gold/40"
                }`}
              >
                <div
                  className={`h-32 w-full flex items-center justify-center ${
                    img.startsWith("texture-") ? img : "bg-navy"
                  }`}
                >
                  {img.startsWith("/") || img.startsWith("http") ? (
                    <img
                      src={img}
                      alt={altValue || t("admin.imageUploader.productImageNumbered", { number: idx + 1 })}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-ivory/80">
                      <ImageIcon className="w-6 h-6 mb-1 text-gold" />
                      <span className="text-[10px] uppercase font-mono tracking-wider">
                        {img}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Tag */}
                {isPrimary && (
                  <span className="absolute top-2 start-2 bg-gold text-navy text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow">
                    {t("admin.imageUploader.primary")}
                  </span>
                )}

                {/* Reorder + actions. Shown on hover and when any control inside takes focus. */}
                <div className="absolute inset-x-0 top-8 bg-navy/85 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    title={t("admin.imageUploader.moveImageEarlier")}
                    aria-label={t("admin.imageUploader.moveImageEarlierNumbered", { number: idx + 1 })}
                    className="p-1.5 rounded bg-navy text-gold border border-gold/30 hover:bg-gold hover:text-navy transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                  >
                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === images.length - 1}
                    title={t("admin.imageUploader.moveImageLater")}
                    aria-label={t("admin.imageUploader.moveImageLaterNumbered", { number: idx + 1 })}
                    className="p-1.5 rounded bg-navy text-gold border border-gold/30 hover:bg-gold hover:text-navy transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                  >
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      title={t("admin.imageUploader.makeThisThePrimaryImage")}
                      aria-label={t("admin.imageUploader.makeImagePrimary", { number: idx + 1 })}
                      className="p-1.5 rounded bg-gold/20 text-gold hover:bg-gold hover:text-navy transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    title={t("admin.imageUploader.removeImage")}
                    aria-label={t("admin.imageUploader.removeImageNumbered", { number: idx + 1 })}
                    className="p-1.5 rounded bg-rose-950/60 text-rose-300 hover:bg-rose-900 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Alt text editor */}
                <div className="bg-navy/70 px-2.5 py-2 border-t border-gold/15">
                  <label htmlFor={altId} className="block text-[10px] uppercase tracking-wider text-muted mb-1">
                    {t("admin.imageUploader.altText")}
                  </label>
                  <input
                    id={altId}
                    type="text"
                    value={altValue}
                    onChange={(e) => handleSetAlt(idx, e.target.value)}
                    aria-describedby={altHelpId}
                    placeholder={t("admin.imageUploader.describeThisImage")}
                    className="w-full bg-navy border border-gold/25 rounded px-2 py-1 text-[11px] text-ivory placeholder-muted focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold"
                  />
                  <p id={altHelpId} className="sr-only">
                    {t("admin.imageUploader.altTextHelp")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
