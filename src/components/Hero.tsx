import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import GoldLeafBranch from "./GoldLeafBranch";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [slide, setSlide] = useState(0);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 24;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 16;
    setOffset({ x, y });
  };

  return (
    <header
      ref={ref}
      onMouseMove={onMouseMove}
      className="relative min-h-screen flex items-center pt-28 pb-16 px-6 lg:px-10 overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 75% 45%, rgba(16,40,61,0.9), transparent 60%), linear-gradient(160deg, #08111C 0%, #0c1826 55%, #08111C 100%)",
      }}
    >
      {/* satin fold texture */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(200,169,107,0.03) 0px, rgba(200,169,107,0.03) 2px, transparent 2px, transparent 60px)",
        }}
      />

      <div className="max-w-[1400px] mx-auto w-full grid lg:grid-cols-2 gap-14 items-center relative">
        <div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="eyebrow mb-6">
            HAUTE PARFUMERIE
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9 }}
            className="font-serif text-[42px] sm:text-[54px] lg:text-[68px] leading-[1.05] mb-6"
          >
            THE ESSENCE OF
            <br />
            YOUR <span className="text-goldLight italic">ESSENCE</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.9 }}
            className="text-muted text-base leading-[1.8] max-w-sm mb-10 tracking-wide"
          >
            DISCOVER YOUR
            <br />
            SIGNATURE SCENT.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.9 }}
            className="flex flex-wrap items-center gap-8"
          >
            <Link to="/collections" className="btn-gold-fill">
              SHOP NOW →
            </Link>
            <Link to="/?section=about" className="link-underline">
              DISCOVER HM SIGNATURE
            </Link>
          </motion.div>
        </div>

        <div className="relative h-[420px] lg:h-[560px] flex items-center justify-center">
          {/* spotlight glow behind ring */}
          <div className="absolute w-[380px] h-[380px] lg:w-[520px] lg:h-[520px] rounded-full bg-gold/10 blur-3xl" />
          {/* thin gold circular frame */}
          <div
            className="absolute w-[280px] h-[280px] lg:w-[400px] lg:h-[400px] rounded-full border border-gold/40"
            style={{ transform: `translate(${offset.x * 0.4}px, ${offset.y * 0.4}px)`, boxShadow: "0 0 60px rgba(200,169,107,0.08)" }}
          />
          <div
            className="absolute w-[300px] h-[300px] lg:w-[430px] lg:h-[430px] rounded-full border border-gold/15"
            style={{ transform: `translate(${offset.x * 0.25}px, ${offset.y * 0.25}px)` }}
          />

          {/* botanical gold leaf branches either side */}
          <GoldLeafBranch className="absolute left-[-10px] lg:left-2 top-2 w-24 lg:w-32 opacity-90" />
          <GoldLeafBranch className="absolute right-[-10px] lg:right-2 bottom-2 w-20 lg:w-28 opacity-80" flip />

          <motion.div
            animate={{ x: offset.x, y: offset.y }}
            transition={{ type: "spring", stiffness: 60, damping: 14 }}
            className="relative z-10 w-[230px] h-[230px] lg:w-[330px] lg:h-[330px] rounded-full overflow-hidden border border-gold/30 shadow-2xl"
          >
            <img src="/products/mystic-oud-1.jpg" alt="HM Signature — Mystic Oud" className="w-full h-full object-cover" />
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`h-[2px] transition-all duration-300 ${slide === i ? "w-8 bg-gold" : "w-4 bg-gold/25"}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </header>
  );
}
