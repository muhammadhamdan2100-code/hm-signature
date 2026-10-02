import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdminData, type Order, type OrderStatus, type PaymentMethod, type PaymentStatus } from "../admin/context/AdminDataContext";
import {
  Package,
  LogOut,
  ShieldCheck,
  Truck,
  Check,
  Clock,
  Upload,
  Image as ImageIcon,
  X,
  ExternalLink,
  Smartphone,
  Banknote,
  Building2,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { formatPKR } from "../utils/currency";

// Standard Stepper Order Pipeline
const STEPPER_STAGES: { status: OrderStatus; label: string; desc: string }[] = [
  { status: "Pending", label: "Order Placed", desc: "Acquisition registered" },
  { status: "Confirmed", label: "Payment Confirmed", desc: "Order validated" },
  { status: "Processing", label: "Atelier Handcrafting", desc: "Batch formulation" },
  { status: "Shipped", label: "Dispatched", desc: "Handed to courier" },
  { status: "Out for Delivery", label: "Out for Delivery", desc: "Arriving today" },
  { status: "Delivered", label: "Delivered", desc: "Signed by recipient" },
];

function getStageIndex(status: OrderStatus): number {
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
      return 0;
  }
}

// Payment Method Icon & Color Helper
function getPaymentMethodBadge(method: PaymentMethod | string) {
  switch (method) {
    case "JazzCash":
      return { label: "JazzCash Wallet", icon: Smartphone, color: "text-rose-400 border-rose-500/30 bg-rose-950/30" };
    case "Raast":
      return { label: "Raast Instant ID", icon: Banknote, color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/30" };
    case "Bank Transfer":
      return { label: "Bank Wire Transfer", icon: Building2, color: "text-amber-400 border-amber-500/30 bg-amber-950/30" };
    case "PayFast":
    case "payfast":
      return { label: "PayFast Card Gateway", icon: CreditCard, color: "text-sky-400 border-sky-500/30 bg-sky-950/30" };
    default:
      return { label: "Cash on Delivery", icon: Truck, color: "text-gold border-gold/30 bg-gold/10" };
  }
}

// Payment Status Badge Helper
function getPaymentStatusBadge(status: PaymentStatus | string) {
  switch (status) {
    case "Paid":
    case "Verified":
      return { label: "Paid & Verified", bg: "bg-emerald-950/60 text-emerald-300 border-emerald-800/40" };
    case "Verification Pending":
      return { label: "Verification Pending", bg: "bg-amber-950/60 text-amber-300 border-amber-800/40" };
    case "Failed":
    case "Rejected":
      return { label: "Payment Failed / Rejected", bg: "bg-rose-950/60 text-rose-300 border-rose-800/40" };
    case "Refunded":
      return { label: "Refunded", bg: "bg-sky-950/60 text-sky-300 border-sky-800/40" };
    default:
      return { label: "Payment Pending", bg: "bg-navy/80 text-muted border-gold/20" };
  }
}

// Payment Proof Upload Card Component
const PaymentProofUploadSection: React.FC<{ order: Order }> = ({ order }) => {
  const { uploadPaymentProof } = useAdminData();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(order.paymentProofUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const isManualMethod = ["JazzCash", "Raast", "Bank Transfer"].includes(order.paymentMethod);

  if (!isManualMethod) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Please select a valid image file (.jpg, .png, or .webp).");
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File size must be less than 10MB.");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(order.paymentProofUrl || null);
    setErrorMsg(null);
  };

  const handleSubmitProof = async () => {
    if (!previewUrl) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Simulate/Trigger upload handler
      uploadPaymentProof(order.id, previewUrl, `Uploaded payment screenshot: ${selectedFile?.name || "receipt.png"}`);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload payment proof.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-lg bg-navy border border-gold/25 space-y-3 font-sans text-xs">
      <div className="flex items-center justify-between border-b border-gold/15 pb-2">
        <div className="flex items-center space-x-2">
          <Upload className="w-4 h-4 text-gold" />
          <span className="font-serif font-bold text-sm text-ivory">
            Payment Receipt & Screenshot Upload
          </span>
        </div>
        <span className="text-[10px] font-mono text-gold uppercase tracking-wider">
          {order.paymentMethod} Payment
        </span>
      </div>

      <p className="text-muted text-xs leading-relaxed font-light">
        Payment proof will be reviewed by our team. Order status remains pending verification until approved.
      </p>

      {/* Success Banner */}
      {(successMsg || order.paymentStatus === "Verification Pending") && (
        <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-200 text-xs flex items-center space-x-2">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Payment proof submitted! Our finance team is reviewing your transaction.</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-rose-200 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Image Preview or Drop Area */}
      {previewUrl ? (
        <div className="relative rounded-lg border border-gold/30 bg-navy2 p-3 flex items-center space-x-4">
          <div className="w-16 h-16 rounded border border-gold/20 overflow-hidden bg-black shrink-0 relative group">
            <img src={previewUrl} alt="Payment Receipt" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-ivory font-medium text-xs truncate">
              {selectedFile ? selectedFile.name : "Payment Proof Attached"}
            </p>
            <p className="text-[10px] text-gold font-mono uppercase">
              {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "Uploaded Receipt"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1.5 rounded bg-navy text-muted hover:text-rose-400 transition-colors border border-gold/20"
              title="Remove or Replace Proof"
            >
              <X className="w-4 h-4" />
            </button>
            {selectedFile && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitProof}
                className="px-3 py-1.5 bg-gold hover:bg-goldLight text-navy font-bold text-xs uppercase tracking-wider rounded transition-colors shadow flex items-center space-x-1"
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Submit Proof</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-5 rounded-lg border-2 border-dashed border-gold/30 bg-navy2/60 hover:bg-navy2 hover:border-gold/60 transition-all cursor-pointer text-center">
          <ImageIcon className="w-8 h-8 text-gold/60 mb-2" />
          <span className="text-xs text-ivory font-medium">Click to select receipt screenshot</span>
          <span className="text-[10px] text-muted font-mono mt-1">Supports JPG, PNG, WEBP (Max 10MB)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
};

export default function Account() {
  const { user, logout } = useAuth();
  const { orders, refunds } = useAdminData();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login?next=/account" replace />;
  }

  // Filter orders for logged-in user
  const clientOrders = orders.filter(
    (o) =>
      o.customerEmail.toLowerCase() === user.email.toLowerCase() ||
      o.customerName.toLowerCase() === user.fullName.toLowerCase() ||
      user.role !== "customer"
  );

  const customerName = user.fullName || "Valued Patron";

  return (
    <div className="pt-28 pb-20 bg-navy min-h-screen text-ivory select-none font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Luxury Welcome Hero Card */}
        <div className="relative overflow-hidden bg-navy2/90 border border-gold/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center font-serif text-gold font-bold text-3xl shadow-lg shrink-0">
                {customerName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono uppercase tracking-[2.5px] text-gold font-bold bg-gold/10 px-2 py-0.5 rounded border border-gold/30">
                    HM SIGNATURE PRIVILEGED MEMBER
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ivory tracking-wide">
                  Welcome back, {customerName}
                </h1>
                <p className="text-xs text-muted font-mono font-light">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              {user.role !== "customer" && (
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-bold rounded-lg text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Workspace</span>
                </button>
              )}
              <button
                onClick={logout}
                className="px-4 py-2.5 border border-rose-500/30 text-rose-300 hover:bg-rose-950/40 rounded-lg text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Customer Fragrance Order Portal */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gold/20 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
                HAUTE PARFUMERIE ACQUISITIONS
              </span>
              <h2 className="text-2xl font-serif font-bold text-ivory mt-0.5">
                Your Fragrance Orders ({clientOrders.length})
              </h2>
            </div>
            <Link
              to="/collections"
              className="hidden sm:inline-flex items-center space-x-1 text-xs text-gold hover:text-goldLight font-semibold uppercase tracking-wider"
            >
              <span>Browse Catalog</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Empty State */}
          {clientOrders.length === 0 ? (
            <div className="bg-navy2/80 border border-gold/20 rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-xl">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 text-gold mx-auto flex items-center justify-center">
                <Package className="w-8 h-8 text-gold" />
              </div>
              <h3 className="font-serif text-xl text-ivory font-bold">No Orders Found</h3>
              <p className="text-xs text-muted leading-relaxed font-light">
                Your haute parfumerie acquisitions will appear here alongside real-time laboratory status and tracking details.
              </p>
              <div className="pt-2">
                <Link
                  to="/collections"
                  className="inline-flex items-center px-6 py-3 bg-gold hover:bg-goldLight text-navy font-bold rounded-lg text-xs uppercase tracking-wider shadow-lg transition-colors"
                >
                  Explore Fragrances
                </Link>
              </div>
            </div>
          ) : (
            /* Order List Cards */
            <div className="space-y-6">
              {clientOrders.map((order) => {
                const currentStageIdx = getStageIndex(order.status);
                const isSpecialState = order.status === "Cancelled" || order.status === "Returned";
                const pmBadge = getPaymentMethodBadge(order.paymentMethod);
                const psBadge = getPaymentStatusBadge(order.paymentStatus);
                const orderRefunds = refunds.filter((r) => r.orderId === order.id);
                const refundedTotal = orderRefunds
                  .filter((r) => r.status === "processed" || r.status === "pending")
                  .reduce((acc, r) => acc + r.amount, 0);
                const PMIcon = pmBadge.icon;

                return (
                  <div
                    key={order.id}
                    className="bg-navy2/90 border border-gold/30 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md"
                  >
                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono uppercase text-gold tracking-widest font-semibold">
                            REF #
                          </span>
                          <span className="font-mono font-bold text-lg text-ivory">
                            {order.orderNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted font-light mt-0.5">
                          Placed on <span className="text-ivory font-medium">{order.createdAt}</span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Payment Method Badge */}
                        <div className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold border ${pmBadge.color}`}>
                          <PMIcon className="w-3.5 h-3.5" />
                          <span>{pmBadge.label}</span>
                        </div>

                        {/* Payment Status Badge */}
                        <span className={`px-3 py-1 rounded text-xs font-semibold border ${psBadge.bg}`}>
                          {psBadge.label}
                        </span>

                        {refundedTotal > 0 && (
                          <span className="px-3 py-1 rounded text-xs font-mono border border-sky-800/40 bg-sky-950/40 text-sky-300">
                            Refunded {formatPKR(refundedTotal)}
                          </span>
                        )}

                        {/* Total Amount */}
                        <div className="text-right">
                          <span className="text-[10px] text-muted block uppercase font-mono">Total</span>
                          <span className="font-mono font-bold text-sm sm:text-base text-gold">
                            {formatPKR(order.total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stepper Timeline for Normal Flow */}
                    {!isSpecialState ? (
                      <div className="space-y-3 pt-2">
                        <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold font-semibold block">
                          DISPATCH PROGRESS & LAB STATUS
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                          {STEPPER_STAGES.map((stage, idx) => {
                            const isDone = idx < currentStageIdx;
                            const isCurrent = idx === currentStageIdx;

                            return (
                              <div
                                key={stage.status}
                                className={`p-2.5 rounded-lg border transition-all text-left space-y-1 ${
                                  isCurrent
                                    ? "bg-navy border-gold shadow-lg ring-1 ring-gold/40"
                                    : isDone
                                    ? "bg-navy/80 border-gold/30 opacity-90"
                                    : "bg-navy/40 border-gold/10 opacity-50"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      isDone
                                        ? "bg-gold text-navy"
                                        : isCurrent
                                        ? "bg-gold/20 text-gold border border-gold"
                                        : "bg-navy border border-gold/20 text-muted"
                                    }`}
                                  >
                                    {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                                  </div>
                                  {isCurrent && (
                                    <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                                  )}
                                </div>
                                <div>
                                  <p className={`text-xs font-serif font-bold ${isCurrent ? "text-gold" : isDone ? "text-ivory" : "text-muted"}`}>
                                    {stage.label}
                                  </p>
                                  <p className="text-[9px] text-muted font-sans line-clamp-1">
                                    {stage.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Special State Banner (Cancelled / Returned) */
                      <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        <div>
                          <p className="font-serif font-bold text-sm text-ivory">
                            Order Status: {order.status}
                          </p>
                          <p className="text-xs text-rose-300/80 font-light">
                            {order.status === "Cancelled"
                              ? "This order acquisition was cancelled. Please contact atelier concierge for refunds or assistance."
                              : "Items from this order were returned and processed at our atelier."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Inline Product Item Breakdown */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold font-semibold block">
                        ORDERED EXTRAITS & ACQUISITIONS
                      </span>
                      <div className="bg-navy/70 border border-gold/15 rounded-xl divide-y divide-gold/10 overflow-hidden">
                        {order.items?.map((item, i) => (
                          <div key={i} className="p-3.5 flex items-center justify-between gap-4 font-sans">
                            <div className="flex items-center space-x-3.5 min-w-0">
                              <div className="w-12 h-12 rounded border border-gold/20 bg-black overflow-hidden shrink-0 flex items-center justify-center">
                                {item.image?.startsWith("http") || item.image?.startsWith("/") ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-6 h-6 text-gold/60" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-serif font-bold text-sm text-ivory truncate">
                                  {item.name}
                                </h4>
                                <div className="flex items-center space-x-2 text-[11px] text-muted">
                                  <span className="font-mono text-gold">{item.size || "50ML"}</span>
                                  <span>•</span>
                                  <span>Qty: {item.quantity}</span>
                                  {item.sku && <span>• SKU: {item.sku}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-mono font-bold text-gold">
                                {formatPKR(item.price * item.quantity)}
                              </span>
                              <span className="text-[10px] text-muted block">
                                ({formatPKR(item.price)} each)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping & Courier Tracking Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Shipping Address */}
                      <div className="p-4 rounded-xl bg-navy/60 border border-gold/15 space-y-1 text-xs">
                        <span className="text-[10px] font-mono uppercase text-gold font-semibold block">
                          DELIVERY DESTINATION
                        </span>
                        <p className="text-ivory font-medium">
                          {order.shippingAddress?.street || "Boutique Residence"}
                        </p>
                        <p className="text-muted">
                          {order.shippingAddress?.city || "Lahore"}, {order.shippingAddress?.zip || "54600"}, Pakistan
                        </p>
                      </div>

                      {/* Tracking Information */}
                      <div className="p-4 rounded-xl bg-navy/60 border border-gold/15 space-y-1 text-xs">
                        <span className="text-[10px] font-mono uppercase text-gold font-semibold block">
                          COURIER & TRACKING DETAILS
                        </span>
                        {order.courier || order.trackingNumber ? (
                          <div className="space-y-1">
                            <p className="text-ivory font-medium flex items-center justify-between">
                              <span>Courier: {order.courier || "DHL Express Luxury"}</span>
                              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">
                                {order.shippingStatus}
                              </span>
                            </p>
                            <p className="text-gold font-mono font-bold">
                              Tracking ID: {order.trackingNumber || "DHL-9823410"}
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted italic text-[11px] leading-relaxed">
                            Tracking information will be available once your order has been dispatched.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Payment Proof Upload Component (For manual payment methods) */}
                    <PaymentProofUploadSection order={order} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
