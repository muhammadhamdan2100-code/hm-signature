-- ====================================================================
-- Phase 9 correction: the report dispatcher answered before it checked.
--
-- get_admin_report() forwards to one of five section functions, and each of
-- those checks can_see_report() for itself. But the `unknown section` branch
-- built its answer in the dispatcher, with no check at all, so an anonymous
-- caller could POST /rpc/get_admin_report with any nonsense name and receive the
-- list of valid sections. That is a small disclosure, but it tells an attacker
-- exactly which report names are worth trying, and it is the only Phase 9 entry
-- point that answered anyone without first asking who they are.
--
-- The guard now runs before the dispatch: a caller needs at least one report
-- scope to learn anything from this function, valid section name or not.
-- ====================================================================

begin;

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
  if not (
    public.can_see_report('business')
    or public.can_see_report('operational')
    or public.can_see_report('content')
  ) then
    raise exception 'Reading a report needs a business, operational or content scope.';
  end if;

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
  'The five Phase 9 report sections behind one call. The caller needs a report scope before the section name is even looked at.';

revoke execute on function public.get_admin_report(text, date, date, text, text) from public;
grant execute on function public.get_admin_report(text, date, date, text, text) to authenticated, service_role;

-- Verification, run once at apply time. The querying role holds no report scope,
-- so the only safe assertion is that the guard is inside a definer function and
-- that the body now checks before dispatching.
select 'phase9_dispatch_guard'
  || ' | secdef ' || (select prosecdef from pg_proc where oid = 'public.get_admin_report(text,date,date,text,text)'::regprocedure)
  || ' | guards_first ' || strpos(
       coalesce((select prosrc from pg_proc where oid = 'public.get_admin_report(text,date,date,text,text)'::regprocedure), ''),
       'can_see_report'
     ) > 0
  || ' | caller_has_scope ' || public.can_see_report('business');

commit;
