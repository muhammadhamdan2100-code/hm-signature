import React, { createContext, useContext, useState, type ReactNode } from "react";
import { products as initialProductsData } from "../../data/products";
import { type StaffMember, type StaffStatus, PRIMARY_ADMIN_EMAIL, isPrimaryAdmin } from "../../types/staff";
import { INITIAL_STAFF_MEMBERS } from "../../services/staff";
import { isSupabaseConfigured, dbService } from "../../lib/supabase";

export type { StaffMember };
export { PRIMARY_ADMIN_EMAIL, isPrimaryAdmin };

// --- TYPES ---
export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  sku: string;
  category: string;
  collection: string;
  gender: "men" | "women" | "unisex";
  fragranceType: string;
  size: string;
  concentration: string;
  stock: number;
  lowStockThreshold: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  description: string;
  fullDescription: string;
  images: string[];
  photos: string[];
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  active: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  active: boolean;
  productCount: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  featured: boolean;
  active: boolean;
  productIds: string[];
}

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Returned";

export type PaymentMethod = "Cash on Delivery" | "JazzCash" | "Raast" | "Bank Transfer" | "Credit Card";

export type PaymentStatus = "Pending" | "Verified" | "Paid" | "Failed" | "Rejected" | "Refunded";

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceId?: string;
  proofNote?: string;
  date: string;
  verifiedBy?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderTimelineItem {
  status: OrderStatus;
  date: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  shippingStatus: "Unfulfilled" | "Processing" | "In Transit" | "Delivered" | "Returned";
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  courier?: string;
  trackingNumber?: string;
  timeline: OrderTimelineItem[];
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  joinedDate: string;
  status: "Active" | "VIP" | "Inactive" | "Blocked";
  addresses: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isDefault: boolean;
  }[];
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  previousStock: number;
  newStock: number;
  change: number;
  reason: string;
  adjustedBy: string;
  date: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "Percentage" | "Fixed";
  discountValue: number;
  minOrder: number;
  maxDiscount?: number;
  usedCount: number;
  usageLimit: number;
  perCustomerLimit: number;
  startDate: string;
  expiryDate: string;
  active: boolean;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  charge: number;
  freeThreshold: number;
  estimatedDelivery: string;
  active: boolean;
}

export interface ReviewItem {
  id: string;
  customerName: string;
  customerEmail: string;
  productId: string;
  productName: string;
  rating: number;
  title: string;
  review: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
}

export interface HomepageSection {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

export interface HomepageConfig {
  hero: {
    heading: string;
    subheading: string;
    description: string;
    image: string;
    ctaText: string;
    ctaLink: string;
  };
  announcementBar: {
    enabled: boolean;
    text: string;
    link: string;
  };
  sections: HomepageSection[];
}

export interface Campaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  discountPercentage: number;
  bannerImage: string;
  status: "Active" | "Scheduled" | "Ended";
  targetProducts: string[];
}

export interface SystemNotification {
  id: string;
  type: "Order" | "Customer" | "System" | "Stock";
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface EmailTemplate {
  id: string;
  type: string;
  subject: string;
  body: string;
  active: boolean;
}

export interface AbandonedCart {
  id: string;
  customerName: string;
  customerEmail: string;
  cartValue: number;
  items: { productName: string; quantity: number; price: number }[];
  abandonedDate: string;
  status: "Pending" | "Reminder Sent" | "Recovered";
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  email: string;
  phone: string;
  whatsApp: string;
  address: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  storeStatus: "Live" | "Maintenance";
  socialLinks: {
    instagram: string;
    facebook: string;
    twitter: string;
    pinterest: string;
  };
}

export interface SeoEntry {
  id: string;
  page: string;
  path: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  canonicalUrl: string;
  ogImage: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

// --- INITIAL DEMO DATA BUILDER ---
const initialProducts: AdminProduct[] = initialProductsData.map((p, idx) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  price: p.price,
  salePrice: idx % 2 === 0 ? p.price - 400 : undefined,
  sku: `HM-${p.name.toUpperCase().slice(0, 3)}-${100 + idx}`,
  category: p.category,
  collection: p.gender === "men" ? "Men's Collection" : p.gender === "women" ? "Women's Collection" : "Unisex Collection",
  gender: p.gender,
  fragranceType: "Extrait de Parfum",
  size: p.size,
  concentration: p.concentration,
  stock: p.stock,
  lowStockThreshold: 10,
  topNotes: p.topNotes,
  heartNotes: p.heartNotes,
  baseNotes: p.baseNotes,
  description: p.description,
  fullDescription: `${p.description} Handcrafted in small batches using rare, ethically sourced botanical extracts and aged essential oils. Designed for high projection and long longevity.`,
  images: p.images,
  photos: p.photos || [],
  featured: p.featured,
  bestseller: p.bestseller,
  newArrival: idx < 2,
  active: true,
  seoTitle: `${p.name} — HM Signature Luxury Perfume`,
  seoDescription: p.description,
  createdAt: "2026-08-15",
}));

const initialCategories: Category[] = [
  {
    id: "cat-1",
    name: "Woody Oriental",
    slug: "woody-oriental",
    description: "Deep, resinous fragrances with rich wood and precious amber undertones.",
    image: "texture-velvet",
    active: true,
    productCount: 4,
  },
  {
    id: "cat-2",
    name: "Fresh Woods",
    slug: "fresh-woods",
    description: "Crisp, energetic citrus blended with polished cedarwood and vetiver.",
    image: "texture-marble-dark",
    active: true,
    productCount: 3,
  },
  {
    id: "cat-3",
    name: "Floral Amber",
    slug: "floral-amber",
    description: "Sensual floral bouquets layered over warm golden vanilla and ambers.",
    image: "texture-marble-champagne",
    active: true,
    productCount: 5,
  },
  {
    id: "cat-4",
    name: "Spicy Woody",
    slug: "spicy-woody",
    description: "Complex nocturnal spices with smoky tobacco and cashmere woods.",
    image: "texture-wood",
    active: true,
    productCount: 3,
  },
  {
    id: "cat-5",
    name: "Amber Vanilla",
    slug: "amber-vanilla",
    description: "Sumptuous gourmand notes of roasted praline, tonka bean, and sweet amber.",
    image: "texture-navy",
    active: true,
    productCount: 2,
  },
];

const initialCollections: Collection[] = [
  {
    id: "col-1",
    name: "Men's Collection",
    slug: "mens-collection",
    description: "Commanding scents designed for modern refinement and magnetic presence.",
    image: "texture-marble-dark",
    featured: true,
    active: true,
    productIds: ["2", "4"],
  },
  {
    id: "col-2",
    name: "Women's Collection",
    slug: "womens-collection",
    description: "Luminous, romantic extraits crafted with delicate hand-picked florals.",
    image: "texture-marble-champagne",
    featured: true,
    active: true,
    productIds: ["3", "5"],
  },
  {
    id: "col-3",
    name: "Unisex Collection",
    slug: "unisex-collection",
    description: "Versatile signature perfumes created without boundaries.",
    image: "texture-navy",
    featured: true,
    active: true,
    productIds: ["1", "6"],
  },
  {
    id: "col-4",
    name: "Oud Collection",
    slug: "oud-collection",
    description: "Precious Royal Oud oils blended with saffron, roses, and dark amber resin.",
    image: "texture-velvet",
    featured: true,
    active: true,
    productIds: ["1"],
  },
  {
    id: "col-5",
    name: "Luxury Gift Sets",
    slug: "luxury-gift-sets",
    description: "Handcrafted wooden presentation boxes containing signature 100ml flacons.",
    image: "texture-wood",
    featured: false,
    active: true,
    productIds: ["1", "3"],
  },
];

const initialOrders: Order[] = [
  {
    id: "ord-1001",
    orderNumber: "HMS-8921",
    customerName: "Sultan Al-Mansoor",
    customerEmail: "sultan.m@example.com",
    customerPhone: "+971 50 123 4567",
    shippingAddress: {
      street: "Palm Jumeirah Villa 42",
      city: "Dubai",
      state: "Dubai",
      zip: "00000",
      country: "UAE",
    },
    billingAddress: {
      street: "Palm Jumeirah Villa 42",
      city: "Dubai",
      state: "Dubai",
      zip: "00000",
      country: "UAE",
    },
    items: [
      {
        id: "item-1",
        productId: "1",
        name: "Mystic Oud",
        sku: "HM-MYS-100",
        size: "100ML",
        price: 4500,
        quantity: 2,
        image: "texture-velvet",
      },
    ],
    subtotal: 9000,
    discount: 900,
    shippingFee: 0,
    total: 8100,
    status: "Delivered",
    shippingStatus: "Delivered",
    paymentStatus: "Paid",
    paymentMethod: "Credit Card",
    courier: "DHL Express Luxury",
    trackingNumber: "DHL-9823411029",
    timeline: [
      { status: "Pending", date: "2026-09-20 10:14" },
      { status: "Confirmed", date: "2026-09-20 10:30", note: "Payment validated" },
      { status: "Processing", date: "2026-09-21 09:00", note: "Hand-packaged at Atelier" },
      { status: "Shipped", date: "2026-09-22 14:15", note: "Dispatched via DHL" },
      { status: "Delivered", date: "2026-09-24 16:40", note: "Signed by recipient" },
    ],
    createdAt: "2026-09-20",
  },
  {
    id: "ord-1002",
    orderNumber: "HMS-8922",
    customerName: "Elena Rostova",
    customerEmail: "elena.rostova@example.com",
    customerPhone: "+44 7700 900077",
    shippingAddress: {
      street: "14 Mayfair Square",
      city: "London",
      state: "Greater London",
      zip: "W1K 2HP",
      country: "United Kingdom",
    },
    billingAddress: {
      street: "14 Mayfair Square",
      city: "London",
      state: "Greater London",
      zip: "W1K 2HP",
      country: "United Kingdom",
    },
    items: [
      {
        id: "item-2",
        productId: "3",
        name: "Harm Land",
        sku: "HM-HAR-102",
        size: "100ML",
        price: 3600,
        quantity: 1,
        image: "texture-marble-champagne",
      },
      {
        id: "item-3",
        productId: "5",
        name: "Rose Ember",
        sku: "HM-ROS-104",
        size: "100ML",
        price: 3200,
        quantity: 1,
        image: "texture-stone-beige",
      },
    ],
    subtotal: 6800,
    discount: 500,
    shippingFee: 0,
    total: 6300,
    status: "Processing",
    shippingStatus: "Processing",
    paymentStatus: "Paid",
    paymentMethod: "Bank Transfer",
    courier: "FedEx Priority International",
    trackingNumber: "FDX-7719283401",
    timeline: [
      { status: "Pending", date: "2026-09-27 18:22" },
      { status: "Confirmed", date: "2026-09-27 18:25" },
      { status: "Processing", date: "2026-09-28 08:30", note: "Bottle engraved with initials" },
    ],
    createdAt: "2026-09-27",
  },
  {
    id: "ord-1003",
    orderNumber: "HMS-8923",
    customerName: "Ameer Hamza",
    customerEmail: "ameer.h@example.com",
    customerPhone: "+92 300 1234567",
    shippingAddress: {
      street: "House 18, Block F, Gulberg III",
      city: "Lahore",
      state: "Punjab",
      zip: "54000",
      country: "Pakistan",
    },
    billingAddress: {
      street: "House 18, Block F, Gulberg III",
      city: "Lahore",
      state: "Punjab",
      zip: "54000",
      country: "Pakistan",
    },
    items: [
      {
        id: "item-4",
        productId: "2",
        name: "Un Kimmy",
        sku: "HM-UNK-101",
        size: "100ML",
        price: 2800,
        quantity: 1,
        image: "texture-marble-dark",
      },
    ],
    subtotal: 2800,
    discount: 0,
    shippingFee: 300,
    total: 3100,
    status: "Pending",
    shippingStatus: "Unfulfilled",
    paymentStatus: "Pending",
    paymentMethod: "Cash on Delivery",
    timeline: [{ status: "Pending", date: "2026-09-29 07:15" }],
    createdAt: "2026-09-29",
  },
  {
    id: "ord-1004",
    orderNumber: "HMS-8924",
    customerName: "Sophia Lauren",
    customerEmail: "sophia.l@example.com",
    customerPhone: "+1 212 555 0199",
    shippingAddress: {
      street: "740 Park Avenue Apt 12B",
      city: "New York",
      state: "NY",
      zip: "10021",
      country: "United States",
    },
    billingAddress: {
      street: "740 Park Avenue Apt 12B",
      city: "New York",
      state: "NY",
      zip: "10021",
      country: "United States",
    },
    items: [
      {
        id: "item-5",
        productId: "4",
        name: "Aura Nocturne",
        sku: "HM-AUR-103",
        size: "100ML",
        price: 4200,
        quantity: 2,
        image: "texture-wood",
      },
    ],
    subtotal: 8400,
    discount: 1000,
    shippingFee: 0,
    total: 7400,
    status: "Shipped",
    shippingStatus: "In Transit",
    paymentStatus: "Paid",
    paymentMethod: "Credit Card",
    courier: "UPS Worldwide Express",
    trackingNumber: "1Z9999999999999999",
    timeline: [
      { status: "Pending", date: "2026-09-25 11:10" },
      { status: "Confirmed", date: "2026-09-25 11:15" },
      { status: "Processing", date: "2026-09-26 10:00" },
      { status: "Shipped", date: "2026-09-27 15:30" },
    ],
    createdAt: "2026-09-25",
  },
];

const initialPayments: PaymentRecord[] = [
  {
    id: "pay-1001",
    orderId: "ord-1001",
    orderNumber: "HMS-8921",
    customerName: "Amina Al-Mansoor",
    customerEmail: "amina.almansoor@example.com",
    amount: 11800,
    method: "Bank Transfer",
    status: "Verified",
    referenceId: "MEZAN-TRX-998231",
    proofNote: "Meezan Bank mobile transfer confirmation received",
    date: "2026-09-29 14:15",
    verifiedBy: "Finance Concierge",
  },
  {
    id: "pay-1002",
    orderId: "ord-1002",
    orderNumber: "HMS-8922",
    customerName: "Lord Alexander Sinclair",
    customerEmail: "a.sinclair@example.com",
    amount: 6300,
    method: "JazzCash",
    status: "Verified",
    referenceId: "JC-90812377",
    proofNote: "JazzCash wallet confirmation auto-verified",
    date: "2026-09-27 18:25",
    verifiedBy: "System Automated",
  },
  {
    id: "pay-1003",
    orderId: "ord-1003",
    orderNumber: "HMS-8923",
    customerName: "Ameer Hamza",
    customerEmail: "ameer.h@example.com",
    amount: 3100,
    method: "Cash on Delivery",
    status: "Pending",
    proofNote: "Collect Rs. 3,100 upon TCS Luxury courier delivery",
    date: "2026-09-29 11:00",
  },
  {
    id: "pay-1004",
    orderId: "ord-1004",
    orderNumber: "HMS-8924",
    customerName: "Sophia Lauren",
    customerEmail: "sophia.l@example.com",
    amount: 7400,
    method: "Raast",
    status: "Verified",
    referenceId: "RAAST-8823190",
    proofNote: "Instant Raast payment settled",
    date: "2026-09-25 16:20",
    verifiedBy: "Finance Concierge",
  },
];

const initialCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Sultan Al-Mansoor",
    email: "sultan.m@example.com",
    phone: "+971 50 123 4567",
    ordersCount: 8,
    totalSpent: 38400,
    lastOrderDate: "2026-09-20",
    joinedDate: "2025-11-10",
    status: "VIP",
    addresses: [
      {
        street: "Palm Jumeirah Villa 42",
        city: "Dubai",
        state: "Dubai",
        zip: "00000",
        country: "UAE",
        isDefault: true,
      },
    ],
  },
  {
    id: "cust-2",
    name: "Elena Rostova",
    email: "elena.rostova@example.com",
    phone: "+44 7700 900077",
    ordersCount: 5,
    totalSpent: 21500,
    lastOrderDate: "2026-09-27",
    joinedDate: "2026-01-14",
    status: "VIP",
    addresses: [
      {
        street: "14 Mayfair Square",
        city: "London",
        state: "Greater London",
        zip: "W1K 2HP",
        country: "United Kingdom",
        isDefault: true,
      },
    ],
  },
  {
    id: "cust-3",
    name: "Ameer Hamza",
    email: "ameer.h@example.com",
    phone: "+92 300 1234567",
    ordersCount: 1,
    totalSpent: 3100,
    lastOrderDate: "2026-09-29",
    joinedDate: "2026-09-29",
    status: "Active",
    addresses: [
      {
        street: "House 18, Block F, Gulberg III",
        city: "Lahore",
        state: "Punjab",
        zip: "54000",
        country: "Pakistan",
        isDefault: true,
      },
    ],
  },
  {
    id: "cust-4",
    name: "Sophia Lauren",
    email: "sophia.l@example.com",
    phone: "+1 212 555 0199",
    ordersCount: 3,
    totalSpent: 16200,
    lastOrderDate: "2026-09-25",
    joinedDate: "2026-03-02",
    status: "Active",
    addresses: [
      {
        street: "740 Park Avenue Apt 12B",
        city: "New York",
        state: "NY",
        zip: "10021",
        country: "United States",
        isDefault: true,
      },
    ],
  },
];

const initialInventoryLogs: InventoryLog[] = [
  {
    id: "inv-1",
    productId: "1",
    productName: "Mystic Oud",
    sku: "HM-MYS-100",
    previousStock: 50,
    newStock: 42,
    change: -8,
    reason: "Order Fulfillment #HMS-8921",
    adjustedBy: "System Automated",
    date: "2026-09-20 10:30",
  },
  {
    id: "inv-2",
    productId: "3",
    productName: "Harm Land",
    sku: "HM-HAR-102",
    previousStock: 25,
    newStock: 38,
    change: 13,
    reason: "Atelier Batch Restock #B-902",
    adjustedBy: "Master Perfumer",
    date: "2026-09-18 14:00",
  },
];

const initialCoupons: Coupon[] = [
  {
    id: "coup-1",
    code: "LUXURY10",
    discountType: "Percentage",
    discountValue: 10,
    minOrder: 5000,
    maxDiscount: 2000,
    usedCount: 42,
    usageLimit: 100,
    perCustomerLimit: 1,
    startDate: "2026-09-01",
    expiryDate: "2026-12-31",
    active: true,
  },
  {
    id: "coup-2",
    code: "HMVIP500",
    discountType: "Fixed",
    discountValue: 500,
    minOrder: 4000,
    usedCount: 18,
    usageLimit: 50,
    perCustomerLimit: 2,
    startDate: "2026-08-15",
    expiryDate: "2026-10-15",
    active: true,
  },
  {
    id: "coup-3",
    code: "WELCOME15",
    discountType: "Percentage",
    discountValue: 15,
    minOrder: 3000,
    maxDiscount: 1500,
    usedCount: 89,
    usageLimit: 500,
    perCustomerLimit: 1,
    startDate: "2026-01-01",
    expiryDate: "2026-12-31",
    active: true,
  },
];

const initialShippingMethods: ShippingMethod[] = [
  {
    id: "ship-1",
    name: "Complimentary Luxury Courier",
    description: "Hand-delivered in signature magnetic keepsake box with white-glove service.",
    charge: 0,
    freeThreshold: 5000,
    estimatedDelivery: "2 - 3 Business Days",
    active: true,
  },
  {
    id: "ship-2",
    name: "Standard Express Shipping",
    description: "Insured express air freight with signature required upon delivery.",
    charge: 350,
    freeThreshold: 5000,
    estimatedDelivery: "3 - 5 Business Days",
    active: true,
  },
  {
    id: "ship-3",
    name: "Same Day Atelier Dispatch",
    description: "Exclusive concierge delivery for select metropolitan regions.",
    charge: 1200,
    freeThreshold: 15000,
    estimatedDelivery: "Same Day (Orders before 2 PM)",
    active: true,
  },
];

const initialReviews: ReviewItem[] = [
  {
    id: "rev-1",
    customerName: "Amara K.",
    customerEmail: "amara.k@example.com",
    productId: "1",
    productName: "Mystic Oud",
    rating: 5,
    title: "Unmatched Longevity & Royalty",
    review: "Deep, smoky, and it lasts all day. Compliments everywhere I go.",
    date: "2026-09-15",
    status: "Approved",
  },
  {
    id: "rev-2",
    customerName: "Farhan S.",
    customerEmail: "farhan.s@example.com",
    productId: "1",
    productName: "Mystic Oud",
    rating: 5,
    title: "Masterpiece Scent Profile",
    review: "The most sophisticated oud I've worn. Worth every rupee.",
    date: "2026-09-12",
    status: "Approved",
  },
  {
    id: "rev-3",
    customerName: "Priya D.",
    customerEmail: "priya.d@example.com",
    productId: "3",
    productName: "Harm Land",
    rating: 5,
    title: "My Engagement Signature",
    review: "Received so many compliments at my engagement. Warm and golden.",
    date: "2026-09-22",
    status: "Pending",
  },
];

const initialHomepageConfig: HomepageConfig = {
  hero: {
    heading: "Extrait de Parfum Collection",
    subheading: "HM SIGNATURE ATELIER",
    description: "Rare botanical extraits aged in dark oak casks, bottled in handcrafted obsidian crystal flacons.",
    image: "/products/mystic-oud-1.jpg",
    ctaText: "DISCOVER THE COLLECTION",
    ctaLink: "/collections",
  },
  announcementBar: {
    enabled: true,
    text: "COMPLIMENTARY ENGRAVING & EXPRESS LUXURY SHIPPING ON ORDERS ABOVE PKR 5,000",
    link: "/collections",
  },
  sections: [
    { id: "hero", name: "Hero Banner", enabled: true, order: 1 },
    { id: "featured", name: "Featured Fragrance Spotlight", enabled: true, order: 2 },
    { id: "bestsellers", name: "Bestsellers Carousel", enabled: true, order: 3 },
    { id: "collections", name: "Curated Collections Grid", enabled: true, order: 4 },
    { id: "story", name: "Brand Heritage Story", enabled: true, order: 5 },
    { id: "reviews", name: "Client Testimonials & Press", enabled: true, order: 6 },
    { id: "newsletter", name: "Private Atelier Newsletter", enabled: true, order: 7 },
  ],
};

const initialCampaigns: Campaign[] = [
  {
    id: "camp-1",
    name: "Autumn Private Atelier Sale",
    startDate: "2026-10-01",
    endDate: "2026-10-15",
    discountPercentage: 15,
    bannerImage: "texture-wood",
    status: "Scheduled",
    targetProducts: ["1", "4"],
  },
  {
    id: "camp-2",
    name: "Royal Oud Heritage Week",
    startDate: "2026-09-15",
    endDate: "2026-09-30",
    discountPercentage: 10,
    bannerImage: "texture-velvet",
    status: "Active",
    targetProducts: ["1"],
  },
];

const initialSystemNotifications: SystemNotification[] = [
  {
    id: "notif-1",
    type: "Order",
    title: "New Order #HMS-8923 Received",
    message: "Ameer Hamza placed an order for Un Kimmy (100ML). Total PKR 3,100.",
    date: "2026-09-29 07:15",
    read: false,
  },
  {
    id: "notif-2",
    type: "Stock",
    title: "Low Stock Warning: Harm Land",
    message: "Harm Land inventory dropped to 38 bottles (Threshold: 10). Restock scheduled.",
    date: "2026-09-28 14:20",
    read: false,
  },
  {
    id: "notif-3",
    type: "Customer",
    title: "New VIP Customer Registered",
    message: "Elena Rostova reached VIP status with lifetime spend over PKR 20,000.",
    date: "2026-09-27 18:25",
    read: true,
  },
];

const initialEmailTemplates: EmailTemplate[] = [
  {
    id: "tmpl-1",
    type: "Order Confirmation",
    subject: "HM SIGNATURE — Order Confirmation #{{order_number}}",
    body: "Dear {{customer_name}},\n\nThank you for choosing HM Signature. Your luxury fragrance order #{{order_number}} has been received and is being prepared in our private atelier.\n\nTotal: {{order_total}}\n\nWarm regards,\nHM Signature Concierge",
    active: true,
  },
  {
    id: "tmpl-2",
    type: "Order Shipped",
    subject: "HM SIGNATURE — Your Fragrance is In Transit #{{order_number}}",
    body: "Dear {{customer_name}},\n\nYour signature package has dispatched via {{courier}}. Tracking Number: {{tracking_number}}.\n\nThank you for your patience.",
    active: true,
  },
  {
    id: "tmpl-3",
    type: "Order Delivered",
    subject: "HM SIGNATURE — Delivery Confirmed #{{order_number}}",
    body: "Dear {{customer_name}},\n\nYour order has been delivered. We hope your new signature scent brings you elegance and confidence.\n\nWarm regards,\nHM Signature",
    active: true,
  },
  {
    id: "tmpl-4",
    type: "Welcome Member",
    subject: "Welcome to the World of HM Signature",
    body: "Dear {{customer_name}},\n\nWelcome to our private atelier circle. Explore our rare extraits de parfum crafted with uncompromising artisanal quality.",
    active: true,
  },
];

const initialAbandonedCarts: AbandonedCart[] = [
  {
    id: "ab-101",
    customerName: "Zainab Chaudhry",
    customerEmail: "zainab.c@example.com",
    cartValue: 7100,
    items: [
      { productName: "Mystic Oud", quantity: 1, price: 4500 },
      { productName: "Golden Hour", quantity: 1, price: 2500 },
    ],
    abandonedDate: "2026-09-28 22:14",
    status: "Pending",
  },
  {
    id: "ab-102",
    customerName: "Tariq Mahmood",
    customerEmail: "tariq.m@example.com",
    cartValue: 4200,
    items: [{ productName: "Aura Nocturne", quantity: 1, price: 4200 }],
    abandonedDate: "2026-09-27 15:40",
    status: "Reminder Sent",
  },
];

const initialStaff: StaffMember[] = INITIAL_STAFF_MEMBERS;

const initialStoreSettings: StoreSettings = {
  storeName: "HM Signature",
  tagline: "Luxury Fragrance Commerce Management",
  email: "concierge@hmsignature.com",
  phone: "+92 42 111 888 999",
  whatsApp: "+92 300 888 9999",
  address: "HM Signature Atelier, Gulberg III, Lahore, Pakistan",
  currency: "PKR",
  currencySymbol: "Rs.",
  taxRate: 0,
  storeStatus: "Live",
  socialLinks: {
    instagram: "https://instagram.com/hmsignature",
    facebook: "https://facebook.com/hmsignature",
    twitter: "https://twitter.com/hmsignature",
    pinterest: "https://pinterest.com/hmsignature",
  },
};

const initialSeoEntries: SeoEntry[] = [
  {
    id: "seo-1",
    page: "Homepage",
    path: "/",
    slug: "",
    metaTitle: "HM Signature — Artisanal Luxury Perfumes & Extraits de Parfum",
    metaDescription: "Experience HM Signature's handcrafted luxury fragrances. Rare botanical extracts, long-lasting projection, signature wooden gift boxes.",
    canonicalUrl: "https://hmsignature.com/",
    ogImage: "/products/mystic-oud-1.jpg",
  },
  {
    id: "seo-2",
    page: "Collections Catalog",
    path: "/collections",
    slug: "collections",
    metaTitle: "Curated Fragrance Collections — HM Signature",
    metaDescription: "Browse our signature perfume collections for Men, Women, and Unisex. Extrait de parfum concentrations made for high elegance.",
    canonicalUrl: "https://hmsignature.com/collections",
    ogImage: "/products/brand-signature-box.jpg",
  },
  {
    id: "seo-3",
    page: "Mystic Oud Product",
    path: "/product/mystic-oud",
    slug: "mystic-oud",
    metaTitle: "Mystic Oud Extrait de Parfum — HM Signature",
    metaDescription: "A rich, magnetic blend of oud, Bulgarian rose, and amber resinoid.",
    canonicalUrl: "https://hmsignature.com/product/mystic-oud",
    ogImage: "/products/mystic-oud-1.jpg",
  },
];

// --- CONTEXT INTERFACE ---
interface AdminDataContextType {
  products: AdminProduct[];
  categories: Category[];
  collections: Collection[];
  orders: Order[];
  payments: PaymentRecord[];
  customers: Customer[];
  inventoryLogs: InventoryLog[];
  coupons: Coupon[];
  shippingMethods: ShippingMethod[];
  reviews: ReviewItem[];
  homepageConfig: HomepageConfig;
  campaigns: Campaign[];
  notifications: SystemNotification[];
  emailTemplates: EmailTemplate[];
  abandonedCarts: AbandonedCart[];
  staffMembers: StaffMember[];
  storeSettings: StoreSettings;
  seoEntries: SeoEntry[];
  toasts: ToastMessage[];

  // Actions
  addProduct: (product: Omit<AdminProduct, "id" | "createdAt">) => void;
  updateProduct: (id: string, updates: Partial<AdminProduct>) => void;
  deleteProduct: (id: string) => void;
  bulkDeleteProducts: (ids: string[]) => void;
  bulkToggleProductStatus: (ids: string[], active: boolean) => void;
  duplicateProduct: (id: string) => void;

  addCategory: (cat: Omit<Category, "id" | "productCount">) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addCollection: (col: Omit<Collection, "id">) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;

  addOrder: (order: Omit<Order, "id"> & { id?: string }) => void;
  generateOrderNumber: () => string;
  generateTrackingId: () => string;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  updateOrderShipping: (orderId: string, courier: string, trackingNumber: string, shippingStatus: Order["shippingStatus"]) => void;

  // Payments Management
  updatePaymentStatus: (paymentId: string, status: PaymentStatus, note?: string) => void;
  verifyPayment: (paymentId: string, note?: string) => void;
  rejectPayment: (paymentId: string, reason?: string) => void;
  markCodCollected: (paymentId: string) => void;

  adjustStock: (productId: string, change: number, reason: string) => void;

  addCoupon: (coupon: Omit<Coupon, "id" | "usedCount">) => void;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;

  updateShippingMethod: (id: string, updates: Partial<ShippingMethod>) => void;
  
  updateReviewStatus: (id: string, status: ReviewItem["status"]) => void;
  deleteReview: (id: string) => void;

  updateHomepageConfig: (updates: Partial<HomepageConfig>) => void;

  addCampaign: (camp: Omit<Campaign, "id">) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;

  sendCartRecoveryReminder: (cartId: string, customNote: string) => void;
  
  markNotificationRead: (id: string) => void;
  updateEmailTemplate: (id: string, updates: Partial<EmailTemplate>) => void;

  addStaffMember: (staff: Omit<StaffMember, "id" | "lastActive">) => void;
  updateStaffPermissions: (id: string, permissions: Record<string, boolean>) => void;
  updateStaffStatus: (id: string, status: StaffStatus) => void;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => void;

  updateStoreSettings: (updates: Partial<StoreSettings>) => void;
  updateSeoEntry: (id: string, updates: Partial<SeoEntry>) => void;

  showToast: (type: ToastMessage["type"], message: string) => void;
  removeToast: (id: string) => void;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export const AdminDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>(initialInventoryLogs);
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(initialShippingMethods);
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [homepageConfig, setHomepageConfig] = useState<HomepageConfig>(initialHomepageConfig);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [notifications, setNotifications] = useState<SystemNotification[]>(initialSystemNotifications);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(initialEmailTemplates);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>(initialAbandonedCarts);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(initialStaff);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(initialStoreSettings);
  const [seoEntries, setSeoEntries] = useState<SeoEntry[]>(initialSeoEntries);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: ToastMessage["type"], message: string) => {
    const id = "t-" + Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Products
  const addProduct = (prodData: Omit<AdminProduct, "id" | "createdAt">) => {
    const newProd: AdminProduct = {
      ...prodData,
      id: "prod-" + Date.now(),
      createdAt: new Date().toISOString().split("T")[0],
    };
    setProducts((prev) => [newProd, ...prev]);
    showToast("success", `Product "${newProd.name}" added successfully.`);
  };

  const updateProduct = (id: string, updates: Partial<AdminProduct>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    showToast("success", "Product updated successfully.");
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast("info", "Product removed.");
  };

  const bulkDeleteProducts = (ids: string[]) => {
    setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
    showToast("info", `${ids.length} products deleted.`);
  };

  const bulkToggleProductStatus = (ids: string[], active: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (ids.includes(p.id) ? { ...p, active } : p))
    );
    showToast("success", `Status updated for ${ids.length} products.`);
  };

  const duplicateProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const duplicated: AdminProduct = {
      ...target,
      id: "prod-" + Date.now(),
      name: `${target.name} (Copy)`,
      sku: `${target.sku}-COPY`,
      slug: `${target.slug}-copy-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setProducts((prev) => [duplicated, ...prev]);
    showToast("success", `Duplicated product "${target.name}".`);
  };

  // Categories
  const addCategory = (cat: Omit<Category, "id" | "productCount">) => {
    const newCat: Category = { ...cat, id: "cat-" + Date.now(), productCount: 0 };
    setCategories((prev) => [...prev, newCat]);
    showToast("success", `Category "${newCat.name}" created.`);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    showToast("success", "Category updated.");
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast("info", "Category deleted.");
  };

  // Collections
  const addCollection = (col: Omit<Collection, "id">) => {
    const newCol: Collection = { ...col, id: "col-" + Date.now() };
    setCollections((prev) => [...prev, newCol]);
    showToast("success", `Collection "${newCol.name}" created.`);
  };

  const updateCollection = (id: string, updates: Partial<Collection>) => {
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    showToast("success", "Collection updated.");
  };

  const deleteCollection = (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
    showToast("info", "Collection deleted.");
  };

  // Orders
  const generateOrderNumber = () => {
    const seq = (orders.length + 1).toString().padStart(6, "0");
    return `HMS-2026-${seq}`;
  };

  const generateTrackingId = () => {
    const code = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `HMS-TRK-${code}`;
  };

  const addOrder = (orderData: Omit<Order, "id"> & { id?: string }) => {
    const timeString = new Date().toISOString().replace("T", " ").slice(0, 16);
    const orderId = orderData.id || `ord-${Date.now()}`;
    const initialTimeline: OrderTimelineItem[] = [
      { status: orderData.status || "Pending", date: timeString },
    ];
    const newOrder: Order = {
      id: orderId,
      ...orderData,
      timeline: orderData.timeline || initialTimeline,
    };
    setOrders((prev) => [newOrder, ...prev]);

    // Create payment entry
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      customerName: newOrder.customerName,
      customerEmail: newOrder.customerEmail,
      amount: newOrder.total,
      method: newOrder.paymentMethod,
      status: newOrder.paymentMethod === "Cash on Delivery" ? "Pending" : "Verified",
      referenceId: newOrder.paymentReference || (newOrder.paymentMethod === "Cash on Delivery" ? "COD-PENDING" : `REF-${Math.floor(100000 + Math.random() * 900000)}`),
      date: timeString,
    };
    setPayments((prev) => [newPayment, ...prev]);
    showToast("success", `New Order #${newOrder.orderNumber} placed via ${newOrder.paymentMethod}.`);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    const timeString = new Date().toISOString().replace("T", " ").slice(0, 16);
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const newTimelineItem: OrderTimelineItem = { status, date: timeString, note };
          return {
            ...o,
            status,
            timeline: [...o.timeline, newTimelineItem],
          };
        }
        return o;
      })
    );
    showToast("success", `Order #${orderId} status changed to ${status}.`);
  };

  const updateOrderShipping = (
    orderId: string,
    courier: string,
    trackingNumber: string,
    shippingStatus: Order["shippingStatus"]
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, courier, trackingNumber, shippingStatus }
          : o
      )
    );
    showToast("success", `Tracking info updated for order.`);
  };

  // Payments Management
  const updatePaymentStatus = (paymentId: string, status: PaymentStatus, note?: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status, proofNote: note || p.proofNote } : p))
    );
    showToast("success", `Payment record status changed to ${status}.`);
  };

  const verifyPayment = (paymentId: string, note?: string) => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          setOrders((oList) =>
            oList.map((o) => (o.id === p.orderId ? { ...o, paymentStatus: "Paid" } : o))
          );
          return { ...p, status: "Verified", proofNote: note || "Verified by staff", verifiedBy: "Finance Staff" };
        }
        return p;
      })
    );
    showToast("success", "Payment verified successfully.");
  };

  const rejectPayment = (paymentId: string, reason?: string) => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          setOrders((oList) =>
            oList.map((o) => (o.id === p.orderId ? { ...o, paymentStatus: "Failed" } : o))
          );
          return { ...p, status: "Rejected", proofNote: reason || "Payment reference invalid" };
        }
        return p;
      })
    );
    showToast("error", "Payment rejected.");
  };

  const markCodCollected = (paymentId: string) => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          setOrders((oList) =>
            oList.map((o) => (o.id === p.orderId ? { ...o, paymentStatus: "Paid" } : o))
          );
          return { ...p, status: "Paid", proofNote: "Cash collected upon delivery", verifiedBy: "Courier Partner" };
        }
        return p;
      })
    );
    showToast("success", "COD payment marked as Collected.");
  };

  // Inventory
  const adjustStock = (productId: string, change: number, reason: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const oldStock = prod.stock;
    const newStock = Math.max(0, oldStock + change);

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );

    const newLog: InventoryLog = {
      id: "inv-" + Date.now(),
      productId,
      productName: prod.name,
      sku: prod.sku,
      previousStock: oldStock,
      newStock,
      change,
      reason,
      adjustedBy: "Admin User",
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    setInventoryLogs((prev) => [newLog, ...prev]);
    showToast("success", `Stock for "${prod.name}" adjusted by ${change > 0 ? "+" : ""}${change}.`);
  };

  // Coupons
  const addCoupon = (coupon: Omit<Coupon, "id" | "usedCount">) => {
    const newCoup: Coupon = { ...coupon, id: "coup-" + Date.now(), usedCount: 0 };
    setCoupons((prev) => [newCoup, ...prev]);
    showToast("success", `Coupon code "${newCoup.code}" created.`);
  };

  const updateCoupon = (id: string, updates: Partial<Coupon>) => {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    showToast("success", "Coupon updated.");
  };

  const deleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    showToast("info", "Coupon removed.");
  };

  // Shipping
  const updateShippingMethod = (id: string, updates: Partial<ShippingMethod>) => {
    setShippingMethods((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    showToast("success", "Shipping method updated.");
  };

  // Reviews
  const updateReviewStatus = (id: string, status: ReviewItem["status"]) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    showToast("success", `Review status changed to ${status}.`);
  };

  const deleteReview = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    showToast("info", "Review deleted.");
  };

  // Homepage Config
  const updateHomepageConfig = (updates: Partial<HomepageConfig>) => {
    setHomepageConfig((prev) => ({ ...prev, ...updates }));
    showToast("success", "Homepage CMS settings saved.");
  };

  // Campaigns
  const addCampaign = (camp: Omit<Campaign, "id">) => {
    const newCamp: Campaign = { ...camp, id: "camp-" + Date.now() };
    setCampaigns((prev) => [newCamp, ...prev]);
    showToast("success", `Marketing campaign "${newCamp.name}" launched.`);
  };

  const updateCampaign = (id: string, updates: Partial<Campaign>) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    showToast("success", "Campaign updated.");
  };

  const deleteCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    showToast("info", "Campaign removed.");
  };

  // Abandoned Carts
  const sendCartRecoveryReminder = (cartId: string, customNote: string) => {
    setAbandonedCarts((prev) =>
      prev.map((c) => (c.id === cartId ? { ...c, status: "Reminder Sent" } : c))
    );
    showToast("success", `Recovery reminder sent with note: "${customNote.slice(0, 30)}..."`);
  };

  // Notifications & Templates
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const updateEmailTemplate = (id: string, updates: Partial<EmailTemplate>) => {
    setEmailTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    showToast("success", "Notification template updated.");
  };

  // Staff & Permissions
  const addStaffMember = (staff: Omit<StaffMember, "id" | "lastActive">) => {
    const newStaff: StaffMember = {
      ...staff,
      id: "st-" + Date.now(),
      lastActive: "Never",
    };
    setStaffMembers((prev) => [...prev, newStaff]);
    showToast("success", `Staff member "${newStaff.name}" added.`);
  };

  const updateStaffPermissions = (id: string, permissions: Record<string, boolean>) => {
    setStaffMembers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, permissions } : s))
    );
    showToast("success", "Staff permissions saved.");
  };

  const updateStaffStatus = (id: string, status: StaffStatus) => {
    const target = staffMembers.find((s) => s.id === id);
    if (target && isPrimaryAdmin(target)) {
      showToast("error", "The Primary Super Admin (Muhammad Hamdan) is protected and cannot be deactivated.");
      return;
    }

    setStaffMembers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );

    if (isSupabaseConfigured()) {
      dbService.updateStaffProfileStatus(id, status.toLowerCase()).catch(() => {});
    }

    showToast("success", `Staff member ${target?.name || ""} status set to ${status}.`);
  };

  const updateStaffMember = (id: string, updates: Partial<StaffMember>) => {
    setStaffMembers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    showToast("success", "Staff profile updated.");
  };

  const deleteStaffMember = (id: string) => {
    const target = staffMembers.find((s) => s.id === id);
    if (target && isPrimaryAdmin(target)) {
      showToast("error", "The Primary Super Admin (Muhammad Hamdan) is protected and cannot be removed.");
      return;
    }
    setStaffMembers((prev) => prev.filter((s) => s.id !== id));
    showToast("info", `Staff member ${target?.name || ""} removed successfully.`);
  };

  // Store Settings & SEO
  const updateStoreSettings = (updates: Partial<StoreSettings>) => {
    setStoreSettings((prev) => ({ ...prev, ...updates }));
    showToast("success", "Store settings saved.");
  };

  const updateSeoEntry = (id: string, updates: Partial<SeoEntry>) => {
    setSeoEntries((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    showToast("success", "SEO metadata updated.");
  };

  return (
    <AdminDataContext.Provider
      value={{
        products,
        categories,
        collections,
        orders,
        payments,
        customers,
        inventoryLogs,
        coupons,
        shippingMethods,
        reviews,
        homepageConfig,
        campaigns,
        notifications,
        emailTemplates,
        abandonedCarts,
        staffMembers,
        storeSettings,
        seoEntries,
        toasts,
        addProduct,
        updateProduct,
        deleteProduct,
        bulkDeleteProducts,
        bulkToggleProductStatus,
        duplicateProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addCollection,
        updateCollection,
        deleteCollection,
        addOrder,
        generateOrderNumber,
        generateTrackingId,
        updateOrderStatus,
        updateOrderShipping,
        updatePaymentStatus,
        verifyPayment,
        rejectPayment,
        markCodCollected,
        adjustStock,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        updateShippingMethod,
        updateReviewStatus,
        deleteReview,
        updateHomepageConfig,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        sendCartRecoveryReminder,
        markNotificationRead,
        updateEmailTemplate,
        addStaffMember,
        updateStaffPermissions,
        updateStaffStatus,
        updateStaffMember,
        deleteStaffMember,
        updateStoreSettings,
        updateSeoEntry,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error("useAdminData must be used within an AdminDataProvider");
  }
  return context;
};
