-- ============================================================================
-- PHASE 9 CORRECTION 3 — the report windows are not readable by an anonymous
-- visitor, at the grant layer as well as inside the function body.
--
-- Why: Supabase's default privileges give EXECUTE on every new function to anon,
-- authenticated and service_role, and `revoke ... from public` does not remove the
-- anon grant. So all twenty-three Phase 9 functions were still reachable with the
-- publishable key alone, protected only by the can_see_report() guard inside each
-- body. That guard does refuse an anonymous caller, because auth.uid() is null and
-- no report scope exists without a profile — but one boundary is not a boundary,
-- and the acceptance criterion for this phase says no anon access where it should
-- not exist. This migration makes the grant say what the body already says.
--
-- Nothing here removes access the application uses: the storefront never calls a
-- reporting function, every staff request carries a user JWT, and the one function
-- that genuinely is public — record_analytics_event, which measures a signed-out
-- visit — keeps its anon grant and states why in its own comment.
--
-- Every signature below is the function's identity as read from pg_proc, not an
-- assumption, so a missing parameter list cannot silently leave one behind.
--
-- Rollback: grant execute ... to anon for each function revoked here.
-- ============================================================================

-- 1. The shared read core and the scope test.
revoke execute on function public.can_see_report(p_kind text) from anon, public;
revoke execute on function public.analytics_orders(p_scope text, p_from date, p_to date, p_country text, p_currency text, p_only_purchases boolean) from anon, public;
revoke execute on function public.analytics_order_lines(p_scope text, p_from date, p_to date, p_country text, p_currency text, p_only_purchases boolean) from anon, public;
revoke execute on function public.analytics_rate(p_currency text) from anon, public;
revoke execute on function public.clean_campaign_value(p_raw text, p_max integer) from anon, public;

-- 2. The intelligence windows.
revoke execute on function public.get_cohort_analysis(p_granularity text, p_periods integer, p_currency text, p_country text) from anon, public;
revoke execute on function public.get_customer_lifetime_value(p_currency text, p_limit integer, p_country text) from anon, public;
revoke execute on function public.get_repeat_purchase_rate(p_days integer, p_currency text, p_country text) from anon, public;
revoke execute on function public.get_conversion_funnel(p_days integer, p_country text) from anon, public;
revoke execute on function public.get_marketing_attribution(p_days integer, p_model text, p_currency text, p_country text) from anon, public;
revoke execute on function public.get_product_profitability(p_days integer, p_currency text, p_country text, p_limit integer) from anon, public;
revoke execute on function public.get_inventory_forecast(p_days integer, p_lead_time_days integer) from anon, public;
revoke execute on function public.get_demand_forecast(p_days integer, p_horizon_days integer, p_currency text) from anon, public;
revoke execute on function public.get_phase9_segments(p_currency text) from anon, public;
revoke execute on function public.cost_basis_status() from anon, public;
revoke execute on function public.save_variant_cost(p_variant_id uuid, p_unit_cost numeric, p_note text) from anon, public;

-- 3. The report sections and the dispatcher in front of them.
revoke execute on function public.report_sales(p_from date, p_to date, p_country text, p_currency text) from anon, public;
revoke execute on function public.report_customers(p_from date, p_to date, p_country text, p_currency text) from anon, public;
revoke execute on function public.report_products(p_from date, p_to date, p_country text, p_currency text) from anon, public;
revoke execute on function public.report_payments(p_from date, p_to date, p_country text, p_currency text) from anon, public;
revoke execute on function public.report_inventory(p_from date, p_to date, p_country text, p_currency text) from anon, public;
revoke execute on function public.get_admin_report(p_section text, p_from date, p_to date, p_country text, p_currency text) from anon, public;

-- 4. State what the signed-in roles hold explicitly rather than by default.
grant execute on function public.can_see_report(p_kind text) to authenticated, service_role;
grant execute on function public.analytics_orders(p_scope text, p_from date, p_to date, p_country text, p_currency text, p_only_purchases boolean) to authenticated, service_role;
grant execute on function public.analytics_order_lines(p_scope text, p_from date, p_to date, p_country text, p_currency text, p_only_purchases boolean) to authenticated, service_role;
grant execute on function public.analytics_rate(p_currency text) to authenticated, service_role;
grant execute on function public.clean_campaign_value(p_raw text, p_max integer) to authenticated, service_role;
grant execute on function public.get_cohort_analysis(p_granularity text, p_periods integer, p_currency text, p_country text) to authenticated, service_role;
grant execute on function public.get_customer_lifetime_value(p_currency text, p_limit integer, p_country text) to authenticated, service_role;
grant execute on function public.get_repeat_purchase_rate(p_days integer, p_currency text, p_country text) to authenticated, service_role;
grant execute on function public.get_conversion_funnel(p_days integer, p_country text) to authenticated, service_role;
grant execute on function public.get_marketing_attribution(p_days integer, p_model text, p_currency text, p_country text) to authenticated, service_role;
grant execute on function public.get_product_profitability(p_days integer, p_currency text, p_country text, p_limit integer) to authenticated, service_role;
grant execute on function public.get_inventory_forecast(p_days integer, p_lead_time_days integer) to authenticated, service_role;
grant execute on function public.get_demand_forecast(p_days integer, p_horizon_days integer, p_currency text) to authenticated, service_role;
grant execute on function public.get_phase9_segments(p_currency text) to authenticated, service_role;
grant execute on function public.cost_basis_status() to authenticated, service_role;
grant execute on function public.save_variant_cost(p_variant_id uuid, p_unit_cost numeric, p_note text) to authenticated, service_role;
grant execute on function public.report_sales(p_from date, p_to date, p_country text, p_currency text) to authenticated, service_role;
grant execute on function public.report_customers(p_from date, p_to date, p_country text, p_currency text) to authenticated, service_role;
grant execute on function public.report_products(p_from date, p_to date, p_country text, p_currency text) to authenticated, service_role;
grant execute on function public.report_payments(p_from date, p_to date, p_country text, p_currency text) to authenticated, service_role;
grant execute on function public.report_inventory(p_from date, p_to date, p_country text, p_currency text) to authenticated, service_role;
grant execute on function public.get_admin_report(p_section text, p_from date, p_to date, p_country text, p_currency text) to authenticated, service_role;

-- 5. The one deliberate public door, recorded as an exception rather than an oversight.
revoke execute on function public.record_analytics_event(p_events jsonb) from public;
grant execute on function public.record_analytics_event(p_events jsonb) to anon, authenticated, service_role;
comment on function public.record_analytics_event(jsonb) is
  'Storefront event capture. Anonymous by design: a signed-out visit is real demand data. Validates the event name against a fixed list, bounds the session and batch size, never accepts a client-supplied customer id, and links an order only when that order belongs to the caller.';

notify pgrst, 'reload schema';
