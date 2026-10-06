-- Phase 8 (8.1 + 8.2): personalization signals and a deterministic recommendation engine.
--
-- Two rules shape this file. First, a shopper may only be shown a product for a reason the
-- database can actually prove: fragrance family, shared notes, category, collection, declared
-- occasion/season/intensity, price band and real stock. Second, purchase history is treated as
-- it really is on this deployment — one paid order — so every rail declares whether it is
-- personalised or a catalogue fallback, and "Frequently paired" returns nothing until real
-- co-purchase data exists. Popularity is never invented.
--
-- `recommend_products` is SECURITY INVOKER on purpose: it reads products through the caller's
-- own RLS, so when exclusive collections are enforced later the rails inherit that gate instead
-- of bypassing it. Only the weight lookup is definer, because the rules table is staff-readable
-- by design.

begin;

-- ---------------------------------------------------------------------------
-- 8.1 Personalisation configuration
-- Stored with the other shop configuration so there is one place that answers
-- "what is the storefront allowed to look at when it decides what to show".
-- ---------------------------------------------------------------------------
insert into public.site_settings (key, value, description)
values (
  'personalization_config',
  $json${
    "enabled": true,
    "guestSignals": ["recentlyViewed", "wishlist", "country", "season"],
    "authenticatedSignals": ["recentlyViewed", "wishlist", "purchases", "country", "tier", "season"],
    "rails": {
      "recommendedForYou": true,
      "youMayAlsoLike": true,
      "becauseYouViewed": true,
      "similarFragrances": true,
      "completeYourCollection": true,
      "frequentlyPaired": true
    },
    "minSignalsForPersonalisedRail": 1,
    "resultsPerRail": 4,
    "viewHistoryDays": 90
  }$json$,
  'Which shopper signals the storefront may use to choose what to recommend.'
)
on conflict (key) do nothing;

create or replace function public.personalization_config()
returns jsonb
language sql
stable
as $$
  select coalesce(
    (select value from public.site_settings where key = 'personalization_config'),
    '{}'::jsonb
  );
$$;

comment on function public.personalization_config() is
  'The personalisation settings as stored. An empty object means "no configuration yet", which the caller must treat as off, never as enabled-by-guess.';

-- ---------------------------------------------------------------------------
-- 8.1 View history for signed-in customers only.
-- Guests keep their recently-viewed list in their own browser (that already exists
-- in useRecentlyViewed); nothing about them is written to the database, which is the
-- least invasive way to make recommendations work for the customers who do have an account.
-- ---------------------------------------------------------------------------
create table if not exists public.product_views (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  source text not null default 'product_page',
  viewed_at timestamptz not null default now()
);

comment on table public.product_views is
  'Product views by authenticated customers, used only to rank recommendations and the "Because you viewed" rail.';

create index if not exists product_views_customer_recent_idx
  on public.product_views (customer_id, viewed_at desc);
create index if not exists product_views_product_idx
  on public.product_views (product_id);

alter table public.product_views enable row level security;

drop policy if exists "Customers read own product views" on public.product_views;
create policy "Customers read own product views"
  on public.product_views for select
  to authenticated
  using (customer_id = auth.uid());

-- Writing happens through record_product_view (definer) so the row can be deduplicated and
-- capped; a customer may still clean their own history directly.
drop policy if exists "Customers delete own product views" on public.product_views;
create policy "Customers delete own product views"
  on public.product_views for delete
  to authenticated
  using (customer_id = auth.uid());

revoke insert, update, delete, truncate, references, trigger on public.product_views
  from anon, authenticated;
grant select on public.product_views to authenticated;

-- ---------------------------------------------------------------------------
-- 8.2 Explainable scoring weights, editable by the Super Admin.
-- `signal` is a stable machine key the storefront translates.
-- ---------------------------------------------------------------------------
create table if not exists public.recommendation_rules (
  signal text primary key,
  label text not null,
  weight integer not null default 0 check (weight >= 0 and weight <= 100),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table public.recommendation_rules is
  'Relative weight of each proven catalogue signal in recommend_products. Defaults are a starting point for the shop, not a claim about its customers.';

insert into public.recommendation_rules (signal, label, weight, enabled) values
  ('family', 'Same fragrance family', 30, true),
  ('notes', 'Shared top, heart or base notes', 22, true),
  ('category', 'Same category', 14, true),
  ('collection', 'Same collection', 16, true),
  ('occasion', 'Declared occasion overlap', 10, true),
  ('season', 'Declared season overlap', 10, true),
  ('intensity', 'Same declared intensity', 8, true),
  ('price_band', 'Price within a third of the shopper average', 12, true),
  ('inventory', 'In stock now', 6, true),
  ('direct', 'Already viewed, wished or bought', 0, false),
  ('gender', 'Matches the shopper leaning', 6, true)
on conflict (signal) do nothing;

alter table public.recommendation_rules enable row level security;

drop policy if exists "Staff read recommendation rules" on public.recommendation_rules;
create policy "Staff read recommendation rules"
  on public.recommendation_rules for select
  to authenticated
  using (public.is_staff());

revoke select, insert, update, delete, truncate, references, trigger on public.recommendation_rules
  from anon, authenticated;
grant select on public.recommendation_rules to authenticated;

create or replace function public.recommendation_weights()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_object_agg(signal, weight),
    '{}'::jsonb
  )
  from public.recommendation_rules
  where enabled;
$$;

comment on function public.recommendation_weights() is
  'Enabled signals and weights as {signal: weight}. SECURITY DEFINER for one narrow reason: the rules table is staff-readable, but the recommendation function runs as the shopper.';

revoke execute on function public.recommendation_weights() from public;
grant execute on function public.recommendation_weights() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8.1 Record one view. Only the signed-in customer's own history is written, the
-- product must be one that is actually on sale, and a repeat inside five minutes is
-- ignored so a shopper browsing back and forth does not drown their own history.
-- ---------------------------------------------------------------------------
create or replace function public.record_product_view(
  p_product_id uuid,
  p_source text default 'product_page'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer uuid := auth.uid();
  v_recent timestamptz;
  v_kept integer;
  v_days integer := coalesce(
    nullif(public.personalization_config() ->> 'viewHistoryDays', '')::integer,
    90
  );
begin
  if v_customer is null then
    return jsonb_build_object('success', true, 'recorded', false, 'reason', 'anonymous');
  end if;

  if p_product_id is null or not exists (
    select 1 from public.products where id = p_product_id and active = true
  ) then
    return jsonb_build_object('success', false, 'error', 'That product is not available.');
  end if;

  select viewed_at into v_recent
  from public.product_views
  where customer_id = v_customer and product_id = p_product_id
  order by viewed_at desc
  limit 1;

  if v_recent is not null and v_recent > now() - interval '5 minutes' then
    return jsonb_build_object('success', true, 'recorded', false, 'reason', 'throttled');
  end if;

  insert into public.product_views (customer_id, product_id, source)
  values (v_customer, p_product_id, coalesce(nullif(trim(p_source), ''), 'product_page'));

  -- Trim the same product repeated across a long session, then cap the whole history.
  delete from public.product_views
  where customer_id = v_customer and product_id = p_product_id and viewed_at < v_recent;

  delete from public.product_views
  where customer_id = v_customer
    and id not in (
      select id from public.product_views
      where customer_id = v_customer
      order by viewed_at desc
      limit 200
    );

  select count(*) into v_kept from public.product_views
  where customer_id = v_customer and viewed_at > now() - make_interval(days => v_days);

  return jsonb_build_object('success', true, 'recorded', true, 'history', v_kept);
end;
$$;

comment on function public.record_product_view(uuid, text) is
  'Appends the caller''s own view. Guests are a no-op, never an error, so the storefront can call it uniformly.';

revoke execute on function public.record_product_view(uuid, text) from public, anon;
grant execute on function public.record_product_view(uuid, text) to authenticated, service_role;

create or replace function public.clear_my_product_views()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer uuid := auth.uid();
begin
  if v_customer is null then
    return jsonb_build_object('success', false, 'error', 'Sign in to clear your browsing history.');
  end if;
  delete from public.product_views where customer_id = v_customer;
  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.clear_my_product_views() from public, anon;
grant execute on function public.clear_my_product_views() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8.2 The recommendation core.
--
-- kind decides which seeds count and which candidates qualify:
--   because_you_viewed / you_may_also_like / recommended_for_you /
--   similar_fragrances / complete_your_collection / frequently_paired
--
-- Every returned row carries the reason codes that produced its score, and a basis of
-- 'personalized' or 'catalogue' so the interface can title the rail honestly instead of
-- claiming knowledge of the shopper it does not have.
-- ---------------------------------------------------------------------------
create or replace function public.recommend_products(
  p_kind text,
  p_product_id uuid default null,
  p_recent_ids uuid[] default null,
  p_limit integer default 4,
  p_gender text default null
)
returns table (
  product_id uuid,
  kind text,
  basis text,
  score numeric,
  reason_codes text[],
  price numeric,
  stock_total integer
)
language sql
stable
set search_path = public
as $$
with w as (
  select coalesce(public.recommendation_weights(), '{}'::jsonb) as j
),
cfg as (
  select least(greatest(coalesce(nullif(public.personalization_config() ->> 'viewHistoryDays', '')::integer, 90), 1), 365) as days
),
-- The shopper's own anchors. Anything the database cannot tie to this customer is
-- simply absent here; guest sessions contribute only the ids the browser volunteers.
seed as (
  select p_product_id as product_id
  where p_product_id is not null
  union
  select pv.product_id
  from public.product_views pv
  cross join cfg
  where pv.customer_id = auth.uid()
    and pv.viewed_at > now() - make_interval(days => cfg.days)
    and p_kind in ('recommended_for_you', 'because_you_viewed', 'you_may_also_like', 'similar_fragrances', 'complete_your_collection')
  union
  select wi.product_id
  from public.wishlists wl
  join public.wishlist_items wi on wi.wishlist_id = wl.id
  where wl.user_id = auth.uid()
    and p_kind in ('recommended_for_you', 'complete_your_collection', 'you_may_also_like')
  union
  select oi.product_id
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  where o.customer_id = auth.uid()
    and o.payment_status in ('Paid', 'Verified')
    and o.status <> 'Cancelled'
    and p_kind in ('recommended_for_you', 'complete_your_collection', 'frequently_paired')
  union
  select r.product_id
  from unnest(coalesce(p_recent_ids, '{}'::uuid[])) as r(product_id)
  where p_kind in ('recommended_for_you', 'because_you_viewed', 'you_may_also_like', 'similar_fragrances')
),
seed_products as (
  select p.id, p.fragrance_family, p.category_id, p.collection_id, p.gender, p.intensity,
         coalesce(p.sale_price, p.base_price) as price,
         coalesce(p.occasions, '{}'::text[]) as occasions,
         coalesce(p.seasons, '{}'::text[]) as seasons
  from seed s
  join public.products p on p.id = s.product_id
),
seed_notes as (
  select distinct pfn.note_id
  from seed s
  join public.product_fragrance_notes pfn on pfn.product_id = s.product_id
),
has_seed as (
  select exists (select 1 from seed_products) as any_seed
),
-- Frequently paired is the only kind that must come from baskets rather than
-- attributes: two products bought in the same real order. No orders, no pairs.
paired as (
  select oi2.product_id as product_id, count(distinct oi1.order_id) as pair_count
  from public.order_items oi1
  join public.order_items oi2 on oi2.order_id = oi1.order_id and oi2.product_id <> oi1.product_id
  join public.orders o on o.id = oi1.order_id
  where oi1.product_id = p_product_id
    and o.payment_status in ('Paid', 'Verified')
    and o.status <> 'Cancelled'
    and p_kind = 'frequently_paired'
  group by oi2.product_id
),
cand as (
  select p.id,
         coalesce(p.sale_price, p.base_price) as price,
         p.fragrance_family,
         p.gender,
         p.category_id,
         p.collection_id,
         p.intensity,
         coalesce(p.occasions, '{}'::text[]) as occasions,
         coalesce(p.seasons, '{}'::text[]) as seasons,
         p.featured,
         p.bestseller,
         p.new_arrival,
         coalesce((select sum(v.stock) from public.product_variants v
                   where v.product_id = p.id and v.active = true), 0)::integer as stock_total,
         coalesce((select array_agg(pfn.note_id) from public.product_fragrance_notes pfn
                   where pfn.product_id = p.id), '{}'::uuid[]) as notes
  from public.products p
  where p.active = true
    and p.id is distinct from p_product_id
),
qualified as (
  select c.*
  from cand c
  where c.stock_total > 0
    and (
      p_kind <> 'similar_fragrances'
      or c.fragrance_family in (select distinct fragrance_family from seed_products where fragrance_family is not null)
      or c.notes && (select array_agg(note_id) from seed_notes)
    )
    and (
      p_kind <> 'complete_your_collection'
      or c.collection_id in (select distinct collection_id from seed_products where collection_id is not null)
      or c.category_id in (select distinct category_id from seed_products where category_id is not null)
    )
),
scored as (
  select q.id,
         q.price,
         q.stock_total,
         q.featured,
         q.bestseller,
         q.new_arrival,
         (
           case when q.fragrance_family is not null
                     and q.fragrance_family in (select distinct fragrance_family from seed_products where fragrance_family is not null)
                then coalesce((w.j ->> 'family')::integer, 0) else 0 end
         + case when q.notes && (select array_agg(note_id) from seed_notes)
                then coalesce((w.j ->> 'notes')::integer, 0) else 0 end
         + case when q.category_id in (select distinct category_id from seed_products where category_id is not null)
                then coalesce((w.j ->> 'category')::integer, 0) else 0 end
         + case when q.collection_id in (select distinct collection_id from seed_products where collection_id is not null)
                then coalesce((w.j ->> 'collection')::integer, 0) else 0 end
         + case when q.occasions && (select array_agg(o2) from seed_products cross join unnest(seed_products.occasions) o2)
                then coalesce((w.j ->> 'occasion')::integer, 0) else 0 end
         + case when q.seasons && (select array_agg(s2) from seed_products cross join unnest(seed_products.seasons) s2)
                then coalesce((w.j ->> 'season')::integer, 0) else 0 end
         + case when q.intensity is not null
                     and q.intensity in (select distinct intensity from seed_products where intensity is not null)
                then coalesce((w.j ->> 'intensity')::integer, 0) else 0 end
         + case when (select count(*) from seed_products) > 0
                     and q.price between (select avg(sp.price) * 0.65 from seed_products sp)
                                     and (select avg(sp.price) * 1.5 from seed_products sp)
                then coalesce((w.j ->> 'price_band')::integer, 0) else 0 end
         + case when q.stock_total > 0 then coalesce((w.j ->> 'inventory')::integer, 0) else 0 end
         + case when p_gender is not null
                      and (q.gender = p_gender or q.gender = 'unisex')
                     and exists (select 1 from seed_products where gender = p_gender)
                then coalesce((w.j ->> 'gender')::integer, 0) else 0 end
         )::numeric as score,
         array_remove(array[
           case when q.fragrance_family is not null
                     and q.fragrance_family in (select distinct fragrance_family from seed_products where fragrance_family is not null)
                then 'family_match' end,
           case when q.notes && (select array_agg(note_id) from seed_notes) then 'notes_match' end,
           case when q.category_id in (select distinct category_id from seed_products where category_id is not null) then 'category_match' end,
           case when q.collection_id in (select distinct collection_id from seed_products where collection_id is not null) then 'collection_match' end,
           case when q.occasions && (select array_agg(o3) from seed_products cross join unnest(seed_products.occasions) o3) then 'occasion_match' end,
           case when q.seasons && (select array_agg(s3) from seed_products cross join unnest(seed_products.seasons) s3) then 'season_match' end,
           case when q.intensity is not null
                     and q.intensity in (select distinct intensity from seed_products where intensity is not null)
                then 'intensity_match' end,
           case when q.bestseller then 'house_bestseller' end,
           case when q.new_arrival then 'house_new' end
         ], null) as reason_codes
  from qualified q
  cross join w
),
ranked as (
  select s.*,
         hs.any_seed,
         case when p_kind = 'frequently_paired' then coalesce(pr.pair_count, 0) else 0 end as pair_count
  from scored s
  cross join has_seed hs
  left join paired pr on pr.product_id = s.id
  where (p_kind <> 'frequently_paired' or coalesce(pr.pair_count, 0) > 0)
)
select id as product_id,
       p_kind as kind,
       case when ranked.any_seed then 'personalized' else 'catalogue' end as basis,
       ranked.score,
       ranked.reason_codes,
       ranked.price,
       ranked.stock_total
from ranked
order by
  ranked.pair_count desc,
  (case when ranked.any_seed then ranked.score else 0 end) desc,
  ranked.bestseller desc,
  ranked.new_arrival desc,
  ranked.featured desc,
  ranked.price desc,
  ranked.id asc
limit least(greatest(coalesce(p_limit, 4), 1), 8);
$$;

comment on function public.recommend_products(text, uuid, uuid[], integer, text) is
  'Deterministic, explainable recommendations over stored attributes and real orders. basis tells the caller whether a real signal drove the rail.';

revoke execute on function public.recommend_products(text, uuid, uuid[], integer, text) from public;
grant execute on function public.recommend_products(text, uuid, uuid[], integer, text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Admin writers. Both are Super Admin only and guarded again inside the database,
-- because both change what every customer is shown.
-- ---------------------------------------------------------------------------
create or replace function public.save_recommendation_rule(
  p_signal text,
  p_weight integer,
  p_enabled boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can change recommendation rules.';
  end if;
  if p_signal is null or p_signal !~ '^[a-z][a-z_]{1,39}$' then
    raise exception 'Unknown recommendation signal.';
  end if;
  if p_weight is null or p_weight < 0 or p_weight > 100 then
    raise exception 'A recommendation weight must be between 0 and 100.';
  end if;

  insert into public.recommendation_rules (signal, label, weight, enabled, updated_at)
  values (p_signal, initcap(replace(p_signal, '_', ' ')), p_weight, coalesce(p_enabled, true), now())
  on conflict (signal) do update
    set weight = excluded.weight,
        enabled = excluded.enabled,
        updated_at = now();

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.save_recommendation_rule(text, integer, boolean) from public, anon;
grant execute on function public.save_recommendation_rule(text, integer, boolean) to authenticated, service_role;

create or replace function public.save_personalization_config(p_config jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean jsonb;
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can change personalisation settings.';
  end if;
  if p_config is null or jsonb_typeof(p_config) <> 'object' then
    raise exception 'Personalisation settings must be an object.';
  end if;

  -- Only these keys are stored; anything else in the payload is dropped rather than trusted.
  select jsonb_build_object(
    'enabled', coalesce((p_config ->> 'enabled')::boolean, true),
    'guestSignals', coalesce(p_config -> 'guestSignals', '[]'::jsonb),
    'authenticatedSignals', coalesce(p_config -> 'authenticatedSignals', '[]'::jsonb),
    'rails', coalesce(p_config -> 'rails', '{}'::jsonb),
    'minSignalsForPersonalisedRail', coalesce((p_config ->> 'minSignalsForPersonalisedRail')::integer, 1),
    'resultsPerRail', least(greatest(coalesce((p_config ->> 'resultsPerRail')::integer, 4), 1), 8),
    'viewHistoryDays', least(greatest(coalesce((p_config ->> 'viewHistoryDays')::integer, 90), 1), 365)
  ) into v_clean;

  insert into public.site_settings (key, value, updated_at)
  values ('personalization_config', v_clean, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();

  return jsonb_build_object('success', true, 'value', v_clean);
end;
$$;

revoke execute on function public.save_personalization_config(jsonb) from public, anon;
grant execute on function public.save_personalization_config(jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Verification, run once at apply time.
-- ---------------------------------------------------------------------------
select 'phase8a '
  || 'personalization_row ' || (select count(*) from public.site_settings where key = 'personalization_config')
  || ' | views_columns ' || (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'product_views')
  || ' | rules ' || (select count(*) from public.recommendation_rules)
  || ' | views_rls ' || (select relrowsecurity from pg_class where oid = 'public.product_views'::regclass)
  || ' | views_anon_select ' || has_table_privilege('anon', 'public.product_views', 'select')
  || ' | rules_anon_select ' || has_table_privilege('anon', 'public.recommendation_rules', 'select')
  || ' | weights_exec_anon ' || has_function_privilege('anon', 'public.recommendation_weights()', 'execute')
  || ' | recommend_exec_anon ' || has_function_privilege('anon', 'public.recommend_products(text, uuid, uuid[], integer, text)', 'execute')
  || ' | recommend_secdef ' || (select prosecdef from pg_proc where oid = 'public.recommend_products(text, uuid, uuid[], integer, text)'::regprocedure)
  || ' | record_view_exec_anon ' || has_function_privilege('anon', 'public.record_product_view(uuid, text)', 'execute')
  || ' | save_rule_exec_anon ' || has_function_privilege('anon', 'public.save_recommendation_rule(text, integer, boolean)', 'execute')
  || ' | new_recommendation_functions ' || (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('recommend_products', 'recommendation_weights', 'personalization_config', 'record_product_view', 'clear_my_product_views', 'save_recommendation_rule', 'save_personalization_config'));

commit;
