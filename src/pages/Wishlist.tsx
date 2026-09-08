import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { products } from "../data/products";
import ProductCard from "../components/ProductCard";

export default function Wishlist() {
  const { wishlist } = useWishlist();
  const items = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="pt-24 bg-navy min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16">
        <h1 className="font-serif text-4xl mb-4">Your Wishlist</h1>
        <p className="text-muted mb-14">Fragrances you've saved for later.</p>
        {items.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted mb-8">Your wishlist is empty.</p>
            <Link to="/collections" className="btn-gold-fill">DISCOVER FRAGRANCES →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
