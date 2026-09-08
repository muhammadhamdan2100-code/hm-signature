import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function BrandStory() {
  return (
    <section id="about" className="bg-navy py-28 lg:py-36 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 15% 30%, rgba(16,40,61,0.7), transparent 55%), radial-gradient(circle at 85% 70%, rgba(200,169,107,0.06), transparent 50%)",
        }}
      />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="order-2 lg:order-1"
        >
          <div className="eyebrow mb-4">OUR HERITAGE</div>
          <h2 className="font-serif text-4xl lg:text-5xl leading-[1.1] mb-6">
            The Art of
            <br />
            Fine Fragrances
          </h2>
          <p className="text-muted leading-[1.9] max-w-md mb-4">
            At HM Signature, fragrance is more than a scent — it is an expression of elegance,
            personality and individuality.
          </p>
          <p className="text-muted leading-[1.9] max-w-md mb-9">
            Each fragrance is carefully crafted using premium ingredients and refined
            craftsmanship, blended by experts who treat every bottle as a work of art.
          </p>
          <Link to="/journal" className="btn-gold">
            DISCOVER OUR STORY →
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, clipPath: "inset(8% 8% 8% 8%)" }}
          whileInView={{ opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.22, 0.61, 0.36, 1] }}
          className="order-1 lg:order-2"
        >
          <div className="aspect-[4/5] border border-gold/25 overflow-hidden">
            <img src="/products/brand-signature-box.jpg" alt="HM Signature" className="w-full h-full object-cover" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
