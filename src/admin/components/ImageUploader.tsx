import React, { useState } from "react";
import { UploadCloud, Star, Trash2, Plus, Image as ImageIcon, Check } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

const PRESET_TEXTURES = [
  { key: "texture-velvet", label: "Velvet Crimson" },
  { key: "texture-marble-dark", label: "Dark Marble" },
  { key: "texture-marble-champagne", label: "Champagne Marble" },
  { key: "texture-stone-beige", label: "Beige Stone" },
  { key: "texture-wood", label: "Rich Ebony Wood" },
  { key: "texture-navy", label: "Midnight Sapphire" },
];

export const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onChange }) => {
  const [customUrl, setCustomUrl] = useState("");
  const [isAddingUrl, setIsAddingUrl] = useState(false);

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const updated = [...images];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAddTexture = (key: string) => {
    if (images.includes(key)) return;
    onChange([...images, key]);
  };

  const handleAddCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    onChange([...images, customUrl.trim()]);
    setCustomUrl("");
    setIsAddingUrl(false);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone & Quick Textures */}
      <div className="p-6 rounded-lg border-2 border-dashed border-gold/30 bg-navy/40 hover:border-gold/60 transition-colors flex flex-col items-center justify-center text-center">
        <div className="p-3 rounded-full bg-navy border border-gold/20 text-gold mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-xs font-sans font-medium text-ivory tracking-wide">
          Drag and drop product photography or choose luxury textures
        </p>
        <p className="text-[11px] font-sans text-muted mt-1">
          Supports PNG, JPG, WebP up to 10MB per image. High resolution recommended.
        </p>

        {/* Quick Texture Selectors */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {PRESET_TEXTURES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleAddTexture(t.key)}
              className={`px-2.5 py-1 rounded text-[11px] font-sans border transition-colors flex items-center space-x-1 ${
                images.includes(t.key)
                  ? "bg-gold text-navy border-gold font-semibold"
                  : "bg-navy2 text-muted border-gold/20 hover:text-ivory hover:border-gold/40"
              }`}
            >
              <span>{t.label}</span>
              {images.includes(t.key) && <Check className="w-3 h-3 ml-1" />}
            </button>
          ))}
        </div>

        {/* Custom URL Input Toggle */}
        <div className="mt-4">
          {!isAddingUrl ? (
            <button
              type="button"
              onClick={() => setIsAddingUrl(true)}
              className="inline-flex items-center text-xs text-gold hover:text-goldLight underline tracking-wider"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Custom Image URL / Path
            </button>
          ) : (
            <form onSubmit={handleAddCustomUrl} className="flex items-center space-x-2 mt-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="/products/sample-image.jpg or https://..."
                className="bg-navy border border-gold/30 rounded px-3 py-1.5 text-xs text-ivory placeholder-muted focus:outline-none focus:border-gold w-64"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-gold text-navy font-semibold text-xs rounded hover:bg-goldLight"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingUrl(false)}
                className="px-2 py-1.5 text-muted hover:text-ivory text-xs"
              >
                Cancel
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

            return (
              <div
                key={idx}
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
                      alt={`Product preview ${idx}`}
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
                  <span className="absolute top-2 left-2 bg-gold text-navy text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow">
                    Primary
                  </span>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-navy/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 p-2">
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      title="Set as primary image"
                      className="p-2 rounded bg-gold/20 text-gold hover:bg-gold hover:text-navy transition-colors"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    title="Delete image"
                    className="p-2 rounded bg-rose-950/60 text-rose-300 hover:bg-rose-900 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
