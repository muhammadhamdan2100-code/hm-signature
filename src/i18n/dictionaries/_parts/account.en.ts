// pending merge into src/i18n/dictionaries/en.ts
// Account dashboard: hero, order tabs, order cards, delivery notes and payment-proof copy.
// The two stepper labels that are also status values reuse `status.*` from the page itself,
// so a single source of copy wins there. "HM Signature", "JazzCash", "Raast", "PayFast" and
// "Xeltrio" stay untouched; `{name}`, `{count}`, `{number}` and `{method}` are interpolated.
export const account = {
  // Welcome hero
  privilegedMember: "HM SIGNATURE PRIVILEGED MEMBER",
  welcomeBack: "Welcome back, {name}",
  valuedPatron: "Valued Patron",
  adminWorkspace: "Admin Workspace",

  // Section tabs
  ordersTab: "Orders",
  addressesTab: "Saved addresses",

  // Orders panel
  ordersEyebrow: "HAUTE PARFUMERIE ACQUISITIONS",
  ordersTitle: "Your Fragrance Orders ({count})",
  browseCatalog: "Browse Catalog",
  loadingOrders: "Loading your orders",
  ordersLoadError: "We could not load your orders.",
  tryAgain: "Try Again",
  noOrdersTitle: "No Orders Found",
  noOrdersBody:
    "Your haute parfumerie acquisitions will appear here alongside real-time laboratory status and tracking details.",
  exploreFragrances: "Explore Fragrances",
  refLabel: "REF #",
  placedOn: "Placed on",
  itemsHeading: "ORDERED EXTRAITS & ACQUISITIONS",
  quantityPrefix: "Qty:",
  skuLabel: "SKU:",
  each: "each",

  // Order stepper
  stepperHeading: "DISPATCH PROGRESS & LAB STATUS",
  stageOrderPlaced: "Order Placed",
  stageOrderPlacedDesc: "Acquisition registered",
  stagePaymentConfirmed: "Payment Confirmed",
  stagePaymentConfirmedDesc: "Order validated",
  stageAtelierHandcrafting: "Atelier Handcrafting",
  stageAtelierHandcraftingDesc: "Batch formulation",
  stageDispatchedDesc: "Handed to courier",
  stageOutForDeliveryDesc: "Arriving today",
  stageDeliveredDesc: "Signed by recipient",

  // Cancelled / returned banner
  orderStatusPrefix: "Order Status:",
  cancelledOrderBody:
    "This order was cancelled. Please contact atelier concierge for refunds or assistance.",
  returnedOrderBody: "Items from this order were returned and processed at our atelier.",

  // Shipping, courier and timeline panels
  deliveryHeading: "DELIVERY DESTINATION",
  addressFallback: "Address provided at checkout",
  estimatedDelivery: "Estimated delivery:",
  courierHeading: "COURIER & TRACKING DETAILS",
  courierLabel: "Courier:",
  toBeAdvised: "To be advised",
  trackingIdLabel: "Tracking ID:",
  awaitingIssue: "Awaiting issue",
  openCourierTracking: "Open courier tracking",
  trackingPending: "Tracking will appear here once your order has been dispatched.",
  timelineHeading: "ORDER TIMELINE",
  refundHeading: "REFUND RECORDS",

  // Delivery notes and order actions
  deliveryNotesHeading: "DELIVERY NOTES",
  notesEditableHint: "Add delivery instructions while the order is still being prepared.",
  notesLockedHint: "Notes can no longer be edited on this order.",
  track: "Track",
  saveNote: "Save Note",
  addNote: "Add Note",
  working: "Working…",
  cancelOrder: "Cancel Order",
  notesAriaLabel: "Delivery notes for this order",
  notesPlaceholder: "e.g. Please call on arrival, the gate code is 4412.",
  cancelPrompt: "Cancel order {number}? Please tell us briefly why (optional).",
  orderCancelled:
    "Order {number} was cancelled. Any reserved stock has been returned to the atelier.",
  cancelFailed: "This order could not be cancelled.",
  noteSaved: "Your note was added to this order.",
  noteSaveFailed: "Your note could not be saved.",

  // Payment method badges
  jazzCashWallet: "JazzCash Wallet",
  raastInstantId: "Raast Instant ID",
  bankWireTransfer: "Bank Wire Transfer",
  payfastCardGateway: "PayFast Card Gateway",
  cashOnDelivery: "Cash on Delivery",

  // Payment proof upload
  proofHeading: "Payment Receipt & Screenshot Upload",
  paymentMethodTag: "{method} Payment",
  proofReviewNote:
    "Payment proof will be reviewed by our team. Order status remains pending verification until approved.",
  proofSubmitted:
    "Your payment screenshot is with us. The atelier confirms receipt once it has been reviewed.",
  proofUnavailable:
    "Payment proof upload is unavailable right now. Please contact the concierge.",
  proofSessionExpired:
    "Your session has expired. Please sign in again to submit your payment proof.",
  proofUploadFailed: "Your payment screenshot could not be uploaded. Please try again.",
  proofAttachFailed:
    "The screenshot was uploaded but could not be attached to your order. Please try again.",
  proofSubmitFailed: "Your payment screenshot could not be submitted. Please try again.",
  proofImageAlt: "Payment Receipt",
  proofAttached: "Payment Proof Attached",
  uploadedReceipt: "Uploaded Receipt",
  removeProofTitle: "Remove the selected screenshot",
  submitProof: "Submit Proof",
  replaceProofTitle: "Attach a new payment screenshot",
  replaceProof: "Replace Proof",
  proofDropzoneLabel: "Click to select receipt screenshot",
  proofFormatsHint: "Supports JPG, PNG, WEBP (Max 10MB)",
};
