import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Banknote, Smartphone, Building2, Truck, Copy, CreditCard, AlertTriangle } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAdminData, type PaymentMethod } from "../admin/context/AdminDataContext";
import ProductVisual from "../components/ProductVisual";
import { formatPKR } from "../utils/currency";
import { sendTransactionalEmail } from "../services/emailService";
import { supabase } from "../lib/supabase";
import {
  fetchPaymentMethodsConfig,
  fetchShippingConfig,
  type PaymentMethodConfig,
  type ShippingConfig,
  DEFAULT_SHIPPING_CONFIG,
} from "../services/storeConfig";
import { placeOrderRpc, setOrderGiftOptionsRpc, submitPaymentProofRpc } from "../services/checkoutOps";
import { saveCustomerOrderNotes } from "../services/tracking";

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

  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  const [paymentConfigs, setPaymentConfigs] = useState<PaymentMethodConfig[]>([]);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(DEFAULT_SHIPPING_CONFIG);
  const [isGiftWrap, setIsGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string>("");
  const [placedTotal, setPlacedTotal] = useState<number>(0);

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchPaymentMethodsConfig()
      .then((methods) => {
        if (!mounted) return;
        const enabled = methods.filter((m) => m.enabled !== false);
        setPaymentConfigs(enabled);
        if (enabled.length > 0 && !enabled.some((m) => m.id === selectedMethod)) {
          setSelectedMethod(enabled[0].id as PaymentMethod);
        }
      })
      .catch(() => setPaymentConfigs([]));
    fetchShippingConfig().then((c) => {
      if (mounted) setShippingConfig(c);
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeMethodConfig = paymentConfigs.find((m) => m.id === selectedMethod);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    update("copiedField", fieldName);
    setTimeout(() => update("copiedField", ""), 2500);
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setProofError(null);
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProofError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setProofError("Payment screenshot file size must be less than 10MB.");
      return;
    }

    setPaymentProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeProofFile = () => {
    setPaymentProofFile(null);
    setPaymentProofPreview(null);
    setProofError(null);
  };

  const handleSubmitOrder = async () => {
    setIsProcessing(true);
    setProofError(null);
    setOrderError(null);

    try {
      const cfg = activeMethodConfig;
      const requiresReference = Boolean(cfg?.requiresReference);
      const requiresProof = Boolean(cfg?.requiresProof);

      if (requiresReference && !form.paymentReference.trim()) {
        setProofError(`Enter your ${cfg?.referenceLabel || "transaction reference"} so we can match your payment.`);
        setIsProcessing(false);
        return;
      }
      if (requiresProof && !paymentProofFile) {
        setProofError("Attach a screenshot of your payment confirmation.");
        setIsProcessing(false);
        return;
      }

      // Every line must resolve to a real catalogue size before we ask the
      // database to price and reserve it.
      const rpcItems = items
        .map((i) => {
          const wanted = (i.selectedSize || i.product.size || "50ml").toLowerCase();
          const variant = i.product.variants?.find((v) => v.size.toLowerCase() === wanted && !v.id.startsWith("v-"));
          return variant ? { variant_id: variant.id, quantity: i.quantity } : null;
        });

      if (rpcItems.some((r) => r === null)) {
        setOrderError("One of the selected sizes is no longer available. Please review your bag.");
        setIsProcessing(false);
        return;
      }

      const authUser = (await supabase.auth.getUser()).data.user;

      // Payment proof goes to the private bucket first; the database row is
      // written by submit_payment_proof so RLS cannot silently drop it. The
      // storage policy and the RPC both require a signed-in owner folder, so a
      // guest cannot attach evidence from this page.
      let uploadedProofPath = "";
      if (requiresProof && paymentProofFile) {
        if (!authUser) {
          setProofError("Please sign in to attach a payment screenshot, or send the reference with your order.");
          setIsProcessing(false);
          return;
        }
        const fileExt = paymentProofFile.name.split(".").pop()?.toLowerCase() || "png";
        const filePath = `proofs/${authUser.id}/${Date.now()}-proof-${Math.random().toString(36).slice(2, 7)}.${fileExt}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("payment-proofs")
          .upload(filePath, paymentProofFile, { upsert: false });

        if (uploadErr || !uploadData) {
          setProofError(`Your payment screenshot could not be uploaded (${uploadErr?.message || "storage unavailable"}). Please try again.`);
          setIsProcessing(false);
          return;
        }
        uploadedProofPath = uploadData.path;
      }

      const placed = await placeOrderRpc({
        customerId: authUser?.id || null,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        shippingAddress: {
          street: form.address,
          city: form.city,
          state: "Punjab",
          zip: form.postalCode,
          country: form.country,
        },
        paymentMethod: selectedMethod,
        couponCode: promoCode,
        items: rpcItems as { variant_id: string; quantity: number }[],
      });

      if (!placed.success || !placed.orderId) {
        // Nothing was reserved and nothing was written: keep the bag intact.
        setOrderError(placed.error || "Your order could not be registered. Please try again.");
        setIsProcessing(false);
        return;
      }

      setPlacedOrderNumber(placed.orderNumber || "");
      setPlacedTotal(placed.total ?? total);

      if (uploadedProofPath || form.paymentReference) {
        const proof = await submitPaymentProofRpc(placed.orderId, {
          reference: form.paymentReference,
          proofPath: uploadedProofPath,
          note: cfg?.instructionHeading,
        });
        if (!proof.success) {
          setOrderError(
            `${placed.orderNumber} was registered, but your payment evidence was not attached (${proof.error}). Please send it to the concierge.`
          );
        }
      }

      if (authUser && (isGiftWrap || giftMessage.trim())) {
        const gift = await setOrderGiftOptionsRpc(placed.orderId, isGiftWrap, giftMessage);
        if (!gift.success) {
          setOrderError(
            `${placed.orderNumber} was registered, but the gift presentation was not saved (${gift.error}). Please tell the concierge so it can be added before dispatch.`
          );
        }
      }

      if (authUser && deliveryNotes.trim()) {
        const notes = await saveCustomerOrderNotes(placed.orderId, deliveryNotes.trim());
        if (!notes.success) {
          setOrderError(
            `${placed.orderNumber} was registered, but your delivery note was not saved (${notes.error}).`
          );
        }
      }

      await addOrder({
        id: placed.orderId,
        orderNumber: placed.orderNumber || "",
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        total: placed.total ?? total,
        subtotal: placed.subtotal ?? subtotal,
        discount: placed.discount ?? promoDiscountAmount,
        discountAmount: placed.discount ?? promoDiscountAmount,
        shippingFee: placed.shipping ?? shipping,
        shippingCost: placed.shipping ?? shipping,
        status: "Pending",
        paymentStatus: requiresProof || requiresReference ? "Verification Pending" : "Pending",
        paymentMethod: selectedMethod,
        paymentReference: form.paymentReference || undefined,
        paymentProofUrl: uploadedProofPath || undefined,
        shippingStatus: "Unfulfilled",
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
        items: items.map((i) => ({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: i.product.id,
          name: i.product.name,
          sku: i.sku || (i.product as any).sku || "",
          size: i.selectedSize || i.product.size || "50ml",
          price: i.price ?? i.product.price,
          quantity: i.quantity,
          image: i.product.photos?.[0] || i.product.images?.[0] || "texture-velvet",
        })),
      } as any);

      await sendTransactionalEmail({
        to: form.email,
        subject: `HM Signature Order Placed #${placed.orderNumber}`,
        template: "order_confirmation",
        data: {
          orderNumber: placed.orderNumber || "",
          customerName: form.name,
          total: placed.total ?? total,
          paymentMethod: selectedMethod,
          shippingCity: form.city,
        },
      });

      clearCart();
      setStep("CONFIRMATION");
    } catch (error: any) {
      console.error("Order processing error:", error);
      setOrderError(error?.message || "Your order could not be placed. Please try again.");
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
              Your order <span className="text-gold font-mono font-bold">#{placedOrderNumber}</span> has been placed. A receipt has
              been sent to {form.email || "your email"}.
            </p>

            <div className="border border-gold/25 p-6 text-left mb-8 bg-navy2 rounded-lg space-y-3 font-sans text-xs">
              <div className="flex justify-between text-muted"><span>Order Reference:</span><span className="text-gold font-mono font-bold">{placedOrderNumber}</span></div>
              <div className="flex justify-between text-muted"><span>Total Amount:</span><span className="text-gold font-mono font-bold">{formatPKR(placedTotal)}</span></div>
              <div className="flex justify-between text-muted"><span>Selected Payment Method:</span><span className="text-ivory font-semibold">{selectedMethod}</span></div>
              <div className="flex justify-between text-muted"><span>Payment Status:</span><span className="text-amber-300 font-semibold">{Boolean(activeMethodConfig?.requiresReference || activeMethodConfig?.requiresProof) ? "Awaiting verification" : "Awaiting delivery collection"}</span></div>
              <div className="flex justify-between text-muted"><span>Typical Delivery:</span><span className="text-ivory font-semibold">{shippingConfig.estimatedDays}</span></div>
              <div className="flex justify-between text-muted"><span>Gift Presentation:</span><span className="text-ivory font-semibold">{isGiftWrap ? "Requested with note card" : "Standard packaging"}</span></div>
            </div>

            <p className="text-[11px] text-muted font-light mb-6 leading-relaxed">
              You can follow this order from your account, or with the tracking reference on the Track Order page once it is dispatched.
            </p>

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

                    <div className="space-y-3 pt-2 border-t border-gold/15">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isGiftWrap}
                          onChange={(e) => setIsGiftWrap(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-[#c9a961] shrink-0"
                        />
                        <span className="font-sans">
                          <span className="block text-xs text-ivory font-medium">Present it as a gift</span>
                          <span className="block text-[11px] text-muted font-light leading-relaxed">
                            Hand-tied ribbon with a note card, at no additional charge.
                          </span>
                        </span>
                      </label>

                      {isGiftWrap && (
                        <div className="space-y-1">
                          <label htmlFor="gift-message" className="text-[10px] uppercase tracking-widest text-gold font-mono">
                            Gift message
                          </label>
                          <textarea
                            id="gift-message"
                            value={giftMessage}
                            onChange={(e) => setGiftMessage(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder="Written by hand on our presentation card."
                            className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold font-sans"
                          />
                          <p className="text-[10px] text-muted font-mono text-right">{giftMessage.length}/500</p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label htmlFor="delivery-notes" className="text-[10px] uppercase tracking-widest text-gold font-mono">
                          Delivery notes (optional)
                        </label>
                        <textarea
                          id="delivery-notes"
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          rows={2}
                          maxLength={500}
                          placeholder="Gate code, preferred arrival window, who to call on arrival."
                          className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold font-sans"
                        />
                      </div>

                      <p className="text-[11px] text-muted font-light">
                        Typical delivery time: <span className="text-ivory">{shippingConfig.estimatedDays}</span>.
                      </p>
                    </div>
                  </>
                )}

                {step === "PAYMENT" && (
                  <>
                    <div className="border-b border-gold/20 pb-3">
                      <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold">STEP 3 OF 3</span>
                      <h2 className="font-serif text-2xl text-ivory font-bold">Select Payment Method (Pakistan)</h2>
                    </div>

                    {/* Payment Method Selector Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans" role="radiogroup" aria-label="Payment method">
                      {paymentConfigs.map((m) => {
                        const Icon =
                          m.id === "JazzCash" ? Smartphone
                          : m.id === "Raast" ? Banknote
                          : m.id === "Bank Transfer" ? Building2
                          : m.id === "Cash on Delivery" ? Truck
                          : CreditCard;
                        const isSelected = selectedMethod === m.id;
                        return (
                          <label
                            key={m.id}
                            className={`p-4 rounded-lg border transition-all space-y-2 cursor-pointer ${
                              isSelected
                                ? "bg-navy2 border-gold shadow-lg ring-1 ring-gold/40"
                                : "bg-navy/60 border-gold/20 hover:border-gold/40"
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment_method"
                              value={m.id}
                              checked={isSelected}
                              onChange={() => setSelectedMethod(m.id as PaymentMethod)}
                              className="sr-only"
                            />
                            <div className="flex items-center justify-between">
                              <Icon className={`w-5 h-5 ${isSelected ? "text-gold" : "text-muted"}`} />
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-gold bg-gold" : "border-gold/30"}`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-navy" />}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-serif font-bold text-xs text-ivory">{m.label}</h4>
                              <p className="text-[10px] text-muted leading-tight mt-0.5">{m.description}</p>
                            </div>
                          </label>
                        );
                      })}
                      {paymentConfigs.length === 0 && (
                        <p className="text-[11px] text-muted font-light sm:col-span-2">
                          No payment methods are configured yet. Please contact the concierge to complete your order.
                        </p>
                      )}
                    </div>

                    {/* Payment Method Specific Instructions Box */}
                    <div className="bg-navy2 border border-gold/30 p-5 rounded-lg space-y-4 font-sans text-xs">
                      {activeMethodConfig && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 text-gold font-bold uppercase text-[11px] font-mono">
                            <Truck className="w-4 h-4" />
                            <span>{activeMethodConfig.instructionHeading || `${activeMethodConfig.label} instructions`}</span>
                          </div>

                          {activeMethodConfig.id === "Cash on Delivery" ? (
                            <p className="text-muted leading-relaxed">
                              Pay the exact order total of <strong className="text-gold font-mono">{formatPKR(total)}</strong> in cash to the courier when your parcel arrives.
                            </p>
                          ) : (
                            <div className="bg-navy p-3 rounded border border-gold/15 space-y-1.5 font-mono text-[11px]">
                              {activeMethodConfig.details.map((d) => (
                                <p key={d.label} className="flex justify-between gap-3">
                                  <span className="text-muted">{d.label}:</span>
                                  <span className={`text-ivory font-bold flex items-center gap-1 text-right ${d.copyValue ? "text-gold" : ""}`}>
                                    {d.value}
                                    {d.copyValue && (
                                      <button
                                        type="button"
                                        aria-label={`Copy ${d.label}`}
                                        onClick={() => copyToClipboard(d.copyValue || d.value, d.label)}
                                        className="hover:text-ivory shrink-0"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    )}
                                  </span>
                                </p>
                              ))}
                            </div>
                          )}

                          {activeMethodConfig.requiresReference && (
                            <Field
                              label={activeMethodConfig.referenceLabel || "Transaction Reference"}
                              value={form.paymentReference}
                              onChange={(v) => update("paymentReference", v)}
                              placeholder={activeMethodConfig.referencePlaceholder || "Enter the reference from your transfer"}
                              required
                            />
                          )}
                        </div>
                      )}

                      {/* Payment Screenshot Upload Field for Digital Transfer Methods */}
                      {activeMethodConfig?.requiresProof && (
                        <div className="space-y-2 pt-2 border-t border-gold/15">
                          <span className="text-[10px] tracking-widest text-gold uppercase block font-mono">
                            Upload Payment Screenshot / Transfer Receipt <span className="text-gold">*</span>
                          </span>

                          {!paymentProofPreview ? (
                            <label className="border-2 border-dashed border-gold/30 hover:border-gold/60 bg-navy p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors">
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleProofFileChange}
                                className="hidden"
                              />
                              <span className="text-xs text-ivory font-medium">Click to select screenshot image</span>
                              <span className="text-[10px] text-muted mt-1">Supports PNG, JPG, WebP up to 10MB</span>
                            </label>
                          ) : (
                            <div className="bg-navy p-3 rounded border border-gold/30 flex items-center justify-between">
                              <div className="flex items-center space-x-3 overflow-hidden">
                                <img
                                  src={paymentProofPreview}
                                  alt="Payment Screenshot Preview"
                                  className="w-12 h-12 object-cover rounded border border-gold/20 shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="text-xs font-serif font-bold text-ivory block truncate">
                                    {paymentProofFile?.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-emerald-400 block">
                                    ✓ Screenshot attached ({(paymentProofFile!.size / 1024).toFixed(1)} KB)
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={removeProofFile}
                                className="px-2 py-1 text-[10px] font-mono uppercase bg-rose-950/60 text-rose-300 border border-rose-800/40 rounded hover:bg-rose-900"
                              >
                                Remove
                              </button>
                            </div>
                          )}

                          {proofError && (
                            <p className="text-[11px] text-rose-400 font-mono mt-1">{proofError}</p>
                          )}
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

                {orderError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 px-4 py-3 rounded-lg border border-rose-600/50 bg-rose-950/50 text-rose-200 text-xs font-sans"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{orderError}</span>
                  </div>
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
                    disabled={isProcessing || paymentConfigs.length === 0}
                    className="btn-gold-fill flex-1 text-center font-sans text-xs font-bold uppercase tracking-wider py-3 shadow-lg disabled:opacity-50"
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
                {items.map((item) => {
                  const itemId = item.id || `${item.product.id}-${item.selectedSize}`;
                  const unitPrice = item.price ?? item.product.price;
                  return (
                    <div key={itemId} className="flex gap-4 items-center font-sans">
                      <ProductVisual product={item.product} className="w-14 h-16 shrink-0 flex items-center justify-center border border-gold/20 bg-navy rounded" bottleSize="w-6" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-serif font-bold text-ivory truncate">{item.product.name}</div>
                        <div className="flex items-center space-x-2 text-[10px] text-muted">
                          <span className="font-mono text-gold font-bold bg-gold/10 px-1 py-0.2 rounded border border-gold/30">
                            {item.selectedSize}
                          </span>
                          <span>•</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-gold font-semibold">{formatPKR(unitPrice * item.quantity)}</span>
                    </div>
                  );
                })}
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
