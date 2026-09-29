import React from "react";
import type { OrderStatus } from "../context/AdminDataContext";

interface StatusBadgeProps {
  status: OrderStatus | "In Stock" | "Low Stock" | "Out of Stock" | "Active" | "Inactive" | "VIP" | "Pending" | "Approved" | "Rejected" | "Scheduled" | "Ended" | "Paid" | "Refunded" | "Failed" | string;
  type?: "order" | "stock" | "general" | "review";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let badgeStyle = "bg-navy2 text-muted border-gold/20";

  switch (status) {
    case "Delivered":
    case "In Stock":
    case "Active":
    case "Approved":
    case "Paid":
    case "VIP":
      badgeStyle = "bg-emerald-950/40 text-emerald-300 border-emerald-500/30";
      break;
    case "Processing":
    case "Confirmed":
    case "Low Stock":
    case "Scheduled":
    case "In Transit":
      badgeStyle = "bg-amber-950/40 text-amber-300 border-amber-500/30";
      break;
    case "Pending":
    case "Unfulfilled":
      badgeStyle = "bg-sky-950/40 text-sky-300 border-sky-500/30";
      break;
    case "Shipped":
      badgeStyle = "bg-indigo-950/40 text-indigo-300 border-indigo-500/30";
      break;
    case "Cancelled":
    case "Out of Stock":
    case "Rejected":
    case "Inactive":
    case "Failed":
    case "Blocked":
      badgeStyle = "bg-rose-950/40 text-rose-300 border-rose-500/30";
      break;
    case "Refunded":
      badgeStyle = "bg-purple-950/40 text-purple-300 border-purple-500/30";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-sans font-medium uppercase tracking-wider border ${badgeStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {status}
    </span>
  );
};
