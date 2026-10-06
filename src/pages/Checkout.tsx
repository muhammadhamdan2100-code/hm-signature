import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Banknote, Smartphone, Building2, Truck, Copy, CreditCard, AlertTriangle, Globe2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAdminData } from "../admin/context/AdminDataContext";
import ProductVisual from "../components/ProductVisual";
import { drainOwnEmailQueue } from "../services/emailService";
import { supabase } from "../lib/supabase";
import {
  fetchCheckoutMethods,
  fetchPaymentMethodsConfig,
  type CheckoutMethod,
  type PaymentMethodConfig,
} from "../services/storeConfig";
import { placeOrderRpc, setOrderGiftOptionsRpc, submitPaymentProofRpc } from "../services/checkoutOps";
import { captureEvent } from "../services/analyticsCapture";
import { saveCustomerOrderNotes } from "../services/tracking";
import { quoteOrder, type PricingQuote } from "../services/internationalConfig";
import { useCurrency } from "../context/CurrencyContext";
import { useI18n } from "../i18n/I18nProvider";

const steps = ["CONTACT", "SHIPPING", "PAYMENT", "CONFIRMATION"] as const;
type Step = (typeof steps)[number];

const BASE_CURRENCY = "PKR";

export default function Checkout() {
  const { items, subtotal, shipping, total, promoCode, promoDiscountAmount, clearCart } = useCart();
  const { addOrder } = useAdminData();
  const { t } = useI18n();
  const { currency, countries, country, setCountryCode, format } = useCurrency();

  const [step, setStep] = useState<Step>("CONTACT");
  // The chosen rail is identified by its configuration code, not its display name: several
  // countries offer a method called "Bank Card", and only the code says which one this is.
  const [selectedCode, setSelectedCode] = useState("");

  const [form, setForm] = useState(() => ({
    email: "",
    name: "",
    phone: "",
    address: "",
    city: "Lahore",
    postalCode: "54600",
    region: "Punjab",
    countryCode: country?.code ?? "",
    countryName: country?.name ?? "Pakistan",
    paymentReference: "",
    copiedField: "",
  }));

  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  const [paymentConfigs, setPaymentConfigs] = useState<PaymentMethodConfig[]>([]);
  // What the payment-method architecture says is offered for this destination, in this currency,
  // with the state resolved server-side (available / coming soon / not configured / unavailable).
  const [configuredMethods, setConfiguredMethods] = useState<CheckoutMethod[]>([]);
  const [methodsProblem, setMethodsProblem] = useState<string | null>(null);
  const [returnNotice, setReturnNotice] = useState<string | null>(null);
  const [isGiftWrap, setIsGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string>("");
  const [placedTotal, setPlacedTotal] = useState<number>(0);
  const [placedReceipt, setPlacedReceipt] = useState<{ currency: string; tax: number; totalInCurrency?: number; country?: string } | null>(null);
  const [emailDelivered, setEmailDelivered] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string>("");
  const [hostedPaymentError, setHostedPaymentError] = useState<string | null>(null);
  const [hostedPaymentBusy, setHostedPaymentBusy] = useState(false);

  // The figures a shopper confirms are the figures the database will charge.
  const [pricing, setPricing] = useState<PricingQuote | null>(null);
  const [pricingProblem, setPricingProblem] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    // The instruction copy (account titles, reference labels) stays in site_settings. What a
    // customer may actually submit comes from the payment-method configuration instead.
    fetchPaymentMethodsConfig()
      .then((methods) => {
        if (mounted) setPaymentConfigs(methods.filter((m) => m.enabled !== false));
      })
      .catch(() => setPaymentConfigs([]));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A browser that leaves the card page can come back to /checkout?payment=cancelled. The order
  // row was created before the redirect, so the notice says what really happened: nothing was
  // charged and the payment is still pending.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "cancelled") setReturnNotice(t("checkout.cardPaymentCancelled"));
  }, [t]);

  useEffect(() => {
    if (!form.countryCode) return;
    let alive = true;
    fetchCheckoutMethods(form.countryCode, currency.code)
      .then(({ methods, degraded }) => {
        if (!alive) return;
        setConfiguredMethods(methods);
        setMethodsProblem(degraded && methods.length === 0 ? t("checkout.noMethods") : null);
        setSelectedCode((current) => {
          // Keep the shopper's choice when the destination or currency changes and that rail is
          // still submittable; otherwise move to the first one that is.
          if (methods.some((m) => m.code === current && m.canSubmit)) return current;
          return methods.find((m) => m.canSubmit)?.code ?? "";
        });
      })
      .catch(() => {
        if (!alive) return;
        setConfiguredMethods([]);
        setSelectedCode("");
        setMethodsProblem(t("checkout.noMethods"));
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.countryCode, currency.code]);

  // Follow the header destination once it is known, so the address form and the
  // priced basket always agree.
  useEffect(() => {
    if (!country) return;
    setForm((f) =>
      f.countryCode === country.code
        ? f
        : {
            ...f,
            countryCode: country.code,
            countryName: country.name,
            region: country.code === "PK" ? "Punjab" : "",
          }
    );
  }, [country]);

  const basket = useMemo(
    () =>
      items
        .map((i) => {
          const wanted = (i.selectedSize || i.product.size || "50ml").toLowerCase();
          const variant = i.product.variants?.find((v) => v.size.toLowerCase() === wanted && !v.id.startsWith("v-"));
          return variant ? { variant_id: variant.id, quantity: i.quantity } : null;
        })
        .filter(Boolean) as { variant_id: string; quantity: number }[],
    [items]
  );

  const unresolvedSizes = items.length > 0 && basket.length !== items.length;
  const basketSignature = JSON.stringify(basket.map((b) => [b.variant_id, b.quantity]));

  useEffect(() => {
    if (step === "CONFIRMATION" || basket.length === 0) {
      setPricing(null);
      return;
    }
    let alive = true;
    quoteOrder(basket, form.countryCode || null, currency.code, promoCode)
      .then((result) => {
        if (!alive) return;
        if ("error" in result) {
          setPricing(null);
          setPricingProblem(result.error);
        } else {
          setPricing(result);
          setPricingProblem(null);
        }
      })
      .catch(() => {
        if (alive) setPricingProblem(t("checkout.pricingUnavailable"));
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basketSignature, form.countryCode, currency.code, promoCode, step]);

  // The list a shopper sees is the configuration itself. A rail whose provider has no
  // credentials, or that a Super Admin marked as coming soon, is rendered but not selectable,
  // and the server refuses it again if something posts it anyway.
  const selectedMethod = configuredMethods.find((m) => m.code === selectedCode) ?? null;
  const selectedLabel = selectedMethod?.name ?? "";
  const submittableMethods = configuredMethods.filter((m) => m.canSubmit);
  // Nothing settleable for this destination - abroad that is the honest "coming soon" state,
  // because no international gateway has credentials yet.
  const noPaymentRoute = configuredMethods.length === 0 || submittableMethods.length === 0;
  const paymentMethodsAvailable = Boolean(selectedMethod?.canSubmit) && !pricingProblem && !methodsProblem;

  // A hosted rail is a page the browser is sent to after the order exists. Stripe collects the
  // card there; neither handler ever learns a card number, and neither marks anything paid.
  const isHostedRail = selectedMethod?.provider === "payfast" || selectedMethod?.provider === "stripe";

  // PayFast's documented Custom Integration is a form the browser posts; fetch
  // cannot complete it. The field set, including the signature, is built on the
  // server from the stored order total.
  const startHostedPayment = async () => {
    if (!placedOrderId) return;
    captureEvent({ event: "payment_started", orderId: placedOrderId, currencyCode: currency.code, countryCode: form.countryCode || null });
    setHostedPaymentBusy(true);
    setHostedPaymentError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/payfast-start", {
        method: "POST",
        headers: {
"Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId: placedOrderId }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { endpoint?: string; fields?: Record<string, string> }
        | null;
      if (!res.ok || !payload?.endpoint || !payload.fields) {
        setHostedPaymentError(
          res.status === 503 ? t("checkout.payfastUnavailable") : t("checkout.payfastNotOpened")
        );
        return;
      }
      const el = document.createElement("form");
      el.method = "POST";
      el.action = payload.endpoint;
      el.acceptCharset = "UTF-8";
      for (const [name, value] of Object.entries(payload.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = String(value ?? "");
        el.appendChild(input);
      }
      document.body.appendChild(el);
      el.submit();
    } catch {
      setHostedPaymentError(t("checkout.payfastNotOpened"));
    } finally {
      setHostedPaymentBusy(false);
    }
  };

  // 9.4 — reaching checkout is its own funnel step, recorded once per mount. The
  // shopper's identity is attached by the database from their session, never from
  // anything typed into this form.
  useEffect(() => {
    captureEvent({ event: "begin_checkout", currencyCode: currency.code, countryCode: form.countryCode || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The card rail asks this deployment's server to open a Stripe Checkout Session for the order
  // that was just created, then the browser leaves for Stripe's page. Nothing here learns a card
  // number, and nothing here calls the order paid: that happens in the provider's webhook.
  const startCardPayment = async () => {
    if (!placedOrderId || !selectedMethod) return;
    captureEvent({ event: "payment_started", orderId: placedOrderId, currencyCode: currency.code, countryCode: form.countryCode || null });
    setHostedPaymentBusy(true);
    setHostedPaymentError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/stripe-start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orderId: placedOrderId,
          methodCode: selectedMethod.code,
          currency: currency.code,
        }),
      });
      const payload = (await res.json().catch(() => null)) as { url?: string } | null;
      if (!res.ok || !payload?.url) {
        setHostedPaymentError(
          res.status === 503 ? t("checkout.payfastUnavailable") : t("checkout.payfastNotOpened")
        );
        return;
      }
      window.location.assign(payload.url);
    } catch {
      setHostedPaymentError(t("checkout.payfastNotOpened"));
    } finally {
      setHostedPaymentBusy(false);
    }
  };

  // Instruction copy is keyed by the method's display name, so the shopkeeper's edits on the
  // Payments page keep applying to the rails they describe.
  const activeMethodConfig = paymentConfigs.find((m) => m.id === selectedLabel);

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
      setProofError(t("checkout.invalidImage"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setProofError(t("checkout.imageTooBig"));
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
      // Whether evidence is required is a property of the configured rail, not of the copy that
      // describes it, so a rail cannot silently stop asking for a reference.
      const requiresReference = Boolean(selectedMethod?.requiresReference);
      const requiresProof = Boolean(selectedMethod?.requiresProof);

      if (!selectedMethod || !selectedMethod.canSubmit) {
        setOrderError(t("checkout.noMethods"));
        setIsProcessing(false);
        return;
      }

      if (requiresReference && !form.paymentReference.trim()) {
        setProofError(t("checkout.needReference", { label: cfg?.referenceLabel || t("checkout.referenceFallback") }));
        setIsProcessing(false);
        return;
      }
      if (requiresProof && !paymentProofFile) {
        setProofError(t("checkout.needProof"));
        setIsProcessing(false);
        return;
      }

      // Every line must resolve to a real catalogue size before we ask the
      // database to price and reserve it.
      if (unresolvedSizes) {
        setOrderError(t("checkout.sizeUnavailable"));
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
          setProofError(t("checkout.signInForProof"));
          setIsProcessing(false);
          return;
        }
        const fileExt = paymentProofFile.name.split(".").pop()?.toLowerCase() || "png";
        const filePath = `proofs/${authUser.id}/${Date.now()}-proof-${Math.random().toString(36).slice(2, 7)}.${fileExt}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("payment-proofs")
          .upload(filePath, paymentProofFile, { upsert: false });

        if (uploadErr || !uploadData) {
          console.error("Payment screenshot upload failed:", uploadErr?.message || "storage unavailable");
          setProofError(t("checkout.proofUploadFailed"));
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
          state: form.region,
          zip: form.postalCode,
          country: form.countryName,
        },
        paymentMethod: selectedLabel,
        couponCode: promoCode,
        items: basket,
        countryCode: form.countryCode || null,
        currency: currency.code,
      });

      if (!placed.success || !placed.orderId) {
        // Nothing was reserved and nothing was written: keep the bag intact.
        console.error("Order could not be registered:", placed.error);
        setOrderError(placed.error || t("checkout.orderFailed"));
        setIsProcessing(false);
        return;
      }

      setPlacedOrderNumber(placed.orderNumber || "");
      setPlacedOrderId(placed.orderId || "");
      setPlacedTotal(placed.total ?? total);
      setPlacedReceipt({
        currency: placed.currency || BASE_CURRENCY,
        tax: placed.tax ?? 0,
        totalInCurrency: placed.totalInCurrency,
        country: placed.destinationCountry,
      });

      if (uploadedProofPath || form.paymentReference) {
        const proof = await submitPaymentProofRpc(placed.orderId, {
          reference: form.paymentReference,
          proofPath: uploadedProofPath,
          note: cfg?.instructionHeading,
        });
        if (!proof.success) {
          console.error("Payment evidence could not be attached:", proof.error);
          setOrderError(t("checkout.proofNotAttached", { order: placed.orderNumber || "" }));
        }
      }

      if (authUser && (isGiftWrap || giftMessage.trim())) {
        const gift = await setOrderGiftOptionsRpc(placed.orderId, isGiftWrap, giftMessage);
        if (!gift.success) {
          console.error("Gift presentation request could not be saved:", gift.error);
          setOrderError(t("checkout.giftNotSaved", { order: placed.orderNumber || "" }));
        }
      }

      if (authUser && deliveryNotes.trim()) {
        const notes = await saveCustomerOrderNotes(placed.orderId, deliveryNotes.trim());
        if (!notes.success) {
          console.error("Delivery note could not be saved:", notes.error);
          setOrderError(t("checkout.notesNotSaved", { order: placed.orderNumber || "" }));
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
        paymentMethod: selectedLabel,
        paymentReference: form.paymentReference || undefined,
        paymentProofUrl: uploadedProofPath || undefined,
        shippingStatus: "Unfulfilled",
        createdAt: new Date().toISOString().split("T")[0],
        shippingAddress: {
          street: form.address,
          city: form.city,
          state: form.region,
          zip: form.postalCode,
          country: form.countryName,
        },
        billingAddress: {
          street: form.address,
          city: form.city,
          state: form.region,
          zip: form.postalCode,
          country: form.countryName,
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

      // Order confirmations are queued by the database when the order is created.
      // Asking the worker to drain this customer's queue delivers them straight
      // away when SMTP is configured; nothing here claims a send that did not
      // happen.
      const delivered = await drainOwnEmailQueue();
      setEmailDelivered(delivered > 0);

      clearCart();
      // 9.4 — the order exists, so the funnel's last step is recorded against its
      // id. Whether the money settled is a separate event, recorded where the
      // settled status is actually known.
      captureEvent({
        event: "order_completed",
        orderId: placed.orderId,
        currencyCode: placed.currency || currency.code,
        countryCode: placed.destinationCountry || form.countryCode || null,
      });
      setStep("CONFIRMATION");
    } catch (error: any) {
      console.error("Order processing error:", error);
      setOrderError(t("checkout.placeFailed"));
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

  const stepLabel: Record<Step, string> = {
    CONTACT: t("checkout.stepContact"),
    SHIPPING: t("checkout.stepShipping"),
    PAYMENT: t("checkout.stepPayment"),
    CONFIRMATION: t("checkout.stepConfirmation"),
  };

  const deliveryWindow = useMemo(() => {
    if (!country) return "";
    const min = country.deliveryDaysMin;
    const max = country.deliveryDaysMax;
    if (min && max) return min === max ? t("shipping.daysOne", { count: max }) : t("shipping.daysRange", { from: min, to: max });
    if (max) return t("shipping.daysUpTo", { count: max });
    return "";
  }, [country, t]);

  // Server figures once they arrive; the local bag estimate until then, so the panel
  // is never blank while the quote is in flight.
  const shownSubtotal = pricing?.subtotal ?? subtotal + promoDiscountAmount;
  const shownDiscount = pricing?.discount ?? promoDiscountAmount;
  const shownShipping = pricing?.shipping ?? shipping;
  const shownTax = pricing?.tax ?? 0;
  const shownTotal = pricing?.total ?? total;

  if (items.length === 0 && step !== "CONFIRMATION") {
    return (
      <div className="pt-40 pb-32 text-center bg-navy min-h-screen">
        <p className="text-muted mb-8 font-sans text-sm">{t("checkout.empty")}</p>
        <Link to="/collections" className="btn-gold-fill font-sans text-xs">{t("checkout.discover")}</Link>
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
                  <span className={`text-[11px] tracking-widest hidden sm:inline uppercase ${active || done ? "text-ivory" : "text-muted"}`}>
                    {stepLabel[s]}
                  </span>
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
            <div className="text-[10px] font-mono tracking-[4px] text-gold uppercase mb-2">{t("checkout.orderRegistered")}</div>
            <h1 className="font-serif text-3xl font-bold mb-4">{t("checkout.acquisitionConfirmed")}</h1>
            <p className="text-muted leading-relaxed text-sm mb-2">{t("checkout.thankYou", { name: form.name || t("checkout.valuedClient") })}</p>
            <p className="text-muted leading-relaxed text-xs mb-8">
              {t("checkout.orderPlaced")} <span className="text-gold font-mono font-bold">#{placedOrderNumber}</span>{" "}
              {t("checkout.hasBeenPlaced")}{" "}
              {emailDelivered
                ? t("checkout.emailReceipt", { email: form.email || t("checkout.emailFallback") })
                : t("checkout.emailUnavailable")}
            </p>

            <div className="border border-gold/25 p-6 text-start mb-8 bg-navy2 rounded-lg space-y-3 font-sans text-xs">
              <div className="flex justify-between text-muted"><span>{t("checkout.orderReference")}</span><span className="text-gold font-mono font-bold">{placedOrderNumber}</span></div>
              <div className="flex justify-between text-muted"><span>{t("checkout.totalAmountLabel")}</span><span className="text-gold font-mono font-bold">{format(placedTotal)}</span></div>
              {placedReceipt && placedReceipt.tax > 0 && (
                <div className="flex justify-between text-muted"><span>{t("checkout.taxLine")}</span><span className="text-ivory font-mono">{format(placedReceipt.tax)}</span></div>
              )}
              <div className="flex justify-between text-muted"><span>{t("checkout.currencyLabel")}</span><span className="text-ivory font-semibold">{placedReceipt?.currency ?? currency.code}</span></div>
              <div className="flex justify-between text-muted"><span>{t("checkout.deliveryToLabel")}</span><span className="text-ivory font-semibold">{form.countryName}</span></div>
              <div className="flex justify-between text-muted"><span>{t("checkout.selectedPayment")}</span><span className="text-ivory font-semibold">{selectedLabel}</span></div>
              <div className="flex justify-between text-muted"><span>{t("checkout.paymentStatusLabel")}</span><span className="text-amber-300 font-semibold">{selectedMethod?.requiresReference || selectedMethod?.requiresProof || isHostedRail ? t("checkout.awaitingVerification") : t("checkout.awaitingCollection")}</span></div>
              <div className="flex justify-between text-muted"><span>{t("checkout.typicalDeliveryLabel")}</span><span className="text-ivory font-semibold">{[country?.deliveryMethod, deliveryWindow].filter(Boolean).join(" · ") || "—"}</span></div>
              <div className="flex justify-between text-muted"><span>{t("checkout.giftPresentationLabel")}</span><span className="text-ivory font-semibold">{isGiftWrap ? t("checkout.withNoteCard") : t("checkout.standardPackaging")}</span></div>
            </div>

            <p className="text-[11px] text-muted font-light mb-6 leading-relaxed">
              {t("checkout.trackNote")}
            </p>

            <div className="flex items-center justify-center gap-4">
              {isHostedRail && (
                <button
                  type="button"
                  onClick={selectedMethod?.provider === "stripe" ? startCardPayment : startHostedPayment}
                  disabled={hostedPaymentBusy || !placedOrderId}
                  className="btn-gold-fill font-sans text-xs disabled:opacity-50"
                >
                  {hostedPaymentBusy ? t("checkout.opening") : t("checkout.continueSecure")}
                </button>
              )}
              <Link to="/account/orders" className="btn-gold font-sans text-xs">
                {t("checkout.trackOrder")}
              </Link>
            </div>

            {isHostedRail && hostedPaymentError && (
              <p role="alert" className="text-[11px] text-rose-300 mt-4 max-w-md mx-auto leading-relaxed">
                {hostedPaymentError}
              </p>
            )}
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
                      <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold">{t("checkout.stepOfThree", { n: 1 })}</span>
                      <h2 className="font-serif text-2xl text-ivory font-bold">{t("checkout.contactHeading")}</h2>
                    </div>
                    <Field label={t("checkout.email")} type="email" value={form.email} onChange={(v) => update("email", v)} required placeholder={t("checkout.emailPlaceholder")} />
                    <Field label={t("checkout.fullName")} value={form.name} onChange={(v) => update("name", v)} required placeholder={t("checkout.fullNamePlaceholder")} />
                    <Field label={t("checkout.phone")} type="tel" value={form.phone} onChange={(v) => update("phone", v)} required placeholder="+92 300 8472910" />
                  </>
                )}

                {step === "SHIPPING" && (
                  <>
                    <div className="border-b border-gold/20 pb-3">
                      <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold">{t("checkout.stepOfThree", { n: 2 })}</span>
                      <h2 className="font-serif text-2xl text-ivory font-bold">{t("checkout.shippingHeading")}</h2>
                    </div>

                    <CountryField
                      countries={countries}
                      value={form.countryCode}
                      onChange={(code) => {
                        const picked = countries.find((c) => c.code === code);
                        if (!picked) return;
                        setCountryCode(picked.code);
                        setForm((f) => ({
                          ...f,
                          countryCode: picked.code,
                          countryName: picked.name,
                          region: picked.code === "PK" ? "Punjab" : "",
                        }));
                      }}
                      label={t("checkout.country")}
                      unavailableSuffix={t("checkout.deliveryUnavailableSuffix")}
                    />

                    {pricingProblem && (
                      <p role="status" className="text-[11px] text-amber-300 font-sans leading-relaxed">
                        {pricingProblem}
                      </p>
                    )}

                    <Field label={t("checkout.street")} value={form.address} onChange={(v) => update("address", v)} required placeholder={t("checkout.streetPlaceholder")} />
                    <div className="grid sm:grid-cols-2 gap-6">
                      <Field label={t("checkout.city")} value={form.city} onChange={(v) => update("city", v)} required />
                      <Field label={t("checkout.postalCode")} value={form.postalCode} onChange={(v) => update("postalCode", v)} required />
                    </div>
                    <Field label={t("checkout.region")} value={form.region} onChange={(v) => update("region", v)} placeholder={t("checkout.regionPlaceholder")} />

                    {country?.enabled && (
                      <div className="rounded-lg border border-gold/25 bg-navy2/60 p-4 font-sans text-xs space-y-1.5">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("shipping.deliveryTo", { country: country.name })}</p>
                        <p className="text-ivory">
                          {[country.deliveryMethod, deliveryWindow].filter(Boolean).join(" · ")}
                        </p>
                        <p className="text-muted">
                          {shownShipping === 0
                            ? t("shipping.complimentary")
                            : t("shipping.fee", { amount: format(shownShipping) })}
                          {country.freeShippingThreshold != null && shownShipping > 0 && (
                            <> {t("shipping.freeOver", { amount: format(country.freeShippingThreshold) })}</>
                          )}
                        </p>
                        {country.notes && <p className="text-muted leading-relaxed">{country.notes}</p>}
                        {country.restrictions && (
                          <p className="text-muted leading-relaxed">{t("shipping.restrictions")}: {country.restrictions}</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-3 pt-2 border-t border-gold/15">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isGiftWrap}
                          onChange={(e) => setIsGiftWrap(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-[#c9a961] shrink-0"
                        />
                        <span className="font-sans">
                          <span className="block text-xs text-ivory font-medium">{t("checkout.giftTitle")}</span>
                          <span className="block text-[11px] text-muted font-light leading-relaxed">
                            {t("checkout.giftBody")}
                          </span>
                        </span>
                      </label>

                      {isGiftWrap && (
                        <div className="space-y-1">
                          <label htmlFor="gift-message" className="text-[10px] uppercase tracking-widest text-gold font-mono">
                            {t("checkout.giftMessage")}
                          </label>
                          <textarea
                            id="gift-message"
                            value={giftMessage}
                            onChange={(e) => setGiftMessage(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder={t("checkout.giftMessagePlaceholder")}
                            className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold font-sans"
                          />
                          <p className="text-[10px] text-muted font-mono text-end">{giftMessage.length}/500</p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label htmlFor="delivery-notes" className="text-[10px] uppercase tracking-widest text-gold font-mono">
                          {t("checkout.deliveryNotes")}
                        </label>
                        <textarea
                          id="delivery-notes"
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          rows={2}
                          maxLength={500}
                          placeholder={t("checkout.deliveryNotesPlaceholder")}
                          className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold font-sans"
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === "PAYMENT" && (
                  <>
                    <div className="border-b border-gold/20 pb-3">
                      <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold">{t("checkout.stepOfThree", { n: 3 })}</span>
                      <h2 className="font-serif text-2xl text-ivory font-bold">
                        {t("checkout.paymentHeading", { country: form.countryName })}
                      </h2>
                    </div>

                    {returnNotice && (
                      <p role="status" className="rounded-lg border border-gold/30 bg-navy2 p-4 text-[11px] text-ivory leading-relaxed font-sans">
                        {returnNotice}
                      </p>
                    )}

                        {/* Payment Method Selector Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans" role="radiogroup" aria-label={t("checkout.paymentMethodGroup")}>
                          {configuredMethods.map((m) => {
                            const Icon =
                              m.type === "wallet" ? Smartphone
                              : m.type === "instant" ? Banknote
                              : m.type === "bank_transfer" ? Building2
                              : m.type === "cash" ? Truck
                              : CreditCard;
                            const isSelected = selectedCode === m.code;
                            // A rail the server says cannot be submitted is shown, clearly marked,
                            // and never selectable - it is information, not an invitation.
                            const locked = !m.canSubmit;
                            const badge =
                              m.state === "coming_soon" || m.state === "not_configured"
                                ? t("checkout.methodComingSoon")
                                : m.state === "unavailable" || m.state === "disabled"
                                  ? t("checkout.methodUnavailable")
                                  : null;
                            return (
                              <label
                                key={m.code}
                                aria-disabled={locked || undefined}
                                className={`p-4 rounded-lg border transition-all space-y-2 ${
                                  isSelected
                                    ? "bg-navy2 border-gold shadow-lg ring-1 ring-gold/40"
                                    : locked
                                      ? "bg-navy/40 border-gold/10 opacity-60 cursor-not-allowed"
                                      : "bg-navy/60 border-gold/20 hover:border-gold/40 cursor-pointer"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="payment_method"
                                  value={m.code}
                                  checked={isSelected}
                                  disabled={locked}
                                  onChange={() => {
                                    if (!locked) setSelectedCode(m.code);
                                  }}
                                  className="sr-only"
                                />
                                <div className="flex items-center justify-between">
                                  <Icon className={`w-5 h-5 ${isSelected ? "text-gold" : "text-muted"}`} />
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-gold bg-gold" : "border-gold/30"}`}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-navy" />}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-serif font-bold text-xs text-ivory flex items-center gap-2 flex-wrap">
                                    <span>{m.name}</span>
                                    {badge && (
                                      <span className="px-2 py-0.5 rounded-full border border-gold/40 text-[9px] font-mono uppercase tracking-[1.5px] text-gold">
                                        {badge}
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-[10px] text-muted leading-tight mt-0.5">{m.description}</p>
                                  {m.provider === "stripe" && !badge && (
                                    <p className="text-[9px] text-muted font-mono uppercase tracking-[1.5px] mt-1">
                                      {t("checkout.poweredByProvider", { provider: "Stripe" })}
                                    </p>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                          {configuredMethods.length === 0 && (
                            <p className="text-[11px] text-muted font-light sm:col-span-2">
                              {methodsProblem || t("checkout.noMethods")}
                            </p>
                          )}
                        </div>

                        {noPaymentRoute && (
                          <div className="rounded-lg border border-gold/30 bg-navy2 p-6 font-sans space-y-3">
                            <div className="flex items-center gap-2 text-gold">
                              <Globe2 className="w-5 h-5" />
                              <span className="text-xs font-mono uppercase tracking-[2px]">{t("international.paymentsComingSoon")}</span>
                            </div>
                            <p className="text-[11px] text-muted leading-relaxed">{t("international.paymentsComingSoonBody")}</p>
                            <p className="text-[11px] text-ivory leading-relaxed">
                              {t("checkout.contactConcierge", { country: form.countryName })}
                            </p>
                            <Link
                              to="/contact"
                              className="inline-block px-4 py-2 border border-gold/40 rounded text-[11px] uppercase tracking-widest text-gold hover:bg-gold/10 transition-colors"
                            >
                              {t("checkout.contactUs")}
                            </Link>
                          </div>
                        )}

                        {/* Payment Method Specific Instructions Box */}
                        <div className="bg-navy2 border border-gold/30 p-5 rounded-lg space-y-4 font-sans text-xs">
                          {selectedMethod && (activeMethodConfig || selectedMethod.canSubmit) && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-gold font-bold uppercase text-[11px] font-mono">
                                <Truck className="w-4 h-4" />
                                <span>{activeMethodConfig?.instructionHeading || `${selectedLabel} ${t("checkout.instructionsSuffix")}`}</span>
                              </div>

                              {selectedMethod.provider === "stripe" && !activeMethodConfig && (
                                <p className="text-muted leading-relaxed">
                                  {t("checkout.cardSecureBody")}{" "}
                                  <span className="text-ivory">{selectedMethod.description}</span>
                                </p>
                              )}

                              {activeMethodConfig && (activeMethodConfig.id === "Cash on Delivery" ? (
                                <p className="text-muted leading-relaxed">
                                  {t("checkout.codBodyLead")} <strong className="text-gold font-mono">{format(shownTotal)}</strong>{" "}
                                  {t("checkout.codBodyTail")}
                                </p>
                              ) : (
                                <div className="bg-navy p-3 rounded border border-gold/15 space-y-1.5 font-mono text-[11px]">
                                  {activeMethodConfig.details.map((d) => (
                                    <p key={d.label} className="flex justify-between gap-3">
                                      <span className="text-muted">{d.label}:</span>
                                      <span className={`text-ivory font-bold flex items-center gap-1 text-end ${d.copyValue ? "text-gold" : ""}`}>
                                        {d.value}
                                        {d.copyValue && (
                                          <button
                                            type="button"
                                            aria-label={t("product.copyField", { label: d.label })}
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
                              ))}

                              {selectedMethod.requiresReference && (
                                <Field
                                  label={activeMethodConfig?.referenceLabel || t("checkout.referenceFallback")}
                                  value={form.paymentReference}
                                  onChange={(v) => update("paymentReference", v)}
                                  placeholder={activeMethodConfig?.referencePlaceholder || t("checkout.referencePlaceholder")}
                                  required
                                />
                              )}
                            </div>
                          )}

                          {/* Payment Screenshot Upload Field for Digital Transfer Methods */}
                          {selectedMethod?.requiresProof && (
                            <div className="space-y-2 pt-2 border-t border-gold/15">
                              <span className="text-[10px] tracking-widest text-gold uppercase block font-mono">
                                {t("checkout.uploadProof")} <span className="text-gold">*</span>
                              </span>

                              {!paymentProofPreview ? (
                                <label className="border-2 border-dashed border-gold/30 hover:border-gold/60 bg-navy p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors">
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleProofFileChange}
                                    className="hidden"
                                  />
                                  <span className="text-xs text-ivory font-medium">{t("checkout.clickSelect")}</span>
                                  <span className="text-[10px] text-muted mt-1">{t("checkout.supportsFiles")}</span>
                                </label>
                              ) : (
                                <div className="bg-navy p-3 rounded border border-gold/30 flex items-center justify-between">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <img
                                      src={paymentProofPreview}
                                      alt={t("checkout.proofPreviewAlt")}
                                      className="w-12 h-12 object-cover rounded border border-gold/20 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <span className="text-xs font-serif font-bold text-ivory block truncate">
                                        {paymentProofFile?.name}
                                      </span>
                                      <span className="text-[10px] font-mono text-emerald-400 block">
                                        {t("checkout.attached", { size: (paymentProofFile!.size / 1024).toFixed(1) })}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={removeProofFile}
                                    className="px-2 py-1 text-[10px] font-mono uppercase bg-rose-950/60 text-rose-300 border border-rose-800/40 rounded hover:bg-rose-900"
                                  >
                                    {t("common.remove")}
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
                              {t("checkout.copied")}
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
                      {t("checkout.back")}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isProcessing || (step === "PAYMENT" && !paymentMethodsAvailable)}
                    className="btn-gold-fill flex-1 text-center font-sans text-xs font-bold uppercase tracking-wider py-3 shadow-lg disabled:opacity-50"
                  >
                    {isProcessing
                      ? t("checkout.processing")
                      : step === "PAYMENT"
                        ? t("checkout.confirmOrder", { method: selectedLabel.toUpperCase() })
                        : t("checkout.continue")}
                  </button>
                </div>
              </motion.form>
            </AnimatePresence>

            {/* Right Side Summary Panel */}
            <div className="border border-gold/25 p-8 h-fit bg-navy2 rounded-xl shadow-xl space-y-6">
              <h3 className="font-serif text-xl font-bold border-b border-gold/15 pb-3">{t("checkout.summary")}</h3>
              <div className="space-y-4 max-h-64 overflow-y-auto pe-1">
                {items.map((item) => {
                  const itemId = item.id || `${item.product.id}-${item.selectedSize}`;
                  const unitPrice = item.price ?? item.product.price;
                  return (
                    <div key={itemId} className="flex gap-4 items-center font-sans">
                      <ProductVisual product={item.product} className="w-14 h-16 shrink-0 flex items-center justify-center border border-gold/20 bg-navy rounded" bottleSize="w-6" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-serif font-bold text-ivory truncate">{item.product.name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-muted">
                          <span className="font-mono text-gold font-bold bg-gold/10 px-1 py-0.2 rounded border border-gold/30">
                            {item.selectedSize}
                          </span>
                          <span>•</span>
                          <span>{t("checkout.qty", { n: item.quantity })}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-gold font-semibold">{format(unitPrice * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 text-xs font-sans pt-4 border-t border-gold/15">
                <div className="flex justify-between text-muted"><span>{t("checkout.subtotal")}</span><span className="text-ivory font-mono">{format(shownSubtotal)}</span></div>
                {shownDiscount > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <span>{t("checkout.discount", { code: promoCode })}</span>
                    <span className="font-mono">- {format(shownDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted"><span>{t("checkout.shipping")}</span><span className="text-ivory font-mono">{shownShipping === 0 ? t("shipping.complimentary") : format(shownShipping)}</span></div>
                {shownTax > 0 && (
                  <div className="flex justify-between text-muted">
                    <span>{t("tax.label", { label: pricing?.taxLabel || t("tax.fallback"), rate: pricing?.taxRate ?? 0 })}</span>
                    <span className="text-ivory font-mono">{format(shownTax)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-gold/15 text-sm">
                  <span className="font-serif font-bold text-ivory">{t("checkout.totalAmount")}</span>
                  <span className="font-mono font-bold text-gold">{format(shownTotal)}</span>
                </div>
                <p className="text-[10px] text-muted font-light leading-relaxed pt-1">
                  {t("international.currencyNote", { currency: currency.code })}
                </p>
                {currency.rateSource === "manual" && (
                  <p className="text-[10px] text-muted font-light leading-relaxed">{t("international.ratesManualBody")}</p>
                )}
                {shownTax > 0 && (
                  <p className="text-[10px] text-muted font-light leading-relaxed">{t("international.taxNotice")}</p>
                )}
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

/**
 * Destinations the store does not serve are still listed, but not selectable: the
 * shopper sees the label instead of reaching a dead end after submitting.
 */
function CountryField({
  label, value, countries, onChange, unavailableSuffix,
}: {
  label: string;
  value: string;
  countries: { code: string; name: string; enabled: boolean }[];
  onChange: (code: string) => void;
  unavailableSuffix: string;
}) {
  return (
    <label className="block font-sans text-xs">
      <span className="text-[10px] tracking-widest text-gold uppercase mb-1.5 block font-mono">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-navy border border-gold/25 px-4 py-2.5 text-ivory focus:outline-none focus:border-gold rounded font-sans"
      >
        <option value="">—</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code} disabled={!c.enabled}>
            {c.enabled ? c.name : `${c.name} — ${unavailableSuffix}`}
          </option>
        ))}
      </select>
    </label>
  );
}
