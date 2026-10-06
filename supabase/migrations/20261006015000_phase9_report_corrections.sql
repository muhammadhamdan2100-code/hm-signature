-- ====================================================================
-- Phase 9 corrections, found by calling every new report function through
-- PostgREST with real staff sessions rather than by reading the SQL.
--
--   * min(uuid) does not exist, so the customer lifetime value and customer
--     report could not resolve their aggregate over a customer id. The lowest
--     id is now taken through text, which does have an ordering.
--   * The coupon block in the attribution report nested count(*) and sum()
--     inside jsonb_agg(), which Postgres refuses outright:
--     "aggregate function calls cannot be nested". Both branches grouped into a
--     subselect first, the way every other list in Phase 9 already does.
--
-- Nothing else in the three bodies changed.
-- ====================================================================

begin;

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
           -- uuid has no min(); the text round trip keeps the choice stable.
           nullif(min(s.customer_id::text), '')::uuid as customer_id,
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

-- Coupon attribution is grouped in a subselect, so this is shared by both the
-- pre-capture branch and the measured branch of the report.
create or replace function public.coupon_purchase_attribution()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $function$
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'code', c.code,
      'purchases', c.purchases,
      'revenue', c.revenue,
      'discount_given', c.discount_given
    ) order by c.revenue desc),
    '[]'::jsonb
  )
  from (
    select o.coupon_code as code,
           count(*) as purchases,
           round(coalesce(sum(o.total), 0)::numeric, 2) as revenue,
           round(coalesce(sum(o.discount_amount), 0)::numeric, 2) as discount_given
    from public.orders o
    where nullif(coalesce(o.coupon_code, ''), '') is not null
      and o.status not in ('Cancelled', 'Returned')
      and o.payment_status in ('Paid', 'Verified')
    group by o.coupon_code
    order by round(coalesce(sum(o.total), 0)::numeric, 2) desc
    limit 50
  ) c;
$function$;

comment on function public.coupon_purchase_attribution() is
  'The only attribution channel this shop can prove from history: a coupon code typed at checkout. Every purchase carrying one is counted with its discount.';

revoke execute on function public.coupon_purchase_attribution() from public;
grant execute on function public.coupon_purchase_attribution() to authenticated, service_role;

create or replace function public.get_marketing_attribution(
  p_days integer default 90,
  p_model text default 'first_touch',
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
  v_window integer := least(greatest(coalesce(p_days, 90), 1), 730);
  v_from timestamptz := now() - make_interval(days => least(greatest(coalesce(p_days, 90), 1), 730));
  v_last boolean := lower(coalesce(p_model, 'first_touch')) = 'last_touch';
  v_capture_from timestamptz;
  v_rows jsonb;
  v_purchases bigint := 0;
  v_attributed bigint := 0;
begin
  if not public.can_see_report('business') then
    raise exception 'Marketing attribution needs a business report scope.';
  end if;

  select min(ae.occurred_at) into v_capture_from from public.analytics_events ae;

  if v_capture_from is null then
    return jsonb_build_object(
      'data_status', 'not_tracked',
      'model', case when v_last then 'last_touch' else 'first_touch' end,
      'window_days', v_window,
      'capture_started_at', null,
      'channels', '[]'::jsonb,
      'landing_pages', '[]'::jsonb,
      'referrers', '[]'::jsonb,
      'purchases_in_window', (
        select count(*) from public.analytics_orders('business', null, null, p_country, p_currency, true) ao
        where ao.placed_at >= v_from
      ),
      'attributed_purchases', 0,
      'coupon_attribution', public.coupon_purchase_attribution(),
      'note', 'No campaign parameters have been recorded yet. The attribution model and columns are in place; the numbers arrive with the first tracked visit, and nothing before it is estimated.'
    );
  end if;

  with touch as (
    select distinct on (ae.visitor_id)
           ae.visitor_id,
           coalesce(nullif(ae.utm_source, ''), '(direct)') as source,
           coalesce(nullif(ae.utm_medium, ''), '(none)') as medium,
           coalesce(nullif(ae.utm_campaign, ''), '(none)') as campaign,
           coalesce(nullif(ae.path, ''), '(unknown)') as landing_path,
           coalesce(nullif(ae.referrer_host, ''), '(none)') as referrer_host
    from public.analytics_events ae
    where ae.event = 'visit'
    order by ae.visitor_id,
             (case when v_last then -extract(epoch from ae.occurred_at)
                   else extract(epoch from ae.occurred_at) end)
  ),
  conversions as (
    select distinct ae.visitor_id, ao.order_id, ao.amount
    from public.analytics_events ae
    join public.analytics_orders('business', null, null, p_country, p_currency, true) ao
      on ao.order_id = ae.order_id
    where ae.event = 'order_completed'
      and ae.order_id is not null
      and ao.placed_at >= v_from
  ),
  grouped as (
    select t.source, t.medium, t.campaign,
           count(distinct t.visitor_id) as visitors,
           count(distinct c.order_id) as orders,
           round(coalesce(sum(c.amount), 0)::numeric, 2) as revenue
    from touch t
    left join conversions c on c.visitor_id = t.visitor_id
    group by t.source, t.medium, t.campaign
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'source', g.source,
      'medium', g.medium,
      'campaign', g.campaign,
      'visitors', g.visitors,
      'orders', g.orders,
      'revenue', g.revenue,
      'data_status', 'actual'
    ) order by g.revenue desc, g.visitors desc), '[]'::jsonb)
  into v_rows
  from grouped g;

  select count(distinct ao.order_id), count(distinct c.order_id)
    into v_purchases, v_attributed
  from public.analytics_orders('business', null, null, p_country, p_currency, true) ao
  left join (
    select distinct ae.order_id from public.analytics_events ae
    where ae.event = 'order_completed' and ae.order_id is not null
  ) c on c.order_id = ao.order_id
  where ao.placed_at >= v_from;

  return jsonb_build_object(
    'data_status', case when coalesce(v_attributed, 0) = 0 then 'insufficient_data' else 'calculated' end,
    'model', case when v_last then 'last_touch' else 'first_touch' end,
    'window_days', v_window,
    'capture_started_at', v_capture_from,
    'currency', coalesce(nullif(p_currency, ''), 'base'),
    'channels', coalesce(v_rows, '[]'::jsonb),
    'landing_pages', (
      select coalesce(jsonb_agg(jsonb_build_object('path', t.path, 'visits', t.visits) order by t.visits desc), '[]'::jsonb)
      from (
        select ae.path, count(distinct ae.session_id) as visits
        from public.analytics_events ae
        where ae.event = 'visit' and ae.path is not null and ae.occurred_at >= v_from
        group by ae.path
        order by count(distinct ae.session_id) desc
        limit 12
      ) t
    ),
    'referrers', (
      select coalesce(jsonb_agg(jsonb_build_object('host', r.host, 'visits', r.visits) order by r.visits desc), '[]'::jsonb)
      from (
        select coalesce(nullif(ae.referrer_host, ''), '(direct)') as host,
               count(distinct ae.session_id) as visits
        from public.analytics_events ae
        where ae.event = 'visit' and ae.occurred_at >= v_from
        group by 1
        order by 2 desc
        limit 12
      ) r
    ),
    'purchases_in_window', coalesce(v_purchases, 0),
    'attributed_purchases', coalesce(v_attributed, 0),
    'coverage_percent', case
      when coalesce(v_purchases, 0) = 0 then null
      else round(coalesce(v_attributed, 0)::numeric / v_purchases * 100, 1)
    end,
    'campaign_records', (
      select coalesce(jsonb_agg(jsonb_build_object(
          'name', c.name, 'type', c.type, 'status', c.status,
          'sent', c.sent_count, 'data_status', 'actual', 'engagement_status', 'not_tracked'
        ) order by c.created_at desc), '[]'::jsonb)
      from (
        select mc.name, mc.type, mc.status, mc.sent_count, mc.created_at
        from public.marketing_campaigns mc
        where mc.created_at >= v_from
        order by mc.created_at desc
        limit 20
      ) c
    ),
    'coupon_attribution', public.coupon_purchase_attribution(),
    'note', 'First touch and last touch are read from the visit log; revenue follows the same completed paid order rule as every other Phase 9 report. attributed_purchases is the honest coverage: an order placed without a tracked session cannot be attributed to anything.'
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
           nullif(min(ao.customer_id::text), '')::uuid as customer_id,
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
    'data_status', case when coalesce(v_count, 0) = 0 then 'insufficient_data' else 'actual' end,
    'note', 'Identity is the address on the order row, which links orders placed before an account existed. Only purchases count toward gross and net.'
  );
end;
$function$;

-- Verification, run once at apply time: the two shapes that failed are now
-- resolvable, proven here over the raw tables the functions read.
select 'phase9_corrections'
  || ' | uuid_min_via_text ' || coalesce((select nullif(min(o.customer_id::text), '')::uuid is null from public.orders o), true)
  || ' | coupon_rows ' || jsonb_array_length(public.coupon_purchase_attribution())
  || ' | helpers ' || (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace
                       and p.proname in ('coupon_purchase_attribution'))
  || ' | orders_total ' || (select count(*) from public.orders);

commit;
