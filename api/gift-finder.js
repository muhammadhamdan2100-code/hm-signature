// Vercel serverless function — GET /api/gift-finder
//
// The Gift Finder answers with the shop's own option lists as well as the suggestions, because an
// option the shop has not defined must not be offered to a shopper as if it meant something.
import { withRequestId } from "./_config.js";
import { giftFinderConfig, runGiftFinder } from "./_discovery.js";
import { discoveryFacets } from "./_discovery.js";
import { ExperienceError, resolveToken } from "./_recommendations.js";

const handler = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const token = resolveToken(req);
  try {
    const [config, facets, result] = await Promise.all([
      giftFinderConfig(token),
      discoveryFacets(token).catch(() => []),
      runGiftFinder({ query: req.query, token }),
    ]);
    return res.status(200).json({ config, facets, ...result });
  } catch (error) {
    if (error instanceof ExperienceError) return res.status(error.status).json({ error: error.message });
    req.log?.error("gift-finder failed", { detail: error?.message });
    return res.status(200).json({ config: {}, facets: [], items: [], askedFor: {}, degraded: true });
  }
};

export default withRequestId(handler);
