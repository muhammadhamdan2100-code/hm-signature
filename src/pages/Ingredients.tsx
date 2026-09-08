import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Leaf, Droplet, Globe2, ShieldCheck } from "lucide-react";

const principles = [
  {
    icon: Globe2,
    title: "Sourced Globally",
    text: "Our raw materials are sourced from renowned growing regions — Bulgarian rose fields, Indian sandalwood forests, and Cambodian oud plantations — chosen for the character only that terroir can produce.",
  },
  {
    icon: Droplet,
    title: "High Concentration",
    text: "Every HM Signature fragrance is formulated as an Extrait de Parfum, with a higher concentration of aromatic compounds than eau de parfum or eau de toilette — richer, longer-lasting, and truer to the raw material.",
  },
  {
    icon: Leaf,
    title: "Naturals & Fine Synthetics",
    text: "We blend natural absolutes and essential oils with fine synthetic molecules where they improve longevity, sillage, or sustainability — never to cut cost or corners.",
  },
  {
    icon: ShieldCheck,
    title: "Tested & Compliant",
    text: "All formulations are dermatologically tested and comply with IFRA (International Fragrance Association) safety standards for concentration and allergen labelling.",
  },
];

const families = [
  { name: "Oud & Amber", desc: "Deep, resinous, and warm — the backbone of our most magnetic compositions." },
  { name: "White Florals", desc: "Jasmine, tuberose, and orange blossom — luminous and romantic." },
  { name: "Woods & Musks", desc: "Cedar, vetiver, and clean musks — the quiet confidence in our fresher blends." },
  { name: "Gourmand Accords", desc: "Vanilla, tonka bean, and praline — comforting warmth in our amber creations." },
];

export default function Ingredients() {
  return (
    <div className="pt-24 bg-navy min-h-screen">
      <section className="py-20 border-b border-gold/15 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="eyebrow mb-4">CRAFTSMANSHIP</div>
          <h1 className="font-serif text-4xl lg:text-6xl mb-4">Our Ingredients</h1>
          <p className="text-muted max-w-lg mx-auto leading-relaxed">
            What goes into a bottle matters as much as what it says on the label.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 grid sm:grid-cols-2 gap-8 mb-20">
          {principles.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="border border-gold/20 p-8"
            >
              <p.icon size={26} strokeWidth={1.2} className="text-gold mb-5" />
              <h3 className="font-serif text-xl mb-3">{p.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <h2 className="font-serif text-3xl mb-10 text-center">Our Fragrance Families</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {families.map((f) => (
              <div key={f.name} className="border-t border-gold/25 pt-5">
                <h3 className="text-sm tracking-[1.5px] text-goldLight mb-2">{f.name.toUpperCase()}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-[800px] mx-auto px-6 lg:px-10 mt-20 pt-10 border-t border-gold/15 text-sm text-muted leading-relaxed text-center">
          <p>
            Full ingredient listings for each fragrance are available on its product page under the
            "Ingredients" tab. For allergen information or specific sensitivities, please reach out via our{" "}
            <Link to="/contact" className="text-goldLight hover:underline">Contact page</Link> before ordering.
          </p>
        </div>
      </section>
    </div>
  );
}
