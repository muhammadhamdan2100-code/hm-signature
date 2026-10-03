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
const SeoPage = lazy(() => import("./pages/SeoPage").then((m) => ({ default: m.SeoPage })));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })));

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
          <Route path="homepage" element={<HomepageCmsPage />} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="abandoned-carts" element={<AbandonedCartsPage />} />
          <Route path="automations" element={<AutomationsPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="seo" element={<SeoPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
