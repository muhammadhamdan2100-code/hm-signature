import { useCallback, useEffect, useRef, useState } from "react";
import type { ElementType, FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Building2,
  CalendarDays,
  Check,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Gift,
  Home,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  RotateCw,
  Search,
  ShieldCheck,
  Smartphone,
  Truck,
} from "lucide-react";
import { OrderTimeline, formatOrderStamp } from "../components/OrderTimeline";
import { lookupOrderTracking, type TrackingResult } from "../services/tracking";
import { formatPKR } from "../utils/currency";

// Shared concierge line, the same number used by /contact and the floating button.
const WHATSAPP_NUMBER = "923218602034";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type LookupPhase = "idle" | "loading" | "found" | "not_found" | "error";

const STATUS_BADGES: Record<string, { label: string; icon: ElementType; tone: string }> = {
  Pending: { label: "Pending Review", icon: Clock, tone: "bg-navy text-muted border-gold/25" },
  Confirmed: { label: "Order Confirmed", icon: ShieldCheck, tone: "bg-sky-950/60 text-sky-300 border-sky-800/40" },
  Processing: { label: "Atelier Processing", icon: Package, tone: "bg-amber-950/60 text-amber-300 border-amber-800/40" },
  Shipped: { label: "Shipped · In Transit", icon: Truck, tone: "bg-gold/10 text-gold border-gold/40" },
  "Out for Delivery": { label: "Out For Delivery", icon: Truck, tone: "bg-emerald-950/50 text-emerald-300 border-emerald-800/40" },
  Delivered: { label: "Delivered", icon: Home, tone: "bg-emerald-950/60 text-emerald-300 border-emerald-800/40" },
  Cancelled: { label: "Cancelled", icon: AlertCircle, tone: "bg-rose-950/60 text-rose-300 border-rose-800/40" },
  Returned: { label: "Returned", icon: RotateCw, tone: "bg-rose-950/40 text-rose-200 border-rose-800/40" },
};

const PAYMENT_TONES: Record<string, string> = {
  Paid: "bg-emerald-950/60 text-emerald-300 border-emerald-800/40",
  Verified: "bg-emerald-950/60 text-emerald-300 border-emerald-800/40",
  "Verification Pending": "bg-amber-950/60 text-amber-300 border-amber-800/40",
  Failed: "bg-rose-950/60 text-rose-300 border-rose-800/40",
  Rejected: "bg-rose-950/60 text-rose-300 border-rose-800/40",
  Refunded: "bg-sky-950/60 text-sky-300 border-sky-800/40",
};

function getStatusBadge(status?: string) {
  return STATUS_BADGES[status ?? ""] ?? { label: status || "Status Unavailable", icon: Package, tone: "bg-navy text-muted border-gold/25" };
}

function getPaymentTone(paymentStatus?: string) {
  return PAYMENT_TONES[paymentStatus ?? ""] ?? "bg-navy/80 text-muted border-gold/20";
}

function getPaymentMethodIcon(method?: string): ElementType {
  switch (method) {
    case "JazzCash":
      return Smartphone;
    case "Raast":
      return Banknote;
    case "Bank Transfer":
      return Building2;
    case "PayFast":
    case "payfast":
      return CreditCard;
    default:
      return Truck;
  }
}

function conciergeLink(reference: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi HM Signature, I need help tracking my order${reference ? ` (${reference})` : ""}.`
  )}`;
}

export default function TrackOrder() {
  const [searchParams] = useSearchParams();

  const deepLink =
    searchParams.get("id") ||
    searchParams.get("order") ||
    searchParams.get("tracking") ||
    searchParams.get("trackingId") ||
    searchParams.get("orderId") ||
    "";
  const deepEmail = searchParams.get("email") || "";

  const [lookupValue, setLookupValue] = useState(deepLink);
  const [emailValue, setEmailValue] = useState(deepEmail);
  const [fieldErrors, setFieldErrors] = useState<{ lookup?: string; email?: string }>({});
  const [phase, setPhase] = useState<LookupPhase>("idle");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [activeQuery, setActiveQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const lookupInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const statusRegionRef = useRef<HTMLParagraphElement>(null);
  const didRunDeepLink = useRef(false);

  const runLookup = useCallback(async (term: string, email: string) => {
    const cleanTerm = term.trim();
    const cleanEmail = email.trim();

    setActiveQuery(cleanTerm);
    setResult(null);
    setCopied(false);
    setPhase("loading");

    try {
      const response = await lookupOrderTracking(cleanTerm, cleanEmail || undefined);
      if (response.found) {
        setResult(response);
        setPhase("found");
      } else if (response.reason === "error") {
        setPhase("error");
      } else {
        setPhase("not_found");
      }
    } catch {
      setPhase("error");
    }
  }, []);

  // Deep link support: /track-order?id=HMS-2026-000001 looks up once on mount.
  useEffect(() => {
    if (didRunDeepLink.current) return;
    didRunDeepLink.current = true;
    if (!deepLink.trim()) return;
    void runLookup(deepLink, deepEmail);
  }, [deepLink, deepEmail, runLookup]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = lookupValue.trim();
    const email = emailValue.trim();

    const errors: { lookup?: string; email?: string } = {};
    if (!term) {
      errors.lookup = "Enter your order number or tracking reference.";
    } else if (term.length < 4) {
      errors.lookup = "That reference looks incomplete. Please enter the full order number or tracking ID.";
    }
    if (email && !EMAIL_PATTERN.test(email)) {
      errors.email = "Enter a valid email address, or leave this field empty.";
    }

    setFieldErrors(errors);

    if (errors.lookup) {
      lookupInputRef.current?.focus();
      return;
    }
    if (errors.email) {
      emailInputRef.current?.focus();
      return;
    }

    // Move focus to the live region so the outcome is announced on completion.
    statusRegionRef.current?.focus();
    void runLookup(term, email);
  };

  const handleRetry = () => {
    if (!activeQuery) {
      lookupInputRef.current?.focus();
      return;
    }
    void runLookup(activeQuery, emailValue);
  };

  const handleReset = () => {
    setLookupValue("");
    setEmailValue("");
    setFieldErrors({});
    setResult(null);
    setActiveQuery("");
    setPhase("idle");
    lookupInputRef.current?.focus();
  };

  const copyTrackingReference = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const statusMessage =
    phase === "loading"
      ? `Searching for "${activeQuery}".`
      : phase === "found" && result
      ? `Order ${result.orderNumber || activeQuery} found. Current status: ${result.status || "unavailable"}.`
      : phase === "not_found"
      ? `No order matched "${activeQuery}".`
      : phase === "error"
      ? "We could not reach the tracking service."
      : "";

  const StatusIcon = getStatusBadge(result?.status).icon;

  return (
    <div className="pt-24 pb-20 bg-navy min-h-screen text-ivory font-sans overflow-x-hidden">
      <section className="py-12 sm:py-16 border-b border-gold/15 text-center">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 space-y-3">
          <div className="eyebrow">BOUTIQUE CONCIERGE</div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold">Track Your Fragrance Shipment</h1>
          <p className="text-muted max-w-lg mx-auto leading-relaxed text-xs sm:text-sm font-light px-1">
            Enter your order number or tracking reference to see atelier preparation status, courier details
            and the full delivery timeline.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="max-w-[760px] mx-auto px-4 sm:px-6 space-y-8">
          {/* ---------- Lookup form ---------- */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-navy2/90 border border-gold/30 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-5 backdrop-blur-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/20 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-[2.5px] text-gold font-semibold">
                Order Lookup
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
                Verified against our fulfilment records
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label
                  htmlFor="order-reference"
                  className="text-[10px] tracking-[2px] text-gold uppercase mb-1.5 block font-mono font-semibold"
                >
                  Order Number or Tracking ID
                </label>
                <input
                  id="order-reference"
                  ref={lookupInputRef}
                  name="order-reference"
                  value={lookupValue}
                  onChange={(e) => {
                    setLookupValue(e.target.value);
                    if (fieldErrors.lookup) setFieldErrors((prev) => ({ ...prev, lookup: undefined }));
                  }}
                  placeholder="HMS-2026-000001 or HMS-TRK-8F42A91"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={fieldErrors.lookup ? true : undefined}
                  aria-describedby="order-reference-help order-reference-error"
                  className={`w-full min-h-[48px] bg-navy border px-3.5 py-3 text-ivory text-xs rounded font-mono focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted/60 break-words ${
                    fieldErrors.lookup ? "border-rose-500/70" : "border-gold/25 focus:border-gold"
                  }`}
                />
                <p id="order-reference-help" className="text-[10px] text-muted font-light mt-1.5 leading-relaxed">
                  Found in your order confirmation email.
                </p>
                {fieldErrors.lookup && (
                  <p
                    id="order-reference-error"
                    role="alert"
                    className="text-[11px] text-rose-300 mt-1.5 flex items-start gap-1.5 leading-relaxed"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                    <span>{fieldErrors.lookup}</span>
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="checkout-email"
                  className="text-[10px] tracking-[2px] text-gold uppercase mb-1.5 block font-mono font-semibold"
                >
                  Email Used at Checkout
                  <span className="text-muted normal-case tracking-normal font-sans font-light"> (optional)</span>
                </label>
                <input
                  id="checkout-email"
                  ref={emailInputRef}
                  type="email"
                  name="checkout-email"
                  value={emailValue}
                  onChange={(e) => {
                    setEmailValue(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={fieldErrors.email ? true : undefined}
                  aria-describedby="checkout-email-help checkout-email-error"
                  className={`w-full min-h-[48px] bg-navy border px-3.5 py-3 text-ivory text-xs rounded font-sans focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted/60 ${
                    fieldErrors.email ? "border-rose-500/70" : "border-gold/25 focus:border-gold"
                  }`}
                />
                <p id="checkout-email-help" className="text-[10px] text-muted font-light mt-1.5 leading-relaxed">
                  Needed for guest orders so we can confirm the order belongs to you.
                </p>
                {fieldErrors.email && (
                  <p
                    id="checkout-email-error"
                    role="alert"
                    className="text-[11px] text-rose-300 mt-1.5 flex items-start gap-1.5 leading-relaxed"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={phase === "loading"}
              aria-busy={phase === "loading"}
              className="w-full min-h-[48px] py-3 px-4 bg-gold hover:bg-goldLight disabled:opacity-80 disabled:cursor-wait text-navy font-bold uppercase tracking-wider text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              {phase === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Searching…</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" aria-hidden="true" />
                  <span>Track My Order</span>
                </>
              )}
            </button>
          </form>

          {/* ---------- Live status region (also the focus target on submit) ---------- */}
          <p
            ref={statusRegionRef}
            role="status"
            aria-live="polite"
            tabIndex={-1}
            className="text-[11px] font-mono uppercase tracking-wider text-muted min-h-[1.25rem] break-words rounded outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
          >
            {statusMessage}
          </p>

          {/* ---------- Loading skeleton ---------- */}
          {phase === "loading" && (
            <div
              aria-hidden="true"
              className="bg-navy2/80 border border-gold/20 rounded-2xl p-5 sm:p-8 space-y-5 animate-pulse"
            >
              <div className="h-4 w-40 bg-navy rounded" />
              <div className="h-8 w-56 bg-navy rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="h-16 bg-navy rounded-xl" />
                <div className="h-16 bg-navy rounded-xl" />
              </div>
              <div className="h-24 bg-navy rounded-xl" />
              <div className="h-32 bg-navy rounded-xl" />
            </div>
          )}

          {/* ---------- Not found ---------- */}
          {phase === "not_found" && (
            <div role="alert" className="bg-navy2/90 border border-rose-800/30 p-6 sm:p-8 text-center rounded-2xl space-y-4 shadow-xl">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" aria-hidden="true" />
              <h2 className="font-serif text-lg sm:text-xl font-bold">We Could Not Match That Reference</h2>
              <p className="text-xs text-muted max-w-md mx-auto leading-relaxed font-light break-words">
                Nothing in our fulfilment records matches <span className="text-ivory font-mono break-all">“{activeQuery}”</span>.
                Please check the following and try again:
              </p>
              <ul className="text-xs text-muted font-light space-y-2 max-w-md mx-auto text-left">
                {[
                  "Order numbers look like HMS-2026-000001 — watch for a missing digit or an extra space.",
                  "Tracking IDs are only issued once your parcel leaves the atelier, so a dispatch reference may not exist yet.",
                  "For guest checkouts, enter the email address used at checkout as well — it confirms the order belongs to you.",
                  "If you signed in at checkout, your full order history is on your account page.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold/70 mt-1.5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">{line}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={conciergeLink(activeQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-5 border border-gold/40 text-gold hover:bg-gold/10 rounded font-sans text-xs uppercase tracking-wider font-semibold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Ask the Concierge on WhatsApp</span>
                </a>
                <Link
                  to="/account/orders"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-5 bg-gold hover:bg-goldLight text-navy rounded font-sans text-xs uppercase tracking-wider font-bold transition-colors shadow-md"
                >
                  <span>View My Account Orders</span>
                </Link>
              </div>
            </div>
          )}

          {/* ---------- Lookup failed / retry ---------- */}
          {phase === "error" && (
            <div role="alert" className="bg-navy2/90 border border-amber-800/40 p-6 sm:p-8 text-center rounded-2xl space-y-4 shadow-xl">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" aria-hidden="true" />
              <h2 className="font-serif text-lg sm:text-xl font-bold">Tracking Is Temporarily Unavailable</h2>
              <p className="text-xs text-muted max-w-md mx-auto leading-relaxed font-light">
                We could not reach our fulfilment service just now. This is usually a connection issue — please
                try again in a moment.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-5 bg-gold hover:bg-goldLight text-navy rounded font-sans text-xs uppercase tracking-wider font-bold transition-colors shadow-md"
                >
                  <RotateCw className="w-4 h-4" aria-hidden="true" />
                  <span>Try Again</span>
                </button>
                <a
                  href={conciergeLink(activeQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-5 border border-gold/40 text-gold hover:bg-gold/10 rounded font-sans text-xs uppercase tracking-wider font-semibold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Ask the Concierge</span>
                </a>
              </div>
            </div>
          )}

          {/* ---------- Fulfilment view ---------- */}
          {phase === "found" && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-navy2/90 border border-gold/30 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-7 backdrop-blur-md"
            >
              {/* Header + prominent status badge */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gold/20 pb-5">
                <div className="min-w-0 space-y-1">
                  <span className="text-[10px] font-mono text-gold uppercase tracking-[2.5px] block">
                    Matched Order
                  </span>
                  <h2 className="font-mono font-bold text-lg sm:text-xl text-ivory break-all num-lining">
                    {result.orderNumber || activeQuery}
                  </h2>
                  {result.placedAt && (
                    <p className="text-[11px] text-muted font-light">
                      Placed on <span className="text-ivory font-mono">{formatOrderStamp(result.placedAt)}</span>
                    </p>
                  )}
                </div>
                <div
                  className={`self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-xs font-semibold uppercase tracking-wider ${
                    getStatusBadge(result.status).tone
                  }`}
                >
                  <StatusIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{getStatusBadge(result.status).label}</span>
                </div>
              </div>

              {/* Courier & tracking */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold font-semibold block">
                  Courier & Tracking
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Detail label="Courier Service" value={result.courier || "HM Signature Concierge Delivery"} icon={Truck} />
                  {result.trackingId ? (
                    <div className="p-3.5 rounded-xl bg-navy/60 border border-gold/15 min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted block mb-1">
                        Tracking Reference
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-goldLight break-all">{result.trackingId}</span>
                        <button
                          type="button"
                          onClick={() => copyTrackingReference(result.trackingId || "")}
                          aria-label={`Copy tracking reference ${result.trackingId}`}
                          className="shrink-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded border border-gold/20 text-muted hover:text-gold hover:border-gold/50 transition-colors"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-300" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                        </button>
                      </div>
                      <p aria-live="polite" className="text-[10px] text-emerald-300 font-mono h-4">
                        {copied ? "Copied to clipboard" : ""}
                      </p>
                    </div>
                  ) : (
                    <Detail
                      label="Tracking Reference"
                      value="Issued as soon as your parcel is dispatched"
                      muted
                      icon={Package}
                    />
                  )}
                  {result.shipmentStatus && <Detail label="Shipment Status" value={result.shipmentStatus} icon={ShieldCheck} />}
                  {result.estimatedDelivery && (
                    <Detail
                      label="Estimated Delivery"
                      value={formatOrderStamp(result.estimatedDelivery)}
                      highlight
                      icon={CalendarDays}
                    />
                  )}
                  {result.city && <Detail label="Destination City" value={result.city} icon={MapPin} />}
                  {result.trackingUrl && (
                    <div className="sm:col-span-2 p-3.5 rounded-xl bg-navy/60 border border-gold/15 min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted block mb-1.5">
                        Live Carrier Page
                      </span>
                      <a
                        href={result.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-gold hover:text-goldLight font-mono break-all underline underline-offset-4 decoration-gold/30 hover:decoration-gold min-h-[44px]"
                      >
                        <span className="break-all">{result.trackingUrl}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="sr-only">(opens the carrier website in a new tab)</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-navy/60 border border-gold/15 min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted block mb-1.5">
                    Payment Status
                  </span>
                  <span
                    className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold border uppercase tracking-wider font-mono ${getPaymentTone(
                      result.paymentStatus
                    )}`}
                  >
                    {result.paymentStatus || "Pending"}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-navy/60 border border-gold/15 min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted block mb-1.5">
                    Payment Method
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs text-ivory font-semibold min-w-0">
                    {(() => {
                      const MethodIcon = getPaymentMethodIcon(result.paymentMethod);
                      return <MethodIcon className="w-4 h-4 text-gold shrink-0" aria-hidden="true" />;
                    })()}
                    <span className="break-words">{result.paymentMethod || "Not recorded"}</span>
                  </span>
                  {typeof result.total === "number" && (
                    <span className="block mt-1 font-mono text-sm font-bold text-gold num-lining">
                      {formatPKR(result.total)}
                    </span>
                  )}
                </div>
              </div>

              {/* Gift wrap */}
              {result.isGiftWrap && (
                <div className="p-4 rounded-xl bg-gold/5 border border-gold/25 space-y-1.5">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold text-gold uppercase tracking-wider">
                    <Gift className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Signature Gift Wrap Included</span>
                  </p>
                  {result.giftMessage ? (
                    <p className="text-xs text-ivory/90 font-light leading-relaxed font-serif italic break-words">
                      “{result.giftMessage}”
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted font-light">
                      Your extraits will arrive in the atelier gift box with a hand-tied gold ribbon.
                    </p>
                  )}
                </div>
              )}

              {/* Items */}
              <div className="space-y-3 border-t border-gold/15 pt-5">
                <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold font-semibold block">
                  Order Contents
                </span>
                <div className="bg-navy/70 border border-gold/15 rounded-xl divide-y divide-gold/10 overflow-hidden">
                  {result.items.length === 0 ? (
                    <p className="p-4 text-[11px] text-muted italic font-light">
                      Item details are not available for this order.
                    </p>
                  ) : (
                    result.items.map((item, idx) => (
                      <div key={`${item.name}-${idx}`} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded border border-gold/20 bg-black overflow-hidden shrink-0 flex items-center justify-center">
                            {item.image?.startsWith("http") || item.image?.startsWith("/") ? (
                              <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <Package className="w-6 h-6 text-gold/60" aria-hidden="true" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-serif font-bold text-sm text-ivory leading-tight break-words">
                              {item.name}
                            </h3>
                            <p className="text-[11px] text-muted flex flex-wrap gap-x-2">
                              <span className="font-mono text-gold">{item.size || "50ML"}</span>
                              <span aria-hidden="true">•</span>
                              <span>Qty {item.quantity}</span>
                              <span aria-hidden="true">•</span>
                              <span className="font-mono">{formatPKR(item.unitPrice)} each</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-gold shrink-0 num-lining">
                          {formatPKR(item.lineTotal)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Fulfilment timeline */}
              <div className="space-y-4 border-t border-gold/15 pt-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold font-semibold">
                    Fulfilment Timeline
                  </span>
                  <span className="text-[10px] text-muted font-light">
                    {result.timeline.length} recorded {result.timeline.length === 1 ? "update" : "updates"}
                  </span>
                </div>
                <OrderTimeline events={result.timeline} />
              </div>

              {/* Footer actions */}
              <div className="flex flex-col sm:flex-row gap-3 border-t border-gold/15 pt-5">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-5 border border-gold/30 text-ivory hover:border-gold rounded font-sans text-xs uppercase tracking-wider font-semibold transition-colors"
                >
                  <Search className="w-4 h-4" aria-hidden="true" />
                  <span>Track Another Order</span>
                </button>
                <a
                  href={conciergeLink(result.orderNumber || activeQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-5 border border-gold/30 text-gold hover:bg-gold/10 rounded font-sans text-xs uppercase tracking-wider font-semibold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Ask About This Order</span>
                </a>
                <Link
                  to="/account/orders"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-5 bg-gold hover:bg-goldLight text-navy rounded font-sans text-xs uppercase tracking-wider font-bold transition-colors shadow-md"
                >
                  <span>My Account Orders</span>
                </Link>
              </div>
            </motion.div>
          )}

          {/* ---------- Idle guidance ---------- */}
          {phase === "idle" && (
            <div className="bg-navy2/60 border border-gold/15 rounded-2xl p-5 sm:p-6 space-y-2 text-center">
              <Clock className="w-6 h-6 text-gold/70 mx-auto" aria-hidden="true" />
              <p className="text-xs text-muted font-light leading-relaxed">
                Have your order number or tracking reference ready. Guest orders also need the email address used
                at checkout so we can verify the order belongs to you.
              </p>
              <p className="text-[11px] text-muted/80 font-light">
                Need a hand?{" "}
                <a
                  href={conciergeLink("")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:text-goldLight underline underline-offset-4 decoration-gold/30"
                >
                  Message the boutique concierge
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Detail({
  label,
  value,
  icon: Icon,
  highlight = false,
  muted = false,
}: {
  label: string;
  value: string;
  icon: ElementType;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="p-3.5 rounded-xl bg-navy/60 border border-gold/15 min-w-0">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted block mb-1">{label}</span>
      <span
        className={`inline-flex items-start gap-2 text-xs font-semibold min-w-0 ${
          muted ? "text-muted font-light italic" : highlight ? "text-gold" : "text-ivory"
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 mt-px ${highlight ? "text-gold" : "text-gold/70"}`} aria-hidden="true" />
        <span className="break-words">{value}</span>
      </span>
    </div>
  );
}
