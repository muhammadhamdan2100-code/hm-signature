// HM Signature concierge core.
// Shared by the Vercel function (api/ai-chat.js) and the local dev proxy
// (server/index.js). The provider key never reaches the browser, and every
// data read is performed with the CALLER'S OWN access token so Postgres RLS
// decides what the assistant can see — there is no service-role path here.

const TOKEN_TTL_MS = 5 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_REQUESTS = 12;
const MAX_MESSAGES = 12;
const MAX_CONTENT = 900;

const rateBuckets = new Map();

function rateLimitOk(key) {
  const now = Date.now();
  const bucket = rateBuckets.get(key) || [];
  const recent = bucket.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_REQUESTS) {
    rateBuckets.set(key, recent);
    return false;
  }
  recent.push(now);
  rateBuckets.set(key, recent);
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) {
      if (!v.length || now - v[v.length - 1] > RATE_WINDOW_MS * 4) rateBuckets.delete(k);
    }
  }
  return true;
}

function config() {
  const baseUrl = (process.env.AI_PROXY_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const apiKey = process.env.AI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY || "";
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return { baseUrl, apiKey, model, supabaseUrl, anonKey, configured: Boolean(apiKey && supabaseUrl && anonKey) };
}

// Verify the caller's Supabase session against GoTrue itself.
async function verifySession(accessToken, cfg) {
  if (!accessToken) return null;
  try {
    const res = await fetch(`${cfg.supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${accessToken}`, apikey: cfg.anonKey, "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const user = await res.json();
    if (!user?.id) return null;
    return { id: user.id, email: user.email || null, accessToken };
  } catch {
    return null;
  }
}

function rest(cfg, accessToken) {
  const headers = {
    apikey: cfg.anonKey,
    Authorization: `Bearer ${accessToken || cfg.anonKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  return {
    async select(table, query = "") {
      const res = await fetch(`${cfg.supabaseUrl}/rest/v1/${table}${query}`, { headers });
      if (!res.ok) throw new Error(`${table}: ${res.status}`);
      return res.json();
    },
    async rpc(name, body) {
      const res = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/${name}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`${name}: ${res.status}`);
      return res.json();
    },
  };
}

const SYSTEM_PROMPT = `You are the HM Signature fragrance concierge — a knowledgeable, understated advisor for a luxury perfume house in Pakistan.

Rules you must follow without exception:
- Product facts (name, notes, family, sizes, prices, stock, order status) may ONLY come from tool results. Quote prices exactly as returned, in PKR.
- Never invent a fragrance, a note, a price, a longevity or sillage claim, or a promotion. If the tools do not cover something, say you cannot verify it and offer to connect the client with the atelier concierge.
- Clearly separate three registers when answering: "On our catalogue" for tool-verified facts, "As a general rule in perfumery" for guidance, and "I cannot confirm" for anything else.
- Order and account questions require the tools; if a tool returns nothing, tell the client to sign in or to use Track Order with their reference and email. Never guess an order state.
- Payment methods are Cash on Delivery, JazzCash, Raast and Bank Transfer. Card payments are not available yet. Never state that a payment or refund has been completed unless a tool result says so.
- Internal staff notes are not visible to you; if asked, explain that a team member will assist.
- Be concise: 2-5 short sentences, or a short list. No superlatives, no pressure language, no emojis. British/international English.`;

const TOOL_DEFS = [
  {
    type: "function",
    function: {
      name: "searchProducts",
      description: "Search the live HM Signature catalogue.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free text across name, description and notes." },
          gender: { type: "string", enum: ["men", "women", "unisex"] },
          family: { type: "string", description: "Fragrance family, e.g. Woody Oriental." },
          maxPrice: { type: "number", description: "Maximum 50ml reference price in PKR." },
          inStockOnly: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getProductDetails",
      description: "Full catalogue record for one fragrance by slug or id.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" }, productId: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getProductPrice",
      description: "Price for a specific bottle size of a fragrance.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" }, size: { type: "string", description: "e.g. 50ml" } },
        required: ["slug"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getProductAvailability",
      description: "Stock per bottle size for a fragrance.",
      parameters: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
    },
  },
  {
    type: "function",
    function: {
      name: "getRecommendations",
      description: "Rank catalogue fragrances against stated preferences.",
      parameters: {
        type: "object",
        properties: {
          family: { type: "string" },
          occasion: { type: "string" },
          season: { type: "string" },
          intensity: { type: "string", enum: ["Light", "Moderate", "Strong", "Enormous"] },
          gender: { type: "string", enum: ["men", "women", "unisex"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getShippingMethods",
      description: "Delivery options, charges and free-delivery threshold.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getPaymentMethods",
      description: "Available payment methods and what each requires.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getCustomerOrders",
      description: "Orders belonging to the signed-in client.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getCustomerOrder",
      description: "One order belonging to the signed-in client.",
      parameters: {
        type: "object",
        properties: { orderNumber: { type: "string" }, orderId: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getTracking",
      description: "Fulfilment status for an order number or tracking reference.",
      parameters: {
        type: "object",
        properties: { lookup: { type: "string" }, email: { type: "string" } },
        required: ["lookup"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCustomerWishlist",
      description: "Saved fragrances of the signed-in client.",
      parameters: { type: "object", properties: {} },
    },
  },
];

function shapeProduct(p, variants) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    fragranceFamily: p.fragrance_family || p.category,
    gender: p.gender,
    concentration: p.concentration,
    intensity: p.intensity,
    scentProfile: p.scent_profile,
    shortDescription: p.short_description,
    description: p.description,
    occasions: p.occasions,
    seasons: p.seasons,
    referencePrice50ml: Number(p.base_price),
    featured: p.featured,
    bestseller: p.bestseller,
    newArrival: p.new_arrival,
    sizes: (variants || []).map((v) => ({
      size: v.size,
      price: Number(v.price),
      salePrice: v.sale_price ? Number(v.sale_price) : null,
      stock: Number(v.stock),
      active: v.active !== false,
    })),
  };
}

async function loadCatalog(db) {
  const products = await db.select(
    "products",
    "?select=id,name,slug,description,short_description,base_price,gender,concentration,intensity,scent_profile,occasions,seasons,featured,bestseller,new_arrival,fragrance_family&active=eq.true&order=created_at.desc&limit=200"
  );
  const variants = await db.select(
    "product_variants",
    "?select=product_id,size,price,sale_price,stock,active&active=eq.true"
  );
  const notes = await db.select(
    "product_fragrance_notes",
    "?select=product_id,note_type,fragrance_notes(name)"
  );
  const notesByProduct = new Map();
  for (const n of notes || []) {
    const name = n.fragrance_notes?.name;
    if (!name) continue;
    const list = notesByProduct.get(n.product_id) || { top: [], heart: [], base: [] };
    if (list[n.note_type]) list[n.note_type].push(name);
    notesByProduct.set(n.product_id, list);
  }
  const byProduct = new Map();
  for (const v of variants || []) {
    const list = byProduct.get(v.product_id) || [];
    list.push(v);
    byProduct.set(v.product_id, list);
  }
  return (products || []).map((p) => ({
    ...shapeProduct(p, byProduct.get(p.id)),
    notes: notesByProduct.get(p.id) || { top: [], heart: [], base: [] },
  }));
}

const authOnlyTools = new Set([
  "getCustomerOrders",
  "getCustomerOrder",
  "getCustomerWishlist",
]);

export async function runConcierge({ messages, accessToken, ip }) {
  const cfg = config();

  if (!Array.isArray(messages) || messages.length === 0) {
    return { status: 400, body: { error: "A message is required." } };
  }
  const trimmed = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, MAX_CONTENT) }));

  if (!trimmed.length) return { status: 400, body: { error: "A message is required." } };

  if (!rateLimitOk(ip || "anonymous")) {
    return { status: 429, body: { error: "Too many messages. Please pause a moment and try again." } };
  }

  if (!cfg.configured) {
    // Graceful degradation: the assistant is not wired to a provider yet.
    return {
      status: 501,
      body: {
        configured: false,
        reply:
          "The concierge assistant is not enabled on this deployment yet. Ask our team directly on WhatsApp or by email and we will help with fragrances, orders and delivery.",
        sources: [],
      },
    };
  }

  const session = await verifySession(accessToken, cfg);
  const db = rest(cfg, session?.accessToken);

  const sources = [];
  const toolLog = [];

  const callTool = async (name, args = {}) => {
    try {
      if (authOnlyTools.has(name) && !session) {
        return { error: "The client must be signed in for account information." };
      }

      switch (name) {
        case "searchProducts": {
          const catalog = await loadCatalog(db);
          const q = String(args.query || "").trim().toLowerCase();
          const found = catalog
            .filter((p) => {
              if (args.gender && args.gender !== "unisex" && p.gender !== args.gender && p.gender !== "unisex") return false;
              if (args.family && !String(p.fragranceFamily || "").toLowerCase().includes(String(args.family).toLowerCase())) return false;
              if (args.maxPrice && Number(p.referencePrice50ml) > Number(args.maxPrice)) return false;
              if (args.inStockOnly && !p.sizes.some((s) => s.stock > 0)) return false;
              if (!q) return true;
              const hay = [p.name, p.description, p.shortDescription, p.fragranceFamily, p.category,
                ...(p.notes.top || []), ...(p.notes.heart || []), ...(p.notes.base || [])].join(" ").toLowerCase();
              return q.split(/\s+/).some((token) => hay.includes(token));
            })
            .slice(0, 8);
          found.forEach((p) => sources.push({ type: "product", id: p.id, label: p.name, slug: p.slug }));
          return { count: found.length, products: found };
        }

        case "getProductDetails": {
          const catalog = await loadCatalog(db);
          const hit = catalog.find((p) => (args.slug && p.slug === args.slug) || (args.productId && p.id === args.productId));
          if (!hit) return { error: "No catalogue entry matches that fragrance." };
          sources.push({ type: "product", id: hit.id, label: hit.name, slug: hit.slug });
          return hit;
        }

        case "getProductPrice": {
          const catalog = await loadCatalog(db);
          const hit = catalog.find((p) => p.slug === args.slug || p.id === args.slug);
          if (!hit) return { error: "That fragrance is not in the catalogue." };
          const size = String(args.size || "50ml").toLowerCase();
          const variant = hit.sizes.find((s) => s.size.toLowerCase() === size);
          if (!variant) return { error: `${hit.name} is not offered in ${size}.`, availableSizes: hit.sizes.map((s) => s.size) };
          sources.push({ type: "product", id: hit.id, label: `${hit.name} ${variant.size}`, slug: hit.slug });
          return {
            name: hit.name,
            size: variant.size,
            price: variant.salePrice ?? variant.price,
            listPrice: variant.price,
            onSale: variant.salePrice != null,
            currency: "PKR",
          };
        }

        case "getProductAvailability": {
          const catalog = await loadCatalog(db);
          const hit = catalog.find((p) => p.slug === args.slug || p.id === args.slug);
          if (!hit) return { error: "That fragrance is not in the catalogue." };
          return {
            name: hit.name,
            sizes: hit.sizes.map((s) => ({ size: s.size, stock: s.stock, available: s.stock > 0 })),
          };
        }

        case "getRecommendations": {
          const catalog = await loadCatalog(db);
          const scored = catalog
            .map((p) => {
              let score = 0;
              const why = [];
              if (args.family && String(p.fragranceFamily || "").toLowerCase().includes(String(args.family).toLowerCase())) {
                score += 3; why.push(`family: ${p.fragranceFamily}`);
              }
              if (args.occasion && (p.occasions || []).some((o) => String(o).toLowerCase() === String(args.occasion).toLowerCase())) {
                score += 2; why.push(`listed for ${args.occasion}`);
              }
              if (args.season && (p.seasons || []).some((s) => String(s).toLowerCase() === String(args.season).toLowerCase())) {
                score += 2; why.push(`suited to ${args.season}`);
              }
              if (args.intensity && p.intensity === args.intensity) { score += 2; why.push(`${args.intensity} projection`); }
              if (args.gender && (p.gender === args.gender || p.gender === "unisex")) { score += 1; }
              if (p.bestseller) score += 0.5;
              if (p.featured) score += 0.25;
              if (!p.sizes.some((s) => s.stock > 0)) score -= 2;
              return { product: { name: p.name, slug: p.slug, fragranceFamily: p.fragranceFamily, referencePrice50ml: p.referencePrice50ml, inStock: p.sizes.some((s) => s.stock > 0) }, score, why };
            })
            .filter((r) => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
          scored.forEach((r) => sources.push({ type: "product", id: r.product.slug, label: r.product.name, slug: r.product.slug }));
          return scored.length ? scored : { note: "No catalogue fragrance matches those preferences closely." };
        }

        case "getShippingMethods": {
          const methods = await db.select(
            "shipping_methods",
            "?select=name,courier_name,base_cost,free_shipping_threshold,estimated_days_min,estimated_days_max,description&active=eq.true"
          );
          const settings = await db.select("site_settings", "?select=value&key=eq.shipping_config&limit=1");
          return { methods: methods || [], deliverySettings: settings?.[0]?.value || null };
        }

        case "getPaymentMethods": {
          const rows = await db.select("site_settings", "?select=value&key=eq.payment_config&limit=1");
          const methods = rows?.[0]?.value?.methods || [];
          // Instructions only; the reference/proof fields the client must supply.
          return {
            methods: methods.map((m) => ({
              id: m.id,
              label: m.label,
              description: m.description,
              enabled: m.enabled !== false,
              requiresReference: Boolean(m.requiresReference),
              requiresScreenshot: Boolean(m.requiresProof),
            })),
            note: "Card payments (PayFast) are not live yet. Never tell a client that a payment or refund has been completed.",
          };
        }

        case "getCustomerOrders": {
          const orders = await db.select(
            "orders",
            `?select=order_number,status,payment_status,payment_method,total,created_at,tracking_id,courier_name&order=created_at.desc&limit=10`
          );
          return { orders: orders || [] };
        }

        case "getCustomerOrder": {
          const filters = args.orderId ? `id=eq.${encodeURIComponent(args.orderId)}` : `order_number=eq.${encodeURIComponent(String(args.orderNumber || ""))}`;
          const rows = await db.select(
            "orders",
            `?select=id,order_number,status,payment_status,payment_method,subtotal,discount_amount,shipping_cost,total,created_at,tracking_id,tracking_url,courier_name,estimated_delivery,customer_notes,shipping_address&${filters}&limit=1`
          );
          const order = rows?.[0];
          if (!order) return { error: "No order of this client matches that reference." };
          const safeId = String(order.id).replace(/[^0-9a-fA-F-]/g, "");
          const items = await db.select("order_items", `?select=product_name,variant_size,quantity,unit_price&order_id=eq.${safeId}&limit=20`);
          const history = await db.select("order_status_history", `?select=status,note,created_at&order_id=eq.${safeId}&order=created_at.asc&limit=20`);
          const refunds = await db.select("refunds", `?select=amount,status,refund_reference,created_at&order_id=eq.${safeId}&limit=10`);
          const { id, ...orderOut } = order;
          return { order: orderOut, items: items || [], history: history || [], refunds: refunds || [] };
        }

        case "getTracking": {
          const result = await db.rpc("get_order_tracking", {
            p_lookup: String(args.lookup || ""),
            p_email: args.email ? String(args.email) : session?.email || null,
          });
          if (!result?.found) return { found: false, note: "Nothing matched that reference and email combination." };
          return {
            found: true,
            order_number: result.order_number,
            status: result.status,
            payment_status: result.payment_status,
            courier: result.courier,
            tracking_id: result.tracking_id,
            tracking_url: result.tracking_url,
            estimated_delivery: result.estimated_delivery,
            timeline: result.timeline,
          };
        }

        case "getCustomerWishlist": {
          const lists = await db.select("wishlists", "?select=id&limit=5");
          if (!lists?.length) return { items: [] };
          const ids = lists.map((l) => `wishlist_id=eq.${l.id}`).join(",");
          const rows = await db.select("wishlist_items", `?select=products(name,slug)&${ids}&limit=30`);
          return { items: (rows || []).map((r) => r.products).filter(Boolean) };
        }

        default:
          return { error: `Unknown tool ${name}.` };
      }
    } catch (err) {
      return { error: `Tool ${name} could not complete: ${String(err?.message).slice(0, 120)}` };
    }
  };

  const conversation = [
    { role: "system", content: SYSTEM_PROMPT },
    ...trimmed,
  ];

  const invoke = async (withTools) => {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: cfg.model,
        messages: conversation,
        temperature: 0.4,
        max_tokens: 500,
        ...(withTools ? { tools: TOOL_DEFS, tool_choice: "auto" } : {}),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw Object.assign(new Error(json?.error?.message || `Provider error ${res.status}`), { status: res.status });
    }
    return json;
  };

  let reply = null;
  let degraded = false;

  try {
    let payload = await invoke(true);

    for (let round = 0; round < 4; round++) {
      const message = payload?.choices?.[0]?.message;
      const calls = message?.tool_calls;
      if (!calls?.length) {
        reply = message?.content || null;
        break;
      }
      conversation.push(message);
      for (const call of calls) {
        const fnName = call.function?.name;
        let args = {};
        try { args = JSON.parse(call.function?.arguments || "{}"); } catch { args = {}; }
        const result = await callTool(fnName, args);
        toolLog.push(fnName);
        conversation.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result).slice(0, 6000) });
      }
      payload = await invoke(true);
    }

    if (reply === null) {
      reply = (await invoke(false))?.choices?.[0]?.message?.content || null;
    }
  } catch (err) {
    // Providers that reject the tools parameter still get a useful answer from
    // a single deterministic retrieval pass.
    const catalog = await loadCatalog(db).catch(() => []);
    const question = trimmed[trimmed.length - 1]?.content || "";
    const words = question.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
    const matches = catalog
      .filter((p) => words.some((w) => `${p.name} ${p.fragranceFamily} ${(p.notes.top || []).join(" ")} ${(p.notes.base || []).join(" ")}`.toLowerCase().includes(w)))
      .slice(0, 4)
      .map((p) => `${p.name} (${p.fragranceFamily || p.category}) — from PKR ${p.referencePrice50ml}, sizes ${p.sizes.map((s) => `${s.size} ${s.stock > 0 ? "available" : "out"}`).join(", ")}`);
    matches.forEach((m) => sources.push({ type: "notice", id: "catalogue", label: "Catalogue listing" }));
    reply = matches.length
      ? `I could not reach the live assistant model, so here is what our catalogue confirms directly:\n\n${matches.join("\n")}`
      : "I could not reach the live assistant model right now. Our concierge can help directly with fragrances, delivery and orders.";
    degraded = true;
    toolLog.push(`fallback:${String(err?.message).slice(0, 60)}`);
  }

  if (!reply) {
    reply = "I could not form an answer just now. Please try rephrasing, or reach the atelier concierge directly.";
    degraded = true;
  }

  const uniqueSources = [];
  const seen = new Set();
  for (const s of sources) {
    const key = `${s.type}:${s.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueSources.push(s);
  }

  return {
    status: 200,
    body: {
      configured: true,
      degraded,
      authenticated: Boolean(session),
      reply: String(reply).slice(0, 2000),
      sources: uniqueSources.slice(0, 8),
      toolsUsed: Array.from(new Set(toolLog)),
    },
  };
}

export async function runInsights({ accessToken, ip }) {
  const cfg = config();
  if (!rateLimitOk(`insights:${ip || "anonymous"}`)) {
    return { status: 429, body: { error: "Too many requests. Please try again shortly." } };
  }
  if (!cfg.configured) {
    return { status: 501, body: { configured: false, insight: null } };
  }

  const session = await verifySession(accessToken, cfg);
  if (!session) return { status: 401, body: { error: "Sign in as staff to generate insights." } };

  const db = rest(cfg, session.accessToken);
  let snapshot;
  try {
    snapshot = await db.rpc("get_admin_analytics", { p_days: 90 });
  } catch {
    return { status: 403, body: { error: "Only staff members can generate business insights." } };
  }

  const facts = JSON.stringify(snapshot).slice(0, 6000);
  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.2,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "You analyse aggregated e-commerce metrics for a luxury fragrance house. Use ONLY the supplied JSON. Never invent a number, a product or a cause. Write 3-5 short bullet observations in plain international English, each tied to a figure present in the JSON. If the data is too thin to conclude anything, say so.",
          },
          { role: "user", content: `Aggregated metrics (PKR, last 90 days window where applicable):\n${facts}` },
        ],
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { status: 502, body: { configured: true, error: json?.error?.message || "Insights provider unavailable." } };
    }
    return {
      status: 200,
      body: {
        configured: true,
        insight: json?.choices?.[0]?.message?.content || null,
        generatedAt: new Date().toISOString(),
        basis: "aggregated metrics only — no individual customer records",
      },
    };
  } catch (err) {
    return { status: 502, body: { configured: true, error: String(err?.message || "Insights failed").slice(0, 140) } };
  }
}

export { config as aiConfig };
