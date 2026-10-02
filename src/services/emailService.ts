import { formatPKR } from "../utils/currency";

export interface EmailPayload {
  to: string;
  subject: string;
  template:
    | "welcome"
    | "order_confirmation"
    | "payment_confirmation"
    | "order_status"
    | "abandoned_cart"
    | "password_reset"
    | "contact_enquiry";
  data: Record<string, any>;
}

// Canonical contact details, kept in step with the Contact page.
const ATELIER_LOCATION = "Rahim Yar Khan, Pakistan";
const ATELIER_EMAIL = "xeltriotechnologies@gmail.com";
const ATELIER_PHONE = "+92 321 8602034";

// Links are resolved when the email is built, not at build time, so they point
// at wherever the storefront is actually running.
const siteOrigin = (): string => (typeof window !== "undefined" ? window.location.origin : "");

export const generateEmailHTML = (template: EmailPayload["template"], data: Record<string, any>): string => {
  const origin = siteOrigin();

  const brandHeader = `
    <div style="background-color: #08111C; padding: 24px; text-align: center; border-bottom: 2px solid #C8A96B;">
      <h1 style="color: #C8A96B; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; letter-spacing: 4px; margin: 0;">HM SIGNATURE</h1>
      <p style="color: #A0B2C6; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Luxury Fragrance Atelier</p>
    </div>
  `;

  const brandFooter = `
    <div style="background-color: #08111C; padding: 20px; text-align: center; border-top: 1px solid #10283D; font-family: sans-serif; font-size: 11px; color: #6B7C93;">
      <p style="margin: 0; color: #C8A96B;">HM SIGNATURE ATELIER • ${ATELIER_LOCATION.toUpperCase()}</p>
      <p style="margin: 6px 0 0 0;">For assistance: ${ATELIER_EMAIL} | ${ATELIER_PHONE}</p>
    </div>
  `;

  switch (template) {
    case "order_confirmation":
      return `
        <div style="font-family: sans-serif; background-color: #08111C; color: #F4F6F9; padding: 20px;">
          <div style="max-w: 600px; margin: 0 auto; background-color: #10283D; border: 1px solid #C8A96B; border-radius: 8px; overflow: hidden;">
            ${brandHeader}
            <div style="padding: 30px;">
              <h2 style="font-family: serif; color: #F4F6F9; font-size: 22px; margin-top: 0;">Order received — ${data.orderNumber}</h2>
              <p style="color: #A0B2C6; font-size: 14px; line-height: 1.6;">Dear ${data.customerName},</p>
              <p style="color: #A0B2C6; font-size: 14px; line-height: 1.6;">Thank you for selecting HM Signature. We have received your order and it is awaiting payment confirmation. Preparation begins once the payment is confirmed, and a tracking reference is assigned when the order is dispatched.</p>
              
              <div style="background-color: #08111C; border: 1px solid rgba(200, 169, 107, 0.3); padding: 16px; border-radius: 6px; margin: 20px 0;">
                <p style="color: #C8A96B; font-weight: bold; margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase;">ORDER SUMMARY</p>
                <p style="color: #F4F6F9; margin: 4px 0; font-size: 14px;"><strong>Total payable:</strong> ${formatPKR(Number(data.total) || 0)}</p>
                <p style="color: #F4F6F9; margin: 4px 0; font-size: 14px;"><strong>Payment method:</strong> ${data.paymentMethod || "Manual payment"}</p>
                <p style="color: #F4F6F9; margin: 4px 0; font-size: 14px;"><strong>Delivery city:</strong> ${data.shippingCity}, Pakistan</p>
              </div>

              <a href="${origin}/account/orders" style="display: inline-block; background-color: #C8A96B; color: #08111C; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">View order status</a>
            </div>
            ${brandFooter}
          </div>
        </div>
      `;

    case "order_status":
      return `
        <div style="font-family: sans-serif; background-color: #08111C; color: #F4F6F9; padding: 20px;">
          <div style="max-w: 600px; margin: 0 auto; background-color: #10283D; border: 1px solid #C8A96B; border-radius: 8px; overflow: hidden;">
            ${brandHeader}
            <div style="padding: 30px;">
              <h2 style="font-family: serif; color: #F4F6F9; font-size: 22px; margin-top: 0;">Order status update: ${data.status}</h2>
              <p style="color: #A0B2C6; font-size: 14px; line-height: 1.6;">Dear ${data.customerName},</p>
              <p style="color: #A0B2C6; font-size: 14px; line-height: 1.6;">Your order <strong>${data.orderNumber}</strong> status has been updated to <strong style="color: #C8A96B;">${data.status}</strong>.</p>
              
              ${
                data.trackingNumber
                  ? `<p style="color: #F4F6F9; font-size: 14px; background: #08111C; padding: 12px; border-radius: 4px; border: 1px solid #C8A96B;">
                      Courier: <strong>${data.courier}</strong><br/>
                      Tracking reference: <strong style="color: #C8A96B;">${data.trackingNumber}</strong>
                    </p>`
                  : ""
              }

              <a href="${origin}/account/orders" style="display: inline-block; background-color: #C8A96B; color: #08111C; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">Track in account</a>
            </div>
            ${brandFooter}
          </div>
        </div>
      `;

    case "contact_enquiry":
      return `
        <div style="font-family: sans-serif; background-color: #08111C; color: #F4F6F9; padding: 20px;">
          <div style="max-w: 600px; margin: 0 auto; background-color: #10283D; border: 1px solid #C8A96B; border-radius: 8px; overflow: hidden;">
            ${brandHeader}
            <div style="padding: 30px;">
              <h2 style="font-family: serif; color: #F4F6F9; font-size: 22px; margin-top: 0;">Website enquiry — ${data.subject || "General"}</h2>
              <p style="color: #A0B2C6; font-size: 14px; line-height: 1.6;">From <strong style="color: #F4F6F9;">${data.name}</strong> (${data.email})</p>
              <p style="color: #A0B2C6; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
              <p style="color: #6B7C93; font-size: 12px; line-height: 1.6;">Reply to the address above.</p>
            </div>
            ${brandFooter}
          </div>
        </div>
      `;

    default:
      return `
        <div style="font-family: sans-serif; background-color: #08111C; color: #F4F6F9; padding: 20px;">
          <div style="max-w: 600px; margin: 0 auto; background-color: #10283D; border: 1px solid #C8A96B; border-radius: 8px; overflow: hidden;">
            ${brandHeader}
            <div style="padding: 30px;">
              <h2 style="font-family: serif; color: #F4F6F9; font-size: 22px; margin-top: 0;">${data.title || "HM Signature Concierge"}</h2>
              <p style="color: #A0B2C6; font-size: 14px; line-height: 1.6;">${data.message || "Thank you for connecting with HM Signature."}</p>
            </div>
            ${brandFooter}
          </div>
        </div>
      `;
  }
};

export const sendTransactionalEmail = async (payload: EmailPayload): Promise<boolean> => {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        template: payload.template,
        html: generateEmailHTML(payload.template, payload.data),
        data: payload.data,
      }),
    });

    if (!response.ok) return false;
    try {
      const result = await response.json();
      return Boolean(result && result.success === true);
    } catch {
      // Non-JSON response (e.g. SPA fallback HTML) — treat as not delivered
      return false;
    }
  } catch {
    console.warn("Transactional email unavailable:", payload.subject);
    return false;
  }
};
