import { Link } from "react-router-dom";
import { Heart, Eye } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "../data/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import ProductVisual from "./ProductVisual";
import { formatPKR } from "../utils/currency";
import { effectiveVariantPrice } from "../data/products";

export default function ProductCard({ product, onQuickView }: { product: Product; onQuickView?: (p: Product) => void }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  const variants = (product.variants || []).filter((v) => v.active !== false);
  const prices = variants.length > 0 ? variants.map(effectiveVariantPrice) : [product.price];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const sizeRange =
    variants.length > 0
      ? variants.map((v) => v.size).join(" · ")
      : product.size;

  const inStockVariants = variants.filter((v) => v.stock > 0);
  const soldOut = variants.length > 0 ? inStockVariants.length === 0 : product.stock <= 0;

  // "Only N left" when a declared low-stock threshold is reached.
  const lowStockVariant = inStockVariants
    .filter((v) => v.lowStockThreshold != null && v.stock <= v.lowStockThreshold)
    .sort((a, b) => a.stock - b.stock)[0];

  // Default add-to-cart target: prefer an in-stock 50ml, else first in-stock size.
  const defaultVariant =
    inStockVariants.find((v) => v.size.toLowerCase() === "50ml") || inStockVariants[0];

  const handleAdd = () => {
    if (soldOut) return;
    if (defaultVariant) {
      addToCart(product, defaultVariant.size, 1, effectiveVariantPrice(defaultVariant), defaultVariant.sku);
    } else {
      addToCart(product);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="group relative border border-gold/20 hover:border-gold/60 transition-colors duration-300"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <motion.div whileHover={{ scale: 1.06 }} transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}>
          <ProductVisual
            product={product}
            className={`aspect-[3/4] flex items-center justify-center ${soldOut ? "opacity-55" : ""}`}
            bottleSize="w-20"
          />
        </motion.div>
        {!soldOut && (
          <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/40 transition-colors duration-300 flex items-center justify-center pointer-events-none">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[11px] tracking-[2px] text-goldLight">
              VIEW DETAILS →
            </span>
          </div>
        )}
      </Link>

      {/* Status badges */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 items-start pointer-events-none">
        {soldOut ? (
          <span className="text-[9px] tracking-[1.5px] font-mono uppercase bg-navy/80 border border-gold/30 text-muted px-2 py-1">
            Sold Out
          </span>
        ) : (
          product.newArrival && (
            <span className="text-[9px] tracking-[1.5px] font-mono uppercase bg-navy/80 border border-gold/40 text-goldLight px-2 py-1">
              New
            </span>
          )
        )}
        {lowStockVariant && !soldOut && (
          <span
            role="status"
            className="text-[9px] tracking-[1.5px] font-mono uppercase bg-navy/80 border border-gold/50 text-gold px-2 py-1"
          >
            Only {lowStockVariant.stock} left ({lowStockVariant.size})
          </span>
        )}
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product.id);
        }}
        aria-pressed={wishlisted}
        aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        className="absolute top-4 right-4 w-11 h-11 rounded-full border border-gold/30 flex items-center justify-center hover:border-gold transition-colors bg-navy/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
      >
        <Heart size={15} fill={wishlisted ? "#C8A96B" : "none"} color={wishlisted ? "#C8A96B" : "#F6F1E7"} />
      </button>

      {onQuickView && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onQuickView(product);
          }}
          aria-label={`Quick view ${product.name}`}
          className="absolute top-16 right-4 w-11 h-11 rounded-full border border-gold/30 flex items-center justify-center hover:border-gold transition-colors bg-navy/40 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
        >
          <Eye size={14} />
        </button>
      )}

      <div className="p-5">
        <div className="flex items-center justify-between gap-3 text-[10px] tracking-[1.5px] text-muted mb-1 font-sans">
          <span className="truncate">{product.category}</span>
          <span className="text-gold/70 font-mono text-[9px] shrink-0">{sizeRange}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Link to={`/product/${product.slug}`} className="min-w-0">
            <h3 className="font-serif text-xl truncate">{product.name}</h3>
          </Link>
          <div className="flex flex-col text-right shrink-0">
            {minPrice !== maxPrice ? (
              <span className="text-goldLight text-sm font-mono font-bold">
                {formatPKR(minPrice)} – {formatPKR(maxPrice)}
              </span>
            ) : (
              <span className="text-goldLight text-sm font-mono font-bold">
                {minPrice > 0 ? formatPKR(minPrice) : "Price on request"}
              </span>
            )}
            <span className="text-[9px] text-muted font-mono">
              {minPrice !== maxPrice ? "By bottle size" : product.concentration}
            </span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Link
            to={`/product/${product.slug}`}
            className="flex-1 min-h-[44px] inline-flex items-center justify-center text-center text-[11px] tracking-[1.5px] border border-gold/30 hover:border-gold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            VIEW DETAILS
          </Link>
          <button
            onClick={handleAdd}
            disabled={soldOut}
            aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to bag`}
            className="flex-1 min-h-[44px] inline-flex items-center justify-center text-[11px] tracking-[1.5px] bg-gold text-navy hover:bg-goldLight transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gold/20 disabled:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-goldLight focus-visible:ring-offset-1 focus-visible:ring-offset-navy"
          >
            {soldOut ? "SOLD OUT" : "ADD TO BAG"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
