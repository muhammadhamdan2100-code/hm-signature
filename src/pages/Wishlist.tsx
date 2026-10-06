import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useI18n } from "../i18n/I18nProvider";
import { products as fallbackProducts, type Product } from "../data/products";
import { getCatalogProducts } from "../services/catalog";
import ProductCard from "../components/ProductCard";

export default function Wishlist() {
  const { wishlist } = useWishlist();
  const { t, language } = useI18n();
  const [allProducts, setAllProducts] = useState<Product[]>(fallbackProducts);

  useEffect(() => {
    let mounted = true;
    getCatalogProducts().then((prods) => {
      if (mounted && prods && prods.length > 0) {
        setAllProducts(prods);
      }
    });
    return () => {
      mounted = false;
    };
  }, [language.code]);

  const items = allProducts.filter((p) => wishlist.includes(p.id));

  return (
    <div className="pt-24 bg-navy min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16">
        <h1 className="font-serif text-4xl mb-4">{t("product.wishlistTitle")}</h1>
        <p className="text-muted mb-14">{t("product.wishlistSubtitle")}</p>
        {items.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted mb-8">{t("product.wishlistEmpty")}</p>
            <Link to="/collections" className="btn-gold-fill">{t("cart.discover")}</Link>
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
