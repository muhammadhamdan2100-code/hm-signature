-- ====================================================================
-- Phase 9 — 9.4 conversion funnel and 9.8 marketing attribution.
--
-- Both read the event log created in the previous migration, and both are
-- written to be unable to lie:
--
--   * A stage that has never been captured reports null sessions, not zero. A
--     zero would say "nobody reached this step"; a null says "we were not
--     measuring", which is the truth for every stage before this deployment.
--   * A step percentage is only computed when the stage in front of it is also
--     measured, so a funnel cannot silently divide by a number nobody counted.
--   * Revenue attribution runs through analytics_orders(), so an attributed
--     sale is a completed paid order and nothing else, and the report publishes
--     how many purchases it could NOT attribute alongside the ones it could.
--
-- The stored business tables still answer what they genuinely record:
-- product_views, settled payments and live orders are counted as records
-- present, labelled by their source, never blended into session counts.
-- ====================================================================

begin;

create or replace function public.get_conversion_funnel(
  p_days integer default 90,
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
  v_capture_from timestamptz;
  v_first_event timestamptz;
  v_rows jsonb;
  v_sessions bigint := 0;
  v_purchases bigint := 0;
begin
  if not public.can_see_report('business') then
    raise exception 'The conversion funnel needs a business report scope.';
  end if;

  select min(ae.occurred_at) into v_capture_from from public.analytics_events ae;

  with stage_meta(key, seq, stored_source) as (
    values
      ('visit', 1, null::text),
      ('product_view', 2, 'product_views'),
      ('add_to_cart', 3, null),
      ('begin_checkout', 4, null),
      ('payment_started', 5, 'payments'),
      ('payment_completed', 6, 'payments'),
      ('order_completed', 7, 'orders')
  ),
  captured as (
    select ae.event as key,
           count(distinct ae.session_id) as sessions,
           count(*) as hits,
           min(ae.occurred_at) as first_ever
    from public.analytics_events ae
    where ae.occurred_at >= v_from
      and (nullif(btrim(coalesce(p_country, '')), '') is null
           or upper(coalesce(ae.country_code, '')) = upper(btrim(p_country)))
    group by ae.event
  ),
  ever as (
    select ae.event as key, min(ae.occurred_at) as first_ever
    from public.analytics_events ae
    group by ae.event
  ),
  stored as (
    select 'product_view'::text as key, count(*) as records
      from public.product_views pv where pv.viewed_at >= v_from
    union all
    select 'payment_started', count(*)
      from public.payments p where p.created_at >= v_from
    union all
    select 'payment_completed', count(*)
      from public.payments p where p.created_at >= v_from and p.status in ('Paid', 'Verified')
    union all
    select 'order_completed', count(*)
      from public.orders o where o.created_at >= v_from
        and o.status not in ('Cancelled', 'Returned')
        and o.payment_status in ('Paid', 'Verified')
        and (nullif(btrim(coalesce(p_country, '')), '') is null
             or upper(coalesce(o.destination_country, '')) = upper(btrim(p_country)))
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'key', m.key,
      'seq', m.seq,
      'sessions', case when c.sessions is null then null else c.sessions end,
      'event_hits', coalesce(c.hits, 0),
      'measured_from', e.first_ever,
      'stored_source', m.stored_source,
      -- A stored record set that carries no country column cannot answer a
      -- country-filtered question, so it reports nothing rather than a total
      -- that looks filtered and is not.
      'stored_records', case
        when m.stored_source is null then null
        when nullif(btrim(coalesce(p_country, '')), '') is not null and m.key <> 'order_completed' then null
        else coalesce(s.records, 0)
      end,
      'data_status', case
        when c.sessions is not null then 'actual'
        when e.first_ever is not null then 'actual'
        when m.stored_source is null then 'not_tracked'
        when coalesce(s.records, 0) > 0 then 'actual'
        else 'not_tracked'
      end
    ) order by m.seq), '[]'::jsonb)
  into v_rows
  from stage_meta m
  left join captured c on c.key = m.key
  left join ever e on e.key = m.key
  left join stored s on s.key = m.key;

  select coalesce(sum(((stage ->> 'sessions')::bigint)), 0) into v_sessions
  from jsonb_array_elements(coalesce(v_rows, '[]'::jsonb)) stage
  where stage ->> 'key' = 'visit' and (stage ->> 'sessions') <> 'null';

  select count(*) into v_purchases
  from public.analytics_orders('business', null, null, p_country, null, true) ao
  where ao.placed_at >= v_from;

  return jsonb_build_object(
    'data_status', case
      when v_capture_from is null then 'not_tracked'
      when coalesce(v_sessions, 0) = 0 then 'insufficient_data'
      else 'calculated'
    end,
    'window_days', v_window,
    'from_at', v_from,
    'capture_started_at', v_capture_from,
    'country', nullif(btrim(coalesce(p_country, '')), ''),
    'stages', coalesce(v_rows, '[]'::jsonb),
    'purchases_in_window', coalesce(v_purchases, 0),
    'visit_to_purchase_percent', case
      when coalesce(v_sessions, 0) = 0 then null
      else round(coalesce(v_purchases, 0)::numeric / v_sessions * 100, 2)
    end,
    'note', 'Sessions are only counted from the moment the storefront began recording them, shown as capture_started_at. Everything before that date is unmeasured rather than empty, and no stage above reports a rate against a stage that was never recorded.'
  );
end;
$function$;

comment on function public.get_conversion_funnel(integer, text) is
  'Visit to Order Completed over the recorded event log. Unmeasured stages report null sessions and no step rate, so a funnel cannot imply that traffic existed and failed.';

revoke execute on function public.get_conversion_funnel(integer, text) from public;
grant execute on function public.get_conversion_funnel(integer, text) to authenticated, service_role;

-- ====================================================================
-- 9.8 MARKETING ATTRIBUTION
-- ====================================================================
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
      'coupon_attribution', (
        select coalesce(jsonb_agg(jsonb_build_object(
            'code', o.coupon_code,
            'purchases', count(*),
            'revenue', round(coalesce(sum(o.total), 0)::numeric, 2)
          ) order by count(*) desc), '[]'::jsonb)
        from public.orders o
        where nullif(coalesce(o.coupon_code, ''), '') is not null
          and o.status not in ('Cancelled', 'Returned')
          and o.payment_status in ('Paid', 'Verified')
      ),
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
           coalesce(nullif(ae.referrer_host, ''), '(none)') as referrer_host,
           ae.occurred_at as touched_at
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

  select count(distinct ao.order_id),
         count(distinct c.order_id)
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
      select coalesce(jsonb_agg(jsonb_build_object(
          'path', t.path,
          'visits', t.visits
        ) order by t.visits desc), '[]'::jsonb)
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
      select coalesce(jsonb_agg(jsonb_build_object(
          'host', r.host,
          'visits', r.visits
        ) order by r.visits desc), '[]'::jsonb)
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
          'name', c.name,
          'type', c.type,
          'status', c.status,
          'sent', c.sent_count,
          'data_status', 'actual',
          'engagement_status', 'not_tracked'
        ) order by c.created_at desc), '[]'::jsonb)
      from (
        select mc.name, mc.type, mc.status, mc.sent_count, mc.created_at
        from public.marketing_campaigns mc
        where mc.created_at >= v_from
        order by mc.created_at desc
        limit 20
      ) c
    ),
    'coupon_attribution', (
      select coalesce(jsonb_agg(jsonb_build_object(
          'code', o.coupon_code,
          'purchases', count(*),
          'revenue', round(coalesce(sum(o.total), 0)::numeric, 2)
        ) order by count(*) desc), '[]'::jsonb)
      from public.orders o
      where nullif(coalesce(o.coupon_code, ''), '') is not null
        and o.status not in ('Cancelled', 'Returned')
        and o.payment_status in ('Paid', 'Verified')
      group by o.coupon_code
    ),
    'note', 'First touch and last touch are read from the visit log; revenue follows the same completed paid order rule as every other Phase 9 report. attributed_purchases is the honest coverage: an order placed without a tracked session cannot be attributed to anything.'
  );
end;
$function$;

comment on function public.get_marketing_attribution(integer, text, text, text) is
  'Campaign attribution by UTM parameters with first or last touch, plus the share of purchases the log could not attribute. Nothing before the first recorded visit is estimated.';

revoke execute on function public.get_marketing_attribution(integer, text, text, text) from public;
grant execute on function public.get_marketing_attribution(integer, text, text, text) to authenticated, service_role;

-- Verification, run once at apply time.
select 'phase9_funnel_attribution'
  || ' | funnel_exists ' || to_regprocedure('public.get_conversion_funnel(integer,text)') is not null
  || ' | attribution_exists ' || to_regprocedure('public.get_marketing_attribution(integer,text,text,text)') is not null
  || ' | events_rows ' || (select count(*) from public.analytics_events)
  || ' | product_views_rows ' || (select count(*) from public.product_views)
  || ' | paid_purchases ' || (select count(*) from public.orders o where o.status not in ('Cancelled','Returned') and o.payment_status in ('Paid','Verified'));

commit;
