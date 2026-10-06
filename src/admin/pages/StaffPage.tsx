import React, { useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import { type StaffMember, type StaffRole, isPrimaryAdmin, toDisplayRole, getDashboardName } from "../../types/staff";
import { getDefaultPermissionsForRole } from "../../services/staff";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, ConfirmDialog } from "../components/Modal";
import { PrimaryAdminSecurityCard } from "../components/PrimaryAdminSecurityCard";
import { Plus, Trash2, KeyRound, ShieldCheck, Users, UserCheck, ShieldAlert, Award, Ban, CheckCircle2 } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";

export const PERMISSION_KEYS = [
  { key: "products", labelKey: "admin.staff.productsManagement" },
  { key: "orders", labelKey: "admin.staff.ordersFulfilment" },
  { key: "customers", labelKey: "admin.staff.clientRecords" },
  { key: "inventory", labelKey: "admin.staff.inventoryControl" },
  { key: "coupons", labelKey: "admin.staff.couponsDiscounts" },
  { key: "shipping", labelKey: "admin.staff.shippingLogistics" },
  { key: "reviews", labelKey: "admin.staff.reviewsModeration" },
  { key: "homepage", labelKey: "admin.staff.homepageCms" },
  { key: "marketing", labelKey: "admin.staff.marketingCampaigns" },
  { key: "analytics", labelKey: "admin.staff.analyticsTelemetry" },
  { key: "settings", labelKey: "admin.staff.websiteSettings" },
  { key: "staff", labelKey: "admin.staff.staffManagement" },
];

export const StaffPage: React.FC = () => {
  const { t } = useI18n();
  const {
    staffMembers,
    addStaffMember,
    updateStaffPermissions,
    updateStaffStatus,
    deleteStaffMember,
  } = useAdminData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPermissionsStaff, setEditingPermissionsStaff] = useState<StaffMember | null>(null);
  const [targetDeleteStaff, setTargetDeleteStaff] = useState<StaffMember | null>(null);

  // Form State (New Staff)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("Order Manager");

  // Permissions Matrix State
  const [permissionsState, setPermissionsState] = useState<Record<string, boolean>>({});

  // Summary Metrics
  const totalStaffCount = staffMembers.length;
  const activeStaffCount = staffMembers.filter((s) => s.status.toLowerCase() === "active").length;
  const superAdminCount = staffMembers.filter((s) => s.role === "Super Admin").length;
  const managerCount = staffMembers.filter((s) => s.role !== "Super Admin").length;

  const handleOpenPermissions = (st: StaffMember) => {
    setEditingPermissionsStaff(st);
    setPermissionsState(st.permissions || getDefaultPermissionsForRole(st.role));
  };

  const handleTogglePermission = (key: string) => {
    setPermissionsState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPermissionsStaff) return;
    updateStaffPermissions(editingPermissionsStaff.id, permissionsState);
    setEditingPermissionsStaff(null);
  };

  const handleToggleStatus = (st: StaffMember) => {
    if (isPrimaryAdmin(st)) return; // Primary admin protected
    const nextStatus = st.status.toLowerCase() === "active" ? "Inactive" : "Active";
    updateStaffStatus(st.id, nextStatus as any);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const defaultPermissions = getDefaultPermissionsForRole(role);

    addStaffMember({
      name,
      email,
      role,
      status: "Active",
      permissions: defaultPermissions,
      lastActive: "Never",
      createdAt: new Date().toISOString().split("T")[0],
      isPrimaryAdmin: isPrimaryAdmin(email),
    } as any);

    setIsAddModalOpen(false);
    setName("");
    setEmail("");
    setRole("Order Manager");
  };

  const handleConfirmRemove = () => {
    if (!targetDeleteStaff) return;
    if (isPrimaryAdmin(targetDeleteStaff)) {
      setTargetDeleteStaff(null);
      return;
    }
    deleteStaffMember(targetDeleteStaff.id);
    setTargetDeleteStaff(null);
  };

  const columns: Column<StaffMember>[] = [
    {
      header: t("admin.staff.staffMember"),
      accessor: (st) => {
        const isPrimary = isPrimaryAdmin(st);
        const initials = st.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-sm shrink-0 border ${
                isPrimary
                  ? "bg-gold/20 border-gold text-gold shadow-md"
                  : "bg-navy border-gold/30 text-ivory"
              }`}
            >
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-serif font-bold text-sm text-ivory">{st.name}</h4>
                {isPrimary && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-gold bg-gold/15 border border-gold/40 px-2 py-0.5 rounded uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" /> {t("admin.staff.protectedPrimaryAdmin")}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-muted block">{st.email}</span>
            </div>
          </div>
        );
      },
      sortable: true,
    },
    {
      header: t("admin.staff.roleAssignment"),
      accessor: (st) => {
        const displayRole = toDisplayRole(st.role);
        return (
          <span
            className={`font-mono text-xs font-semibold px-2.5 py-1 rounded border inline-block ${
              displayRole === "Super Admin"
                ? "bg-gold/10 text-gold border-gold/30"
                : displayRole === "Manager"
                ? "bg-amber-950/40 text-amber-300 border-amber-500/30"
                : displayRole === "Order Manager"
                ? "bg-sky-950/40 text-sky-300 border-sky-500/30"
                : "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
            }`}
          >
            {displayRole}
          </span>
        );
      },
      sortable: true,
    },
    {
      header: t("admin.staff.loginAccessStatus"),
      accessor: (st) => {
        const isActive = st.status.toLowerCase() === "active";
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <StatusBadge status={st.status} />
              <span
                className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                  isActive
                    ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                }`}
              >
                {isActive ? t("admin.staff.enabled") : t("admin.staff.disabled")}
              </span>
            </div>
          </div>
        );
      },
      sortable: true,
    },
    {
      header: t("admin.staff.dashboardAccess"),
      accessor: (st) => (
        <span className="text-xs font-sans text-ivory font-medium block">
          {getDashboardName(st.role)}
        </span>
      ),
    },
    {
      header: t("admin.staff.lastLogin"),
      accessor: (st) => <span className="text-xs text-muted font-mono">{st.lastActive || t("admin.staff.never")}</span>,
      sortable: true,
    },
    {
      header: t("admin.staff.actions"),
      accessor: (st) => {
        const isPrimary = isPrimaryAdmin(st);
        const isActive = st.status.toLowerCase() === "active";

        return (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleOpenPermissions(st)}
              className="px-2.5 py-1.5 rounded bg-navy border border-gold/30 hover:border-gold text-gold hover:text-ivory text-xs font-sans transition-colors flex items-center gap-1"
              title={t("admin.staff.editPermissionsMatrix")}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{t("admin.staff.permissions")}</span>
            </button>

            {isPrimary ? (
              <span className="px-2.5 py-1.5 rounded bg-navy2 border border-gold/20 text-gold/80 text-[11px] font-mono font-medium flex items-center gap-1 opacity-90 cursor-not-allowed">
                <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                <span>{t("admin.staff.protected")}</span>
              </span>
            ) : (
              <>
                <button
                  onClick={() => handleToggleStatus(st)}
                  className={`px-2.5 py-1.5 rounded text-xs font-sans transition-colors flex items-center gap-1 border ${
                    isActive
                      ? "bg-amber-950/30 border-amber-500/30 hover:border-amber-400 text-amber-300"
                      : "bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-400 text-emerald-300"
                  }`}
                  title={isActive ? t("admin.staff.deactivateStaffAccount") : t("admin.staff.activateStaffAccount")}
                >
                  {isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{isActive ? t("admin.staff.deactivate") : t("admin.staff.activate")}</span>
                </button>

                <button
                  onClick={() => setTargetDeleteStaff(st)}
                  className="p-1.5 rounded bg-rose-950/30 border border-rose-500/30 hover:border-rose-400 text-rose-300 hover:text-rose-100 transition-colors"
                  title={t("admin.staff.removeStaffAccess")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        );
      },
      className: "text-end",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            {t("admin.staff.atelierGovernanceAccess")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.staff.staffLoginAccessControl")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            {t("admin.staff.manageAuthenticatedStaff")}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center gap-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("admin.staff.addStaffAccount")}</span>
        </button>
      </div>

      {/* Primary Super Admin account security — visible to that account only */}
      <PrimaryAdminSecurityCard />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-navy2/80 border border-gold/20 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">{t("admin.staff.totalStaff")}</span>
          <div className="text-2xl font-serif font-bold text-ivory flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" />
            <span>{totalStaffCount}</span>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-navy2/80 border border-gold/20 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">{t("admin.staff.activeLoginAccess")}</span>
          <div className="text-2xl font-serif font-bold text-emerald-400 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span>{activeStaffCount}</span>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-navy2/80 border border-gold/20 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">{t("admin.staff.superAdmins")}</span>
          <div className="text-2xl font-serif font-bold text-gold flex items-center gap-2">
            <Award className="w-5 h-5 text-gold" />
            <span>{superAdminCount}</span>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-navy2/80 border border-gold/20 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">{t("admin.staff.operationalManagers")}</span>
          <div className="text-2xl font-serif font-bold text-sky-400 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-sky-400" />
            <span>{managerCount}</span>
          </div>
        </div>
      </div>

      {/* Main Staff Data Table */}
      <DataTable
        columns={columns}
        data={staffMembers}
        keyExtractor={(st) => st.id}
        searchPlaceholder={t("admin.staff.searchStaffByNameEmail")}
        emptyMessage={t("admin.staff.noStaffMembersFound")}
      />

      {/* Modal: Add New Staff */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t("admin.staff.createStaffAccount")}
      >
        <form onSubmit={handleAddStaff} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-ivory mb-1">{t("admin.staff.fullNameRequired")}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("admin.staff.aliKhanPlaceholder")}
              className="w-full bg-navy border border-gold/20 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-ivory mb-1">{t("admin.staff.staffEmailAddressRequired")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("admin.staff.staffEmailPlaceholder")}
              className="w-full bg-navy border border-gold/20 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-ivory mb-1">{t("admin.staff.assignedStaffRoleRequired")}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full bg-navy border border-gold/20 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
            >
              <option value="Order Manager">{t("admin.staff.orderManagerFulfilmentTracking")}</option>
              <option value="Content Manager">{t("admin.staff.contentManagerCatalog")}</option>
              <option value="Manager">{t("admin.staff.managerBoutiqueOperations")}</option>
              <option value="Super Admin">{t("admin.staff.superAdminFullGovernance")}</option>
            </select>
          </div>

          <div className="p-3 rounded bg-navy/60 border border-gold/15 text-[11px] text-muted leading-relaxed">
            <span className="text-gold font-bold block mb-0.5">{t("admin.staff.authenticationNote")}</span>
            {t("admin.staff.staffAccountsRequireAuth")}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded text-muted hover:text-ivory"
            >
              {t("admin.modal.cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gold text-navy font-semibold rounded hover:bg-goldLight"
            >
              {t("admin.staff.createAccount")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Permissions Matrix */}
      <Modal
        isOpen={Boolean(editingPermissionsStaff)}
        onClose={() => setEditingPermissionsStaff(null)}
        title={t("admin.staff.permissionsMatrixName", { name: editingPermissionsStaff?.name || "" })}
      >
        <div className="space-y-4 text-xs font-sans">
          <div className="flex items-center justify-between border-b border-gold/15 pb-2">
            <span className="text-gold font-mono uppercase tracking-wider text-[10px]">
              {t("admin.staff.assignedRoleName", { role: editingPermissionsStaff?.role || "" })}
            </span>
            {isPrimaryAdmin(editingPermissionsStaff) && (
              <span className="text-[10px] text-gold font-mono font-bold">{t("admin.staff.fullUnrestrictedAccess")}</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pe-1">
            {PERMISSION_KEYS.map((item) => {
              const isChecked = Boolean(permissionsState[item.key]);
              const isDisabled = isPrimaryAdmin(editingPermissionsStaff);

              return (
                <label
                  key={item.key}
                  className={`flex items-center gap-2 p-2 rounded border transition-colors ${
                    isChecked
                      ? "bg-gold/10 border-gold/40 text-ivory"
                      : "bg-navy border-gold/10 text-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={isDisabled}
                    checked={isChecked}
                    onChange={() => handleTogglePermission(item.key)}
                    className="rounded border-gold/30 bg-navy text-gold focus:ring-gold"
                  />
                  <span>{t(item.labelKey)}</span>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gold/15">
            <button
              onClick={() => setEditingPermissionsStaff(null)}
              className="px-4 py-2 rounded text-muted hover:text-ivory"
            >
              {t("admin.staff.close")}
            </button>
            {!isPrimaryAdmin(editingPermissionsStaff) && (
              <button
                onClick={handleSavePermissions}
                className="px-4 py-2 bg-gold text-navy font-semibold rounded hover:bg-goldLight"
              >
                {t("admin.staff.savePermissions")}
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Confirm Staff Removal Dialog */}
      <ConfirmDialog
        isOpen={Boolean(targetDeleteStaff)}
        onClose={() => setTargetDeleteStaff(null)}
        onConfirm={handleConfirmRemove}
        title={t("admin.staff.deactivateRemoveStaffAccess")}
        message={t("admin.staff.removeAccessConfirm", { name: targetDeleteStaff?.name || "", email: targetDeleteStaff?.email || "" })}
        confirmText={t("admin.staff.removeAccess")}
      />
    </div>
  );
};
