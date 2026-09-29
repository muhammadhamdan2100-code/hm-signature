export type StaffRole = "Super Admin" | "Manager" | "Order Manager" | "Content Manager";

export type StaffStatus = "Active" | "Inactive" | "Suspended";

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

export function isPrimaryAdmin(user: { email: string } | string | null | undefined): boolean {
  if (!user) return false;
  const email = typeof user === "string" ? user : user.email;
  return email?.toLowerCase().trim() === PRIMARY_ADMIN_EMAIL.toLowerCase();
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
  "/admin/abandoned-carts": "orders.view",
  "/admin/staff": "staff.manage",
  "/admin/seo": "content.manage",
  "/admin/analytics": "reports.view",
  "/admin/settings": "settings.manage",
};
