import { supabase } from "../lib/supabase";
import type { Order, OrderItem, OrderStatus, OrderTimelineItem, PaymentMethod, PaymentStatus } from "../admin/context/AdminDataContext";
import type { RefundRecord } from "./adminOps";

export interface CustomerOrderView extends Order {
  trackingUrl?: string;
  estimatedDelivery?: string;
  shipmentStatus?: string;
  refundedTotal: number;
  refundRecords: { amount: number; status: string; reference?: string; date: string }[];
  customerNotes?: string;
  canCancel: boolean;
  placedAt: string;
}

const fmtDateTime = (iso?: string | null) => (iso ? String(iso).replace("T", " ").slice(0, 16) : "");
const fmtDate = (iso?: string | null) => (iso ? String(iso).slice(0, 10) : "");

const normalizeAddress = (raw: any) => ({
  street: raw?.street || "",
  city: raw?.city || "",
  state: raw?.state || "Punjab",
  zip: raw?.zip || "",
  country: raw?.country || "Pakistan",
});

const shipmentToShippingStatus = (s?: string | null): Order["shippingStatus"] => {
  switch (s) {
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

// RLS already restricts these rows to the signed-in customer (orders.customer_id
// = auth.uid()), so no email or name matching is used here.
export async function fetchCustomerOrdersFromDB(): Promise<CustomerOrderView[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `*,
       order_items (id, product_id, variant_id, product_name, variant_size, sku, unit_price, quantity, line_total, image_url),
       payments (id, status, method, reference_id, proof_file_path, proof_note, amount),
       shipments (status, tracking_url, estimated_delivery, courier_name, tracking_number),
       order_status_history (status, note, created_at),
       refunds (id, payment_id, order_id, amount, status, refund_reference, reason, created_at, refunded_at)`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("fetchCustomerOrdersFromDB:", error.message);
    return [];
  }

  return (data || []).map((o: any) => {
    const payment = Array.isArray(o.payments) ? o.payments[0] : o.payments;
    // shipments.order_id is UNIQUE → PostgREST embeds a to-one object.
    const shipment = Array.isArray(o.shipments) ? o.shipments[0] : o.shipments;
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

    const timeline: OrderTimelineItem[] = (o.order_status_history || []).map((h: any) => ({
      status: (h.status || "Pending") as OrderStatus,
      date: fmtDateTime(h.created_at),
      note: h.note || undefined,
    }));

    const refundRows: RefundRecord[] = (o.refunds || []).map((r: any) => ({
      id: r.id,
      paymentId: r.payment_id,
      orderId: r.order_id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      amount: Number(r.amount),
      currency: "PKR",
      status: r.status,
      reference: r.refund_reference || undefined,
      reason: r.reason || undefined,
      date: fmtDateTime(r.created_at),
      refundedAt: r.refunded_at || undefined,
    }));

    const refundedTotal = refundRows
      .filter((r) => r.status === "processed" || r.status === "pending")
      .reduce((acc, r) => acc + r.amount, 0);

    return {
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      customerPhone: o.customer_phone,
      shippingAddress: normalizeAddress(o.shipping_address),
      billingAddress: normalizeAddress(o.shipping_address),
      items,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount_amount || 0),
      shippingFee: Number(o.shipping_cost || 0),
      total: Number(o.total),
      status: o.status as OrderStatus,
      shippingStatus: shipmentToShippingStatus(shipment?.status),
      paymentStatus: (payment?.status || o.payment_status || "Pending") as PaymentStatus,
      paymentMethod: o.payment_method as PaymentMethod,
      paymentReference: payment?.reference_id || undefined,
      paymentProofUrl: o.payment_proof_url || payment?.proof_file_path || undefined,
      paymentProofNote: payment?.proof_note || undefined,
      courier: o.courier_name || shipment?.courier_name || undefined,
      trackingNumber: o.tracking_id || shipment?.tracking_number || undefined,
      timeline,
      createdAt: fmtDate(o.created_at),
      placedAt: fmtDateTime(o.created_at),
      trackingUrl: o.tracking_url || shipment?.tracking_url || undefined,
      estimatedDelivery: o.estimated_delivery || shipment?.estimated_delivery || undefined,
      shipmentStatus: shipment?.status || undefined,
      refundedTotal,
      refundRecords: refundRows.map((r) => ({
        amount: r.amount,
        status: r.status,
        reference: r.reference,
        date: r.date,
      })),
      customerNotes: o.customer_notes || undefined,
      canCancel: (o.status === "Pending" || o.status === "Confirmed")
        && !["Paid", "Verified", "Refunded"].includes(o.payment_status),
    };
  });
}

export interface SelfCancelResult {
  success: boolean;
  alreadyCancelled?: boolean;
  restocked?: boolean;
  error?: string;
}

export async function cancelSelfOrderInDB(orderId: string, reason?: string): Promise<SelfCancelResult> {
  const { data, error } = await supabase.rpc("cancel_self_order", {
    p_order_id: orderId,
    p_reason: reason || null,
  });
  if (error) return { success: false, error: error.message };
  return {
    success: Boolean(data?.success),
    alreadyCancelled: Boolean(data?.already_cancelled),
    restocked: Boolean(data?.restocked),
  };
}
