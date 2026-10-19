-- APPLIED to the live project (ttnfdxabfkmqlqssqdep) on 2026-10-19 through the dashboard
-- SQL editor, and verified from outside with the public anon key: all twelve functions below
-- now answer 401 for anon, `get_order_tracking` and `quote_order` still answer 200, every
-- public route renders with zero failed requests, and the suite is 3662 passed / 0 failed.
--
-- ============================================================================
-- THE PUBLIC KEY MAY NOT RUN THE WAREHOUSE, FULFILMENT OR AUDIT FUNCTIONS
--
-- WHY: `REVOKE EXECUTE ... FROM anon` on its own does nothing when the privilege
-- arrives through the default `PUBLIC` grant, and PostgreSQL has no deny — the only
-- way to take it back from one role is to revoke from `PUBLIC` and re-grant to the
-- roles that legitimately need it. Measured with the correct predicate
-- (`has_function_privilege('anon', oid, 'EXECUTE')`, which counts the PUBLIC
-- default), 44 ordinary functions were executable by an anonymous visitor, among
-- them `adjust_location_stock`, `reserve_order_stock`, `release_reservation`,
-- `create_fulfillment_from_order`, `transition_fulfillment_status`,
-- `generate_fulfillment_number`, `publish_audit_event` and `write_audit_log` — the
-- stock ledger, the fulfilment pipeline and the audit trail.
--
-- A previous pass filtered on `proacl LIKE '%anon=X%'` and therefore saw only the
-- 72 explicitly-granted ones; that is how these survived. Use
-- `has_function_privilege()`, never the acl text, when asking what a role may do.
--
-- SCOPE, deliberately narrow:
-- * Only these twelve are touched. Everything else the shopper needs —
--   `quote_order`, `place_order`, `get_order_tracking`, `checkout_coupon`,
--   `discover_products`, `content_translations_for`, `get_global_stock`, the
--   `*_config` readers, `join_waitlist`, `gift_card_state`, `record_analytics_event`
--   — keeps working, and was re-checked live.
-- * `authenticated` and `service_role` are re-granted each function, so the staff
--   panel and any backend path are unaffected. Revoking from `PUBLIC` would
--   otherwise have silently removed the privilege from every role at once.
-- * Trigger functions are left alone entirely (27 of them are reachable through an
--   authenticated write). They are not callable surfaces; they fire from table
--   events, which anon has already lost.
-- * None of the twelve is called anywhere under `src/`, so no client path can break.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  r record;
  handled text := '';
  targets text[] := ARRAY[
    'adjust_location_stock', 'reserve_order_stock', 'release_reservation',
    'get_location_stock', 'create_fulfillment_from_order', 'transition_fulfillment_status',
    'generate_fulfillment_number', 'publish_audit_event', 'write_audit_log',
    'guard_order_payment_state', 'assert_method_labels_are_permitted', 'tag_verified_purchase'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prokind = 'f'
       AND p.proname = ANY (targets)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT  EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
    handled := handled || r.proname || ' ';
  END LOOP;
  RAISE NOTICE 'execute privilege taken from anon (and re-granted to staff): %', handled;
END
$$;

COMMIT;

-- ─── Verify after applying ─────────────────────────────────────────────────────────────────────
-- 1) None of the twelve is reachable by the public key any more — expect 401:
--      curl -s -o /dev/null -w '%{http_code}\n' -X POST "$URL/rest/v1/rpc/adjust_location_stock" \
--        -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" \
--        -d '{"p_location_id":"00000000-0000-0000-0000-000000000000","p_variant_id":"00000000-0000-0000-0000-000000000000","p_quantity":0,"p_movement_type_code":"probe"}'
--    (Before this file the same call answered 500 "invalid transaction termination" — it had
--    entered the function. 401 means it is no longer entered at all.)
-- 2) The shopper's paths still answer — expect 200 on each:
--      rpc/get_order_tracking   {"p_lookup":"HMS-00000000-0000","p_email":"x@example.com"}
--      rpc/quote_order          {"p_items":[],"p_country_code":"PK"}
--      rpc/checkout_coupon      {"p_code":"WELCOME10"}
-- 3) The catalog of what the public key may still run, in the dashboard:
--      select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--       where n.nspname = 'public' and p.prokind = 'f'
--         and has_function_privilege('anon', p.oid, 'EXECUTE')
--         and not exists (select 1 from pg_trigger t where t.tgfoid = p.oid)
--       order by 1;
--    Anything in that list that is not a shopper-facing read is the next candidate.
-- 4) `npx vitest run tests/phase10-security-hardening.test.ts` — the "Anon cannot run the
--    warehouse or audit RPCs" block is the standing guard for this file.

-- ─── Rollback ──────────────────────────────────────────────────────────────────────────────────
-- DO $$
-- DECLARE r record;
-- BEGIN
--   FOR r IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--             WHERE n.nspname='public' AND p.prokind='f' AND p.proname = ANY (ARRAY[
--               'adjust_location_stock','reserve_order_stock','release_reservation','get_location_stock',
--               'create_fulfillment_from_order','transition_fulfillment_status','generate_fulfillment_number',
--               'publish_audit_event','write_audit_log','guard_order_payment_state',
--               'assert_method_labels_are_permitted','tag_verified_purchase']) LOOP
--     EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO PUBLIC', r.sig);
--   END LOOP;
-- END
-- $$;

-- ─── Deliberately not done here ────────────────────────────────────────────────────────────────
-- The rewritten bodies of `adjust_location_stock`, `reserve_order_stock` and
-- `release_reservation` (20261010120000_phase10_security_hardening.sql, sections 4-6) are still
-- unapplied: `adjust_location_stock` keeps its illegal `commit;` and fails with
-- "invalid transaction termination". Nothing under `src/` calls them and anon can no longer
-- reach them, so this is a latent defect, not an exposure. Apply them from the repository file
-- (`supabase db push`) rather than by retyping them into the editor — a silently dropped line in
-- a stock-reservation function is a worse outcome than the current honest failure.
