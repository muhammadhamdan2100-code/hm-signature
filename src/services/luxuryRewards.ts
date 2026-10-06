// Phase 8 (8.5, 8.6, 8.7, 8.10, 8.11): the customer's own rewards, cards and lists.
//
// Every number here is read back from the server after a write. A balance, a discount or a
// redemption is never kept in the page state as the answer, because the database is the thing that
// decides whether it is allowed.

import { supabase } from "../lib/supabase";

export interface LoyaltyState {
  configured: boolean;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  expiringIn90Days: number;
  expired: number;
  tier: string;
  lifetimeSpend: number;
}

export interface LedgerEntry {
  id: string;
  points: number;
  entryType: string;
  reason: string | null;
  occurredAt: string;
  expiresAt: string | null;
}

export interface GiftCardState {
  found: boolean;
  status?: string;
  balance?: number;
  currency?: string;
  expiresAt?: string | null;
  expired?: boolean;
}

export interface AppliedResult {
  success: boolean;
  error?: string;
  applied?: number;
  orderTotal?: number;
  remainingOnCard?: number;
  cardStatus?: string;
  points?: number;
  discount?: number;
  balance?: number;
}

function message(error: unknown, fallback: string): string {
  const text = typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : "";
  return text.trim() || fallback;
}

export async function fetchMyLoyalty(): Promise<{ state: LoyaltyState | null; error?: string }> {
  const { data, error } = await supabase.rpc("my_loyalty");
  if (error) return { state: null, error: message(error, "Loyalty detail is unavailable.") };
  const raw = (data || {}) as Record<string, unknown>;
  return {
    state: {
      configured: raw.configured === true,
      balance: Number(raw.balance ?? 0),
      lifetimeEarned: Number(raw.lifetimeEarned ?? 0),
      lifetimeRedeemed: Number(raw.lifetimeRedeemed ?? 0),
      expiringIn90Days: Number(raw.expiringIn90Days ?? 0),
      expired: Number(raw.expired ?? 0),
      tier: String(raw.tier ?? "member"),
      lifetimeSpend: Number(raw.lifetimeSpend ?? 0),
    },
  };
}

export async function fetchMyLedger(limit = 20): Promise<{ entries: LedgerEntry[]; error?: string }> {
  const { data, error } = await supabase
    .from("loyalty_ledger")
    .select("id, points, entry_type, reason, occurred_at, expires_at")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) return { entries: [], error: message(error, "Your points history is unavailable.") };
  return {
    entries: (data || []).map((row) => ({
      id: String(row.id),
      points: Number(row.points),
      entryType: String(row.entry_type),
      reason: row.reason ? String(row.reason) : null,
      occurredAt: String(row.occurred_at),
      expiresAt: row.expires_at ? String(row.expires_at) : null,
    })),
  };
}

export async function redeemLoyaltyPoints(orderId: string, points: number): Promise<AppliedResult> {
  const { data, error } = await supabase.rpc("redeem_loyalty_points", { p_order_id: orderId, p_points: points });
  if (error) return { success: false, error: message(error, "Those points could not be applied.") };
  const raw = (data || {}) as Record<string, unknown>;
  return {
    success: Boolean(raw.success),
    points: Number(raw.points ?? points),
    discount: Number(raw.discount ?? 0),
    orderTotal: Number(raw.orderTotal ?? 0),
    balance: Number(raw.balance ?? 0),
  };
}

export async function checkGiftCard(code: string): Promise<GiftCardState> {
  const { data, error } = await supabase.rpc("gift_card_state", { p_code: code });
  if (error) return { found: false };
  const raw = (data || {}) as Record<string, unknown>;
  return {
    found: raw.found === true,
    status: raw.status ? String(raw.status) : undefined,
    balance: raw.balance === undefined ? undefined : Number(raw.balance),
    currency: raw.currency ? String(raw.currency) : undefined,
    expiresAt: raw.expiresAt ? String(raw.expiresAt) : null,
    expired: raw.expired === true,
  };
}

export async function applyGiftCard(orderId: string, code: string): Promise<AppliedResult> {
  const { data, error } = await supabase.rpc("redeem_gift_card", { p_order_id: orderId, p_code: code.toUpperCase().trim() });
  if (error) return { success: false, error: message(error, "That gift card could not be applied.") };
  const raw = (data || {}) as Record<string, unknown>;
  return {
    success: Boolean(raw.success),
    applied: Number(raw.applied ?? 0),
    orderTotal: Number(raw.orderTotal ?? 0),
    remainingOnCard: Number(raw.remainingOnCard ?? 0),
    cardStatus: raw.status ? String(raw.cardStatus) : String(raw.cardStatus ?? ""),
  };
}

export async function releaseGiftCard(orderId: string): Promise<AppliedResult> {
  const { data, error } = await supabase.rpc("release_gift_card", { p_order_id: orderId });
  if (error) return { success: false, error: message(error, "The gift card could not be removed.") };
  const raw = (data || {}) as Record<string, unknown>;
  return { success: Boolean(raw.success), applied: Number(raw.restored ?? 0) };
}

export interface MyGiftCard {
  id: string;
  codeMasked: string;
  balance: number;
  currency: string;
  status: string;
  senderName: string | null;
  message: string | null;
  deliveryDate: string | null;
  expiresAt: string | null;
}

export async function fetchMyGiftCards(): Promise<{ cards: MyGiftCard[]; error?: string }> {
  const { data, error } = await supabase
    .from("gift_cards")
    .select("id, code, balance, currency, status, sender_name, message, delivery_date, expires_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return { cards: [], error: message(error, "Your gift cards are unavailable.") };
  return {
    cards: (data || []).map((row) => {
      const code = String(row.code || "");
      const tail = code.slice(-4);
      return {
        id: String(row.id),
        // Only the last group is shown; the full code is a bearer instrument.
        codeMasked: tail ? `•••• ${tail}` : code,
        balance: Number(row.balance ?? 0),
        currency: String(row.currency ?? "PKR"),
        status: String(row.status ?? "Created"),
        senderName: row.sender_name ? String(row.sender_name) : null,
        message: row.message ? String(row.message) : null,
        deliveryDate: row.delivery_date ? String(row.delivery_date) : null,
        expiresAt: row.expires_at ? String(row.expires_at) : null,
      };
    }),
  };
}

export interface MyPreOrder {
  id: string;
  status: string;
  quantity: number;
  expectedReleaseOn: string | null;
  productName: string | null;
  productSlug: string | null;
}

export async function fetchMyPreOrders(): Promise<{ preOrders: MyPreOrder[]; error?: string }> {
  const { data, error } = await supabase
    .from("pre_orders")
    .select("id, status, quantity, expected_release_on, product:products(name, slug)")
    .neq("status", "Cancelled")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return { preOrders: [], error: message(error, "Your pre-orders are unavailable.") };
  const related = data as unknown as {
    id: string;
    status: string;
    quantity: number;
    expected_release_on: string | null;
    product?: { name: string; slug: string } | null;
  }[];
  return {
    preOrders: (related || []).map((row) => ({
      id: String(row.id),
      status: String(row.status),
      quantity: Number(row.quantity ?? 1),
      expectedReleaseOn: row.expected_release_on ? String(row.expected_release_on) : null,
      productName: row.product?.name ? String(row.product.name) : null,
      productSlug: row.product?.slug ? String(row.product.slug) : null,
    })),
  };
}

export async function reservePreOrder(input: {
  productId: string;
  variantId?: string | null;
  quantity: number;
  email: string;
}): Promise<{ success: boolean; error?: string; expectedReleaseOn?: string | null }> {
  const { data, error } = await supabase.rpc("reserve_pre_order", {
    p_product_id: input.productId,
    p_variant_id: input.variantId || null,
    p_quantity: input.quantity,
    p_email: input.email,
  });
  if (error) return { success: false, error: message(error, "This pre-order could not be reserved.") };
  const raw = (data || {}) as Record<string, unknown>;
  return {
    success: Boolean(raw.success),
    expectedReleaseOn: raw.expectedReleaseOn ? String(raw.expectedReleaseOn) : null,
  };
}

export async function cancelMyPreOrder(id: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("cancel_my_pre_order", { p_pre_order_id: id });
  if (error) return { success: false, error: message(error, "This pre-order could not be cancelled.") };
  return { success: Boolean((data as { success?: boolean })?.success) };
}

export async function joinWaitlist(input: {
  productId: string;
  variantId?: string | null;
  email: string;
  countryCode?: string | null;
  currency?: string | null;
}): Promise<{ success: boolean; alreadyOnList?: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("join_waitlist", {
    p_product_id: input.productId,
    p_variant_id: input.variantId || null,
    p_email: input.email,
    p_country_code: input.countryCode || null,
    p_currency: input.currency || null,
  });
  if (error) return { success: false, error: message(error, "You could not be added to the list.") };
  const raw = (data || {}) as Record<string, unknown>;
  return { success: Boolean(raw.success), alreadyOnList: raw.alreadyOnList === true };
}

export async function leaveWaitlist(id: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("leave_waitlist", { p_waitlist_id: id });
  if (error) return { success: false, error: message(error, "You could not be removed from the list.") };
  return { success: Boolean((data as { success?: boolean })?.success) };
}

export interface WaitlistEntry {
  id: string;
  productId: string;
  status: string;
}

export async function fetchMyWaitlist(): Promise<{ entries: WaitlistEntry[]; error?: string }> {
  const { data, error } = await supabase
    .from("waitlists")
    .select("id, product_id, variant_id, status")
    .in("status", ["Waiting", "Notified"])
    .limit(50);
  if (error) return { entries: [], error: message(error, "Your waitlist is unavailable.") };
  return {
    entries: (data || []).map((row) => ({
      id: String(row.id),
      productId: String(row.product_id),
      status: String(row.status ?? "Waiting"),
    })),
  };
}
