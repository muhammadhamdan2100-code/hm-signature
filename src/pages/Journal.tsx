import { motion } from "framer-motion";
import TexturePanel from "../components/TexturePanel";
import { articles } from "../components/JournalSection";
import { useI18n } from "../i18n/I18nProvider";
import { useSeoMeta } from "../hooks/useSeoMeta";

export default function Journal() {
  const { t } = useI18n();
  useSeoMeta("/journal", t("seo.journalTitle"), t("seo.journalDescription"));
  return (
    <div className="pt-24 bg-navy min-h-screen">
      <section className="py-20 border-b border-gold/15">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
          <div className="eyebrow mb-4">{t("home.journalEyebrow")}</div>
          <h1 className="font-serif text-4xl lg:text-6xl">{t("journal.title")}</h1>
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
              className="grid md:grid-cols-2 gap-10 items-center"
            >
              {/* Alternating columns use order, not `direction`, so RTL mirrors the layout
                  without ever forcing Arabic or Urdu prose into a left-to-right run. */}
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <TexturePanel texture={a.texture} className="aspect-[4/3] border border-gold/20" />
              </div>
              <div className={i % 2 === 1 ? "md:order-1" : ""}>
                <div className="eyebrow mb-4">{t("journal.issue", { n: i + 1 })}</div>
                <h2 className="font-serif text-3xl mb-4">{t(a.titleKey)}</h2>
                <p className="text-muted leading-[1.9] mb-6 max-w-md">
                  {t(a.excerptKey)} {t("journal.articleBody")}
                </p>
                <p className="text-[11px] font-mono uppercase tracking-[1.5px] text-muted">
                  {t("journal.fullEssays")}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}
