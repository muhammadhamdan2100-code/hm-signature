// pending merge into src/i18n/dictionaries/en.ts
// Copy here is transcribed from the storefront's own rendered strings: every value is what the
// interface said in English before it could be translated, so merging must not reword it.
// Keys reached through a variable (`t(stage.labelKey)`, `t(k)`) live in these objects too.

export const productAdditional = {
  // Bottle size selector and availability
  selectBottleSize: "SELECT BOTTLE SIZE:",
  soldOutWord: "Sold out",
  nLeft: "{count} left",
  priceOnRequestLower: "price on request",
  decreaseQuantity: "Decrease quantity",
  increaseQuantity: "Increase quantity",
  addToWishlistShort: "Add to wishlist",
  removeFromWishlistShort: "Remove from wishlist",
  addToBagSize: "ADD TO BAG ({size})",
  buyNow: "BUY NOW",
  freeShippingShipsIn: "Free shipping on orders over {amount} · Ships in {estimate}",

  // Loading, missing product and gallery
  loadingAtelierCreation: "Loading Atelier Creation…",
  fragranceNotFound: "Fragrance not found.",
  backToCollections: "BACK TO COLLECTIONS",
  imageThumbnails: "Product image thumbnails",
  viewImageOf: "View image {index} of {total}",

  // Rating summary and specification panel
  reviewWord: "review",
  reviewsWord: "reviews",
  notYetRated: "Not yet rated by clients",
  fragranceFamilyLabel: "FRAGRANCE FAMILY",
  intensityLabel: "INTENSITY",
  occasionLabel: "OCCASION",
  seasonLabel: "SEASON",
  concentrationLabel: "CONCENTRATION",
  scentProfileLabel: "SCENT PROFILE",
  selectedSizeLabel: "SELECTED SIZE",
  availabilityLabel: "AVAILABILITY",
  availabilityOutOfStock: "OUT OF STOCK",
  availabilityOnlyLeft: "ONLY {count} LEFT",
  availabilityInStockCount: "IN STOCK ({count} available)",
  genderLabel: "GENDER",

  // Fragrance pyramid
  fragrancePyramid: "FRAGRANCE PYRAMID",
  topNotes: "TOP NOTES",
  heartNotes: "HEART NOTES",
  baseNotes: "BASE NOTES",
  pyramidEmpty:
    "The full note pyramid for this fragrance hasn't been listed yet. Once our perfumers publish it, it will appear here.",

  // Detail tabs: the English tab names are the identifiers, these are the labels
  fragranceDetailsTabs: "Fragrance details",
  tabDescription: "DESCRIPTION",
  tabIngredients: "INGREDIENTS",
  tabHowToWear: "HOW TO WEAR",
  tabShippingReturns: "SHIPPING & RETURNS",
  tabReviews: "REVIEWS",
  ingredientsEmpty:
    "The full ingredient declaration for this fragrance is being prepared by the atelier.",
  howToWearBody:
    "Apply to pulse points — wrists, neck and behind the ears — after showering, when skin is warm. {name} is an extrait de parfum, so it is highly concentrated: start with 2–3 sprays and add only if you want more presence.",
  shippingReturnsBody:
    "Free standard shipping on all orders over {amount}. Orders typically ship within {estimate}. Unopened items may be returned within 30 days of delivery for a full refund.",

  // Reviews
  noReviewsYet: "No reviews yet. Be the first to share your impression.",
  verifiedPurchase: "· Verified Purchase",
  writeAReview: "WRITE A REVIEW",
  rateStars: "Rate {count} stars",
  reviewTitlePlaceholder: "Title (optional)",
  reviewCommentPlaceholder: "Share your impression of this fragrance…",
  submittingReview: "SUBMITTING…",
  submitReview: "SUBMIT REVIEW",
  reviewAwaitingApproval: "Thank you — your review is awaiting approval.",
  reviewSubmitFailed: "Could not submit your review.",

  // Related fragrance railings
  similarFragrances: "Similar Fragrances",
  recentlyViewed: "Recently Viewed",
  allFragrances: "ALL FRAGRANCES →",
  youMayAlsoLove: "You May Also Love",

  // Wishlist page
  wishlistTitle: "Your Wishlist",
  wishlistSubtitle: "Fragrances you've saved for later.",
  wishlistEmpty: "Your wishlist is empty.",
};

export const accountAdditional = {
  // Order confirmation page
  orderRecordNotFound: "Order Record Not Found",
  orderRecordNotFoundBody:
    "We could not locate the requested order reference. Please check your account history.",
  viewMyOrders: "VIEW MY ORDERS",
  continueShopping: "CONTINUE SHOPPING",
  viewMyOrdersPlain: "View My Orders",
  continueShoppingPlain: "Continue Shopping",
  orderReceived: "ORDER RECEIVED",
  thankYouForOrder: "Thank you for your order",
  orderReceivedBody:
    "Your HM Signature order has been received and is awaiting payment confirmation. Preparation begins once we have confirmed your payment.",
  orderNumberLabel: "ORDER NUMBER",
  trackingReferenceLabel: "Tracking Reference",
  assignedOnceDispatched: "Assigned once dispatched",
  orderDateLabel: "Order Date",
  paymentMethodLabel: "Payment Method",
  paymentStatusLabel: "Payment Status",
  orderStatusLabel: "Order Status",
  fragranceExtraits: "Fragrance Extraits",
  qtyWord: "Qty",
  itemsSubtotal: "Items Subtotal",
  totalAmountPaidPayable: "Total Amount Paid / Payable",
  trackThisOrder: "Track this order",

  // Address book
  deliveryDestinations: "DELIVERY DESTINATIONS",
  savedAddressesTitle: "Your Saved Addresses ({count})",
  addAddress: "Add address",
  editAddress: "Edit address",
  addDeliveryAddress: "Add a delivery address",
  cancelAddressForm: "Cancel address form",
  addressLabelField: "Label",
  addressLabelPlaceholder: "Home, Atelier apartment, Office…",
  recipientName: "Recipient name",
  recipientNamePlaceholder: "Full name on the parcel",
  streetAddress: "Street address",
  streetAddressPlaceholder: "House / apartment number and street",
  apartmentOptional: "Apartment, floor (optional)",
  apartmentPlaceholder: "Flat, building, landmark",
  stateRegion: "State / region",
  postalCodeField: "Postal code",
  contactNumber: "Contact number",
  useAsDefault: "Use this as my default delivery address",
  saving: "Saving…",
  saveChanges: "Save changes",
  saveAddress: "Save address",
  loadingAddresses: "Loading your saved addresses…",
  noAddressesTitle: "No saved addresses yet",
  noAddressesBody:
    "Save a delivery destination once and use it on your next order. You can also enter an address at checkout without signing in.",
  defaultWord: "Default",
  setAsDefault: "Set as default",
  editWord: "Edit",
  confirmRemove: "Confirm remove",
  keep: "Keep",
  addressSaved: "Your address was saved.",
  addressUpdated: "Your address was updated.",
  addressNotSaved: "The address was not saved. Please try again.",
  defaultAddressUpdated: "Default delivery address updated.",
  defaultAddressFailed: "That address could not be set as default.",
  addressRemoved: "Your address was removed.",
  addressNotRemoved: "The address could not be removed.",

  // Communication preferences
  emailPreferences: "Email preferences",
  emailPreferencesHint: "Chosen by you and stored against your account.",
  promotionalReminders: "Promotional reminders",
  promotionalRemindersBody:
    "A single reminder if you leave a saved bag unpaid for a while. Nothing is sent about promotions you have not asked for, and switching this off stops the reminder at once.",
  transactionalEmailsBody:
    "Order confirmations, payment receipts and delivery notices are part of your purchase and are not switched off here.",
  savingUpper: "SAVING…",
  savePreference: "Save preference",
  loadingChoice: "Loading your choice…",
  prefSavedMarketing: "Saved. A reminder may reach you if you leave a saved bag unpaid.",
  prefSavedOff: "Saved. Promotional reminders are turned off for this account.",
  prefSaveFailed: "Your choice could not be saved. Please try again.",
};

export const commonAdditional = {
  home: "Home",

  // 404
  notFoundTitle: "This Page Has No Signature",
  notFoundBody: "The page you're looking for doesn't exist.",
  returnHome: "RETURN HOME",

  // Concierge chat (a storefront-wide control, so it sits with the common copy)
  chatWithConcierge: "Chat with the HM Signature concierge",
  conciergeDialogLabel: "HM Signature fragrance concierge",
  fragranceConcierge: "Fragrance Concierge",
  closeConcierge: "Close concierge",
  startNewConversation: "Start a new conversation",
  conciergeGreeting:
    "Welcome. I can help with fragrance families and notes, bottle sizes and prices, gifting, delivery across Pakistan, and the status of an order placed with this account.",
  conciergeApology:
    "I could not complete that request. Please try again, or reach our concierge directly.",
  conciergeNotEnabled: "The assistant is not enabled on this deployment yet.",
  conciergeDegradedBody:
    "Answers above are drawn directly from live catalogue and order records; the assistant could not add general guidance.",
  consultingAtelier: "Consulting the atelier…",
  conciergeSuggestionEvening: "Which fragrances suit evening wear?",
  conciergeSuggestionSizes: "What bottle sizes do you offer?",
  conciergeSuggestionRaast: "How do I pay with Raast?",
  conciergeSuggestionOrder: "Where is my order?",
  askTheConcierge: "Ask the concierge",
  conciergePlaceholderSignedIn: "Ask about scents, sizes or your order…",
  conciergePlaceholderGuest: "Ask about scents, sizes or delivery…",
  sendMessage: "Send message",
  whatsappConcierge: "WhatsApp concierge",
  signInForOrderStatus: "Sign in for order status",
};

export const statusAdditional = {
  noUpdates: "No status updates have been recorded for this order yet.",
  finalStatus: "Final status",
  currentStatus: "Current status",
};

export const validationAdditional = {
  reviewCommentRequired: "Please write a few words about the fragrance.",
  addressRequired: "Street address and city are required.",
};
