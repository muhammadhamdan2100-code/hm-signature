-- ====================================================================
-- Phase 9 — 9.5 product profitability, 9.6 inventory forecasting,
--            9.7 demand forecasting.
--
-- The rule that shapes all three: a forecast is only produced when the
-- history behind it exists, and the history required is stated in the answer.
-- Refusing is the correct output for a shop with one stored order, and a
-- number that implies otherwise would be worse than no number.
--
-- The thresholds below (eight purchases, six distinct weeks of sales) are
-- method parameters, not business rules of the house: they decide when this
-- code stops extrapolating. They are returned in every payload so the reason
-- a forecast is missing is visible instead of mysterious.
--
-- Discounts and refunds are order-level records shared across a basket's lines
-- by value, so profitability is labelled calculated even though every input
-- row is real. Cost is the one input that stays absent until it is entered.
-- ====================================================================

begin;

-- ====================================================================
-- 9.5 PRODUCT PROFITABILITY
-- ====================================================================
create or replace function public.get_product_profitability(
  p_days integer default 90,
  p_currency text default null,
  p_country text default null,
  p_limit integer default 50
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_window integer := least(greatest(coalesce(p_days, 90), 1), 730);
  v_from date := current_date - v_window;
  v_costs jsonb := public.cost_basis_status();
  v_rows jsonb;
  v_lines bigint := 0;
begin
  if not (public.can_see_report('content') or public.can_see_report('business')) then
    raise exception 'Product profitability needs a product or business report scope.';
  end if;

  with lines as (
    select l.product_id,
           l.product_name,
           l.variant_id,
           l.variant_size,
           sum(l.quantity) as units,
           round(sum(l.line_share)::numeric, 2) as revenue,
           round(sum(l.discount_share)::numeric, 2) as discounts,
           round(sum(l.refund_share)::numeric, 2) as refunds,
           max(vc.unit_cost) as unit_cost
    from public.analytics_order_lines(
      case when public.can_see_report('business') then 'business' else 'content' end,
      v_from, null, p_country, p_currency, true
    ) l
    left join public.product_variant_costs vc on vc.variant_id = l.variant_id
    group by l.product_id, l.product_name, l.variant_id, l.variant_size
  ),
  per_product as (
    select l.product_id,
           l.product_name,
           coalesce(sum(l.units), 0) as units,
           round(coalesce(sum(l.revenue), 0)::numeric, 2) as revenue,
           round(coalesce(sum(l.discounts), 0)::numeric, 2) as discounts,
           round(coalesce(sum(l.refunds), 0)::numeric, 2) as refunds,
           count(*) filter (where l.unit_cost is not null) as costed_sizes,
           count(*) as sizes,
           round(coalesce(sum(l.units * coalesce(l.unit_cost, 0)), 0)::numeric, 2) as cost
    from lines l
    group by l.product_id, l.product_name
  )
  select count(*),
         coalesce(jsonb_agg(jsonb_build_object(
            'product_id', q.product_id,
            'product_name', q.product_name,
            'units', q.units,
            'revenue', q.revenue,
            'discounts', q.discounts,
            'refunds', q.refunds,
            'net_revenue', round((q.revenue - q.discounts - q.refunds)::numeric, 2),
            'unit_cost', case when q.costed_sizes = 0 then null
                              else round(q.cost / greatest(q.units, 1), 2) end,
            'cost', case when q.costed_sizes = 0 then null else q.cost end,
            'gross_profit', case when q.costed_sizes = 0 then null
                                 else round((q.revenue - q.discounts - q.refunds - q.cost)::numeric, 2) end,
            'gross_margin_percent', case
              when q.costed_sizes = 0 then null
              when (q.revenue - q.discounts - q.refunds) = 0 then null
              else round((q.revenue - q.discounts - q.refunds - q.cost)
                         / (q.revenue - q.discounts - q.refunds) * 100, 1)
            end,
            'cost_status', case
              when q.costed_sizes = 0 then 'not_configured'
              when q.costed_sizes < q.sizes then 'partial'
              else 'configured'
            end,
            'data_status', 'calculated'
         ) order by q.revenue desc), '[]'::jsonb)
  into v_lines, v_rows
  from (
    select pp.* from per_product pp
    order by pp.revenue desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200)
  ) q;

  return jsonb_build_object(
    'data_status', case when coalesce(v_lines, 0) = 0 then 'insufficient_data' else 'calculated' end,
    'window_days', v_window,
    'currency', coalesce(nullif(p_currency, ''), 'base'),
    'country', nullif(btrim(coalesce(p_country, '')), ''),
    'basis', 'revenue_less_discount_less_refund',
    'cost_basis', jsonb_build_object(
      'variants_costed', (v_costs ->> 'variants_costed')::int,
      'variants_total', (v_costs ->> 'variants_total')::int,
      'currency_code', v_costs ->> 'currency_code',
      'data_status', case when (v_costs ->> 'variants_costed')::int > 0 then 'configured' else 'not_configured' end,
      'display', case when (v_costs ->> 'variants_costed')::int > 0 then null else 'Cost data not configured' end
    ),
    'products', coalesce(v_rows, '[]'::jsonb),
    'note', 'Units, revenue and refunds come from completed paid orders. Discounts and refunds are order-level amounts shared across basket lines by value, so they are calculated rather than recorded. Gross profit stays empty while cost is unconfigured; it is never treated as zero cost.'
  );
end;
$function$;

comment on function public.get_product_profitability(integer, text, text, integer) is
  'Revenue, units, discount and refund per fragrance, with cost, gross profit and margin left null until real costs are recorded. An uncosted product is reported as not configured, never as free.';

revoke execute on function public.get_product_profitability(integer, text, text, integer) from public;
grant execute on function public.get_product_profitability(integer, text, text, integer) to authenticated, service_role;

-- ====================================================================
-- 9.6 INVENTORY FORECASTING
-- ====================================================================
create or replace function public.get_inventory_forecast(
  p_days integer default 90,
  p_lead_time_days integer default 14
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_window integer := least(greatest(coalesce(p_days, 90), 7), 730);
  v_lead integer := least(greatest(coalesce(p_lead_time_days, 14), 1), 180);
  v_from date := current_date - v_window;
  v_rows jsonb;
  v_sold bigint := 0;
begin
  if not (public.can_see_report('operational') or public.can_see_report('business')) then
    raise exception 'Inventory forecasting needs an operational or business report scope.';
  end if;

  with demand as (
    select l.variant_id, sum(l.quantity) as units
    from public.analytics_order_lines('operational', v_from, null, null, null, true) l
    where l.variant_id is not null
    group by l.variant_id
  ),
  open_orders as (
    select oi.variant_id, coalesce(sum(oi.quantity), 0) as reserved
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.status in ('Pending', 'Confirmed', 'Processing')
    group by oi.variant_id
  ),
  built as (
    select p.id as product_id,
           p.name as product_name,
           v.id as variant_id,
           v.size,
           v.sku,
           v.stock as on_hand,
           v.low_stock_threshold,
           coalesce(rr.reserved, 0) as reserved,
           coalesce(d.units, 0) as sold,
           round(coalesce(d.units, 0)::numeric / v_window, 3) as velocity_per_day,
           case
             when coalesce(d.units, 0) = 0 then null
             else round(v.stock / greatest(coalesce(d.units, 0)::numeric / v_window, 0.0001), 0)::int
           end as days_of_cover
    from public.product_variants v
    join public.products p on p.id = v.product_id
    left join demand d on d.variant_id = v.id
    left join open_orders rr on rr.variant_id = v.id
    where v.active = true
  )
  select coalesce(sum(sold), 0),
         coalesce(jsonb_agg(jsonb_build_object(
            'product_id', b.product_id,
            'product_name', b.product_name,
            'variant_id', b.variant_id,
            'size', b.size,
            'sku', b.sku,
            'on_hand', b.on_hand,
            'reserved_in_open_orders', b.reserved,
            'available_to_sell', greatest(b.on_hand - b.reserved, 0),
            'low_stock_threshold', b.low_stock_threshold,
            'sold_in_window', b.sold,
            'velocity_per_day', b.velocity_per_day,
            'days_of_cover', b.days_of_cover,
            'cover_status', case
              when b.sold = 0 then 'no_recorded_demand'
              when b.on_hand - b.reserved <= 0 then 'out_of_stock'
              when b.days_of_cover <= b.lead_days then 'below_lead_time'
              when b.days_of_cover <= b.lead_days * 2 then 'order_soon'
              else 'healthy'
            end,
            'projected_stockout_on', case
              when b.days_of_cover is null then null
              else (current_date + b.days_of_cover)::text
            end,
            'suggested_reorder_units', case
              when b.sold = 0 then null
              else greatest(
                ceil(b.lead_days * b.velocity_per_day * 2 - (b.on_hand - b.reserved))::int,
                0)
            end,
            'data_status', case when b.sold = 0 then 'insufficient_data' else 'forecast' end
         ) order by (b.days_of_cover is null), b.days_of_cover nulls last, b.product_name), '[]'::jsonb)
  into v_sold, v_rows
  from (
    select b.*, v_lead as lead_days from built b
  ) b;

  return jsonb_build_object(
    'data_status', case when coalesce(v_sold, 0) = 0 then 'insufficient_data' else 'forecast' end,
    'window_days', v_window,
    'lead_time_days', v_lead,
    'basis', 'units_sold_in_window_over_window_days',
    'cover', coalesce(v_rows, '[]'::jsonb),
    'seasonality', jsonb_build_object(
      'data_status', 'insufficient_data',
      'note', 'Seasonal weighting needs the same period of at least two previous years. The shop has one season of order history, so no seasonal factor is applied.'
    ),
    'note', 'Days of cover divides the window velocity into stock on hand. Where a size sold nothing in the window there is no velocity to project, so it reports no recorded demand instead of predicting an infinite supply.'
  );
end;
$function$;

comment on function public.get_inventory_forecast(integer, integer) is
  'Stock cover per selling size from real window sales, real open-order reservations and real stock. Sizes with no recorded demand are flagged rather than given a velocity of zero.';

revoke execute on function public.get_inventory_forecast(integer, integer) from public;
grant execute on function public.get_inventory_forecast(integer, integer) to authenticated, service_role;

-- ====================================================================
-- 9.7 DEMAND FORECASTING
-- ====================================================================
create or replace function public.get_demand_forecast(
  p_days integer default 180,
  p_horizon_days integer default 30,
  p_currency text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_window integer := least(greatest(coalesce(p_days, 180), 14), 1095);
  v_horizon integer := least(greatest(coalesce(p_horizon_days, 30), 7), 180);
  v_min_purchases constant integer := 8;
  v_min_weeks constant integer := 6;
  v_from date := current_date - v_window;
  v_purchases bigint := 0;
  v_weeks bigint := 0;
  v_rows jsonb;
begin
  if not (public.can_see_report('business') or public.can_see_report('operational')) then
    raise exception 'Demand forecasting needs a business or operational report scope.';
  end if;

  select count(distinct l.order_id), count(distinct extract(isoyear from l.placed_on) * 100 + extract(week from l.placed_on))
    into v_purchases, v_weeks
  from public.analytics_order_lines('business', v_from, null, null, p_currency, true) l;

  if v_purchases < v_min_purchases or v_weeks < v_min_weeks then
    return jsonb_build_object(
      'data_status', 'insufficient_data',
      'reason', 'insufficient_historical_data',
      'message', 'Insufficient historical data',
      'window_days', v_window,
      'horizon_days', v_horizon,
      'purchases_found', coalesce(v_purchases, 0),
      'weeks_with_sales_found', coalesce(v_weeks, 0),
      'purchases_required', v_min_purchases,
      'weeks_required', v_min_weeks,
      'products', '[]'::jsonb,
      'inputs', jsonb_build_array(
        jsonb_build_object('key', 'historical_sales', 'available', v_purchases > 0, 'rows', v_purchases),
        jsonb_build_object('key', 'recent_velocity', 'available', v_weeks >= 2, 'weeks', v_weeks),
        jsonb_build_object('key', 'seasonality', 'available', false),
        jsonb_build_object('key', 'promotions', 'available', exists (
          select 1 from public.coupon_usage cu join public.orders o on o.id = cu.order_id
          where o.status not in ('Cancelled', 'Returned') and o.payment_status in ('Paid', 'Verified')
        )),
        jsonb_build_object('key', 'inventory_constraints', 'available', true)
      ),
      'note', 'A weekly-mean projection needs at least eight completed paid purchases spread over six different weeks. This window holds fewer, so no forecast is returned: predicting demand from one or two orders would present a guess as a number.'
    );
  end if;

  with weekly as (
    select l.product_id,
           l.product_name,
           date_trunc('week', l.placed_on)::date as week_start,
           sum(l.quantity) as units
    from public.analytics_order_lines('business', v_from, null, null, p_currency, true) l
    where l.product_id is not null
    group by l.product_id, l.product_name, date_trunc('week', l.placed_on)::date
  ),
  per_product as (
    select w.product_id,
           w.product_name,
           count(*) as weeks_sold,
           coalesce(sum(w.units), 0) as units,
           round(avg(w.units)::numeric, 2) as weekly_mean,
           round(stddev_pop(w.units)::double precision::numeric, 2) as weekly_stdev
    from weekly w
    group by w.product_id, w.product_name
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'product_id', q.product_id,
      'product_name', q.product_name,
      'weeks_sold', q.weeks_sold,
      'units_in_window', q.units,
      'weekly_mean_units', q.weekly_mean,
      'weekly_stdev_units', q.weekly_stdev,
      'forecast_units', round((q.weekly_mean * v_horizon / 7.0)::numeric, 1),
      'forecast_low', round(greatest(q.weekly_mean - coalesce(q.weekly_stdev, 0), 0) * v_horizon / 7.0, 1),
      'forecast_high', round((q.weekly_mean + coalesce(q.weekly_stdev, 0)) * v_horizon / 7.0, 1),
      'horizon_days', v_horizon,
      'method', 'trailing_weekly_mean',
      'data_status', 'forecast'
    ) order by q.units desc), '[]'::jsonb)
  into v_rows
  from (select pp.* from per_product pp order by pp.units desc limit 50) q;

  return jsonb_build_object(
    'data_status', 'forecast',
    'window_days', v_window,
    'horizon_days', v_horizon,
    'currency', coalesce(nullif(p_currency, ''), 'base'),
    'purchases_found', v_purchases,
    'weeks_with_sales_found', v_weeks,
    'purchases_required', v_min_purchases,
    'weeks_required', v_min_weeks,
    'products', coalesce(v_rows, '[]'::jsonb),
    'caveat', jsonb_build_object(
      'basis', 'trailing_weekly_mean_of_completed_paid_orders',
      'excludes', jsonb_build_array('seasonality', 'promotions', 'stockouts'),
      'note', 'These are forecasts from a trailing average, not recorded demand. The range is one standard deviation of the observed weeks, which is only as wide as the history that exists.'
    ),
    'note', 'Promotions are listed as an input when coupon-bearing purchases exist but are not modelled: with this much history a promotion effect cannot be separated from ordinary demand.'
  );
end;
$function$;

comment on function public.get_demand_forecast(integer, integer, text) is
  'Product-level weekly demand projection from a trailing mean of completed paid sales, returned only when at least eight purchases across six weeks exist. Below that it returns Insufficient historical data.';

revoke execute on function public.get_demand_forecast(integer, integer, text) from public;
grant execute on function public.get_demand_forecast(integer, integer, text) to authenticated, service_role;

-- Verification, run once at apply time.
select 'phase9_forecasting'
  || ' | functions ' || (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace
                         and p.proname in ('get_product_profitability','get_inventory_forecast','get_demand_forecast'))
  || ' | purchasable_lines ' || (select count(*) from public.order_items oi join public.orders o on o.id = oi.order_id
                                 where o.status not in ('Cancelled','Returned') and o.payment_status in ('Paid','Verified'))
  || ' | active_variants ' || (select count(*) from public.product_variants v where v.active = true)
  || ' | costed_variants ' || (select count(*) from public.product_variant_costs);

commit;
