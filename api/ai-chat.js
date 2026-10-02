// Vercel serverless function — POST /api/ai-chat
// Body: { messages: [{role, content}], mode?: "chat" | "insights" }
// The provider key lives only in the deployment environment. Data access uses
// the caller's own Supabase access token, so row-level security decides what
// the assistant can read; there is no service-role path in this file.
import { runConcierge, runInsights } from "../server/aiCore.js";

export const maxDuration = 30;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "anonymous";

  const accessToken = String(req.headers.authorization || "").startsWith("Bearer ")
    ? String(req.headers.authorization).slice(7)
    : null;

  try {
    const body = req.body || {};
    const result =
      body.mode === "insights"
        ? await runInsights({ accessToken, ip })
        : await runConcierge({ messages: body.messages, accessToken, ip });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error("AI concierge function error:", error?.message);
    res.status(500).json({ error: "The concierge is unavailable right now. Please try again shortly." });
  }
}
