// Vercel serverless function — POST /api/payfast-notify
//
// Instant Trade Notification endpoint. Nothing a request claims is trusted until
// four documented checks pass:
//   1. the MD5 signature recomputed over the received parameters matches
//   2. the same parameter string is confirmed by PayFast's /eng/query/validate
//      postback, whose body must read exactly "VALID"
//   3. the amount matches what this deployment recorded for that payment
//   4. the merchant id and currency match this deployment's configuration
// Applied through a server-only database function that is idempotent, so a replay
// cannot be applied twice and a completed payment is never downgraded.
//
// Always answered with 200: the provider retries non-200 responses, and a rejected
// notification must not become a retry storm. Rejections are logged instead.
import { createClient } from "@supabase/supabase-js";
import { serviceRoleKey, supabaseUrl, withRequestId } from "./_config.js";
import {
  fromPayfastNetwork,
  payfastConfig,
  payfastReadiness,
  postbackIsValid,
  signatureMatches,
} from "./_payfast.js";

export const maxDuration = 20;

async function readFormBody(req) {
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    return req.body;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  return Object.fromEntries(new URLSearchParams(text).entries());
}

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(200).send("");
  }

  const body = await readFormBody(req);
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const readiness = payfastReadiness();

  if (!readiness.ready) {
    req.log?.warn("notification ignored: provider not configured", { order: body?.m_payment_id });
    return res.status(200).send("");
  }

  const { merchantId } = payfastConfig();

  if (!signatureMatches(body)) {
    req.log?.warn("notification rejected: signature mismatch", {
      order: body?.m_payment_id || null,
      remote: ip || null,
    });
    return res.status(200).send("");
  }

  const networkChecked = fromPayfastNetwork(ip);
  if (process.env.PAYFAST_REQUIRE_ITN_NETWORK === "true" && !networkChecked) {
    req.log?.warn("notification rejected: source outside the documented ranges", { remote: ip || null });
    return res.status(200).send("");
  }

  if (!(await postbackIsValid(body))) {
    req.log?.warn("notification rejected: provider validation postback failed", {
      order: body?.m_payment_id || null,
    });
    return res.status(200).send("");
  }

  const key = serviceRoleKey();
  const url = supabaseUrl();
  if (!key || !url) {
    req.log?.error("notification could not be applied: no server credentials");
    // 202 tells the provider we received it but could not process it; the
    // customer-facing state stays untouched rather than pretending success.
    return res.status(200).send("");
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.rpc("apply_payfast_notification", {
    p_m_payment_id: String(body.m_payment_id || ""),
    p_pf_payment_id: String(body.pf_payment_id || ""),
    p_payment_status: String(body.payment_status || ""),
    p_amount_gross: Number(body.amount_gross),
    p_currency: String(body.currency || ""),
    p_merchant_id: String(body.merchant_id || ""),
    p_expected_merchant_id: merchantId,
    p_source: "itn",
  });

  if (error) {
    req.log?.error("notification application failed", { detail: error.message });
    return res.status(200).send("");
  }

  req.log?.info("notification processed", {
    order: body.m_payment_id || null,
    result: data,
    providerHost: networkChecked ? "documented" : "unverified",
  });
  return res.status(200).send("");
};

export default withRequestId(handler);
