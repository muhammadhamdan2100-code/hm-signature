import React, { useState } from "react";
import { useAdminData, type Order } from "../context/AdminDataContext";
import { OrderStatusTimeline } from "../components/OrderStatusTimeline";
import { StatusBadge } from "../components/StatusBadge";
import { Breadcrumb } from "../components/Breadcrumb";
import {
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  Truck,
  Package,
  Printer,
  Send,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export const OrderDetailPage: React.FC = () => {
  const { orders, updateOrderStatus, updateOrderShipping } = useAdminData();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const order = orders.find((o) => o.id === id || o.orderNumber === id);

  const [courier, setCourier] = useState(order?.courier || "DHL Express Luxury");
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || "");
  const [shippingStatus, setShippingStatus] = useState<Order["shippingStatus"]>(
    order?.shippingStatus || "Processing"
  );

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

          {/* Payment Info */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-3 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-gold/15 pb-3">
              <CreditCard className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base font-bold text-ivory">
                Payment Info
              </h3>
            </div>

            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between items-center">
                <span className="text-muted">Payment Method:</span>
                <span className="text-ivory font-medium">{order.paymentMethod}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted">Payment Status:</span>
                <StatusBadge status={order.paymentStatus} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
