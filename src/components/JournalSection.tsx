import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import TexturePanel from "./TexturePanel";
import { useI18n } from "../i18n/I18nProvider";

export const articles = [
  { slug: "art-of-perfumery", titleKey: "home.journalArticle1Title", excerptKey: "home.journalArticle1Excerpt", texture: "texture-marble-dark" },
  { slug: "language-of-oud", titleKey: "home.journalArticle2Title", excerptKey: "home.journalArticle2Excerpt", texture: "texture-wood" },
  { slug: "choosing-your-signature-scent", titleKey: "home.journalArticle3Title", excerptKey: "home.journalArticle3Excerpt", texture: "texture-marble-champagne" },
  { slug: "fragrance-and-personality", titleKey: "home.journalArticle4Title", excerptKey: "home.journalArticle4Excerpt", texture: "texture-stone-beige" },
];

export default function JournalSection() {
  const { t } = useI18n();
  return (
    <section className="py-28 bg-navy">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="eyebrow mb-4">{t("home.journalEyebrow")}</div>
        <h2 className="font-serif text-4xl mb-16">{t("home.journalSectionTitle")}</h2>
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
                <h3 className="font-serif text-xl mb-2">{t(a.titleKey)}</h3>
                <p className="text-muted text-sm leading-relaxed">{t(a.excerptKey)}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
