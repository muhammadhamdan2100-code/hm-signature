import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CreditCard,
  ExternalLink,
  Heart,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ScrollText,
  ShoppingBag,
  Star,
  User,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { Breadcrumb } from "../components/Breadcrumb";
import { Modal } from "../components/Modal";
import {
  fetchAdminCustomerAggregatesFromDB,
  fetchAdminOrdersFromDB,
  fetchAdminPaymentsFromDB,
  fetchAdminReviewsFromDB,
  fetchRefundsFromDB,
  type CustomerAggregateRow,
  type RefundRecord,
} from "../../services/adminOps";
import type { Order, PaymentRecord, ReviewItem } from "../context/AdminDataContext";
import { formatPKR } from "../../utils/currency";

/* ------------------------------------------------------------------ *
 * Counters (orders, spend, segment, wishlist, reviews) come from the
 * get_admin_customers RPC. Related records are pulled from the admin
 * orders / payments / refunds / reviews services and scoped to this
 * client by email or phone, which is what those services expose.
 * Staff-written order and refund notes are deliberately not rendered.
 * ------------------------------------------------------------------ */

const SECTIONS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "wishlist", label: "Wishlist", icon: Heart },
  { key: "reviews", label: "Reviews", icon: ScrollText },
  { key: "activity", label: "Activity", icon: ActivityIcon },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

interface DetailData {
  row: CustomerAggregateRow | null;
  orders: Order[];
  payments: PaymentRecord[];
  refunds: RefundRecord[];
  reviews: ReviewItem[];
}

interface DerivedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  orderRefs: { id: string; orderNumber: string }[];
  lastUsed: string;
}

interface ActivityEvent {
  id: string;
  date: string;
  kind: "order" | "payment" | "refund";
  title: string;
  statusLabel: string;
  detail?: string;
  amount?: number;
  currency?: string;
  orderId?: string;
  orderNumber?: string;
}

const EMPTY_DETAIL: DetailData = {
  row: null,
  orders: [],
  payments: [],
  refunds: [],
  reviews: [],
};

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Blocked",
};

const toStatusLabel = (status: string) => {
  const key = (status || "").toLowerCase();
  if (ACCOUNT_STATUS_LABELS[key]) return ACCOUNT_STATUS_LABELS[key];
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
};

const toDateOnly = (value: string | null | undefined) =>
  value ? String(value).replace("T", " ").slice(0, 10) : "";

const normalizePhone = (value?: string | null) => (value || "").replace(/[\s-]/g, "");

const REFUND_STATUS_CLASS =
  "text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded border ";

const refundStatusClass = (status: string) =>
  status === "processed"
    ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
    : status === "pending"
      ? "bg-amber-950/60 text-amber-300 border-amber-800/50"
      : "bg-rose-950/60 text-rose-300 border-rose-800/50";

const buttonClass =
  "px-4 py-2 rounded bg-gold hover:bg-goldLight text-navy text-xs font-sans font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold";

const Panel: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <section className="bg-navy2/90 border border-gold/20 rounded-lg p-5 sm:p-6 space-y-4 shadow-xl">
    <div className="border-b border-gold/15 pb-3">
      <h2 className="font-serif text-lg font-bold text-ivory">{title}</h2>
      {subtitle && <p className="text-[11px] text-muted font-light mt-1">{subtitle}</p>}
    </div>
    {children}
  </section>
);

const NotAvailable: React.FC<{ title: string; reason: string }> = ({ title, reason }) => (
  <div className="rounded border border-gold/15 bg-navy/50 p-6 text-center space-y-1.5">
    <h3 className="font-serif text-sm text-ivory font-semibold">{title}</h3>
    <p className="text-xs text-muted font-light max-w-md mx-auto leading-relaxed">{reason}</p>
  </div>
);

const DetailSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in min-w-0" aria-hidden="true">
    <div className="h-4 w-40 bg-navy2/80 rounded animate-pulse" />
    <div className="h-20 w-full bg-navy2/80 rounded-lg animate-pulse border border-gold/10" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 bg-navy2/80 rounded-lg border border-gold/10 animate-pulse" />
      ))}
    </div>
    <div className="h-64 bg-navy2/80 rounded-lg border border-gold/10 animate-pulse" />
  </div>
);

export const CustomerDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<DetailData>(EMPTY_DETAIL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<SectionKey>("profile");
  const [openReview, setOpenReview] = useState<ReviewItem | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [customers, allOrders, allPayments, allRefunds, allReviews] = await Promise.all([
        fetchAdminCustomerAggregatesFromDB(),
        fetchAdminOrdersFromDB(),
        fetchAdminPaymentsFromDB(),
        fetchRefundsFromDB(),
        fetchAdminReviewsFromDB(),
      ]);

      const row = customers.find((c) => c.id === id) ?? null;
      if (!row) {
        setData(EMPTY_DETAIL);
        return;
      }

      const email = (row.email || "").toLowerCase();
      const phone = normalizePhone(row.phone);

      const orders = allOrders.filter(
        (o) =>
          (email && (o.customerEmail || "").toLowerCase() === email) ||
          (phone && normalizePhone(o.customerPhone) === phone)
      );
      const orderIds = new Set(orders.map((o) => o.id));
      const orderNumbers = new Set(orders.map((o) => o.orderNumber));

      const payments = allPayments.filter(
        (p) =>
          (email && (p.customerEmail || "").toLowerCase() === email) ||
          orderIds.has(p.orderId) ||
          (!!p.orderNumber && orderNumbers.has(p.orderNumber))
      );

      const refunds = allRefunds.filter(
        (r) => orderIds.has(r.orderId) || (!!r.orderNumber && orderNumbers.has(r.orderNumber))
      );

      const reviews = allReviews.filter(
        (r) => email && (r.customerEmail || "").toLowerCase() === email
      );

      setData({ row, orders, payments, refunds, reviews });
    } catch (err) {
      const message = err instanceof Error ? err.message : "This client profile could not be loaded.";
      setError(message);
      setData(EMPTY_DETAIL);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { row, orders, payments, refunds, reviews } = data;

  const addresses = useMemo<DerivedAddress[]>(() => {
    const map = new Map<string, DerivedAddress>();
    orders.forEach((o) => {
      const a = o.shippingAddress;
      if (!a) return;
      const parts = [a.street, a.city, a.state, a.zip, a.country].map((v) => (v || "").trim());
      if (parts.every((p) => !p)) return;
      const key = parts.join("|").toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.orderRefs.push({ id: o.id, orderNumber: o.orderNumber });
        if (String(o.createdAt) > existing.lastUsed) existing.lastUsed = o.createdAt;
      } else {
        map.set(key, {
          street: parts[0],
          city: parts[1],
          state: parts[2],
          zip: parts[3],
          country: parts[4],
          orderRefs: [{ id: o.id, orderNumber: o.orderNumber }],
          lastUsed: o.createdAt,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => String(b.lastUsed).localeCompare(String(a.lastUsed)));
  }, [orders]);

  const activity = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];

    orders.forEach((o) => {
      o.timeline.forEach((t, idx) => {
        events.push({
          id: `${o.id}-timeline-${idx}`,
          date: t.date,
          kind: "order",
          title: `Order ${o.orderNumber}`,
          statusLabel: t.status,
          detail: `${o.items.length} item${o.items.length === 1 ? "" : "s"}`,
          orderId: o.id,
          orderNumber: o.orderNumber,
        });
      });
    });

    payments.forEach((p) => {
      events.push({
        id: `${p.id}-payment`,
        date: p.date,
        kind: "payment",
        title: `Payment · ${p.method || "method not recorded"}`,
        statusLabel: p.status,
        amount: p.amount,
        currency: "PKR",
        orderId: p.orderId,
        orderNumber: p.orderNumber,
      });
    });

    refunds.forEach((r) => {
      events.push({
        id: `${r.id}-refund`,
        date: r.date,
        kind: "refund",
        title: "Refund requested",
        statusLabel: r.status,
        detail: r.reason || undefined,
        amount: r.amount,
        currency: r.currency,
        orderId: r.orderId,
        orderNumber: r.orderNumber,
      });
    });

    return events.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [orders, payments, refunds]);

  const counts: Record<SectionKey, number | null> = {
    profile: null,
    orders: orders.length,
    addresses: addresses.length,
    wishlist: row ? row.wishlistCount : 0,
    reviews: reviews.length,
    activity: activity.length,
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % SECTIONS.length;
    if (event.key === "ArrowLeft") next = (index - 1 + SECTIONS.length) % SECTIONS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = SECTIONS.length - 1;
    setSection(SECTIONS[next].key);
    tabRefs.current[next]?.focus();
  };

  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="space-y-4 animate-fade-in min-w-0">
        <Breadcrumb items={[{ label: "Customers", path: "/admin/customers" }, { label: "Profile" }]} />
        <div
          role="alert"
          className="bg-navy2/90 border border-rose-500/30 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded bg-rose-950/50 border border-rose-500/30 text-rose-300 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-base font-bold text-ivory">Client profile unavailable</h1>
              <p className="text-xs text-muted font-light mt-0.5 break-words">{error}</p>
            </div>
          </div>
          <button type="button" onClick={() => void load()} className={`${buttonClass} shrink-0`}>
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="space-y-4 animate-fade-in min-w-0 py-6">
        <Breadcrumb items={[{ label: "Customers", path: "/admin/customers" }, { label: "Not found" }]} />
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-8 text-center space-y-4">
          <h1 className="font-serif text-xl text-ivory font-bold">Client Profile Not Found</h1>
          <p className="text-xs text-muted font-light max-w-md mx-auto">
            The client directory returned no record for this identifier. The account may have been
            removed, or your staff role may not have visibility of it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button type="button" onClick={() => void load()} className={buttonClass}>
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/customers")}
              className="px-4 py-2 rounded text-xs font-sans uppercase tracking-wider text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Customers
            </button>
          </div>
        </div>
      </div>
    );
  }

  const metricTile = (label: string, value: string, hint?: string) => (
    <div className="bg-navy2/90 border border-gold/20 p-4 rounded-lg min-w-0">
      <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
        {label}
      </span>
      <span className="text-lg sm:text-xl font-serif text-ivory font-bold num-lining block break-words">
        {value}
      </span>
      {hint && <span className="text-[10px] text-muted font-light block">{hint}</span>}
    </div>
  );

  const rowClass =
    "rounded bg-navy/60 border border-gold/10 hover:border-gold/30 transition-colors p-4";

  return (
    <div className="space-y-6 animate-fade-in min-w-0">
      <Breadcrumb
        items={[{ label: "Customers", path: "/admin/customers" }, { label: row.name }]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/admin/customers")}
            aria-label="Back to customers"
            className="p-2 rounded text-muted hover:text-gold hover:bg-navy2 transition-colors border border-gold/20 shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight break-words">
                {row.name}
              </h1>
              <StatusBadge status={row.segment} />
              <StatusBadge status={toStatusLabel(row.status)} />
            </div>
            <p className="text-xs text-muted font-sans font-light mt-0.5">
              Client since {toDateOnly(row.joinedDate) || "date not recorded"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          aria-label="Reload client profile"
          className="p-2 rounded text-muted hover:text-gold hover:bg-navy2 transition-colors border border-gold/20 shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Recorded metrics (RPC-provided) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metricTile("Orders", String(row.ordersCount), "Excludes cancelled")}
        {metricTile("Lifetime Spend", formatPKR(row.totalSpent), "Excludes cancelled")}
        {metricTile(
          "Last Order",
          row.lastOrderDate ? toDateOnly(row.lastOrderDate) : "None recorded",
          "Any status"
        )}
        {metricTile("Segment", row.segment, "Computed by the database")}
      </div>

      {/* Section tabs */}
      <div
        role="tablist"
        aria-label="Client profile sections"
        className="flex flex-wrap gap-2 border-b border-gold/15 pb-3"
      >
        {SECTIONS.map((tab, index) => {
          const Icon = tab.icon;
          const active = section === tab.key;
          const count = counts[tab.key];
          return (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${tab.key}`}
              aria-selected={active}
              aria-current={active ? "true" : undefined}
              aria-controls={`panel-${tab.key}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setSection(tab.key)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-sans uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                active
                  ? "bg-gold text-navy font-semibold"
                  : "bg-navy2/80 text-muted border border-gold/20 hover:text-ivory hover:border-gold/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {count !== null && (
                <span className="font-mono num-lining text-[10px] opacity-80">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Profile */}
      {section === "profile" && (
        <div
          role="tabpanel"
          id="panel-profile"
          aria-labelledby="tab-profile"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0"
        >
          <div className="lg:col-span-2">
            <Panel title="Profile">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-gold">
                    Name
                  </dt>
                  <dd className="font-serif text-sm text-ivory font-bold break-words">
                    {row.name}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-gold">
                    Account Status
                  </dt>
                  <dd>
                    <StatusBadge status={toStatusLabel(row.status)} />
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-gold">
                    Email
                  </dt>
                  <dd className="min-w-0">
                    {row.email ? (
                      <a
                        href={`mailto:${row.email}`}
                        className="font-mono text-gold hover:text-goldLight break-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="break-all">{row.email}</span>
                      </a>
                    ) : (
                      <span className="text-muted">No email on file</span>
                    )}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-gold">
                    Phone
                  </dt>
                  <dd>
                    {row.phone ? (
                      <a
                        href={`tel:${row.phone}`}
                        className="font-mono text-ivory flex items-center gap-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {row.phone}
                      </a>
                    ) : (
                      <span className="text-muted">No phone on file</span>
                    )}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-gold">
                    Joined
                  </dt>
                  <dd className="text-ivory font-mono flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-gold shrink-0" />
                    {toDateOnly(row.joinedDate) || "Not recorded"}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-gold">
                    Segment
                  </dt>
                  <dd>
                    <StatusBadge status={row.segment} />
                  </dd>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-gold">
                    Client ID
                  </dt>
                  <dd className="font-mono text-[11px] text-muted break-all">{row.id}</dd>
                </div>
              </dl>
            </Panel>
          </div>

          <Panel title="Recorded Counts" subtitle="All values returned by the customer aggregates query.">
            <ul className="space-y-3 text-xs">
              <li className="flex items-center justify-between gap-3">
                <span className="text-muted">Orders</span>
                <span className="font-mono text-ivory num-lining">{row.ordersCount}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-muted">Lifetime spend</span>
                <span className="font-mono text-gold font-bold num-lining">
                  {formatPKR(row.totalSpent)}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-muted">Wishlist items</span>
                <span className="font-mono text-ivory num-lining">{row.wishlistCount}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-muted">Reviews</span>
                <span className="font-mono text-ivory num-lining">{row.reviewCount}</span>
              </li>
            </ul>
            {orders.length !== row.ordersCount && (
              <p className="text-[10px] text-muted font-light pt-3 border-t border-gold/10">
                Note: the aggregates query counts orders linked to this account id
                ({row.ordersCount}); the orders feed scoped to this profile returned {orders.length}{" "}
                (matched by email or phone).
              </p>
            )}
          </Panel>
        </div>
      )}

      {/* Orders */}
      {section === "orders" && (
        <div role="tabpanel" id="panel-orders" aria-labelledby="tab-orders">
          <Panel
            title="Orders"
            subtitle="Order records returned by the admin orders feed for this client."
          >
            {orders.length === 0 ? (
              <NotAvailable
                title="No orders available"
                reason="No order records were returned for this client, so there is nothing to show here."
              />
            ) : (
              <ul className="space-y-3">
                {orders.map((o) => (
                  <li key={o.id} className={rowClass}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-gold font-bold text-sm">
                            {o.orderNumber}
                          </span>
                          <StatusBadge status={o.status} />
                          <StatusBadge status={o.paymentStatus} />
                        </div>
                        <p className="text-xs text-muted break-words">
                          {o.items.length} item{o.items.length === 1 ? "" : "s"} ·{" "}
                          {o.items.map((i) => i.name).join(", ") || "No line items returned"}
                        </p>
                        <p className="text-[10px] text-muted font-mono">
                          {toDateOnly(o.createdAt) || "Date not recorded"}
                          {" · "}
                          {o.paymentMethod || "Payment method not recorded"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                        <span className="font-mono font-bold text-ivory text-sm num-lining">
                          {formatPKR(o.total)}
                        </span>
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="text-[10px] uppercase font-bold text-gold hover:text-goldLight flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded px-1"
                        >
                          Open order
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}

      {/* Addresses */}
      {section === "addresses" && (
        <div role="tabpanel" id="panel-addresses" aria-labelledby="tab-addresses">
          <Panel
            title="Addresses used on orders"
            subtitle="Derived from the shipping address on this client's orders. HM Signature does not expose a saved address book to the admin, so these are not verified or preferred addresses."
          >
            {addresses.length === 0 ? (
              <NotAvailable
                title="Not available"
                reason={
                  orders.length === 0
                    ? "This client has no orders in the admin feed, so there are no shipping addresses to derive."
                    : "The orders linked to this client did not include a shipping address."
                }
              />
            ) : (
              <ul className="space-y-3">
                {addresses.map((a, idx) => (
                  <li key={`${a.street}-${a.city}-${idx}`} className={rowClass}>
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded bg-gold/10 border border-gold/20 text-gold shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-1 text-xs">
                        <p className="text-ivory font-medium break-words">
                          {[a.street, a.city, a.state, a.zip].filter(Boolean).join(", ")}
                        </p>
                        <p className="text-gold font-mono uppercase text-[11px]">{a.country}</p>
                        <p className="text-[10px] text-muted">
                          Last used {toDateOnly(a.lastUsed) || "date not recorded"} ·{" "}
                          {a.orderRefs.length} order
                          {a.orderRefs.length === 1 ? "" : "s"}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {a.orderRefs.map((ref) => (
                            <Link
                              key={ref.id}
                              to={`/admin/orders/${ref.id}`}
                              className="text-[10px] font-mono text-gold hover:text-goldLight border border-gold/20 rounded px-1.5 py-0.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                            >
                              {ref.orderNumber}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}

      {/* Wishlist */}
      {section === "wishlist" && (
        <div role="tabpanel" id="panel-wishlist" aria-labelledby="tab-wishlist">
          <Panel
            title="Wishlist"
            subtitle="Count from the customer aggregates query (wishlist_items joined through this client's wishlist)."
          >
            <div className="flex items-center justify-between gap-3 p-4 rounded bg-navy/60 border border-gold/10">
              <span className="text-xs text-muted flex items-center gap-2">
                <Heart className="w-4 h-4 text-gold" />
                Saved items
              </span>
              <span className="font-serif text-xl text-ivory font-bold num-lining">
                {row.wishlistCount}
              </span>
            </div>

            <NotAvailable
              title="Item-level wishlist: not available"
              reason={
                row.wishlistCount > 0
                  ? "The admin services expose the wishlist count but no query for the individual saved products, so the items themselves are not shown rather than guessed."
                  : "This client has no saved wishlist items, and no item list is available through the admin services."
              }
            />
          </Panel>
        </div>
      )}

      {/* Reviews */}
      {section === "reviews" && (
        <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews">
          <Panel
            title="Reviews"
            subtitle="Review rows returned by the admin reviews feed that match this client's email."
          >
            {reviews.length === 0 ? (
              <NotAvailable
                title={row.reviewCount > 0 ? "No review rows available" : "Not available"}
                reason={
                  row.reviewCount > 0
                    ? `The database reports ${row.reviewCount} review(s) for this account, but the reviews feed returned no matching rows (they are counted by account id, and the feed exposes email only).`
                    : "This client has not submitted any reviews."
                }
              />
            ) : (
              <ul className="space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className={rowClass}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 min-w-0">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-serif text-sm text-ivory font-bold truncate max-w-[220px]">
                            {r.productName}
                          </span>
                          <StatusBadge status={r.status} />
                        </div>
                        <p className="text-[11px] text-gold flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5" />
                          <span className="font-mono num-lining">{r.rating}</span> / 5
                        </p>
                        {r.title && <p className="text-xs text-ivory break-words">“{r.title}”</p>}
                        <p className="text-[10px] text-muted font-mono">{r.date}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenReview(r)}
                        aria-label={`Read full review for ${r.productName}`}
                        className="text-[10px] uppercase font-bold text-gold hover:text-goldLight border border-gold/20 rounded px-2.5 py-1.5 flex items-center gap-1.5 shrink-0 self-start focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                      >
                        <ScrollText className="w-3 h-3" />
                        Read
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}

      {/* Activity */}
      {section === "activity" && (
        <div role="tabpanel" id="panel-activity" aria-labelledby="tab-activity">
          <Panel
            title="Activity"
            subtitle="Merged chronological feed of order status events, payments and refunds for this client. Status-change notes and payment references are omitted here."
          >
            {activity.length === 0 ? (
              <NotAvailable
                title="Not available"
                reason="No order, payment or refund events were returned for this client."
              />
            ) : (
              <ol className="space-y-3">
                {activity.map((ev) => (
                  <li key={ev.id} className={`${rowClass} flex items-start gap-3`}>
                    <div className="p-2 rounded bg-navy border border-gold/20 text-gold shrink-0">
                      {ev.kind === "order" ? (
                        <ShoppingBag className="w-4 h-4" />
                      ) : ev.kind === "payment" ? (
                        <CreditCard className="w-4 h-4" />
                      ) : (
                        <ActivityIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-ivory">{ev.date}</span>
                        {ev.kind === "refund" ? (
                          <span className={`${REFUND_STATUS_CLASS}${refundStatusClass(ev.statusLabel)}`}>
                            {ev.statusLabel}
                          </span>
                        ) : (
                          <StatusBadge status={ev.statusLabel} />
                        )}
                      </div>
                      <p className="text-xs text-ivory font-medium mt-1 break-words">{ev.title}</p>
                      <p className="text-[10px] text-muted break-words">
                        {ev.orderNumber ? `${ev.orderNumber} · ` : ""}
                        {ev.detail || ""}
                        {ev.amount !== undefined ? (
                          <>
                            {ev.detail ? " · " : ""}
                            <span className="font-mono text-gold num-lining">
                              {formatPKR(ev.amount)}
                              {ev.currency && ev.currency !== "PKR" ? ` ${ev.currency}` : ""}
                            </span>
                          </>
                        ) : null}
                      </p>
                      {ev.orderId && (
                        <Link
                          to={`/admin/orders/${ev.orderId}`}
                          className="text-[10px] uppercase font-bold text-gold hover:text-goldLight inline-flex items-center gap-1 mt-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
                        >
                          Open order
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      )}

      <Modal
        isOpen={openReview !== null}
        onClose={() => setOpenReview(null)}
        title="Client review"
        subtitle={openReview ? `${openReview.productName} · ${openReview.date}` : undefined}
        maxWidth="md"
      >
        {openReview && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={openReview.status} />
              <span className="text-gold font-mono flex items-center gap-1">
                <Star className="w-3.5 h-3.5" />
                {openReview.rating} / 5
              </span>
            </div>
            {openReview.title && (
              <h3 className="font-serif text-base text-ivory font-bold">{openReview.title}</h3>
            )}
            <p className="text-muted font-light leading-relaxed whitespace-pre-line break-words">
              {openReview.review}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
