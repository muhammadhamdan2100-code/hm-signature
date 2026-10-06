-- ====================================================================
-- Phase 9 — business intelligence foundation.
--
-- Nothing in this file computes a metric. It lays down the three things the
-- reports in later migrations need and the current database does not have:
--
--   1. a funnel event log, because 9.4 asks for Visit → … → Order Completed
--      and only `product_views` and `orders` exist today. The instruction is to
--      start collecting going forward rather than fabricate history, so the
--      table begins empty and every reader reports the pre-capture window as
--      not tracked.
--   2. report scopes, because Phase 9 separates business analytics from
--      operational and content reporting, while every analytics function in the
--      database is currently guarded by a single `is_staff()` check.
--   3. a place to record what a fragrance costs the house, because 9.5 needs
--      cost and gross margin and there is no cost column anywhere in the
--      schema. It stays empty until real numbers are entered, and an empty
--      table is reported as "cost data not configured" rather than as no cost.
--
-- Privacy: an event carries a random per-browser identifier, a random per-visit
-- identifier, a path, and the campaign parameters already present in the URL.
-- No IP address, no user agent, no full referrer (host only), no email or
-- phone. `customer_id` is read from the JWT by the database, never from the
-- request body, so a browser cannot attribute events to somebody else.
-- Retention is the owner's to decide; nothing here deletes history, and the
-- admin surface shows the volume rather than assuming a policy.
-- ====================================================================

begin;

-- 1. FUNNEL AND ATTRIBUTION EVENT LOG ---------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  event text not null check (event in (
    'visit',
    'product_view',
    'add_to_cart',
    'begin_checkout',
    'payment_started',
    'payment_completed',
    'order_completed'
  )),
  visitor_id text not null check (visitor_id ~ '^[A-Za-z0-9_-]{16,40}$'),
  session_id text not null check (session_id ~ '^[A-Za-z0-9_-]{16,40}$'),
  customer_id uuid references public.profiles (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  path text check (
    path is null or (path like '/%' and path !~ '[[:cntrl:]?#]' and octet_length(path) <= 200)
  ),
  referrer_host text check (
    referrer_host is null or referrer_host ~ '^[A-Za-z0-9.-]{1,120}$'
  ),
  utm_source text check (
    utm_source is null or (octet_length(utm_source) between 1 and 60 and utm_source !~ '[[:cntrl:]]')
  ),
  utm_medium text check (
    utm_medium is null or (octet_length(utm_medium) between 1 and 60 and utm_medium !~ '[[:cntrl:]]')
  ),
  utm_campaign text check (
    utm_campaign is null or (octet_length(utm_campaign) between 1 and 80 and utm_campaign !~ '[[:cntrl:]]')
  ),
  utm_content text check (
    utm_content is null or (octet_length(utm_content) between 1 and 60 and utm_content !~ '[[:cntrl:]]')
  ),
  utm_term text check (
    utm_term is null or (octet_length(utm_term) between 1 and 60 and utm_term !~ '[[:cntrl:]]')
  ),
  currency_code text check (currency_code is null or currency_code ~ '^[A-Z]{3}$'),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$')
);

comment on table public.analytics_events is
  'Funnel and attribution events collected from the storefront from this migration forward. Append-only, pseudonymous, and empty until a visitor actually browses: readers must report the pre-capture window as not tracked rather than as zero activity.';

create index if not exists analytics_events_occurred_at_idx on public.analytics_events (occurred_at);
create index if not exists analytics_events_event_time_idx on public.analytics_events (event, occurred_at);
create index if not exists analytics_events_visitor_time_idx on public.analytics_events (visitor_id, occurred_at);
create index if not exists analytics_events_session_idx on public.analytics_events (session_id);
create index if not exists analytics_events_customer_idx on public.analytics_events (customer_id) where customer_id is not null;
create index if not exists analytics_events_order_idx on public.analytics_events (order_id) where order_id is not null;

alter table public.analytics_events enable row level security;

-- Staff may read the log. There is deliberately no insert policy: writes go
-- through record_analytics_event(), which is where the validation lives.
drop policy if exists "Analytics events staff read" on public.analytics_events;
create policy "Analytics events staff read" on public.analytics_events
  for select to authenticated
  using (public.is_staff(auth.uid()));

-- Supabase grants SELECT to anon and authenticated on every new public table by
-- default, so the row-level policy above is not enough on its own.
revoke all on table public.analytics_events from anon, authenticated;
grant select on table public.analytics_events to authenticated;

-- A campaign parameter kept to the length and character set the columns accept,
-- or nothing at all. Shared by the capture path and the attribution report.
create or replace function public.clean_campaign_value(p_raw text, p_max integer)
returns text
language sql
immutable
set search_path = public, pg_temp
as $function$
  select case
    when p_raw is null then null
    when octet_length(btrim(p_raw)) < 1 then null
    when octet_length(btrim(p_raw)) > coalesce(p_max, 60) then null
    when btrim(p_raw) ~ '[[:cntrl:]]' then null
    else btrim(p_raw)
  end;
$function$;

comment on function public.clean_campaign_value(text, integer) is
  'A UTM-shaped string, or null. Over-long or control-character-bearing values are dropped instead of truncated so a stored report value is always something a visitor really saw.';

revoke execute on function public.clean_campaign_value(text, integer) from public;
grant execute on function public.clean_campaign_value(text, integer) to anon, authenticated, service_role;

-- The only write path. One batched call per page so measuring the shop costs a
-- single request, and every malformed element is skipped in silence: capturing
-- analytics must never be able to break a purchase.
create or replace function public.record_analytics_event(p_events jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_row record;
  v_item jsonb;
  v_kind text;
  v_visitor text;
  v_session text;
  v_path text;
  v_referrer text;
  v_product uuid;
  v_order uuid;
  v_currency text;
  v_country text;
  v_utm_source text;
  v_utm_medium text;
  v_utm_campaign text;
  v_utm_content text;
  v_utm_term text;
  v_customer uuid := auth.uid();
  v_recorded integer := 0;
  v_rejected integer := 0;
begin
  if p_events is null or jsonb_typeof(p_events) <> 'array' then
    return jsonb_build_object('recorded', 0, 'rejected', 0, 'reason', 'payload_not_an_array');
  end if;

  if jsonb_array_length(p_events) > 12 then
    return jsonb_build_object('recorded', 0, 'rejected', jsonb_array_length(p_events), 'reason', 'batch_too_large');
  end if;

  for v_row in select value as item from jsonb_array_elements(p_events) loop
    v_item := v_row.item;

    if jsonb_typeof(v_item) <> 'object' then
      v_rejected := v_rejected + 1;
      continue;
    end if;

    v_kind := nullif(btrim(coalesce(v_item ->> 'event', '')), '');
    if v_kind is null or v_kind not in (
      'visit', 'product_view', 'add_to_cart', 'begin_checkout',
      'payment_started', 'payment_completed', 'order_completed'
    ) then
      v_rejected := v_rejected + 1;
      continue;
    end if;

    v_visitor := nullif(btrim(coalesce(v_item ->> 'visitor_id', '')), '');
    v_session := nullif(btrim(coalesce(v_item ->> 'session_id', '')), '');
    if v_visitor is null or v_visitor !~ '^[A-Za-z0-9_-]{16,40}$' then
      v_rejected := v_rejected + 1;
      continue;
    end if;
    if v_session is null or v_session !~ '^[A-Za-z0-9_-]{16,40}$' then
      v_rejected := v_rejected + 1;
      continue;
    end if;

    -- One visit is worth a few hundred events at the very most. The ceiling
    -- stops a loop in a browser from filling the table for that session.
    if (select count(*) from public.analytics_events ae where ae.session_id = v_session) >= 400 then
      v_rejected := v_rejected + 1;
      continue;
    end if;

    -- A path must look like a path. Anything carrying a query string is dropped
    -- whole rather than trimmed, because the query is where personal data or a
    -- session token could arrive.
    v_path := nullif(btrim(coalesce(v_item ->> 'path', '')), '');
    if v_path is null or v_path not like '/%'
       or v_path ~ '[[:cntrl:]?#]'
       or octet_length(v_path) > 200 then
      v_path := null;
    end if;

    v_referrer := nullif(btrim(coalesce(v_item ->> 'referrer_host', '')), '');
    if v_referrer is null or v_referrer !~ '^[A-Za-z0-9.-]{1,120}$' then
      v_referrer := null;
    end if;

    begin
      v_product := nullif(coalesce(v_item ->> 'product_id', ''), '')::uuid;
    exception when others then
      v_product := null;
    end;
    if v_product is not null and not exists (select 1 from public.products p where p.id = v_product) then
      v_product := null;
    end if;

    -- An order reference is honoured only for the signed-in owner of that order,
    -- which is what makes revenue attribution safe to compute later.
    v_order := null;
    if v_customer is not null then
      begin
        v_order := nullif(coalesce(v_item ->> 'order_id', ''), '')::uuid;
      exception when others then
        v_order := null;
      end;
      if v_order is not null and not exists (
        select 1 from public.orders o where o.id = v_order and o.customer_id = v_customer
      ) then
        v_order := null;
      end if;
    end if;

    v_currency := upper(nullif(btrim(coalesce(v_item ->> 'currency_code', '')), ''));
    if v_currency is null or v_currency !~ '^[A-Z]{3}$' then
      v_currency := null;
    end if;

    v_country := upper(nullif(btrim(coalesce(v_item ->> 'country_code', '')), ''));
    if v_country is null or v_country !~ '^[A-Z]{2}$' then
      v_country := null;
    end if;

    -- Campaign parameters belong to the arrival, so only a visit carries them.
    -- Repeating them on every event in the session would multiply the same
    -- touch across the funnel and overstate a campaign.
    if v_kind = 'visit' then
      v_utm_source := public.clean_campaign_value(v_item ->> 'utm_source', 60);
      v_utm_medium := public.clean_campaign_value(v_item ->> 'utm_medium', 60);
      v_utm_campaign := public.clean_campaign_value(v_item ->> 'utm_campaign', 80);
      v_utm_content := public.clean_campaign_value(v_item ->> 'utm_content', 60);
      v_utm_term := public.clean_campaign_value(v_item ->> 'utm_term', 60);
    else
      v_utm_source := null;
      v_utm_medium := null;
      v_utm_campaign := null;
      v_utm_content := null;
      v_utm_term := null;
    end if;

    insert into public.analytics_events (
      event, visitor_id, session_id, customer_id, product_id, order_id,
      path, referrer_host, currency_code, country_code,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term
    ) values (
      v_kind, v_visitor, v_session, v_customer, v_product, v_order,
      v_path, v_referrer, v_currency, v_country,
      v_utm_source, v_utm_medium, v_utm_campaign, v_utm_content, v_utm_term
    );

    v_recorded := v_recorded + 1;
  end loop;

  return jsonb_build_object('recorded', v_recorded, 'rejected', v_rejected);
end;
$function$;

comment on function public.record_analytics_event(jsonb) is
  'Append validated funnel events for this browser. Identity comes from the JWT and an order reference is accepted only when the caller owns that order. Never fails the shopper: anything malformed is skipped and counted.';

revoke execute on function public.record_analytics_event(jsonb) from public;
grant execute on function public.record_analytics_event(jsonb) to anon, authenticated, service_role;

-- 2. REPORT SCOPES ----------------------------------------------------
-- Phase 9 recommends four different windows onto the same numbers, so the
-- database needs three codes rather than the one `is_staff()` check every
-- analytics function uses today.
insert into public.permissions (code, description) values
  ('view_business_reports', 'Read business analytics: cohorts, customer value, funnel, attribution, forecasting'),
  ('view_operational_reports', 'Read operational reports: order and payment activity'),
  ('view_content_reports', 'Read product and content performance reports')
on conflict (code) do nothing;

-- Manager runs the business, so all three. Order Manager only the operational
-- window. Content Manager only the product window. Super Admin short-circuits
-- inside has_permission() already.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('view_business_reports', 'view_operational_reports', 'view_content_reports')
where r.name = 'manager'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'view_operational_reports'
where r.name = 'order_manager'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'view_content_reports'
where r.name = 'content_manager'
on conflict (role_id, permission_id) do nothing;

create or replace function public.can_see_report(p_kind text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $function$
  select case
    when public.is_super_admin() then true
    when p_kind = 'business' then public.has_permission(auth.uid(), 'view_business_reports')
    when p_kind = 'operational' then public.has_permission(auth.uid(), 'view_operational_reports')
    when p_kind = 'content' then public.has_permission(auth.uid(), 'view_content_reports')
    else false
  end;
$function$;

comment on function public.can_see_report(text) is
  'Which report window a staff member may open: business, operational or content. Enforced inside every Phase 9 report function, so a REST call cannot bypass the admin navigation.';

revoke execute on function public.can_see_report(text) from public;
grant execute on function public.can_see_report(text) to authenticated, service_role;

-- 3. WHAT A FRAGRANCE COSTS THE HOUSE ---------------------------------
create table if not exists public.product_variant_costs (
  variant_id uuid primary key references public.product_variants (id) on delete cascade,
  unit_cost numeric(12, 2) not null check (unit_cost >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  note text check (note is null or octet_length(note) <= 160),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.product_variant_costs is
  'Purchased cost per selling unit, entered by the house in the base currency. Deliberately empty at creation: profitability reports a missing cost as not configured instead of implying free stock.';

alter table public.product_variant_costs enable row level security;

drop policy if exists "Variant costs staff read" on public.product_variant_costs;
create policy "Variant costs staff read" on public.product_variant_costs
  for select to authenticated
  using (public.is_staff(auth.uid()));

revoke all on table public.product_variant_costs from anon, authenticated;
grant select on table public.product_variant_costs to authenticated;

create or replace function public.save_variant_cost(
  p_variant_id uuid,
  p_unit_cost numeric,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_base text;
  v_note text;
begin
  if not (public.is_super_admin() or public.has_permission(auth.uid(), 'manage_products')) then
    raise exception 'Only the product owner may record what a fragrance costs.';
  end if;

  if p_variant_id is null or not exists (
    select 1 from public.product_variants v where v.id = p_variant_id
  ) then
    return jsonb_build_object('saved', false, 'error', 'variant_not_found');
  end if;

  select code into v_base from public.currencies where is_base limit 1;
  v_base := coalesce(v_base, 'PKR');

  -- No number clears the record, which returns the report to "not configured"
  -- rather than leaving a stale cost behind.
  if p_unit_cost is null then
    delete from public.product_variant_costs where variant_id = p_variant_id;
    return jsonb_build_object('saved', true, 'cleared', true, 'currency_code', v_base);
  end if;

  if p_unit_cost < 0 then
    return jsonb_build_object('saved', false, 'error', 'cost_must_not_be_negative');
  end if;

  if p_unit_cost > 99999999.99 then
    return jsonb_build_object('saved', false, 'error', 'cost_out_of_range');
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is not null and octet_length(v_note) > 160 then
    v_note := left(v_note, 160);
  end if;

  insert into public.product_variant_costs (
    variant_id, unit_cost, currency_code, note, updated_by, updated_at
  ) values (
    p_variant_id, round(p_unit_cost, 2), v_base, v_note, auth.uid(), now()
  )
  on conflict (variant_id) do update
    set unit_cost = excluded.unit_cost,
        currency_code = excluded.currency_code,
        note = excluded.note,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at;

  return jsonb_build_object('saved', true, 'unit_cost', round(p_unit_cost, 2), 'currency_code', v_base);
end;
$function$;

comment on function public.save_variant_cost(uuid, numeric, text) is
  'Record or clear the house cost of one selling size. Guarded by manage_products, the same permission that already prices the product.';

revoke execute on function public.save_variant_cost(uuid, numeric, text) from public;
grant execute on function public.save_variant_cost(uuid, numeric, text) to authenticated, service_role;

create or replace function public.cost_basis_status()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $function$
  select jsonb_build_object(
    'variants_total', (select count(*) from public.product_variants),
    'variants_costed', (select count(*) from public.product_variant_costs),
    'currency_code', (select coalesce((select code from public.currencies where is_base limit 1), 'PKR')),
    'coverage_percent', round(
      (select count(*) from public.product_variant_costs)::numeric
      / greatest((select count(*) from public.product_variants)::numeric, 1) * 100, 1
    )
  );
$function$;

comment on function public.cost_basis_status() is
  'How much of the catalogue has a real cost behind it. Every profitability figure reads this first so it can say not configured instead of implying free stock.';

revoke execute on function public.cost_basis_status() from public;
grant execute on function public.cost_basis_status() to authenticated, service_role;

-- Verification, run once at apply time.
select 'phase9_foundation'
  || ' | events_empty ' || (select count(*) from public.analytics_events)
  || ' | capture_anon_exec ' || has_function_privilege('anon', 'public.record_analytics_event(jsonb)', 'execute')
  || ' | capture_secdef ' || (select prosecdef from pg_proc where oid = 'public.record_analytics_event(jsonb)'::regprocedure)
  || ' | events_anon_select ' || has_table_privilege('anon', 'public.analytics_events', 'select')
  || ' | costs_anon_select ' || has_table_privilege('anon', 'public.product_variant_costs', 'select')
  || ' | scopes ' || (select string_agg(code, ',' order by code) from public.permissions where code like 'view_%_reports')
  || ' | manager_business ' || public.has_permission(
       (select id from public.profiles where role = 'manager' limit 1), 'view_business_reports')
  || ' | costs_configured ' || (select count(*) from public.product_variant_costs);

commit;
