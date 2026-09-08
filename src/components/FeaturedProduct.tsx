import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { products } from "../data/products";
import Bottle from "./Bottle";
import Pedestal from "./Pedestal";

export default function FeaturedProduct() {
  const featured = products.find((p) => p.bestseller) || products[0];

  return (
    <section
      className="relative py-28 lg:py-36 overflow-hidden"
      style={{ background: "radial-gradient(circle at 70% 50%, #3A1118, #2A0D13 70%)" }}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-gold/20" />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative grid lg:grid-cols-2 gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-10 h-px bg-gold mb-6" />
          <h2 className="font-serif text-4xl lg:text-6xl leading-[1.05] mb-6">
            THE SIGNATURE
            <br />
            COLLECTION
          </h2>
          <p className="text-muted leading-[1.9] max-w-sm mb-6">
            A fragrance created to make an unforgettable impression — for the moments that
            deserve one.
          </p>
          <div className="text-goldLight text-xs tracking-[2.5px] mb-8">
            {featured.concentration.toUpperCase()} · {featured.size}
          </div>
          <Link to={`/product/${featured.slug}`} className="btn-gold-fill">
            SHOP NOW →
          </Link>
          <div className="w-10 h-px bg-gold mt-6" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="absolute -inset-16 rounded-full bg-gold/10 blur-3xl" />
            {featured.photos ? (
              <img
                src={featured.photos[Math.min(2, featured.photos.length - 1)]}
                alt={featured.name}
                className="relative w-64 sm:w-80 lg:w-[420px] rounded-sm shadow-2xl object-cover aspect-[4/5]"
              />
            ) : (
              <>
                <Bottle className="w-56 lg:w-72 relative drop-shadow-2xl" />
                <Pedestal className="w-72 lg:w-96 -mt-3 relative" />
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
