// Vercel serverless function — GET /api/discovery
//
// One call answers both halves of the discovery page: which facets actually exist, and the
// filtered page of fragrances. Returning them together keeps the browser from guessing a facet
// list that the database cannot back up.
import { withRequestId } from "./_config.js";
import { discoveryFacets, runDiscovery } from "./_discovery.js";
import { ExperienceError, resolveToken } from "./_recommendations.js";

const handler = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const token = resolveToken(req);
  try {
    const facets = await discoveryFacets(token);
    const items = await runDiscovery({ query: req.query, token });
    return res.status(200).json({ facets, items });
  } catch (error) {
    if (error instanceof ExperienceError) return res.status(error.status).json({ error: error.message });
    req.log?.error("discovery failed", { detail: error?.message });
    // Empty rather than invented: the page shows its "nothing matches" state instead of a list
    // that no query produced.
    return res.status(200).json({ facets: [], items: [], degraded: true });
  }
};

export default withRequestId(handler);
