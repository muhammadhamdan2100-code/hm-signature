-- Phase 7 baseline, read after the pricing script has rolled its transaction back.
--
-- Run this immediately after tests/sql/phase7-international-pricing.sql. Every check must
-- be true: the probe order, the temporary destination and the ledger row it wrote exist
-- only inside that rolled-back transaction, so the live database must still be at the
-- shipped posture.
--
--   npx supabase db query --linked --project-ref <ref> -f tests/sql/phase7-baseline-after-rollback.sql
--
-- Expected output: "all_ok": true.

select jsonb_pretty(jsonb_build_object(
  'all_ok', (
    (select count(*) from public.orders) = 1
    and (select count(*) from public.inventory_transactions) = 5
    and (select coalesce(sum(stock), 0) from public.product_variants) = 1163
    and (select md5(string_agg(id::text || ':' || stock::text, ',' order by id)) from public.product_variants)
        = '06bd48d8b3d0babcc15aa86ac8cf75cd'
    and not exists (select 1 from public.countries where code = 'SX')
    and (select count(*) from public.countries where enabled) = 1
    and (select count(*) from public.countries where tax_enabled) = 0
    and (select count(*) from public.currencies) = 6
    and (select count(*) from public.languages) = 6
    and (select currency from public.orders where order_number = 'HMS-20261002-4952') = 'PKR'
    and (select total from public.orders where order_number = 'HMS-20261002-4952') = 3050.00
  ),
  'state', jsonb_build_object(
    'orders', (select count(*) from public.orders),
    'inventory_tx', (select count(*) from public.inventory_transactions),
    'total_stock', (select coalesce(sum(stock), 0) from public.product_variants),
    'open_countries', (select count(*) from public.countries where enabled),
    'taxed_countries', (select count(*) from public.countries where tax_enabled),
    'currencies', (select count(*) from public.currencies),
    'languages', (select count(*) from public.languages)
  )
)) as phase7_baseline;
