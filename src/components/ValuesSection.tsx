import { motion } from "framer-motion";
import { Gem, Clock, Sparkles, Package, ShieldCheck } from "lucide-react";

const values = [
  { icon: Gem, title: "LUXURY INGREDIENTS", text: "Finest raw materials from around the world" },
  { icon: Clock, title: "LONG LASTING", text: "Premium extrait de parfum" },
  { icon: Sparkles, title: "SIGNATURE SCENTS", text: "Unique blends crafted with expertise" },
  { icon: Package, title: "ELEGANT PACKAGING", text: "Designed to reflect luxury and style" },
  { icon: ShieldCheck, title: "TRUST & QUALITY", text: "Crafted with passion and precision" },
];

export default function ValuesSection() {
  return (
    <section className="bg-navy border-y border-gold/15 py-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 grid grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-6 text-center">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="lg:border-r lg:last:border-r-0 border-gold/15 px-3"
          >
            <v.icon size={28} strokeWidth={0.9} className="text-gold mx-auto mb-5" />
            <h3 className="text-[12px] tracking-[1.5px] font-medium mb-2">{v.title}</h3>
            <p className="text-[13px] text-muted leading-relaxed">{v.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
