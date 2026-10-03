// Browser side of the email system. Deliberately thin:
//  - the browser never renders or authorises an email body (that lives in
//    api/_email-templates.js), it only asks for its own queued mail to be sent;
//  - delivery capability is read from the server rather than assumed, so page
//    copy can only promise what this deployment can actually do.
import { supabase } from "../lib/supabase";

async function sessionToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export type ServiceCapabilities = {
  email: boolean;
  concierge: boolean;
  payfast: boolean;
  serverDatabase: boolean;
  automations: boolean;
};

let cachedCapabilities: ServiceCapabilities | null = null;

export async function fetchServiceCapabilities(): Promise<ServiceCapabilities> {
  const fallback: ServiceCapabilities = {
    email: false,
    concierge: false,
    payfast: false,
    serverDatabase: false,
    automations: false,
  };
  if (cachedCapabilities) return cachedCapabilities;
  try {
    const res = await fetch("/api/health", { headers: { Accept: "application/json" } });
    if (!res.ok) return fallback;
    const body = (await res.json()) as { capabilities?: Partial<ServiceCapabilities> };
    const capabilities = { ...fallback, ...(body.capabilities || {}) };
    cachedCapabilities = capabilities;
    return capabilities;
  } catch {
    return fallback;
  }
}

/** Re-reads the server instead of using the cached answer — used by the automation
 * dashboard, which must not report a stale capability after credentials change. */
export async function refreshServiceCapabilities(): Promise<ServiceCapabilities> {
  cachedCapabilities = null;
  return fetchServiceCapabilities();
}

export type EnquiryPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

/**
 * Forwards a contact enquiry to the atelier inbox through the server function.
 * A session is required, and the recipient is chosen by the server — the browser
 * sends data, never HTML and never an address to mail.
 */
export const sendContactEnquiry = async (payload: EnquiryPayload): Promise<boolean> => {
  const token = await sessionToken();
  if (!token) return false;
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ template: "contact_enquiry", data: { ...payload } }),
    });
    if (!res.ok) return false;
    const result = (await res.json().catch(() => null)) as { success?: boolean } | null;
    return Boolean(result?.success);
  } catch {
    return false;
  }
};

/**
 * Asks the worker to deliver anything already queued for this customer (order
 * confirmation, payment notice). Requires a session; without SMTP configured the
 * server answers 503 and nothing is claimed.
 */
export const drainOwnEmailQueue = async (): Promise<number> => {
  const token = await sessionToken();
  if (!token) return 0;
  try {
    const res = await fetch("/api/email-worker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) return 0;
    const result = (await res.json().catch(() => null)) as { sent?: number } | null;
    return Number(result?.sent || 0);
  } catch {
    return 0;
  }
};
