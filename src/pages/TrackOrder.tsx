import { useState } from "react";
import { motion } from "framer-motion";
import { Package, CheckCircle2, Truck, Home, Search } from "lucide-react";

const steps = [
  { icon: CheckCircle2, label: "Order Confirmed" },
  { icon: Package, label: "Processing" },
  { icon: Truck, label: "Shipped" },
  { icon: Home, label: "Delivered" },
];

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<null | { activeStep: number }>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo lookup — no backend connected yet, so we simulate a realistic in-progress order.
    setResult({ activeStep: 2 });
  };

  return (
    <div className="pt-24 bg-navy min-h-screen">
      <section className="py-20 border-b border-gold/15 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="eyebrow mb-4">CUSTOMER CARE</div>
          <h1 className="font-serif text-4xl lg:text-6xl mb-4">Track Your Order</h1>
          <p className="text-muted max-w-lg mx-auto leading-relaxed">
            Enter your order number and email to see the latest status.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[600px] mx-auto px-6 lg:px-10">
          <form onSubmit={submit} className="space-y-6 mb-16">
            <label className="block">
              <span className="text-[11px] tracking-widest text-muted mb-2 block">ORDER NUMBER</span>
              <input
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. HM-482913"
                className="w-full bg-transparent border border-gold/25 px-4 py-3 text-sm focus:outline-none focus:border-gold placeholder:text-muted"
              />
            </label>
            <label className="block">
              <span className="text-[11px] tracking-widest text-muted mb-2 block">EMAIL ADDRESS</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-gold/25 px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </label>
            <button type="submit" className="btn-gold-fill w-full flex items-center justify-center gap-2">
              <Search size={14} /> TRACK ORDER
            </button>
          </form>

          {result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="border border-gold/25 p-8">
              <div className="text-xs text-muted mb-1">ORDER</div>
              <div className="font-serif text-xl text-goldLight mb-8">#{orderNumber.toUpperCase()}</div>

              <div className="flex justify-between relative">
                <div className="absolute top-4 left-0 right-0 h-px bg-gold/20" />
                {steps.map((s, i) => (
                  <div key={s.label} className="relative flex flex-col items-center gap-3 z-10 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                        i <= result.activeStep ? "bg-gold border-gold text-navy" : "border-gold/25 text-muted bg-navy"
                      }`}
                    >
                      <s.icon size={14} />
                    </div>
                    <span className={`text-[10px] tracking-wide text-center ${i <= result.activeStep ? "text-ivory" : "text-muted"}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted text-center mt-10">
                Your order has shipped and is on its way — expected delivery within 2–3 business days.
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
