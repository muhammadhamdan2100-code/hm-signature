import React, { useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, logoutStaff, hasPermission } from "../../services/auth";
import {
  Search,
  Bell,
  Plus,
  Menu,
  Shield,
  User,
  Power,
  PackagePlus,
  Tag,
  Megaphone,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdminTopbarProps {
  onOpenMobileSidebar: () => void;
  onOpenSearch: () => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  onOpenMobileSidebar,
  onOpenSearch,
}) => {
  const { notifications, storeSettings, updateStoreSettings, markNotificationRead } =
    useAdminData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const navigate = useNavigate();

  const currentStaff = getCurrentStaff();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const staffName = currentStaff?.name || "Muhammad Hamdan";
  const staffEmail = currentStaff?.email || "muhammadhamdan2100@gmail.com";
  const staffRole = currentStaff?.role || "Super Admin";
  const initials = staffName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isPrimary = currentStaff?.isPrimaryAdmin;

  const canManageProducts = hasPermission(currentStaff, "products.manage");
  const canManageMarketing = hasPermission(currentStaff, "marketing.manage");
  const canManageStaff = hasPermission(currentStaff, "staff.manage");
  const canManageSettings = hasPermission(currentStaff, "settings.manage");

  const handleToggleStoreStatus = () => {
    if (!canManageSettings) return;
    const newStatus = storeSettings.storeStatus === "Live" ? "Maintenance" : "Live";
    updateStoreSettings({ storeStatus: newStatus });
  };

  return (
    <header className="h-16 bg-navy2/95 border-b border-gold/20 px-6 md:px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
      {/* Left: Mobile Toggle & Quick Search */}
      <div className="flex items-center space-x-3 flex-1 max-w-md">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded text-muted hover:text-gold hover:bg-navy transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center space-x-3 bg-navy/80 border border-gold/20 rounded px-3 py-1.5 text-xs text-muted hover:border-gold/40 hover:text-ivory transition-colors cursor-pointer group"
        >
          <Search className="w-4 h-4 text-gold group-hover:text-goldLight" />
          <span className="truncate font-sans font-light">
            Search products, orders, customers (Ctrl+K)...
          </span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-navy border border-gold/20 rounded text-gold">
            /
          </kbd>
        </button>
      </div>

      {/* Right: Quick Actions, Store Status, Notifications, Profile */}
      <div className="flex items-center space-x-3">
        {/* Store Status Toggle (Only visible if has settings permission) */}
        {canManageSettings && (
          <div className="hidden sm:flex items-center space-x-2 bg-navy/60 border border-gold/20 px-3 py-1 rounded">
            <Radio
              className={`w-3.5 h-3.5 ${
                storeSettings.storeStatus === "Live"
                  ? "text-emerald-400 animate-pulse"
                  : "text-amber-400"
              }`}
            />
            <span className="text-[11px] font-sans uppercase tracking-wider text-muted">
              Store:
            </span>
            <button
              onClick={handleToggleStoreStatus}
              className={`text-[11px] font-sans font-bold uppercase tracking-wider ${
                storeSettings.storeStatus === "Live"
                  ? "text-emerald-300 hover:text-emerald-200"
                  : "text-amber-300 hover:text-amber-200"
              }`}
            >
              {storeSettings.storeStatus}
            </button>
          </div>
        )}

        {/* Quick Actions Dropdown (Only visible if user has management permissions) */}
        {(canManageProducts || canManageMarketing) && (
          <div className="relative">
            <button
              onClick={() => {
                setShowQuickActions(!showQuickActions);
                setShowNotifications(false);
                setShowProfileMenu(false);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs transition-colors shadow"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Action</span>
            </button>

            {showQuickActions && (
              <div className="absolute right-0 mt-2 w-48 bg-navy2 border border-gold/30 rounded-lg shadow-2xl py-2 z-30 font-sans text-xs">
                {canManageProducts && (
                  <button
                    onClick={() => {
                      navigate("/admin/products/new");
                      setShowQuickActions(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-navy text-ivory transition-colors"
                  >
                    <PackagePlus className="w-4 h-4 text-gold" />
                    <span>Add Product</span>
                  </button>
                )}
                {canManageProducts && (
                  <button
                    onClick={() => {
                      navigate("/admin/coupons");
                      setShowQuickActions(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-navy text-ivory transition-colors"
                  >
                    <Tag className="w-4 h-4 text-gold" />
                    <span>Create Coupon</span>
                  </button>
                )}
                {canManageMarketing && (
                  <button
                    onClick={() => {
                      navigate("/admin/marketing");
                      setShowQuickActions(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-navy text-ivory transition-colors"
                  >
                    <Megaphone className="w-4 h-4 text-gold" />
                    <span>New Campaign</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowQuickActions(false);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded text-muted hover:text-gold hover:bg-navy transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-gold text-navy text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-navy2 border border-gold/30 rounded-lg shadow-2xl py-2 z-30 font-sans text-xs">
              <div className="px-4 py-2 border-b border-gold/15 flex items-center justify-between">
                <span className="font-serif font-bold text-sm text-ivory">
                  Notifications
                </span>
                <span className="text-[10px] text-gold font-mono uppercase">
                  {unreadCount} Unread
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gold/10">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`p-3 hover:bg-navy transition-colors cursor-pointer ${
                      !n.read ? "bg-navy/60" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ivory">{n.title}</span>
                      <span className="text-[9px] text-muted">{n.date.split(" ")[1]}</span>
                    </div>
                    <p className="text-[11px] text-muted mt-1 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-gold/15 text-center bg-navy/40">
                <button
                  onClick={() => {
                    navigate("/admin/notifications");
                    setShowNotifications(false);
                  }}
                  className="text-[11px] text-gold hover:underline uppercase tracking-wider"
                >
                  View Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu Dropdown (Role-Aware) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowQuickActions(false);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2 p-1.5 rounded hover:bg-navy transition-colors border border-gold/20"
          >
            <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold flex items-center justify-center text-gold font-serif font-bold text-xs">
              {initials}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-sans text-ivory font-medium leading-tight">
                {staffName}
              </span>
              <span className="text-[9px] font-mono text-gold leading-tight">
                {staffRole}
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-navy2 border border-gold/30 rounded-lg shadow-2xl py-2 z-30 font-sans text-xs">
              <div className="px-4 py-2 border-b border-gold/15">
                <p className="font-semibold text-ivory">{staffName}</p>
                <p className="text-[10px] text-muted font-mono truncate">{staffEmail}</p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-[9px] text-gold font-mono uppercase tracking-wider bg-gold/10 border border-gold/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                    {isPrimary ? <ShieldCheck className="w-3 h-3 text-gold" /> : null}
                    {isPrimary ? "Primary Admin" : staffRole}
                  </span>
                </div>
              </div>

              {canManageSettings && (
                <button
                  onClick={() => {
                    navigate("/admin/settings");
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-navy text-ivory"
                >
                  <User className="w-4 h-4 text-gold" />
                  <span>Admin Profile & Settings</span>
                </button>
              )}

              {canManageStaff && (
                <button
                  onClick={() => {
                    navigate("/admin/staff");
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-navy text-ivory"
                >
                  <Shield className="w-4 h-4 text-gold" />
                  <span>Staff & Roles</span>
                </button>
              )}

              <div className="border-t border-gold/15 my-1" />
              <button
                onClick={() => {
                  logoutStaff();
                  setShowProfileMenu(false);
                  navigate("/admin/login", { replace: true });
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-rose-950/40 text-rose-300 font-semibold"
              >
                <Power className="w-4 h-4 text-rose-400" />
                <span>Logout Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
