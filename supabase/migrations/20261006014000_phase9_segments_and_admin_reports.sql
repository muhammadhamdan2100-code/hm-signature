-- ====================================================================
-- Phase 9 — 9.9 segmentation and 9.10 advanced admin reports.
--
-- get_customer_segments() already serves the follow-up automations, so it is
-- left exactly as it is and this adds the wider Phase 9 list beside it. Each
-- segment names its own rule and reports whether the data behind it exists,
-- because two of the ten cannot be answered honestly today: the customers
-- table has no destination country on any order, and the VIP tiers were shipped
-- with their thresholds unset, which is a configuration gap rather than a
-- measurement.
--
-- The five report sections deliberately share one shape: columns described by a
-- translation key and a kind, plus rows of raw values. Formatting, currency and
-- localisation belong to the reader, and the same description drives the CSV
-- and spreadsheet exports, so an export can never quietly carry a column the
-- screen did not show.
-- ====================================================================

begin;

-- ====================================================================
-- 9.9 SEGMENTATION
-- ====================================================================
create or replace function public.get_phase9_segments(p_currency text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_rate numeric;
  v_buyers bigint := 0;
  v_high_value_cut numeric;
begin
  if not public.can_see_report('business') then
    raise exception 'Customer segmentation needs a business report scope.';
  end if;

  v_rate := public.analytics_rate(p_currency);

  with buyers as (
    select ao.customer_email, count(*) as purchases, sum(ao.amount) as net
    from public.analytics_orders('business', null, null, null, p_currency, true) ao
    where ao.customer_email is not null
    group by ao.customer_email
  )
  select count(*), percentile_cont(0.8) within group (order by net)::numeric
    into v_buyers, v_high_value_cut
  from buyers;

  return jsonb_build_object(
    'data_status', case when coalesce(v_buyers, 0) = 0 then 'insufficient_data' else 'calculated' end,
    'currency', coalesce(nullif(p_currency, ''), 'base'),
    'buyers', coalesce(v_buyers, 0),
    'segments', jsonb_build_array(
      jsonb_build_object(
        'key', 'new_customer',
        'rule', 'Exactly one completed paid order',
        'customers', (
          select count(*) from (
            select ao.customer_email from public.analytics_orders('business', null, null, null, p_currency, true) ao
            where ao.customer_email is not null group by ao.customer_email having count(*) = 1
          ) t
        ),
        'data_status', 'calculated'
      ),
      jsonb_build_object(
        'key', 'returning_customer',
        'rule', 'Two or more completed paid orders',
        'customers', (
          select count(*) from (
            select ao.customer_email from public.analytics_orders('business', null, null, null, p_currency, true) ao
            where ao.customer_email is not null group by ao.customer_email having count(*) >= 2
          ) t
        ),
        'data_status', 'calculated'
      ),
      jsonb_build_object(
        'key', 'frequent_buyer',
        'rule', 'Three or more completed paid orders',
        'customers', (
          select count(*) from (
            select ao.customer_email from public.analytics_orders('business', null, null, null, p_currency, true) ao
            where ao.customer_email is not null group by ao.customer_email having count(*) >= 3
          ) t
        ),
        'data_status', 'calculated'
      ),
      jsonb_build_object(
        'key', 'high_value',
        'rule', 'Lifetime net revenue in the top fifth of buyers',
        'customers', (
          select count(*) from (
            select ao.customer_email from public.analytics_orders('business', null, null, null, p_currency, true) ao
            where ao.customer_email is not null group by ao.customer_email
            having sum(ao.amount) >= coalesce(v_high_value_cut, 0)
          ) t
        ),
        'data_status', case when coalesce(v_buyers, 0) < 10 then 'insufficient_data' else 'calculated' end,
        'note', case when coalesce(v_buyers, 0) < 10
          then 'A percentile over fewer than ten buyers identifies the same people as a plain ranking, so the label carries no information yet.' end
      ),
      jsonb_build_object(
        'key', 'vip',
        'rule', 'Profile carries a VIP tier above the entry tier',
        'customers', (
          select count(*) from public.profiles pr
          where pr.role = 'customer' and coalesce(pr.vip_tier_code, 'member') <> 'member'
        ),
        'tiers', (
          select coalesce(jsonb_agg(jsonb_build_object(
              'code', t.code, 'rank', t.rank, 'enabled', t.enabled,
              'min_lifetime_spend', t.min_lifetime_spend, 'min_points', t.min_points
            ) order by t.rank), '[]'::jsonb)
          from public.vip_tiers t
        ),
        'data_status', case
          when exists (select 1 from public.vip_tiers where enabled and (min_lifetime_spend is null or min_points is null))
            and not exists (select 1 from public.vip_tiers where enabled and min_lifetime_spend is not null)
          then 'configuration_pending'
          else 'actual'
        end,
        'note', 'Tier codes stored on a profile are counted as they stand. The spend and points thresholds that promote a customer are still unset, so no one is promoted automatically.'
      ),
      jsonb_build_object(
        'key', 'at_risk',
        'rule', 'At least one purchase, last one between 60 and 120 days ago',
        'customers', (
          select count(*) from (
            select ao.customer_email, max(ao.placed_on) as last_on
            from public.analytics_orders('business', null, null, null, p_currency, true) ao
            where ao.customer_email is not null group by ao.customer_email
            having max(ao.placed_on) < current_date - 60 and max(ao.placed_on) >= current_date - 120
          ) t
        ),
        'data_status', 'calculated'
      ),
      jsonb_build_object(
        'key', 'dormant',
        'rule', 'At least one purchase, none in the last 120 days',
        'customers', (
          select count(*) from (
            select ao.customer_email, max(ao.placed_on) as last_on
            from public.analytics_orders('business', null, null, null, p_currency, true) ao
            where ao.customer_email is not null group by ao.customer_email
            having max(ao.placed_on) < current_date - 120
          ) t
        ),
        'data_status', 'calculated'
      ),
      jsonb_build_object(
        'key', 'unconverted',
        'rule', 'Registered customer with no completed paid order',
        'customers', (
          select count(*) from public.profiles pr
          where pr.role = 'customer'
            and not exists (
              select 1 from public.orders o
              where (o.customer_id = pr.id or lower(o.customer_email) = lower(pr.email))
                and o.status not in ('Cancelled', 'Returned')
                and o.payment_status in ('Paid', 'Verified')
            )
        ),
        'data_status', 'actual'
      ),
      jsonb_build_object(
        'key', 'by_country',
        'rule', 'Destination country recorded on the order',
        'customers', (
          select coalesce(jsonb_agg(jsonb_build_object('value', c.country, 'customers', c.n) order by c.n desc), '[]'::jsonb)
          from (
            select coalesce(ao.customer_country, '(not recorded)') as country, count(distinct ao.customer_email) as n
            from public.analytics_orders('business', null, null, null, p_currency, true) ao
            where ao.customer_email is not null
            group by 1
          ) c
        ),
        'data_status', case
          when exists (select 1 from public.orders o where nullif(coalesce(o.destination_country, ''), '') is not null)
          then 'actual' else 'not_tracked' end,
        'note', 'No stored order carries a destination country, so every buyer falls in the unrecorded group. The field exists on the order row and will split automatically once it is captured at checkout.'
      ),
      jsonb_build_object(
        'key', 'fragrance_affinity',
        'rule', 'Fragrance family the customer bought most often',
        'customers', (
          select coalesce(jsonb_agg(jsonb_build_object('value', t.family, 'customers', t.n) order by t.n desc), '[]'::jsonb)
          from (
            select f.family, count(*) as n
            from (
              select distinct on (l.customer_email)
                     l.customer_email,
                     coalesce(l.fragrance_family, '(unknown)') as family
              from (
                select ao2.customer_email, p2.fragrance_family, sum(ol.quantity) as bought
                from public.analytics_order_lines('business', null, null, null, p_currency, true) ol
                join public.analytics_orders('business', null, null, null, p_currency, true) ao2
                  on ao2.order_id = ol.order_id
                left join public.products p2 on p2.id = ol.product_id
                where ao2.customer_email is not null
                group by ao2.customer_email, p2.fragrance_family
              ) l
              order by l.customer_email, l.bought desc
            ) f
            group by f.family
          ) t
        ),
        'data_status', 'calculated'
      ),
      jsonb_build_object(
        'key', 'product_affinity',
        'rule', 'Fragrance the customer bought most often',
        'customers', (
          select coalesce(jsonb_agg(jsonb_build_object('value', t.name, 'customers', t.n) order by t.n desc), '[]'::jsonb)
          from (
            select f.name, count(*) as n
            from (
              select distinct on (l.customer_email) l.customer_email, l.name
              from (
                select ao2.customer_email, ol.product_name as name, sum(ol.quantity) as bought
                from public.analytics_order_lines('business', null, null, null, p_currency, true) ol
                join public.analytics_orders('business', null, null, null, p_currency, true) ao2
                  on ao2.order_id = ol.order_id
                where ao2.customer_email is not null and ol.product_name is not null
                group by ao2.customer_email, ol.product_name
              ) l
              order by l.customer_email, l.bought desc
            ) f
            group by f.name
          ) t
        ),
        'data_status', 'calculated'
      )
    ),
    'note', 'Counts come from completed paid orders only, so a cancelled order contributes nothing even when it was paid for and refunded. A segment with no members is a real zero; a segment with no source data says so instead.'
  );
end;
$function$;

comment on function public.get_phase9_segments(text) is
  'The Phase 9 customer segments beside the automation segments, each carrying its own rule and data status. Country and VIP report their missing inputs rather than absorbing everyone into one bucket.';

revoke execute on function public.get_phase9_segments(text) from public;
grant execute on function public.get_phase9_segments(text) to authenticated, service_role;

-- ====================================================================
-- 9.10 REPORT SECTIONS. One shape, five questions.
-- ====================================================================
create or replace function public.report_sales(
  p_from date default null, p_to date default null, p_country text default null, p_currency text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_rows jsonb;
begin
  if not public.can_see_report('business') then
    raise exception 'The sales report needs a business report scope.';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'period', to_char(d.period, 'YYYY-MM-DD'),
      'orders', d.orders,
      'purchases', d.purchases,
      'units', d.units,
      'gross', d.gross,
      'discounts', d.discounts,
      'refunds', d.refunds,
      'net', round((d.gross - d.discounts - d.refunds)::numeric, 2),
      'average_order_value', case when d.purchases = 0 then null
                                  else round(d.gross / d.purchases, 2) end
    ) order by d.period desc), '[]'::jsonb)
  into v_rows
  from (
    select date_trunc('day', ao.placed_on)::date as period,
           count(*) as orders,
           count(*) filter (where ao.is_purchase) as purchases,
           coalesce(sum(ao.units), 0) as units,
           round(coalesce(sum(ao.amount), 0)::numeric, 2) as gross,
           round(coalesce(sum(ao.discount_amount), 0)::numeric, 2) as discounts,
           round(coalesce(sum(ao.refunded_amount), 0)::numeric, 2) as refunds
    from public.analytics_orders('business', p_from, p_to, p_country, p_currency, false) ao
    group by 1
  ) d;

  return jsonb_build_object(
    'section', 'sales',
    'scope', 'business',
    'currency', coalesce(nullif(p_currency, ''), 'base'),
    'from_date', p_from, 'to_date', p_to,
    'country', nullif(btrim(coalesce(p_country, '')), ''),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'period', 'label_key', 'period', 'kind', 'text'),
      jsonb_build_object('key', 'orders', 'label_key', 'orders', 'kind', 'count'),
      jsonb_build_object('key', 'purchases', 'label_key', 'purchases', 'kind', 'count'),
      jsonb_build_object('key', 'units', 'label_key', 'units', 'kind', 'count'),
      jsonb_build_object('key', 'gross', 'label_key', 'gross', 'kind', 'money'),
      jsonb_build_object('key', 'discounts', 'label_key', 'discounts', 'kind', 'money'),
      jsonb_build_object('key', 'refunds', 'label_key', 'refunds', 'kind', 'money'),
      jsonb_build_object('key', 'net', 'label_key', 'net', 'kind', 'money'),
      jsonb_build_object('key', 'average_order_value', 'label_key', 'average_order_value', 'kind', 'money')
    ),
    'rows', coalesce(v_rows, '[]'::jsonb),
    'data_status', case when coalesce(jsonb_array_length(coalesce(v_rows, '[]'::jsonb)), 0) = 0
                        then 'insufficient_data' else 'actual' end,
    'note', 'Orders counts every order placed, purchases counts only those that stayed live and settled, and net removes discounts and processed refunds.'
  );
end;
$function$;

create or replace function public.report_customers(
  p_from date default null, p_to date default null, p_country text default null, p_currency text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_rows jsonb;
  v_count bigint;
begin
  if not public.can_see_report('business') then
    raise exception 'The customer report needs a business report scope.';
  end if;

  select count(*),
         coalesce(jsonb_agg(jsonb_build_object(
            'customer', q.customer_email,
            'customer_id', q.customer_id,
            'orders', q.orders,
            'purchases', q.purchases,
            'first_order', q.first_on,
            'last_order', q.last_on,
            'gross', q.gross,
            'net', q.net,
            'average_order_value', case when q.purchases = 0 then null else round(q.gross / q.purchases, 2) end,
            'is_repeat', q.purchases > 1
          ) order by q.net desc), '[]'::jsonb)
  into v_count, v_rows
  from (
    select ao.customer_email,
           min(ao.customer_id) as customer_id,
           count(*) as orders,
           count(*) filter (where ao.is_purchase) as purchases,
           min(ao.placed_on)::text as first_on,
           max(ao.placed_on)::text as last_on,
           round(coalesce(sum(ao.amount) filter (where ao.is_purchase), 0)::numeric, 2) as gross,
           round((coalesce(sum(ao.amount) filter (where ao.is_purchase), 0)
                  - coalesce(sum(ao.discount_amount) filter (where ao.is_purchase), 0)
                  - coalesce(sum(ao.refunded_amount), 0))::numeric, 2) as net
    from public.analytics_orders('business', p_from, p_to, p_country, p_currency, false) ao
    where ao.customer_email is not null
    group by ao.customer_email
    order by net desc
    limit 200
  ) q;

  return jsonb_build_object(
    'section', 'customers',
    'scope', 'business',
    'currency', coalesce(nullif(p_currency, ''), 'base'),
    'from_date', p_from, 'to_date', p_to,
    'country', nullif(btrim(coalesce(p_country, '')), ''),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'customer', 'label_key', 'customer', 'kind', 'text'),
      jsonb_build_object('key', 'orders', 'label_key', 'orders', 'kind', 'count'),
      jsonb_build_object('key', 'purchases', 'label_key', 'purchases', 'kind', 'count'),
      jsonb_build_object('key', 'first_order', 'label_key', 'first_order', 'kind', 'date'),
      jsonb_build_object('key', 'last_order', 'label_key', 'last_order', 'kind', 'date'),
      jsonb_build_object('key', 'gross', 'label_key', 'gross', 'kind', 'money'),
      jsonb_build_object('key', 'net', 'label_key', 'net', 'kind', 'money'),
      jsonb_build_object('key', 'average_order_value', 'label_key', 'average_order_value', 'kind', 'money'),
      jsonb_build_object('key', 'is_repeat', 'label_key', 'repeat_buyer', 'kind', 'boolean')
    ),
    'rows', coalesce(v_rows, '[]'::jsonb),
    'customer_ids', coalesce((select jsonb_agg(q2.customer_id) from (
        select ao.customer_id from public.analytics_orders('business', p_from, p_to, p_country, p_currency, false) ao
        where ao.customer_id is not null group by ao.customer_id) q2), '[]'::jsonb),
    'data_status', case when coalesce(v_count, 0) = 0 then 'insufficient_data' else 'actual' end,
    'note', 'Identity is the address on the order row, which links orders placed before an account existed. Only purchases count toward gross and net.'
  );
end;
$function$;

create or replace function public.report_products(
  p_from date default null, p_to date default null, p_country text default null, p_currency text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_rows jsonb;
  v_count bigint;
begin
  if not (public.can_see_report('content') or public.can_see_report('business')) then
    raise exception 'The product report needs a product or business report scope.';
  end if;

  select count(*),
         coalesce(jsonb_agg(jsonb_build_object(
            'product', q.product_name,
            'units', q.units,
            'revenue', q.revenue,
            'discounts', q.discounts,
            'refunds', q.refunds,
            'net', round((q.revenue - q.discounts - q.refunds)::numeric, 2),
            'orders', q.orders,
            'on_hand', q.on_hand,
            'share_percent', case when q.total_revenue = 0 then null
                                  else round(q.revenue / q.total_revenue * 100, 1) end
          ) order by q.revenue desc), '[]'::jsonb)
  into v_count, v_rows
  from (
    select l.product_name,
           sum(l.quantity) as units,
           round(coalesce(sum(l.line_share), 0)::numeric, 2) as revenue,
           round(coalesce(sum(l.discount_share), 0)::numeric, 2) as discounts,
           round(coalesce(sum(l.refund_share), 0)::numeric, 2) as refunds,
           count(distinct l.order_id) as orders,
           coalesce((select sum(v.stock) from public.product_variants v
                     join public.products p on p.id = v.product_id
                     where p.name = l.product_name and v.active), 0) as on_hand,
           sum(sum(coalesce(l.line_share, 0))) over () as total_revenue
    from public.analytics_order_lines(
      case when public.can_see_report('business') then 'business' else 'content' end,
      p_from, p_to, p_country, p_currency, true
    ) l
    group by l.product_name
    order by revenue desc
    limit 200
  ) q;

  return jsonb_build_object(
    'section', 'products',
    'scope', 'content',
    'currency', coalesce(nullif(p_currency, ''), 'base'),
    'from_date', p_from, 'to_date', p_to,
    'country', nullif(btrim(coalesce(p_country, '')), ''),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'product', 'label_key', 'product', 'kind', 'text'),
      jsonb_build_object('key', 'units', 'label_key', 'units', 'kind', 'count'),
      jsonb_build_object('key', 'revenue', 'label_key', 'revenue', 'kind', 'money'),
      jsonb_build_object('key', 'discounts', 'label_key', 'discounts', 'kind', 'money'),
      jsonb_build_object('key', 'refunds', 'label_key', 'refunds', 'kind', 'money'),
      jsonb_build_object('key', 'net', 'label_key', 'net', 'kind', 'money'),
      jsonb_build_object('key', 'orders', 'label_key', 'orders', 'kind', 'count'),
      jsonb_build_object('key', 'on_hand', 'label_key', 'on_hand', 'kind', 'count'),
      jsonb_build_object('key', 'share_percent', 'label_key', 'share_percent', 'kind', 'percent')
    ),
    'rows', coalesce(v_rows, '[]'::jsonb),
    'data_status', case when coalesce(v_count, 0) = 0 then 'insufficient_data' else 'actual' end,
    'note', 'Revenue is the completed paid baskets this window holds, attributed to the product names on their lines. Stock on hand is the live figure, not the figure at the time of sale.'
  );
end;
$function$;

create or replace function public.report_payments(
  p_from date default null, p_to date default null, p_country text default null, p_currency text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_rows jsonb;
  v_count bigint;
begin
  if not public.can_see_report('operational') then
    raise exception 'The payment report needs an operational report scope.';
  end if;

  select count(*),
         coalesce(jsonb_agg(jsonb_build_object(
            'method', q.method,
            'currency', q.currency,
            'orders', q.orders,
            'settled', q.settled,
            'awaiting', q.awaiting,
            'failed', q.failed,
            'settled_amount', q.settled_amount,
            'awaiting_amount', q.awaiting_amount,
            'refunded_amount', q.refunded_amount
          ) order by q.settled_amount desc), '[]'::jsonb)
  into v_count, v_rows
  from (
    select coalesce(nullif(ao.payment_method, ''), '(unset)') as method,
           coalesce(nullif(ao.snapshot_currency, ''), '(unset)') as currency,
           count(*) as orders,
           count(*) filter (where ao.payment_status in ('Paid', 'Verified')) as settled,
           count(*) filter (where ao.payment_status in ('Pending', 'Verification Pending')) as awaiting,
           count(*) filter (where ao.payment_status in ('Failed', 'Rejected')) as failed,
           round(coalesce(sum(ao.amount) filter (where ao.payment_status in ('Paid', 'Verified')), 0)::numeric, 2) as settled_amount,
           round(coalesce(sum(ao.amount) filter (where ao.payment_status in ('Pending', 'Verification Pending')), 0)::numeric, 2) as awaiting_amount,
           round(coalesce(sum(ao.refunded_amount), 0)::numeric, 2) as refunded_amount
    from public.analytics_orders('operational', p_from, p_to, p_country, p_currency, false) ao
    group by 1, 2
    order by settled_amount desc
    limit 100
  ) q;

  return jsonb_build_object(
    'section', 'payments',
    'scope', 'operational',
    'currency', coalesce(nullif(p_currency, ''), 'base'),
    'from_date', p_from, 'to_date', p_to,
    'country', nullif(btrim(coalesce(p_country, '')), ''),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'method', 'label_key', 'method', 'kind', 'text'),
      jsonb_build_object('key', 'currency', 'label_key', 'currency', 'kind', 'text'),
      jsonb_build_object('key', 'orders', 'label_key', 'orders', 'kind', 'count'),
      jsonb_build_object('key', 'settled', 'label_key', 'settled', 'kind', 'count'),
      jsonb_build_object('key', 'awaiting', 'label_key', 'awaiting', 'kind', 'count'),
      jsonb_build_object('key', 'failed', 'label_key', 'failed', 'kind', 'count'),
      jsonb_build_object('key', 'settled_amount', 'label_key', 'settled_amount', 'kind', 'money'),
      jsonb_build_object('key', 'awaiting_amount', 'label_key', 'awaiting_amount', 'kind', 'money'),
      jsonb_build_object('key', 'refunded_amount', 'label_key', 'refunded_amount', 'kind', 'money')
    ),
    'rows', coalesce(v_rows, '[]'::jsonb),
    'data_status', case when coalesce(v_count, 0) = 0 then 'insufficient_data' else 'actual' end,
    'note', 'Grouped by method and the currency the order was placed in. Provider references, payment identifiers and proof links are deliberately absent: this is a reconciliation summary, not a transaction export.'
  );
end;
$function$;

create or replace function public.report_inventory(
  p_from date default null, p_to date default null, p_country text default null, p_currency text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_rows jsonb;
begin
  if not public.can_see_report('operational') then
    raise exception 'The inventory report needs an operational report scope.';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'product', q.product_name,
      'size', q.size,
      'sku', q.sku,
      'on_hand', q.on_hand,
      'reserved', q.reserved,
      'available', greatest(q.on_hand - q.reserved, 0),
      'low_stock_threshold', q.threshold,
      'sold_in_window', q.sold,
      'status', case
        when q.on_hand = 0 then 'out_of_stock'
        when greatest(q.on_hand - q.reserved, 0) <= q.threshold then 'low_stock'
        else 'in_stock' end
    ) order by q.product_name, q.size), '[]'::jsonb)
  into v_rows
  from (
    select p.name as product_name,
           v.size,
           v.sku,
           v.stock as on_hand,
           coalesce(rr.reserved, 0) as reserved,
           v.low_stock_threshold as threshold,
           coalesce(sl.sold, 0) as sold
    from public.product_variants v
    join public.products p on p.id = v.product_id
    left join lateral (
      select coalesce(sum(oi.quantity), 0) as reserved
      from public.order_items oi join public.orders o on o.id = oi.order_id
      where oi.variant_id = v.id and o.status in ('Pending', 'Confirmed', 'Processing')
    ) rr on true
    left join lateral (
      select coalesce(sum(oi2.quantity), 0) as sold
      from public.order_items oi2 join public.orders o2 on o2.id = oi2.order_id
      where oi2.variant_id = v.id
        and o2.status not in ('Cancelled', 'Returned') and o2.payment_status in ('Paid', 'Verified')
        and (p_from is null or (o2.created_at at time zone 'utc')::date >= p_from)
        and (p_to is null or (o2.created_at at time zone 'utc')::date <= p_to)
    ) sl on true
    where v.active
  ) q;

  return jsonb_build_object(
    'section', 'inventory',
    'scope', 'operational',
    'from_date', p_from, 'to_date', p_to,
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'product', 'label_key', 'product', 'kind', 'text'),
      jsonb_build_object('key', 'size', 'label_key', 'size', 'kind', 'text'),
      jsonb_build_object('key', 'sku', 'label_key', 'sku', 'kind', 'text'),
      jsonb_build_object('key', 'on_hand', 'label_key', 'on_hand', 'kind', 'count'),
      jsonb_build_object('key', 'reserved', 'label_key', 'reserved', 'kind', 'count'),
      jsonb_build_object('key', 'available', 'label_key', 'available', 'kind', 'count'),
      jsonb_build_object('key', 'low_stock_threshold', 'label_key', 'low_stock_threshold', 'kind', 'count'),
      jsonb_build_object('key', 'sold_in_window', 'label_key', 'sold_in_window', 'kind', 'count'),
      jsonb_build_object('key', 'status', 'label_key', 'status', 'kind', 'text')
    ),
    'rows', coalesce(v_rows, '[]'::jsonb),
    'data_status', 'actual',
    'note', 'Every figure is live stock and open-order reservation from the variant rows themselves. Sold in window follows the same completed purchase rule as the sales reports.'
  );
end;
$function$;

revoke execute on function public.report_sales(date, date, text, text) from public;
revoke execute on function public.report_customers(date, date, text, text) from public;
revoke execute on function public.report_products(date, date, text, text) from public;
revoke execute on function public.report_payments(date, date, text, text) from public;
revoke execute on function public.report_inventory(date, date, text, text) from public;
grant execute on function public.report_sales(date, date, text, text) to authenticated, service_role;
grant execute on function public.report_customers(date, date, text, text) to authenticated, service_role;
grant execute on function public.report_products(date, date, text, text) to authenticated, service_role;
grant execute on function public.report_payments(date, date, text, text) to authenticated, service_role;
grant execute on function public.report_inventory(date, date, text, text) to authenticated, service_role;

-- One door for the admin screen and for exports, so a section cannot be read
-- through a name the navigation never offers.
create or replace function public.get_admin_report(
  p_section text,
  p_from date default null,
  p_to date default null,
  p_country text default null,
  p_currency text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
begin
  return case lower(coalesce(p_section, ''))
    when 'sales' then public.report_sales(p_from, p_to, p_country, p_currency)
    when 'customers' then public.report_customers(p_from, p_to, p_country, p_currency)
    when 'products' then public.report_products(p_from, p_to, p_country, p_currency)
    when 'payments' then public.report_payments(p_from, p_to, p_country, p_currency)
    when 'inventory' then public.report_inventory(p_from, p_to, p_country, p_currency)
    else jsonb_build_object(
      'data_status', 'error',
      'error', 'unknown_section',
      'sections', jsonb_build_array('sales', 'customers', 'products', 'payments', 'inventory')
    )
  end;
end;
$function$;

comment on function public.get_admin_report(text, date, date, text, text) is
  'The five Phase 9 report sections behind one call. Each section checks its own scope, so an unknown name or an unauthorised role gets nothing useful.';

revoke execute on function public.get_admin_report(text, date, date, text, text) from public;
grant execute on function public.get_admin_report(text, date, date, text, text) to authenticated, service_role;

-- Verification, run once at apply time.
select 'phase9_reports'
  || ' | section_functions ' || (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace
      and p.proname in ('report_sales','report_customers','report_products','report_payments','report_inventory','get_admin_report','get_phase9_segments'))
  || ' | live_paid_orders ' || (select count(*) from public.orders o where o.status not in ('Cancelled','Returned') and o.payment_status in ('Paid','Verified'))
  || ' | vip_tiers_unconfigured ' || (select count(*) from public.vip_tiers where enabled and min_lifetime_spend is null)
  || ' | orders_with_country ' || (select count(*) from public.orders o where nullif(coalesce(o.destination_country,''),'') is not null);

commit;
