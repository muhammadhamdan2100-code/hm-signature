import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ProductsList } from "./pages/ProductsList";
import { ProductFormPage } from "./pages/ProductFormPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CollectionsPage } from "./pages/CollectionsPage";
import { OrdersList } from "./pages/OrdersList";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { CustomersList } from "./pages/CustomersList";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { InventoryPage } from "./pages/InventoryPage";
import { CouponsPage } from "./pages/CouponsPage";
import { ShippingPage } from "./pages/ShippingPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { HomepageCmsPage } from "./pages/HomepageCmsPage";
import { MarketingPage } from "./pages/MarketingPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { AbandonedCartsPage } from "./pages/AbandonedCartsPage";
import { StaffPage } from "./pages/StaffPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SeoPage } from "./pages/SeoPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";

export default function AdminApp() {
  return (
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
        <Route path="homepage" element={<HomepageCmsPage />} />
        <Route path="marketing" element={<MarketingPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="abandoned-carts" element={<AbandonedCartsPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="seo" element={<SeoPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
