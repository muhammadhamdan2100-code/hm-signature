export interface EmailPayload {
  to: string;
  subject: string;
  template:
    | "welcome"
    | "order_confirmation"
    | "payment_confirmation"
    | "order_status"
    | "abandoned_cart"
    | "password_reset";
  data: Record<string, any>;
}

export const generateEmailHTML = (template: EmailPayload["template"], data: Record<string, any>): string => {
  const brandHeader = `
    <div style="background-color: #08111C; padding: 24px; text-align: center; border-bottom: 2px solid #C8A96B;">
      <h1 style="color: #C8A96B; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; letter-spacing: 4px; margin: 0;">HM SIGNATURE</h1>
      <p style="color: #A0B2C6; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Luxury Fragrance Atelier</p>
    </div>
  `;

  const brandFooter = `
    <div style="background-color: #08111C; padding: 20px; text-align: center; border-top: 1px solid #10283D; font-family: sans-serif; font-size: 11px; color: #6B7C93;">
      <p style="margin: 0; color: #C8A96B;">HM SIGNATURE ATELIER • GULBERG III, LAHORE</p>
      <p style="margin: 6px 0 0 0;">For concierge assistance: concierge@hmsignature.com | +92 300 8472910</p>
    </div>
  `;

  switch (template) {
    case "order_confirmation":
      return `
        <div style="font-family: sans-serif; background-color: #08111C; color: #F4F6F9; padding: 20px;">
          <div style="max-w: 600px; margin: 0 auto; background-color: #10283D; border: 1px solid #C8A96B; border-radius: 8px; overflow: hidden;">
            ${brandHeader}
            <div style="padding: 30px;">
              <h2 style="font-family: serif; color: #F4F6F9; font-size: 22px; margin-top: 0;">Order Confirmed — ${data.orderNumber}</h2>
              <p style="color: #A0B2C6; font-size: 14px; line-height: 1.6;">Esteemed ${data.customerName},</p>
              <p style="color: #A0B2C6; font-size: 14px; line-height: 1.6;">Thank you for selecting HM Signature. Your extrait de parfum order has been registered in our Lahore laboratory and is being prepared with artisan care.</p>
              
              <div style="background-color: #08111C; border: 1px solid rgba(200, 169, 107, 0.3); padding: 16px; border-radius: 6px; margin: 20px 0;">
                <p style="color: #C8A96B; font-weight: bold; margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase;">ORDER SUMMARY</p>
                <p style="color: #F4F6F9; margin: 4px 0; font-size: 14px;"><strong>Total Amount Paid:</strong> Rs. ${Number(data.total).toLocaleString()}</p>
                <p style="color: #F4F6F9; margin: 4px 0; font-size: 14px;"><strong>Payment Method:</strong> ${data.paymentMethod || "Stripe / Credit Card"}</p>
                <p style="color: #F4F6F9; margin: 4px 0; font-size: 14px;"><strong>Shipping Address:</strong> ${data.shippingCity}, Pakistan</p>
              </div>

              <a href="http://localhost:5173/account/orders" style="display: inline-block; background-color: #C8A96B; color: #08111C; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">View Order Status</a>
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
              <h2 style="font-family: serif; color: #F4F6F9; font-size: 22px; margin-top: 0;">Order Status Update: ${data.status}</h2>
              <p style="color: #A0B2C6; font-size: 14px; line-height: 1.6;">Dear ${data.customerName},</p>
              <p style="color: #A0B2C6; font-size: 14px; line-height: 1.6;">Your order <strong>${data.orderNumber}</strong> status has been updated to <strong style="color: #C8A96B;">${data.status}</strong>.</p>
              
              ${
                data.trackingNumber
                  ? `<p style="color: #F4F6F9; font-size: 14px; background: #08111C; padding: 12px; border-radius: 4px; border: 1px solid #C8A96B;">
                      Courier: <strong>${data.courier}</strong><br/>
                      Tracking Reference: <strong style="color: #C8A96B;">${data.trackingNumber}</strong>
                    </p>`
                  : ""
              }

              <a href="http://localhost:5173/account/orders" style="display: inline-block; background-color: #C8A96B; color: #08111C; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">Track in Account</a>
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
