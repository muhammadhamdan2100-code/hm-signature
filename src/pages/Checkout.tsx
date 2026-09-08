import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useCart } from "../context/CartContext";
import ProductVisual from "../components/ProductVisual";
import { formatPKR } from "../utils/currency";

const steps = ["CONTACT", "SHIPPING", "PAYMENT", "CONFIRMATION"] as const;
type Step = (typeof steps)[number];

export default function Checkout() {
  const { items, subtotal, shipping, total, itemCount } = useCart();
  const [step, setStep] = useState<Step>("CONTACT");
  const [form, setForm] = useState({
    email: "", name: "", phone: "",
    address: "", city: "", postalCode: "", country: "",
    cardName: "", cardNumber: "", expiry: "", cvc: "",
  });
  const [orderNumber] = useState(() => `HM-${Math.floor(100000 + Math.random() * 900000)}`);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const goNext = (e: React.FormEvent) => {
    e.preventDefault();
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (items.length === 0 && step !== "CONFIRMATION") {
    return (
      <div className="pt-40 pb-32 text-center bg-navy min-h-screen">
        <p className="text-muted mb-8">Your bag is empty — add a fragrance before checking out.</p>
        <Link to="/collections" className="btn-gold-fill">DISCOVER FRAGRANCES →</Link>
      </div>
    );
  }

  return (
    <div className="pt-24 bg-navy min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-16">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 sm:gap-6 mb-16">
          {steps.map((s, i) => {
            const currentIdx = steps.indexOf(step);
            const done = i < currentIdx || step === "CONFIRMATION";
            const active = s === step;
            return (
              <div key={s} className="flex items-center gap-2 sm:gap-6">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] border ${
                      done ? "bg-gold border-gold text-navy" : active ? "border-gold text-gold" : "border-gold/25 text-muted"
                    }`}
                  >
                    {done ? <Check size={13} /> : i + 1}
                  </div>
                  <span className={`text-[11px] tracking-widest hidden sm:inline ${active || done ? "text-ivory" : "text-muted"}`}>{s}</span>
                </div>
                {i < steps.length - 1 && <div className="w-6 sm:w-12 h-px bg-gold/20" />}
              </div>
            );
          })}
        </div>

        {step === "CONFIRMATION" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto text-center py-10">
            <div className="w-16 h-16 rounded-full border border-gold mx-auto flex items-center justify-center mb-8">
              <Check size={26} className="text-gold" />
            </div>
            <h1 className="font-serif text-4xl mb-4">Order Confirmed</h1>
            <p className="text-muted leading-relaxed mb-2">Thank you, {form.name || "valued client"}.</p>
            <p className="text-muted leading-relaxed mb-8">
              Your order <span className="text-goldLight">#{orderNumber}</span> has been placed and a confirmation has
              been sent to {form.email || "your email"}.
            </p>
            <div className="border border-gold/25 p-6 text-left mb-8">
              <div className="flex justify-between text-sm mb-2"><span className="text-muted">Items</span><span>{itemCount}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted">Total Paid</span><span className="text-goldLight">{formatPKR(total)}</span></div>
            </div>
            <Link to="/" className="btn-gold-fill">RETURN HOME</Link>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-16">
            <AnimatePresence mode="wait">
              <motion.form
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
                onSubmit={goNext}
                className="space-y-6"
              >
                {step === "CONTACT" && (
                  <>
                    <h2 className="font-serif text-2xl mb-6">Contact Information</h2>
                    <Field label="Email Address" type="email" value={form.email} onChange={(v) => update("email", v)} required />
                    <Field label="Full Name" value={form.name} onChange={(v) => update("name", v)} required />
                    <Field label="Phone Number" type="tel" value={form.phone} onChange={(v) => update("phone", v)} required />
                  </>
                )}

                {step === "SHIPPING" && (
                  <>
                    <h2 className="font-serif text-2xl mb-6">Shipping Address</h2>
                    <Field label="Street Address" value={form.address} onChange={(v) => update("address", v)} required />
                    <div className="grid sm:grid-cols-2 gap-6">
                      <Field label="City" value={form.city} onChange={(v) => update("city", v)} required />
                      <Field label="Postal Code" value={form.postalCode} onChange={(v) => update("postalCode", v)} required />
                    </div>
                    <Field label="Country" value={form.country} onChange={(v) => update("country", v)} required />
                  </>
                )}

                {step === "PAYMENT" && (
                  <>
                    <h2 className="font-serif text-2xl mb-6">Payment Details</h2>
                    <Field label="Name on Card" value={form.cardName} onChange={(v) => update("cardName", v)} required />
                    <Field label="Card Number" value={form.cardNumber} onChange={(v) => update("cardNumber", v)} placeholder="•••• •••• •••• ••••" required />
                    <div className="grid sm:grid-cols-2 gap-6">
                      <Field label="Expiry (MM/YY)" value={form.expiry} onChange={(v) => update("expiry", v)} required />
                      <Field label="CVC" value={form.cvc} onChange={(v) => update("cvc", v)} required />
                    </div>
                    <p className="text-xs text-muted pt-2">This is a UI demo — no real payment is processed.</p>
                  </>
                )}

                <div className="flex gap-4 pt-4">
                  {step !== "CONTACT" && (
                    <button
                      type="button"
                      onClick={() => setStep(steps[steps.indexOf(step) - 1])}
                      className="btn-gold flex-1 text-center"
                    >
                      BACK
                    </button>
                  )}
                  <button type="submit" className="btn-gold-fill flex-1 text-center">
                    {step === "PAYMENT" ? "PLACE ORDER →" : "CONTINUE →"}
                  </button>
                </div>
              </motion.form>
            </AnimatePresence>

            <div className="border border-gold/25 p-8 h-fit">
              <h3 className="font-serif text-xl mb-6">Order Summary</h3>
              <div className="space-y-5 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-4">
                    <ProductVisual product={item.product} className="w-16 h-20 shrink-0 flex items-center justify-center" bottleSize="w-8" />
                    <div className="flex-1">
                      <div className="text-sm">{item.product.name}</div>
                      <div className="text-xs text-muted">Qty {item.quantity}</div>
                    </div>
                    <span className="text-sm text-goldLight">{formatPKR(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 text-sm mt-6 pt-6 border-t border-gold/15">
                <div className="flex justify-between text-muted"><span>Subtotal</span><span className="text-ivory">{formatPKR(subtotal)}</span></div>
                <div className="flex justify-between text-muted"><span>Shipping</span><span className="text-ivory">{shipping === 0 ? "Free" : formatPKR(shipping)}</span></div>
                <div className="flex justify-between pt-3 border-t border-gold/15">
                  <span className="font-serif text-lg">Total</span>
                  <span className="font-serif text-lg text-goldLight">{formatPKR(total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required = false, placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-widest text-muted mb-2 block">{label.toUpperCase()}</span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border border-gold/25 px-4 py-3 text-sm focus:outline-none focus:border-gold"
      />
    </label>
  );
}
