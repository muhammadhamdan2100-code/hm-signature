import { supabase } from "../lib/supabase";

// Phase 8: the payment-method architecture is configuration, not code. Nothing in this file
// writes payment_methods or boutiques directly - every mutation goes through a SECURITY DEFINER
// function that refuses anyone who is not a Super Admin, and no credential is ever read or sent
// from the browser.

export type MethodStatus = "configured" | "enabled" | "coming_soon" | "unavailable";
export type MethodEnvironment = "none" | "test" | "live";

export interface PaymentMethodRow {
  id: string;
  code: string;
  providerCode: string;
  type: string;
  displayName: string;
  description: string;
  icon: string;
  countryCodes: string[];
  currencyCodes: string[];
  status: MethodStatus;
  environment: MethodEnvironment;
  isEnabled: boolean;
  isComingSoon: boolean;
  requiresReference: boolean;
  requiresProof: boolean;
  configurationReference: string;
  sortOrder: number;
}

export interface PaymentProviderRow {
  code: string;
  displayName: string;
  integrationKind: string;
  credentialEnvVars: string[];
  documentationUrl: string;
}

export interface BoutiqueRow {
  id: string;
  name: string;
  countryCode: string;
  city: string;
  address: string;
  phone: string;
  openingHours: string;
  mapsUrl: string;
  status: string;
  isEnabled: boolean;
  sortOrder: number;
}

const METHOD_COLUMNS =
  "id, code, provider_code, type, display_name, description, icon, country_codes, currency_codes, status, environment, is_enabled, is_coming_soon, requires_reference, requires_proof, configuration_reference, sort_order";

const toMethod = (r: any): PaymentMethodRow => ({
  id: r.id,
  code: r.code,
  providerCode: r.provider_code,
  type: r.type,
  displayName: r.display_name,
  description: r.description ?? "",
  icon: r.icon ?? "",
  countryCodes: r.country_codes ?? [],
  currencyCodes: r.currency_codes ?? [],
  status: r.status,
  environment: r.environment,
  isEnabled: Boolean(r.is_enabled),
  isComingSoon: Boolean(r.is_coming_soon),
  requiresReference: Boolean(r.requires_reference),
  requiresProof: Boolean(r.requires_proof),
  configurationReference: r.configuration_reference ?? "",
  sortOrder: Number(r.sort_order ?? 0),
});

export async function listPaymentMethods(): Promise<PaymentMethodRow[]> {
  const { data, error } = await supabase
    .from("payment_methods")
    .select(METHOD_COLUMNS)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(toMethod);
}

export async function listPaymentProviders(): Promise<PaymentProviderRow[]> {
  const { data, error } = await supabase
    .from("payment_providers")
    .select("code, display_name, integration_kind, credential_env_vars, documentation_url")
    .order("code");
  if (error) throw new Error(error.message);
  return (data || []).map((r: any) => ({
    code: r.code,
    displayName: r.display_name,
    integrationKind: r.integration_kind,
    credentialEnvVars: r.credential_env_vars ?? [],
    documentationUrl: r.documentation_url ?? "",
  }));
}

export interface PaymentMethodInput {
  code: string;
  providerCode: string;
  type: string;
  displayName: string;
  description: string;
  icon: string;
  countryCodes: string[];
  currencyCodes: string[];
  status: MethodStatus;
  environment: MethodEnvironment;
  configurationReference: string;
  sortOrder: number;
}

export async function savePaymentMethod(
  input: PaymentMethodInput
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc("save_payment_method", {
    p_code: input.code,
    p_provider_code: input.providerCode,
    p_type: input.type,
    p_display_name: input.displayName,
    p_description: input.description,
    p_icon: input.icon,
    p_country_codes: input.countryCodes,
    p_currency_codes: input.currencyCodes,
    p_status: input.status,
    p_environment: input.environment,
    p_configuration_reference: input.configurationReference,
    p_sort_order: input.sortOrder,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function setPaymentMethodStatus(
  code: string,
  status: MethodStatus
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc("set_payment_method_status", { p_code: code, p_status: status });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deletePaymentMethod(code: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc("delete_payment_method", { p_code: code });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * What a shopper in one country actually sees. The states depend on this deployment's provider
 * credentials, which only the server can read, so the preview asks the same endpoint checkout
 * does instead of guessing from the table.
 */
export async function previewCountryMethods(
  countryCode: string,
  currencyCode: string
): Promise<{ code: string; name: string; state: string; canSubmit: boolean }[]> {
  const res = await fetch(
    `/api/payment-methods?country=${encodeURIComponent(countryCode)}&currency=${encodeURIComponent(currencyCode)}`
  );
  if (!res.ok) return [];
  const body = (await res.json()) as {
    methods?: { code: string; name: string; state: string; canSubmit: boolean }[];
  };
  return body.methods || [];
}

// ─── Boutiques ────────────────────────────────────────────────────────────────────────────────

const BOUTIQUE_COLUMNS =
  "id, name, country_code, city, address, phone, opening_hours, maps_url, status, is_enabled, sort_order";

const toBoutique = (r: any): BoutiqueRow => ({
  id: r.id,
  name: r.name,
  countryCode: r.country_code ?? "",
  city: r.city ?? "",
  address: r.address ?? "",
  phone: r.phone ?? "",
  openingHours: r.opening_hours ?? "",
  mapsUrl: r.maps_url ?? "",
  status: r.status,
  isEnabled: Boolean(r.is_enabled),
  sortOrder: Number(r.sort_order ?? 0),
});

export async function listBoutiques(staffView = true): Promise<BoutiqueRow[]> {
  let query = supabase.from("boutiques").select(BOUTIQUE_COLUMNS).order("sort_order", { ascending: true });
  if (!staffView) query = query.eq("is_enabled", true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(toBoutique);
}

export interface BoutiqueInput {
  id?: string | null;
  name: string;
  countryCode: string;
  city: string;
  address: string;
  phone: string;
  openingHours: string;
  mapsUrl: string;
  status: string;
  isEnabled: boolean;
  sortOrder: number;
}

export async function saveBoutique(input: BoutiqueInput): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc("save_boutique", {
    p_id: input.id ?? null,
    p_name: input.name,
    p_country_code: input.countryCode,
    p_city: input.city,
    p_address: input.address,
    p_phone: input.phone,
    p_opening_hours: input.openingHours,
    p_maps_url: input.mapsUrl,
    p_status: input.status,
    p_is_enabled: input.isEnabled,
    p_sort_order: input.sortOrder,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteBoutique(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc("delete_boutique", { p_id: id });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
