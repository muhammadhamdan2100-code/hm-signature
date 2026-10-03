import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface AddressRecord {
  id: string;
  customerId: string;
  type: "shipping" | "billing" | "home" | "work" | "other";
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressInput {
  type?: AddressRecord["type"];
  label?: string;
  fullName?: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

type WriteResult = { success: boolean; id?: string; error?: string };

export const toRecord = (row: any): AddressRecord => ({
  id: row.id,
  customerId: row.customer_id,
  type: row.type,
  label: row.label || undefined,
  fullName: row.full_name || "",
  phone: row.phone || "",
  addressLine1: row.address_line_1,
  addressLine2: row.address_line_2 || undefined,
  city: row.city,
  state: row.state || undefined,
  postalCode: row.postal_code || undefined,
  country: row.country,
  isDefault: Boolean(row.is_default),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const toColumns = (input: AddressInput) => ({
  type: input.type || "shipping",
  label: input.label?.trim() || null,
  full_name: input.fullName?.trim() || "",
  phone: input.phone?.trim() || "",
  address_line_1: input.addressLine1.trim(),
  address_line_2: input.addressLine2?.trim() || null,
  city: input.city.trim(),
  state: input.state?.trim() || null,
  postal_code: input.postalCode?.trim() || null,
  country: input.country?.trim() || "Pakistan",
  is_default: Boolean(input.isDefault),
});

export async function fetchCustomerAddresses(): Promise<AddressRecord[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(toRecord);
}

// RLS filters an unauthorised write to zero rows without raising an error, so
// every write re-reads the row it claims to have made before reporting success.
export async function createCustomerAddress(input: AddressInput): Promise<WriteResult> {
  if (!isSupabaseConfigured()) return { success: false, error: "Storage is not configured." };
  const { data: session } = await supabase.auth.getUser();
  const customerId = session.user?.id;
  if (!customerId) return { success: false, error: "Please sign in to save an address." };

  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...toColumns(input), customer_id: customerId })
    .select("id")
    .maybeSingle();
  if (error) return { success: false, error: error.message };
  if (!data?.id) return { success: false, error: "The address was not saved. Please try again." };
  return { success: true, id: data.id };
}

export async function updateCustomerAddress(id: string, input: AddressInput): Promise<WriteResult> {
  if (!isSupabaseConfigured()) return { success: false, error: "Storage is not configured." };
  const { error } = await supabase
    .from("addresses")
    .update(toColumns(input))
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return { success: false, error: error.message };
  return { success: true, id };
}

export async function setDefaultCustomerAddress(id: string): Promise<WriteResult> {
  if (!isSupabaseConfigured()) return { success: false, error: "Storage is not configured." };
  const { data, error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .select("id, is_default")
    .maybeSingle();
  if (error) return { success: false, error: error.message };
  if (!data?.is_default) {
    return { success: false, error: "That address could not be set as the default. Please try again." };
  }
  return { success: true, id };
}

export async function deleteCustomerAddress(id: string): Promise<WriteResult> {
  if (!isSupabaseConfigured()) return { success: false, error: "Storage is not configured." };
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  const { data, error: verifyError } = await supabase
    .from("addresses")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (verifyError) return { success: false, error: verifyError.message };
  if (data) return { success: false, error: "The address could not be removed. Please try again." };
  return { success: true, id };
}

// Staff-only read path for the admin customer view. The RLS policy on
// `addresses` grants SELECT to staff and nothing else, so a customer calling
// this for another account receives no rows.
export async function fetchSavedAddressesForCustomer(
  customerId: string
): Promise<AddressRecord[]> {
  if (!isSupabaseConfigured() || !customerId) return [];
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(toRecord);
}
