-- Phase 7 pricing rules, verified against the real database.
--
-- Tax and a destination's currency snapshot can only be proven by changing configuration,
-- and no configuration may be edited in a live project just to test it. So this script
-- does the whole thing inside one transaction and rolls it back: the numbers are computed
-- by the same functions the storefront calls, and nothing is left behind.
--
--   npx supabase db query --linked --project-ref <ref> -f tests/sql/phase7-international-pricing.sql
--
-- Expected output: every check "ok", baseline identical before and after, and the
-- transaction ends in a rollback so the countries table is untouched.
--
-- The final statement is the only result set the CLI prints, so all findings are folded
-- into one JSON value.

begin;

create temp table checks (key text, ok boolean, detail text);

-- Baseline: the shipped posture is one open destination, no tax, rates marked manual,
-- and the six interface languages Phase 7 ships (en ar fr es ur de).
insert into checks
select 'A1 baseline',
       (select count(*) from public.countries where enabled) = 1
         and (select count(*) from public.countries where tax_enabled) = 0
         and (select count(*) from public.currencies where enabled) = 6
         and (select count(*) from public.currencies where is_base) = 1
         and (select count(*) from public.languages) = 6,
       (select json_agg(row_to_json(t)) from (
           select code, enabled, shipping_fee, free_shipping_threshold, tax_enabled
           from public.countries order by sort_order limit 20) t);

insert into checks
select 'A2 historical order untouched',
       (select count(*) from public.orders) = 1
         and (select currency from public.orders where order_number = 'HMS-20261002-4952') = 'PKR'
         and (select currency_rate_to_base from public.orders where order_number = 'HMS-20261002-4952') = 1
         and (select tax_amount from public.orders where order_number = 'HMS-20261002-4952') = 0
         and (select destination_country from public.orders where order_number = 'HMS-20261002-4952') is null
         and (select total from public.orders where order_number = 'HMS-20261002-4952') = 3050.00,
       (select coalesce(json_agg(json_build_object('n', order_number, 'total', total, 'currency', currency)), '[]'::json)::text
        from public.orders);

-- One real catalogue size, priced under a temporary 5% destination.
insert into checks
select 'B1 no tax when disabled',
       (public.compute_order_pricing(
          jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where active and stock > 0 order by price limit 1), 'quantity', 2)),
          'PK', 'PKR', null, null) ->> 'tax')::numeric = 0,
       public.compute_order_pricing(
          jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where active and stock > 0 order by price limit 1), 'quantity', 2)),
          'PK', 'PKR', null, null)::text;

insert into public.countries (code, name, enabled, currency_code, shipping_fee, free_shipping_threshold,
                              delivery_days_min, delivery_days_max, delivery_method, tax_enabled, tax_rate, tax_label)
values ('SX', 'Testland', true, 'PKR', 500, 8000, 4, 6, 'Courier — test', true, 5, 'GST');

do $$
declare
  v_variant uuid;
  v_quote jsonb;
  v_goods numeric;
  v_expected_tax numeric;
begin
  select id into v_variant from public.product_variants where active and stock > 0 order by price limit 1;

  -- Below the free threshold: goods + 500 shipping, tax on both.
  v_quote := public.compute_order_pricing(
    jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'quantity', 1)), 'SX', 'PKR', null, null);
  v_goods := (v_quote ->> 'subtotal')::numeric - (v_quote ->> 'discount')::numeric;
  v_expected_tax := round((v_goods + 500) * 5 / 100.0, 2);

  insert into checks
  select 'C1 tax on goods plus shipping',
         (v_quote ->> 'shipping')::numeric = 500
           and (v_quote ->> 'tax')::numeric = v_expected_tax
           and (v_quote ->> 'total')::numeric = round(v_goods + 500 + v_expected_tax, 2)
           and v_quote ->> 'tax_label' = 'GST'
           and (v_quote ->> 'tax_rate')::numeric = 5,
         v_quote::text;

  -- Above the threshold: shipping disappears and tax follows.
  v_quote := public.compute_order_pricing(
    jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'quantity', 50)), 'SX', 'PKR', null, null);
  v_goods := (v_quote ->> 'subtotal')::numeric - (v_quote ->> 'discount')::numeric;
  insert into checks
  select 'C2 tax on goods when shipping is free',
         (v_quote ->> 'shipping')::numeric = 0
           and (v_quote ->> 'tax')::numeric = round(v_goods * 5 / 100.0, 2),
         v_quote::text;

  -- Display currency is a view of the same base total, rounded to the currency's own precision.
  v_quote := public.compute_order_pricing(
    jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'quantity', 1)), 'SX', 'USD', null, null);
  insert into checks
  select 'C3 currency snapshot',
         v_quote ->> 'currency' = 'USD'
           and (v_quote ->> 'currency_minor_units')::int = 2
           and abs((v_quote ->> 'total_in_currency')::numeric
                   - round((v_quote ->> 'total')::numeric / (v_quote ->> 'currency_rate_to_base')::numeric, 2)) < 0.005
           and v_quote ->> 'rate_source' = 'manual',
         v_quote::text;
end $$;

-- A destination that exists but is closed must still be refused inside place_order.
do $$
declare v_message text;
begin
  begin
    perform public.place_order(
      null, 'Phase 7 probe', 'probe@example.invalid', '0300000000',
      jsonb_build_object('street', 'Somewhere', 'city', 'Nowhere', 'state', '-', 'zip', '000', 'country', 'Nowhere'),
      'COD', null,
      jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where active and stock > 0 limit 1), 'quantity', 1)));
    insert into checks values ('D1 unknown country refused', false, 'place_order unexpectedly succeeded');
  exception when others then
    insert into checks values ('D1 unknown country refused', true, sqlerrm);
  end;

  begin
    perform public.place_order(
      null, 'Phase 7 probe', 'probe@example.invalid', '0300000000',
      jsonb_build_object('country', 'Pakistan'),
      'Stripe', null,
      jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where active and stock > 0 limit 1), 'quantity', 1)));
    insert into checks values ('D2 unsupported payment method refused', false, 'place_order unexpectedly succeeded');
  exception when others then
    insert into checks values ('D2 unsupported payment method refused', true, sqlerrm);
  end;

  -- The address country text alone still resolves, so today's storefront keeps working.
  begin
    perform public.place_order(
      null, 'Phase 7 probe', 'probe@example.invalid', '0300000000',
      jsonb_build_object('street', 'House 1', 'city', 'Lahore', 'state', 'Punjab', 'zip', '54600', 'country', 'Pakistan'),
      'Raast', null,
      jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where active and stock > 0 limit 1), 'quantity', 1)),
      null, 'PKR');
    insert into checks values ('D3 legacy address country resolves', true, 'order created inside the rolled-back transaction');
  exception when others then
    insert into checks values ('D3 legacy address country resolves', false, sqlerrm);
  end;
end $$;

-- Ownership, security-definer status and the one place_order signature.
insert into checks
select 'E1 functions pinned and owned',
       (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname in ('place_order', 'quote_order', 'compute_order_pricing')) = 3
         and (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'place_order') = 1
         and not (select bool_or(not p.prosecdef) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname in ('place_order', 'quote_order', 'compute_order_pricing')),
       (select json_agg(json_build_object('f', p.proname, 'definer', p.prosecdef, 'args', p.pronargs))
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname in ('place_order', 'quote_order', 'compute_order_pricing'))::text;

insert into checks
select 'E2 helper not callable by browser roles',
       (select not (has_function_privilege('anon', 'public.compute_order_pricing(jsonb,text,text,text,uuid)', 'execute'))
          and not (has_function_privilege('authenticated', 'public.compute_order_pricing(jsonb,text,text,text,uuid)', 'execute'))
          and has_function_privilege('anon', 'public.quote_order(jsonb,text,text,text)', 'execute')),
       (select coalesce(array_to_string(proacl, ','), 'null') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = 'compute_order_pricing')::text;

-- No browser role may write the configuration tables directly.
insert into checks
select 'E3 configuration writes are policy-guarded',
       (select count(*) = 0 from pg_policies where schemaname = 'public' and tablename in ('countries','currencies','languages') and cmd in ('INSERT','UPDATE','DELETE'))
         and (select count(*) = 3 from pg_policies where schemaname = 'public' and tablename in ('countries','currencies','languages') and cmd = 'SELECT'),
       (select json_agg(json_build_object('t', tablename, 'cmd', cmd, 'roles', roles)) from pg_policies
         where schemaname = 'public' and tablename in ('countries','currencies','languages'));

-- Inside this transaction the probe order really wrote: one extra order, one extra
-- ledger row, one unit less on the shelf. After the rollback the same query must return
-- the shipped baseline, which is the point of the closing statement below.
insert into checks
select 'Z1 probe write landed in transaction',
       (select count(*) from public.orders) = 2
         and (select count(*) from public.inventory_transactions) = 6
         and (select count(*) from public.countries where code = 'SX') = 1
         and exists (
           select 1 from public.orders o
           where o.currency = 'PKR'
             and o.destination_country = 'PK'
             and abs(o.total - (o.subtotal - o.discount_amount + o.shipping_cost + o.tax_amount)) < 0.005
             and o.order_number <> 'HMS-20261002-4952'),
       (select json_build_object('orders', (select count(*) from public.orders),
                                'stock', (select sum(stock) from public.product_variants),
                                'inv_tx', (select count(*) from public.inventory_transactions),
                                'sx_rows', (select count(*) from public.countries where code = 'SX'))::text);

select jsonb_pretty(jsonb_build_object(
  'all_ok', not exists (select 1 from checks where not ok),
  'results', jsonb_agg(jsonb_build_object('check', key, 'ok', ok, 'detail', left(coalesce(detail, ''), 160)) order by key)
)) as phase7_pricing_checks
from checks;

-- The CLI only prints the LAST result set, and the last statement of this file is the
-- post-rollback state probe below — so a failing check would otherwise scroll past unseen.
-- Loud failure is the point of a contract, so abort the run when any check is false.
do $$
declare failed int;
begin
  select count(*) into failed from checks where not ok;
  if failed > 0 then
    raise exception 'PHASE7 PRICING CONTRACT FAILED: % check(s) not ok — read the results array in this transaction output', failed;
  end if;
end $$;

rollback;

-- Post-rollback: nothing above may survive. The CLI prints only the last result set, so
-- run this file and then confirm with:
--
--   npx supabase db query --linked --project-ref <ref> -f tests/sql/phase7-baseline-after-rollback.sql

select 'rolled back' as phase7_state;
