import { createClient } from "@supabase/supabase-js";

// Read Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy-hm-signature.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key-12345";

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("dummy")
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Interfaces
export interface DBProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: "customer" | "super_admin" | "admin" | "manager" | "order_manager" | "content_manager" | "support" | string;
  status: "active" | "inactive" | "suspended" | string;
  last_sign_in_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DBProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  full_description?: string;
  price: number;
  sale_price?: number;
  stock: number;
  low_stock_threshold: number;
  category_id?: string;
  collection_id?: string;
  gender: "men" | "women" | "unisex";
  fragrance_type: string;
  size: string;
  concentration: string;
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  images: string[];
  photos: string[];
  featured: boolean;
  bestseller: boolean;
  new_arrival: boolean;
  active: boolean;
  seo_title?: string;
  seo_description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DBCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  active: boolean;
}

export interface DBCollection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  banner_url?: string;
  featured: boolean;
  active: boolean;
}

export interface DBOrder {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: Record<string, any>;
  status: "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | "Refunded";
  payment_status: "Pending" | "Paid" | "Failed" | "Refunded";
  payment_method: string;
  stripe_session_id?: string;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  total: number;
  coupon_code?: string;
  courier?: string;
  tracking_number?: string;
  shipping_status?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface DBReview {
  id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  comment: string;
  status: "Approved" | "Pending" | "Rejected";
  created_at: string;
}

export interface DBCoupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_spend?: number;
  max_discount?: number;
  start_date?: string;
  end_date?: string;
  usage_limit?: number;
  used_count: number;
  active: boolean;
}

export interface DBUserAddress {
  id: string;
  user_id: string;
  title: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

// Data Access Service with Supabase + Local Fallback Sync
export const dbService = {
  // PROFILES
  async getUserProfile(userId: string): Promise<DBProfile | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (!error && data) return data as DBProfile;
    }
    return null;
  },

  async getStaffProfiles(): Promise<DBProfile[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("role", "customer")
        .order("created_at", { ascending: true });
      if (!error && data) return data as DBProfile[];
    }
    return [];
  },

  async createOrUpdateProfile(profile: Partial<DBProfile> & { id: string }): Promise<DBProfile | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("profiles")
        .upsert(profile)
        .select()
        .single();
      if (!error && data) return data as DBProfile;
    }
    return null;
  },

  async updateStaffProfileStatus(id: string, status: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from("profiles").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      return !error;
    }
    return true;
  },

  async updateStaffProfileRole(id: string, role: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from("profiles").update({ role, updated_at: new Date().toISOString() }).eq("id", id);
      return !error;
    }
    return true;
  },

  // PRODUCTS
  async getProducts(): Promise<DBProduct[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (!error && data) return data as DBProduct[];
    }
    return [];
  },

  async createProduct(productData: Partial<DBProduct>): Promise<DBProduct | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from("products").insert([productData]).select().single();
      if (!error && data) return data as DBProduct;
    }
    return null;
  },

  async updateProduct(id: string, updates: Partial<DBProduct>): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from("products").update(updates).eq("id", id);
      return !error;
    }
    return true;
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      return !error;
    }
    return true;
  },

  // ORDERS
  async getOrders(): Promise<DBOrder[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (!error && data) return data as DBOrder[];
    }
    return [];
  },

  async getUserOrders(userId: string, userEmail: string): Promise<DBOrder[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or(`customer_id.eq.${userId},customer_email.eq.${userEmail}`)
        .order("created_at", { ascending: false });
      if (!error && data) return data as DBOrder[];
    }
    return [];
  },

  async createOrder(orderPayload: Partial<DBOrder>): Promise<DBOrder | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from("orders").insert([orderPayload]).select().single();
      if (!error && data) return data as DBOrder;
    }
    return null;
  },

  async updateOrderStatus(id: string, status: DBOrder["status"], shippingStatus?: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const payload: Partial<DBOrder> = { status };
      if (shippingStatus) payload.shipping_status = shippingStatus;
      const { error } = await supabase.from("orders").update(payload).eq("id", id);
      return !error;
    }
    return true;
  },

  // REVIEWS
  async getReviews(): Promise<DBReview[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (!error && data) return data as DBReview[];
    }
    return [];
  },

  async createReview(review: Partial<DBReview>): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from("reviews").insert([review]);
      return !error;
    }
    return true;
  },

  async updateReviewStatus(id: string, status: DBReview["status"]): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
      return !error;
    }
    return true;
  },

  // COUPONS
  async validateCoupon(code: string): Promise<DBCoupon | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("active", true)
        .single();
      if (!error && data) return data as DBCoupon;
    }
    return null;
  }
};
