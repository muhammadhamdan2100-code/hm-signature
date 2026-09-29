import React, { useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import { type StaffMember, type StaffRole, isPrimaryAdmin } from "../../types/staff";
import { getDefaultPermissionsForRole } from "../../services/staff";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, ConfirmDialog } from "../components/Modal";
import { Plus, Trash2, KeyRound, Check, ShieldCheck, Users, UserCheck, ShieldAlert, Award } from "lucide-react";

export const PERMISSION_KEYS = [
  { key: "products", label: "Products Management" },
  { key: "orders", label: "Orders & Fulfillment" },
  { key: "customers", label: "Client Records" },
  { key: "inventory", label: "Inventory Control" },
  { key: "coupons", label: "Coupons & Discounts" },
  { key: "shipping", label: "Shipping Logistics" },
  { key: "reviews", label: "Reviews Moderation" },
  { key: "homepage", label: "Homepage CMS" },
  { key: "marketing", label: "Marketing Campaigns" },
  { key: "analytics", label: "Analytics & Telemetry" },
  { key: "settings", label: "Website Settings" },
  { key: "staff", label: "Staff Management" },
];

export const StaffPage: React.FC = () => {
  const {
    staffMembers,
    addStaffMember,
    updateStaffPermissions,
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
  const activeStaffCount = staffMembers.filter((s) => s.status === "Active").length;
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
      lastActive: "Just added",
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
      header: "Staff Member",
      accessor: (st) => {
        const isPrimary = isPrimaryAdmin(st);
        const initials = st.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <div className="flex items-center space-x-3">
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
              <div className="flex items-center space-x-2">
                <h4 className="font-serif font-bold text-sm text-ivory">{st.name}</h4>
                {isPrimary && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-gold bg-gold/15 border border-gold/40 px-2 py-0.5 rounded uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" /> Primary Admin
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
      header: "Role Assignment",
      accessor: (st) => (
        <span
          className={`font-mono text-xs font-semibold px-2.5 py-1 rounded border inline-block ${
            st.role === "Super Admin"
              ? "bg-gold/10 text-gold border-gold/30"
              : st.role === "Manager"
              ? "bg-amber-950/40 text-amber-300 border-amber-500/30"
              : st.role === "Order Manager"
              ? "bg-sky-950/40 text-sky-300 border-sky-500/30"
              : "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
          }`}
        >
          {st.role}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Status",
      accessor: (st) => <StatusBadge status={st.status} />,
      sortable: true,
    },
    {
      header: "Last Activity",
      accessor: (st) => <span className="text-xs text-muted font-mono">{st.lastActive}</span>,
      sortable: true,
    },
    {
      header: "Actions",
      accessor: (st) => {
        const isPrimary = isPrimaryAdmin(st);

        return (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => handleOpenPermissions(st)}
              className="px-3 py-1.5 rounded bg-navy border border-gold/30 hover:border-gold text-gold hover:text-ivory text-xs font-sans transition-colors flex items-center space-x-1.5"
              title="Edit Permissions Matrix"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Permissions</span>
            </button>

            {isPrimary ? (
              <span className="px-2.5 py-1.5 rounded bg-navy2 border border-gold/20 text-gold/80 text-[11px] font-mono font-medium flex items-center gap-1 opacity-90 cursor-not-allowed">
                <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                <span>Protected</span>
              </span>
            ) : (
              <button
                onClick={() => setTargetDeleteStaff(st)}
                className="px-2.5 py-1.5 rounded bg-rose-950/30 border border-rose-500/30 hover:border-rose-400 text-rose-300 hover:text-rose-100 text-xs font-sans transition-colors flex items-center space-x-1"
                title="Remove Staff Access"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        );
      },
      className: "text-right",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            ATELIER GOVERNANCE & ACCESS CONTROL
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Staff Management
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Manage your HM Signature team members, assign granular access levels, and audit active staff accounts.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center space-x-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-navy2 border border-gold/20 rounded-lg p-4 flex items-center space-x-3 shadow-md">
          <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">Total Team</span>
            <span className="font-serif text-xl font-bold text-ivory">{totalStaffCount} Members</span>
          </div>
        </div>

        <div className="bg-navy2 border border-gold/20 rounded-lg p-4 flex items-center space-x-3 shadow-md">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">Active Status</span>
            <span className="font-serif text-xl font-bold text-emerald-300">{activeStaffCount} Active</span>
          </div>
        </div>

        <div className="bg-navy2 border border-gold/20 rounded-lg p-4 flex items-center space-x-3 shadow-md">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-gold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">Super Admins</span>
            <span className="font-serif text-xl font-bold text-gold">{superAdminCount} Accounts</span>
          </div>
        </div>

        <div className="bg-navy2 border border-gold/20 rounded-lg p-4 flex items-center space-x-3 shadow-md">
          <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">Department Managers</span>
            <span className="font-serif text-xl font-bold text-sky-200">{managerCount} Managers</span>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <DataTable
        columns={columns}
        data={staffMembers}
        keyExtractor={(st) => st.id}
        searchPlaceholder="Search staff name, email, role..."
        emptyMessage="No staff members registered"
      />

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Atelier Staff Member"
      >
        <form onSubmit={handleAddStaff} className="space-y-4 font-sans text-xs">
          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ayesha Tariq"
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2.5 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ayesha@hmsignature.com"
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2.5 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              Role Level Assignment *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2.5 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              <option value="Super Admin">Super Admin (Full Platform Access)</option>
              <option value="Manager">Manager (Catalog, Orders & Telemetry)</option>
              <option value="Order Manager">Order Manager (Fulfillment & Shipping)</option>
              <option value="Content Manager">Content Manager (CMS & Marketing)</option>
            </select>
          </div>

          <div className="p-3 bg-navy/60 border border-gold/15 rounded text-muted text-[11px] leading-relaxed">
            <span className="text-gold font-bold font-serif block mb-0.5">Role Permission Default:</span>
            Submitting this form creates a staff account profile with automated default permissions tailored to the assigned role level.
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-gold/15">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider shadow-md"
            >
              Add Staff Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Permissions Matrix Modal */}
      <Modal
        isOpen={editingPermissionsStaff !== null}
        onClose={() => setEditingPermissionsStaff(null)}
        title={`Permission Matrix — ${editingPermissionsStaff?.name || ""}`}
        maxWidth="lg"
      >
        {editingPermissionsStaff && (
          <form onSubmit={handleSavePermissions} className="space-y-4 font-sans text-xs">
            <div className="p-3 bg-navy/80 border border-gold/20 rounded flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-muted block">Staff Account</span>
                <span className="font-serif font-bold text-sm text-ivory">{editingPermissionsStaff.name}</span>
                <span className="text-xs text-gold font-mono block">{editingPermissionsStaff.email}</span>
              </div>
              <span className="font-mono text-xs font-bold text-gold bg-gold/10 border border-gold/30 px-2.5 py-1 rounded">
                Role: {editingPermissionsStaff.role}
              </span>
            </div>

            <p className="text-xs text-muted font-light">
              Configure granular administrative section access for this staff member.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {PERMISSION_KEYS.map((perm) => {
                const isGranted = Boolean(permissionsState[perm.key]);

                return (
                  <div
                    key={perm.key}
                    onClick={() => handleTogglePermission(perm.key)}
                    className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors text-xs font-sans ${
                      isGranted
                        ? "bg-navy2 border-gold/40 text-ivory"
                        : "bg-navy border-gold/15 text-muted hover:border-gold/30"
                    }`}
                  >
                    <span>{perm.label}</span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isGranted
                          ? "bg-gold border-gold text-navy"
                          : "border-gold/30 bg-navy"
                      }`}
                    >
                      {isGranted && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-gold/15">
              <button
                type="button"
                onClick={() => setEditingPermissionsStaff(null)}
                className="px-4 py-2 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider shadow-md"
              >
                Save Permissions Matrix
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Luxury Remove Staff Confirmation Dialog */}
      <ConfirmDialog
        isOpen={targetDeleteStaff !== null}
        onClose={() => setTargetDeleteStaff(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Staff Member Access?"
        message={
          targetDeleteStaff
            ? `You are about to revoke admin access for ${targetDeleteStaff.name} (${targetDeleteStaff.email}). This user will no longer be able to sign in or perform management actions.`
            : ""
        }
        confirmText="Remove Staff Access"
        isDanger={true}
      />
    </div>
  );
};
