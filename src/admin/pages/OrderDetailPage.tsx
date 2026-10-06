import React, { useState, useEffect } from "react";
import { useAdminData, type Order } from "../context/AdminDataContext";
import { OrderStatusTimeline } from "../components/OrderStatusTimeline";
import { StatusBadge, usePaymentMethodLabel } from "../components/StatusBadge";
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
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  FileImage,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useI18n } from "../../i18n/I18nProvider";

export const OrderDetailPage: React.FC = () => {
  const { t } = useI18n();
  const methodLabel = usePaymentMethodLabel();
  const { orders, updateOrderStatus, updateOrderShipping, payments, verifyPayment, rejectPayment, saveAdminNotes } = useAdminData();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const order = orders.find((o) => o.id === id || o.orderNumber === id);
  const paymentRecord = payments.find((p) => p.orderId === order?.id || p.orderNumber === order?.orderNumber);

  const [courier, setCourier] = useState(order?.courier || "DHL Express Luxury");
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || "");
  const [trackingUrl, setTrackingUrl] = useState(order?.trackingUrl || "");
  const [estimatedDelivery, setEstimatedDelivery] = useState(order?.estimatedDelivery || "");
  const [adminNotes, setAdminNotes] = useState(order?.adminNotes || "");
  const [notesBusy, setNotesBusy] = useState(false);
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

  // The order list hydrates from Supabase after this page mounts, so seed the
  // shipping fields from the stored record instead of keeping the mount-time defaults.
  useEffect(() => {
    if (!order) return;
    setCourier(order.courier || "DHL Express Luxury");
    setTrackingNumber(order.trackingNumber || "");
    setTrackingUrl(order.trackingUrl || "");
    setEstimatedDelivery(order.estimatedDelivery || "");
    setAdminNotes(order.adminNotes || "");
    setShippingStatus(order.shippingStatus || "Processing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  if (!order) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-serif text-ivory">{t("admin.orderDetail.orderRecordNotFound")}</h2>
        <button
          onClick={() => navigate("/admin/orders")}
          className="px-4 py-2 bg-gold text-navy font-semibold rounded text-xs"
        >
          {t("admin.orderDetail.backToOrders")}
        </button>
      </div>
    );
  }

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateOrderShipping(order.id, courier, trackingNumber, shippingStatus, {
      trackingUrl: trackingUrl.trim() || undefined,
      estimatedDelivery: estimatedDelivery || undefined,
    });
    if (res.success && res.trackingId) setTrackingNumber(res.trackingId);
  };

  const handleGenerateTracking = async () => {
    const res = await updateOrderShipping(order.id, courier, "", shippingStatus, { generate: true });
    if (res.success && res.trackingId) setTrackingNumber(res.trackingId);
  };

  const handleSaveAdminNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotesBusy(true);
    await saveAdminNotes(order.id, adminNotes.trim() || "");
    setNotesBusy(false);
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
          { label: t("admin.nav.orders"), path: "/admin/orders" },
          { label: order.orderNumber },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/orders")}
            className="p-2 rounded text-muted hover:text-gold hover:bg-navy2 transition-colors border border-gold/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight">
                {t("admin.orderDetail.orderNumberTitle", { number: order.orderNumber })}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted font-sans font-light mt-0.5">
              {t("admin.orderDetail.placedOnWithPayment", { date: order.createdAt, method: methodLabel(order.paymentMethod) })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded text-xs font-sans uppercase tracking-wider text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-gold" />
            <span>{t("admin.orderDetail.printInvoice")}</span>
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
              {t("admin.orderDetail.handcraftedFragrancesOrdered", { count: order.items.length })}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs font-sans">
                <thead className="bg-navy text-gold uppercase tracking-widest text-[10px] border-b border-gold/15">
                  <tr>
                    <th className="py-2.5 px-3">{t("admin.orderDetail.item")}</th>
                    <th className="py-2.5 px-3">{t("admin.orderDetail.price")}</th>
                    <th className="py-2.5 px-3 text-center">{t("admin.orderDetail.qty")}</th>
                    <th className="py-2.5 px-3 text-end">{t("admin.orderDetail.subtotal")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10 text-ivory">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-navy/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
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
                      <td className="py-3 px-3 text-end font-mono font-bold text-ivory">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="pt-4 border-t border-gold/15 space-y-2 max-w-xs ms-auto text-xs font-sans">
              <div className="flex justify-between text-muted">
                <span>{t("admin.orderDetail.itemsSubtotal")}</span>
                <span className="font-mono text-ivory">
                  Rs. {order.subtotal.toLocaleString()}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>{t("admin.orderDetail.voucherDiscount")}</span>
                  <span className="font-mono">- Rs. {order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>{t("admin.orderDetail.shippingFee")}</span>
                <span className="font-mono text-ivory">
                  {order.shippingFee === 0 ? t("common.complimentary") : `Rs. ${order.shippingFee}`}
                </span>
              </div>
              {Number(order.taxAmount || 0) > 0 && (
                <div className="flex justify-between text-muted">
                  <span>{order.taxLabel || t("admin.orderDetail.tax")} ({order.taxRate}%):</span>
                  <span className="font-mono text-ivory">Rs. {order.taxAmount!.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gold pt-2 border-t border-gold/20">
                <span>{t("admin.orderDetail.orderTotal")}</span>
                <span className="font-mono">Rs. {order.total.toLocaleString()}</span>
              </div>
              {/* Recorded when the order was placed: a later rate or tax change cannot move it. */}
              <div className="flex justify-between text-[11px] text-muted pt-1">
                <span>{t("admin.orderDetail.chargedInDestination")}</span>
                <span className="font-mono text-ivory">
                  {order.currency || "PKR"}
                  {order.destinationCountry ? ` · ${order.destinationCountry}` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Tracking & Dispatch Form */}
          <form
            onSubmit={handleSaveShipping}
            className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
              <Truck className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base font-bold text-ivory">
                {t("admin.orderDetail.dispatchCourierTrackingInfo")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="od-courier" className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  {t("admin.orderDetail.courierCarrier")}
                </label>
                <input
                  id="od-courier"
                  type="text"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="Leopards / TCS / DHL"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label htmlFor="od-tracking" className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  {t("admin.orderDetail.trackingNumber")}
                </label>
                <div className="flex gap-2">
                  <input
                    id="od-tracking"
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder={t("admin.orderDetail.autoOrManual")}
                    className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateTracking}
                    className="px-3 py-2 shrink-0 bg-navy border border-gold/40 hover:border-gold text-gold rounded text-[10px] uppercase font-bold tracking-wider transition-colors"
                    title={t("admin.orderDetail.generateUniqueTrackingReference")}
                  >
                    {t("admin.orderDetail.generate")}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="od-status" className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  {t("admin.orderDetail.shippingStatus")}
                </label>
                <select
                  id="od-status"
                  value={shippingStatus}
                  onChange={(e) => setShippingStatus(e.target.value as any)}
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                >
                  <option value="Processing">{t("status.preparing")}</option>
                  <option value="In Transit">{t("status.intransit")}</option>
                  <option value="Delivered">{t("status.delivered")}</option>
                  <option value="Returned">{t("status.returned")}</option>
                </select>
              </div>

              <div>
                <label htmlFor="od-eta" className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  {t("admin.orderDetail.estimatedDelivery")}
                </label>
                <input
                  id="od-eta"
                  type="date"
                  value={estimatedDelivery ? String(estimatedDelivery).slice(0, 10) : ""}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="od-url" className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  {t("admin.orderDetail.trackingUrl")}
                </label>
                <input
                  id="od-url"
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://courier.example.com/tracking?awb=..."
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                />
                <p className="text-[10px] text-muted font-light mt-1">
                  {t("admin.orderDetail.shownToClientNote")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-[10px] text-muted font-light">
                {t("admin.orderDetail.everyChangeWrittenNote")}
              </p>
              <button
                type="submit"
                className="px-4 py-2 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans uppercase tracking-wider flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t("admin.orderDetail.saveCourierInfo")}</span>
              </button>
            </div>
          </form>

          {/* Internal Notes (staff only — never surfaced on customer routes) */}
          <form
            onSubmit={handleSaveAdminNotes}
            className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-3 shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
              <AlertTriangle className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base font-bold text-ivory">{t("admin.orderDetail.internalNotes")}</h3>
            </div>
            <label htmlFor="od-notes" className="sr-only">{t("admin.orderDetail.internalNotesLabel")}</label>
            <textarea
              id="od-notes"
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              maxLength={2000}
              placeholder={t("admin.orderDetail.visibleToStaffOnly")}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted font-mono">{adminNotes.length}/2000</span>
              <button
                type="submit"
                disabled={notesBusy}
                className="px-4 py-2 bg-navy border border-gold/40 hover:bg-gold hover:text-navy text-gold rounded text-xs uppercase font-bold tracking-wider disabled:opacity-50 transition-colors"
              >
                {notesBusy ? t("admin.orderDetail.saving") : t("admin.orderDetail.saveNote")}
              </button>
            </div>
            {order.customerNotes && (
              <p className="text-[11px] text-muted font-light border-t border-gold/15 pt-3">
                <span className="text-gold font-mono text-[10px] uppercase block">{t("admin.orderDetail.clientNote")}</span>
                {order.customerNotes}
              </p>
            )}
          </form>
        </div>

        {/* Right Sidebar Column (Customer & Addresses) */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
              <User className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base font-bold text-ivory">
                {t("admin.orderDetail.clientProfile")}
              </h3>
            </div>

            <div className="space-y-2 text-xs font-sans">
              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">
                  {t("admin.orderDetail.clientName")}
                </span>
                <span className="font-serif font-bold text-sm text-ivory">
                  {order.customerName}
                </span>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">
                  {t("admin.orderDetail.emailAddress")}
                </span>
                <span className="text-gold font-mono">{order.customerEmail}</span>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">
                  {t("admin.orderDetail.phoneNumber")}
                </span>
                <span className="text-ivory font-mono">{order.customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
              <MapPin className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base font-bold text-ivory">
                {t("admin.orderDetail.shippingAddress")}
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
            <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
              <CreditCard className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base font-bold text-ivory">
                {t("admin.orderDetail.paymentVerification")}
              </h3>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="flex justify-between items-center">
                <span className="text-muted">{t("admin.orderDetail.paymentMethodLabel")}</span>
                <span className="text-ivory font-medium font-serif">{methodLabel(order.paymentMethod)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted">{t("admin.orderDetail.paymentStatusLabel")}</span>
                <StatusBadge status={order.paymentStatus} />
              </div>

              <div className="pt-2 border-t border-gold/15">
                <span className="text-[10px] text-muted uppercase tracking-wider block mb-1">
                  {t("admin.orderDetail.transactionReferenceId")}
                </span>
                <span className="font-mono text-xs text-gold bg-navy px-2.5 py-1.5 rounded border border-gold/20 block truncate">
                  {order.paymentReference || "—"}
                </span>
              </div>

              {order.paymentProofNote && (
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block mb-0.5">
                    {t("admin.orderDetail.transferNote")}
                  </span>
                  <p className="text-xs text-ivory/80 italic font-light">
"{order.paymentProofNote}"
                  </p>
                </div>
              )}

              {/* Private Payment Proof Screenshot Rendering */}
              {order.paymentMethod !== "Cash on Delivery" && (
                <div className="pt-2 border-t border-gold/15 space-y-2">
                  <span className="text-[10px] text-gold uppercase tracking-wider block font-semibold flex items-center gap-1">
                    <FileImage className="w-3.5 h-3.5" />
                    <span>{t("admin.orderDetail.paymentScreenshotProof")}</span>
                  </span>

                  {signedProofUrl ? (
                    <div className="space-y-2">
                      <div
                        onClick={() => setShowScreenshotModal(true)}
                        className="relative group rounded overflow-hidden border border-gold/30 bg-navy cursor-pointer hover:border-gold transition-colors aspect-video flex items-center justify-center"
                      >
                        <img
                          src={signedProofUrl}
                          alt={t("admin.orderDetail.paymentTransferProofScreenshotAlt")}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-gold text-xs font-bold font-mono">
                          <Eye className="w-4 h-4" />
                          <span>{t("admin.orderDetail.inspectScreenshot")}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowScreenshotModal(true)}
                        className="w-full py-1.5 bg-navy border border-gold/30 hover:border-gold text-gold text-[11px] font-mono rounded flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t("admin.orderDetail.viewFullScreenshot")}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-navy rounded border border-gold/10 text-center">
                      <span className="text-[11px] text-muted italic font-mono block">
                        {order.paymentProofUrl
                          ? t("admin.orderDetail.loadingSignedScreenshot")
                          : t("admin.orderDetail.noScreenshotAttached")}
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
                  <div className="pt-3 border-t border-gold/20 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleVerify}
                      className="flex-1 py-2 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 rounded text-xs uppercase font-bold font-mono flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{t("admin.orderDetail.verifyPayment")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      className="flex-1 py-2 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/50 rounded text-xs uppercase font-bold font-mono flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{t("admin.orderDetail.reject")}</span>
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
                  {t("admin.orderDetail.paymentTransferScreenshotProof")}
                </h3>
                <span className="text-xs font-mono text-gold">
                  {t("admin.orderDetail.orderReferenceLine", { number: order.orderNumber, reference: order.paymentReference || "—" })}
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
                alt={t("admin.orderDetail.fullPaymentScreenshotAlt")}
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={signedProofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-gold hover:underline flex items-center gap-1"
              >
                <span>{t("admin.orderDetail.openImageInNewTab")}</span>
              </a>

              <button
                type="button"
                onClick={() => setShowScreenshotModal(false)}
                className="px-4 py-2 bg-gold text-navy font-bold rounded text-xs uppercase"
              >
                {t("admin.orderDetail.closePreview")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
