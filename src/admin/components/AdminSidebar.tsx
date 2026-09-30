import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import { useAuth } from "../../context/AuthContext";
import { ROUTE_PERMISSIONS } from "../../types/staff";
import {
  LayoutDashboard,
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
  Settings,
  Search,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  CreditCard,
  LogOut,
} from "lucide-react";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export interface NavGroup {
  groupName: string;
  items: {
    label: string;
    path: string;
    icon: React.ElementType;
  }[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    groupName: "Overview",
    items: [{ label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    groupName: "Commerce",
    items: [
      { label: "Orders", path: "/admin/orders", icon: ShoppingBag },
      { label: "Products", path: "/admin/products", icon: Package },
      { label: "Categories", path: "/admin/categories", icon: Layers },
      { label: "Collections", path: "/admin/collections", icon: Sparkles },
      { label: "Inventory", path: "/admin/inventory", icon: Boxes },
      { label: "Coupons", path: "/admin/coupons", icon: Tag },
      { label: "Shipping", path: "/admin/shipping", icon: Truck },
    ],
  },
  {
    groupName: "Customers",
    items: [
      { label: "Customers", path: "/admin/customers", icon: Users },
      { label: "Reviews", path: "/admin/reviews", icon: Star },
    ],
  },
  {
    groupName: "Content",
    items: [
      { label: "Homepage CMS", path: "/admin/homepage", icon: Globe },
      { label: "Marketing", path: "/admin/marketing", icon: Megaphone },
      { label: "Notifications", path: "/admin/notifications", icon: Bell },
    ],
  },
  {
    groupName: "Operations",
    items: [
      { label: "Payments", path: "/admin/payments", icon: CreditCard },
      { label: "Abandoned Carts", path: "/admin/abandoned-carts", icon: ShoppingCart },
    ],
  },
  {
    groupName: "Management",
    items: [
      { label: "Staff & Roles", path: "/admin/staff", icon: ShieldCheck },
      { label: "SEO Management", path: "/admin/seo", icon: Search },
      { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
      { label: "Store Settings", path: "/admin/settings", icon: Settings },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useAdminData();
  const { logout } = useAuth();
  const currentStaff = getCurrentStaff();

  const handleLogout = async () => {
    if (mobileOpen) onCloseMobile();
    await logout();
    showToast("info", "Signed out of admin session.");
    navigate("/admin/login", { replace: true });
  };

  // Filter navigation groups based on current staff role permissions
  const filteredNavGroups = NAV_GROUPS.map((group) => {
    const allowedItems = group.items.filter((item) => {
      if (item.path === "/admin/dashboard") return true;
      const requiredPerm = ROUTE_PERMISSIONS[item.path];
      return !requiredPerm || hasPermission(currentStaff, requiredPerm);
    });
    return { ...group, items: allowedItems };
  }).filter((group) => group.items.length > 0);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-navy2/95 backdrop-blur-md text-ivory border-r border-gold/20 select-none">
      {/* Pinned Top Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 shrink-0 bg-navy/60 border-b border-gold/20">
        <NavLink
          to="/admin/dashboard"
          className="flex items-center space-x-3 overflow-hidden"
          title="HM Signature Luxury Fragrance"
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
                LUXURY FRAGRANCE
              </span>
            </div>
          )}
        </NavLink>

        {/* Desktop Collapse Toggle Chevron */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded text-muted hover:text-gold hover:bg-navy transition-colors border border-gold/10"
          title={collapsed ? "Expand sidebar (260px)" : "Collapse sidebar (72px)"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Scrolling Middle Navigation Group List (Role-Aware) */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-dark-scrollbar">
        {filteredNavGroups.map((group) => (
          <div key={group.groupName} className="space-y-1">
            {!collapsed && (
              <span className="px-3 text-[9px] font-mono uppercase tracking-[3px] text-gold/70 block font-semibold mb-1">
                {group.groupName}
              </span>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onCloseMobile()}
                  className={({ isActive: active }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-sans transition-all duration-200 group relative ${
                      active || isActive
                        ? "bg-navy text-gold font-semibold border border-gold/30 shadow-md"
                        : "text-muted hover:text-ivory hover:bg-navy/50"
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
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
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-sans text-gold hover:text-goldLight hover:bg-navy transition-colors border border-gold/20"
          title="View Live Boutique Storefront"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="font-semibold uppercase text-[10px] tracking-wider truncate">Live Storefront</span>}
        </a>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-sans text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 transition-colors border border-rose-500/20"
          title="Sign out of Admin Console"
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
          {!collapsed && <span className="font-semibold uppercase text-[10px] tracking-wider truncate">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar (lg: breakpoint >= 1024px) */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-30 transition-all duration-300 ${
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
