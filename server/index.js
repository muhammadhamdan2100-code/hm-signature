import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  allowedOrigins,
  capabilities,
  createLogger,
  recentFailures,
  withRequestId,
  redactEmail,
  supabaseUrl,
  serviceRoleKey,
} from "../api/_config.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const log = createLogger({ runtime: "dev-server" });

// Request ids make one customer problem traceable across the proxy, the handler
// and the shared api/ implementation.
app.use((req, res, next) => {
  req.requestId =
    String(req.headers["x-request-id"] || "").slice(0, 64) || Math.random().toString(36).slice(2, 12);
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

app.use(cors({ origin: allowedOrigins(), credentials: false }));

// Stripe signs the exact request bytes, so the webhook must be read before anything parses it.
// Mounted first: express hands a request to the first matching layer, and a parsed-and-reserialized
// body can never be signature-verified.
const stripeNotifyHandler = (await import("../api/stripe-notify.js")).default;
app.post("/api/stripe-notify", express.raw({ type: () => true, limit: "256kb" }), withRequestId(stripeNotifyHandler));

app.use(express.json({ limit: "64kb" }));

// Payment providers live inside api/ so the dev proxy and the deployed functions
// behave identically. Nothing here may trust a browser-reported price or payment
// outcome.

// 1. TRANSACTIONAL EMAIL — the same hardened function Vercel runs (session check,
// recipient allowlist, template allowlist, rate limit, 501 while SMTP is unset).
const emailHandler = (await import("../api/send-email.js")).default;
app.post("/api/send-email", withRequestId(emailHandler));

// 2. SERVER-SIDE STAFF CREATION — requires a valid JWT from an active
// manager/super-admin. The service-role key never leaves this process.
const ALLOWED_STAFF_ROLES = ["manager", "order_manager", "content_manager", "super_admin"];

app.post(
  "/api/admin/create-staff",
  withRequestId(async (req, res) => {
    const key = serviceRoleKey();
    const url = supabaseUrl();

    if (!key || !url) {
      req.log.warn("staff creation unavailable", { reason: "server credentials not configured" });
      return res.status(503).json({ error: "Staff creation is not configured on this deployment." });
    }

    const authHeader = req.headers.authorization || "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!accessToken) return res.status(401).json({ error: "Authentication required." });

    const { email, password, fullName, role } = req.body || {};

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (callerErr || !callerData.user) return res.status(401).json({ error: "Invalid or expired session." });

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role,status")
      .eq("id", callerData.user.id)
      .maybeSingle();

    if (
      !callerProfile ||
      callerProfile.status !== "active" ||
      !["super_admin", "manager"].includes(callerProfile.role)
    ) {
      req.log.warn("staff creation refused", { reason: "caller is not an active manager" });
      return res.status(403).json({ error: "Only active managers or super admins can create staff." });
    }

    if (role === "super_admin" && callerProfile.role !== "super_admin") {
      return res.status(403).json({ error: "Only a super admin can create another super admin." });
    }

    if (!ALLOWED_STAFF_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid staff role." });
    }

    if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "A password of at least 8 characters is required." });
    }

    const name = typeof fullName === "string" ? fullName.trim().slice(0, 120) : "";
    if (!name) return res.status(400).json({ error: "A staff name is required." });

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role },
    });

    if (userError || !userData.user) {
      // Provider detail stays in the log; the operator gets an actionable reason.
      req.log.error("staff creation failed", { reason: userError?.message, email: redactEmail(email) });
      const duplicate = /already registered|already exists/i.test(String(userError?.message || ""));
      return res.status(duplicate ? 409 : 400).json({
        error: duplicate
          ? "That email address is already registered."
          : "Staff account could not be created. Please review the details and try again.",
      });
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userData.user.id,
      email,
      full_name: name,
      role,
      status: "active",
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      req.log.error("staff profile write failed", { reason: profileError.message });
      return res.status(500).json({ error: "Staff account was created but its profile could not be saved." });
    }

    req.log.info("staff account created", { role, email: redactEmail(email) });
    res.json({ success: true, userId: userData.user.id });
  })
);

// 3. EMAIL WORKER — same implementation Vercel runs (scheduler secret path and
// signed-in session path). Without SMTP or a service-role key it answers 503.
// GET is accepted too, because schedulers invoke a path with GET.
const emailWorkerHandler = (await import("../api/email-worker.js")).default;
app.get("/api/email-worker", emailWorkerHandler);
app.post("/api/email-worker", emailWorkerHandler);

// 3b. AUTOMATION WORKER — the Phase 6 scheduler entry point: sweep follow-ups into
// the outbox, then drain it. Scheduler secret only; a session is never accepted.
const automationWorkerHandler = (await import("../api/automation-worker.js")).default;
app.get("/api/automation-worker", automationWorkerHandler);
app.post("/api/automation-worker", automationWorkerHandler);

// 3c. PAYMENT-METHOD ARCHITECTURE — the same three functions Vercel runs. The method list
// resolves availability from the configuration table plus this process's provider credentials, so
// with no Stripe key deployed it reports every card rail as not_configured and checkout shows it
// as coming soon instead of pretending.
const paymentMethodsHandler = (await import("../api/payment-methods.js")).default;
const stripeStartHandler = (await import("../api/stripe-start.js")).default;
app.get("/api/payment-methods", withRequestId(paymentMethodsHandler));
app.post("/api/stripe-start", withRequestId(stripeStartHandler));

// 3d. PHASE 8 BRAND EXPERIENCE — recommendation rails are ranked in the database under the
// caller's own RLS context, so the dev server forwards the bearer token exactly as Vercel does.
const recommendationsHandler = (await import("../api/recommendations.js")).default;
app.get("/api/recommendations", withRequestId(recommendationsHandler));

const discoveryHandler = (await import("../api/discovery.js")).default;
const giftFinderHandler = (await import("../api/gift-finder.js")).default;
app.get("/api/discovery", withRequestId(discoveryHandler));
app.get("/api/gift-finder", withRequestId(giftFinderHandler));

// 4. HOSTED PAYMENTS — the same two functions Vercel runs. Both answer honestly
// while PayFast credentials are absent: start returns 503, notify acknowledges and
// processes nothing.
const payfastStart = (await import("../api/payfast-start.js")).default;
const payfastNotify = (await import("../api/payfast-notify.js")).default;
app.use("/api/payfast-notify", express.urlencoded({ extended: false, limit: "64kb" }));
app.post("/api/payfast-start", payfastStart);
app.post("/api/payfast-notify", payfastNotify);

// 5. AI CONCIERGE — dev proxy for the Vercel function of the same name.
app.post(
  "/api/ai-chat",
  withRequestId(async (req, res) => {
    const { runConcierge, runInsights } = await import("./aiCore.js");
    const ip =
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "anonymous";
    const accessToken = String(req.headers.authorization || "").startsWith("Bearer ")
      ? String(req.headers.authorization).slice(7)
      : null;
    const body = req.body || {};
    const result =
      body.mode === "insights"
        ? await runInsights({ accessToken, ip })
        : await runConcierge({ messages: body.messages, accessToken, ip });
    res.status(result.status).json(result.body);
  })
);

// 6. HEALTH — booleans and a failure count only, never a value or a message.
app.get("/api/health", (req, res) => {
  const health = recentFailures(0);
  res.json({
    status: health.systemFailures > 0 ? "DEGRADED" : "OK",
    timestamp: new Date().toISOString(),
    capabilities: capabilities(),
    recentSystemFailures: health.systemFailures,
    failureWindowMinutes: health.windowMinutes,
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Unknown endpoint." });
});

app.listen(PORT, () => {
  log.info("dev api server listening", { port: PORT, ...capabilities() });
});
