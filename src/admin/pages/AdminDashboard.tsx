import React, { useEffect, useState } from "react";
import { useAdminData, campaignDisplayState, ORDER_STATUS_ORDER } from "../context/AdminDataContext";
import { useI18n } from "../../i18n/I18nProvider";
import { getCurrentStaff } from "../../services/auth";
import { toDisplayRole } from "../../types/staff";
import { StatCard } from "../components/StatCard";
import { ChartCard, type ChartPoint } from "../components/ChartCard";
import { StatusBadge, useStatusLabel } from "../components/StatusBadge";
import { formatPKR } from "../../utils/currency";
import { requestBusinessInsights } from "../../services/aiConcierge";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  PackageCheck,
  Truck,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Eye,
  Plus,
  TrendingUp,
  Layers,
  Sparkles,
  Star,
  Globe,
  Check,
  CreditCard,
  Ban,
  Boxes,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- SHARED DASHBOARD HELPERS ---------------------------------------------
// The greeting is a dictionary key, so the heading follows the interface language while the
// hour-of-day decision stays in code.
const greetingKeyFor = (date = new Date()) => {
  const h = date.getHours();
  if (h < 12) return "admin.dashboard.goodMorning";
  if (h < 17) return "admin.dashboard.goodAfternoon";
  return "admin.dashboard.goodEvening";
};

// Local calendar day, because toISOString() is UTC and would shift the "today"
// panel by five hours for a Pakistani atelier.
const localDay = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// A fragrance can be sold out in one size while the 50ml row still shows stock.
const lowestVariantStock = (p: any): number => {
  const live = (p.variants || []).filter((v: any) => v.active !== false);
  return live.length > 0
    ? Math.min(...live.map((v: any) => Number(v.stock ?? 0)))
    : Number(p.stock ?? 0);
};

// --- 1. ORDER MANAGER DEDICATED DASHBOARD ---
const OrderManagerDashboard: React.FC = () => {
  const { t } = useI18n();
  const { orders } = useAdminData();
  const navigate = useNavigate();
  const currentStaff = getCurrentStaff();

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "Pending");
  const processingOrders = orders.filter((o) => o.status === "Processing");
  const shippedOrders = orders.filter((o) => o.status === "Shipped");
  const outForDeliveryOrders = orders.filter((o) => o.status === "Out for Delivery");
  const deliveredOrders = orders.filter((o) => o.status === "Delivered");
  const cancelledOrders = orders.filter((o) => o.status === "Cancelled");
  const newOrders = orders.filter((o) => o.createdAt === "2026-09-29");

  const pendingCodPayment = orders.filter(
    (o) => o.paymentMethod === "Cash on Delivery" && o.paymentStatus === "Pending"
  );
  const pendingTidVerification = orders.filter(
    (o) => o.paymentMethod !== "Cash on Delivery" && o.paymentStatus === "Pending"
  );

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-navy2 via-navy2 to-sky-950/40 p-6 rounded-xl border border-gold/30 shadow-2xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-sky-400 font-semibold">
            {t("admin.dashboard.orderFulfilmentDispatchConcierge")}
          </span>
          <h1 className="text-2xl md:text-3xl font-serif text-ivory font-bold tracking-tight mt-1">
            {t(greetingKeyFor())}, {currentStaff?.name || t("admin.dashboard.orderManagerFallback")} — {t("admin.dashboard.orderOperations")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-1 max-w-xl">
            {t("admin.dashboard.liveOperationsWorkspace")}
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/orders")}
          className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center gap-2 shadow-lg shrink-0"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{t("admin.dashboard.viewAllOrdersCount", { count: totalOrders })}</span>
        </button>
      </div>

      {/* KPI Cards (8 Order Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("admin.dashboard.newOrdersToday")}
          value={newOrders.length}
          subtitle={t("admin.dashboard.receivedToday")}
          icon={ShoppingBag}
          accent={true}
          onClick={() => navigate("/admin/orders")}
        />
        <StatCard
          title={t("admin.dashboard.pendingReview")}
          value={pendingOrders.length}
          subtitle={t("admin.dashboard.actionRequired")}
          icon={Clock}
          onClick={() => navigate("/admin/orders?status=Pending")}
        />
        <StatCard
          title={t("admin.dashboard.inAtelierPackaging")}
          value={processingOrders.length}
          subtitle={t("admin.dashboard.processingBatch")}
          icon={PackageCheck}
          onClick={() => navigate("/admin/orders?status=Processing")}
        />
        <StatCard
          title={t("admin.dashboard.shippedInTransit")}
          value={shippedOrders.length}
          subtitle={t("admin.dashboard.courierDispatched")}
          icon={Truck}
          onClick={() => navigate("/admin/orders?status=Shipped")}
        />
        <StatCard
          title={t("admin.status.outfordelivery")}
          value={outForDeliveryOrders.length}
          subtitle={t("admin.dashboard.destinationTransit")}
          icon={Truck}
        />
        <StatCard
          title={t("admin.dashboard.deliveredOrders")}
          value={deliveredOrders.length}
          subtitle={t("admin.dashboard.completedAcquisitions")}
          icon={Check}
        />
        <StatCard
          title={t("admin.dashboard.cancelledOrders")}
          value={cancelledOrders.length}
          subtitle={t("admin.dashboard.voidedRequests")}
          icon={Ban}
        />
        <StatCard
          title={t("admin.dashboard.totalLifetimeOrders")}
          value={totalOrders}
          subtitle={t("admin.dashboard.repositoryTotal")}
          icon={Boxes}
          onClick={() => navigate("/admin/orders")}
        />
      </div>

      {/* Main Order Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-navy2/90 border border-gold/20 rounded-lg p-6 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-gold/15 pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
                {t("admin.dashboard.recentOrdersRequiringFulfilment")}
              </h3>
              <p className="text-xs text-muted font-light">
                {t("admin.dashboard.monitorStatusTransitions")}
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/orders")}
              className="text-xs font-sans text-gold hover:text-goldLight flex items-center gap-1 uppercase tracking-wider font-semibold"
            >
              <span>{t("admin.dashboard.manageAll")}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs font-sans">
              <thead className="bg-navy text-gold uppercase tracking-widest text-[10px] border-b border-gold/15">
                <tr>
                  <th className="py-2.5 px-3">{t("admin.dashboard.orderNumber")}</th>
                  <th className="py-2.5 px-3">{t("admin.dashboard.client")}</th>
                  <th className="py-2.5 px-3">{t("admin.dashboard.payment")}</th>
                  <th className="py-2.5 px-3">{t("admin.shared.status")}</th>
                  <th className="py-2.5 px-3">{t("admin.dashboard.trackingId")}</th>
                  <th className="py-2.5 px-3 text-end">{t("admin.orders.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 text-ivory">
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id} className="hover:bg-navy/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-gold font-semibold num-lining">
                      {o.orderNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-[10px] text-muted font-mono">{o.customerEmail}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] font-mono text-ivory block">{o.paymentMethod}</span>
                      <span className="text-[10px] text-gold font-mono uppercase">{o.paymentStatus}</span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-muted num-lining">
                      {o.trackingNumber || t("admin.dashboard.notAssigned")}
                    </td>
                    <td className="py-3 px-3 text-end">
                      <button
                        onClick={() => navigate(`/admin/orders/${o.id}`)}
                        className="px-3 py-1 bg-navy border border-gold/30 hover:border-gold text-gold hover:text-ivory rounded text-[11px] font-sans transition-colors"
                      >
                        {t("admin.dashboard.fulfilArrow")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Payment & Audit Actions */}
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-5 shadow-xl backdrop-blur-md">
          <div className="border-b border-gold/15 pb-3">
            <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
              {t("admin.dashboard.paymentAuditVerification")}
            </h3>
            <p className="text-xs text-muted font-light mt-0.5">
              {t("admin.dashboard.reviewJazzcashRaastReferences")}
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-navy/80 border border-gold/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-ivory block">{t("admin.dashboard.digitalProofAudit")}</span>
                  <span className="text-[10px] text-muted font-mono">{t("admin.dashboard.paymentsPendingVerification", { count: pendingTidVerification.length })}</span>
                </div>
              </div>
              <button
                onClick={() => navigate("/admin/payments")}
                className="text-[11px] font-mono text-gold hover:underline"
              >
                {t("admin.dashboard.auditArrow")}
              </button>
            </div>

            <div className="p-3.5 bg-navy/80 border border-gold/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-ivory block">{t("admin.dashboard.codCollectionReview")}</span>
                  <span className="text-[10px] text-muted font-mono">{t("admin.dashboard.codOrdersPendingCollection", { count: pendingCodPayment.length })}</span>
                </div>
              </div>
              <button
                onClick={() => navigate("/admin/payments")}
                className="text-[11px] font-mono text-gold hover:underline"
              >
                {t("admin.dashboard.reviewArrow")}
              </button>
            </div>
          </div>

          <div className="p-4 rounded bg-navy/60 border border-gold/15 text-xs text-muted leading-relaxed">
            <span className="text-gold font-bold uppercase tracking-wider block mb-1 font-serif">
              {t("admin.dashboard.courierDispatchReminder")}
            </span>
            {t("admin.dashboard.courierDispatchReminderNote")}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. CONTENT MANAGER DEDICATED DASHBOARD ---
const ContentManagerDashboard: React.FC = () => {
  const { t } = useI18n();
  const { products, categories, collections, reviews, homepageConfig, campaigns } = useAdminData();
  const navigate = useNavigate();
  const currentStaff = getCurrentStaff();

  const activeProducts = products.filter((p) => p.active);
  const pendingReviews = reviews.filter((r) => r.status === "Pending");
  const activeCampaigns = campaigns.filter((c) => campaignDisplayState(c).live);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-navy2 via-navy2 to-emerald-950/40 p-6 rounded-xl border border-gold/30 shadow-2xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-emerald-400 font-semibold">
            {t("admin.dashboard.cmsCatalogContentWorkspace")}
          </span>
          <h1 className="text-2xl md:text-3xl font-serif text-ivory font-bold tracking-tight mt-1">
            {t(greetingKeyFor())}, {currentStaff?.name || t("admin.dashboard.contentManagerFallback")} — {t("admin.dashboard.contentOperations")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-1 max-w-xl">
            {t("admin.dashboard.curateRareExtraitsIntro")}
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/products/new")}
          className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center gap-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("admin.dashboard.addNewFragrance")}</span>
        </button>
      </div>

      {/* KPI Cards (Content Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("admin.dashboard.publishedFragrances")}
          value={activeProducts.length}
          subtitle={t("admin.dashboard.activeExtraits")}
          icon={Package}
          accent={true}
          onClick={() => navigate("/admin/products")}
        />
        <StatCard
          title={t("admin.dashboard.fragranceCategories")}
          value={categories.length}
          subtitle={t("admin.dashboard.olfactoryFamilies")}
          icon={Layers}
          onClick={() => navigate("/admin/categories")}
        />
        <StatCard
          title={t("admin.dashboard.curatedCollections")}
          value={collections.length}
          subtitle={t("admin.dashboard.specialEditions")}
          icon={Sparkles}
          onClick={() => navigate("/admin/collections")}
        />
        <StatCard
          title={t("admin.dashboard.pendingReviews")}
          value={pendingReviews.length}
          subtitle={t("admin.dashboard.moderationQueue")}
          icon={Star}
          onClick={() => navigate("/admin/reviews")}
        />
        <StatCard
          title={t("admin.dashboard.homepageSections")}
          value={homepageConfig.sections.length}
          subtitle={t("admin.dashboard.cmsLayoutBlocks")}
          icon={Globe}
          onClick={() => navigate("/admin/homepage")}
        />
        <StatCard
          title={t("admin.dashboard.activeCampaigns")}
          value={activeCampaigns.length}
          subtitle={t("admin.dashboard.bannersAndSales")}
          icon={TrendingUp}
          onClick={() => navigate("/admin/marketing")}
        />
        <StatCard
          title={t("admin.dashboard.totalClientReviews")}
          value={reviews.length}
          subtitle={t("admin.dashboard.feedbackTotal")}
          icon={Star}
          onClick={() => navigate("/admin/reviews")}
        />
        <StatCard
          title={t("admin.dashboard.totalCatalogSkus")}
          value={products.length}
          subtitle={t("admin.dashboard.repositoryTotal")}
          icon={Package}
          onClick={() => navigate("/admin/products")}
        />
      </div>

      {/* Content Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fragrance Catalog Overview Table */}
        <div className="lg:col-span-2 bg-navy2/90 border border-gold/20 rounded-lg p-6 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-gold/15 pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
                {t("admin.dashboard.fragranceExtraitsCatalog")}
              </h3>
              <p className="text-xs text-muted font-light">
                {t("admin.dashboard.editDescriptionsNotePyramids")}
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/products")}
              className="text-xs font-sans text-gold hover:text-goldLight flex items-center gap-1 uppercase tracking-wider font-semibold"
            >
              <span>{t("admin.dashboard.viewAll")}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs font-sans">
              <thead className="bg-navy text-gold uppercase tracking-widest text-[10px] border-b border-gold/15">
                <tr>
                  <th className="py-2.5 px-3">{t("admin.products.fragrance")}</th>
                  <th className="py-2.5 px-3">{t("admin.inventory.sku")}</th>
                  <th className="py-2.5 px-3">{t("admin.dashboard.category")}</th>
                  <th className="py-2.5 px-3">{t("admin.products.price")}</th>
                  <th className="py-2.5 px-3 text-end">{t("admin.orders.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 text-ivory">
                {products.slice(0, 6).map((p) => (
                  <tr key={p.id} className="hover:bg-navy/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-serif font-bold text-sm text-ivory">{p.name}</div>
                      <div className="text-[10px] text-muted font-mono">{p.concentration}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-gold num-lining">{p.sku}</td>
                    <td className="py-3 px-3">{p.category}</td>
                    <td className="py-3 px-3 font-mono num-lining">{formatPKR(p.price)}</td>
                    <td className="py-3 px-3 text-end">
                      <button
                        onClick={() => navigate(`/admin/products/${p.id}`)}
                        className="px-3 py-1 bg-navy border border-gold/30 hover:border-gold text-gold hover:text-ivory rounded text-[11px] font-sans transition-colors"
                      >
                        {t("admin.dashboard.editCmsArrow")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Reviews Moderation Widget */}
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl backdrop-blur-md">
          <div className="border-b border-gold/15 pb-3">
            <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
              {t("admin.dashboard.reviewsModerationQueue")}
            </h3>
            <p className="text-xs text-muted font-light">{t("admin.dashboard.approveOrRejectTestimonials")}</p>
          </div>

          <div className="space-y-3">
            {pendingReviews.length > 0 ? (
              pendingReviews.map((r) => (
                <div key={r.id} className="p-3 rounded bg-navy/60 border border-gold/15 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ivory">{r.customerName}</span>
                    <span className="text-gold flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-gold text-gold" /> {r.rating}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted italic line-clamp-2">&quot;{r.review}&quot;</p>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => navigate("/admin/reviews")}
                      className="text-[10px] font-mono text-gold hover:underline"
                    >
                      {t("admin.dashboard.moderateArrow")}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted text-xs font-sans">
                {t("admin.dashboard.noPendingReviewsToModerate")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Revenue trend drawn from the server aggregation — never a decorative placeholder.
function useSalesTrendPoints(): { points: ChartPoint[]; orders: ChartPoint[] } {
  const { analytics, refreshAnalytics } = useAdminData();

  useEffect(() => {
    if (!analytics) refreshAnalytics(90);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = analytics?.salesTrend || [];
  return {
    points: rows.map((r) => ({ label: r.day.slice(5), value: r.revenue })),
    orders: rows.map((r) => ({ label: r.day.slice(5), value: r.orders })),
  };
}

// AI business insights — generated from the same aggregated snapshot the
// charts use. No individual customer records are sent, and the panel states
// plainly when no provider is configured.
const AiInsightsCard: React.FC = () => {
  const { t } = useI18n();
  const [state, setState] = useState<{
    loading: boolean;
    text: string | null;
    error: string | null;
    at: string | null;
  }>({
    loading: false,
    text: null,
    error: null,
    at: null,
  });

  const generate = async () => {
    setState({ loading: true, text: null, error: null, at: null });
    const res = await requestBusinessInsights();
    if (!res.ok) {
      setState({ loading: false, text: null, error: res.error || (res.configured ? t("admin.dashboard.insightsUnavailable") : t("admin.dashboard.noAiProviderConfigured")), at: null });
      return;
    }
    setState({ loading: false, text: res.insight, error: null, at: res.generatedAt || null });
  };

  return (
    <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold/15 pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[2.5px] text-gold font-semibold">
            {t("admin.dashboard.aiBusinessIntelligence")}
          </span>
          <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
            {t("admin.dashboard.observationsFromYourMetrics")}
          </h3>
        </div>
        <button
          onClick={generate}
          disabled={state.loading}
          className="px-4 py-2 bg-navy border border-gold/40 hover:bg-gold hover:text-navy text-gold rounded text-xs uppercase font-bold tracking-wider disabled:opacity-50 transition-colors"
        >
          {state.loading ? t("admin.dashboard.analysing") : t("admin.dashboard.generateInsights")}
        </button>
      </div>

      {state.error && (
        <p className="text-xs text-rose-300 font-mono" role="status">
          {state.error}
        </p>
      )}

      {state.text ? (
        <div className="space-y-2">
          <ul className="space-y-2 text-xs text-ivory font-light leading-relaxed list-disc list-inside">
            {state.text.split("\n").map((line, i) => (
              <li key={i}>{line.replace(/^[-*•]\s*/, "")}</li>
            ))}
          </ul>
          <p className="text-[10px] text-muted font-mono">
            {t("admin.dashboard.generatedInsightsFooter", { at: state.at ? new Date(state.at).toLocaleString() : "—" })}
          </p>
        </div>
      ) : (
        !state.error && (
          <p className="text-xs text-muted font-light">
            {t("admin.dashboard.produceShortWrittenReading")}
          </p>
        )
      )}
    </div>
  );
};

// --- 3. STORE MANAGER DASHBOARD ---
const ManagerDashboard: React.FC = () => {
  const { t } = useI18n();
  const { products, orders, customers } = useAdminData();
  const trend = useSalesTrendPoints();
  const navigate = useNavigate();
  const currentStaff = getCurrentStaff();

  const totalRevenue = orders.filter((o) => o.status !== "Cancelled").reduce((acc, o) => acc + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "Pending");
  const lowStockProducts = products.filter((p) => lowestVariantStock(p) <= (p.lowStockThreshold ?? 10));

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-navy2 via-navy2 to-amber-950/40 p-6 rounded-xl border border-gold/30 shadow-2xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-amber-400 font-semibold">
            {t("admin.dashboard.storeManagementWorkspace")}
          </span>
          <h1 className="text-2xl md:text-3xl font-serif text-ivory font-bold tracking-tight mt-1">
            {t(greetingKeyFor())}, {currentStaff?.name || t("admin.dashboard.storeManagerFallback")} — {t("admin.dashboard.boutiqueOverview")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-1 max-w-xl">
            {t("admin.dashboard.storeOperationsOverview")}
          </p>
        </div>
      </div>

      {/* KPI Cards (Manager Scope) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title={t("admin.dashboard.totalRevenue")}
          value={formatPKR(totalRevenue)}
          icon={DollarSign}
          accent={true}
          onClick={() => navigate("/admin/analytics")}
        />
        <StatCard
          title={t("admin.dashboard.totalOrders")}
          value={orders.length}
          icon={ShoppingBag}
          onClick={() => navigate("/admin/orders")}
        />
        <StatCard
          title={t("admin.dashboard.pendingOrders")}
          value={pendingOrders.length}
          subtitle={t("admin.dashboard.actionRequired")}
          icon={Clock}
          onClick={() => navigate("/admin/orders?status=Pending")}
        />
        <StatCard
          title={t("admin.dashboard.activeFragrances")}
          value={products.length}
          subtitle={t("admin.dashboard.catalogSkus")}
          icon={Package}
          onClick={() => navigate("/admin/products")}
        />
        <StatCard
          title={t("admin.customers.totalClients")}
          value={customers.length}
          subtitle={t("admin.dashboard.vipAndClientProfiles")}
          icon={Users}
          onClick={() => navigate("/admin/customers")}
        />
        <StatCard
          title={t("admin.dashboard.lowStockWarnings")}
          value={lowStockProducts.length}
          subtitle={t("admin.dashboard.restockRequired")}
          icon={AlertTriangle}
          onClick={() => navigate("/admin/inventory")}
        />
      </div>

      {/* Main Charts & Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title={t("admin.dashboard.revenueTrend")}
            subtitle={t("admin.dashboard.dailyOrderValueLastDays")}
            variant="line"
            points={trend.points}
            secondary={trend.orders}
            formatter={formatPKR}
            secondaryFormatter={(n) => t("admin.dashboard.nOrders", { count: n })}
            primaryLabel={t("admin.dashboard.revenue")}
            secondaryLabel={t("admin.dashboard.orders")}
            axisLabel={t("admin.dashboard.day")}
            caption={t("admin.dashboard.computedFromStoredOrders")}
            emptyMessage={t("admin.dashboard.noOrderValueInWindow")}
          />
        </div>

        {/* Low Stock Alerts Widget */}
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl backdrop-blur-md">
          <div className="border-b border-gold/15 pb-3">
            <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
              {t("admin.dashboard.lowStockRestockAlerts")}
            </h3>
            <p className="text-xs text-muted font-light">{t("admin.dashboard.inventoryThresholdsReplenishment")}</p>
          </div>

          <div className="space-y-3">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="p-3 rounded bg-navy/60 border border-gold/15 flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-bold text-sm text-ivory">{p.name}</h4>
                  <p className="text-[10px] font-mono text-gold">{t("admin.dashboard.stockBottlesMin", { count: p.stock, min: p.lowStockThreshold ?? "" })}</p>
                </div>
                <button
                  onClick={() => navigate("/admin/inventory")}
                  className="px-2.5 py-1 bg-navy border border-gold/30 text-gold rounded text-[10px] font-mono"
                >
                  {t("admin.dashboard.restockArrow")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 4. PRIMARY / SUPER ADMIN FULL EXECUTIVE DASHBOARD ---
const FullAdminDashboard: React.FC = () => {
  const { t } = useI18n();
  const statusLabel = useStatusLabel();
  const { products, orders, customers, analytics } = useAdminData();
  const trend = useSalesTrendPoints();
  const navigate = useNavigate();

  const today = localDay();
  // Cancelled orders are excluded from every revenue figure on this page, so today's
  // revenue follows the same rule as total revenue. Order counts still show what was
  // received, with the cancelled share called out rather than silently priced in.
  const totalRevenue = orders.filter((o) => o.status !== "Cancelled").reduce((acc, o) => acc + o.total, 0);
  const todaysOrders = orders.filter((o) => o.createdAt === today);
  const todaysLiveOrders = todaysOrders.filter((o) => o.status !== "Cancelled");
  const todaysRevenue = todaysLiveOrders.reduce((acc, o) => acc + o.total, 0);

  const pendingOrders = orders.filter((o) => o.status === "Pending");
  const processingOrders = orders.filter((o) => o.status === "Processing");
  const deliveredOrders = orders.filter((o) => o.status === "Delivered");

  const activeProducts = products.filter((p) => p.active);
  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold);

  const totalOrdersCount = orders.length;
  const deliveredOrdersCount = deliveredOrders.length;
  const deliveredRatePct =
    totalOrdersCount > 0 ? ((deliveredOrdersCount / totalOrdersCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Top Executive Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-navy2 via-navy2 to-burgundy/40 p-6 rounded-xl border border-gold/30 shadow-2xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            {t("admin.dashboard.primaryAtelierExecutiveOverview")}
          </span>
          <h1 className="text-2xl md:text-3xl font-serif text-ivory font-bold tracking-tight mt-1">
            {t(greetingKeyFor())} — {t("admin.dashboard.brandOverview")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-1 max-w-xl">
            {t("admin.dashboard.realtimeTelemetryIntro")}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/admin/products/new")}
            className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>{t("admin.dashboard.addFragrance")}</span>
          </button>
          <button
            onClick={() => navigate("/admin/orders")}
            className="px-4 py-2.5 bg-navy border border-gold/30 hover:border-gold text-ivory rounded text-xs font-sans tracking-wider uppercase transition-colors"
          >
            {t("admin.dashboard.manageOrders")}
          </button>
        </div>
      </div>

      {/* Grid of Key Performance Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title={t("admin.dashboard.totalRevenue")}
          value={formatPKR(totalRevenue)}
          icon={DollarSign}
          accent={true}
          onClick={() => navigate("/admin/analytics")}
        />
        <StatCard
          title={t("admin.dashboard.todaysRevenue")}
          value={formatPKR(todaysRevenue)}
          subtitle={
            todaysOrders.length - todaysLiveOrders.length > 0
              ? t("admin.dashboard.ordersTodayWithCancelled", {
                  live: todaysLiveOrders.length,
                  total: todaysOrders.length,
                  cancelled: todaysOrders.length - todaysLiveOrders.length,
                })
              : t("admin.dashboard.ordersToday", {
                  live: todaysLiveOrders.length,
                  total: todaysOrders.length,
                })
          }
          icon={TrendingUp}
        />
        <StatCard
          title={t("admin.dashboard.totalOrders")}
          value={orders.length}
          icon={ShoppingBag}
          onClick={() => navigate("/admin/orders")}
        />
        <StatCard
          title={t("admin.dashboard.pendingOrders")}
          value={pendingOrders.length}
          subtitle={t("admin.dashboard.requiresAtelierReview")}
          icon={Clock}
          onClick={() => navigate("/admin/orders?status=Pending")}
        />
        <StatCard
          title={t("admin.dashboard.processingOrders")}
          value={processingOrders.length}
          subtitle={t("admin.dashboard.inBottlePackaging")}
          icon={PackageCheck}
        />
        <StatCard
          title={t("admin.dashboard.deliveredOrders")}
          value={deliveredOrders.length}
          subtitle={t("admin.dashboard.completedDeliveries")}
          icon={Truck}
        />
        <StatCard
          title={t("admin.customers.totalClients")}
          value={customers.length}
          subtitle={t("admin.dashboard.registeredProfiles")}
          icon={Users}
          onClick={() => navigate("/admin/customers")}
        />
        <StatCard
          title={t("admin.dashboard.totalFragrances")}
          value={activeProducts.length}
          subtitle={t("admin.dashboard.activeCatalogSkus")}
          icon={Package}
          onClick={() => navigate("/admin/products")}
        />
        <StatCard
          title={t("admin.dashboard.lowStockWarning")}
          value={lowStockProducts.length}
          subtitle={t("admin.dashboard.atelierRestockAlert")}
          icon={AlertTriangle}
          onClick={() => navigate("/admin/inventory")}
        />
        <StatCard
          title={t("admin.dashboard.deliveredRate")}
          value={`${deliveredRatePct}%`}
          subtitle={t("admin.dashboard.deliveredOfTotalOrders", {
            delivered: deliveredOrdersCount,
            total: totalOrdersCount,
          })}
          icon={PackageCheck}
        />
      </div>

      <AiInsightsCard />

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title={t("admin.dashboard.revenueTrend")}
            subtitle={t("admin.dashboard.dailyOrderValueLastDays")}
            variant="line"
            points={trend.points}
            secondary={trend.orders}
            formatter={formatPKR}
            secondaryFormatter={(n) => t("admin.dashboard.nOrders", { count: n })}
            primaryLabel={t("admin.dashboard.revenue")}
            secondaryLabel={t("admin.dashboard.orders")}
            axisLabel={t("admin.dashboard.day")}
            caption={t("admin.dashboard.computedFromStoredOrders")}
            emptyMessage={t("admin.dashboard.noOrderValueInWindow")}
          />
        </div>

        {/* Orders Status Distribution */}
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-5 shadow-xl backdrop-blur-md">
          <div className="border-b border-gold/15 pb-3">
            <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
              {t("admin.dashboard.orderPipelineDistribution")}
            </h3>
            <p className="text-xs text-muted font-light mt-0.5">
              {t("admin.dashboard.liveStatusRatiosComputed")}
            </p>
          </div>

          <div className="space-y-4">
            {(() => {
              // Every status the store actually has is shown. Listing four fixed
              // buckets used to hide Confirmed and Cancelled orders entirely, so the
              // chart could read 0% everywhere while two orders existed.
              const TONE: Record<string, string> = {
                Pending: "bg-sky-400",
                Confirmed: "bg-gold",
                Processing: "bg-amber-400",
                Shipped: "bg-indigo-400",
"Out for Delivery": "bg-goldLight",
                Delivered: "bg-emerald-400",
                Cancelled: "bg-rose-400",
                Returned: "bg-rose-300",
              };
              const pipeline = ORDER_STATUS_ORDER.map((label) => ({
                label,
                count: orders.filter((o) => o.status === label).length,
                color: TONE[label] || "bg-gold",
              })).filter((item) => item.count > 0);

              if (pipeline.length === 0) {
                return (
                  <p className="text-xs text-muted font-sans">
                    {t("admin.dashboard.noOrdersToDistribute")}
                  </p>
                );
              }

              return pipeline.map((item) => {
                const pct = totalOrdersCount > 0 ? Math.round((item.count / totalOrdersCount) * 100) : 0;

                return (
                  <div key={item.label} className="space-y-1.5 font-sans">
                    <div className="flex justify-between text-xs">
                      <span className="text-ivory font-medium">{statusLabel(item.label)}</span>
                      <span className="text-gold font-mono num-lining">
                        {t("admin.dashboard.statusOrdersPercent", { count: item.count, percent: pct })}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-navy rounded-full overflow-hidden border border-gold/10">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full ${item.color} transition-all duration-500`}
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          <div className="p-4 rounded bg-navy/60 border border-gold/15 text-xs text-muted leading-relaxed">
            <span className="text-gold font-bold uppercase tracking-wider block mb-1 font-serif">
              {t("admin.dashboard.atelierPipelineTelemetry")}
            </span>
            {t("admin.dashboard.pipelineTelemetryNote", {
              pending: pendingOrders.length,
              delivered: deliveredOrdersCount,
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Selling Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-navy2/90 border border-gold/20 rounded-lg p-6 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-gold/15 pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
                {t("admin.dashboard.recentClientOrders")}
              </h3>
              <p className="text-xs text-muted font-light">
                {t("admin.dashboard.latestTransactionsRequiringDispatch")}
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/orders")}
              className="text-xs font-sans text-gold hover:text-goldLight flex items-center gap-1 uppercase tracking-wider font-semibold"
            >
              <span>{t("admin.dashboard.viewAll")}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs font-sans">
              <thead className="bg-navy text-gold uppercase tracking-widest text-[10px] border-b border-gold/15">
                <tr>
                  <th className="py-2.5 px-3">{t("admin.orders.orderId")}</th>
                  <th className="py-2.5 px-3">{t("admin.dashboard.client")}</th>
                  <th className="py-2.5 px-3">{t("common.total")}</th>
                  <th className="py-2.5 px-3">{t("admin.shared.status")}</th>
                  <th className="py-2.5 px-3">{t("admin.orders.date")}</th>
                  <th className="py-2.5 px-3 text-end">{t("admin.orders.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 text-ivory">
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="hover:bg-navy/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-gold font-semibold num-lining">
                      {o.orderNumber}
                    </td>
                    <td className="py-3 px-3">{o.customerName}</td>
                    <td className="py-3 px-3 font-mono num-lining font-medium">
                      {formatPKR(o.total)}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3 px-3 text-muted num-lining">{o.createdAt}</td>
                    <td className="py-3 px-3 text-end">
                      <button
                        onClick={() => navigate(`/admin/orders/${o.id}`)}
                        className="p-1 rounded text-gold hover:text-ivory hover:bg-navy transition-colors"
                        title={t("admin.dashboard.viewOrderDetails")}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 shadow-xl space-y-4 backdrop-blur-md">
          <div className="border-b border-gold/15 pb-3">
            <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
              {t("admin.dashboard.topPerfumes")}
            </h3>
            <p className="text-xs text-muted font-light">
              {analytics?.topProducts?.length
                ? t("admin.dashboard.highestRevenueLastDays", { days: analytics.windowDays })
                : t("admin.dashboard.rankedOnceFirstOrdersLand")}
            </p>
          </div>

          <div className="space-y-3">
            {(analytics?.topProducts || []).slice(0, 4).map((tp, idx) => {
              const match = products.find((p) => p.name === tp.name);
              // English only adds an "s" here; the other five languages need their own
              // singular forms, so every count combination carries its own key.
              const unitsAcrossOrdersKey =
                tp.units === 1
                  ? tp.orders === 1
                    ? "admin.dashboard.unitAcrossOrder"
                    : "admin.dashboard.unitAcrossOrders"
                  : tp.orders === 1
                  ? "admin.dashboard.unitsAcrossOrder"
                  : "admin.dashboard.unitsAcrossOrders";
              return (
              <div
                key={tp.name}
                onClick={() => match && navigate(`/admin/products/${match.id}`)}
                className="flex items-center justify-between p-3 rounded bg-navy/60 border border-gold/10 hover:border-gold/30 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-navy border border-gold/20 flex items-center justify-center shrink-0">
                    <span className="font-sans text-gold font-bold text-sm num-lining">
                      #{idx + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-ivory">
                      {tp.name}
                    </h4>
                    <p className="text-[10px] font-mono text-muted num-lining">
                      {t(unitsAcrossOrdersKey, { units: tp.units, orders: tp.orders })}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-gold font-semibold num-lining">
                  {formatPKR(Math.round(tp.revenue))}
                </span>
              </div>
              );
            })}
            {(analytics?.topProducts || []).length === 0 && (
              <p className="text-xs text-muted font-light py-4 text-center">
                {t("admin.dashboard.noSalesInAnalyticsWindow")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- DYNAMIC ROLE DASHBOARD SELECTOR ---
export const AdminDashboard: React.FC = () => {
  const currentStaff = getCurrentStaff();
  const displayRole = currentStaff ? toDisplayRole(currentStaff.role) : "Super Admin";

  if (displayRole === "Order Manager") {
    return <OrderManagerDashboard />;
  }

  if (displayRole === "Content Manager") {
    return <ContentManagerDashboard />;
  }

  if (displayRole === "Manager") {
    return <ManagerDashboard />;
  }

  return <FullAdminDashboard />;
};
