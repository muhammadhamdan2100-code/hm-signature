import { useState } from "react";
import { motion } from "framer-motion";

export default function Newsletter() {
  const [joined, setJoined] = useState(false);
  return (
    <section className="py-24 text-center" style={{ background: "#2A0D13" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7 }}
        className="max-w-[1400px] mx-auto px-6"
      >
        <h2 className="font-serif text-3xl lg:text-4xl mb-4">Enter the World of HM</h2>
        <p className="text-muted max-w-md mx-auto mb-8 leading-relaxed">
          Discover new fragrances, exclusive releases and stories from HM Signature.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setJoined(true);
          }}
          className="flex max-w-md mx-auto border-b border-gold/40"
        >
          <input
            required
            type="email"
            placeholder="YOUR EMAIL ADDRESS"
            className="flex-1 bg-transparent py-3 text-sm tracking-widest placeholder:text-muted focus:outline-none"
          />
          <button type="submit" className="text-goldLight text-xs tracking-[2px] px-3">
            {joined ? "JOINED ✓" : "JOIN →"}
          </button>
        </form>
      </motion.div>
    </section>
  );
}
