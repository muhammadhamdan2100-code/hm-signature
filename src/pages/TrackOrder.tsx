import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Package, Clock, ShieldCheck, Truck, Home, AlertCircle, Copy } from "lucide-react";
import { useAdminData, type Order, type OrderStatus } from "../admin/context/AdminDataContext";
import { formatPKR } from "../utils/currency";

const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "Pending", label: "Order Placed", icon: Clock },
  { status: "Confirmed", label: "Confirmed", icon: ShieldCheck },
  { status: "Processing", label: "Atelier Processing", icon: Package },
  { status: "Shipped", label: "Shipped in Transit", icon: Truck },
  { status: "Out for Delivery", label: "Out for Delivery", icon: Truck },
  { status: "Delivered", label: "Delivered", icon: Home },
];

export default function TrackOrder() {
  const { orders } = useAdminData();
  const [searchParams] = useSearchParams();

  const initialSearch =
    searchParams.get("trackingId") ||
    searchParams.get("orderId") ||
    searchParams.get("q") ||
    "";

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [emailInput, setEmailInput] = useState("");
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  // Perform search
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasSearched(true);

    const term = searchInput.trim().toLowerCase();
    if (!term) {
      setFoundOrder(null);
      return;
    }

    const match = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === term ||
        (o.trackingNumber && o.trackingNumber.toLowerCase() === term) ||
        (o.id && o.id.toLowerCase() === term) ||
        (emailInput && o.customerEmail.toLowerCase() === emailInput.trim().toLowerCase())
    );

    setFoundOrder(match || null);
  };

  useEffect(() => {
    if (initialSearch) {
      handleSearch();
    }
  }, [initialSearch]);

  const copyTracking = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case "Pending":
        return 0;
      case "Confirmed":
        return 1;
      case "Processing":
        return 2;
      case "Shipped":
        return 3;
      case "Out for Delivery":
        return 4;
      case "Delivered":
        return 5;
      default:
        return 1;
    }
  };

  return (
    <div className="pt-24 bg-navy min-h-screen text-ivory font-sans">
      <section className="py-16 border-b border-gold/15 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 space-y-3">
          <div className="eyebrow">BOUTIQUE CONCIERGE</div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold">Track Your Fragrance Shipment</h1>
          <p className="text-muted max-w-lg mx-auto leading-relaxed text-xs sm:text-sm font-light">
            Enter your Order Number or Tracking Reference ID to check laboratory status and real-time transit telemetry.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-[700px] mx-auto px-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-navy2 border border-gold/30 p-6 rounded-xl space-y-4 shadow-xl mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-xs">
                <span className="text-[10px] tracking-widest text-gold uppercase mb-1 block font-mono">
                  ORDER NUMBER OR TRACKING ID
                </span>
                <input
                  required
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g. HMS-2026-000001 or HMS-TRK-8F42A91"
                  className="w-full bg-navy border border-gold/25 px-3.5 py-2.5 text-ivory text-xs focus:outline-none focus:border-gold rounded font-mono"
                />
              </label>

              <label className="block text-xs">
                <span className="text-[10px] tracking-widest text-gold uppercase mb-1 block font-mono">
                  CLIENT EMAIL (OPTIONAL)
                </span>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="client@domain.com"
                  className="w-full bg-navy border border-gold/25 px-3.5 py-2.5 text-ivory text-xs focus:outline-none focus:border-gold rounded font-sans"
                />
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gold hover:bg-goldLight text-navy font-bold uppercase tracking-wider text-xs rounded transition-colors flex items-center justify-center space-x-2 shadow-md"
            >
              <Search className="w-4 h-4" />
              <span>SEARCH BOUTIQUE TELEMETRY</span>
            </button>
          </form>

          {/* Search Results Display */}
          {hasSearched && !foundOrder && (
            <div className="bg-navy2 border border-rose-800/30 p-8 text-center rounded-xl space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
              <h3 className="font-serif text-lg font-bold">No Order Record Found</h3>
              <p className="text-xs text-muted max-w-md mx-auto">
                No active order matched "{searchInput}". Please double check your order reference number or view your client account history.
              </p>
              <div className="pt-2">
                <Link to="/account/orders" className="btn-gold font-sans text-xs">
                  VIEW MY ACCOUNT ORDERS
                </Link>
              </div>
            </div>
          )}

          {foundOrder && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-navy2 border border-gold/30 p-6 sm:p-8 rounded-xl shadow-2xl space-y-8">
              {/* Order Info Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-gold uppercase tracking-[2px] block">MATCHED ORDER</span>
                  <h2 className="font-mono font-bold text-xl text-ivory">{foundOrder.orderNumber}</h2>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-mono text-gold uppercase tracking-[2px] block">TRACKING REFERENCE</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm text-goldLight">{foundOrder.trackingNumber || "HMS-TRK-PENDING"}</span>
                    {foundOrder.trackingNumber && (
                      <button onClick={() => copyTracking(foundOrder.trackingNumber || "")} className="text-muted hover:text-gold">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {copied && <span className="text-[9px] text-emerald-300 font-mono block">✓ Copied</span>}
                </div>
              </div>

              {/* Courier & Delivery Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-navy p-4 rounded border border-gold/15 text-xs font-sans">
                <div>
                  <span className="text-[10px] text-muted uppercase block">Courier Service</span>
                  <span className="text-ivory font-bold">{foundOrder.courier || "HM Signature Delivery"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted uppercase block">Payment Status</span>
                  <span className="text-amber-300 font-bold uppercase font-mono text-[11px]">{foundOrder.paymentStatus}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted uppercase block">Destination City</span>
                  <span className="text-ivory font-bold">{foundOrder.shippingAddress?.city || "Lahore"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted uppercase block">Estimated Delivery</span>
                  <span className="text-gold font-bold">2 - 3 Business Days</span>
                </div>
              </div>

              {/* Visual Order Timeline Stepper */}
              <div className="space-y-4 pt-2">
                <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold block">
                  TRANSIT TELEMETRY TIMELINE
                </span>
                <div className="relative flex items-center justify-between">
                  <div className="absolute top-4 left-6 right-6 h-0.5 bg-gold/20 -z-0" />
                  {TIMELINE_STEPS.map((step, idx) => {
                    const currentIdx = getStepIndex(foundOrder.status);
                    const isDone = idx <= currentIdx;
                    const Icon = step.icon;

                    return (
                      <div key={step.status} className="relative z-10 flex flex-col items-center space-y-2 flex-1 text-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                            isDone
                              ? "bg-gold border-gold text-navy shadow-lg"
                              : "bg-navy border-gold/30 text-muted"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] font-sans font-semibold max-w-[80px] leading-tight ${isDone ? "text-ivory" : "text-muted"}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-gold/15 pt-4 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold block">ORDER CONTENTS</span>
                {foundOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-sans">
                    <span className="text-ivory font-medium">{item.name} (x{item.quantity})</span>
                    <span className="font-mono text-gold">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-serif font-bold text-sm text-ivory border-t border-gold/10 pt-2">
                  <span>Total Paid</span>
                  <span className="font-mono text-gold">{formatPKR(foundOrder.total)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
