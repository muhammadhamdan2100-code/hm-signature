// The customer's own communication consent. Row-level security already restricts this
// table to the owner, so the browser can read and write only its own preferences —
// no RPC and no service key involved.
import { supabase } from "../lib/supabase";

export type CommunicationPreferences = {
  orderUpdates: boolean;
  marketingEmails: boolean;
  source: "default" | "customer" | "staff" | "unsubscribe_link";
  updatedAt: string | null;
};

const FALLBACK: CommunicationPreferences = {
  orderUpdates: true,
  marketingEmails: false,
  source: "default",
  updatedAt: null,
};

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function fetchCommunicationPreferences(): Promise<CommunicationPreferences> {
  const id = await currentUserId();
  if (!id) return FALLBACK;
  const { data, error } = await supabase
    .from("customer_communication_preferences")
    .select("order_updates, marketing_emails, source, updated_at")
    .eq("user_id", id)
    .maybeSingle();
  if (error || !data) return FALLBACK;
  return {
    orderUpdates: Boolean(data.order_updates),
    marketingEmails: Boolean(data.marketing_emails),
    source: data.source ?? "default",
    updatedAt: data.updated_at ?? null,
  };
}

/**
 * Records the marketing choice. `order_updates` is deliberately not written: order,
 * payment and delivery messages are part of the purchase, and the application does
 * not offer to silence them. `source = 'customer'` keeps the audit trail honest about
 * who made the change.
 */
export async function saveMarketingConsent(
  marketingEmails: boolean
): Promise<{ ok: boolean; error: string | null }> {
  const id = await currentUserId();
  if (!id) return { ok: false, error: "Please sign in again to save your preferences." };

  const { error } = await supabase
    .from("customer_communication_preferences")
    .upsert(
      {
        user_id: id,
        marketing_emails: marketingEmails,
        source: "customer",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return { ok: false, error: error.message.slice(0, 160) };
  }
  return { ok: true, error: null };
}
