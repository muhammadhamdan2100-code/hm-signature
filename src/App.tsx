import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AdminDataProvider } from "./admin/context/AdminDataContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import WhatsAppButton from "./components/WhatsAppButton";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Collections from "./pages/Collections";
import Bestsellers from "./pages/Bestsellers";
import Men from "./pages/Men";
import Women from "./pages/Women";
import ProductPage from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import ScentFinder from "./pages/ScentFinder";
import Journal from "./pages/Journal";
import Wishlist from "./pages/Wishlist";
import Account from "./pages/Account";
import Login from "./pages/Login";
import Contact from "./pages/Contact";
import Ingredients from "./pages/Ingredients";
import FAQ from "./pages/FAQ";
import ShippingDelivery from "./pages/ShippingDelivery";
import ReturnsExchanges from "./pages/ReturnsExchanges";
import TrackOrder from "./pages/TrackOrder";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import RefundPolicy from "./pages/RefundPolicy";
import ParentCompany from "./pages/ParentCompany";
import NotFound from "./pages/NotFound";
import AdminApp from "./admin/AdminApp";
import { StaffRouteGuard, CustomerRouteGuard } from "./components/ProtectedRoute";

function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-navy text-ivory">
      <Navbar />
      <CartDrawer />
      <WhatsAppButton />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminDataProvider>
          <CartProvider>
            <WishlistProvider>
              <ScrollToTop />
              <Routes>
                {/* Single Login Route */}
                <Route path="/login" element={<Login />} />

                {/* Legacy Admin Login Redirect */}
                <Route path="/admin/login" element={<Navigate to="/login?next=/admin" replace />} />

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
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </AdminDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
