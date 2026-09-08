import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { products } from "../data/products";
import type { Product } from "../data/products";
import TexturePanel from "../components/TexturePanel";
import Bottle from "../components/Bottle";

const questions = [
  {
    q: "What kind of personality describes you?",
    options: [
      { label: "Bold & Magnetic", tag: "oud" },
      { label: "Calm & Refined", tag: "woods" },
      { label: "Warm & Romantic", tag: "floral" },
    ],
  },
  {
    q: "Which fragrance family attracts you?",
    options: [
      { label: "Woody Oriental", tag: "oud" },
      { label: "Fresh Woods", tag: "woods" },
      { label: "Floral Amber", tag: "floral" },
    ],
  },
  {
    q: "When will you wear your fragrance?",
    options: [
      { label: "Evening Occasions", tag: "oud" },
      { label: "Everyday Elegance", tag: "woods" },
      { label: "Special Moments", tag: "floral" },
    ],
  },
  {
    q: "What mood do you want to create?",
    options: [
      { label: "Mysterious & Intense", tag: "oud" },
      { label: "Confident & Understated", tag: "woods" },
      { label: "Romantic & Luminous", tag: "floral" },
    ],
  },
  {
    q: "Which notes do you prefer?",
    options: [
      { label: "Amber, Leather & Spice", tag: "oud" },
      { label: "Musk, Vetiver & Cedar", tag: "woods" },
      { label: "Jasmine, Rose & Vanilla", tag: "floral" },
    ],
  },
];

const tagToProduct: Record<string, Product> = {
  oud: products.find((p) => p.slug === "mystic-oud")!,
  woods: products.find((p) => p.slug === "un-kimmy")!,
  floral: products.find((p) => p.slug === "harm-land")!,
};

export default function ScentFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<Product | null>(null);

  const choose = (tag: string) => {
    const next = [...answers, tag];
    setAnswers(next);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      const counts: Record<string, number> = {};
      next.forEach((t) => (counts[t] = (counts[t] || 0) + 1));
      const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setResult(tagToProduct[winner]);
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers([]);
    setResult(null);
  };

  return (
    <div className="pt-24 min-h-screen bg-navy relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-70 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 20%, rgba(16,40,61,0.8), transparent 60%)" }}
      />
      <div className="max-w-[900px] mx-auto px-6 lg:px-10 py-20 relative">
        <div className="text-center mb-16">
          <div className="eyebrow mb-4">SCENT FINDER</div>
          <h1 className="font-serif text-4xl lg:text-6xl leading-tight">
            Find Your
            <br />
            <span className="italic text-goldLight">Signature Scent</span>
          </h1>
        </div>

        {!result ? (
          <>
            <div className="flex gap-2 mb-14 max-w-md mx-auto">
              {questions.map((_, i) => (
                <div key={i} className={`h-[2px] flex-1 ${i <= step ? "bg-gold" : "bg-gold/20"}`} />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
                className="max-w-xl mx-auto text-center"
              >
                <div className="text-xs text-gold tracking-[2px] mb-4">0{step + 1}</div>
                <h2 className="font-serif text-2xl lg:text-3xl mb-10">{questions[step].q}</h2>
                <div className="flex flex-col gap-4">
                  {questions[step].options.map((o) => (
                    <button
                      key={o.label}
                      onClick={() => choose(o.tag)}
                      className="border border-gold/25 py-5 px-6 text-sm hover:border-gold hover:bg-gold/5 transition-colors"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto text-center">
            <div className="eyebrow mb-4">YOUR SIGNATURE MATCH</div>
            <TexturePanel texture={result.texture} className="aspect-[4/3] flex items-center justify-center border border-gold/25 mb-8">
              <Bottle className="w-24" />
            </TexturePanel>
            <h2 className="font-serif text-3xl mb-3">{result.name}</h2>
            <p className="text-muted leading-relaxed mb-8">{result.description}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={`/product/${result.slug}`} className="btn-gold-fill">SHOP THIS SCENT →</Link>
              <button onClick={restart} className="link-underline">Retake the Quiz</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
