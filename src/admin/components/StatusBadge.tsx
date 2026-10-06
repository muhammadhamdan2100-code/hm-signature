import React from "react";
import type { OrderStatus } from "../context/AdminDataContext";
import { useI18n } from "../../i18n/I18nProvider";

interface StatusBadgeProps {
  status: OrderStatus | "In Stock" | "Low Stock" | "Out of Stock" | "Active" | "Inactive" | "VIP" | "Pending" | "Approved" | "Rejected" | "Scheduled" | "Ended" | "Paid" | "Refunded" | "Failed" | string;
  type?: "order" | "stock" | "general" | "review";
}

/**
 * Brand palette only: ivory/gold/navy plus the semantic emerald (success),
 * amber (in progress) and rose (blocked/negative) tones used across the admin.
 */
type BadgeTone = "success" | "progress" | "brand" | "danger" | "neutral";

const TONE_CLASS: Record<BadgeTone, string> = {
  success: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30",
  progress: "bg-amber-950/40 text-amber-300 border-amber-500/30",
  brand: "bg-gold/10 text-gold border-gold/40",
  danger: "bg-rose-950/40 text-rose-300 border-rose-500/30",
  neutral: "bg-navy2 text-muted border-gold/20",
};

/**
 * Lower-case database value -> badge tone. The keys are the stored statuses, so they stay
 * English; only the copy shown to the staff member is translated (see `admin.status.*`).
 */
const STATUS_META: Record<string, { tone: BadgeTone }> = {
  // Success / settled
  delivered: { tone: "success" },
"in stock": { tone: "success" },
  active: { tone: "success" },
  approved: { tone: "success" },
  paid: { tone: "success" },
  verified: { tone: "success" },
  processed: { tone: "success" },
  recovered: { tone: "success" },
  vip: { tone: "success" },

  // Awaiting action / in progress
  pending: { tone: "progress" },
"verification pending": { tone: "progress" },
  processing: { tone: "progress" },
  confirmed: { tone: "progress" },
  scheduled: { tone: "progress" },
"in transit": { tone: "progress" },
"low stock": { tone: "progress" },
  unfulfilled: { tone: "progress" },

  // In motion / money moved (gold accent)
  shipped: { tone: "brand" },
"out for delivery": { tone: "brand" },
  refunded: { tone: "brand" },
  returned: { tone: "brand" },
"reminder sent": { tone: "brand" },

  // Blocked / negative
  cancelled: { tone: "danger" },
"out of stock": { tone: "danger" },
  rejected: { tone: "danger" },
  inactive: { tone: "danger" },
  failed: { tone: "danger" },
  blocked: { tone: "danger" },
  suspended: { tone: "danger" },

  // Neutral / informational
  ended: { tone: "neutral" },
  expired: { tone: "neutral" },
  sending: { tone: "brand" },
  completed: { tone: "neutral" },
  draft: { tone: "neutral" },
  new: { tone: "neutral" },
  returning: { tone: "neutral" },
  unconverted: { tone: "neutral" },
};

/** `Out for Delivery` -> `admin.status.outfordelivery`, the key the dictionaries carry. */
export const statusLabelKey = (value: string) =>
  `admin.status.${value.trim().toLowerCase().replace(/\s+/g, "")}`;

/**
 * Translates a stored status word for display. Unknown values are shown exactly as they
 * arrive, because a status the dictionaries have never seen must not be invented.
 */
export const useStatusLabel = () => {
  const { t } = useI18n();
  return (value: string) => {
    const raw = typeof value === "string" ? value.trim() : "";
    return raw && Object.hasOwn(STATUS_META, raw.toLowerCase()) ? t(statusLabelKey(raw)) : value;
  };
};

/**
 * The stored payment rail -> the label a staff member reads. The rails are fixed by the database
 * (orders.payments carry these names), so an unrecognised one is shown as stored rather than
 * guessed into another rail's wording.
 */
export const usePaymentMethodLabel = () => {
  const { t } = useI18n();
  return (method: string) => {
    const key = (method || "").trim().toLowerCase();
    if (key === "cash on delivery" || key === "cod") return t("admin.paymentMethod.cashOnDelivery");
    if (key === "jazzcash") return t("admin.paymentMethod.jazzCash");
    if (key === "raast") return t("admin.paymentMethod.raast");
    if (key === "bank transfer") return t("admin.paymentMethod.bankTransfer");
    if (key === "payfast") return t("admin.paymentMethod.payFast");
    return method;
  };
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useI18n();
  const raw = typeof status === "string" ? status.trim() : "";
  const meta =
    raw && Object.hasOwn(STATUS_META, raw.toLowerCase())
      ? STATUS_META[raw.toLowerCase()]
      : undefined;

  // Known statuses render in the staff member's language; unknown values are shown as given.
  const label = meta ? t(statusLabelKey(raw)) : status;
  const badgeStyle = TONE_CLASS[meta ? meta.tone : "neutral"];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-sans font-medium uppercase tracking-wider border ${badgeStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current me-1.5 opacity-75" />
      {label}
    </span>
  );
};
