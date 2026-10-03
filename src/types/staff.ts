export type StaffRole = "Super Admin" | "Manager" | "Order Manager" | "Content Manager";

export type DBStaffRole = "super_admin" | "manager" | "order_manager" | "content_manager";

export type StaffStatus = "Active" | "Inactive" | "Suspended" | "active" | "inactive" | "suspended";

export const PRIMARY_ADMIN_EMAIL = "muhammadhamdan2100@gmail.com";

export interface Permission {
  key: string;
  label: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  avatar?: string;
  lastActive: string;
  createdAt: string;
  isPrimaryAdmin?: boolean;
  permissions: Record<string, boolean>;
}

/**
 * Recognises the single protected primary Super Admin.
 *
 * `isPrimaryAdmin` (mirrored from profiles.is_primary_admin) is authoritative: it
 * survives a change of login email and cannot be claimed by whoever happens to own an
 * address. PRIMARY_ADMIN_EMAIL remains only as a fallback for sessions established
 * before that column existed, and the database guard matches both for the same reason.
 */
export function isPrimaryAdmin(
  user: { email?: string; isPrimaryAdmin?: boolean } | string | null | undefined
): boolean {
  if (!user) return false;
  if (typeof user === "string") {
    return user.toLowerCase().trim() === PRIMARY_ADMIN_EMAIL.toLowerCase();
  }
  if (user.isPrimaryAdmin === true) return true;
  return user.email?.toLowerCase().trim() === PRIMARY_ADMIN_EMAIL.toLowerCase();
}

export function toDisplayRole(role: string): StaffRole {
  const normalized = role?.toLowerCase().trim();
  switch (normalized) {
    case "super_admin":
    case "super admin":
      return "Super Admin";
    case "order_manager":
    case "order manager":
      return "Order Manager";
    case "content_manager":
    case "content manager":
      return "Content Manager";
    case "manager":
    default:
      return "Manager";
  }
}

export function toDBRole(role: string): DBStaffRole {
  const normalized = role?.toLowerCase().trim();
  switch (normalized) {
    case "super admin":
    case "super_admin":
      return "super_admin";
    case "order manager":
    case "order_manager":
      return "order_manager";
    case "content manager":
    case "content_manager":
      return "content_manager";
    case "manager":
    default:
      return "manager";
  }
}

export function getDashboardName(role: string): string {
  const displayRole = toDisplayRole(role);
  switch (displayRole) {
    case "Super Admin":
      return "Full Admin Dashboard";
    case "Order Manager":
      return "Order Management Dashboard";
    case "Content Manager":
      return "Content Management Dashboard";
    case "Manager":
    default:
      return "Manager Dashboard";
  }
}

// Role Permission Configuration
export const ROLE_PERMISSIONS: Record<StaffRole, Record<string, boolean>> = {
  "Super Admin": {
    "dashboard.full": true,
    "dashboard.manager": true,
    "dashboard.orders": true,
    "dashboard.content": true,
    "products.view": true,
    "products.manage": true,
    "categories.manage": true,
    "collections.manage": true,
    "inventory.view": true,
    "inventory.manage": true,
    "orders.view": true,
    "orders.manage": true,
    "orders.tracking": true,
    "orders.status": true,
    "orders.payment_status": true,
    "customers.view": true,
    "payments.view": true,
    "payments.manage": true,
    "marketing.manage": true,
    "content.manage": true,
    "reviews.manage": true,
    "staff.manage": true,
    "reports.view": true,
    "settings.manage": true,
  },
  Manager: {
    "dashboard.manager": true,
    "products.view": true,
    "products.manage": true,
    "categories.manage": true,
    "collections.manage": true,
    "inventory.view": true,
    "inventory.manage": true,
    "orders.view": true,
    "orders.manage": true,
    "orders.tracking": true,
    "orders.status": true,
    "orders.payment_status": true,
    "customers.view": true,
    "reports.view": true,
  },
  "Order Manager": {
    "dashboard.orders": true,
    "orders.view": true,
    "orders.manage": true,
    "orders.tracking": true,
    "orders.status": true,
    "orders.payment_status": true,
  },
  "Content Manager": {
    "dashboard.content": true,
    "products.view": true,
    "products.manage": true,
    "categories.manage": true,
    "collections.manage": true,
    "content.manage": true,
    "reviews.manage": true,
  },
};

// Route to Required Permission Mapping
export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/admin/orders": "orders.view",
  "/admin/products": "products.view",
  "/admin/categories": "categories.manage",
  "/admin/collections": "collections.manage",
  "/admin/inventory": "inventory.view",
  "/admin/coupons": "products.manage",
  "/admin/shipping": "orders.manage",
  "/admin/customers": "customers.view",
  "/admin/reviews": "reviews.manage",
  "/admin/homepage": "content.manage",
  "/admin/marketing": "content.manage",
  "/admin/notifications": "orders.view",
  "/admin/payments": "payments.view",
  "/admin/payments/refunds": "payments.manage",
  "/admin/payments/reconciliation": "payments.view",
  "/admin/abandoned-carts": "orders.view",
  "/admin/automations": "settings.manage",
  "/admin/staff": "staff.manage",
  "/admin/seo": "content.manage",
  "/admin/analytics": "reports.view",
  "/admin/settings": "settings.manage",
};

/**
 * Child routes must not inherit "no requirement" just because the map lists their
 * parent. The longest matching prefix wins, so /admin/orders/123 is governed by
 * /admin/orders and a new sub-page can never be accidentally public.
 */
export function resolveRequiredPermission(pathname: string): string | undefined {
  let bestPath: string | null = null;
  for (const path of Object.keys(ROUTE_PERMISSIONS)) {
    const matches = pathname === path || pathname.startsWith(`${path}/`);
    if (matches && (bestPath === null || path.length > bestPath.length)) bestPath = path;
  }
  return bestPath ? ROUTE_PERMISSIONS[bestPath] : undefined;
}
