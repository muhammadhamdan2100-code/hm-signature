import { motion } from "framer-motion";
import TexturePanel from "../components/TexturePanel";
import { articles } from "../components/JournalSection";

export default function Journal() {
  return (
    <div className="pt-24 bg-navy min-h-screen">
      <section className="py-20 border-b border-gold/15">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
          <div className="eyebrow mb-4">THE HM JOURNAL</div>
          <h1 className="font-serif text-4xl lg:text-6xl">Stories of Scent & Craft</h1>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 space-y-24">
          {articles.map((a, i) => (
            <motion.article
              key={a.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7 }}
              className={`grid md:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? "md:[direction:rtl]" : ""}`}
            >
              <div className={i % 2 === 1 ? "md:[direction:ltr]" : ""}>
                <TexturePanel texture={a.texture} className="aspect-[4/3] border border-gold/20" />
              </div>
              <div className={i % 2 === 1 ? "md:[direction:ltr]" : ""}>
                <div className="eyebrow mb-4">JOURNAL · 0{i + 1}</div>
                <h2 className="font-serif text-3xl mb-4">{a.title}</h2>
                <p className="text-muted leading-[1.9] mb-6 max-w-md">
                  {a.text} A closer look at the craftsmanship, history and sensory detail that goes into
                  every HM Signature creation — for those who want to understand the story behind the scent.
                </p>
                <span className="link-underline cursor-default">READ THE FULL STORY →</span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}
