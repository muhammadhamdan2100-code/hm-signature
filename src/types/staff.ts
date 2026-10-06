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
    // Payment-method and boutique configuration changes what customers are offered, so it is
    // reserved for the Super Admin and guarded again inside the database functions.
    "payments.configure": true,
    "boutiques.manage": true,
    // Phase 8 brand experience. These decide what a shopper is recommended, whether a collection is
    // open to them, and how stored value moves — so none of them is handed to another role.
    "personalization.manage": true,
    "giftCards.manage": true,
    "loyalty.manage": true,
    "vip.manage": true,
    "preorders.view": true,
    "preorders.manage": true,
    "waitlists.view": true,
    "waitlists.manage": true,
    "discovery.manage": true,
    "marketing.manage": true,
    "content.manage": true,
    "reviews.manage": true,
    "staff.manage": true,
    "reports.view": true,
    // Phase 9 splits the reporting window three ways. Which one a role may open is
    // decided here for the navigation and again inside the database, so a direct
    // REST call cannot read a report the admin panel would not show.
    "reports.business": true,
    "reports.operational": true,
    "reports.content": true,
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
    // Phase 9 splits the reporting window three ways. A Manager runs the business,
    // so they hold all of it; the two narrower roles get only their own.
    "reports.business": true,
    "reports.operational": true,
    "reports.content": true,
    // Pre-orders and waitlists are order operations, so the roles that work orders may work them.
    // Nothing here gives Manager stored value, loyalty rules or what customers are recommended.
    "preorders.view": true,
    "preorders.manage": true,
    "waitlists.view": true,
    "waitlists.manage": true,
  },
  "Order Manager": {
    "dashboard.orders": true,
    "orders.view": true,
    "orders.manage": true,
    "orders.tracking": true,
    "orders.status": true,
    "orders.payment_status": true,
    // The operational window only: order and payment activity, never the customer
    // or margin figures that sit in the business reports.
    "reports.operational": true,
    "preorders.view": true,
    "preorders.manage": true,
    "waitlists.view": true,
    "waitlists.manage": true,
  },
  "Content Manager": {
    "dashboard.content": true,
    "products.view": true,
    "products.manage": true,
    "categories.manage": true,
    "collections.manage": true,
    "content.manage": true,
    "reviews.manage": true,
    // Product and content performance, without customer identity: the report
    // behind this code returns line volumes with the buyer columns nulled.
    "reports.content": true,
    // Tagging a fragrance with its own declared character is content work, and the database guard
    // for it is the same manage_products permission this role already holds.
    "discovery.manage": true,
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
  // A Manager may see and run payments; only the Super Admin may change which rails exist.
  "/admin/payments/methods": "payments.configure",
  "/admin/boutiques": "boutiques.manage",
  // Phase 8. Brand experience and stored value stay with the Super Admin; the operational lists go
  // to the roles that already work orders, and fragrance character tagging to the content role.
  "/admin/brand": "personalization.manage",
  "/admin/discovery": "discovery.manage",
  "/admin/rewards": "loyalty.manage",
  "/admin/gift-cards": "giftCards.manage",
  "/admin/preorders": "preorders.view",
  "/admin/waitlists": "waitlists.view",
  "/admin/abandoned-carts": "orders.view",
  "/admin/automations": "settings.manage",
  "/admin/international": "settings.manage",
  "/admin/localization": "content.manage",
  "/admin/staff": "staff.manage",
  "/admin/seo": "content.manage",
  "/admin/analytics": "reports.view",
  // Phase 9. The longest prefix wins, so an Order Manager reaches their window
  // through the operations path and never through the business one.
  "/admin/intelligence": "reports.business",
  "/admin/forecasting": "reports.business",
  "/admin/reports": "reports.business",
  "/admin/reports/operations": "reports.operational",
  "/admin/reports/product-performance": "reports.content",
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
