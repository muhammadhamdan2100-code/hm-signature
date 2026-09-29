import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Banknote, Smartphone, Building2, Truck, Copy } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAdminData, type PaymentMethod } from "../admin/context/AdminDataContext";
import ProductVisual from "../components/ProductVisual";
import { formatPKR } from "../utils/currency";
import { sendTransactionalEmail } from "../services/emailService";

const steps = ["CONTACT", "SHIPPING", "PAYMENT", "CONFIRMATION"] as const;
type Step = (typeof steps)[number];

export default function Checkout() {
  const { items, subtotal, shipping, total, promoCode, promoDiscountAmount, clearCart } = useCart();
  const { addOrder } = useAdminData();

  const [step, setStep] = useState<Step>("CONTACT");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("Cash on Delivery");

  const [form, setForm] = useState({
    email: "",
    name: "",
    phone: "",
    address: "",
    city: "Lahore",
    postalCode: "54600",
    country: "Pakistan",
    paymentReference: "",
    copiedField: "",
  });

  const [orderNumber] = useState(() => `HM-${Math.floor(100000 + Math.random() * 900000)}`);
  const [isProcessing, setIsProcessing] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    update("copiedField", fieldName);
    setTimeout(() => update("copiedField", ""), 2500);
  };

  const handleSubmitOrder = async () => {
    setIsProcessing(true);

    try {
      const isCod = selectedMethod === "Cash on Delivery";

      const newOrder = {
        orderNumber,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        total: total,
        subtotal: subtotal,
        discount: promoDiscountAmount,
        discountAmount: promoDiscountAmount,
        shippingFee: shipping,
        shippingCost: shipping,
        status: "Pending" as const,
        paymentStatus: (isCod ? "Pending" : "Pending") as any,
        paymentMethod: selectedMethod,
        paymentReference: form.paymentReference || (isCod ? "COD-PENDING" : `REF-${Math.floor(100000 + Math.random() * 900000)}`),
        shippingStatus: "Processing" as const,
        courier: "DHL Express Luxury",
        trackingNumber: `DHL-HM-${Math.floor(10000 + Math.random() * 90000)}`,
        createdAt: new Date().toISOString().split("T")[0],
        shippingAddress: {
          street: form.address,
          city: form.city,
          state: "Punjab",
          zip: form.postalCode,
          country: form.country,
        },
        billingAddress: {
          street: form.address,
          city: form.city,
          state: "Punjab",
          zip: form.postalCode,
          country: form.country,
        },
        timeline: [
          { status: "Pending" as const, date: new Date().toISOString().replace("T", " ").slice(0, 16), note: `Order placed via ${selectedMethod}` }
        ],
        items: items.map((i) => ({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: i.product.id,
          name: i.product.name,
          sku: (i.product as any).sku || `HM-${i.product.name.slice(0, 3).toUpperCase()}-100`,
          size: i.product.size || "100ML",
          price: i.product.price,
          quantity: i.quantity,
          image: i.product.images?.[0] || "texture-velvet",
        })),
      };

      addOrder(newOrder);

      // Trigger Transactional Email Confirmation
      await sendTransactionalEmail({
        to: form.email,
        subject: `HM Signature Order Placed #${orderNumber}`,
        template: "order_confirmation",
        data: {
          orderNumber,
          customerName: form.name,
          total,
          paymentMethod: selectedMethod,
          shippingCity: form.city,
        },
      });

      clearCart();
      setStep("CONFIRMATION");
    } catch (error) {
      console.error("Order processing error:", error);
      setStep("CONFIRMATION");
    } finally {
      setIsProcessing(false);
    }
  };

  const goNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "PAYMENT") {
      await handleSubmitOrder();
      return;
    }
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (items.length === 0 && step !== "CONFIRMATION") {
    return (
      <div className="pt-40 pb-32 text-center bg-navy min-h-screen">
        <p className="text-muted mb-8 font-sans text-sm">Your bag is empty — add a fragrance before checking out.</p>
        <Link to="/collections" className="btn-gold-fill font-sans text-xs">DISCOVER FRAGRANCES →</Link>
      </div>
    );
  }

  return (
    <div className="pt-24 bg-navy min-h-screen text-ivory">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-16">
        {/* Progress Stepper */}
        <div className="flex items-center justify-center gap-2 sm:gap-6 mb-16">
          {steps.map((s, i) => {
            const currentIdx = steps.indexOf(step);
            const done = i < currentIdx || step === "CONFIRMATION";
            const active = s === step;
            return (
              <div key={s} className="flex items-center gap-2 sm:gap-6 font-sans">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] border font-bold ${
                      done ? "bg-gold border-gold text-navy" : active ? "border-gold text-gold" : "border-gold/25 text-muted"
                    }`}
                  >
                    {done ? <Check size={13} /> : i + 1}
                  </div>
                  <span className={`text-[11px] tracking-widest hidden sm:inline uppercase ${active || done ? "text-ivory" : "text-muted"}`}>{s}</span>
                </div>
                {i < steps.length - 1 && <div className="w-6 sm:w-12 h-px bg-gold/20" />}
              </div>
            );
          })}
        </div>

        {step === "CONFIRMATION" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto text-center py-10">
            <div className="w-16 h-16 rounded-full border border-gold mx-auto flex items-center justify-center mb-8 bg-gold/10">
              <Check size={28} className="text-gold" />
            </div>
            <div className="text-[10px] font-mono tracking-[4px] text-gold uppercase mb-2">ORDER REGISTERED</div>
            <h1 className="font-serif text-3xl font-bold mb-4">Acquisition Confirmed</h1>
            <p className="text-muted leading-relaxed text-sm mb-2">Thank you, {form.name || "valued client"}.</p>
            <p className="text-muted leading-relaxed text-xs mb-8">
              Your order <span className="text-gold font-mono font-bold">#{orderNumber}</span> has been placed. A luxury receipt has
              been dispatched to {form.email || "your email"}.
            </p>

            <div className="border border-gold/25 p-6 text-left mb-8 bg-navy2 rounded-lg space-y-3 font-sans text-xs">
              <div className="flex justify-between text-muted"><span>Order Reference:</span><span className="text-gold font-mono font-bold">{orderNumber}</span></div>
              <div className="flex justify-between text-muted"><span>Total Amount:</span><span className="text-gold font-mono font-bold">{formatPKR(total)}</span></div>
              <div className="flex justify-between text-muted"><span>Selected Payment Method:</span><span className="text-ivory font-semibold">{selectedMethod}</span></div>
              <div className="flex justify-between text-muted"><span>Payment Status:</span><span className="text-amber-300 font-semibold">{selectedMethod === "Cash on Delivery" ? "Pending Delivery Collection" : "Pending Staff Verification"}</span></div>
              <div className="flex justify-between text-muted"><span>Courier Dispatch:</span><span className="text-ivory font-semibold">DHL Express / TCS Luxury</span></div>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <Link to="/account/orders" className="btn-gold-fill font-sans text-xs">
                TRACK IN MY ACCOUNT →
              </Link>
            </div>
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
                    <div className="border-b border-gold/20 pb-3">
                      <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold">STEP 1 OF 3</span>
                      <h2 className="font-serif text-2xl text-ivory font-bold">Client Contact Information</h2>
                    </div>
                    <Field label="Email Address" type="email" value={form.email} onChange={(v) => update("email", v)} required placeholder="client@domain.com" />
                    <Field label="Full Legal Name" value={form.name} onChange={(v) => update("name", v)} required placeholder="e.g. Lord Alexander Sinclair" />
                    <Field label="Contact Phone Number" type="tel" value={form.phone} onChange={(v) => update("phone", v)} required placeholder="+92 300 8472910" />
                  </>
                )}

                {step === "SHIPPING" && (
                  <>
                    <div className="border-b border-gold/20 pb-3">
                      <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold">STEP 2 OF 3</span>
                      <h2 className="font-serif text-2xl text-ivory font-bold">Boutique Delivery Address</h2>
                    </div>
                    <Field label="Street Address" value={form.address} onChange={(v) => update("address", v)} required placeholder="Residence, House / Apartment No..." />
                    <div className="grid sm:grid-cols-2 gap-6">
                      <Field label="City" value={form.city} onChange={(v) => update("city", v)} required />
                      <Field label="Postal Code" value={form.postalCode} onChange={(v) => update("postalCode", v)} required />
                    </div>
                    <Field label="Country" value={form.country} onChange={(v) => update("country", v)} required />
                  </>
                )}

                {step === "PAYMENT" && (
                  <>
                    <div className="border-b border-gold/20 pb-3">
                      <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold">STEP 3 OF 3</span>
                      <h2 className="font-serif text-2xl text-ivory font-bold">Select Payment Method (Pakistan)</h2>
                    </div>

                    {/* Payment Method Selector Grid */}
                    <div className="grid grid-cols-2 gap-3 font-sans">
                      {[
                        { id: "Cash on Delivery", label: "Cash on Delivery", desc: "Pay cash upon courier delivery", icon: Truck },
                        { id: "JazzCash", label: "JazzCash Mobile Wallet", desc: "Instant mobile wallet transfer", icon: Smartphone },
                        { id: "Raast", label: "Raast Instant Transfer", desc: "State Bank zero-fee Raast ID", icon: Banknote },
                        { id: "Bank Transfer", label: "Direct Bank Transfer", desc: "Meezan Bank IBAN transfer", icon: Building2 },
                      ].map((m) => {
                        const Icon = m.icon;
                        const isSelected = selectedMethod === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setSelectedMethod(m.id as PaymentMethod)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all space-y-2 ${
                              isSelected
                                ? "bg-navy2 border-gold shadow-lg ring-1 ring-gold/40"
                                : "bg-navy/60 border-gold/20 hover:border-gold/40"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <Icon className={`w-5 h-5 ${isSelected ? "text-gold" : "text-muted"}`} />
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-gold bg-gold" : "border-gold/30"}`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-navy" />}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-serif font-bold text-xs text-ivory">{m.label}</h4>
                              <p className="text-[10px] text-muted leading-tight mt-0.5">{m.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Payment Method Specific Instructions Box */}
                    <div className="bg-navy2 border border-gold/30 p-5 rounded-lg space-y-4 font-sans text-xs">
                      {selectedMethod === "Cash on Delivery" && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-gold font-bold uppercase text-[11px] font-mono">
                            <Truck className="w-4 h-4" />
                            <span>CASH ON DELIVERY INSTRUCTIONS</span>
                          </div>
                          <p className="text-muted leading-relaxed">
                            Pay the exact order amount of <strong className="text-gold font-mono">{formatPKR(total)}</strong> in cash to the DHL / TCS courier representative upon delivery at your door.
                          </p>
                        </div>
                      )}

                      {selectedMethod === "JazzCash" && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 text-gold font-bold uppercase text-[11px] font-mono">
                            <Smartphone className="w-4 h-4" />
                            <span>JAZZCASH PAYMENT INSTRUCTIONS</span>
                          </div>
                          <div className="bg-navy p-3 rounded border border-gold/15 space-y-1 font-mono text-[11px]">
                            <p className="flex justify-between">
                              <span className="text-muted">Account Number:</span>
                              <span className="text-gold font-bold flex items-center gap-1">
                                0300 8472910
                                <button type="button" onClick={() => copyToClipboard("03008472910", "jc")} className="hover:text-ivory"><Copy className="w-3 h-3" /></button>
                              </span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-muted">Account Title:</span>
                              <span className="text-ivory font-bold">HM Signature Atelier</span>
                            </p>
                          </div>
                          <Field
                            label="Transaction Reference / TID (12 Digits)"
                            value={form.paymentReference}
                            onChange={(v) => update("paymentReference", v)}
                            placeholder="e.g. 098234112984"
                            required
                          />
                        </div>
                      )}

                      {selectedMethod === "Raast" && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 text-gold font-bold uppercase text-[11px] font-mono">
                            <Banknote className="w-4 h-4" />
                            <span>RAAST INSTANT PAYMENT INSTRUCTIONS</span>
                          </div>
                          <div className="bg-navy p-3 rounded border border-gold/15 space-y-1 font-mono text-[11px]">
                            <p className="flex justify-between">
                              <span className="text-muted">Raast ID (Phone):</span>
                              <span className="text-gold font-bold flex items-center gap-1">
                                03008472910
                                <button type="button" onClick={() => copyToClipboard("03008472910", "raast")} className="hover:text-ivory"><Copy className="w-3 h-3" /></button>
                              </span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-muted">IBAN Raast ID:</span>
                              <span className="text-ivory font-bold">PK36MEZN0001029384756101</span>
                            </p>
                          </div>
                          <Field
                            label="Raast Transaction Reference ID"
                            value={form.paymentReference}
                            onChange={(v) => update("paymentReference", v)}
                            placeholder="e.g. RAAST-992381"
                            required
                          />
                        </div>
                      )}

                      {selectedMethod === "Bank Transfer" && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 text-gold font-bold uppercase text-[11px] font-mono">
                            <Building2 className="w-4 h-4" />
                            <span>DIRECT BANK TRANSFER DETAILS</span>
                          </div>
                          <div className="bg-navy p-3 rounded border border-gold/15 space-y-1.5 font-mono text-[11px]">
                            <p className="flex justify-between"><span className="text-muted">Bank Name:</span><span className="text-ivory font-bold">Meezan Bank Ltd.</span></p>
                            <p className="flex justify-between"><span className="text-muted">Account Title:</span><span className="text-ivory font-bold">HM Signature (Pvt) Ltd</span></p>
                            <p className="flex justify-between"><span className="text-muted">Account Number:</span><span className="text-gold font-bold">0102 9384 7561 01</span></p>
                            <p className="flex justify-between"><span className="text-muted">IBAN:</span><span className="text-gold font-bold">PK36 MEZN 0001 0293 8475 6101</span></p>
                          </div>
                          <Field
                            label="Bank Transfer Reference / Deposit Slip No."
                            value={form.paymentReference}
                            onChange={(v) => update("paymentReference", v)}
                            placeholder="e.g. TRX-MEEZAN-88231"
                            required
                          />
                        </div>
                      )}

                      {form.copiedField && (
                        <div className="text-[10px] text-emerald-300 font-mono text-center">
                          ✓ Copied to clipboard!
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="flex gap-4 pt-4">
                  {step !== "CONTACT" && (
                    <button
                      type="button"
                      onClick={() => setStep(steps[steps.indexOf(step) - 1])}
                      className="px-6 py-3 border border-gold/30 text-ivory hover:border-gold rounded font-sans text-xs uppercase tracking-wider font-semibold transition-colors flex-1"
                    >
                      BACK
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="btn-gold-fill flex-1 text-center font-sans text-xs font-bold uppercase tracking-wider py-3 shadow-lg"
                  >
                    {isProcessing ? "PROCESSING ORDER..." : step === "PAYMENT" ? `CONFIRM ${selectedMethod.toUpperCase()} ORDER →` : "CONTINUE →"}
                  </button>
                </div>
              </motion.form>
            </AnimatePresence>

            {/* Right Side Summary Panel */}
            <div className="border border-gold/25 p-8 h-fit bg-navy2 rounded-xl shadow-xl space-y-6">
              <h3 className="font-serif text-xl font-bold border-b border-gold/15 pb-3">Acquisition Summary</h3>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-4 items-center">
                    <ProductVisual product={item.product} className="w-14 h-16 shrink-0 flex items-center justify-center border border-gold/20 bg-navy rounded" bottleSize="w-6" />
                    <div className="flex-1 font-sans">
                      <div className="text-xs font-serif font-bold text-ivory">{item.product.name}</div>
                      <div className="text-[10px] text-muted">Qty {item.quantity}</div>
                    </div>
                    <span className="text-xs font-mono text-gold font-semibold">{formatPKR(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-xs font-sans pt-4 border-t border-gold/15">
                <div className="flex justify-between text-muted"><span>Subtotal</span><span className="text-ivory font-mono">{formatPKR(subtotal + promoDiscountAmount)}</span></div>
                {promoDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <span>Discount ({promoCode})</span>
                    <span className="font-mono">- {formatPKR(promoDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted"><span>Boutique Shipping</span><span className="text-ivory font-mono">{shipping === 0 ? "Complimentary" : formatPKR(shipping)}</span></div>
                <div className="flex justify-between pt-3 border-t border-gold/15 text-sm">
                  <span className="font-serif font-bold text-ivory">Total Amount</span>
                  <span className="font-mono font-bold text-gold">{formatPKR(total)}</span>
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
    <label className="block font-sans text-xs">
      <span className="text-[10px] tracking-widest text-gold uppercase mb-1.5 block font-mono">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-navy border border-gold/25 px-4 py-2.5 text-ivory focus:outline-none focus:border-gold rounded font-sans"
      />
    </label>
  );
}
