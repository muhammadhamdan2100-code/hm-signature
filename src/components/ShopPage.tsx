import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { products as fallbackProducts } from "../data/products";
import type { Product } from "../data/products";
import ProductCard from "../components/ProductCard";
import { formatPKR } from "../utils/currency";
import { useAdminData } from "../admin/context/AdminDataContext";

interface Props {
  title: string;
  subtitle: string;
  eyebrow: string;
  baseFilter: (p: Product) => boolean;
  heroTexture?: string;
}

export default function ShopPage({ title, subtitle, eyebrow, baseFilter, heroTexture = "texture-navy" }: Props) {
  const { products: adminProducts } = useAdminData();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() || "";
  const [category, setCategory] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Synchronize storefront products with AdminDataContext state
  const catalogProducts: Product[] = useMemo(() => {
    if (adminProducts && adminProducts.length > 0) {
      return adminProducts
        .filter((p) => p.active)
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          category: p.category,
          gender: p.gender,
          size: p.size,
          concentration: p.concentration,
          topNotes: p.topNotes,
          heartNotes: p.heartNotes,
          baseNotes: p.baseNotes,
          description: p.description,
          images: p.images,
          photos: p.photos,
          featured: p.featured,
          bestseller: p.bestseller,
          stock: p.stock,
          ingredients: "Organic Sugar Cane Alcohol, Parfum, Water, Benzyl Salicylate",
          rating: 4.9,
          reviewCount: 24,
          reviews: [],
          texture: p.images?.[0] || "texture-velvet",
        }));
    }
    return fallbackProducts;
  }, [adminProducts]);

  const categories = useMemo(() => {
    return Array.from(new Set(catalogProducts.map((p) => p.category)));
  }, [catalogProducts]);

  const filtered = useMemo(() => {
    let list = catalogProducts.filter(baseFilter);
    if (query) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
      );
    }
    if (category !== "All") list = list.filter((p) => p.category === category);
    list = list.filter((p) => p.price <= maxPrice);

    switch (sort) {
      case "newest":
        list = [...list].reverse();
        break;
      case "price-low":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "bestselling":
        list = [...list].sort((a, b) => Number(b.bestseller) - Number(a.bestseller));
        break;
      default:
        list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return list;
  }, [catalogProducts, baseFilter, category, maxPrice, sort, query]);

  return (
    <div className="pt-24">
      <section className={`relative py-24 ${heroTexture} border-b border-gold/20`}>
        <div className="absolute inset-0 bg-navy/60" />
        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
          <div className="eyebrow mb-3">{eyebrow}</div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-wide mb-4">{title}</h1>
          <p className="text-muted max-w-xl mx-auto leading-relaxed text-sm sm:text-base font-light">
            {subtitle}
          </p>
        </div>
      </section>

      <section className="py-16 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 mb-10 border-b border-gold/15">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setFiltersOpen((o) => !o)}
                className="btn-gold text-xs flex items-center gap-2"
              >
                <SlidersHorizontal size={14} /> FILTERS
              </button>
              <span className="text-xs text-muted font-mono">{filtered.length} FRAGRANCES</span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted tracking-widest hidden sm:inline">SORT BY:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent border border-gold/25 text-ivory px-3 py-2 text-xs focus:outline-none focus:border-gold rounded font-sans"
              >
                <option value="featured">Featured First</option>
                <option value="bestselling">Bestsellers</option>
                <option value="newest">New Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border border-gold/20 p-6 mb-12 bg-navy2/60 rounded-lg"
            >
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-gold/15">
                <span className="eyebrow">Refine Collection</span>
                <button onClick={() => setFiltersOpen(false)} className="text-muted hover:text-ivory">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <span className="text-[11px] tracking-widest text-gold block mb-3 font-mono uppercase">Fragrance Family</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCategory("All")}
                      className={`text-xs px-3 py-1.5 border rounded transition-colors ${
                        category === "All"
                          ? "border-gold bg-gold text-navy font-semibold"
                          : "border-gold/20 text-muted hover:text-ivory"
                      }`}
                    >
                      All Families
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`text-xs px-3 py-1.5 border rounded transition-colors ${
                          category === c
                            ? "border-gold bg-gold text-navy font-semibold"
                            : "border-gold/20 text-muted hover:text-ivory"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3 text-xs font-mono">
                    <span className="text-gold uppercase tracking-widest">Maximum Price</span>
                    <span className="text-ivory font-bold">{formatPKR(maxPrice)}</span>
                  </div>
                  <input
                    type="range"
                    min={2000}
                    max={10000}
                    step={100}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-gold bg-navy border border-gold/20 rounded cursor-pointer"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted text-sm font-sans mb-4">No fragrances match your selected criteria.</p>
              <button
                onClick={() => {
                  setCategory("All");
                  setMaxPrice(10000);
                }}
                className="btn-gold font-sans text-xs"
              >
                CLEAR ALL FILTERS
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
