import { supabase } from "../lib/supabase";

// Store-level configuration kept in site_settings so operations can change
// payment instructions and delivery pricing without a code deploy.

export interface PaymentMethodDetail {
  label: string;
  value: string;
  copyValue?: string;
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
