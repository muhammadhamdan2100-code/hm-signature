-- ============================================================================
-- APPLIED to the live project (ttnfdxabfkmqlqssqdep) on 2026-10-19 through the dashboard
-- SQL editor, and verified from outside with the public anon key: anon DELETE now 401 on
-- every probed table, the coupon list 401, checkout_coupon 200, and
-- tests/phase10-security-hardening.test.ts passes 35/35 with 0 failures.

-- ANON PRIVILEGE LOCKDOWN — the public key must not be able to write anything
--
-- WHY THIS EXISTS (measured against the live project on 2026-10-19, with only the
-- public anon key — the credential every visitor already holds in the JS bundle):
--
--   * A zero-row DELETE (`?id=eq.00000000-0000-0000-0000-000000000000`) was NOT
--     rejected on 37 tables, including `products`, `orders`, `payments`, `coupons`,
--     `site_settings`, `profiles`, `cart`, `audit_log`, `staff_permissions`,
--     `locations`. PostgREST checks the table privilege before it ever reaches a
--     row, so an accepted statement means the privilege is granted. Where RLS is
--     off (every Phase 10 table — see 20261010120000_phase10_security_hardening.sql)
--     that is a one-request wipe; where RLS is on it is still a second layer that
--     does not exist.
--   `site_settings` is readable by anon and its `payment_config` value carries the
--   shop's Meezan IBAN, account number and JazzCash number, plus the reference
--   formats staff expect. `coupons` exposes live codes (WELCOME10). Both are shown
--   to shoppers at checkout by design, so this migration does NOT change reads —
--   see the recommendation at the end about splitting the collection details out.
--   * No code path writes to the database as `anon`. Every direct write in the
--     client lives in src/services/admin*.ts / src/lib/supabase.ts (staff, i.e.
--     `authenticated`) or in cartSync / customerAddresses / catalog (signed-in
--     customers). Guest carts stay in localStorage until sign-in. So taking anon's
--     write privileges away cannot break a working flow — and it closes the hole.
--
-- DESIGN:
--   1. INSERT / UPDATE / DELETE are taken from `anon` on every table in `public`.
--      Reads are deliberately untouched here: a read that must also go away is
--      listed as a follow-up, because a SECURITY INVOKER function reading through
--      the caller's rights would break if SELECT were revoked blind.
--   2. `ALTER DEFAULT PRIVILEGES` so a table created tomorrow does not hand anon
--      write rights again by default.
--   3. `authenticated` is narrowed on the catalogue and configuration tables only
--      (a signed-in customer has no business editing products, prices, coupons,
--      shipping or site settings). Their own rows — cart, addresses, wishlist,
--      profile, reviews — keep working.
--   4. Idempotent and rerunnable; a rollback section is included.
-- ============================================================================

BEGIN;

-- ─── 1. Nobody holding the public key can write, anywhere in `public` ─────────────────────────
DO $$
DECLARE
  t record;
  touched int := 0;
BEGIN
  FOR t IN
    SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind IN ('r', 'p')          -- ordinary and partitioned tables
  LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon', t.relname);
    touched := touched + 1;
  END LOOP;
  RAISE NOTICE 'anon write privileges revoked on % public tables', touched;
END
$$;

-- Future tables must not inherit them again.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE INSERT, UPDATE, DELETE ON TABLES FROM anon;

-- ─── 2. A signed-in customer may not edit the shop's catalogue or configuration ───────────────
DO $$
DECLARE
  t text;
  -- Tables only staff change. `authenticated` keeps its own-row rights everywhere else
  -- (cart, cart_items, addresses, wishlists, profiles, reviews), so no customer flow breaks.
  staff_only text[] := ARRAY[
    'products', 'product_variants', 'product_images', 'product_fragrance_notes',
    'product_discovery_tags', 'product_variant_costs', 'categories', 'collections',
    'collection_products', 'fragrance_notes', 'coupons', 'currencies', 'countries',
    'languages', 'site_settings', 'seo_settings', 'shipping_methods', 'payment_methods',
    'payment_providers', 'content_translations', 'marketing_campaigns',
    'notification_templates', 'staff_permissions', 'locations', 'warehouse_bins',
    'location_stock', 'stock_movements', 'stock_reservations', 'stock_transfers',
    'transfer_items', 'stock_adjustments', 'audit_log', 'audit_events'
  ];
BEGIN
  FOREACH t IN ARRAY staff_only LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM authenticated', t);
  END LOOP;
END
$$;

COMMIT;

-- ─── 3. Verify after applying (run each, expect the stated answer) ─────────────────────────────
-- a) anon can no longer write. Every one of these must now return 42501 → HTTP 401/403:
--      curl -s -o /dev/null -w '%{http_code}\n' -X DELETE \
--        "$URL/rest/v1/products?id=eq.00000000-0000-0000-0000-000000000000" \
--        -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
--    …repeat for site_settings (key=eq.__none__), coupons (code=eq.__NONE__), orders, audit_log.
-- b) Reads the storefront needs still work — these must all still be HTTP 200 with rows:
--      $URL/rest/v1/products?select=slug&limit=1
--      $URL/rest/v1/currencies?select=code&limit=1
--      $URL/rest/v1/payment_methods?select=code&limit=1
--      $URL/rest/v1/site_settings?select=key&limit=1
-- c) Privilege ledger, in the dashboard SQL editor:
--      SELECT relname, relacl FROM pg_class c
--        JOIN pg_namespace n ON n.oid = c.relnamespace
--       WHERE n.nspname = 'public' AND relkind IN ('r','p')
--         AND relacl::text LIKE '%anon%='  -- expect: no rows carrying w (write) for anon
--       ORDER BY relname;
-- d) A signed-in customer still has their own data paths: add to cart, save an address,
--    submit a review. All three must succeed as `authenticated`.

-- ─── 4. Rollback (only if a flow breaks and the cause is proven to be this file) ───────────────
-- DO $$
-- DECLARE t record;
-- BEGIN
--   FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--             WHERE n.nspname = 'public' AND c.relkind IN ('r','p') LOOP
--     EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO anon', t.relname);
--   END LOOP;
-- END
-- $$;

-- ─── 5. Follow-ups this file deliberately does NOT do ─────────────────────────────────────────
-- * anon SELECT on `site_settings` still exposes the shop's IBAN / JazzCash number to any
--   visitor, because checkout renders those instructions from it. Fix by moving the collection
--   details into a table only an authenticated shopper (or a least-privilege RPC) can read,
--   then revoking SELECT on that key. Do it as its own migration so the storefront change and
--   the privilege change are verified separately.
-- * anon SELECT on `coupons` makes every live code public. Same shape of fix: validate a code
--   through a SECURITY DEFINER function instead of reading the table from the browser.
-- * The Phase 10 tables need RLS *enabled* as well as these privileges — that is
--   20261010120000_phase10_security_hardening.sql. The two files are independent and both
--   idempotent; apply that one too, then run tests/phase10-security-hardening.test.ts.
