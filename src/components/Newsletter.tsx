import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "../i18n/I18nProvider";

export default function Newsletter() {
  const [notice, setNotice] = useState(false);
  const { t } = useI18n();
  return (
    <section className="py-24 text-center" style={{ background: "#2A0D13" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7 }}
        className="max-w-[1400px] mx-auto px-6"
      >
        <h2 className="font-serif text-3xl lg:text-4xl mb-4">{t("home.newsletterTitle")}</h2>
        <p className="text-muted max-w-md mx-auto mb-8 leading-relaxed">
          {t("home.newsletterBody")}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setNotice(true);
          }}
          className="flex max-w-md mx-auto border-b border-gold/40"
        >
          <input
            required
            type="email"
            placeholder={t("home.newsletterEmailPlaceholder")}
            className="flex-1 bg-transparent py-3 text-sm tracking-widest placeholder:text-muted focus:outline-none"
          />
          <button type="submit" className="text-goldLight text-xs tracking-[2px] px-3">
            {t("home.newsletterCta")}
          </button>
        </form>
        <p className="text-muted text-xs mt-4 max-w-md mx-auto leading-relaxed">
          {notice
            ? t("home.newsletterNoticeNotStored")
            : t("home.newsletterNoticeClosed")}
        </p>
      </motion.div>
    </section>
  );
}
