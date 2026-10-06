// pending merge into src/i18n/dictionaries/en.ts
// One key per distinct status label. The order/shipment values arrive from the database in
// English and are looked up with `status.${value.toLowerCase().replace(/\s+/g, "")}`, so these
// keys must stay lowercase with no spaces — an unknown value falls back to the raw database text.
export const status = {
  // Order lifecycle
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  outfordelivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  // Shipment / courier progress
  preparing: "Preparing",
  dispatched: "Dispatched",
  intransit: "In Transit",
  failedattempt: "Failed Attempt",
  unfulfilled: "Unfulfilled",
  // Payment state
  paid: "Paid",
  verified: "Verified",
  refunded: "Refunded",
  paidandverified: "Paid & Verified",
  paymentpending: "Payment Pending",
  verificationpending: "Verification Pending",
  paymentfailedrejected: "Payment Failed / Rejected",
};
