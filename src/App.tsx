import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { I18nProvider } from "./i18n/I18nProvider";
import { AdminDataProvider } from "./admin/context/AdminDataContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import WhatsAppButton from "./components/WhatsAppButton";
import ScrollToTop from "./components/ScrollToTop";
import AnalyticsBeacon from "./components/AnalyticsBeacon";
import NotFound from "./pages/NotFound";
import StructuredData from "./components/StructuredData";
import { organizationData, webSiteData } from "./lib/seo";
import { useI18n } from "./i18n/I18nProvider";
import { StaffRouteGuard, CustomerRouteGuard } from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const Collections = lazy(() => import("./pages/Collections"));
const Bestsellers = lazy(() => import("./pages/Bestsellers"));
const Men = lazy(() => import("./pages/Men"));
const Women = lazy(() => import("./pages/Women"));
const ProductPage = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const ScentFinder = lazy(() => import("./pages/ScentFinder"));
const Journal = lazy(() => import("./pages/Journal"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Account = lazy(() => import("./pages/Account"));
const Login = lazy(() => import("./pages/Login"));
const Contact = lazy(() => import("./pages/Contact"));
const Ingredients = lazy(() => import("./pages/Ingredients"));
const FAQ = lazy(() => import("./pages/FAQ"));
const ShippingDelivery = lazy(() => import("./pages/ShippingDelivery"));
const ReturnsExchanges = lazy(() => import("./pages/ReturnsExchanges"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ParentCompany = lazy(() => import("./pages/ParentCompany"));
const Boutiques = lazy(() => import("./pages/Boutiques"));
const Discover = lazy(() => import("./pages/Discover"));
const GiftFinder = lazy(() => import("./pages/GiftFinder"));
const GiftCards = lazy(() => import("./pages/GiftCards"));
const AdminApp = lazy(() => import("./admin/AdminApp"));
const AdminLogin = lazy(() =>
  import("./admin/pages/AdminLogin").then((m) => ({ default: m.AdminLogin }))
);

function RouteFallback() {
  const { t } = useI18n();
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status">
      <span className="sr-only">{t("nav.loadingPage")}</span>
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function CustomerLayout() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col bg-navy text-ivory">
      <StructuredData data={organizationData()} />
      <StructuredData data={webSiteData(t("footer.tagline"))} />
      <a href="#main-content" className="skip-link">
        {t("nav.skipToContent")}
      </a>
      <Navbar />
      <CartDrawer />
      <WhatsAppButton />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <CurrencyProvider>
          <AuthProvider>
            <AdminDataProvider>
              <CartProvider>
                <WishlistProvider>
                  <ScrollToTop />
                  <AnalyticsBeacon />
                  <Suspense fallback={<RouteFallback />}>
                    <Routes>
                      {/* Customer Login Route */}
                      <Route path="/login" element={<Login />} />

                      {/* Staff Admin Login Portal */}
                      <Route path="/admin/login" element={<AdminLogin />} />

                      {/* Protected Staff Admin Console Routes */}
                      <Route element={<StaffRouteGuard />}>
                        <Route path="/admin/*" element={<AdminApp />} />
                      </Route>

                      {/* Storefront Routes */}
                      <Route element={<CustomerLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/collections" element={<Collections />} />
                        <Route path="/bestsellers" element={<Bestsellers />} />
                        <Route path="/men" element={<Men />} />
                        <Route path="/women" element={<Women />} />
                        <Route path="/product/:slug" element={<ProductPage />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                        <Route path="/scent-finder" element={<ScentFinder />} />
                        <Route path="/journal" element={<Journal />} />
                        <Route path="/wishlist" element={<Wishlist />} />

                        {/* Protected Customer Account Routes */}
                        <Route element={<CustomerRouteGuard />}>
                          <Route path="/account" element={<Account />} />
                          <Route path="/account/orders" element={<Account />} />
                          <Route path="/account/orders/:id" element={<Account />} />
                          <Route path="/account/profile" element={<Account />} />
                          <Route path="/account/addresses" element={<Account />} />
                          <Route path="/account/rewards" element={<Account />} />
                          <Route path="/account/wishlist" element={<Account />} />
                        </Route>

                        <Route path="/contact" element={<Contact />} />
                        <Route path="/ingredients" element={<Ingredients />} />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="/shipping-delivery" element={<ShippingDelivery />} />
                        <Route path="/returns-exchanges" element={<ReturnsExchanges />} />
                        <Route path="/track-order" element={<TrackOrder />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/terms-conditions" element={<TermsConditions />} />
                        <Route path="/refund-policy" element={<RefundPolicy />} />
                        <Route path="/parent-company" element={<ParentCompany />} />
                        <Route path="/boutiques" element={<Boutiques />} />
                        <Route path="/discover" element={<Discover />} />
                        <Route path="/gift-finder" element={<GiftFinder />} />
                        <Route path="/gift-cards" element={<GiftCards />} />
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </WishlistProvider>
              </CartProvider>
            </AdminDataProvider>
          </AuthProvider>
        </CurrencyProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
