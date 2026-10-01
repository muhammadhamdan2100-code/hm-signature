import React, { useState, useEffect } from "react";
import { useAdminData, type Order } from "../context/AdminDataContext";
import { OrderStatusTimeline } from "../components/OrderStatusTimeline";
import { StatusBadge } from "../components/StatusBadge";
import { Breadcrumb } from "../components/Breadcrumb";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import {
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  Truck,
  Package,
  Printer,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  X,
  FileImage,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export const OrderDetailPage: React.FC = () => {
  const { orders, updateOrderStatus, updateOrderShipping, payments, verifyPayment, rejectPayment } = useAdminData();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const order = orders.find((o) => o.id === id || o.orderNumber === id);
  const paymentRecord = payments.find((p) => p.orderId === order?.id || p.orderNumber === order?.orderNumber);

  const [courier, setCourier] = useState(order?.courier || "DHL Express Luxury");
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || "");
  const [shippingStatus, setShippingStatus] = useState<Order["shippingStatus"]>(
    order?.shippingStatus || "Processing"
  );

  const [signedProofUrl, setSignedProofUrl] = useState<string | null>(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchSignedUrl() {
      if (!order?.paymentProofUrl) {
        setSignedProofUrl(null);
        return;
      }

      if (
        order.paymentProofUrl.startsWith("http://") ||
        order.paymentProofUrl.startsWith("https://") ||
        order.paymentProofUrl.startsWith("data:")
      ) {
        setSignedProofUrl(order.paymentProofUrl);
        return;
      }

      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.storage
            .from("payment-proofs")
            .createSignedUrl(order.paymentProofUrl, 3600);

          if (!error && data?.signedUrl && isMounted) {
            setSignedProofUrl(data.signedUrl);
          }
        } catch (e) {
          console.error("Failed to generate signed URL for payment proof:", e);
        }
      }
    }

    fetchSignedUrl();
    return () => {
      isMounted = false;
    };
  }, [order?.paymentProofUrl]);

  if (!order) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-serif text-ivory">Order Record Not Found</h2>
        <button
          onClick={() => navigate("/admin/orders")}
          className="px-4 py-2 bg-gold text-navy font-semibold rounded text-xs"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const handleSaveShipping = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrderShipping(order.id, courier, trackingNumber, shippingStatus);
  };

  const handleVerify = () => {
    if (paymentRecord) {
      verifyPayment(paymentRecord.id, "Verified by concierge staff in order detail");
    } else {
      updateOrderStatus(order.id, "Confirmed", "Payment manually verified by staff");
    }
  };

  const handleReject = () => {
    if (paymentRecord) {
      rejectPayment(paymentRecord.id, "Payment receipt unreadable or invalid transaction ID");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Orders", path: "/admin/orders" },
          { label: order.orderNumber },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/admin/orders")}
            className="p-2 rounded text-muted hover:text-gold hover:bg-navy2 transition-colors border border-gold/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight">
                Order {order.orderNumber}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted font-sans font-light mt-0.5">
              Placed on {order.createdAt} • Payment via {order.paymentMethod}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded text-xs font-sans uppercase tracking-wider text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4 text-gold" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Fulfillment Pipeline Visualizer */}
      <OrderStatusTimeline
        timeline={order.timeline}
        currentStatus={order.status}
        onUpdateStatus={(newSt) => updateOrderStatus(order.id, newSt)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Items Table & Financial Breakdown) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Itemized Order Table */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-3">
              Handcrafted Fragrances Ordered ({order.items.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-navy text-gold uppercase tracking-widest text-[10px] border-b border-gold/15">
                  <tr>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10 text-ivory">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-navy/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded border border-gold/20 bg-navy flex items-center justify-center overflow-hidden shrink-0">
                            <Package className="w-5 h-5 text-gold" />
                          </div>
                          <div>
                            <h4 className="font-serif font-bold text-sm text-ivory">
                              {item.name}
                            </h4>
                            <span className="text-[10px] font-mono text-gold block">
                              {item.sku} • {item.size}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        Rs. {item.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-gold">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-ivory">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="pt-4 border-t border-gold/15 space-y-2 max-w-xs ml-auto text-xs font-sans">
              <div className="flex justify-between text-muted">
                <span>Items Subtotal:</span>
                <span className="font-mono text-ivory">
                  Rs. {order.subtotal.toLocaleString()}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Voucher Discount:</span>
                  <span className="font-mono">- Rs. {order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Shipping Fee:</span>
                <span className="font-mono text-ivory">
                  {order.shippingFee === 0 ? "Complimentary" : `Rs. ${order.shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gold pt-2 border-t border-gold/20">
                <span>Order Total:</span>
                <span className="font-mono">Rs. {order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Tracking & Dispatch Form */}
          <form
            onSubmit={handleSaveShipping}
            className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center space-x-2 border-b border-gold/15 pb-3">
              <Truck className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base font-bold text-ivory">
                Dispatch Courier & Tracking Info
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  Courier Carrier
                </label>
                <input
                  type="text"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="DHL Express Luxury"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="DHL-9823411029"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  Shipping Status
                </label>
                <select
                  value={shippingStatus}
                  onChange={(e) => setShippingStatus(e.target.value as any)}
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                >
                  <option value="Unfulfilled">Unfulfilled</option>
                  <option value="Processing">Processing</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans uppercase tracking-wider flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save Courier Info</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Sidebar Column (Customer & Addresses) */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-3 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-gold/15 pb-3">
              <User className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base font-bold text-ivory">
                Client Profile
              </h3>
            </div>

            <div className="space-y-2 text-xs font-sans">
              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">
                  Client Name
                </span>
                <span className="font-serif font-bold text-sm text-ivory">
                  {order.customerName}
                </span>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">
                  Email Address
                </span>
                <span className="text-gold font-mono">{order.customerEmail}</span>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">
                  Phone Number
                </span>
                <span className="text-ivory font-mono">{order.customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-3 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-gold/15 pb-3">
              <MapPin className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base font-bold text-ivory">
                Shipping Address
              </h3>
            </div>

            <div className="text-xs font-sans text-muted leading-relaxed space-y-1">
              <p className="text-ivory font-medium">{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zip}
              </p>
              <p className="text-gold uppercase font-mono tracking-wider">
                {order.shippingAddress.country}
              </p>
            </div>
          </div>

          {/* Payment Info & Manual Payment Proof Verification Card */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-gold/15 pb-3">
              <CreditCard className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base font-bold text-ivory">
                Payment Verification
              </h3>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="flex justify-between items-center">
                <span className="text-muted">Payment Method:</span>
                <span className="text-ivory font-medium font-serif">{order.paymentMethod}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted">Payment Status:</span>
                <StatusBadge status={order.paymentStatus} />
              </div>

              <div className="pt-2 border-t border-gold/15">
                <span className="text-[10px] text-muted uppercase tracking-wider block mb-1">
                  Transaction / Reference ID
                </span>
                <span className="font-mono text-xs text-gold bg-navy px-2.5 py-1.5 rounded border border-gold/20 block truncate">
                  {order.paymentReference || "N/A"}
                </span>
              </div>

              {order.paymentProofNote && (
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block mb-0.5">
                    Transfer Note
                  </span>
                  <p className="text-xs text-ivory/80 italic font-light">
                    "{order.paymentProofNote}"
                  </p>
                </div>
              )}

              {/* Private Payment Proof Screenshot Rendering */}
              {order.paymentMethod !== "Cash on Delivery" && (
                <div className="pt-2 border-t border-gold/15 space-y-2">
                  <span className="text-[10px] text-gold uppercase tracking-wider block font-semibold flex items-center space-x-1">
                    <FileImage className="w-3.5 h-3.5" />
                    <span>Payment Screenshot / Proof</span>
                  </span>

                  {signedProofUrl ? (
                    <div className="space-y-2">
                      <div
                        onClick={() => setShowScreenshotModal(true)}
                        className="relative group rounded overflow-hidden border border-gold/30 bg-navy cursor-pointer hover:border-gold transition-colors aspect-video flex items-center justify-center"
                      >
                        <img
                          src={signedProofUrl}
                          alt="Payment Transfer Proof Screenshot"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5 text-gold text-xs font-bold font-mono">
                          <Eye className="w-4 h-4" />
                          <span>Inspect Screenshot</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowScreenshotModal(true)}
                        className="w-full py-1.5 bg-navy border border-gold/30 hover:border-gold text-gold text-[11px] font-mono rounded flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Full Screenshot</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-navy rounded border border-gold/10 text-center">
                      <span className="text-[11px] text-muted italic font-mono block">
                        {order.paymentProofUrl
                          ? "Loading signed screenshot URL..."
                          : "No screenshot attached for this transaction."}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Staff Verification Controls */}
              {order.paymentMethod !== "Cash on Delivery" &&
                (order.paymentStatus === "Pending" ||
                  order.paymentStatus === "Verification Pending" ||
                  order.paymentStatus === ("Pending Verification" as any)) && (
                  <div className="pt-3 border-t border-gold/20 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleVerify}
                      className="flex-1 py-2 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 rounded text-xs uppercase font-bold font-mono flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Verify Payment</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      className="flex-1 py-2 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/50 rounded text-xs uppercase font-bold font-mono flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Screenshot Inspection Modal */}
      {showScreenshotModal && signedProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-navy2 border border-gold/30 rounded-lg max-w-3xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-ivory">
                  Payment Transfer Screenshot Proof
                </h3>
                <span className="text-xs font-mono text-gold">
                  Order #{order.orderNumber} • Reference: {order.paymentReference || "N/A"}
                </span>
              </div>
              <button
                onClick={() => setShowScreenshotModal(false)}
                className="p-1.5 rounded text-muted hover:text-ivory hover:bg-navy border border-gold/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded border border-gold/20 bg-navy flex items-center justify-center p-2">
              <img
                src={signedProofUrl}
                alt="Full Payment Screenshot"
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={signedProofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-gold hover:underline flex items-center space-x-1"
              >
                <span>Open image in new tab</span>
              </a>

              <button
                type="button"
                onClick={() => setShowScreenshotModal(false)}
                className="px-4 py-2 bg-gold text-navy font-bold rounded text-xs uppercase"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
