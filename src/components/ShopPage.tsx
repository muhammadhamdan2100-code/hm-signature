import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { products } from "../data/products";
import type { Product } from "../data/products";
import ProductCard from "../components/ProductCard";
import { formatPKR } from "../utils/currency";

interface Props {
  title: string;
  subtitle: string;
  eyebrow: string;
  baseFilter: (p: Product) => boolean;
  heroTexture?: string;
}

const categories = Array.from(new Set(products.map((p) => p.category)));

export default function ShopPage({ title, subtitle, eyebrow, baseFilter, heroTexture = "texture-navy" }: Props) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() || "";
  const [category, setCategory] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = products.filter(baseFilter);
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
  }, [baseFilter, category, maxPrice, sort, query]);

  return (
    <div className="pt-24">
      <section className={`relative py-24 ${heroTexture} border-b border-gold/20`}>
        <div className="absolute inset-0 bg-navy/60" />
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative">
          <div className="eyebrow mb-4">{eyebrow}</div>
          <h1 className="font-serif text-4xl lg:text-6xl mb-4">{title}</h1>
          <p className="text-muted max-w-lg leading-relaxed">{subtitle}</p>
        </div>
      </section>

      <section className="bg-navy py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={() => setFiltersOpen((s) => !s)}
              className="lg:hidden flex items-center gap-2 text-xs tracking-widest border border-gold/30 px-4 py-2"
            >
              <SlidersHorizontal size={14} /> FILTERS
            </button>
            <span className="text-xs text-muted hidden lg:block">{filtered.length} fragrances</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent border border-gold/30 text-xs tracking-widest px-4 py-2 focus:outline-none"
            >
              <option value="featured" className="bg-navy2">FEATURED</option>
              <option value="newest" className="bg-navy2">NEWEST</option>
              <option value="price-low" className="bg-navy2">PRICE: LOW TO HIGH</option>
              <option value="price-high" className="bg-navy2">PRICE: HIGH TO LOW</option>
              <option value="bestselling" className="bg-navy2">BEST SELLING</option>
            </select>
          </div>

          <div className="grid lg:grid-cols-[220px_1fr] gap-10">
            <aside className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
              <div className="border border-gold/20 p-6 sticky top-28">
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <span className="text-xs tracking-widest text-gold">FILTERS</span>
                  <button onClick={() => setFiltersOpen(false)}>
                    <X size={16} />
                  </button>
                </div>
                <div className="mb-8">
                  <h4 className="text-xs tracking-[1.5px] text-goldLight mb-4">FRAGRANCE FAMILY</h4>
                  <div className="flex flex-col gap-2 text-sm text-muted">
                    <button onClick={() => setCategory("All")} className={`text-left hover:text-ivory ${category === "All" ? "text-gold" : ""}`}>
                      All
                    </button>
                    {categories.map((c) => (
                      <button key={c} onClick={() => setCategory(c)} className={`text-left hover:text-ivory ${category === c ? "text-gold" : ""}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-2">
                  <h4 className="text-xs tracking-[1.5px] text-goldLight mb-4">PRICE: UP TO {formatPKR(maxPrice)}</h4>
                  <input
                    type="range"
                    min={2500}
                    max={5000}
                    step={100}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-gold"
                  />
                </div>
              </div>
            </aside>

            <div>
              {filtered.length === 0 ? (
                <div className="text-center py-24 text-muted">No fragrances match your filters.</div>
              ) : (
                <motion.div layout className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filtered.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
