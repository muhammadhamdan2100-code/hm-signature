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
  if (orderIds.length > 0) {
    const { data: hist } = await supabase
      .from("order_status_history")
      .select("order_id, status, note, created_at")
      .in("order_id", orderIds)
      .order("created_at", { ascending: true });
    historyRows = hist || [];
  }

  return data.map((o: any) => {
    const payment = o.payments?.[0];
    const shipment = o.shipments?.[0];
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
      status: o.status as OrderStatus,
      shippingStatus: mapShipmentToShippingStatus(shipment?.status),
      paymentStatus: (payment?.status || o.payment_status || "Pending") as PaymentStatus,
      paymentMethod: o.payment_method as Order["paymentMethod"],
      paymentReference: payment?.reference_id || undefined,
      paymentProofUrl: o.payment_proof_url || payment?.proof_file_path || undefined,
      paymentProofNote: payment?.proof_note || undefined,
      courier: o.courier_name || undefined,
      trackingNumber: o.tracking_id || undefined,
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

export async function updateOrderShippingInDB(
  orderId: string,
  courier: string,
  trackingNumber: string,
  shippingStatus: Order["shippingStatus"]
): Promise<boolean> {
  const { error } = await supabase
    .from("orders")
    .update({
      courier_name: courier || null,
      tracking_id: trackingNumber || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) {
    console.error("updateOrderShippingInDB orders:", error.message);
    return false;
  }

  if (trackingNumber) {
    const { error: shipErr } = await supabase
      .from("shipments")
      .upsert(
        {
          order_id: orderId,
          courier_name: courier || "Courier",
          tracking_number: trackingNumber,
          status: mapShippingStatusToShipment(shippingStatus),
        },
        { onConflict: "order_id" }
      );
    if (shipErr) console.error("updateOrderShippingInDB shipments:", shipErr.message);
  }
  return true;
}

export async function uploadPaymentProofInDB(
  orderId: string,
  proofPath: string,
  note?: string
): Promise<boolean> {
  const { error: payErr } = await supabase
    .from("payments")
    .update({
      status: "Verification Pending",
      proof_file_path: proofPath || null,
      proof_note: note || "Payment receipt screenshot attached by customer",
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId);
  if (payErr) {
    console.error("uploadPaymentProofInDB payments:", payErr.message);
    return false;
  }
  await supabase
    .from("orders")
    .update({ payment_status: "Verification Pending", updated_at: new Date().toISOString() })
    .eq("id", orderId);
  await supabase.from("order_status_history").insert([
    { order_id: orderId, status: "Pending", note: "Payment proof uploaded — verification pending" },
  ]);
  return true;
}

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
    perCustomerLimit: 1,
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
