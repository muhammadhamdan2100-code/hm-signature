// PayFast hosted-payment helpers.
//
// Every constant and rule below comes from PayFast's own developer documentation
// (developers.payfast.co.za — Custom Integration: form fields, signature, pay,
// confirm payment). Nothing here guesses an endpoint, a field name or an
// algorithm: where the documentation is the only source, it is cited inline.
//
// IMPORTANT business caveat recorded during Phase 5: PayFast documents amounts in
// ZAR and settles to a South African bank account. It documents no PKR trade
// currency. This module therefore only becomes active when the owner supplies
// merchant credentials AND an explicit PKR→ZAR conversion rate; otherwise every
// caller gets a clean "not configured" answer and the storefront never shows the
// option.

import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Documentation order for the signature base string ("in the order they appear on
 * this page", not alphabetical). Overridable per deployment if a merchant is told
 * otherwise by PayFast support, so the fix is configuration, not a code change.
 * Source: https://developers.payfast.co.za/docs#step_1_form_fields
 */
const DOCUMENTED_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "payment_method",
  "state",
];

export function fieldOrder() {
  const override = String(process.env.PAYFAST_SIGNATURE_FIELD_ORDER || "").trim();
  if (!override) return DOCUMENTED_FIELD_ORDER;
  const listed = override.split(",").map((name) => name.trim()).filter(Boolean);
  // Anything the deployment lists is honoured, then any known field it forgot.
  for (const name of DOCUMENTED_FIELD_ORDER) {
    if (!listed.includes(name)) listed.push(name);
  }
  return listed;
}

/** Endpoints exactly as documented. Source: docs#step_3_pay_on_payfast, docs#sandbox, docs#go_live */
export function payEndpoint() {
  return isSandbox()
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";
}

/** ITN validation postback. Source: docs#step_4_confirm_payment */
export function validateEndpoint() {
  return isSandbox()
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";
}

export function isSandbox() {
  return String(process.env.PAYFAST_SANDBOX || "").toLowerCase() === "true";
}

export function payfastConfig() {
  const merchantId = String(process.env.PAYFAST_MERCHANT_ID || "").trim();
  const merchantKey = String(process.env.PAYFAST_MERCHANT_KEY || "").trim();
  const storeId = String(process.env.PAYFAST_STORE_ID || "").trim();
  const passphrase = String(process.env.PAYFAST_PASSPHRASE || "").trim();
  const currency = String(process.env.PAYFAST_CURRENCY || "ZAR").trim().toUpperCase();
  const rate = Number(process.env.PAYFAST_PKR_TO_ZAR_RATE || "");
  return { merchantId, merchantKey, storeId, passphrase, currency, rate };
}

/**
 * A hosted payment is only offered when the merchant credentials, the settlement
 * currency and the conversion rate are all present and sensible. Anything less
 * and the storefront must not show the option.
 */
export function payfastReadiness() {
  const { merchantId, merchantKey, currency, rate } = payfastConfig();
  if (!merchantId || !merchantKey) {
    return { ready: false, reason: "merchant credentials" };
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    return { ready: false, reason: "settlement currency" };
  }
  if (!Number.isFinite(rate) || rate <= 0 || rate > 1000) {
    return { ready: false, reason: "conversion rate" };
  }
  return { ready: true, currency, rate, merchantId };
}

/**
 * PHP-style urlencode, which is what PayFast's documented signature uses:
 * spaces become "+", hex escapes are upper case.
 */
export function phpUrlEncode(value) {
  return encodeURIComponent(String(value))
    .replace(/%20/g, "+")
    .replace(/[!'()*~]/g, (ch) => "%" + ch.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%([0-9a-f]{2})/gi, (match, hex) => "%" + hex.toUpperCase());
}

/** Fields in documented order, non-blank only, key=urlencode(trim(value)). */
export function buildParameterString(fields, order = fieldOrder()) {
  const known = [...order, ...Object.keys(fields)].filter((v, i, arr) => arr.indexOf(v) === i);
  return known
    .map((name) => [name, fields[name]])
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([name, value]) => `${name}=${phpUrlEncode(String(value).trim())}`)
    .join("&");
}

/**
 * The passphrase is appended once to the base string and is never itself sent as
 * a form field. Source: docs#step_2_signature
 */
export function signFields(fields, passphrase = payfastConfig().passphrase) {
  const base = buildParameterString(fields);
  const withPassphrase = passphrase ? `${base}&passphrase=${phpUrlEncode(passphrase.trim())}` : base;
  return createHash("md5").update(withPassphrase, "utf8").digest("hex");
}

/** Same rule applied to an incoming notification: exclude signature, keep received order. */
export function buildNotificationString(body, excludeSignature = true) {
  const entries = Object.entries(body || {}).filter(
    ([key]) => !(excludeSignature && key === "signature")
  );
  return entries
    .map(([key, value]) => `${key}=${phpUrlEncode(String(value ?? "").trim())}`)
    .join("&");
}

export function signatureMatches(body, passphrase = payfastConfig().passphrase) {
  const received = String(body?.signature || "").trim().toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(received)) return false;
  const base = buildNotificationString(body);
  const withPassphrase = passphrase ? `${base}&passphrase=${phpUrlEncode(passphrase.trim())}` : base;
  const computed = createHash("md5").update(withPassphrase, "utf8").digest("hex");
  const a = Buffer.from(computed, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * The notification must come from PayFast. The documentation names the four
 * accepted hosts; DNS resolution is not possible inside a short-lived function,
 * so the remote address is matched against the documented published IP ranges
 * when the deployment enables the check, and the cryptographic postback below is
 * always required. Source: docs#ports-ips
 */
const DOCUMENTED_HOSTS = ["www.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za", "sandbox.payfast.co.za"];
const DOCUMENTED_CIDRS = [
  "197.97.145.144/28",
  "41.74.179.192/27",
  "102.216.36.0/28",
  "102.216.36.128/28",
  "144.126.193.139/32",
];

function toLong(ip) {
  const parts = String(ip).split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function fromPayfastNetwork(ip) {
  const value = toLong(ip);
  if (value === null) return false;
  return DOCUMENTED_CIDRS.some((cidr) => {
    const [base, bits] = cidr.split("/");
    const start = toLong(base);
    if (start === null) return false;
    const mask = bits === "32" ? 0xffffffff : (~0 << (32 - Number(bits))) >>> 0;
    return (start & mask) === (value & mask);
  });
}

export function documentedHosts() {
  return DOCUMENTED_HOSTS;
}

/**
 * Server-side confirmation with PayFast: post the exact parameter string back and
 * require the literal body "VALID". Source: docs#step_4_confirm_payment
 */
export async function postbackIsValid(body, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(validateEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: buildNotificationString(body),
      signal: controller.signal,
    });
    if (!res.ok) return false;
    return (await res.text()).trim().toUpperCase() === "VALID";
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Amounts documented as ZAR with two decimals; the provider minimum is 5.00. */
export function formatAmount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return number.toFixed(2);
}
