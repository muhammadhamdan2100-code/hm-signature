import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";

const faqs = [
  { questionKey: "faq.question1", answerKey: "faq.answer1" },
  { questionKey: "faq.question2", answerKey: "faq.answer2" },
  { questionKey: "faq.question3", answerKey: "faq.answer3" },
  { questionKey: "faq.question4", answerKey: "faq.answer4" },
  { questionKey: "faq.question5", answerKey: "faq.answer5" },
  { questionKey: "faq.question6", answerKey: "faq.answer6" },
  { questionKey: "faq.question7", answerKey: "faq.answer7" },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const { t } = useI18n();

  return (
    <div className="pt-24 bg-navy min-h-screen">
      <section className="py-20 border-b border-gold/15 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="eyebrow mb-4">{t("faq.eyebrow")}</div>
          <h1 className="font-serif text-4xl lg:text-6xl mb-4">{t("faq.title")}</h1>
          <p className="text-muted max-w-lg mx-auto leading-relaxed">{t("faq.intro")}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[800px] mx-auto px-6 lg:px-10 space-y-4">
          {faqs.map((f, i) => (
            <motion.div
              key={f.questionKey}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="border border-gold/20"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between text-start px-6 py-5"
              >
                <span className="font-serif text-lg pe-6">{t(f.questionKey)}</span>
                {open === i ? <Minus size={16} className="text-gold shrink-0" /> : <Plus size={16} className="text-gold shrink-0" />}
              </button>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden">
                  <p className="px-6 pb-6 text-sm text-muted leading-relaxed">{t(f.answerKey)}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
