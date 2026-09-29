import React from "react";
import { useAdminData } from "../context/AdminDataContext";
import { StatusBadge } from "../components/StatusBadge";
import { Breadcrumb } from "../components/Breadcrumb";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export const CustomerDetailPage: React.FC = () => {
  const { customers, orders } = useAdminData();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-serif text-ivory">Client Profile Not Found</h2>
        <button
          onClick={() => navigate("/admin/customers")}
          className="px-4 py-2 bg-gold text-navy font-semibold rounded text-xs"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  const customerOrders = orders.filter(
    (o) =>
      o.customerEmail.toLowerCase() === customer.email.toLowerCase() ||
      o.customerName.toLowerCase() === customer.name.toLowerCase()
  );

  const avgOrderValue = customer.ordersCount > 0 ? Math.round(customer.totalSpent / customer.ordersCount) : 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Customers", path: "/admin/customers" },
          { label: customer.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/admin/customers")}
            className="p-2 rounded text-muted hover:text-gold hover:bg-navy2 transition-colors border border-gold/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight">
                {customer.name}
              </h1>
              <StatusBadge status={customer.status} />
            </div>
            <p className="text-xs text-muted font-sans font-light mt-0.5">
              Client since {customer.joinedDate}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-navy2/90 border border-gold/20 p-4 rounded-lg">
          <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
            Total Orders
          </span>
          <span className="text-xl font-serif text-ivory font-bold">
            {customer.ordersCount}
          </span>
        </div>
        <div className="bg-navy2/90 border border-gold/20 p-4 rounded-lg">
          <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
            Lifetime Spend
          </span>
          <span className="text-xl font-serif text-gold font-bold">
            Rs. {customer.totalSpent.toLocaleString()}
          </span>
        </div>
        <div className="bg-navy2/90 border border-gold/20 p-4 rounded-lg">
          <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
            Average Order Value
          </span>
          <span className="text-xl font-serif text-ivory font-bold">
            Rs. {avgOrderValue.toLocaleString()}
          </span>
        </div>
        <div className="bg-navy2/90 border border-gold/20 p-4 rounded-lg">
          <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
            Last Order Date
          </span>
          <span className="text-xl font-serif text-ivory font-bold">
            {customer.lastOrderDate}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order History */}
        <div className="lg:col-span-2 bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
          <h3 className="font-serif text-lg font-bold text-ivory border-b border-gold/15 pb-3">
            Client Purchase History ({customerOrders.length})
          </h3>

          {customerOrders.length === 0 ? (
            <p className="text-xs text-muted font-light py-6 text-center">
              No previous orders registered for this client.
            </p>
          ) : (
            <div className="space-y-3">
              {customerOrders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => navigate(`/admin/orders/${o.id}`)}
                  className="flex items-center justify-between p-4 rounded bg-navy/60 border border-gold/10 hover:border-gold/30 cursor-pointer transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-gold font-bold text-sm">
                        {o.orderNumber}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-xs text-muted">
                      {o.items.length} Items • {o.items.map((i) => i.name).join(", ")}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-ivory text-sm block">
                      Rs. {o.total.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted">{o.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Profile & Address Info */}
        <div className="space-y-6">
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-3">
              Contact Detail
            </h3>

            <div className="space-y-3 text-xs font-sans">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <span className="font-mono text-gold truncate">{customer.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <span className="text-ivory font-mono">{customer.phone}</span>
              </div>
            </div>
          </div>

          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-3">
              Delivery Address Book
            </h3>

            <div className="space-y-3">
              {customer.addresses?.map((addr, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded bg-navy/60 border border-gold/10 text-xs font-sans space-y-1 text-muted"
                >
                  {addr.isDefault && (
                    <span className="text-[9px] font-mono uppercase text-gold bg-gold/10 px-1.5 py-0.5 rounded border border-gold/20 inline-block mb-1">
                      Default Delivery Address
                    </span>
                  )}
                  <p className="text-ivory font-medium">{addr.street}</p>
                  <p>
                    {addr.city}, {addr.state} {addr.zip}
                  </p>
                  <p className="text-gold font-mono uppercase">{addr.country}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
