import { motion } from "framer-motion";
import { ExternalLink, BrainCircuit, Cog, Code2, Cloud, TrendingUp } from "lucide-react";

const pillars = [
  { icon: BrainCircuit, label: "Artificial Intelligence" },
  { icon: Cog, label: "Automation Solutions" },
  { icon: Code2, label: "Software Development" },
  { icon: Cloud, label: "Cloud & Enterprise" },
  { icon: TrendingUp, label: "Digital Transformation" },
];

export default function ParentCompany() {
  return (
    <div className="pt-24 bg-navy min-h-screen">
      <section className="border-b border-gold/15">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-10 text-center"
          >
            <div className="eyebrow mb-4">OUR PARENT COMPANY</div>
            <img src="/xeltrio-logo.png" alt="Xeltrio Technologies" className="h-16 lg:h-20 mx-auto mb-6" />
            <h1 className="font-serif text-4xl lg:text-6xl mb-4">Xeltrio Technologies</h1>
            <p className="text-muted max-w-xl mx-auto leading-relaxed">
              HM Signature is a brand under Xeltrio Technologies Private Limited — an AI product company
              building intelligent solutions for a better tomorrow.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="border border-gold/25 overflow-hidden"
          >
            <img src="/xeltrio-banner.jpg" alt="Xeltrio Technologies" className="w-full h-auto" />
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 text-center mb-16">
            {pillars.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <p.icon size={30} strokeWidth={1} className="text-gold mx-auto mb-4" />
                <div className="text-xs tracking-[1.5px]">{p.label.toUpperCase()}</div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <div className="text-[11px] tracking-[3px] text-muted mb-8">
              INNOVATE &nbsp;•&nbsp; AUTOMATE &nbsp;•&nbsp; ELEVATE
            </div>
            <a
              href="https://xeltrio-technologies.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold-fill inline-flex items-center gap-2"
            >
              VISIT XELTRIO TECHNOLOGIES <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
