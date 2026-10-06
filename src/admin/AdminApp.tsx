import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { AdminLogin } from "./pages/AdminLogin";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const ProductsList = lazy(() => import("./pages/ProductsList").then((m) => ({ default: m.ProductsList })));
const ProductFormPage = lazy(() => import("./pages/ProductFormPage").then((m) => ({ default: m.ProductFormPage })));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage").then((m) => ({ default: m.CategoriesPage })));
const CollectionsPage = lazy(() => import("./pages/CollectionsPage").then((m) => ({ default: m.CollectionsPage })));
const OrdersList = lazy(() => import("./pages/OrdersList").then((m) => ({ default: m.OrdersList })));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage").then((m) => ({ default: m.OrderDetailPage })));
const CustomersList = lazy(() => import("./pages/CustomersList").then((m) => ({ default: m.CustomersList })));
const CustomerDetailPage = lazy(() => import("./pages/CustomerDetailPage").then((m) => ({ default: m.CustomerDetailPage })));
const InventoryPage = lazy(() => import("./pages/InventoryPage").then((m) => ({ default: m.InventoryPage })));
const CouponsPage = lazy(() => import("./pages/CouponsPage").then((m) => ({ default: m.CouponsPage })));
const ShippingPage = lazy(() => import("./pages/ShippingPage").then((m) => ({ default: m.ShippingPage })));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage").then((m) => ({ default: m.ReviewsPage })));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage").then((m) => ({ default: m.PaymentsPage })));
const RefundsPage = lazy(() => import("./pages/RefundsPage").then((m) => ({ default: m.RefundsPage })));
const ReconciliationPage = lazy(() => import("./pages/ReconciliationPage").then((m) => ({ default: m.ReconciliationPage })));
const HomepageCmsPage = lazy(() => import("./pages/HomepageCmsPage").then((m) => ({ default: m.HomepageCmsPage })));
const MarketingPage = lazy(() => import("./pages/MarketingPage").then((m) => ({ default: m.MarketingPage })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const AbandonedCartsPage = lazy(() => import("./pages/AbandonedCartsPage").then((m) => ({ default: m.AbandonedCartsPage })));
const AutomationsPage = lazy(() => import("./pages/AutomationsPage").then((m) => ({ default: m.AutomationsPage })));
const StaffPage = lazy(() => import("./pages/StaffPage").then((m) => ({ default: m.StaffPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const InternationalPage = lazy(() => import("./pages/InternationalPage").then((m) => ({ default: m.InternationalPage })));
const LocalizationPage = lazy(() => import("./pages/LocalizationPage").then((m) => ({ default: m.LocalizationPage })));
const PaymentMethodsPage = lazy(() => import("./pages/PaymentMethodsPage").then((m) => ({ default: m.PaymentMethodsPage })));
const BoutiquesPage = lazy(() => import("./pages/BoutiquesPage").then((m) => ({ default: m.BoutiquesPage })));
const BrandExperiencePage = lazy(() => import("./pages/BrandExperiencePage").then((m) => ({ default: m.BrandExperiencePage })));
const DiscoveryTagsPage = lazy(() => import("./pages/DiscoveryTagsPage").then((m) => ({ default: m.DiscoveryTagsPage })));
const RewardsAdminPage = lazy(() => import("./pages/RewardsAdminPage").then((m) => ({ default: m.RewardsAdminPage })));
const GiftCardsAdminPage = lazy(() => import("./pages/GiftCardsAdminPage").then((m) => ({ default: m.GiftCardsAdminPage })));
const PreOrdersPage = lazy(() => import("./pages/PreOrdersPage").then((m) => ({ default: m.PreOrdersPage })));
const WaitlistsPage = lazy(() => import("./pages/WaitlistsPage").then((m) => ({ default: m.WaitlistsPage })));
const SeoPage = lazy(() => import("./pages/SeoPage").then((m) => ({ default: m.SeoPage })));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })));
const IntelligencePage = lazy(() => import("./pages/IntelligencePage").then((m) => ({ default: m.IntelligencePage })));
const ForecastingPage = lazy(() => import("./pages/ForecastingPage").then((m) => ({ default: m.ForecastingPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((m) => ({ default: m.ReportsPage })));

function WorkspaceFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]" role="status">
      <span className="sr-only">Loading workspace…</span>
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AdminApp() {
  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id" element={<ProductFormPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="customers" element={<CustomersList />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="shipping" element={<ShippingPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="payments/refunds" element={<RefundsPage />} />
          <Route path="payments/reconciliation" element={<ReconciliationPage />} />
          <Route path="payments/methods" element={<PaymentMethodsPage />} />
          <Route path="homepage" element={<HomepageCmsPage />} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="abandoned-carts" element={<AbandonedCartsPage />} />
          <Route path="automations" element={<AutomationsPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="international" element={<InternationalPage />} />
          <Route path="localization" element={<LocalizationPage />} />
          <Route path="boutiques" element={<BoutiquesPage />} />
          <Route path="brand" element={<BrandExperiencePage />} />
          <Route path="discovery" element={<DiscoveryTagsPage />} />
          <Route path="rewards" element={<RewardsAdminPage />} />
          <Route path="gift-cards" element={<GiftCardsAdminPage />} />
          <Route path="preorders" element={<PreOrdersPage />} />
          <Route path="waitlists" element={<WaitlistsPage />} />
          <Route path="seo" element={<SeoPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          {/* Phase 9. The three report windows share ReportsPage; each address is
              gated by its own permission so a role lands only in what it may read. */}
          <Route path="intelligence" element={<IntelligencePage />} />
          <Route path="forecasting" element={<ForecastingPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/operations" element={<ReportsPage initialSection="payments" />} />
          <Route path="reports/product-performance" element={<ReportsPage initialSection="products" />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
