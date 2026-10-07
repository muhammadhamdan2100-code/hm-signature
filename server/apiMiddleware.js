import express from "express";
import { createLogger } from "../api/_config.js";
import * as stripeNotify from "../api/stripe-notify.js";
import * as payfastStart from "../api/payfast-start.js";
import * as payfastNotify from "../api/payfast-notify.js";
import * as sendEmail from "../api/send-email.js";
import * as emailWorker from "../api/email-worker.js";
import * as automationWorker from "../api/automation-worker.js";
import * as paymentMethods from "../api/payment-methods.js";
import * as stripeStart from "../api/stripe-start.js";
import * as recommendations from "../api/recommendations.js";
import * as discovery from "../api/discovery.js";
import * as giftFinder from "../api/gift-finder.js";
import * as health from "./health.js";
import * as sitemap from "./sitemap.js";
import * as robots from "./robots.txt";

const router = express.Router();
const log = createLogger({ runtime: "server" });

// Health endpoint
router.get("/api/health", health.handler);

// Stripe webhooks (raw body for signature verification)
router.post("/api/stripe-notify", express.raw({ type: () => true, limit: "256kb" }), stripeNotify.default);

// Payment providers
router.get("/api/payment-methods", paymentMethods.default);
router.post("/api/stripe-start", stripeStart.default);
router.post("/api/payfast-start", payfastStart.default);
router.post("/api/payfast-notify", payfastNotify.default);

// Email service
router.post("/api/send-email", sendEmail.default);
router.all("/api/email-worker", emailWorker.default);

// Automation scheduler
router.all("/api/automation-worker", automationWorker.default);

// Phase 8 Brand Experience
router.get("/api/recommendations", recommendations.default);
router.get("/api/discovery", discovery.default);
router.get("/api/gift-finder", giftFinder.default);

// SEO
router.get("/api/sitemap", sitemap.default);
router.get("/api/robots", robots.default);

// AI Concierge proxy
router.post("/api/ai-chat", async (req, res) => {
  const { runConcierge, runInsights } = await import("./aiCore.js");
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "anonymous";
  const accessToken = String(req.headers.authorization || "").startsWith("Bearer ") ? String(req.headers.authorization).slice(7) : null;
  const body = req.body || {};
  
  try {
    const result =
      body.mode === "insights"
        ? await runInsights({ accessToken, ip })
        : await runConcierge({ messages: body.messages, accessToken, ip });
    res.status(result.status).json(result.body);
  } catch (err) {
    req.log.error(err.message);
    res.status(500).json({ error: "AI service unavailable" });
  }
});

// Admin routes
router.post("/api/admin/create-staff", async (req, res) => {
  const { serviceRoleKey, supabaseUrl } = await import("../api/_config.js");
  const ALLOWED_STAFF_ROLES = ["manager", "order_manager", "content_manager", "super_admin"];
  
  const key = serviceRoleKey();
  const url = supabaseUrl();

  if (!key || !url) {
    return res.status(503).json({ error: "Staff creation is not configured on this deployment." });
  }

  const authHeader = req.headers.authorization || "";
  const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!accessToken) return res.status(401).json({ error: "Authentication required." });

  const { createClient } = await import("@supabase/supabase-js");
  const supabaseAdmin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(accessToken);
  if (callerErr || !callerData.user) return res.status(401).json({ error: "Invalid or expired session." });

  const { data: callerProfile } = await supabaseAdmin.from("profiles").select("role,status").eq("id", callerData.user.id).maybeSingle();

  if (!callerProfile || callerProfile.status !== "active" || !["super_admin", "manager"].includes(callerProfile.role)) {
    return res.status(403).json({ error: "Only active managers or super admins can create staff." });
  }

  if (req.body.role === "super_admin" && callerProfile.role !== "super_admin") {
    return res.status(403).json({ error: "Only a super admin can create another super admin." });
  }

  if (!ALLOWED_STAFF_ROLES.includes(req.body.role)) {
    return res.status(400).json({ error: "Invalid staff role." });
  }

  const { email, password, fullName } = req.body || {};
  
  if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "A valid email address is required." });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "A password of at least 8 characters is required." });
  }

  const name = typeof fullName === "string" ? fullName.trim().slice(0, 120) : "";
  if (!name) return res.status(400).json({ error: "A staff name is required." });

  try {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: req.body.role },
    });

    if (userError || !userData.user) {
      const duplicate = /already registered|already exists/i.test(String(userError?.message || ""));
      return res.status(duplicate ? 409 : 400).json({
        error: duplicate ? "That email address is already registered." : "Staff account could not be created.",
      });
    }

    await supabaseAdmin.from("profiles").upsert({
      id: userData.user.id,
      email,
      full_name: name,
      role: req.body.role,
      status: "active",
      created_at: new Date().toISOString(),
    });

    res.json({ success: true, userId: userData.user.id });
  } catch (err) {
    req.log.error(err.message);
    res.status(500).json({ error: "Staff account was created but its profile could not be saved." });
  }
});

export default router;
