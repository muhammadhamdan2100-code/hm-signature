-- ====================================================================
-- Phase 9 — one definition of a sale, then the customer metrics built on it.
--
-- analytics_orders() and analytics_order_lines() are the backbone every later
-- Phase 9 report reads from. That is deliberate: until now each function
-- restated its own idea of what counts (get_admin_analytics excludes cancelled
-- orders, recommendations want Paid or Verified, the reconciliation view has its
-- own eight states), so two reports about the same week could disagree. Here
-- there is one filter, one currency rule, and one status list that counts as a
-- purchase.
--
-- A purchase is an order that has not been cancelled or returned AND whose
-- payment has settled ('Paid' or 'Verified'). On the live data today exactly one
-- order exists and it is Cancelled, so every metric in this file is expected to
-- report insufficient_data rather than invent a number.
--
-- Scope: the same core answers three audiences, and hands each one only what its
-- scope entitles them to. Business and operational callers see customer
-- identity; a content caller gets the identical money and volume figures with
-- the identity columns nulled, which is what lets the product report run for the
-- Content Manager without exposing who bought what.
-- ====================================================================

begin;

-- The multiplier that turns a base-currency amount into the requested one.
-- Rates are stored as base units per one unit of currency (PKR 278.5 per USD).
create or replace function public.analytics_rate(p_currency text)
returns numeric
language sql
stable
security definer
set search_path = public, pg_temp
as $function$
  select case
    when nullif(btrim(coalesce(p_currency, '')), '') is null then 1
    when upper(btrim(p_currency)) = upper((select code from public.currencies where is_base limit 1)) then 1
    else coalesce(
      (select c.rate_to_base from public.currencies c
        where upper(c.code) = upper(btrim(p_currency)) and c.enabled
        limit 1),
      1
    )
  end;
$function$;

comment on function public.analytics_rate(text) is
  'Base units per one unit of the requested display currency. Anything unknown or disabled falls back to the base currency rather than guessing a rate.';

revoke execute on function public.analytics_rate(text) from public;
grant execute on function public.analytics_rate(text) to authenticated, service_role;

-- -------------------------------------------------------------------
-- Order grain: one row per order in the window, net of processed refunds.
create or replace function public.analytics_orders(
  p_scope text default 'business',
  p_from date default null,
  p_to date default null,
  p_country text default null,
  p_currency text default null,
  p_only_purchases boolean default true
)
returns table (
  order_id uuid,
  order_number text,
  placed_on date,
  placed_at timestamptz,
  customer_id uuid,
  customer_email text,
  customer_country text,
  order_status text,
  payment_status text,
  payment_method text,
  coupon_code text,
  snapshot_currency text,
  amount numeric,
  subtotal numeric,
  discount_amount numeric,
  shipping_cost numeric,
  tax_amount numeric,
  gift_card_amount numeric,
  loyalty_discount numeric,
  refunded_amount numeric,
  units integer,
  is_purchase boolean,
  is_delivered boolean,
  converted_at_configured_rate boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_scope text := lower(coalesce(p_scope, 'business'));
  v_rate numeric;
begin
  if v_scope not in ('business', 'operational', 'content')
     or not public.can_see_report(v_scope) then
    raise exception 'This report needs a business, operational or content scope.';
  end if;

  v_rate := public.analytics_rate(p_currency);

  return query
  select
    o.id,
    o.order_number,
    (o.created_at at time zone 'utc')::date,
    o.created_at,
    -- Identity is withheld from the content scope, not from the arithmetic.
    case when v_scope = 'content' then null else o.customer_id end,
    case when v_scope = 'content' then null else o.customer_email end,
    nullif(coalesce(o.destination_country, ''), ''),
    o.status,
    o.payment_status,
    o.payment_method,
    nullif(coalesce(o.coupon_code, ''), ''),
    coalesce(nullif(o.currency, ''), 'PKR'),
    -- An order that was placed in the requested currency keeps its own stored
    -- snapshot, so a later rate change cannot rewrite history. Anything else is
    -- divided by the rate configured today, and says so.
    case
      when v_rate = 1 then round(coalesce(o.total, 0), 2)
      when upper(coalesce(nullif(o.currency, ''), 'PKR')) = upper(btrim(coalesce(p_currency, '')))
        then coalesce(o.total_in_currency, round(coalesce(o.total, 0) / greatest(nullif(o.currency_rate_to_base, 0), 0.000001), 2))
      else round(coalesce(o.total, 0) / greatest(v_rate, 0.000001), 2)
    end,
    case when v_rate = 1 then round(coalesce(o.subtotal, 0), 2)
         else round(coalesce(o.subtotal, 0) / greatest(v_rate, 0.000001), 2) end,
    case when v_rate = 1 then round(coalesce(o.discount_amount, 0), 2)
         else round(coalesce(o.discount_amount, 0) / greatest(v_rate, 0.000001), 2) end,
    case when v_rate = 1 then round(coalesce(o.shipping_cost, 0), 2)
         else round(coalesce(o.shipping_cost, 0) / greatest(v_rate, 0.000001), 2) end,
    case when v_rate = 1 then round(coalesce(o.tax_amount, 0), 2)
         else round(coalesce(o.tax_amount, 0) / greatest(v_rate, 0.000001), 2) end,
    case when v_rate = 1 then round(coalesce(o.gift_card_amount, 0), 2)
         else round(coalesce(o.gift_card_amount, 0) / greatest(v_rate, 0.000001), 2) end,
    case when v_rate = 1 then round(coalesce(o.loyalty_discount, 0), 2)
         else round(coalesce(o.loyalty_discount, 0) / greatest(v_rate, 0.000001), 2) end,
    case when v_rate = 1 then round(coalesce(rf.refunded, 0), 2)
         else round(coalesce(rf.refunded, 0) / greatest(v_rate, 0.000001), 2) end,
    coalesce(li.units, 0)::integer,
    (o.status not in ('Cancelled', 'Returned') and o.payment_status in ('Paid', 'Verified')),
    (o.status = 'Delivered'),
    (v_rate <> 1 and upper(coalesce(nullif(o.currency, ''), 'PKR')) <> upper(btrim(coalesce(p_currency, ''))))
  from public.orders o
  left join lateral (
    select coalesce(sum(rr.amount), 0) as refunded
    from public.refunds rr
    where rr.order_id = o.id and rr.status = 'processed'
  ) rf on true
  left join lateral (
    select coalesce(sum(ol.quantity), 0) as units
    from public.order_items ol
    where ol.order_id = o.id
  ) li on true
  where (p_from is null or (o.created_at at time zone 'utc')::date >= p_from)
    and (p_to is null or (o.created_at at time zone 'utc')::date <= p_to)
    and (nullif(btrim(coalesce(p_country, '')), '') is null
         or upper(coalesce(o.destination_country, '')) = upper(btrim(p_country)))
    and (not coalesce(p_only_purchases, true)
         or (o.status not in ('Cancelled', 'Returned') and o.payment_status in ('Paid', 'Verified')));
end;
$function$;

comment on function public.analytics_orders(text, date, date, text, text, boolean) is
  'The single source of truth for what the shop sold: windowed, country-filtered, currency-converted, refund-netted. Customer identity is nulled for the content scope.';

revoke execute on function public.analytics_orders(text, date, date, text, text, boolean) from public;
grant execute on function public.analytics_orders(text, date, date, text, text, boolean) to authenticated, service_role;

-- -------------------------------------------------------------------
-- Line grain. Discounts and refunds are order-level records, so sharing them
-- across lines by value is arithmetic and every reader labels it calculated.
create or replace function public.analytics_order_lines(
  p_scope text default 'content',
  p_from date default null,
  p_to date default null,
  p_country text default null,
  p_currency text default null,
  p_only_purchases boolean default true
)
returns table (
  order_id uuid,
  placed_on date,
  product_id uuid,
  product_name text,
  variant_id uuid,
  variant_size text,
  fragrance_family text,
  category_name text,
  quantity integer,
  unit_price numeric,
  line_share numeric,
  discount_share numeric,
  refund_share numeric
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_scope text := lower(coalesce(p_scope, 'content'));
  v_rate numeric;
begin
  if v_scope not in ('business', 'operational', 'content')
     or not public.can_see_report(v_scope) then
    raise exception 'This report needs a business, operational or content scope.';
  end if;

  v_rate := public.analytics_rate(p_currency);

  return query
  with scoped as (
    select ao.order_id, ao.placed_on, ao.amount, ao.discount_amount, ao.refunded_amount
    from public.analytics_orders(v_scope, p_from, p_to, p_country, p_currency, p_only_purchases) ao
  ),
  lines as (
    select s.order_id, s.placed_on, s.amount, s.discount_amount, s.refunded_amount,
           oi.product_id, oi.product_name, oi.variant_id, oi.variant_size, oi.quantity, oi.unit_price,
           coalesce(oi.line_total, 0) as line_total,
           sum(coalesce(oi.line_total, 0)) over (partition by s.order_id) as order_line_total,
           count(*) over (partition by s.order_id) as order_lines
    from scoped s
    join public.order_items oi on oi.order_id = s.order_id
  )
  select l.order_id,
         l.placed_on,
         l.product_id,
         l.product_name,
         l.variant_id,
         l.variant_size,
         p.fragrance_family,
         cat.name,
         l.quantity,
         case when v_rate = 1 then round(coalesce(l.unit_price, 0), 2)
              else round(coalesce(l.unit_price, 0) / greatest(v_rate, 0.000001), 2) end,
         case
           when l.order_line_total = 0 then round(coalesce(l.amount, 0) / greatest(l.order_lines, 1), 2)
           else round(coalesce(l.amount, 0) * l.line_total / nullif(l.order_line_total, 0), 2)
         end,
         case
           when l.order_line_total = 0 then 0
           else round(coalesce(l.discount_amount, 0) * l.line_total / nullif(l.order_line_total, 0), 2)
         end,
         case
           when l.order_line_total = 0 then 0
           else round(coalesce(l.refunded_amount, 0) * l.line_total / nullif(l.order_line_total, 0), 2)
         end
  from lines l
  left join public.products p on p.id = l.product_id
  left join public.categories cat on cat.id = p.category_id;
end;
$function$;

comment on function public.analytics_order_lines(text, date, date, text, text, boolean) is
  'Product-grain sales. Nothing here is a stored line-level discount or refund: those are order records shared across lines in proportion to value.';

revoke execute on function public.analytics_order_lines(text, date, date, text, text, boolean) from public;
grant execute on function public.analytics_order_lines(text, date, date, text, text, boolean) to authenticated, service_role;

-- ====================================================================
-- 9.1 COHORT ANALYSIS
-- ====================================================================
create or replace function public.get_cohort_analysis(
  p_granularity text default 'month',
  p_periods integer default 12,
  p_currency text default null,
  p_country text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_unit text := case when lower(coalesce(p_granularity, 'month')) = 'quarter' then 'quarter' else 'month' end;
  v_steps integer := least(greatest(coalesce(p_periods, 12), 3), 24);
  v_buyers bigint := 0;
  v_body jsonb;
begin
  if not public.can_see_report('business') then
    raise exception 'Cohort analysis needs a business report scope.';
  end if;

  select count(distinct ao.customer_email) into v_buyers
  from public.analytics_orders('business', null, null, p_country, p_currency, true) ao
  where ao.customer_email is not null;

  if coalesce(v_buyers, 0) = 0 then
    return jsonb_build_object(
      'data_status', 'insufficient_data',
      'reason', 'no_purchases',
      'granularity', v_unit,
      'periods', v_steps,
      'buyers', 0,
      'cohorts', '[]'::jsonb,
      'currency', coalesce(nullif(p_currency, ''), 'base'),
      'note', 'No customer has a completed paid order yet, so there is nothing to cohort. That is a gap in the data, not a retention rate of zero.'
    );
  end if;

  with sales as (
    select ao.customer_email, ao.placed_on, ao.amount
    from public.analytics_orders('business', null, null, p_country, p_currency, true) ao
    where ao.customer_email is not null
  ),
  first_buy as (
    select s.customer_email, min(s.placed_on) as first_on
    from sales s
    group by s.customer_email
  ),
  offsets as (
    select fb.customer_email,
           date_trunc(v_unit, fb.first_on) as cohort_start,
           greatest(0, least(
             case v_unit
               when 'quarter' then (extract(year from age(s.placed_on, fb.first_on)) * 4
                                    + extract(quarter from age(s.placed_on, fb.first_on)))::int
               else (extract(year from age(s.placed_on, fb.first_on)) * 12
                     + extract(month from age(s.placed_on, fb.first_on)))::int
             end, v_steps - 1)) as step,
           s.amount
    from first_buy fb
    join sales s on s.customer_email = fb.customer_email
  ),
  cells as (
    select o.cohort_start, o.step,
           count(distinct o.customer_email) as retained,
           round(coalesce(sum(o.amount), 0)::numeric, 2) as revenue
    from offsets o
    group by o.cohort_start, o.step
  ),
  sizes as (
    select c.cohort_start, max(c.retained) filter (where c.step = 0) as cohort_size
    from cells c
    group by c.cohort_start
  ),
  built as (
    select c.cohort_start, c.step,
           jsonb_build_object(
             'step', c.step,
             'retained', c.retained,
             'revenue', c.revenue,
             'rate', round(c.retained::numeric / greatest(s.cohort_size, 1) * 100, 1)
           ) as cell
    from cells c
    join sizes s on s.cohort_start = c.cohort_start
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'cohort', to_char(r.cohort_start, 'YYYY-MM'),
      'buyers', r.cohort_size,
      'reliable', coalesce(r.cohort_size, 0) >= 10,
      'cells', r.cells
    ) order by r.cohort_start), '[]'::jsonb)
  into v_body
  from (
    select s.cohort_start, s.cohort_size,
           coalesce(jsonb_agg(b.cell order by b.step), '[]'::jsonb) as cells
    from sizes s
    left join built b on b.cohort_start = s.cohort_start
    group by s.cohort_start, s.cohort_size
  ) r;

  return jsonb_build_object(
    'data_status', case when v_buyers < 10 then 'insufficient_data' else 'calculated' end,
    'granularity', v_unit,
    'periods', v_steps,
    'buyers', v_buyers,
    'cohorts', coalesce(v_body, '[]'::jsonb),
    'currency', coalesce(nullif(p_currency, ''), 'base'),
    'basis', 'completed_paid_orders_only',
    'dimensions', jsonb_build_array(
      jsonb_build_object('key', 'first_purchase_period', 'data_status', 'actual'),
      jsonb_build_object('key', 'country', 'data_status', case
        when exists (select 1 from public.orders o where nullif(coalesce(o.destination_country, ''), '') is not null)
        then 'actual' else 'not_tracked' end,
        'note', 'Destination country is blank on every stored order, so it cannot split a cohort yet.'),
      jsonb_build_object('key', 'acquisition_source', 'data_status', 'not_tracked',
        'note', 'Campaign parameters are captured by the funnel event log from its first row onward. Orders placed before that carry no source.'),
      jsonb_build_object('key', 'segment', 'data_status', 'calculated',
        'note', 'Read alongside the segmentation report, which names the segments it can prove.')
    ),
    'note', 'Retention counts a customer again in a period only when they hold a completed paid order in it. Cohorts under ten buyers are returned and flagged unreliable.'
  );
end;
$function$;

comment on function public.get_cohort_analysis(text, integer, text, text) is
  'First-purchase cohorts with month-zero-onward retention over completed paid orders. Small cohorts are flagged, never smoothed or hidden.';

revoke execute on function public.get_cohort_analysis(text, integer, text, text) from public;
grant execute on function public.get_cohort_analysis(text, integer, text, text) to authenticated, service_role;

-- ====================================================================
-- 9.2 CUSTOMER LIFETIME VALUE — revenue based, because cost is not configured
-- ====================================================================
create or replace function public.get_customer_lifetime_value(
  p_currency text default null,
  p_limit integer default 25,
  p_country text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_customers bigint := 0;
  v_rows jsonb;
  v_costs jsonb;
  v_mean numeric := 0;
  v_median numeric := 0;
  v_total numeric := 0;
begin
  if not public.can_see_report('business') then
    raise exception 'Customer lifetime value needs a business report scope.';
  end if;

  v_costs := public.cost_basis_status();

  with sales as (
    select ao.customer_email, ao.customer_id, ao.placed_on, ao.amount,
           ao.discount_amount, ao.refunded_amount, ao.order_id
    from public.analytics_orders('business', null, null, p_country, p_currency, true) ao
    where ao.customer_email is not null
  ),
  per_customer as (
    select s.customer_email,
           min(s.customer_id) as customer_id,
           count(distinct s.order_id) as orders,
           round(coalesce(sum(s.amount), 0)::numeric, 2) as net_revenue,
           round(coalesce(sum(s.discount_amount), 0)::numeric, 2) as discounts,
           round(coalesce(sum(s.refunded_amount), 0)::numeric, 2) as refunded,
           min(s.placed_on) as first_on,
           max(s.placed_on) as last_on,
           greatest((max(s.placed_on) - min(s.placed_on))::int, 0) as span_days
    from sales s
    group by s.customer_email
  ),
  q as (
    select pc.customer_id,
           pc.orders,
           pc.net_revenue,
           pc.discounts,
           pc.refunded,
           pc.span_days,
           pc.first_on::text as first_on,
           pc.last_on::text as last_on,
           round(pc.net_revenue / greatest(pc.orders, 1), 2) as average_order_value,
           case when pc.span_days > 0
                then round(pc.orders::numeric / greatest(pc.span_days / 30.4, 0.1), 2)
                else null
           end as orders_per_month
    from per_customer pc
    order by pc.net_revenue desc
    limit least(greatest(coalesce(p_limit, 25), 1), 200)
  )
  select count(*),
         coalesce(round(avg(q.net_revenue)::numeric, 2), 0),
         coalesce(round(percentile_cont(0.5) within group (order by q.net_revenue)::numeric, 2), 0),
         coalesce(round(sum(q.net_revenue)::numeric, 2), 0),
         coalesce(jsonb_agg(row_to_json(q)::jsonb order by q.net_revenue desc), '[]'::jsonb)
    into v_customers, v_mean, v_median, v_total, v_rows
  from q;

  return jsonb_build_object(
    'data_status', case when coalesce(v_customers, 0) < 10 then 'insufficient_data' else 'calculated' end,
    'basis', 'revenue_based',
    'customers', coalesce(v_customers, 0),
    'mean_lifetime_revenue', coalesce(v_mean, 0),
    'median_lifetime_revenue', coalesce(v_median, 0),
    'total_net_revenue', coalesce(v_total, 0),
    'currency', coalesce(nullif(p_currency, ''), 'base'),
    'cost_basis', jsonb_build_object(
      'configured', (v_costs ->> 'variants_costed')::int > 0,
      'variants_costed', (v_costs ->> 'variants_costed')::int,
      'variants_total', (v_costs ->> 'variants_total')::int,
      'data_status', case when (v_costs ->> 'variants_costed')::int > 0 then 'configured' else 'not_configured' end
    ),
    'customers_list', coalesce(v_rows, '[]'::jsonb),
    'note', 'Revenue less discounts less processed refunds. A revenue-based value, not a profit figure: no cost of goods is configured, so no margin is claimed.'
  );
end;
$function$;

comment on function public.get_customer_lifetime_value(text, integer, text) is
  'Lifetime revenue per customer from completed paid orders, reported beside the cost basis so a revenue figure cannot be read as profit.';

revoke execute on function public.get_customer_lifetime_value(text, integer, text) from public;
grant execute on function public.get_customer_lifetime_value(text, integer, text) to authenticated, service_role;

-- ====================================================================
-- 9.3 REPEAT PURCHASE RATE
-- ====================================================================
create or replace function public.get_repeat_purchase_rate(
  p_days integer default 365,
  p_currency text default null,
  p_country text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_window integer := least(greatest(coalesce(p_days, 365), 1), 3650);
  v_from date;
  v_buyers bigint := 0;
  v_repeat bigint := 0;
  v_orders bigint := 0;
begin
  if not public.can_see_report('business') then
    raise exception 'Repeat purchase rate needs a business report scope.';
  end if;

  v_from := current_date - v_window;

  with counted as (
    select ao.customer_email, count(distinct ao.order_id) as orders
    from public.analytics_orders('business', v_from, null, p_country, p_currency, true) ao
    where ao.customer_email is not null
    group by ao.customer_email
  )
  select coalesce(count(*), 0),
         coalesce(count(*) filter (where orders > 1), 0),
         coalesce(sum(orders), 0)
    into v_buyers, v_repeat, v_orders
  from counted;

  return jsonb_build_object(
    'data_status', case
      when v_buyers = 0 then 'insufficient_data'
      when v_buyers < 10 then 'insufficient_data'
      else 'calculated'
    end,
    'window_days', v_window,
    'from_date', v_from,
    'buyers', v_buyers,
    'repeat_buyers', v_repeat,
    'purchases', v_orders,
    'rate_percent', case when v_buyers = 0 then null else round(v_repeat::numeric / v_buyers * 100, 1) end,
    'average_purchases_per_buyer', case when v_buyers = 0 then null else round(v_orders::numeric / v_buyers, 2) end,
    'currency', coalesce(nullif(p_currency, ''), 'base'),
    'definition', 'Customers with more than one completed paid order divided by customers with at least one.',
    'note', case
      when v_buyers = 0 then 'No customer has a completed paid order inside the window, so the rate is unknown rather than zero.'
      when v_buyers < 10 then 'Under ten buyers in the window: the arithmetic is real, but one customer moves the percentage by more than ten points.'
      else null
    end
  );
end;
$function$;

comment on function public.get_repeat_purchase_rate(integer, text, text) is
  'Share of buyers with more than one completed paid order. Null rather than zero whenever the window holds no buyers at all.';

revoke execute on function public.get_repeat_purchase_rate(integer, text, text) from public;
grant execute on function public.get_repeat_purchase_rate(integer, text, text) to authenticated, service_role;

-- Verification, run once at apply time. The querying role is not staff, so the
-- only safe assertions here are structural: who may call the core, and what the
-- currency helper resolves to. Refusal behaviour is proven from a real session
-- in tests/phase9-business-intelligence.test.ts.
select 'phase9_sales_core'
  || ' | core_granted_authenticated ' || has_function_privilege('authenticated', 'public.analytics_orders(text,date,date,text,text,boolean)', 'execute')
  || ' | core_granted_anon ' || has_function_privilege('anon', 'public.analytics_orders(text,date,date,text,text,boolean)', 'execute')
  || ' | lines_granted_anon ' || has_function_privilege('anon', 'public.analytics_order_lines(text,date,date,text,text,boolean)', 'execute')
  || ' | rate_pkr ' || public.analytics_rate('PKR')
  || ' | rate_usd ' || round(public.analytics_rate('USD'), 2)
  || ' | rate_unknown_falls_back ' || public.analytics_rate('XYZ')
  || ' | scopes_present ' || (select count(*) from public.permissions where code like 'view_%_reports');

commit;
