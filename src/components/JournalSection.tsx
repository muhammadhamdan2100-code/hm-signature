import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import TexturePanel from "./TexturePanel";

export const articles = [
  { slug: "art-of-perfumery", title: "The Art of Perfumery", text: "Understanding the craft behind fine fragrance.", texture: "texture-marble-dark" },
  { slug: "language-of-oud", title: "The Language of Oud", text: "Discover the story behind one of perfumery's most iconic ingredients.", texture: "texture-wood" },
  { slug: "choosing-your-signature-scent", title: "How to Choose Your Signature Scent", text: "A guide to choosing your perfect fragrance.", texture: "texture-marble-champagne" },
  { slug: "fragrance-and-personality", title: "Fragrance & Personality", text: "What your scent choice says about you.", texture: "texture-stone-beige" },
];

export default function JournalSection() {
  return (
    <section className="py-28 bg-navy">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="eyebrow mb-4">THE HM JOURNAL</div>
        <h2 className="font-serif text-4xl mb-16">Stories Worth Reading</h2>
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {articles.map((a, i) => (
            <motion.div
              key={a.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
            >
              <Link to="/journal">
                <TexturePanel texture={a.texture} className="aspect-[4/5] mb-5 border border-gold/15" />
                <h3 className="font-serif text-xl mb-2">{a.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{a.text}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
