import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Leaf, Droplet, Globe2, ShieldCheck } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";

const principles = [
  {
    icon: Globe2,
    titleKey: "legal.ingredientsSourcedTitle",
    textKey: "legal.ingredientsSourcedBody",
  },
  {
    icon: Droplet,
    titleKey: "legal.ingredientsConcentrationTitle",
    textKey: "legal.ingredientsConcentrationBody",
  },
  {
    icon: Leaf,
    titleKey: "legal.ingredientsNaturalsTitle",
    textKey: "legal.ingredientsNaturalsBody",
  },
  {
    icon: ShieldCheck,
    titleKey: "legal.ingredientsSafetyTitle",
    textKey: "legal.ingredientsSafetyBody",
  },
];

const families = [
  { nameKey: "legal.familyOudAmber", descKey: "legal.familyOudAmberDesc" },
  { nameKey: "legal.familyWhiteFlorals", descKey: "legal.familyWhiteFloralsDesc" },
  { nameKey: "legal.familyWoodsMusks", descKey: "legal.familyWoodsMusksDesc" },
  { nameKey: "legal.familyGourmand", descKey: "legal.familyGourmandDesc" },
];

export default function Ingredients() {
  const { t } = useI18n();
  return (
    <div className="pt-24 bg-navy min-h-screen">
      <section className="py-20 border-b border-gold/15 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="eyebrow mb-4">{t("legal.ingredientsEyebrow")}</div>
          <h1 className="font-serif text-4xl lg:text-6xl mb-4">{t("legal.ingredientsTitle")}</h1>
          <p className="text-muted max-w-lg mx-auto leading-relaxed">
            {t("legal.ingredientsIntro")}
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 grid sm:grid-cols-2 gap-8 mb-20">
          {principles.map((p, i) => (
            <motion.div
              key={p.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="border border-gold/20 p-8"
            >
              <p.icon size={26} strokeWidth={1.2} className="text-gold mb-5" />
              <h3 className="font-serif text-xl mb-3">{t(p.titleKey)}</h3>
              <p className="text-sm text-muted leading-relaxed">{t(p.textKey)}</p>
            </motion.div>
          ))}
        </div>

        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <h2 className="font-serif text-3xl mb-10 text-center">{t("legal.ingredientsFamiliesTitle")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {families.map((f) => (
              <div key={f.nameKey} className="border-t border-gold/25 pt-5">
                <h3 className="text-sm tracking-[1.5px] text-goldLight mb-2">{t(f.nameKey).toUpperCase()}</h3>
                <p className="text-sm text-muted leading-relaxed">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-[800px] mx-auto px-6 lg:px-10 mt-20 pt-10 border-t border-gold/15 text-sm text-muted leading-relaxed text-center">
          <p>
            {t("legal.ingredientsClosingPrefix")}{" "}
            <Link to="/contact" className="text-goldLight hover:underline">{t("common.contactPage")}</Link> {t("legal.ingredientsClosingSuffix")}
          </p>
        </div>
      </section>
    </div>
  );
}
