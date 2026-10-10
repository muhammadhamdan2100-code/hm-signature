import { supabase } from "../lib/supabase";

// Store-level configuration kept in site_settings so operations can change
// payment instructions and delivery pricing without a code deploy.

export interface PaymentMethodDetail {
  label: string;
  value: string;
  copyValue?: string;
}

/**
 * One rail as the payment-method architecture sees it. The state is computed on the server
 * because it depends on which provider credentials exist in this deployment - the browser can
 * report what is offered, never what is allowed.
 */
export type CheckoutMethodState = "available" | "coming_soon" | "not_configured" | "disabled" | "unavailable";

export interface CheckoutMethod {
  code: string;
  provider: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  state: CheckoutMethodState;
  status: string;
  environment: string;
  canSubmit: boolean;
  requiresReference: boolean;
  requiresProof: boolean;
}

/**
 * The checkout rails computed directly from publicly-readable Supabase configuration.
 *
 * This reads only configuration that anonymous shoppers are already allowed to read under RLS
 * (payment_methods joined to payment_providers). It never reads or infers a secret. A rail is
 * submittable when the shop has marked it 'enabled' AND it can be completed without a live server
 * gateway, which is true for exactly two kinds of rail:
 *   - a manual rail that declares NO provider credential (cash on delivery, direct bank transfer);
 *   - an evidence rail the customer settles themselves and staff verify — one that asks for a
 *     payment reference and/or a proof screenshot (requires_reference / requires_proof). The money
 *     moves outside the browser, the proof goes to the private storage bucket, and the row is
 *     written by submit_payment_proof, so no server secret is involved and payment is still marked
 *     'Verification Pending' rather than claimed as settled.
 * A rail that expects an ONLINE capture — it declares credentials AND asks for no manual evidence
 * (card / wallet / gateway rails) — is reported as 'not_configured' and cannot be submitted,
 * because only a server could know whether that gateway's credential is present and initiate it.
 * That is the honest degraded view, not a claim that a card/wallet gateway works.
 */
export async function directCheckoutMethods(
  countryCode: string,
  currencyCode: string
): Promise<CheckoutMethod[]> {
  const { data, error } = await supabase
    .from("payment_methods")
    .select(
      "code, provider_code, type, display_name, description, icon, country_codes, currency_codes, status, environment, requires_reference, requires_proof, sort_order, payment_providers(credential_env_vars)"
    )
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);

  return (data || [])
    .filter((r: any) => (r.country_codes || []).includes(countryCode))
    .filter((r: any) => (r.currency_codes || []).includes(currencyCode))
    .map((r: any) => {
      const providers = Array.isArray(r.payment_providers) ? r.payment_providers : [r.payment_providers];
      const credentialVars = providers[0]?.credential_env_vars;
      // Fail closed on the gateway question: a rail is treated as credential-dependent unless the
      // provider is confirmed present AND declares an EMPTY credential list.
      const declaresCredential = !Array.isArray(credentialVars) || credentialVars.length > 0;
      const evidenceRail = Boolean(r.requires_reference) || Boolean(r.requires_proof);
      const enabled = r.status === "enabled";
      // Only an online-capture rail (a credential AND no manual-evidence path) needs the server.
      const requiresGateway = enabled && declaresCredential && !evidenceRail;
      const canSubmit = enabled && !requiresGateway;
      const state: CheckoutMethodState = !enabled
        ? r.status === "coming_soon"
          ? "coming_soon"
          : "disabled"
        : requiresGateway
          ? "not_configured"
          : "available";
      return {
        code: r.code,
        provider: r.provider_code,
        type: r.type,
        name: r.display_name,
        description: r.description ?? "",
        icon: r.icon ?? "",
        state,
        status: r.status,
        environment: r.environment ?? "none",
        canSubmit,
        requiresReference: Boolean(r.requires_reference),
        requiresProof: Boolean(r.requires_proof),
      } as CheckoutMethod;
    });
}

export async function fetchCheckoutMethods(
  countryCode: string,
  currencyCode: string
): Promise<{ methods: CheckoutMethod[]; degraded: boolean }> {
  // Authoritative path: the server derives each rail's state from this deployment's
  // provider credentials, which the browser can never see.
  try {
    const res = await fetch(
      `/api/payment-methods?country=${encodeURIComponent(countryCode)}&currency=${encodeURIComponent(currencyCode)}`,
      { headers: { Accept: "application/json" } }
    );
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const body = (await res.json()) as { methods?: CheckoutMethod[]; degraded?: boolean };
      return { methods: Array.isArray(body.methods) ? body.methods : [], degraded: Boolean(body.degraded) };
    }
  } catch {
    // Endpoint absent (the Vercel Hobby deployment currently ships no serverless functions), or it
    // returned the SPA's HTML fallback. Either way, fall through to the direct-Supabase read.
  }

  // Direct-Supabase fallback: this is the degraded view, honestly labelled.
  const methods = await directCheckoutMethods(countryCode, currencyCode);
  return { methods, degraded: true };
}

export interface PaymentMethodConfig {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  requiresReference: boolean;
  requiresProof: boolean;
  referenceLabel: string;
  referencePlaceholder: string;
  instructionHeading: string;
  details: PaymentMethodDetail[];
}

export interface ShippingConfig {
  freeThreshold: number;
  standardCost: number;
  estimatedDays: string;
}

const PAYMENT_KEY = "payment_config";
const SHIPPING_KEY = "shipping_config";

export const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "Cash on Delivery",
    label: "Cash on Delivery",
    description: "Pay cash upon courier delivery",
    enabled: true,
    requiresReference: false,
    requiresProof: false,
    referenceLabel: "",
    referencePlaceholder: "",
    instructionHeading: "CASH ON DELIVERY",
    details: [
      { label: "Amount to hand over", value: "Your order total, collected at the door" },
      { label: "Courier", value: "HM Signature concierge delivery" },
    ],
  },
  {
    id: "JazzCash",
    label: "JazzCash Mobile Wallet",
    description: "Wallet transfer — verified by our team, usually within one working day.",
    enabled: true,
    requiresReference: true,
    requiresProof: true,
    referenceLabel: "Transaction Reference / TID (12 Digits)",
    referencePlaceholder: "e.g. 098234112984",
    instructionHeading: "JAZZCASH PAYMENT INSTRUCTIONS",
    details: [
      { label: "Account Number", value: "0300 8472910", copyValue: "03008472910" },
      { label: "Account Title", value: "HM Signature Atelier" },
    ],
  },
  {
    id: "Raast",
    label: "Raast Instant Transfer",
    description: "Wallet transfer — verified by our team, usually within one working day.",
    enabled: true,
    requiresReference: true,
    requiresProof: true,
    referenceLabel: "Raast Transaction Reference ID",
    referencePlaceholder: "e.g. RAAST-992381",
    instructionHeading: "RAAST INSTANT PAYMENT INSTRUCTIONS",
    details: [
      { label: "Raast ID (Phone)", value: "03008472910", copyValue: "03008472910" },
      { label: "IBAN Raast ID", value: "PK36MEZN0001029384756101", copyValue: "PK36MEZN0001029384756101" },
    ],
  },
  {
    id: "Bank Transfer",
    label: "Direct Bank Transfer",
    description: "Meezan Bank IBAN transfer",
    enabled: true,
    requiresReference: true,
    requiresProof: true,
    referenceLabel: "Bank Transfer Reference / Deposit Slip No.",
    referencePlaceholder: "e.g. HBL-DEPOSIT-88213",
    instructionHeading: "DIRECT BANK TRANSFER DETAILS",
    details: [
      { label: "Bank Name", value: "Meezan Bank Ltd." },
      { label: "Account Title", value: "HM Signature (Pvt) Ltd" },
      { label: "Account Number", value: "0102 9384 7561 01", copyValue: "01029384756101" },
      { label: "IBAN", value: "PK36 MEZN 0001 0293 8475 6101", copyValue: "PK36MEZN0001029384756101" },
    ],
  },
];

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  freeThreshold: 10000,
  standardCost: 250,
  estimatedDays: "2–3 business days",
};

async function readSetting(key: string): Promise<any | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data?.value) return null;
  return data.value;
}

async function writeSetting(key: string, value: unknown, description: string): Promise<boolean> {
  const { error } = await supabase.from("site_settings").upsert(
    { key, value, description, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  return !error;
}

export async function fetchPaymentMethodsConfig(): Promise<PaymentMethodConfig[]> {
  const raw = await readSetting(PAYMENT_KEY);
  const methods = Array.isArray(raw?.methods) ? (raw.methods as PaymentMethodConfig[]) : null;
  if (!methods || methods.length === 0) return DEFAULT_PAYMENT_METHODS;
  // Merge stored methods over defaults so new fields always have a value.
  return methods.map((m) => {
    const base = DEFAULT_PAYMENT_METHODS.find((d) => d.id === m.id);
    return { ...base, ...m } as PaymentMethodConfig;
  });
}

export async function savePaymentMethodsConfig(methods: PaymentMethodConfig[]): Promise<boolean> {
  return writeSetting(PAYMENT_KEY, { methods }, "Manual payment instructions shown at checkout.");
}

export async function fetchShippingConfig(): Promise<ShippingConfig> {
  const raw = await readSetting(SHIPPING_KEY);
  if (!raw) return DEFAULT_SHIPPING_CONFIG;
  return {
    freeThreshold: Number(raw.freeThreshold ?? DEFAULT_SHIPPING_CONFIG.freeThreshold),
    standardCost: Number(raw.standardCost ?? DEFAULT_SHIPPING_CONFIG.standardCost),
    estimatedDays: String(raw.estimatedDays ?? DEFAULT_SHIPPING_CONFIG.estimatedDays),
  };
}

export async function saveShippingConfig(config: ShippingConfig): Promise<boolean> {
  return writeSetting(
    SHIPPING_KEY,
    { freeThreshold: config.freeThreshold, standardCost: config.standardCost, estimatedDays: config.estimatedDays },
    "Delivery cost rules applied server-side when an order is placed."
  );
}
