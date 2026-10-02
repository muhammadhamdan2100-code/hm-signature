// Vercel serverless function — POST /api/send-email
// Sends via SMTP only when SMTP_HOST/SMTP_USER/SMTP_PASS are configured in
// the deployment environment. Returns 501 {configured:false} otherwise so the
// client degrades gracefully instead of faking delivery. Credentials are never
// returned to or logged by the browser.
let mailTransport = null;

async function getMailer() {
  if (mailTransport) return mailTransport;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  const nodemailer = await import("nodemailer");
  mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return mailTransport;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const { to, subject, html } = req.body || {};

    if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(to)) || !subject) {
      res.status(400).json({ error: "Invalid email request." });
      return;
    }

    const mailer = await getMailer();
    if (!mailer) {
      res.status(501).json({ success: false, configured: false });
      return;
    }

    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: String(to),
      subject: String(subject),
      html: String(html || ""),
    });

    res.status(200).json({ success: true, configured: true });
  } catch (error) {
    console.error("Email function error:", error.message);
    res.status(500).json({ error: "Email delivery failed." });
  }
}
