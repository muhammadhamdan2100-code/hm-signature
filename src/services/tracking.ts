import { supabase } from "../lib/supabase";

export interface TrackingEvent {
  status: string;
  note: string;
  date: string;
}

export interface TrackingItem {
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image?: string;
}

export interface TrackingResult {
  found: boolean;
  reason?: string;
  orderNumber?: string;
  placedAt?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  total?: number;
  courier?: string;
  trackingId?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  city?: string;
  isGiftWrap?: boolean;
  giftMessage?: string;
  items: TrackingItem[];
  timeline: TrackingEvent[];
  shipmentStatus?: string;
}

const fmt = (iso?: string | null) => (iso ? String(iso).replace("T", " ").slice(0, 16) : "");

// Server-side projection: the RPC never returns internal admin fields.
export async function lookupOrderTracking(lookup: string, email?: string): Promise<TrackingResult> {
  const { data, error } = await supabase.rpc("get_order_tracking", {
    p_lookup: lookup,
    p_email: email || null,
  });

  if (error) {
    console.warn("lookupOrderTracking:", error.message);
    return { found: false, reason: "error", items: [], timeline: [] };
  }
  if (!data?.found) {
    return { found: false, reason: data?.reason || "not_found", items: [], timeline: [] };
  }

  return {
    found: true,
    orderNumber: data.order_number,
    placedAt: fmt(data.placed_at),
    status: data.status,
    paymentStatus: data.payment_status,
    paymentMethod: data.payment_method,
    total: Number(data.total ?? 0),
    courier: data.courier || undefined,
    trackingId: data.tracking_id || undefined,
    trackingUrl: data.tracking_url || data.shipment?.tracking_url || undefined,
    estimatedDelivery: data.estimated_delivery || data.shipment?.estimated_delivery || undefined,
    city: data.city || undefined,
    isGiftWrap: Boolean(data.is_gift_wrap),
    giftMessage: data.gift_message || undefined,
    shipmentStatus: data.shipment?.status || undefined,
    items: (data.items || []).map((i: any) => ({
      name: i.name,
      size: i.size,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unit_price),
      lineTotal: Number(i.line_total),
      image: i.image || undefined,
    })),
    timeline: (data.timeline || []).map((t: any) => ({
      status: t.status,
      note: t.note || "",
      date: fmt(t.date),
    })),
  };
}

export async function saveCustomerOrderNotes(
  orderId: string,
  customerNotes: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc("update_order_notes", {
    p_order_id: orderId,
    p_customer_notes: customerNotes,
    p_admin_notes: null,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
