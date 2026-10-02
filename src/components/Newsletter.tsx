import { useState } from "react";
import { motion } from "framer-motion";

export default function Newsletter() {
  const [notice, setNotice] = useState(false);
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
          Newsletter sign-up is not live yet. Follow us on Instagram for new releases and journal stories.
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
            placeholder="YOUR EMAIL ADDRESS"
            className="flex-1 bg-transparent py-3 text-sm tracking-widest placeholder:text-muted focus:outline-none"
          />
          <button type="submit" className="text-goldLight text-xs tracking-[2px] px-3">
            NOTIFY ME →
          </button>
        </form>
        <p className="text-muted text-xs mt-4 max-w-md mx-auto leading-relaxed">
          {notice
            ? "We cannot store this address yet — sign-up opens with our next release."
            : "Your address is not stored or sent while sign-up is closed."}
        </p>
      </motion.div>
    </section>
  );
}
