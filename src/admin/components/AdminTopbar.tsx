import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  Languages,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../i18n/I18nProvider";

interface AdminTopbarProps {
  onOpenMobileSidebar: () => void;
  onOpenSearch: () => void;
}

const DROPDOWN = {
  initial: { opacity: 0, y: 8, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.96 },
  transition: { duration: 0.15 },
};

/**
 * Language switch for the console. It writes to the same store the storefront reads, so
 * choosing a language here survives admin navigation, a refresh and a walk out to the shop.
 */
const AdminLanguageSelector: React.FC = () => {
  const { t, language, languages, setLanguageCode } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={t("admin.topbar.selectLanguage")}
        title={t("admin.topbar.selectLanguage")}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="admin-language-menu"
        className="inline-flex items-center gap-1.5 min-h-11 px-2 rounded text-[10px] font-mono uppercase tracking-[1.5px] text-muted hover:text-goldLight hover:bg-navy transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
      >
        <Languages className="w-4 h-4" />
        <span>{language.nativeName}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="admin-language-menu"
            role="menu"
            aria-label={t("admin.topbar.selectLanguage")}
            {...DROPDOWN}
            className="absolute end-0 mt-2 w-52 bg-navy2 border border-gold/30 rounded-lg shadow-2xl py-2 z-40 font-sans text-xs"
          >
            {languages.map((option) => {
              const selected = option.code === language.code;
              return (
                <button
                  key={option.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    setLanguageCode(option.code);
                    setOpen(false);
                  }}
                  className={`w-full text-start px-4 py-2 flex items-center gap-2 transition-colors ${
                    selected ? "text-gold bg-gold/10" : "text-ivory hover:text-gold hover:bg-gold/10"
                  }`}
                >
                  <span className="flex-1 min-w-0 truncate">{option.nativeName}</span>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted shrink-0">
                    {option.code}
                  </span>
                  {selected && <Check size={13} className="text-gold shrink-0" />}
                </button>
              );
            })}
            <p className="px-4 pt-2 mt-1 border-t border-gold/10 text-[9px] font-mono uppercase tracking-[1.5px] text-muted">
              {t("admin.topbar.languageAppliesEverywhere")}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  onOpenMobileSidebar,
  onOpenSearch,
}) => {
  const { t } = useI18n();
  const { notifications, storeSettings, updateStoreSettings, markNotificationRead } =
    useAdminData();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const navigate = useNavigate();

  const currentStaff = getCurrentStaff();
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!showNotifications && !showProfileMenu && !showQuickActions) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShowNotifications(false);
      setShowProfileMenu(false);
      setShowQuickActions(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showNotifications, showProfileMenu, showQuickActions]);

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

  // The stored value stays English (it is compared and persisted); only the label follows
  // the interface language.
  const storeStatusLabel =
    storeSettings.storeStatus === "Live"
      ? t("admin.topbar.storeLive")
      : t("admin.topbar.storeMaintenance");

  const handleToggleStoreStatus = () => {
    if (!canManageSettings) return;
    const newStatus = storeSettings.storeStatus === "Live" ? "Maintenance" : "Live";
    updateStoreSettings({ storeStatus: newStatus });
  };

  return (
    <header className="h-16 bg-navy2/95 border-b border-gold/20 px-6 md:px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
      {/* Left: Mobile Toggle & Quick Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          aria-label={t("admin.topbar.openNavigation")}
          className="lg:hidden inline-flex items-center justify-center min-h-11 min-w-11 rounded text-muted hover:text-gold hover:bg-navy transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="w-full min-w-0 flex items-center gap-3 bg-navy/80 border border-gold/20 rounded px-3 min-h-11 text-xs text-muted hover:border-gold/40 hover:text-ivory transition-colors cursor-pointer group"
        >
          <Search className="w-4 h-4 text-gold group-hover:text-goldLight shrink-0" />
          <span className="truncate font-sans font-light">
            {t("admin.topbar.searchPlaceholder")}
          </span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-navy border border-gold/20 rounded text-gold shrink-0">
            /
          </kbd>
        </button>
      </div>

      {/* Right: Language, Quick Actions, Store Status, Notifications, Profile */}
      <div className="flex items-center gap-3 shrink-0">
        <AdminLanguageSelector />

        {/* Store Status Toggle (Only visible if has settings permission) */}
        {canManageSettings && (
          <div className="hidden sm:flex items-center gap-2 bg-navy/60 border border-gold/20 px-3 py-1 rounded">
            <Radio
              className={`w-3.5 h-3.5 ${
                storeSettings.storeStatus === "Live"
                  ? "text-emerald-400 animate-pulse"
                  : "text-amber-400"
              }`}
            />
            <span className="text-[11px] font-sans uppercase tracking-wider text-muted">
              {t("admin.topbar.store")}
            </span>
            <button
              onClick={handleToggleStoreStatus}
              className={`px-1.5 py-2 -my-2 rounded text-[11px] font-sans font-bold uppercase tracking-wider ${
                storeSettings.storeStatus === "Live"
                  ? "text-emerald-300 hover:text-emerald-200"
                  : "text-amber-300 hover:text-amber-200"
              }`}
            >
              {storeStatusLabel}
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
              aria-label={t("admin.topbar.quickActions")}
              aria-haspopup="true"
              aria-expanded={showQuickActions}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs transition-colors shadow"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("admin.topbar.quickAction")}</span>
            </button>

            {showQuickActions && (
              <div className="absolute end-0 mt-2 w-48 bg-navy2 border border-gold/30 rounded-lg shadow-2xl py-2 z-30 font-sans text-xs">
                {canManageProducts && (
                  <button
                    onClick={() => {
                      navigate("/admin/products/new");
                      setShowQuickActions(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-navy text-ivory transition-colors"
                  >
                    <PackagePlus className="w-4 h-4 text-gold" />
                    <span>{t("admin.topbar.addProduct")}</span>
                  </button>
                )}
                {canManageProducts && (
                  <button
                    onClick={() => {
                      navigate("/admin/coupons");
                      setShowQuickActions(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-navy text-ivory transition-colors"
                  >
                    <Tag className="w-4 h-4 text-gold" />
                    <span>{t("admin.topbar.createCoupon")}</span>
                  </button>
                )}
                {canManageMarketing && (
                  <button
                    onClick={() => {
                      navigate("/admin/marketing");
                      setShowQuickActions(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-navy text-ivory transition-colors"
                  >
                    <Megaphone className="w-4 h-4 text-gold" />
                    <span>{t("admin.topbar.newCampaign")}</span>
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
            aria-label={
              unreadCount > 0
                ? t("admin.topbar.notificationsUnread", { count: unreadCount })
                : t("admin.topbar.notifications")
            }
            aria-haspopup="true"
            aria-expanded={showNotifications}
            className="relative inline-flex items-center justify-center min-h-11 min-w-11 rounded text-muted hover:text-gold hover:bg-navy transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 end-1 w-4 h-4 bg-gold text-navy text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute end-0 mt-2 w-80 bg-navy2 border border-gold/30 rounded-lg shadow-2xl py-2 z-30 font-sans text-xs">
              <div className="px-4 py-2 border-b border-gold/15 flex items-center justify-between">
                <span className="font-serif font-bold text-sm text-ivory">
                  {t("admin.topbar.notifications")}
                </span>
                <span className="text-[10px] text-gold font-mono uppercase">
                  {t("admin.topbar.unreadCount", { count: unreadCount })}
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gold/10">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markNotificationRead(n.id)}
                    className={`w-full text-start p-3 hover:bg-navy transition-colors ${
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
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-gold/15 text-center bg-navy/40">
                <button
                  onClick={() => {
                    navigate("/admin/notifications");
                    setShowNotifications(false);
                  }}
                  className="px-2 py-2 -mx-2 -my-2 rounded text-[11px] text-gold hover:underline uppercase tracking-wider"
                >
                  {t("admin.topbar.viewNotifications")}
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
            aria-label={t("admin.topbar.accountMenu")}
            aria-haspopup="true"
            aria-expanded={showProfileMenu}
            className="flex items-center gap-2 p-1.5 rounded hover:bg-navy transition-colors border border-gold/20"
          >
            <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold flex items-center justify-center text-gold font-serif font-bold text-xs">
              {initials}
            </div>
            <div className="hidden md:flex flex-col text-start">
              <span className="text-xs font-sans text-ivory font-medium leading-tight">
                {staffName}
              </span>
              <span className="text-[9px] font-mono text-gold leading-tight">
                {staffRole}
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute end-0 mt-2 w-60 bg-navy2 border border-gold/30 rounded-lg shadow-2xl py-2 z-30 font-sans text-xs">
              <div className="px-4 py-2 border-b border-gold/15">
                <p className="font-semibold text-ivory">{staffName}</p>
                <p className="text-[10px] text-muted font-mono truncate">{staffEmail}</p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-[9px] text-gold font-mono uppercase tracking-wider bg-gold/10 border border-gold/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                    {isPrimary ? <ShieldCheck className="w-3 h-3 text-gold" /> : null}
                    {isPrimary ? t("admin.topbar.primaryAdmin") : staffRole}
                  </span>
                </div>
              </div>

              {canManageSettings && (
                <button
                  onClick={() => {
                    navigate("/admin/settings");
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-navy text-ivory"
                >
                  <User className="w-4 h-4 text-gold" />
                  <span>{t("admin.topbar.adminProfileAndSettings")}</span>
                </button>
              )}

              {canManageStaff && (
                <button
                  onClick={() => {
                    navigate("/admin/staff");
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-navy text-ivory"
                >
                  <Shield className="w-4 h-4 text-gold" />
                  <span>{t("admin.nav.staffAndRoles")}</span>
                </button>
              )}

              <div className="border-t border-gold/15 my-1" />
              <button
                onClick={async () => {
                  setShowProfileMenu(false);
                  await logout();
                  navigate("/admin/login", { replace: true });
                }}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-rose-950/40 text-rose-300 font-semibold"
              >
                <Power className="w-4 h-4 text-rose-400" />
                <span>{t("admin.topbar.logoutSession")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
