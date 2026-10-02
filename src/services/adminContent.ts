import { supabase } from "../lib/supabase";
import type {
  StoreSettings,
  SeoEntry,
  HomepageConfig,
  SystemNotification,
  EmailTemplate,
  Campaign,
  AbandonedCart,
} from "../admin/context/AdminDataContext";
import type { StaffMember } from "../types/staff";
import { toDisplayRole } from "../types/staff";
import { getDefaultPermissionsForRole } from "./staff";

// STORE SETTINGS — stored as a single JSONB row in site_settings
export async function fetchStoreSettingsFromDB(): Promise<StoreSettings | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "store_settings")
    .maybeSingle();
  if (error || !data?.value) return null;
  return data.value as StoreSettings;
}

export async function saveStoreSettingsToDB(settings: StoreSettings): Promise<boolean> {
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "store_settings",
      value: settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  return !error;
}

// HOMEPAGE CMS CONFIG — stored as a single JSONB row in site_settings
export async function fetchHomepageConfigFromDB(): Promise<HomepageConfig | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "homepage_config")
    .maybeSingle();
  if (error || !data?.value) return null;
  return data.value as HomepageConfig;
}

export async function saveHomepageConfigToDB(config: HomepageConfig): Promise<boolean> {
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "homepage_config",
      value: config,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  return !error;
}

// SEO ENTRIES
export async function fetchSeoEntriesFromDB(): Promise<SeoEntry[]> {
  const { data, error } = await supabase.from("seo_settings").select("*").order("page_path");
  if (error || !data) return [];
  return data.map((s: any) => ({
    id: s.page_path,
    page: s.title || s.page_path,
    path: s.page_path,
    metaTitle: s.title,
    metaDescription: s.description,
    slug: s.slug || s.page_path.replace(/^\//, ""),
    canonicalUrl: s.canonical_url || "",
    ogImage: s.og_image_url || "",
  }));
}

export async function saveSeoEntryToDB(entry: Partial<SeoEntry> & { id: string }): Promise<boolean> {
  const { error } = await supabase.from("seo_settings").upsert(
    {
      page_path: entry.path || entry.id,
      title: entry.metaTitle || "",
      description: entry.metaDescription || "",
      og_image_url: entry.ogImage || null,
      canonical_url: entry.canonicalUrl || null,
      slug: entry.slug || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "page_path" }
  );
  return !error;
}

// SYSTEM NOTIFICATIONS (admin center rows carry user_id = null)
export async function fetchNotificationsFromDB(): Promise<SystemNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .is("user_id", null)
    .order("sent_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map((n: any) => ({
    id: n.id,
    type: (n.type || "System") as SystemNotification["type"],
    title: n.title,
    message: n.message,
    date: (n.sent_at || "").replace("T", " ").slice(0, 16),
    read: Boolean(n.read),
  }));
}

export async function createSystemNotification(input: {
  type: SystemNotification["type"];
  title: string;
  message: string;
}): Promise<boolean> {
  const { error } = await supabase.from("notifications").insert([
    {
      user_id: null,
      recipient_email: "system@internal",
      type: input.type,
      title: input.title,
      message: input.message,
      read: false,
    },
  ]);
  return !error;
}

export async function markNotificationReadInDB(id: string): Promise<boolean> {
  if (!/^[0-9a-f]{8}-/i.test(id)) return true;
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  return !error;
}

// EMAIL / NOTIFICATION TEMPLATES
export async function fetchEmailTemplatesFromDB(): Promise<EmailTemplate[]> {
  const { data, error } = await supabase.from("notification_templates").select("*").order("code");
  if (error || !data) return [];
  return data.map((t: any) => ({
    id: t.id,
    type: t.code,
    subject: t.subject,
    body: t.body_template,
    active: t.active,
  }));
}

export async function saveEmailTemplateToDB(
  template: Partial<EmailTemplate> & { id?: string }
): Promise<boolean> {
  const payload = {
    code: template.type?.toLowerCase().replace(/\s+/g, "_"),
    name: template.type || "Template",
    subject: template.subject,
    body_template: template.body,
    active: template.active ?? true,
  };
  if (template.id && /^[0-9a-f]{8}-/i.test(template.id)) {
    const { error } = await supabase.from("notification_templates").update(payload).eq("id", template.id);
    return !error;
  }
  const { error } = await supabase.from("notification_templates").insert([payload]);
  return !error;
}

// MARKETING CAMPAIGNS — extras serialized into `content` JSON text
export async function fetchCampaignsFromDB(): Promise<Campaign[]> {
  const { data, error } = await supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((c: any) => {
    let extra: any = {};
    try {
      extra = JSON.parse(c.content || "{}");
    } catch {
      extra = { description: c.content };
    }
    return {
      id: c.id,
      name: c.name,
      startDate: extra.startDate || (c.scheduled_at || "").split("T")[0],
      endDate: extra.endDate || "",
      discountPercentage: Number(extra.discountPercentage || 0),
      bannerImage: extra.bannerImage || "",
      status: (c.status || "Draft") as Campaign["status"],
      targetProducts: Array.isArray(extra.targetProducts) ? extra.targetProducts : [],
    };
  });
}

export async function saveCampaignToDB(
  campaign: Partial<Campaign> & { id?: string }
): Promise<boolean> {
  const extras = JSON.stringify({
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    discountPercentage: campaign.discountPercentage,
    bannerImage: campaign.bannerImage,
    targetProducts: campaign.targetProducts,
  });
  const payload = {
    name: campaign.name,
    type: "discount_push",
    subject: campaign.name,
    content: extras,
    status: campaign.status || "Active",
    scheduled_at: campaign.startDate ? new Date(campaign.startDate).toISOString() : null,
  };
  if (campaign.id && /^[0-9a-f]{8}-/i.test(campaign.id)) {
    const { error } = await supabase.from("marketing_campaigns").update(payload).eq("id", campaign.id);
    return !error;
  }
  const { error } = await supabase.from("marketing_campaigns").insert([payload]);
  return !error;
}

export async function deleteCampaignFromDB(id: string): Promise<boolean> {
  if (!/^[0-9a-f]{8}-/i.test(id)) return true;
  const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id);
  return !error;
}

// ABANDONED CARTS
export async function fetchAbandonedCartsFromDB(): Promise<AbandonedCart[]> {
  const { data, error } = await supabase
    .from("abandoned_carts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((c: any) => {
    let items: AbandonedCart["items"] = [];
    try {
      const snapshot = typeof c.items_snapshot === "string" ? JSON.parse(c.items_snapshot) : c.items_snapshot;
      items = (Array.isArray(snapshot) ? snapshot : []).map((i: any) => ({
        productName: i.productName || i.name || "Item",
        quantity: Number(i.quantity || 1),
        price: Number(i.price || 0),
      }));
    } catch {
      items = [];
    }
    return {
      id: c.id,
      customerName: c.customer_name || "Guest",
      customerEmail: c.customer_email,
      cartValue: Number(c.total_value || 0),
      items,
      abandonedDate: (c.created_at || "").split("T")[0],
      status: c.recovered ? "Recovered" : c.recovery_email_sent_at ? "Reminder Sent" : "Pending",
    };
  });
}

export async function markCartReminderSentInDB(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("abandoned_carts")
    .update({ recovery_email_sent_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

// STAFF MEMBERS (profiles rows with non-customer roles)
export async function fetchStaffMembersFromDB(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "customer")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((p: any) => {
    const displayRole = toDisplayRole(p.role);
    return {
      id: p.id,
      name: p.full_name || p.email?.split("@")[0] || "Staff",
      email: p.email,
      role: displayRole,
      status: p.status === "active" ? "Active" : p.status === "suspended" ? "Suspended" : "Inactive",
      lastActive: p.last_sign_in_at ? fmtAgo(p.last_sign_in_at) : "Never",
      createdAt: (p.created_at || "").split("T")[0],
      isPrimaryAdmin: p.email?.toLowerCase() === "muhammadhamdan2100@gmail.com",
      permissions: getDefaultPermissionsForRole(displayRole),
    } as StaffMember;
  });
}

const fmtAgo = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "Never" : d.toLocaleString();
};
