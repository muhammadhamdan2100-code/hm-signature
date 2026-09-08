import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { products } from "../data/products";

const allReviews = products.flatMap((p) => p.reviews.map((r) => ({ ...r, product: p.name }))).slice(0, 6);

export default function Reviews() {
  return (
    <section className="py-28" style={{ background: "linear-gradient(160deg, #3A1118, #2A0D13 60%)" }}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <div className="eyebrow mb-4">CUSTOMER STORIES</div>
          <h2 className="font-serif text-4xl">The HM Experience</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {allReviews.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              className="border border-gold/25 p-8 bg-black/10"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={13} fill={s < r.rating ? "#E0C27A" : "none"} color="#E0C27A" />
                ))}
              </div>
              <p className="text-ivory/90 leading-relaxed text-sm mb-6">&ldquo;{r.text}&rdquo;</p>
              <div className="flex items-center justify-between text-xs">
                <span className="tracking-wide">{r.name}</span>
                <span className="text-goldLight">{r.verified ? "Verified Purchase" : ""}</span>
              </div>
              <div className="text-[11px] text-muted mt-1">on {r.product}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
