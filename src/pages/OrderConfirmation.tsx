import { useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Package, Truck } from "lucide-react";
import { useAdminData } from "../admin/context/AdminDataContext";
import { useCurrency } from "../context/CurrencyContext";
import { useI18n } from "../i18n/I18nProvider";
import RewardsPanel from "../components/RewardsPanel";
import { captureEvent } from "../services/analyticsCapture";

export default function OrderConfirmation() {
  const { t } = useI18n();
  const { format } = useCurrency();
  const { orderId } = useParams<{ orderId: string }>();
  const { orders } = useAdminData();
  const navigate = useNavigate();

  // Find order by ID or Order Number
  const order = orders.find(
    (o) => o.id === orderId || o.orderNumber.toLowerCase() === orderId?.toLowerCase()
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 9.4 — payment is called complete only where a settled status is actually
  // stored on the order. A cash-on-delivery basket stays unpaid here, and the
  // funnel reports it as such rather than as a completed payment.
  const settledRecorded = useRef(false);
  useEffect(() => {
    if (!order || settledRecorded.current) return;
    if (order.paymentStatus === "Paid" || order.paymentStatus === "Verified") {
      settledRecorded.current = true;
      captureEvent({ event: "payment_completed", orderId: order.id });
    }
  }, [order]);

  if (!order) {
    return (
      <div className="pt-36 pb-24 bg-navy min-h-screen text-center text-ivory">
        <div className="max-w-md mx-auto px-6 space-y-4">
          <Package className="w-12 h-12 text-gold mx-auto opacity-60" />
          <h1 className="font-serif text-2xl font-bold">{t("account.orderRecordNotFound")}</h1>
          <p className="text-muted text-xs font-sans">
            {t("account.orderRecordNotFoundBody")}
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link to="/account/orders" className="btn-gold font-sans text-xs">
              {t("account.viewMyOrders")}
            </Link>
            <Link to="/collections" className="btn-gold-fill font-sans text-xs">
              {t("account.continueShopping")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 bg-navy min-h-screen text-ivory font-sans">
      <div className="max-w-3xl mx-auto px-6 space-y-8">
        {/* Top Success Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 rounded-full border border-gold bg-gold/10 mx-auto flex items-center justify-center shadow-xl">
            <Check className="w-10 h-10 text-gold" />
          </div>
          <div className="text-[10px] font-mono tracking-[4px] text-gold uppercase">{t("account.orderReceived")}</div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">{t("account.thankYouForOrder")}</h1>
          <p className="text-muted text-xs sm:text-sm max-w-lg mx-auto font-light leading-relaxed">
            {t("account.orderReceivedBody")}
          </p>
        </motion.div>

        {/* Order Essential Details Card */}
        <div className="bg-navy2 border border-gold/30 rounded-xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
            <div>
              <span className="text-[10px] text-gold font-mono uppercase tracking-[2px] block">{t("account.orderNumberLabel")}</span>
              <h2 className="font-mono text-xl font-bold text-ivory">{order.orderNumber}</h2>
            </div>
            <div className="text-start sm:text-end">
              <span className="text-[10px] text-gold font-mono uppercase tracking-[2px] block">{t("account.trackingReferenceLabel")}</span>
              <span className={`font-mono text-sm font-bold ${order.trackingNumber ? "text-goldLight" : "text-muted"}`}>
                {order.trackingNumber ? order.trackingNumber : t("account.assignedOnceDispatched")}
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b border-gold/15 pb-6">
            <div>
              <span className="text-muted block text-[10px] uppercase">{t("account.orderDateLabel")}</span>
              <span className="text-ivory font-medium">{order.createdAt}</span>
            </div>
            <div>
              <span className="text-muted block text-[10px] uppercase">{t("account.paymentMethodLabel")}</span>
              <span className="text-ivory font-medium">{order.paymentMethod}</span>
            </div>
            <div>
              <span className="text-muted block text-[10px] uppercase">{t("account.paymentStatusLabel")}</span>
              <span className="text-amber-300 font-semibold font-mono uppercase text-[11px]">{order.paymentStatus}</span>
            </div>
            <div>
              <span className="text-muted block text-[10px] uppercase">{t("account.orderStatusLabel")}</span>
              <span className="text-emerald-300 font-semibold font-mono uppercase text-[11px]">{order.status}</span>
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-base text-ivory">{t("account.fragranceExtraits")}</h3>
            <div className="space-y-3 divide-y divide-gold/10">
              {order.items.map((item, idx) => (
                <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 bg-navy border border-gold/20 rounded flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-ivory">{item.name}</h4>
                      <p className="text-[10px] text-muted font-mono">{item.size ? `${item.size} • ` : ''}{item.sku} • {t("account.qtyWord")} {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-gold">{format(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="border-t border-gold/20 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>{t("account.itemsSubtotal")}</span>
              <span className="font-mono text-ivory">{format(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-300">
                <span>{t("common.discount")}</span>
                <span className="font-mono">- {format(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted"><span>{t("checkout.shipping")}</span><span className="font-mono text-ivory">{order.shippingFee === 0 ? t("shipping.complimentary") : format(order.shippingFee)}</span></div>
            <div className="flex justify-between pt-3 border-t border-gold/15 font-serif text-base font-bold">
              <span className="text-ivory">{t("account.totalAmountPaidPayable")}</span>
              <span className="text-gold font-mono">{format(order.total)}</span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border-t border-gold/20 pt-4 text-xs space-y-1">
            <span className="text-[10px] text-gold font-mono uppercase tracking-[2px] block">{t("account.deliveryHeading")}</span>
            <p className="text-ivory font-bold">{order.customerName}</p>
            <p className="text-muted">{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.zip}, {order.shippingAddress.country}</p>
          </div>

          {/* Phase 8 (8.5, 8.6): a gift card or loyalty points can be applied to what is still owed. */}
          <RewardsPanel orderId={order.id} />
        </div>

        {/* Navigation CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => navigate(`/track-order?trackingId=${order.trackingNumber || order.orderNumber}`)}
            className="w-full sm:w-auto px-6 py-3 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <Truck className="w-4 h-4" />
            <span>{t("account.trackThisOrder")}</span>
          </button>
          <Link
            to="/account/orders"
            className="w-full sm:w-auto px-6 py-3 border border-gold/30 text-ivory hover:border-gold rounded font-sans text-xs uppercase tracking-wider font-semibold text-center transition-colors"
          >
            {t("account.viewMyOrdersPlain")}
          </Link>
          <Link
            to="/collections"
            className="w-full sm:w-auto px-6 py-3 border border-gold/30 text-muted hover:text-ivory rounded font-sans text-xs uppercase tracking-wider font-semibold text-center transition-colors"
          >
            {t("account.continueShoppingPlain")}
          </Link>
        </div>
      </div>
    </div>
  );
}
