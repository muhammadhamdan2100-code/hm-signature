import React from "react";
import type { OrderStatus } from "../context/AdminDataContext";

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

/** Lower-case lookup key -> canonical Title Case label + tone. */
const STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  // Success / settled
  delivered: { label: "Delivered", tone: "success" },
  "in stock": { label: "In Stock", tone: "success" },
  active: { label: "Active", tone: "success" },
  approved: { label: "Approved", tone: "success" },
  paid: { label: "Paid", tone: "success" },
  verified: { label: "Verified", tone: "success" },
  processed: { label: "Processed", tone: "success" },
  recovered: { label: "Recovered", tone: "success" },
  vip: { label: "VIP", tone: "success" },

  // Awaiting action / in progress
  pending: { label: "Pending", tone: "progress" },
  "verification pending": { label: "Verification Pending", tone: "progress" },
  processing: { label: "Processing", tone: "progress" },
  confirmed: { label: "Confirmed", tone: "progress" },
  scheduled: { label: "Scheduled", tone: "progress" },
  "in transit": { label: "In Transit", tone: "progress" },
  "low stock": { label: "Low Stock", tone: "progress" },
  unfulfilled: { label: "Unfulfilled", tone: "progress" },

  // In motion / money moved (gold accent)
  shipped: { label: "Shipped", tone: "brand" },
  "out for delivery": { label: "Out for Delivery", tone: "brand" },
  refunded: { label: "Refunded", tone: "brand" },
  returned: { label: "Returned", tone: "brand" },
  "reminder sent": { label: "Reminder Sent", tone: "brand" },

  // Blocked / negative
  cancelled: { label: "Cancelled", tone: "danger" },
  canceled: { label: "Canceled", tone: "danger" },
  "out of stock": { label: "Out of Stock", tone: "danger" },
  rejected: { label: "Rejected", tone: "danger" },
  inactive: { label: "Inactive", tone: "danger" },
  failed: { label: "Failed", tone: "danger" },
  blocked: { label: "Blocked", tone: "danger" },
  suspended: { label: "Suspended", tone: "danger" },

  // Neutral / informational
  ended: { label: "Ended", tone: "neutral" },
  draft: { label: "Draft", tone: "neutral" },
  new: { label: "New", tone: "neutral" },
  returning: { label: "Returning", tone: "neutral" },
  unconverted: { label: "Unconverted", tone: "neutral" },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const raw = typeof status === "string" ? status.trim() : "";
  const meta =
    raw && Object.hasOwn(STATUS_META, raw.toLowerCase())
      ? STATUS_META[raw.toLowerCase()]
      : undefined;

  // Known statuses render Title Case; unknown values are shown exactly as given.
  const label = meta ? meta.label : status;
  const badgeStyle = TONE_CLASS[meta ? meta.tone : "neutral"];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-sans font-medium uppercase tracking-wider border ${badgeStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {label}
    </span>
  );
};
