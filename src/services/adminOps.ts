import { supabase } from "../lib/supabase";
import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderTimelineItem,
  PaymentRecord,
  PaymentStatus,
  Customer,
  ReviewItem,
  Coupon,
  ShippingMethod,
  AbandonedCart,
} from "../admin/context/AdminDataContext";

const fmtDate = (iso?: string | null) => (iso ? iso.replace("T", " ").slice(0, 16) : new Date().toISOString().replace("T", " ").slice(0, 16));

const mapShipmentToShippingStatus = (
  shipmentStatus?: string | null
): Order["shippingStatus"] => {
  switch (shipmentStatus) {
    case "Preparing":
    case "Dispatched":
      return "Processing";
    case "In Transit":
    case "Out for Delivery":
    case "Failed Attempt":
      return "In Transit";
    case "Delivered":
      return "Delivered";
    case "Returned":
      return "Returned";
    default:
      return "Unfulfilled";
  }
};

const mapShippingStatusToShipment = (
  shippingStatus: Order["shippingStatus"]
): string => {
  switch (shippingStatus) {
    case "Processing":
      return "Dispatched";
    case "In Transit":
      return "In Transit";
    case "Delivered":
      return "Delivered";
    case "Returned":
      return "Returned";
    default:
      return "Preparing";
  }
};

interface RawAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

const normalizeAddress = (raw: RawAddress | null | undefined) => ({
  street: raw?.street || "",
  city: raw?.city || "",
  state: raw?.state || "",
  zip: raw?.zip || "",
  country: raw?.country || "Pakistan",
});

export async function fetchAdminOrdersFromDB(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `*,
       order_items (id, product_id, product_name, variant_size, sku, unit_price, quantity, image_url),
       payments (id, reference_id, proof_file_path, proof_note, status),
       shipments (status)`
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("fetchAdminOrdersFromDB failed:", error?.message);
    return [];
  }

  const orderIds = data.map((o: any) => o.id);
  let historyRows: any[] = [];
  let notesRows: any[] = [];
  if (orderIds.length > 0) {
    const [hist, notes] = await Promise.all([
      supabase
        .from("order_status_history")
        .select("order_id, status, note, created_at")
        .in("order_id", orderIds)
        .order("created_at", { ascending: true }),
      // Internal commentary lives in its own table so a customer reading their own
      // order through RLS can never receive it. Staff-only policy: a customer call
      // simply returns no rows.
      supabase.from("order_internal_notes").select("order_id, notes").in("order_id", orderIds),
    ]);
    historyRows = hist.data || [];
    notesRows = notes.data || [];
  }

  const notesByOrder = new Map<string, string>(
    notesRows.map((n: any) => [n.order_id, n.notes])
  );

  return data.map((o: any) => {
    // payments.order_id is UNIQUE, so PostgREST embeds a to-one object here.
    const payment = Array.isArray(o.payments) ? o.payments[0] : o.payments;
    // shipments.order_id is UNIQUE, so PostgREST embeds a to-one object here, not an array
    const shipment = Array.isArray(o.shipments) ? o.shipments[0] : o.shipments;
    const timeline: OrderTimelineItem[] = historyRows
      .filter((h) => h.order_id === o.id)
      .map((h) => ({
        status: (h.status || "Pending") as OrderStatus,
        date: fmtDate(h.created_at),
        note: h.note || undefined,
      }));

    if (timeline.length === 0) {
      timeline.push({
        status: (o.status || "Pending") as OrderStatus,
        date: fmtDate(o.created_at),
        note: "Order placed",
      });
    }

    const items: OrderItem[] = (o.order_items || []).map((it: any) => ({
      id: it.id,
      productId: it.product_id || "",
      name: it.product_name,
      sku: it.sku,
      size: it.variant_size,
      price: Number(it.unit_price),
      quantity: Number(it.quantity),
      image: it.image_url || "texture-velvet",
    }));

    const address = normalizeAddress(o.shipping_address);

    return {
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      customerPhone: o.customer_phone,
      shippingAddress: address,
      billingAddress: address,
      items,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount_amount || 0),
      shippingFee: Number(o.shipping_cost || 0),
      total: Number(o.total),
      currency: o.currency || "PKR",
      taxAmount: Number(o.tax_amount || 0),
      taxRate: Number(o.tax_rate || 0),
      taxLabel: o.tax_label || undefined,
      destinationCountry: o.destination_country ?? null,
      totalInCurrency: o.total_in_currency === null || o.total_in_currency === undefined ? null : Number(o.total_in_currency),
      status: o.status as OrderStatus,
      shippingStatus: mapShipmentToShippingStatus(shipment?.status),
      paymentStatus: (payment?.status || o.payment_status || "Pending") as PaymentStatus,
      paymentMethod: o.payment_method as Order["paymentMethod"],
      paymentReference: payment?.reference_id || undefined,
      paymentProofUrl: o.payment_proof_url || payment?.proof_file_path || undefined,
      paymentProofNote: payment?.proof_note || undefined,
      courier: o.courier_name || undefined,
      trackingNumber: o.tracking_id || undefined,
      trackingUrl: o.tracking_url || shipment?.tracking_url || undefined,
      estimatedDelivery: o.estimated_delivery || shipment?.estimated_delivery || undefined,
      adminNotes: notesByOrder.get(o.id) || undefined,
      customerNotes: o.customer_notes || undefined,
      isGiftWrap: Boolean(o.is_gift_wrap),
      giftMessage: o.gift_message || undefined,
      timeline,
      createdAt: (o.created_at || "").split("T")[0],
    };
  });
}

export async function fetchAdminPaymentsFromDB(): Promise<PaymentRecord[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("fetchAdminPaymentsFromDB failed:", error?.message);
    return [];
  }

  return data.map((p: any) => ({
    id: p.id,
    orderId: p.order_id,
    orderNumber: p.order_number,
    customerName: p.customer_name,
    customerEmail: p.customer_email,
    amount: Number(p.amount),
    method: p.method as PaymentRecord["method"],
    status: p.status as PaymentStatus,
    referenceId: p.reference_id || undefined,
    proofNote: p.proof_note || undefined,
    date: fmtDate(p.created_at),
    verifiedBy: p.verified_by || undefined,
  }));
}

export async function updateOrderStatusInDB(
  orderId: string,
  status: OrderStatus,
  note?: string
): Promise<boolean> {
  if (status === "Cancelled") {
    return cancelOrderInDB(orderId, note);
  }
  const user = (await supabase.auth.getUser()).data.user;
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) {
    console.error("updateOrderStatusInDB:", error.message);
    return false;
  }
  const { error: histErr } = await supabase.from("order_status_history").insert([
    { order_id: orderId, status, note: note || null, changed_by: user?.id || null },
  ]);
  if (histErr) {
    console.error("updateOrderStatusInDB history:", histErr.message);
    return false;
  }
  return true;
}

export async function cancelOrderInDB(orderId: string, note?: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("cancel_order", {
    p_order_id: orderId,
    p_note: note || null,
  });
  if (error) {
    console.error("cancel_order RPC:", error.message);
    return false;
  }
  return Boolean(data?.success);
}

export interface RefundResult {
  success: boolean;
  error?: string;
  fullyRefunded?: boolean;
}

export async function recordRefundInDB(input: {
  paymentId: string;
  amount: number;
  currency?: string;
  reference?: string;
  reason?: string;
  notes?: string;
  status?: "pending" | "processed" | "failed" | "rejected";
}): Promise<RefundResult> {
  const { data, error } = await supabase.rpc("record_refund", {
    p_payment_id: input.paymentId,
    p_amount: input.amount,
    p_currency: input.currency || "PKR",
    p_reference: input.reference || null,
    p_reason: input.reason || null,
    p_notes: input.notes || null,
    p_status: input.status || "processed",
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: Boolean(data?.success), fullyRefunded: Boolean(data?.fully_refunded) };
}

export interface RefundRecord {
  id: string;
  paymentId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  currency: string;
  status: "pending" | "processed" | "failed" | "rejected";
  reference?: string;
  reason?: string;
  notes?: string;
  date: string;
  refundedAt?: string;
}

export async function fetchRefundsFromDB(): Promise<RefundRecord[]> {
  const { data, error } = await supabase
    .from("refunds")
    .select("*, orders ( order_number, customer_name )")
    .order("created_at", { ascending: false });
  if (error || !data) {
    if (error) console.warn("fetchRefundsFromDB:", error.message);
    return [];
  }
  return data.map((r: any) => ({
    id: r.id,
    paymentId: r.payment_id,
    orderId: r.order_id,
    orderNumber: r.orders?.order_number || "—",
    customerName: r.orders?.customer_name || "—",
    amount: Number(r.amount),
    currency: r.currency,
    status: r.status,
    reference: r.refund_reference || undefined,
    reason: r.reason || undefined,
    notes: r.notes || undefined,
    date: fmtDate(r.created_at),
    refundedAt: r.refunded_at || undefined,
  }));
}

export interface TrackingSaveResult {
  success: boolean;
  trackingId?: string;
  error?: string;
}

export async function updateOrderShippingInDB(
  orderId: string,
  courier: string,
  trackingNumber: string,
  shippingStatus: Order["shippingStatus"],
  options?: { trackingUrl?: string; estimatedDelivery?: string; generate?: boolean }
): Promise<TrackingSaveResult> {
  const { data, error } = await supabase.rpc("save_order_tracking", {
    p_order_id: orderId,
    p_courier: courier || null,
    p_tracking_id: trackingNumber || null,
    p_tracking_url: options?.trackingUrl || null,
    p_estimated_delivery: options?.estimatedDelivery || null,
    p_shipping_status: trackingNumber || shippingStatus ? mapShippingStatusToShipment(shippingStatus) : null,
    p_generate: Boolean(options?.generate),
  });

  if (error) {
    console.error("save_order_tracking RPC:", error.message);
    return { success: false, error: error.message };
  }
  return { success: Boolean(data?.success), trackingId: data?.tracking_id || undefined };
}

export async function updateOrderNotesInDB(
  orderId: string,
  notes: { customerNotes?: string; adminNotes?: string }
): Promise<boolean> {
  const { error } = await supabase.rpc("update_order_notes", {
    p_order_id: orderId,
    p_customer_notes: notes.customerNotes ?? null,
    p_admin_notes: notes.adminNotes ?? null,
  });
  if (error) {
    console.error("update_order_notes RPC:", error.message);
    return false;
  }
  return true;
}

export interface AnalyticsSnapshot {
  windowDays: number;
  totals: { orders: number; grossRevenue: number; customers: number; averageOrderValue: number; unitsSold: number; refunded: number };
  cancellations: { cancelledOrders: number; returnedOrders: number; cancelledValue: number };
  refunds: { records: number; processedAmount: number; pendingAmount: number; rejectedOrFailed: number };
  orderStatusDistribution: { status: string; count: number }[];
  paymentMethodDistribution: { method: string; count: number; value: number }[];
  paymentStatusDistribution: { status: string; count: number; value: number }[];
  topProducts: { name: string; units: number; revenue: number; orders: number }[];
  topSizes: { size: string; units: number; revenue: number }[];
  salesTrend: { day: string; orders: number; revenue: number }[];
  customerGrowth: { month: string; signups: number }[];
  couponPerformance: { code: string; uses: number; discountGiven: number; status: string }[];
  inventoryAlerts: { outOfStock: number; lowStock: number; inactive: number };
}

export async function fetchAnalyticsFromDB(days = 90): Promise<AnalyticsSnapshot | null> {
  const { data, error } = await supabase.rpc("get_admin_analytics", { p_days: days });
  if (error || !data) {
    console.warn("fetchAnalyticsFromDB:", error?.message);
    return null;
  }
  return {
    windowDays: data.window_days,
    totals: {
      orders: Number(data.totals?.orders ?? 0),
      grossRevenue: Number(data.totals?.gross_revenue ?? 0),
      customers: Number(data.totals?.customers ?? 0),
      averageOrderValue: Number(data.totals?.average_order_value ?? 0),
      unitsSold: Number(data.totals?.units_sold ?? 0),
      // Only refunds tied to live orders may reduce gross revenue.
      refunded: Number(data.refunds?.processed_on_live_orders ?? data.refunds?.processed_amount ?? 0),
    },
    cancellations: {
      cancelledOrders: Number(data.cancellations?.cancelled_orders ?? 0),
      returnedOrders: Number(data.cancellations?.returned_orders ?? 0),
      cancelledValue: Number(data.cancellations?.cancelled_value ?? 0),
    },
    refunds: {
      records: Number(data.refunds?.records ?? 0),
      processedAmount: Number(data.refunds?.processed_amount ?? 0),
      pendingAmount: Number(data.refunds?.pending_amount ?? 0),
      rejectedOrFailed: Number(data.refunds?.rejected_or_failed ?? 0),
    },
    orderStatusDistribution: (data.order_status_distribution || []).map((r: any) => ({ status: r.status, count: Number(r.count) })),
    paymentMethodDistribution: (data.payment_method_distribution || []).map((r: any) => ({ method: r.method, count: Number(r.count), value: Number(r.value) })),
    paymentStatusDistribution: (data.payment_status_distribution || []).map((r: any) => ({ status: r.status, count: Number(r.count), value: Number(r.value) })),
    topProducts: (data.top_products || []).map((r: any) => ({ name: r.name, units: Number(r.units), revenue: Number(r.revenue), orders: Number(r.orders) })),
    topSizes: (data.top_sizes || []).map((r: any) => ({ size: r.size, units: Number(r.units), revenue: Number(r.revenue) })),
    salesTrend: (data.sales_trend || []).map((r: any) => ({ day: r.day, orders: Number(r.orders), revenue: Number(r.revenue) })),
    customerGrowth: (data.customer_growth || []).map((r: any) => ({ month: r.month, signups: Number(r.signups) })),
    couponPerformance: (data.coupon_performance || []).map((r: any) => ({ code: r.code, uses: Number(r.uses), discountGiven: Number(r.discount_given), status: r.status })),
    inventoryAlerts: {
      outOfStock: Number(data.inventory_alerts?.out_of_stock ?? 0),
      lowStock: Number(data.inventory_alerts?.low_stock ?? 0),
      inactive: Number(data.inventory_alerts?.inactive ?? 0),
    },
  };
}

export interface InventoryPositionRow {
  variantId: string;
  productName: string;
  sku: string;
  size: string;
  onHand: number;
  lowStockThreshold: number;
  active: boolean;
  soldUnits: number;
  restockedUnits: number;
  netAdjustments: number;
  reservedInOpenOrders: number;
  dailyVelocity: number;
  lastMovement: string | null;
}

export async function fetchInventoryPositionFromDB(): Promise<InventoryPositionRow[]> {
  const { data, error } = await supabase.rpc("get_inventory_position");
  if (error || !data) {
    console.warn("fetchInventoryPositionFromDB:", error?.message);
    return [];
  }
  const rows = Array.isArray(data) ? data : [];
  return rows.map((r: any) => ({
    variantId: r.variant_id,
    productName: r.product_name,
    sku: r.sku,
    size: r.size,
    onHand: Number(r.on_hand ?? 0),
    lowStockThreshold: Number(r.low_stock_threshold ?? 0),
    active: r.active !== false,
    soldUnits: Number(r.sold_units ?? 0),
    restockedUnits: Number(r.restocked_units ?? 0),
    netAdjustments: Number(r.net_adjustments ?? 0),
    reservedInOpenOrders: Number(r.reserved_in_open_orders ?? 0),
    dailyVelocity: Number(r.daily_velocity ?? 0),
    lastMovement: r.last_movement || null,
  }));
}

export interface CustomerAggregateRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  joinedDate: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  segment: string;
  wishlistCount: number;
  reviewCount: number;
}

export async function fetchAdminCustomerAggregatesFromDB(): Promise<CustomerAggregateRow[]> {
  const { data, error } = await supabase.rpc("get_admin_customers");
  if (error || !data) {
    console.warn("fetchAdminCustomerAggregatesFromDB:", error?.message);
    return [];
  }
  const rows = Array.isArray(data) ? data : [];
  return rows.map((r: any) => ({
    id: r.id,
    name: r.full_name || "Unnamed client",
    email: r.email || "",
    phone: r.phone || "",
    status: r.status || "active",
    joinedDate: r.joined_at ? String(r.joined_at).slice(0, 10) : "",
    ordersCount: Number(r.orders ?? 0),
    totalSpent: Number(r.total_spent ?? 0),
    lastOrderDate: r.last_order || null,
    segment: r.segment || "New",
    wishlistCount: Number(r.wishlist_count ?? 0),
    reviewCount: Number(r.review_count ?? 0),
  }));
}

export async function fetchAbandonedCartsAggFromDB(hours = 24): Promise<AbandonedCart[]> {
  const { data, error } = await supabase.rpc("get_abandoned_carts", { p_hours: hours });
  if (error || !data) {
    console.warn("fetchAbandonedCartsAggFromDB:", error?.message);
    return [];
  }
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) return [];

  const cartIds = rows.map((r: any) => r.cart_id);
  const { data: itemRows } = await supabase
    .from("cart_items")
    .select("cart_id, quantity, product_variants(size, price, sale_price), products(name)")
    .in("cart_id", cartIds);

  const byCart = new Map<string, AbandonedCart["items"]>();
  (itemRows || []).forEach((it: any) => {
    const list = byCart.get(it.cart_id) || [];
    const variant = Array.isArray(it.product_variants) ? it.product_variants[0] : it.product_variants;
    const product = Array.isArray(it.products) ? it.products[0] : it.products;
    list.push({
      productName: product?.name || "Fragrance",
      quantity: Number(it.quantity ?? 1),
      price: Number(variant ? variant.sale_price ?? variant.price : 0),
    });
    byCart.set(it.cart_id, list);
  });

  return rows.map((r: any) => ({
    id: r.cart_id,
    customerName: r.customer_name || "Registered client",
    customerEmail: r.customer_email || "",
    cartValue: Number(r.cart_value ?? 0),
    items: byCart.get(r.cart_id) || [],
    abandonedDate: r.stalled_since ? String(r.stalled_since).replace("T", " ").slice(0, 16) : "",
    recoveredAt: r.recovered_at || null,
    reminderSentAt: r.reminder_sent_at || null,
    status: r.recovered_at
      ? ("Recovered" as const)
      : r.reminder_sent_at
        ? ("Reminder Sent" as const)
        : ("Pending" as const),
  }));
}

// Customer payment evidence is written by the submit_payment_proof RPC (see
// services/checkoutOps.ts); payments has no customer UPDATE policy, so no
// browser-side proof writer belongs in this file.
async function verifyPaymentRPC(
  paymentId: string,
  newStatus: "Verified" | "Paid" | "Rejected",
  note?: string
): Promise<boolean> {
  const staff = (await supabase.auth.getUser()).data.user;
  const { error } = await supabase.rpc("verify_payment", {
    p_payment_id: paymentId,
    p_staff_id: staff?.id || null,
    p_new_status: newStatus,
    p_note: note || null,
  });
  if (error) {
    console.error("verify_payment RPC:", error.message);
    return false;
  }
  return true;
}

export const verifyPaymentInDB = (id: string, note?: string) =>
  verifyPaymentRPC(id, "Verified", note);
export const rejectPaymentInDB = (id: string, reason?: string) =>
  verifyPaymentRPC(id, "Rejected", reason);
export const markCodCollectedInDB = (id: string) =>
  verifyPaymentRPC(id, "Paid", "Cash collected upon delivery");

export async function fetchAdminCustomersFromDB(): Promise<Customer[]> {
  const [{ data: profiles }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "customer"),
    supabase.from("orders").select("customer_id, customer_email, total, created_at, shipping_address"),
  ]);

  if (!profiles) return [];

  const orderRows = orders || [];
  return profiles.map((p: any) => {
    const myOrders = orderRows.filter(
      (o: any) => o.customer_id === p.id || (o.customer_email || "").toLowerCase() === (p.email || "").toLowerCase()
    );
    const addresses = new Map<string, Customer["addresses"][number]>();
    myOrders.forEach((o: any) => {
      const a = normalizeAddress(o.shipping_address);
      const key = `${a.street}|${a.city}|${a.zip}`;
      if (a.street) addresses.set(key, { ...a, isDefault: addresses.size === 0 });
    });

    return {
      id: p.id,
      name: p.full_name || p.email?.split("@")[0] || "Customer",
      email: p.email,
      phone: p.phone || "",
      avatar: p.avatar_url || undefined,
      ordersCount: myOrders.length,
      totalSpent: myOrders.reduce((acc: number, o: any) => acc + Number(o.total || 0), 0),
      lastOrderDate: myOrders.length
        ? (myOrders[myOrders.length - 1].created_at || "").split("T")[0]
        : "—",
      joinedDate: (p.created_at || "").split("T")[0],
      status: p.status === "active" ? "Active" : p.status === "suspended" ? "Blocked" : "Inactive",
      addresses: Array.from(addresses.values()),
    } as Customer;
  });
}

export async function fetchAdminReviewsFromDB(): Promise<ReviewItem[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, products (name)")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    productId: r.product_id,
    productName: r.products?.name || "Product",
    rating: Number(r.rating),
    title: r.title || "",
    review: r.comment,
    date: fmtDate(r.created_at),
    status: r.status as ReviewItem["status"],
  }));
}

export async function updateReviewStatusInDB(
  id: string,
  status: ReviewItem["status"]
): Promise<boolean> {
  const { error } = await supabase.from("reviews").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  return !error;
}

export async function deleteReviewFromDB(id: string): Promise<boolean> {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  return !error;
}

export async function addReviewToDB(input: {
  productId: string;
  productName?: string;
  rating: number;
  title: string;
  review: string;
}): Promise<boolean> {
  const user = (await supabase.auth.getUser()).data.user;
  let customerName = "Verified Customer";
  let customerEmail = "";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("full_name,email").eq("id", user.id).maybeSingle();
    customerName = profile?.full_name || user.email?.split("@")[0] || customerName;
    customerEmail = profile?.email || user.email || "";
  }
  const { error } = await supabase.from("reviews").insert([
    {
      product_id: input.productId,
      user_id: user?.id || null,
      customer_name: customerName,
      customer_email: customerEmail || "customer@example.com",
      rating: input.rating,
      title: input.title || null,
      comment: input.review,
      status: "Pending",
    },
  ]);
  return !error;
}

export async function fetchAdminCouponsFromDB(): Promise<Coupon[]> {
  const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((c: any) => ({
    id: c.id,
    code: c.code,
    discountType: c.type === "percentage" ? "Percentage" : "Fixed",
    discountValue: Number(c.value),
    minOrder: Number(c.min_spend || 0),
    maxDiscount: c.max_discount != null ? Number(c.max_discount) : undefined,
    usedCount: Number(c.used_count || 0),
    usageLimit: c.usage_limit != null ? Number(c.usage_limit) : 0,
    perCustomerLimit: Number(c.per_user_limit ?? 0),
    startDate: (c.start_date || "").split("T")[0],
    expiryDate: (c.end_date || "").split("T")[0],
    active: c.active,
  }));
}

const couponToRow = (c: Partial<Coupon>) => ({
  code: c.code?.toUpperCase().trim(),
  type: c.discountType === "Percentage" ? "percentage" : "fixed",
  value: c.discountValue,
  min_spend: c.minOrder,
  max_discount: c.maxDiscount ?? null,
  start_date: c.startDate ? new Date(c.startDate).toISOString() : null,
  end_date: c.expiryDate ? new Date(c.expiryDate).toISOString() : null,
  usage_limit: c.usageLimit && c.usageLimit > 0 ? c.usageLimit : null,
  per_user_limit: c.perCustomerLimit && c.perCustomerLimit > 0 ? c.perCustomerLimit : 0,
  active: c.active ?? true,
});

export async function saveCouponToDB(coupon: Partial<Coupon> & { id?: string }): Promise<boolean> {
  const payload = couponToRow(coupon);
  if (coupon.id && /^[0-9a-f]{8}-/i.test(coupon.id)) {
    const { error } = await supabase.from("coupons").update(payload).eq("id", coupon.id);
    return !error;
  }
  const { error } = await supabase.from("coupons").insert([payload]);
  return !error;
}

export async function deleteCouponFromDB(id: string): Promise<boolean> {
  if (!/^[0-9a-f]{8}-/i.test(id)) return true;
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  return !error;
}

const parseEstDays = (text?: string): [number, number] => {
  const m = (text || "").match(/(\d+)\D+(\d+)/);
  if (m) return [Number(m[1]), Number(m[2])];
  const single = (text || "").match(/(\d+)/);
  if (single) return [Number(single[1]), Number(single[1]) + 2];
  return [2, 5];
};

export async function fetchAdminShippingMethodsFromDB(): Promise<ShippingMethod[]> {
  const { data, error } = await supabase.from("shipping_methods").select("*").order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((s: any) => ({
    id: s.id,
    name: s.name,
    description: s.description || s.courier_name || "",
    charge: Number(s.base_cost || 0),
    freeThreshold: Number(s.free_shipping_threshold ?? 10000),
    estimatedDelivery: `${s.estimated_days_min ?? 2}-${s.estimated_days_max ?? 5} business days`,
    active: s.active,
  }));
}

export async function saveShippingMethodToDB(
  method: Partial<ShippingMethod> & { id?: string }
): Promise<boolean> {
  const [minD, maxD] = parseEstDays(method.estimatedDelivery);
  const payload = {
    name: method.name,
    description: method.description ?? null,
    base_cost: method.charge,
    free_shipping_threshold: method.freeThreshold ?? null,
    estimated_days_min: minD,
    estimated_days_max: maxD,
    active: method.active ?? true,
  };
  if (method.id && /^[0-9a-f]{8}-/i.test(method.id)) {
    const { error } = await supabase.from("shipping_methods").update(payload).eq("id", method.id);
    return !error;
  }
  const { error } = await supabase.from("shipping_methods").insert([payload]);
  return !error;
}

export async function deleteShippingMethodFromDB(id: string): Promise<boolean> {
  if (!/^[0-9a-f]{8}-/i.test(id)) return true;
  const { error } = await supabase.from("shipping_methods").delete().eq("id", id);
  return !error;
}

// ─── PAYMENT RECONCILIATION (staff-only RPCs) ───────────────────────────────

export type ReconciliationRow = {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  provider: string;
  method: string;
  paymentReference: string | null;
  expectedAmount: number;
  recordedAmount: number;
  difference: number;
  currency: string;
  providerReference: string | null;
  paymentState: string;
  refundedAmount: number;
  state: string;
  paymentDate: string | null;
  orderCreatedAt: string | null;
};

export type ReconciliationFilter = (typeof RECONCILIATION_STATES)[number];

export const RECONCILIATION_STATES = [
  "matched",
  "missing_payment_record",
  "amount_mismatch",
  "pending",
  "failed",
  "unrefunded_cancellation",
  "refund_discrepancy",
  "review",
] as const;

export async function fetchPaymentReconciliationFromDB(days = 90): Promise<ReconciliationRow[]> {
  const { data, error } = await supabase.rpc("get_payment_reconciliation", {
    p_days: Math.min(Math.max(days, 1), 3650),
  });
  if (error) {
    console.warn("fetchPaymentReconciliationFromDB:", error.message);
    return [];
  }
  return (data as any[]).map((row) => ({
    orderId: row.order_id,
    orderNumber: row.order_number,
    orderStatus: row.order_status,
    paymentStatus: row.payment_status,
    provider: row.provider,
    method: row.method,
    paymentReference: row.payment_reference ?? null,
    expectedAmount: Number(row.expected_amount ?? 0),
    recordedAmount: Number(row.recorded_amount ?? 0),
    difference: Number(row.difference ?? 0),
    currency: row.currency,
    providerReference: row.provider_reference ?? null,
    paymentState: row.payment_state,
    refundedAmount: Number(row.refunded_amount ?? 0),
    state: row.reconciliation_state,
    paymentDate: row.payment_date ?? null,
    orderCreatedAt: row.order_created_at ?? null,
  }));
}

export async function fetchDuplicatePaymentEventsFromDB(
  days = 90
): Promise<{ providerReference: string; occurrences: number; orderNumbers: string }[]> {
  const { data, error } = await supabase.rpc("get_duplicate_payment_events", {
    p_days: Math.min(Math.max(days, 1), 3650),
  });
  if (error) {
    console.warn("fetchDuplicatePaymentEventsFromDB:", error.message);
    return [];
  }
  return (data as any[]).map((row) => ({
    providerReference: row.provider_reference,
    occurrences: Number(row.occurrences ?? 0),
    orderNumbers: row.order_numbers,
  }));
}

// ---------------------------------------------------------------------------
// Phase 6 — follow-up automations and customer segments
// ---------------------------------------------------------------------------

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  delayMinutes: number;
  requiresMarketingConsent: boolean;
  pending: number;
  completed: number;
  skipped: number;
  failed: number;
  lastRun: { at: string | null; status: string; error: string | null } | null;
}

export interface AutomationRunRow {
  id: number;
  workflowId: string | null;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  queued: number;
  processed: number;
  error: string;
}

export interface FollowUpTaskRow {
  id: number;
  workflowId: string;
  status: string;
  dueAt: string;
  attempts: number;
  orderRef: string | null;
  lastError: string;
  skipReason: string | null;
}

export interface CustomerSegmentRow {
  id: string;
  label: string;
  rule: string;
  count: number;
  measuredAt: string;
}

export interface AutomationDashboard {
  workflows: AutomationWorkflow[];
  recentRuns: AutomationRunRow[];
  queue: FollowUpTaskRow[];
  emailQueue: { status: string; count: number }[];
  serverTime: string | null;
}

/**
 * Returns null when the staff-only RPC refused the call, so the page can say
 * "not permitted" instead of showing an empty board that looks like an idle store.
 */
export async function fetchAutomationDashboard(): Promise<AutomationDashboard | null> {
  const { data, error } = await supabase.rpc("get_automation_dashboard");
  if (error) {
    console.warn("fetchAutomationDashboard:", error.message);
    return null;
  }
  const payload = (data ?? {}) as Record<string, any>;
  return {
    workflows: (payload.workflows ?? []).map((w: any) => ({
      id: String(w.id),
      name: String(w.name),
      description: String(w.description),
      enabled: Boolean(w.enabled),
      delayMinutes: Number(w.delayMinutes ?? 0),
      requiresMarketingConsent: Boolean(w.requiresMarketingConsent),
      pending: Number(w.pending ?? 0),
      completed: Number(w.completed ?? 0),
      skipped: Number(w.skipped ?? 0),
      failed: Number(w.failed ?? 0),
      lastRun: w.lastRun
        ? {
            at: w.lastRun.at ?? null,
            status: String(w.lastRun.status ?? ""),
            error: w.lastRun.error ?? null,
          }
        : null,
    })),
    recentRuns: (payload.recentRuns ?? []).map((r: any) => ({
      id: Number(r.id),
      workflowId: r.workflowId ?? null,
      startedAt: String(r.startedAt),
      finishedAt: r.finishedAt ?? null,
      status: String(r.status),
      queued: Number(r.queued ?? 0),
      processed: Number(r.processed ?? 0),
      error: String(r.error ?? ""),
    })),
    queue: (payload.queue ?? []).map((t: any) => ({
      id: Number(t.id),
      workflowId: String(t.workflowId),
      status: String(t.status),
      dueAt: String(t.dueAt),
      attempts: Number(t.attempts ?? 0),
      orderRef: t.orderRef ?? null,
      lastError: String(t.lastError ?? ""),
      skipReason: t.skipReason ?? null,
    })),
    emailQueue: (payload.emailQueue ?? []).map((e: any) => ({
      status: String(e.status),
      count: Number(e.count ?? 0),
    })),
    serverTime: payload.serverTime ?? null,
  };
}

export async function fetchCustomerSegments(): Promise<CustomerSegmentRow[]> {
  const { data, error } = await supabase.rpc("get_customer_segments");
  if (error) {
    console.warn("fetchCustomerSegments:", error.message);
    return [];
  }
  return (data as any[]).map((row) => ({
    id: String(row.segment_id),
    label: String(row.label),
    rule: String(row.rule),
    count: Number(row.customer_count ?? 0),
    measuredAt: String(row.measured_at),
  }));
}

export async function setAutomationWorkflowEnabled(
  workflowId: string,
  enabled: boolean
): Promise<{ ok: boolean; error: string | null }> {
  const { data, error } = await supabase.rpc("set_workflow_enabled", {
    p_workflow_id: workflowId,
    p_enabled: enabled,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  if (data === false) {
    return { ok: false, error: "That workflow no longer exists." };
  }
  return { ok: true, error: null };
}

/** Waiting period in minutes. The database clamps it to 15 minutes – 7 days. */
export async function updateWorkflowTiming(
  workflowId: string,
  delayMinutes: number
): Promise<{ ok: boolean; error: string | null }> {
  const minutes = Math.round(Number(delayMinutes));
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 10080) {
    return { ok: false, error: "Enter a waiting period between 1 and 10080 minutes." };
  }
  const { data, error } = await supabase.rpc("update_workflow_timing", {
    p_workflow_id: workflowId,
    p_delay_minutes: minutes,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  if (data === false) {
    return { ok: false, error: "That workflow no longer exists." };
  }
  return { ok: true, error: null };
}
