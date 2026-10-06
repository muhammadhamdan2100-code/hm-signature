// Phase 8 admin data access.
//
// Reads go through the shopper-visible tables and their own row-level security; every write goes
// through a guarded SECURITY DEFINER function. Nothing here sends a service-role key to the
// browser, and nothing here decides an amount, a balance or a permission — the database does.

import { supabase } from "../lib/supabase";

export interface RecommendationRule {
  signal: string;
  label: string;
  weight: number;
  enabled: boolean;
}

export interface VipTier {
  code: string;
  name: string;
  rank: number;
  minLifetimeSpend: number | null;
  minPoints: number | null;
  benefits: string[];
  enabled: boolean;
}

export interface GiftCardRow {
  id: string;
  code: string;
  currency: string;
  initialAmount: number;
  balance: number;
  status: string;
  recipientName: string | null;
  recipientEmail: string | null;
  senderName: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface PreOrderRow {
  id: string;
  status: string;
  quantity: number;
  email: string;
  expectedReleaseOn: string | null;
  productId: string;
  productName: string | null;
  createdAt: string;
}

export interface WaitlistRow {
  id: string;
  status: string;
  email: string;
  countryCode: string | null;
  currency: string | null;
  productId: string;
  productName: string | null;
  createdAt: string;
  notifiedAt: string | null;
}

export interface DiscoveryTag {
  id: string;
  productId: string;
  productName: string | null;
  kind: string;
  value: string;
}

export interface LedgerRow {
  id: string;
  customerId: string;
  points: number;
  entryType: string;
  reason: string | null;
  occurredAt: string;
}

export interface WriteResult {
  success: boolean;
  error?: string;
  value?: Record<string, unknown>;
}

function toResult(error: { message?: string } | null, data?: unknown): WriteResult {
  if (error) return { success: false, error: error.message || "The change could not be saved." };
  const raw = (data || {}) as Record<string, unknown>;
  return { success: raw.success !== false, error: typeof raw.error === "string" ? raw.error : undefined, value: raw };
}

async function rpc(name: string, args: Record<string, unknown>): Promise<WriteResult> {
  const { data, error } = await supabase.rpc(name, args);
  return toResult(error, data);
}

async function setting(key: string): Promise<Record<string, unknown>> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as Record<string, unknown>) || {};
}

export const fetchPersonalizationConfig = () => setting("personalization_config");
export const fetchGiftFinderConfig = () => setting("gift_finder_config");
export const fetchLoyaltyConfig = () => setting("loyalty_config");
export const fetchGiftCardConfig = () => setting("gift_card_config");

export const savePersonalizationConfig = (config: Record<string, unknown>) =>
  rpc("save_personalization_config", { p_config: config });
export const saveGiftFinderConfig = (config: Record<string, unknown>) =>
  rpc("save_gift_finder_config", { p_config: config });
export const saveLoyaltyConfig = (config: Record<string, unknown>) =>
  rpc("save_loyalty_config", { p_config: config });
export const saveGiftCardConfig = (config: Record<string, unknown>) =>
  rpc("save_gift_card_config", { p_config: config });

export async function fetchRecommendationRules(): Promise<{ rules: RecommendationRule[]; error?: string }> {
  const { data, error } = await supabase
    .from("recommendation_rules")
    .select("signal, label, weight, enabled")
    .order("weight", { ascending: false });
  if (error) return { rules: [], error: error.message };
  return {
    rules: (data || []).map((row) => ({
      signal: String(row.signal),
      label: String(row.label),
      weight: Number(row.weight),
      enabled: row.enabled !== false,
    })),
  };
}

export const saveRecommendationRule = (signal: string, weight: number, enabled: boolean) =>
  rpc("save_recommendation_rule", { p_signal: signal, p_weight: weight, p_enabled: enabled });

export async function fetchVipTiers(): Promise<{ tiers: VipTier[]; error?: string }> {
  const { data, error } = await supabase.from("vip_tiers").select("*").order("rank");
  if (error) return { tiers: [], error: error.message };
  return {
    tiers: (data || []).map((row) => ({
      code: String(row.code),
      name: String(row.name),
      rank: Number(row.rank),
      minLifetimeSpend: row.min_lifetime_spend === null ? null : Number(row.min_lifetime_spend),
      minPoints: row.min_points === null ? null : Number(row.min_points),
      benefits: Array.isArray(row.benefits) ? (row.benefits as string[]) : [],
      enabled: row.enabled !== false,
    })),
  };
}

export const saveVipTier = (tier: VipTier) =>
  rpc("save_vip_tier", {
    p_code: tier.code,
    p_name: tier.name,
    p_rank: tier.rank,
    p_min_lifetime_spend: tier.minLifetimeSpend,
    p_min_points: tier.minPoints,
    p_benefits: tier.benefits,
    p_enabled: tier.enabled,
  });

export async function fetchGiftCards(limit = 50): Promise<{ cards: GiftCardRow[]; error?: string }> {
  const { data, error } = await supabase
    .from("gift_cards")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { cards: [], error: error.message };
  return {
    cards: (data || []).map((row) => ({
      id: String(row.id),
      code: String(row.code),
      currency: String(row.currency),
      initialAmount: Number(row.initial_amount),
      balance: Number(row.balance),
      status: String(row.status),
      recipientName: row.recipient_name ? String(row.recipient_name) : null,
      recipientEmail: row.recipient_email ? String(row.recipient_email) : null,
      senderName: row.sender_name ? String(row.sender_name) : null,
      createdAt: String(row.created_at),
      expiresAt: row.expires_at ? String(row.expires_at) : null,
    })),
  };
}

export const issueGiftCard = (input: {
  amount: number;
  currency: string;
  recipientName?: string;
  recipientEmail?: string;
  senderName?: string;
  message?: string;
  deliveryDate?: string | null;
  purchaserName?: string;
  purchaserEmail?: string;
}) =>
  rpc("issue_gift_card", {
    p_amount: input.amount,
    p_currency: input.currency,
    p_recipient_name: input.recipientName || null,
    p_recipient_email: input.recipientEmail || null,
    p_sender_name: input.senderName || null,
    p_message: input.message || null,
    p_delivery_date: input.deliveryDate || null,
    p_purchaser_name: input.purchaserName || null,
    p_purchaser_email: input.purchaserEmail || null,
  });

export const setGiftCardStatus = (id: string, status: string) =>
  rpc("set_gift_card_status", { p_card_id: id, p_status: status });

export const updateGiftCardDetails = (
  id: string,
  input: { recipientName?: string; recipientEmail?: string; senderName?: string; message?: string; deliveryDate?: string | null }
) =>
  rpc("update_gift_card_details", {
    p_card_id: id,
    p_recipient_name: input.recipientName || null,
    p_recipient_email: input.recipientEmail || null,
    p_sender_name: input.senderName || null,
    p_message: input.message || null,
    p_delivery_date: input.deliveryDate || null,
  });

export async function fetchCustomerLedger(customerId: string): Promise<{ rows: LedgerRow[]; error?: string }> {
  const { data, error } = await supabase
    .from("loyalty_ledger")
    .select("id, customer_id, points, entry_type, reason, occurred_at")
    .eq("customer_id", customerId)
    .order("occurred_at", { ascending: false })
    .limit(50);
  if (error) return { rows: [], error: error.message };
  return {
    rows: (data || []).map((row) => ({
      id: String(row.id),
      customerId: String(row.customer_id),
      points: Number(row.points),
      entryType: String(row.entry_type),
      reason: row.reason ? String(row.reason) : null,
      occurredAt: String(row.occurred_at),
    })),
  };
}

export async function fetchLoyaltyCustomers(limit = 30): Promise<{ rows: { id: string; name: string; email: string; tier: string }[]; error?: string }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, vip_tier_code")
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { rows: [], error: error.message };
  return {
    rows: (data || []).map((row) => ({
      id: String(row.id),
      name: String(row.full_name || "—"),
      email: String(row.email),
      tier: String(row.vip_tier_code || "member"),
    })),
  };
}

export const adjustLoyaltyPoints = (customerId: string, points: number, reason: string) =>
  rpc("adjust_loyalty_points", { p_customer_id: customerId, p_points: points, p_reason: reason });

export async function fetchPreOrders(status?: string): Promise<{ rows: PreOrderRow[]; error?: string }> {
  let query = supabase
    .from("pre_orders")
    .select("id, status, quantity, email, expected_release_on, product_id, created_at, product:products(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.neq("status", status);
  const { data, error } = await query;
  if (error) return { rows: [], error: error.message };
  const rows = data as unknown as {
    id: string; status: string; quantity: number; email: string; expected_release_on: string | null;
    product_id: string; created_at: string; product?: { name: string } | null;
  }[];
  return {
    rows: (rows || []).map((row) => ({
      id: String(row.id),
      status: String(row.status),
      quantity: Number(row.quantity),
      email: String(row.email),
      expectedReleaseOn: row.expected_release_on ? String(row.expected_release_on) : null,
      productId: String(row.product_id),
      productName: row.product?.name ? String(row.product.name) : null,
      createdAt: String(row.created_at),
    })),
  };
}

export const setPreOrderStatus = (id: string, status: string, orderId?: string | null) =>
  rpc("set_pre_order_status", { p_pre_order_id: id, p_status: status, p_order_id: orderId || null });

export async function fetchWaitlists(): Promise<{ rows: WaitlistRow[]; error?: string }> {
  const { data, error } = await supabase
    .from("waitlists")
    .select("id, status, email, country_code, currency, product_id, created_at, notified_at, product:products(name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return { rows: [], error: error.message };
  const rows = data as unknown as {
    id: string; status: string; email: string; country_code: string | null; currency: string | null;
    product_id: string; created_at: string; notified_at: string | null; product?: { name: string } | null;
  }[];
  return {
    rows: (rows || []).map((row) => ({
      id: String(row.id),
      status: String(row.status),
      email: String(row.email),
      countryCode: row.country_code ? String(row.country_code) : null,
      currency: row.currency ? String(row.currency) : null,
      productId: String(row.product_id),
      productName: row.product?.name ? String(row.product.name) : null,
      createdAt: String(row.created_at),
      notifiedAt: row.notified_at ? String(row.notified_at) : null,
    })),
  };
}

export const notifyWaitlist = (id: string) => rpc("notify_waitlist", { p_waitlist_id: id });

export async function fetchDiscoveryTags(): Promise<{ tags: DiscoveryTag[]; error?: string }> {
  const { data, error } = await supabase
    .from("product_discovery_tags")
    .select("id, product_id, kind, value, product:products(name)")
    .order("kind")
    .limit(400);
  if (error) return { tags: [], error: error.message };
  const rows = data as unknown as { id: string; product_id: string; kind: string; value: string; product?: { name: string } | null }[];
  return {
    tags: (rows || []).map((row) => ({
      id: String(row.id),
      productId: String(row.product_id),
      kind: String(row.kind),
      value: String(row.value),
      productName: row.product?.name ? String(row.product.name) : null,
    })),
  };
}

export const saveDiscoveryTag = (productId: string, kind: string, value: string) =>
  rpc("save_product_discovery_tag", { p_product_id: productId, p_kind: kind, p_value: value });

export const removeDiscoveryTag = (id: string) => rpc("remove_product_discovery_tag", { p_tag_id: id });

export const saveProductEdition = (input: {
  productId: string;
  isLimited: boolean;
  editionTotal?: number | null;
  editionNumber?: string | null;
  releasedOn?: string | null;
  endsOn?: string | null;
}) =>
  rpc("save_product_edition", {
    p_product_id: input.productId,
    p_is_limited: input.isLimited,
    p_edition_total: input.editionTotal ?? null,
    p_edition_number: input.editionNumber ?? null,
    p_released_on: input.releasedOn ?? null,
    p_ends_on: input.endsOn ?? null,
  });

export const saveCollectionAccess = (input: {
  collectionId: string;
  visibility: string;
  visibleFrom?: string | null;
  visibleUntil?: string | null;
  minTierRank?: number | null;
  countryCodes?: string[];
}) =>
  rpc("save_collection_access", {
    p_collection_id: input.collectionId,
    p_visibility: input.visibility,
    p_visible_from: input.visibleFrom || null,
    p_visible_until: input.visibleUntil || null,
    p_min_tier_rank: input.minTierRank ?? null,
    p_country_codes: input.countryCodes || [],
  });

export const setProductPreOrder = (productId: string, enabled: boolean, releaseOn: string | null, maxQuantity: number | null) =>
  rpc("save_product_pre_order", {
    p_product_id: productId,
    p_enabled: enabled,
    p_release_on: releaseOn,
    p_max_quantity: maxQuantity,
  });
