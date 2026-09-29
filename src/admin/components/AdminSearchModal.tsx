import React, { useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import { Search, Package, ShoppingBag, Users, Tag, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdminSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSearchModal: React.FC<AdminSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { products, orders, customers, coupons } = useAdminData();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingProducts = q
    ? products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    : [];

  const matchingOrders = q
    ? orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q)
      )
    : [];

  const matchingCustomers = q
    ? customers.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      )
    : [];

  const matchingCoupons = q
    ? coupons.filter((cp) => cp.code.toLowerCase().includes(q))
    : [];

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-navy/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-start justify-center p-4 pt-16 text-center">
        <div className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-navy2 border border-gold/30 text-left shadow-2xl transition-all">
          {/* Search Header */}
          <div className="relative border-b border-gold/20 p-4 bg-navy">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gold" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, SKUs, orders, customers, coupons..."
              className="w-full bg-transparent pl-10 pr-10 text-sm font-sans text-ivory placeholder-muted focus:outline-none"
            />
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-gold"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs font-sans">
            {!q ? (
              <div className="py-8 text-center text-muted font-light">
                Type a product name, order # (e.g., HMS-8921), customer email, or coupon code to quick-navigate.
              </div>
            ) : (
              <>
                {/* Products */}
                {matchingProducts.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-gold mb-2">
                      <Package className="w-3.5 h-3.5" />
                      <span>Products ({matchingProducts.length})</span>
                    </div>
                    <div className="space-y-1">
                      {matchingProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleNavigate(`/admin/products/${p.id}`)}
                          className="flex items-center justify-between p-2.5 rounded bg-navy/50 hover:bg-navy border border-gold/10 hover:border-gold/30 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold text-ivory">{p.name}</span>
                            <span className="text-[10px] font-mono text-gold bg-navy border border-gold/20 px-1.5 py-0.5 rounded">
                              {p.sku}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-muted">
                            <span>Rs. {p.price.toLocaleString()}</span>
                            <ChevronRight className="w-4 h-4 text-gold" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Orders */}
                {matchingOrders.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-gold mb-2">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Orders ({matchingOrders.length})</span>
                    </div>
                    <div className="space-y-1">
                      {matchingOrders.map((o) => (
                        <div
                          key={o.id}
                          onClick={() => handleNavigate(`/admin/orders/${o.id}`)}
                          className="flex items-center justify-between p-2.5 rounded bg-navy/50 hover:bg-navy border border-gold/10 hover:border-gold/30 cursor-pointer transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-gold font-mono">{o.orderNumber}</span>
                            <span className="text-muted ml-2">— {o.customerName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-muted">
                            <span>Rs. {o.total.toLocaleString()}</span>
                            <ChevronRight className="w-4 h-4 text-gold" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customers */}
                {matchingCustomers.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-gold mb-2">
                      <Users className="w-3.5 h-3.5" />
                      <span>Customers ({matchingCustomers.length})</span>
                    </div>
                    <div className="space-y-1">
                      {matchingCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleNavigate(`/admin/customers/${c.id}`)}
                          className="flex items-center justify-between p-2.5 rounded bg-navy/50 hover:bg-navy border border-gold/10 hover:border-gold/30 cursor-pointer transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-ivory">{c.name}</span>
                            <span className="text-muted text-[11px] ml-2">({c.email})</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gold" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coupons */}
                {matchingCoupons.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-gold mb-2">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Coupons ({matchingCoupons.length})</span>
                    </div>
                    <div className="space-y-1">
                      {matchingCoupons.map((cp) => (
                        <div
                          key={cp.id}
                          onClick={() => handleNavigate(`/admin/coupons`)}
                          className="flex items-center justify-between p-2.5 rounded bg-navy/50 hover:bg-navy border border-gold/10 hover:border-gold/30 cursor-pointer transition-colors"
                        >
                          <span className="font-mono text-gold font-bold">{cp.code}</span>
                          <ChevronRight className="w-4 h-4 text-gold" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchingProducts.length === 0 &&
                  matchingOrders.length === 0 &&
                  matchingCustomers.length === 0 &&
                  matchingCoupons.length === 0 && (
                    <div className="py-8 text-center text-muted font-light">
                      No matching records found for "{query}".
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
