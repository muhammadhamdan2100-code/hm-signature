// Vercel serverless function — GET /api/recommendations?kind=similar_fragrances&productId=...&limit=4
//
// Public by design: a guest browsing a fragrance still deserves "you may also like", and the
// ranking itself never needs a secret. What it does carry is the caller's token, because the
// database decides what that caller may see. An empty list is returned instead of a guess when
// ranking fails, so a rail disappears rather than showing the wrong thing.
import { withRequestId } from "./_config.js";
import { ExperienceError, parseRecentIds, rankProducts, resolveToken } from "./_recommendations.js";

const handler = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const items = await rankProducts({
      kind: String(req.query.kind || ""),
      productId: req.query.productId ? String(req.query.productId) : null,
      recentIds: parseRecentIds(req.query.recent),
      limit: req.query.limit,
      gender: req.query.gender ? String(req.query.gender) : null,
      token: resolveToken(req),
    });
    return res.status(200).json({ items });
  } catch (error) {
    if (error instanceof ExperienceError) return res.status(error.status).json({ error: error.message });
    req.log?.error("recommendations failed", { detail: error?.message });
    return res.status(200).json({ items: [], degraded: true });
  }
};

export default withRequestId(handler);
