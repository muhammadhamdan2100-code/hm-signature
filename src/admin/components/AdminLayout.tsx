import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import { resolveRequiredPermission } from "../../types/staff";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { AdminSearchModal } from "./AdminSearchModal";
import { ToastContainer } from "./Toast";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";

export const AdminLayout: React.FC = () => {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentStaff = getCurrentStaff();

  // Scroll to top on route change inside admin
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Keyboard shortcut for search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "/") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          setSearchOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Route & Session Guard: Redirect to /admin/login if not signed in
  if (!currentStaff) {
    return <Navigate to="/admin/login" replace />;
  }

  // Route-Level Permission Check
  const requiredPermission = resolveRequiredPermission(location.pathname);
  const isAuthorized = !requiredPermission || hasPermission(currentStaff, requiredPermission);

  if (!isAuthorized) {
    const fallbackRoute =
      currentStaff.role === "Order Manager"
        ? "/admin/orders"
        : currentStaff.role === "Content Manager"
        ? "/admin/products"
        : "/admin/dashboard";

    return (
      <div
        data-access-denied=""
        className="min-h-screen bg-navy text-ivory flex items-center justify-center p-6 text-center font-sans select-none"
      >
        <div className="max-w-md w-full bg-navy2/90 border border-gold/30 p-8 rounded-xl space-y-5 shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-[3px] text-gold uppercase block font-semibold">
              {t("admin.adminLayout.securityEyebrow")}
            </span>
            <h2 className="font-serif text-2xl font-bold text-ivory">{t("admin.adminLayout.accessRestricted")}</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed font-light">
            {t("admin.adminLayout.roleDeniedPrefix")}
            <span className="text-gold font-semibold font-mono">{currentStaff.role}</span>
            {t("admin.adminLayout.roleDeniedSuffix")}
            <span className="font-mono text-ivory">{location.pathname}</span>.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate(fallbackRoute, { replace: true })}
              className="px-5 py-2.5 bg-gold hover:bg-goldLight text-navy font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-lg flex items-center justify-center gap-2 mx-auto"
            >
              <span>{t("admin.adminLayout.returnToPermittedWorkspace")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-ivory font-sans relative">
      <a href="#main-content" className="skip-link">
        {t("admin.adminLayout.skipToContent")}
      </a>

      {/* Toast System Container */}
      <ToastContainer />

      {/* Fixed Sidebar Navigation */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Workspace Area */}
      <div
        className={`min-h-screen flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? "lg:ms-[72px]" : "lg:ms-[260px]"
        } ms-0`}
      >
        {/* Sticky Topbar */}
        <AdminTopbar
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        {/* Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-8 focus:outline-none"
        >
          <Outlet />
        </main>
      </div>

      {/* Global Admin Search Modal */}
      <AdminSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};
