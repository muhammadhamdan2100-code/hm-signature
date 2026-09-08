import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Hero from "../components/Hero";
import ValuesSection from "../components/ValuesSection";
import BrandStory from "../components/BrandStory";
import FeaturedProduct from "../components/FeaturedProduct";
import JournalSection from "../components/JournalSection";
import Reviews from "../components/Reviews";
import Newsletter from "../components/Newsletter";
import ProductCard from "../components/ProductCard";
import { products } from "../data/products";

export default function Home() {
  const featured = products.filter((p) => p.featured);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const section = searchParams.get("section");
    if (section) {
      const el = document.getElementById(section);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    }
  }, [searchParams]);

  return (
    <>
      <Hero />

      <section className="py-28" style={{ background: "linear-gradient(160deg, #2A0D13 0%, #3A1118 100%)" }}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="eyebrow mb-4">OUR COLLECTIONS</div>
              <h2 className="font-serif text-4xl lg:text-5xl">Scented Stories</h2>
              <p className="text-muted mt-4 max-w-md leading-relaxed">
                Discover fragrances crafted to express different personalities, moods and moments.
              </p>
            </motion.div>
            <Link to="/collections" className="link-underline whitespace-nowrap">
              VIEW ALL COLLECTIONS →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <ValuesSection />
      <BrandStory />
      <FeaturedProduct />
      <JournalSection />
      <Reviews />
      <Newsletter />
    </>
  );
}
