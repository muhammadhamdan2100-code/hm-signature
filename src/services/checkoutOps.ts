import { supabase } from "../lib/supabase";
import { formatPKR } from "../utils/currency";

export interface PlaceOrderItem {
  variant_id: string;
  quantity: number;
}

export interface PlaceOrderInput {
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: { street: string; city: string; state: string; zip: string; country: string };
  paymentMethod: string;
  couponCode?: string | null;
  items: PlaceOrderItem[];
  countryCode?: string | null;
  currency?: string;
}

export interface PlaceOrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  subtotal?: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  total?: number;
  currency?: string;
  currencyRateToBase?: number;
  totalInCurrency?: number;
  destinationCountry?: string;
  error?: string;
}

// All money, stock and coupon decisions are made by the database. The client
// sends variant ids and quantities only.
//
// place_order allocates "HMS-<date>-<4 digits>" inside one transaction. Two
// same-day orders can draw the same number, which aborts the whole function with
// a duplicate-key error and wrote nothing, so that one code is retried.
export async function placeOrderRpc(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const payload = {
    p_customer_id: input.customerId,
    p_customer_name: input.customerName,
    p_customer_email: input.customerEmail,
    p_customer_phone: input.customerPhone,
    p_shipping_address: input.shippingAddress,
    p_payment_method: input.paymentMethod,
    p_coupon_code: input.couponCode?.trim() ? input.couponCode.trim().toUpperCase() : null,
    p_items: input.items,
    p_country_code: input.countryCode?.trim() ? input.countryCode.trim().toUpperCase() : null,
    p_currency: input.currency ?? "PKR",
  };

  let data: any = null;
  let error: any = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await supabase.rpc("place_order", payload);
    data = result.data;
    error = result.error;
    if (!error || error.code !== "23505") break;
  }

  if (error) {
    return { success: false, error: error.message };
  }
  if (!data?.order_id) {
    return { success: false, error: "The order could not be registered. Please try again." };
  }
  return {
    success: true,
    orderId: data.order_id,
    orderNumber: data.order_number,
    subtotal: Number(data.subtotal ?? 0),
    discount: Number(data.discount ?? 0),
    shipping: Number(data.shipping ?? 0),
    tax: Number(data.tax ?? 0),
    total: Number(data.total ?? 0),
    currency: String(data.currency ?? "PKR"),
    currencyRateToBase: Number(data.currency_rate_to_base ?? 1),
    totalInCurrency: data.total_in_currency === null || data.total_in_currency === undefined
      ? undefined
      : Number(data.total_in_currency),
    destinationCountry: data.destination_country ? String(data.destination_country) : undefined,
  };
}

export async function submitPaymentProofRpc(
  orderId: string,
  evidence: { reference?: string; proofPath?: string; note?: string }
): Promise<{ success: boolean; paymentStatus?: string; error?: string }> {
  const { data, error } = await supabase.rpc("submit_payment_proof", {
    p_order_id: orderId,
    p_reference: evidence.reference?.trim() || null,
    p_proof_path: evidence.proofPath || null,
    p_note: evidence.note || null,
  });
  if (error) return { success: false, error: error.message };
  return { success: Boolean(data?.success), paymentStatus: data?.payment_status };
}

export async function setOrderGiftOptionsRpc(
  orderId: string,
  isGiftWrap: boolean,
  giftMessage?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc("set_order_gift_options", {
    p_order_id: orderId,
    p_is_gift_wrap: isGiftWrap,
    p_gift_message: giftMessage?.trim() ? giftMessage.trim() : null,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export interface CouponPreview {
  code: string;
  valid: boolean;
  type?: "percentage" | "fixed";
  value?: number;
  minSpend?: number;
  maxDiscount?: number;
  reason?: string;
}

// Real coupon lookup for the cart display. The authoritative discount is still
// recalculated by place_order; this only avoids promising a discount the
// server would refuse.
export async function previewCoupon(code: string, subtotal: number): Promise<CouponPreview> {
  const clean = code.trim().toUpperCase();
  if (!clean) return { code, valid: false, reason: "Enter a promotion code." };

  const { data, error } = await supabase
    .from("coupons")
    .select("code, type, value, min_spend, max_discount, start_date, end_date, usage_limit, used_count, per_user_limit, active")
    .eq("code", clean)
    .maybeSingle();

  if (error || !data) return { code, valid: false, reason: `The promotion code ${clean} is not recognised.` };

  const now = Date.now();
  if (!data.active) return { code, valid: false, reason: `The promotion ${data.code} is no longer active.` };
  if (data.start_date && new Date(data.start_date).getTime() > now) {
    return { code, valid: false, reason: `The promotion ${data.code} is not active yet.` };
  }
  if (data.end_date && new Date(data.end_date).getTime() < now) {
    return { code, valid: false, reason: `The promotion ${data.code} has expired.` };
  }
  if (data.usage_limit != null && data.used_count >= data.usage_limit) {
    return { code, valid: false, reason: `The promotion ${data.code} has reached its usage limit.` };
  }
  if (data.min_spend != null && subtotal < Number(data.min_spend)) {
    return { code, valid: false, reason: `A minimum spend of ${formatPKR(Number(data.min_spend))} applies to ${data.code}.` };
  }

  return {
    code: data.code,
    valid: true,
    type: data.type,
    value: Number(data.value),
    minSpend: data.min_spend != null ? Number(data.min_spend) : undefined,
    maxDiscount: data.max_discount != null ? Number(data.max_discount) : undefined,
  };
}
