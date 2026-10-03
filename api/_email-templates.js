// Server-side email templates. One source of truth for both the queue worker and
// the direct enquiry path, so a message cannot look different in dev than in prod.
//
// Nothing here trusts its input: every value is escaped before it reaches HTML,
// and only the template ids listed in TEMPLATES can be rendered at all.

const escape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

const money = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `Rs ${number.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

function layout(title, bodyHtml, footerNote) {
  return `<div style="background:#08111C;padding:24px;font-family:Georgia,serif">
  <div style="max-width:600px;margin:0 auto;background:#10283D;border:1px solid #C8A96B;border-radius:8px;overflow:hidden">
    <div style="padding:24px;text-align:center;border-bottom:2px solid #C8A96B">
      <p style="color:#C8A96B;font-size:22px;letter-spacing:4px;margin:0">HM SIGNATURE</p>
      <p style="color:#A0B2C6;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:6px 0 0">Luxury Fragrance Atelier</p>
    </div>
    <div style="padding:28px">
      <h1 style="color:#F4F6F9;font-size:21px;margin:0 0 14px">${escape(title)}</h1>
      ${bodyHtml}
    </div>
    <div style="padding:18px;border-top:1px solid #1E3D57;font-family:Arial,sans-serif;font-size:11px;color:#6B7C93">
      <p style="margin:0;color:#C8A96B">HM SIGNATURE ATELIER • RAHIM YAR KHAN, PAKISTAN</p>
      ${footerNote ? `<p style="margin:6px 0 0">${footerNote}</p>` : ""}
    </div>
  </div>
</div>`;
}

const para = (text) =>
  `<p style="color:#A0B2C6;font-size:14px;line-height:1.7;margin:0 0 12px">${text}</p>`;

const line = (label, value) =>
  `<p style="color:#F4F6F9;font-size:14px;margin:4px 0"><strong>${escape(label)}:</strong> ${value}</p>`;

const linkBlock = (href, label) =>
  href
    ? `<p style="margin:18px 0 0"><a href="${escape(href)}" style="display:inline-block;background:#C8A96B;color:#08111C;padding:11px 20px;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;border-radius:4px">${escape(label)}</a></p>`
    : "";

// Marketing-style messages must carry a working opt-out. It links to the customer's
// own preference panel rather than asking them to reply, because a reply is something
// the application cannot act on automatically.
const preferenceLink = (ctx) =>
  `<a href="${escape(`${ctx.origin}/account#communication-preferences`)}" style="color:#C8A96B">manage your email preferences</a>`;

export const TEMPLATES = {
  order_confirmation: (d, ctx) => ({
    title: `Order ${escape(d.orderNumber)} received`,
    html:
      para(`Dear ${escape(d.customerName)},`) +
      para(
        "Thank you for selecting HM Signature. Your order has been recorded and enters preparation once payment is confirmed. A tracking reference appears on your order page as soon as the parcel is dispatched."
      ) +
      line("Order", escape(d.orderNumber)) +
      line("Total payable", money(d.total)) +
      line("Payment method", escape(d.paymentMethod)) +
      (d.shippingCity ? line("Delivery city", escape(d.shippingCity)) : "") +
      linkBlock(`${ctx.origin}/account/orders`, "View order status"),
    footer: `Keep this reference for any correspondence: ${escape(d.orderNumber)}`,
  }),

  payment_confirmation: (d, ctx) => ({
    title: `Payment confirmed for ${escape(d.orderNumber)}`,
    html:
      para(`Dear ${escape(d.customerName)},`) +
      para("We have confirmed your payment. Your fragrance moves into preparation now.") +
      line("Order", escape(d.orderNumber)) +
      line("Amount", money(d.total)) +
      line("Method", escape(d.paymentMethod)) +
      linkBlock(`${ctx.origin}/account/orders`, "Track this order"),
    footer: null,
  }),

  order_processing: (d, ctx) => ({
    title: `Preparing order ${escape(d.orderNumber)}`,
    html:
      para(`Dear ${escape(d.customerName)},`) +
      para(
        `Your order is recorded as <strong style="color:#C8A96B">${escape(d.status)}</strong>. You will hear from us again the moment it leaves the atelier.`
      ) +
      linkBlock(`${ctx.origin}/account/orders`, "View order status"),
    footer: null,
  }),

  order_shipped: (d, ctx) => ({
    title: `Order ${escape(d.orderNumber)} is on its way`,
    html:
      para(`Dear ${escape(d.customerName)},`) +
      para("Your parcel has been dispatched.") +
      line("Courier", escape(d.courier)) +
      (d.trackingId ? line("Tracking reference", escape(d.trackingId)) : "") +
      (d.estimatedDelivery ? line("Estimated delivery", escape(d.estimatedDelivery)) : "") +
      linkBlock(d.trackingUrl || `${ctx.origin}/track-order?id=${encodeURIComponent(d.orderNumber || "")}`, "Follow the delivery"),
    footer: "Reference numbers appear on your order page at any time.",
  }),

  order_delivered: (d, ctx) => ({
    title: `Order ${escape(d.orderNumber)} delivered`,
    html:
      para(`Dear ${escape(d.customerName)},`) +
      para(
        "Our records show your parcel was delivered. If anything is missing or damaged, reply to this message and the atelier will arrange it."
      ) +
      linkBlock(`${ctx.origin}/account/orders`, "Open your orders"),
    footer: null,
  }),

  order_cancelled: (d, ctx) => ({
    title: `Order ${escape(d.orderNumber)} cancelled`,
    html:
      para(`Dear ${escape(d.customerName)},`) +
      para(
        "This order is cancelled and any reserved stock has been returned. Nothing further is required from you."
      ) +
      line("Order", escape(d.orderNumber)) +
      line("Recorded total", money(d.total)) +
      line("Payment method", escape(d.paymentMethod)) +
      linkBlock(`${ctx.origin}/account/orders`, "View your orders"),
    footer: "Refunds, where applicable, are recorded separately by the atelier.",
  }),

  refund_processed: (d) => ({
    title: `Refund completed for ${escape(d.orderNumber)}`,
    html:
      para(`Dear ${escape(d.customerName)},`) +
      para("Your refund has been recorded as completed.") +
      line("Order", escape(d.orderNumber)) +
      line("Amount", `${escape(d.currency || "PKR")} ${money(d.amount)}`) +
      (d.reference ? line("Provider reference", escape(d.reference)) : ""),
    footer: "Bank transfers can take a few working days to appear.",
  }),

  refund_failed: (d) => ({
    title: `Refund could not be completed for ${escape(d.orderNumber)}`,
    html:
      para(`Dear ${escape(d.customerName)},`) +
      para(
        "We were not able to complete this refund. The atelier will contact you to settle it — no action is needed from you right now."
      ) +
      line("Order", escape(d.orderNumber)) +
      (d.reason ? line("Recorded reason", escape(d.reason)) : ""),
    footer: null,
  }),

  review_request: (d, ctx) => ({
    title: `How does ${escape(d.orderNumber)} sit on your skin?`,
    html:
      para(`Dear ${escape(d.customerName)},`) +
      para(
        "Your order is marked delivered. If you would like to add a note to the fragrance page, we read every one — reviews appear publicly only after staff approval."
      ) +
      linkBlock(`${ctx.origin}/account/orders`, "Share your impression"),
    footer: `You will not be asked twice for the same order. You can ${preferenceLink(ctx)} at any time.`,
  }),

  abandoned_cart: (d, ctx) => ({
    title: "Your bag is still here",
    html:
      para(`Dear ${escape(d.customerName)},`) +
      para(
        "The fragrances you saved are still reserved in your bag. Nothing has been ordered and no payment has been taken."
      ) +
      (d.summary ? line("In your bag", escape(d.summary)) : "") +
      linkBlock(`${ctx.origin}/cart`, "Return to your bag"),
    footer: `This reminder is sent once per bag. To stop it, ${preferenceLink(ctx)}.`,
  }),

  admin_new_order: (d) => ({
    title: `New order ${escape(d.orderNumber)}`,
    html:
      para("A new order has been recorded.") +
      line("Customer", escape(d.customerName)) +
      line("Total", money(d.total)) +
      line("Payment method", escape(d.paymentMethod)),
    footer: "Internal notice — staff copy.",
  }),

  admin_payment_verified: (d) => ({
    title: `Payment verified for ${escape(d.orderNumber)}`,
    html: para("Staff marked a payment as verified.") + line("Order", escape(d.orderNumber)),
    footer: "Internal notice — staff copy.",
  }),

  admin_refund_requested: (d) => ({
    title: "Refund awaiting review",
    html:
      para("A refund has been recorded and needs staff review.") +
      line("Amount", `${escape(d.currency || "PKR")} ${escape(d.amount)}`) +
      (d.reason ? line("Reason", escape(d.reason)) : ""),
    footer: "Internal notice — staff copy.",
  }),

  contact_enquiry: (d, ctx) => ({
    title: `Website enquiry — ${escape(d.subject || "General")}`,
    html:
      para(`From <strong style="color:#F4F6F9">${escape(d.name)}</strong> (${escape(d.email)})`) +
      `<p style="color:#A0B2C6;font-size:14px;line-height:1.7;white-space:pre-wrap">${escape(d.message)}</p>` +
      `<p style="color:#6B7C93;font-size:12px">Reply to the address above. Submitted from ${escape(ctx.origin || "the storefront")}.</p>`,
    footer: null,
  }),
};

export function renderEmail(template, data, ctx = {}) {
  const build = TEMPLATES[template];
  if (!build) return null;
  const view = build(data || {}, { origin: ctx.origin || "", ...ctx });
  return {
    html: layout(view.title, view.html, view.footer),
    text: stripTags(view.title) + "\n\n" + stripTags(view.html),
  };
}

function stripTags(html) {
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
