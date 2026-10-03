// Vercel serverless function — GET /api/health
//
// Booleans only: which optional services this deployment is configured for. The
// storefront reads it so its copy can promise an email only when an email is
// actually possible. No secret, no value, no version detail is exposed.
import { capabilities, recentFailures } from "./_config.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }
  const health = recentFailures(0);
  // Only the count is public: the messages themselves can name tables or
  // providers, and they stay in the logs.
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    status: health.systemFailures > 0 ? "DEGRADED" : "OK",
    capabilities: capabilities(),
    recentSystemFailures: health.systemFailures,
    failureWindowMinutes: health.windowMinutes,
  });
}
