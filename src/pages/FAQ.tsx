import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "How long does an HM Signature fragrance last?",
    a: "Our fragrances are formulated as Extrait de Parfum — the most concentrated form of perfume. Most clients find they last 8–12 hours on skin, often longer on fabric.",
  },
  {
    q: "Are HM Signature fragrances unisex?",
    a: "Several of our fragrances are designed to be worn by anyone, while others lean toward traditionally masculine or feminine profiles. Each product page lists the intended gender, but we encourage you to wear whatever moves you.",
  },
  {
    q: "How do I choose the right fragrance for me?",
    a: "Take our Scent Finder quiz — five quick questions that match your personality and preferences to one of our signature blends. You can retake it as many times as you like.",
  },
  {
    q: "Do you offer samples or discovery sets?",
    a: "Not at this time, but our boutique team is happy to help you choose confidently — reach out via our Contact page with any questions before you order.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept major debit and credit cards, as well as cash on delivery within Pakistan. All payment details are handled securely at checkout.",
  },
  {
    q: "Can I return a fragrance if I don't like the scent?",
    a: "Unopened, unused items may be returned within 30 days of delivery for a full refund. See our Returns & Exchanges page for full details.",
  },
  {
    q: "Do you ship internationally?",
    a: "Currently we ship within Pakistan. International shipping is on our roadmap — subscribe to our newsletter to be notified when it launches.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="pt-24 bg-navy min-h-screen">
      <section className="py-20 border-b border-gold/15 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="eyebrow mb-4">HELP CENTER</div>
          <h1 className="font-serif text-4xl lg:text-6xl mb-4">Frequently Asked Questions</h1>
          <p className="text-muted max-w-lg mx-auto leading-relaxed">Everything you need to know before your next signature scent.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[800px] mx-auto px-6 lg:px-10 space-y-4">
          {faqs.map((f, i) => (
            <motion.div
              key={f.q}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="border border-gold/20"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between text-left px-6 py-5"
              >
                <span className="font-serif text-lg pr-6">{f.q}</span>
                {open === i ? <Minus size={16} className="text-gold shrink-0" /> : <Plus size={16} className="text-gold shrink-0" />}
              </button>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden">
                  <p className="px-6 pb-6 text-sm text-muted leading-relaxed">{f.a}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
