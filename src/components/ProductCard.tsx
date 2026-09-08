import { Link } from "react-router-dom";
import { Heart, Eye } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "../data/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import ProductVisual from "./ProductVisual";
import { formatPKR } from "../utils/currency";

export default function ProductCard({ product, onQuickView }: { product: Product; onQuickView?: (p: Product) => void }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

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
          <ProductVisual product={product} className="aspect-[3/4] flex items-center justify-center" bottleSize="w-20" />
        </motion.div>
        <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/40 transition-colors duration-300 flex items-center justify-center pointer-events-none">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[11px] tracking-[2px] text-goldLight">
            VIEW DETAILS →
          </span>
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product.id);
        }}
        className="absolute top-4 right-4 w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center hover:border-gold transition-colors bg-navy/40"
        aria-label="Wishlist"
      >
        <Heart size={14} fill={wishlisted ? "#C8A96B" : "none"} color={wishlisted ? "#C8A96B" : "#F6F1E7"} />
      </button>

      {onQuickView && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onQuickView(product);
          }}
          className="absolute top-4 left-4 w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center hover:border-gold transition-colors bg-navy/40 opacity-0 group-hover:opacity-100"
          aria-label="Quick view"
        >
          <Eye size={14} />
        </button>
      )}

      <div className="p-5">
        <div className="text-[10px] tracking-[1.5px] text-muted mb-1">{product.category}</div>
        <div className="flex items-center justify-between">
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-serif text-xl">{product.name}</h3>
          </Link>
          <span className="text-goldLight text-sm">{formatPKR(product.price)}</span>
        </div>
        <div className="flex gap-2 mt-4">
          <Link to={`/product/${product.slug}`} className="flex-1 text-center text-[11px] tracking-[1.5px] border border-gold/30 py-2.5 hover:border-gold transition-colors">
            VIEW DETAILS
          </Link>
          <button
            onClick={() => addToCart(product)}
            className="flex-1 text-[11px] tracking-[1.5px] bg-gold text-navy py-2.5 hover:bg-goldLight transition-colors"
          >
            ADD TO CART
          </button>
        </div>
      </div>
    </motion.div>
  );
}
