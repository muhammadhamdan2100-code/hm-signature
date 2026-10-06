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
import {
  fetchSavedAddressesForCustomer,
  type AddressRecord,
} from "../../services/customerAddresses";
import type { Order, PaymentRecord, ReviewItem } from "../context/AdminDataContext";
import { formatPKR } from "../../utils/currency";
import { useI18n } from "../../i18n/I18nProvider";

/* ------------------------------------------------------------------ *
 * Counters (orders, spend, segment, wishlist, reviews) come from the
 * get_admin_customers RPC. Related records are pulled from the admin
 * orders / payments / refunds / reviews services and scoped to this
 * client by email or phone, which is what those services expose.
 * Staff-written order and refund notes are deliberately not rendered.
 * ------------------------------------------------------------------ */

/* Tab labels are dictionary keys, resolved with t() where the tabs render:
   t() is only available inside a component. */
const SECTIONS = [
  { key: "profile", labelKey: "admin.shared.profile", icon: User },
  { key: "orders", labelKey: "admin.nav.orders", icon: ShoppingBag },
  { key: "addresses", labelKey: "admin.customerDetail.tabAddresses", icon: MapPin },
  { key: "wishlist", labelKey: "nav.wishlist", icon: Heart },
  { key: "reviews", labelKey: "admin.nav.reviews", icon: ScrollText },
  { key: "activity", labelKey: "admin.customerDetail.tabActivity", icon: ActivityIcon },
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
  const { t } = useI18n();
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
      const [customers, allOrders, allPayments, allRefunds, allReviews, savedAddresses] = await Promise.all([
        fetchAdminCustomerAggregatesFromDB(),
        fetchAdminOrdersFromDB(),
        fetchAdminPaymentsFromDB(),
        fetchRefundsFromDB(),
        fetchAdminReviewsFromDB(),
        fetchSavedAddressesForCustomer(id || ""),
      ]);

      setSavedAddressBook(savedAddresses || []);

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
  const [savedAddressBook, setSavedAddressBook] = useState<AddressRecord[]>([]);

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
      // `entry` rather than `t` — the inner parameter would shadow the translator.
      o.timeline.forEach((entry, idx) => {
        events.push({
          id: `${o.id}-timeline-${idx}`,
          date: entry.date,
          kind: "order",
          title: t("admin.customerDetail.orderActivityTitle", { number: o.orderNumber }),
          statusLabel: entry.status,
          detail:
            o.items.length === 1
              ? t("admin.customerDetail.itemCountOne", { count: o.items.length })
              : t("admin.customerDetail.itemCountMany", { count: o.items.length }),
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
        title: t("admin.customerDetail.paymentActivityTitle", {
          method: p.method || t("admin.customerDetail.methodNotRecorded"),
        }),
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
        title: t("admin.customerDetail.refundRequested"),
        statusLabel: r.status,
        detail: r.reason || undefined,
        amount: r.amount,
        currency: r.currency,
        orderId: r.orderId,
        orderNumber: r.orderNumber,
      });
    });

    return events.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    // `t` is a dependency so the feed re-localises when the language changes.
  }, [orders, payments, refunds, t]);

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
        <Breadcrumb items={[{ label: t("admin.nav.customers"), path: "/admin/customers" }, { label: t("admin.shared.profile") }]} />
        <div
          role="alert"
          className="bg-navy2/90 border border-rose-500/30 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded bg-rose-950/50 border border-rose-500/30 text-rose-300 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-base font-bold text-ivory">{t("admin.customerDetail.clientProfileUnavailable")}</h1>
              <p className="text-xs text-muted font-light mt-0.5 break-words">{error}</p>
            </div>
          </div>
          <button type="button" onClick={() => void load()} className={`${buttonClass} shrink-0`}>
            <RefreshCw className="w-3.5 h-3.5" />
            {t("admin.customerDetail.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="space-y-4 animate-fade-in min-w-0 py-6">
        <Breadcrumb items={[{ label: t("admin.nav.customers"), path: "/admin/customers" }, { label: t("admin.customerDetail.notFound") }]} />
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-8 text-center space-y-4">
          <h1 className="font-serif text-xl text-ivory font-bold">{t("admin.customerDetail.clientProfileNotFound")}</h1>
          <p className="text-xs text-muted font-light max-w-md mx-auto">
            {t("admin.customerDetail.notFoundBody")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button type="button" onClick={() => void load()} className={buttonClass}>
              <RefreshCw className="w-3.5 h-3.5" />
              {t("admin.customerDetail.retry")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/customers")}
              className="px-4 py-2 rounded text-xs font-sans uppercase tracking-wider text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("admin.customerDetail.backToCustomers")}
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
        items={[{ label: t("admin.nav.customers"), path: "/admin/customers" }, { label: row.name }]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/admin/customers")}
            aria-label={t("admin.customerDetail.backToCustomers")}
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
              {t("admin.customerDetail.clientSince", {
                date: toDateOnly(row.joinedDate) || t("admin.customerDetail.noDateRecorded"),
              })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          aria-label={t("admin.customerDetail.reloadClientProfile")}
          className="p-2 rounded text-muted hover:text-gold hover:bg-navy2 transition-colors border border-gold/20 shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Recorded metrics (RPC-provided) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metricTile(t("admin.nav.orders"), String(row.ordersCount), t("admin.customerDetail.excludesCancelled"))}
        {metricTile(t("admin.customerDetail.lifetimeSpend"), formatPKR(row.totalSpent), t("admin.customerDetail.excludesCancelled"))}
        {metricTile(
          t("admin.customers.lastOrder"),
          row.lastOrderDate ? toDateOnly(row.lastOrderDate) : t("admin.customerDetail.noneRecorded"),
          t("admin.customerDetail.anyStatus")
        )}
        {metricTile(t("admin.customerDetail.segment"), row.segment, t("admin.customerDetail.computedByTheDatabase"))}
      </div>

      {/* Section tabs */}
      <div
        role="tablist"
        aria-label={t("admin.customerDetail.clientProfileSections")}
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
              <span>{t(tab.labelKey)}</span>
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
            <Panel title={t("admin.shared.profile")}>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-gold">
                    {t("admin.customerDetail.name")}
                  </dt>
                  <dd className="font-serif text-sm text-ivory font-bold break-words">
                    {row.name}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-gold">
                    {t("admin.customers.accountStatus")}
                  </dt>
                  <dd>
                    <StatusBadge status={toStatusLabel(row.status)} />
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-gold">
                    {t("admin.customerDetail.email")}
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
                      <span className="text-muted">{t("admin.customerDetail.noEmailOnFile")}</span>
                    )}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-gold">
                    {t("admin.customers.phone")}
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
                      <span className="text-muted">{t("admin.customerDetail.noPhoneOnFile")}</span>
                    )}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-gold">
                    {t("admin.customerDetail.joined")}
                  </dt>
                  <dd className="text-ivory font-mono flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-gold shrink-0" />
                    {toDateOnly(row.joinedDate) || t("admin.customerDetail.notRecorded")}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-gold">
                    {t("admin.customerDetail.segment")}
                  </dt>
                  <dd>
                    <StatusBadge status={row.segment} />
                  </dd>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-gold">
                    {t("admin.customerDetail.clientId")}
                  </dt>
                  <dd className="font-mono text-[11px] text-muted break-all">{row.id}</dd>
                </div>
              </dl>
            </Panel>
          </div>

          <Panel title={t("admin.customerDetail.recordedCounts")} subtitle={t("admin.customerDetail.allValuesReturnedByThe")}>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center justify-between gap-3">
                <span className="text-muted">{t("admin.nav.orders")}</span>
                <span className="font-mono text-ivory num-lining">{row.ordersCount}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-muted">{t("admin.customerDetail.lifetimeSpend")}</span>
                <span className="font-mono text-gold font-bold num-lining">
                  {formatPKR(row.totalSpent)}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-muted">{t("admin.customerDetail.wishlistItems")}</span>
                <span className="font-mono text-ivory num-lining">{row.wishlistCount}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-muted">{t("admin.nav.reviews")}</span>
                <span className="font-mono text-ivory num-lining">{row.reviewCount}</span>
              </li>
            </ul>
            {orders.length !== row.ordersCount && (
              <p className="text-[10px] text-muted font-light pt-3 border-t border-gold/10">
                {t("admin.customerDetail.orderCountMismatchNote", {
                  aggregateCount: row.ordersCount,
                  feedCount: orders.length,
                })}
              </p>
            )}
          </Panel>
        </div>
      )}

      {/* Orders */}
      {section === "orders" && (
        <div role="tabpanel" id="panel-orders" aria-labelledby="tab-orders">
          <Panel
            title={t("admin.nav.orders")}
            subtitle={t("admin.customerDetail.orderRecordsReturnedByThe")}
          >
            {orders.length === 0 ? (
              <NotAvailable
                title={t("admin.customerDetail.noOrdersAvailable")}
                reason={t("admin.customerDetail.noOrderRecordsReason")}
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
                          {o.items.length === 1
                            ? t("admin.customerDetail.itemCountOne", { count: o.items.length })
                            : t("admin.customerDetail.itemCountMany", { count: o.items.length })}
                          {" · "}
                          {o.items.map((i) => i.name).join(", ") ||
                            t("admin.customerDetail.noLineItemsReturned")}
                        </p>
                        <p className="text-[10px] text-muted font-mono">
                          {toDateOnly(o.createdAt) || t("admin.customerDetail.dateNotRecorded")}
                          {" · "}
                          {o.paymentMethod || t("admin.customerDetail.paymentMethodNotRecorded")}
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
                          {t("admin.customerDetail.openOrder")}
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
          {savedAddressBook.length > 0 && (
            <Panel
              title={t("admin.customerDetail.savedAddressBook")}
              subtitle={t("admin.customerDetail.addressesTheClientSavedTo")}
            >
              <ul className="space-y-3">
                {savedAddressBook.map((a) => (
                  <li key={a.id} className={rowClass}>
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded bg-gold/10 border border-gold/20 text-gold shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-1 text-xs">
                        <p className="text-ivory font-medium break-words">
                          {[a.label, a.isDefault ? t("account.defaultWord") : null].filter(Boolean).join(" · ")}
                        </p>
                        <p className="text-muted break-words">
                          {[a.fullName, a.phone].filter(Boolean).join(" · ") ||
                            t("admin.customerDetail.noRecipientRecorded")}
                        </p>
                        <p className="text-ivory break-words">
                          {[a.addressLine1, a.addressLine2].filter(Boolean).join(", ")}
                        </p>
                        <p className="text-gold font-mono text-[11px] uppercase">
                          {[a.city, a.state, a.postalCode, a.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel
            title={t("admin.customerDetail.addressesUsedOnOrders")}
            subtitle={t("admin.customerDetail.derivedFromTheShippingAddress")}
          >
            {addresses.length === 0 ? (
              <NotAvailable
                title={t("admin.customerDetail.notAvailable")}
                reason={
                  orders.length === 0
                    ? t("admin.customerDetail.noOrdersToDeriveAddresses")
                    : t("admin.customerDetail.ordersWithoutShippingAddress")
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
                          {t("admin.customerDetail.lastUsedOn", {
                            date:
                              toDateOnly(a.lastUsed) || t("admin.customerDetail.noDateRecorded"),
                          })}
                          {" · "}
                          {a.orderRefs.length === 1
                            ? t("admin.customerDetail.orderCountOne", { count: a.orderRefs.length })
                            : t("admin.customerDetail.orderCountMany", {
                                count: a.orderRefs.length,
                              })}
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
            title={t("admin.customerDetail.wishlist")}
            subtitle={t("admin.customerDetail.countFromTheCustomerAggregates")}
          >
            <div className="flex items-center justify-between gap-3 p-4 rounded bg-navy/60 border border-gold/10">
              <span className="text-xs text-muted flex items-center gap-2">
                <Heart className="w-4 h-4 text-gold" />
                {t("admin.customerDetail.savedItems")}
              </span>
              <span className="font-serif text-xl text-ivory font-bold num-lining">
                {row.wishlistCount}
              </span>
            </div>

            <NotAvailable
              title={t("admin.customerDetail.itemLevelWishlistNotAvailable")}
              reason={
                row.wishlistCount > 0
                  ? t("admin.customerDetail.wishlistCountOnlyBody")
                  : t("admin.customerDetail.noWishlistItemsBody")
              }
            />
          </Panel>
        </div>
      )}

      {/* Reviews */}
      {section === "reviews" && (
        <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews">
          <Panel
            title={t("admin.nav.reviews")}
            subtitle={t("admin.customerDetail.reviewRowsReturnedByThe")}
          >
            {reviews.length === 0 ? (
              <NotAvailable
                title={
                  row.reviewCount > 0
                    ? t("admin.customerDetail.noReviewRowsAvailable")
                    : t("admin.customerDetail.notAvailable")
                }
                reason={
                  row.reviewCount > 0
                    ? t("admin.customerDetail.reviewRowsFeedMismatchBody", { count: row.reviewCount })
                    : t("admin.customerDetail.noReviewsSubmitted")
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
                        aria-label={t("admin.customerDetail.readFullReviewFor", { product: r.productName })}
                        className="text-[10px] uppercase font-bold text-gold hover:text-goldLight border border-gold/20 rounded px-2.5 py-1.5 flex items-center gap-1.5 shrink-0 self-start focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                      >
                        <ScrollText className="w-3 h-3" />
                        {t("admin.customerDetail.read")}
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
            title={t("admin.customerDetail.activity")}
            subtitle={t("admin.customerDetail.mergedChronologicalFeedOfOrder")}
          >
            {activity.length === 0 ? (
              <NotAvailable
                title={t("admin.customerDetail.notAvailable")}
                reason={t("admin.customerDetail.noActivityEvents")}
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
                          {t("admin.customerDetail.openOrder")}
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
        title={t("admin.customerDetail.clientReview")}
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
