import {
  type StaffMember,
  type StaffRole,
  PRIMARY_ADMIN_EMAIL,
  isPrimaryAdmin,
} from "../types/staff";

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: "st-1",
    name: "Muhammad Hamdan",
    email: PRIMARY_ADMIN_EMAIL,
    role: "Super Admin",
    status: "Active",
    lastActive: "Just now",
    createdAt: "2026-01-01",
    isPrimaryAdmin: true,
    permissions: {
      products: true,
      orders: true,
      customers: true,
      inventory: true,
      coupons: true,
      shipping: true,
      reviews: true,
      homepage: true,
      marketing: true,
      analytics: true,
      settings: true,
      staff: true,
    },
  },
  {
    id: "st-2",
    name: "Fatima Khan",
    email: "fatima.order@hmsignature.com",
    role: "Order Manager",
    status: "Active",
    lastActive: "2 hours ago",
    createdAt: "2026-03-15",
    isPrimaryAdmin: false,
    permissions: {
      products: false,
      orders: true,
      customers: true,
      inventory: true,
      coupons: false,
      shipping: true,
      reviews: false,
      homepage: false,
      marketing: false,
      analytics: false,
      settings: false,
      staff: false,
    },
  },
  {
    id: "st-3",
    name: "Usman Ali",
    email: "usman.content@hmsignature.com",
    role: "Content Manager",
    status: "Active",
    lastActive: "1 day ago",
    createdAt: "2026-04-10",
    isPrimaryAdmin: false,
    permissions: {
      products: true,
      orders: false,
      customers: false,
      inventory: false,
      coupons: true,
      shipping: false,
      reviews: true,
      homepage: true,
      marketing: true,
      analytics: false,
      settings: false,
      staff: false,
    },
  },
  {
    id: "st-4",
    name: "Ayesha Tariq",
    email: "ayesha.manager@hmsignature.com",
    role: "Manager",
    status: "Active",
    lastActive: "3 hours ago",
    createdAt: "2026-05-20",
    isPrimaryAdmin: false,
    permissions: {
      products: true,
      orders: true,
      customers: true,
      inventory: true,
      coupons: true,
      shipping: true,
      reviews: true,
      homepage: false,
      marketing: true,
      analytics: true,
      settings: false,
      staff: false,
    },
  },
];

export function canRemoveStaff(staff: StaffMember | { email: string }): boolean {
  return !isPrimaryAdmin(staff);
}

export function getDefaultPermissionsForRole(role: StaffRole): Record<string, boolean> {
  switch (role) {
    case "Super Admin":
      return {
        products: true,
        orders: true,
        customers: true,
        inventory: true,
        coupons: true,
        shipping: true,
        reviews: true,
        homepage: true,
        marketing: true,
        analytics: true,
        settings: true,
        staff: true,
      };
    case "Manager":
      return {
        products: true,
        orders: true,
        customers: true,
        inventory: true,
        coupons: true,
        shipping: true,
        reviews: true,
        homepage: false,
        marketing: true,
        analytics: true,
        settings: false,
        staff: false,
      };
    case "Order Manager":
      return {
        products: false,
        orders: true,
        customers: true,
        inventory: true,
        coupons: false,
        shipping: true,
        reviews: false,
        homepage: false,
        marketing: false,
        analytics: false,
        settings: false,
        staff: false,
      };
    case "Content Manager":
      return {
        products: true,
        orders: false,
        customers: false,
        inventory: false,
        coupons: true,
        shipping: false,
        reviews: true,
        homepage: true,
        marketing: true,
        analytics: false,
        settings: false,
        staff: false,
      };
    default:
      return {};
  }
}
