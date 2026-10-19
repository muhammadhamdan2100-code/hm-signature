-- ============================================================================
-- APPLIED to the live project (ttnfdxabfkmqlqssqdep) on 2026-10-19 through the dashboard
-- SQL editor, and verified from outside with the public anon key: anon DELETE now 401 on
-- every probed table, the coupon list 401, checkout_coupon 200, and
-- tests/phase10-security-hardening.test.ts passes 35/35 with 0 failures.

-- COUPON CODES STOP BEING A PUBLIC LIST
--
-- WHY (measured 2026-10-19 with the public anon key): `GET /rest/v1/coupons`
-- returned the whole table to an anonymous visitor — code `WELCOME10`, 10%,
-- min spend 5000, usage_limit 100, used_count 0. Anyone can therefore read every
-- discount the shop has issued, and see how little-used each one is, without ever
-- reaching the till. A shopper only ever needs the terms of a code they already
-- have, so that is the only question the database will answer.
--
-- DESIGN:
-- * `checkout_coupon(p_code)` is SECURITY DEFINER and matches on the exact code
--   only — no listing, no prefix, no search. It deliberately still returns an
--   inactive or expired row, because the cart tells the shopper *why* a code was
--   refused ("expired", "not started", "minimum spend"), and a function that hid
--   those would turn every message into "code not recognised".
-- * `returns setof public.coupons` rather than a written-out column list: the
--   shape cannot drift away from the table.
-- * `anon` loses SELECT on the table. `authenticated` keeps it, because the staff
--   Coupons page reads the list through the same client.
-- * The client calls the function and falls back to the table read only while the
--   function is not installed yet, so deploying the app and running this file are
--   safe in either order.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.checkout_coupon(p_code text)
RETURNS SETOF public.coupons
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  select c.*
    from public.coupons c
   where upper(trim(c.code)) = upper(trim(coalesce(p_code, '')))
$$;

COMMENT ON FUNCTION public.checkout_coupon(text) IS
  'The one coupon whose code the caller already typed. Replaces an anonymous read of the whole coupons table.';

REVOKE EXECUTE ON FUNCTION public.checkout_coupon(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.checkout_coupon(text) TO anon, authenticated;

-- Only after the function exists: the public key may no longer enumerate codes.
REVOKE SELECT ON public.coupons FROM anon;

COMMIT;

-- ─── Verify after applying ─────────────────────────────────────────────────────────────────────
-- 1) The list is gone for anon — expect HTTP 401:
--      curl -s -o /dev/null -w '%{http_code}\n' "$URL/rest/v1/coupons?select=code" \
--        -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
-- 2) A known code still resolves, with its terms — expect one row:
--      curl -s "$URL/rest/v1/rpc/checkout_coupon" -H "apikey: $ANON" \
--        -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" \
--        -d '{"p_code":"WELCOME10"}'
-- 3) An unknown code answers with nothing, and says nothing about any other code:
--      … -d '{"p_code":"NOT_A_CODE"}'   → expect []
-- 4) Admin → Coupons still lists everything (authenticated keeps SELECT).
-- 5) In the cart: type WELCOME10 (accepted), type an expired code (the "expired" message must
--    still appear, not "not recognised"), type nonsense (must say "not recognised").
-- 6) Place an order with a coupon and confirm the stored discount matches what `place_order`
--    recalculated — this file changes no money rule, only who may read the list.

-- ─── Rollback ──────────────────────────────────────────────────────────────────────────────────
-- GRANT SELECT ON public.coupons TO anon;
-- REVOKE EXECUTE ON FUNCTION public.checkout_coupon(text) FROM anon, authenticated;
-- DROP FUNCTION IF EXISTS public.checkout_coupon(text);

-- ─── Related, deliberately not done here ───────────────────────────────────────────────────────
-- `site_settings.payment_config` carries the shop's IBAN and JazzCash number and is readable by
-- anon. That is not a hole to revoke away: a guest paying by bank transfer has to be shown those
-- details, so any visitor can read them by design. What can be tightened is everything else in
-- that table — a `storefront_settings` view exposing only the keys the public pages read would
-- stop `loyalty_config`, `personalization_config` and future keys from travelling with them. It
-- needs every public read switched to the view in the same change, so it is its own task.
