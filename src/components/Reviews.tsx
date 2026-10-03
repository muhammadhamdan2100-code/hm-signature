import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { getCatalogProducts, getProductReviews } from "../services/catalog";

interface WallReview {
  name: string;
  text: string;
  rating: number;
  verified: boolean;
  product: string;
}

// Editorial copy shown when no approved client reviews exist yet — house notes,
// never fabricated quotes or ratings.
const HOUSE_NOTES = [
  {
    title: "On Opening",
    text: "We write about a fragrance as it behaves on skin: how it unfolds in the first minutes, and how the top notes give way rather than simply disappearing.",
  },
  {
    title: "On Heart and Drydown",
    text: "The same scent reads differently from person to person, so our notes follow the heart as it settles and the drydown that remains hours later.",
  },
  {
    title: "On Wearing",
    text: "Two sprays at the pulse points are enough. A fragrance is meant to be discovered at a distance, not announced across a room.",
  },
];

const cardClass = "border border-gold/25 p-8 bg-black/10";

export default function Reviews() {
  const [reviews, setReviews] = useState<WallReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const catalog = await getCatalogProducts();
        // Only products whose rating is backed by approved review rows.
        const rated = catalog
          .filter((p) => p.reviewCount > 0)
          .sort((a, b) => b.reviewCount - a.reviewCount)
          .slice(0, 4);

        const perProduct = await Promise.all(
          rated.map((p) =>
            getProductReviews(p.id).then((rs) => rs.map((r) => ({ ...r, product: p.name })))
          )
        );
        if (!mounted) return;
        const wall = perProduct
          .flat()
          .filter((r) => r.text && r.text.trim().length > 0)
          .slice(0, 6);
        setReviews(wall);
      } catch (err) {
        console.error("Failed to load approved reviews:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const showFallback = !isLoading && reviews.length === 0;

  return (
    <section className="py-28" style={{ background: "linear-gradient(160deg, #3A1118, #2A0D13 60%)" }}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <div className="eyebrow mb-4">{showFallback ? "FROM THE ATELIER" : "CUSTOMER STORIES"}</div>
          <h2 className="font-serif text-4xl">{showFallback ? "House Notes" : "The HM Experience"}</h2>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8" aria-busy="true" aria-live="polite">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`${cardClass} animate-pulse h-48 bg-black/5`} aria-hidden="true" />
            ))}
          </div>
        ) : showFallback ? (
          <div className="grid md:grid-cols-3 gap-8">
            {HOUSE_NOTES.map((note, i) => (
              <motion.div
                key={note.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                className={cardClass}
              >
                <div className="eyebrow text-[10px] mb-4">EDITORIAL</div>
                <h3 className="font-serif text-2xl mb-4">{note.title}</h3>
                <p className="text-ivory/80 leading-relaxed text-sm">{note.text}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {reviews.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                className={cardClass}
              >
                <div className="flex gap-1 mb-4" aria-label={`${r.rating} out of 5 stars`}>
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
        )}
      </div>
    </section>
  );
}
