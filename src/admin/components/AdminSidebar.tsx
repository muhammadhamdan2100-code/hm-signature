import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import { useAuth } from "../../context/AuthContext";
import { resolveRequiredPermission } from "../../types/staff";
import {
  LayoutDashboard,
  Scale,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Boxes,
  Tag,
  Truck,
  Star,
  Globe,
  Megaphone,
  Bell,
  ShoppingCart,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Settings,
  Search,
  BarChart3,
  BrainCircuit,
  LineChart,
  FileBarChart,
  FileClock,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  CreditCard,
  ArrowLeftRight,
  Zap,
  LogOut,
  Languages,
  BookOpen,
  Coins,
  Gift,
  CalendarClock,
  Bookmark,
} from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export interface NavGroup {
  /** Translation key for the group heading; the stored text lives in the dictionaries. */
  groupNameKey: string;
  items: {
    labelKey: string;
    path: string;
    icon: React.ElementType;
  }[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    groupNameKey: "admin.navGroup.overview",
    items: [{ labelKey: "admin.nav.dashboard", path: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    groupNameKey: "admin.navGroup.commerce",
    items: [
      { labelKey: "admin.nav.orders", path: "/admin/orders", icon: ShoppingBag },
      { labelKey: "admin.nav.products", path: "/admin/products", icon: Package },
      { labelKey: "admin.nav.categories", path: "/admin/categories", icon: Layers },
      { labelKey: "admin.nav.collections", path: "/admin/collections", icon: Sparkles },
      { labelKey: "admin.nav.inventory", path: "/admin/inventory", icon: Boxes },
      { labelKey: "admin.nav.coupons", path: "/admin/coupons", icon: Tag },
      { labelKey: "admin.nav.shipping", path: "/admin/shipping", icon: Truck },
    ],
  },
  {
    groupNameKey: "admin.navGroup.customers",
    items: [
      { labelKey: "admin.nav.customers", path: "/admin/customers", icon: Users },
      { labelKey: "admin.nav.reviews", path: "/admin/reviews", icon: Star },
      { labelKey: "admin.nav.rewards", path: "/admin/rewards", icon: Coins },
      { labelKey: "admin.nav.giftCards", path: "/admin/gift-cards", icon: Gift },
    ],
  },
  {
    groupNameKey: "admin.navGroup.content",
    items: [
      { labelKey: "admin.nav.homepageCms", path: "/admin/homepage", icon: Globe },
      { labelKey: "admin.nav.brandExperience", path: "/admin/brand", icon: Sparkles },
      { labelKey: "admin.nav.discoveryTags", path: "/admin/discovery", icon: Tag },
      { labelKey: "admin.nav.marketing", path: "/admin/marketing", icon: Megaphone },
      { labelKey: "admin.nav.notifications", path: "/admin/notifications", icon: Bell },
      { labelKey: "admin.nav.automations", path: "/admin/automations", icon: Zap },
    ],
  },
  {
    groupNameKey: "admin.navGroup.operations",
    items: [
      { labelKey: "admin.nav.payments", path: "/admin/payments", icon: CreditCard },
      { labelKey: "admin.nav.refunds", path: "/admin/payments/refunds", icon: ArrowLeftRight },
      { labelKey: "admin.nav.reconciliation", path: "/admin/payments/reconciliation", icon: Scale },
      { labelKey: "admin.nav.paymentMethods", path: "/admin/payments/methods", icon: SlidersHorizontal },
      { labelKey: "admin.nav.abandonedCarts", path: "/admin/abandoned-carts", icon: ShoppingCart },
      { labelKey: "admin.nav.preorders", path: "/admin/preorders", icon: CalendarClock },
      { labelKey: "admin.nav.waitlists", path: "/admin/waitlists", icon: Bookmark },
    ],
  },
  {
    groupNameKey: "admin.navGroup.management",
    items: [
      { labelKey: "admin.nav.staffAndRoles", path: "/admin/staff", icon: ShieldCheck },
      { labelKey: "admin.nav.seoManagement", path: "/admin/seo", icon: Search },
      { labelKey: "admin.nav.international", path: "/admin/international", icon: Languages },
      { labelKey: "admin.nav.localization", path: "/admin/localization", icon: BookOpen },
      { labelKey: "admin.nav.boutiques", path: "/admin/boutiques", icon: Store },
      { labelKey: "admin.nav.analytics", path: "/admin/analytics", icon: BarChart3 },
      // Phase 9. Three windows, because a Manager, an Order Manager and a Content
      // Manager are shown different things from the same order table.
      { labelKey: "admin.nav.intelligence", path: "/admin/intelligence", icon: BrainCircuit },
      { labelKey: "admin.nav.forecasting", path: "/admin/forecasting", icon: LineChart },
      { labelKey: "admin.nav.reports", path: "/admin/reports", icon: FileBarChart },
      { labelKey: "admin.nav.operationalReports", path: "/admin/reports/operations", icon: FileClock },
      { labelKey: "admin.nav.contentReports", path: "/admin/reports/product-performance", icon: FileSpreadsheet },
      { labelKey: "admin.nav.storeSettings", path: "/admin/settings", icon: Settings },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/**
 * Resolves the single nav path that owns the current URL. Child routes such as
 * /admin/payments/refunds win over their parent (/admin/payments) through the
 * longest matching prefix, so only one item is ever highlighted.
 */
const resolveActivePath = (pathname: string, candidates: string[]): string | null => {
  let best: string | null = null;
  for (const path of candidates) {
    const matches = pathname === path || pathname.startsWith(`${path}/`);
    if (matches && (best === null || path.length > best.length)) best = path;
  }
  return best;
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useAdminData();
  const { logout } = useAuth();
  const currentStaff = getCurrentStaff();

  const handleLogout = async () => {
    if (mobileOpen) onCloseMobile();
    await logout();
    showToast("info", t("admin.adminSidebar.signedOutOfAdminSession"));
    navigate("/admin/login", { replace: true });
  };

  // Filter navigation groups based on current staff role permissions
  const filteredNavGroups = NAV_GROUPS.map((group) => {
    const allowedItems = group.items.filter((item) => {
      if (item.path === "/admin/dashboard") return true;
      const requiredPerm = resolveRequiredPermission(item.path);
      return !requiredPerm || hasPermission(currentStaff, requiredPerm);
    });
    return { ...group, items: allowedItems };
  }).filter((group) => group.items.length > 0);

  const visiblePaths = filteredNavGroups.flatMap((group) =>
    group.items.map((item) => item.path)
  );
  const activePath = resolveActivePath(location.pathname, visiblePaths);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-navy2/95 backdrop-blur-md text-ivory border-e border-gold/20 select-none">
      {/* Pinned Top Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 shrink-0 bg-navy/60 border-b border-gold/20">
        <NavLink
          to="/admin/dashboard"
          className="flex items-center gap-3 overflow-hidden"
          title={t("admin.adminSidebar.brandTooltip")}
        >
          <div className="w-9 h-9 rounded border border-gold/30 bg-navy flex items-center justify-center p-1 shrink-0">
            <img src="/logo.png" alt="HM Signature" className="w-full h-full object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-serif font-bold text-sm tracking-wide text-ivory leading-tight truncate">
                HM SIGNATURE
              </span>
              <span className="text-[9px] font-mono tracking-[1.5px] text-gold uppercase opacity-90 truncate">
                {t("admin.adminSidebar.luxuryFragrance")}
              </span>
            </div>
          )}
        </NavLink>

        {/* Desktop Collapse Toggle Chevron */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded text-muted hover:text-gold hover:bg-navy transition-colors border border-gold/10"
          title={collapsed ? t("admin.sidebar.expandSidebar") : t("admin.sidebar.collapseSidebar")}
        >
          {collapsed ? <ChevronRight className="w-4 h-4 rtl:rotate-180" /> : <ChevronLeft className="w-4 h-4 rtl:rotate-180" />}
        </button>
      </div>

      {/* Scrolling Middle Navigation Group List (Role-Aware) */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-dark-scrollbar">
        {filteredNavGroups.map((group) => (
          <div key={group.groupNameKey} className="space-y-1">
            {!collapsed && (
              <span className="px-3 text-[9px] font-mono uppercase tracking-[3px] text-gold/70 block font-semibold mb-1">
                {t(group.groupNameKey)}
              </span>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onCloseMobile()}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-sans transition-all duration-200 group relative ${
                    isActive
                      ? "bg-navy text-gold font-semibold border border-gold/30 shadow-md"
                      : "text-muted hover:text-ivory hover:bg-navy/50"
                  }`}
                  title={collapsed ? t(item.labelKey) : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Pinned Bottom Footer Actions (12px top spacing via mt-3) */}
      <div className="shrink-0 p-3 pt-3 mt-3 border-t border-gold/20 bg-navy/40 space-y-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-sans text-gold hover:text-goldLight hover:bg-navy transition-colors border border-gold/20"
          title={t("admin.adminSidebar.viewLiveBoutiqueStorefront")}
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="font-semibold uppercase text-[10px] tracking-wider truncate">{t("admin.adminSidebar.liveStorefront")}</span>}
        </a>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-sans text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 transition-colors border border-rose-500/20"
          title={t("admin.adminSidebar.signOutOfAdminConsole")}
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
          {!collapsed && <span className="font-semibold uppercase text-[10px] tracking-wider truncate">{t("admin.adminSidebar.logout")}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar (lg: breakpoint >= 1024px) */}
      <aside
        className={`hidden lg:flex flex-col fixed start-0 top-0 bottom-0 z-30 transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile & Tablet Drawer Overlay (< 1024px) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative w-[260px] max-w-[80vw] h-full shadow-2xl z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
