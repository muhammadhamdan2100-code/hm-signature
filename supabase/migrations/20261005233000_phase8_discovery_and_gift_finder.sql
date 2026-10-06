-- Phase 8 (8.3 + 8.4): fragrance discovery and the Gift Finder.
--
-- What the database actually holds today: 6 products, every one with a fragrance family and
-- top/heart/base notes, plus gender and price. The columns for occasion, season and intensity
-- exist but are empty on all six products, and mood, longevity and sillage have no column at all.
--
-- So this migration does not invent attributes. It adds one place for the shop to declare them
-- (product_discovery_tags), and every discovery query reads tags plus the real columns. A facet
-- with no product behind it is simply absent, and the interface says "not tagged yet" instead of
-- quietly returning an unrelated list.

begin;

-- One small helper so a browser-supplied filter object can never break a query: a missing key,
-- a JSON null and a non-array all read as "no selection" rather than an error or a guess.
create or replace function public.filter_text_array(p_filters jsonb, p_key text)
returns text[]
language sql
immutable
set search_path = public
as $$
  select coalesce(
    (
      select array_agg(lower(trim(e.v)))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_filters -> p_key) = 'array' then p_filters -> p_key else '[]'::jsonb end
      ) as e(v)
    ),
    '{}'::text[]
  );
$$;

comment on function public.filter_text_array(jsonb, text) is
  'A lower-cased text array out of one jsonb key. Anything that is not an array becomes an empty selection.';

revoke execute on function public.filter_text_array(jsonb, text) from public, anon;
grant execute on function public.filter_text_array(jsonb, text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8.3 Declared discovery attributes. Values are normalised lower-case here so a
-- filter can never be defeated by "Date Night" versus "date night".
-- ---------------------------------------------------------------------------
create table if not exists public.product_discovery_tags (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  kind text not null check (kind in ('mood', 'occasion', 'season', 'longevity', 'sillage', 'gift_for')),
  value text not null check (value ~ '^[a-z0-9][a-z0-9 _-]{1,39}$'),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (product_id, kind, value)
);

comment on table public.product_discovery_tags is
  'Attributes the shop declares for a fragrance (mood, occasion, season, longevity, sillage, gift_for). Absence is reported as absence.';

alter table public.product_discovery_tags enable row level security;

drop policy if exists "Discovery tags readable for live products" on public.product_discovery_tags;
create policy "Discovery tags readable for live products"
  on public.product_discovery_tags for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_discovery_tags.product_id
        and (p.active = true or public.is_staff())
    )
  );

-- Tags are written only through save_product_discovery_tag / remove_product_discovery_tag, so the
-- product's existence, the kind allowlist and the staff permission are checked in one place.
revoke insert, update, delete, truncate, references, trigger on public.product_discovery_tags
  from anon, authenticated;
grant select on public.product_discovery_tags to anon, authenticated;

create index if not exists product_discovery_tags_kind_value_idx
  on public.product_discovery_tags (kind, value);
create index if not exists product_discovery_tags_product_idx
  on public.product_discovery_tags (product_id);

create or replace function public.save_product_discovery_tag(
  p_product_id uuid,
  p_kind text,
  p_value text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean text := lower(trim(coalesce(p_value, '')));
  v_owner uuid := auth.uid();
begin
  if v_owner is null or not public.has_permission(v_owner, 'manage_products') then
    raise exception 'You are not authorised to tag fragrances.';
  end if;
  if p_product_id is null or not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'That fragrance does not exist.';
  end if;
  if p_kind not in ('mood', 'occasion', 'season', 'longevity', 'sillage', 'gift_for') then
    raise exception 'That attribute cannot be tagged.';
  end if;
  if v_clean !~ '^[a-z0-9][a-z0-9 _-]{1,39}$' then
    raise exception 'Use 2 to 40 letters, numbers, spaces, hyphens or underscores.';
  end if;

  insert into public.product_discovery_tags (product_id, kind, value, created_by)
  values (p_product_id, p_kind, v_clean, v_owner)
  on conflict (product_id, kind, value) do nothing;

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.save_product_discovery_tag(uuid, text, text) from public, anon;
grant execute on function public.save_product_discovery_tag(uuid, text, text) to authenticated, service_role;

create or replace function public.remove_product_discovery_tag(p_tag_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
begin
  if v_owner is null or not public.has_permission(v_owner, 'manage_products') then
    raise exception 'You are not authorised to remove fragrance tags.';
  end if;
  delete from public.product_discovery_tags where id = p_tag_id;
  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.remove_product_discovery_tag(uuid) from public, anon;
grant execute on function public.remove_product_discovery_tag(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8.3 The facets a shopper may filter by, with the number of live products behind
-- each. Read from both sources — the tag table and the products' own occasion,
-- season and intensity columns — so filling in either one shows up here.
-- Mood, longevity and sillage exist only as tags: nothing in the products table
-- describes them, and guessing them would be exactly the invention this avoids.
-- ---------------------------------------------------------------------------
create or replace function public.discovery_facets()
returns jsonb
language sql
stable
set search_path = public
as $$
  with from_tags as (
    select t.kind, t.value, count(distinct t.product_id) as products
    from public.product_discovery_tags t
    join public.products p on p.id = t.product_id and p.active = true
    group by t.kind, t.value
  ),
  from_columns as (
    select 'occasion'::text as kind, lower(o) as value, count(*) as products
    from public.products p
    cross join unnest(coalesce(p.occasions, '{}'::text[])) as o
    where p.active = true
    group by lower(o)
    union all
    select 'season', lower(s), count(*)
    from public.products p
    cross join unnest(coalesce(p.seasons, '{}'::text[])) as s
    where p.active = true
    group by lower(s)
    union all
    select 'intensity', lower(p.intensity), count(*)
    from public.products p
    where p.active = true and p.intensity is not null and trim(p.intensity) <> ''
    group by lower(p.intensity)
  ),
  merged as (
    select kind, value, max(products) as products
    from (
      select kind, value, products from from_tags
      union all
      select kind, value, products from from_columns
    ) u
    where value is not null and value <> ''
    group by kind, value
  )
  select coalesce(
    jsonb_agg(jsonb_build_object('kind', kind, 'values', vals) order by kind),
    '[]'::jsonb
  )
  from (
    select kind,
           jsonb_agg(jsonb_build_object('value', value, 'products', products) order by products desc, value) as vals
    from merged
    group by kind
  ) g;
$$;

comment on function public.discovery_facets() is
  'Only facets that at least one live product actually carries are returned; the rest are absent rather than guessed.';

revoke execute on function public.discovery_facets() from public;
grant execute on function public.discovery_facets() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8.3 Discovery query. SECURITY INVOKER so the caller's own row-level security
-- decides which products may appear; pagination happens here, not in the browser.
-- ---------------------------------------------------------------------------
create or replace function public.discover_products(
  p_filters jsonb default '{}'::jsonb,
  p_sort text default 'matching',
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  product_id uuid,
  matched_facets text[],
  match_count integer,
  price numeric,
  stock_total integer
)
language sql
stable
set search_path = public
as $$
  with sel as (
    select
      public.filter_text_array(p_filters, 'families') as families,
      public.filter_text_array(p_filters, 'notes') as notes,
      public.filter_text_array(p_filters, 'genders') as genders,
      public.filter_text_array(p_filters, 'moods') as moods,
      public.filter_text_array(p_filters, 'occasions') as occasions,
      public.filter_text_array(p_filters, 'seasons') as seasons,
      public.filter_text_array(p_filters, 'intensities') as intensities,
      public.filter_text_array(p_filters, 'sillage') as sillage,
      public.filter_text_array(p_filters, 'longevity') as longevity,
      case when jsonb_typeof(p_filters -> 'priceMin') = 'number' then (p_filters ->> 'priceMin')::numeric else null::numeric end as price_min,
      case when jsonb_typeof(p_filters -> 'priceMax') = 'number' then (p_filters ->> 'priceMax')::numeric else null::numeric end as price_max,
      coalesce((p_filters ->> 'inStockOnly')::boolean, false) as in_stock_only
  ),
  base as (
    select p.id,
           coalesce(p.sale_price, p.base_price) as price,
           p.fragrance_family,
           p.gender,
           p.bestseller,
           p.new_arrival,
           p.featured,
           p.name,
           lower(coalesce(p.intensity, '')) as intensity_value,
           coalesce((select array_agg(lower(o)) from unnest(coalesce(p.occasions, '{}'::text[])) as o), '{}'::text[]) as occasion_values,
           coalesce((select array_agg(lower(s)) from unnest(coalesce(p.seasons, '{}'::text[])) as s), '{}'::text[]) as season_values,
           coalesce((select sum(v.stock) from public.product_variants v
                     where v.product_id = p.id and v.active = true), 0)::integer as stock_total
    from public.products p
    cross join sel
    where p.active = true
      and (cardinality(sel.families) = 0 or p.fragrance_family = any (sel.families))
      and (cardinality(sel.genders) = 0 or lower(p.gender) = any (sel.genders))
      and (sel.price_min is null or coalesce(p.sale_price, p.base_price) >= sel.price_min)
      and (sel.price_max is null or coalesce(p.sale_price, p.base_price) <= sel.price_max)
      and (not sel.in_stock_only or exists (
             select 1 from public.product_variants v
             where v.product_id = p.id and v.active = true and v.stock > 0))
      and (cardinality(sel.notes) = 0 or exists (
             select 1
             from public.product_fragrance_notes pfn
             join public.fragrance_notes fn on fn.id = pfn.note_id
             where pfn.product_id = p.id and lower(fn.name) = any (sel.notes)))
  ),
  hits as (
    select b.*,
      cardinality(sel.moods) > 0 and exists (
        select 1 from public.product_discovery_tags t
        where t.product_id = b.id and t.kind = 'mood' and t.value = any (sel.moods)) as mood_hit,
      cardinality(sel.sillage) > 0 and exists (
        select 1 from public.product_discovery_tags t
        where t.product_id = b.id and t.kind = 'sillage' and t.value = any (sel.sillage)) as sillage_hit,
      cardinality(sel.longevity) > 0 and exists (
        select 1 from public.product_discovery_tags t
        where t.product_id = b.id and t.kind = 'longevity' and t.value = any (sel.longevity)) as longevity_hit,
      cardinality(sel.occasions) > 0 and (b.occasion_values && sel.occasions or exists (
        select 1 from public.product_discovery_tags t
        where t.product_id = b.id and t.kind = 'occasion' and t.value = any (sel.occasions))) as occasion_hit,
      cardinality(sel.seasons) > 0 and (b.season_values && sel.seasons or exists (
        select 1 from public.product_discovery_tags t
        where t.product_id = b.id and t.kind = 'season' and t.value = any (sel.seasons))) as season_hit,
      cardinality(sel.intensities) > 0 and b.intensity_value = any (sel.intensities) as intensity_hit,
      cardinality(sel.notes) > 0 and exists (
        select 1 from public.product_fragrance_notes pfn
        join public.fragrance_notes fn on fn.id = pfn.note_id
        where pfn.product_id = b.id and lower(fn.name) = any (sel.notes)) as note_hit
    from base b
    cross join sel
  ),
  scored as (
    select h.id,
           h.price,
           h.stock_total,
           h.bestseller,
           h.new_arrival,
           h.featured,
           h.name,
           array_remove(array[
             case when h.fragrance_family = any (sel.families) then 'family' end,
             case when h.note_hit then 'notes' end,
             case when lower(h.gender) = any (sel.genders) then 'gender' end,
             case when h.mood_hit then 'mood' end,
             case when h.occasion_hit then 'occasion' end,
             case when h.season_hit then 'season' end,
             case when h.intensity_hit then 'intensity' end,
             case when h.sillage_hit then 'sillage' end,
             case when h.longevity_hit then 'longevity' end,
             case when sel.price_min is not null or sel.price_max is not null then 'price' end
           ], null) as facets,
           (case when h.fragrance_family = any (sel.families) then 1 else 0 end
            + case when h.note_hit then 1 else 0 end
            + case when lower(h.gender) = any (sel.genders) then 1 else 0 end
            + case when h.mood_hit then 1 else 0 end
            + case when h.occasion_hit then 1 else 0 end
            + case when h.season_hit then 1 else 0 end
            + case when h.intensity_hit then 1 else 0 end
            + case when h.sillage_hit then 1 else 0 end
            + case when h.longevity_hit then 1 else 0 end)::integer as matched
    from hits h
    cross join sel
  )
  select id, facets, matched, price, stock_total
  from scored
  order by
    case p_sort
      when 'price_asc' then price
      when 'price_desc' then -price
      else 0
    end asc nulls last,
    case p_sort when 'new' then (case when new_arrival then 1 else 0 end) else 0 end desc,
    case p_sort when 'bestseller' then (case when bestseller then 1 else 0 end) else 0 end desc,
    case p_sort when 'name' then lower(name) else '' end asc,
    matched desc,
    bestseller desc,
    id asc
  limit least(greatest(coalesce(p_limit, 12), 1), 48)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

comment on function public.discover_products(jsonb, text, integer, integer) is
  'Discovery results over declared attributes only. matched_facets records which of the shopper''s own filters each fragrance satisfied.';

revoke execute on function public.discover_products(jsonb, text, integer, integer) from public;
grant execute on function public.discover_products(jsonb, text, integer, integer) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8.4 Gift Finder configuration. The option lists belong to the shop and are
-- edited here, so the page never advertises a recipient or occasion it cannot honour.
-- ---------------------------------------------------------------------------
insert into public.site_settings (key, value, description)
values (
  'gift_finder_config',
  $json${
    "enabled": true,
    "recipients": [],
    "relationships": [],
    "occasions": [],
    "budgetBands": [],
    "resultsLimit": 4
  }$json$,
  'Gift Finder options. An empty list means the shop has not defined those options yet, and the page says so.'
)
on conflict (key) do nothing;

create or replace function public.gift_finder_config()
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(
    (select value from public.site_settings where key = 'gift_finder_config'),
    '{}'::jsonb
  );
$$;

revoke execute on function public.gift_finder_config() from public;
grant execute on function public.gift_finder_config() to anon, authenticated, service_role;

create or replace function public.save_gift_finder_config(p_config jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean jsonb;
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can change Gift Finder options.';
  end if;
  if p_config is null or jsonb_typeof(p_config) <> 'object' then
    raise exception 'Gift Finder options must be an object.';
  end if;

  select jsonb_build_object(
    'enabled', coalesce((p_config ->> 'enabled')::boolean, true),
    'recipients', coalesce(p_config -> 'recipients', '[]'::jsonb),
    'relationships', coalesce(p_config -> 'relationships', '[]'::jsonb),
    'occasions', coalesce(p_config -> 'occasions', '[]'::jsonb),
    'budgetBands', coalesce(p_config -> 'budgetBands', '[]'::jsonb),
    'resultsLimit', least(greatest(coalesce((p_config ->> 'resultsLimit')::integer, 4), 1), 8)
  ) into v_clean;

  insert into public.site_settings (key, value, updated_at)
  values ('gift_finder_config', v_clean, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();

  return jsonb_build_object('success', true, 'value', v_clean);
end;
$$;

revoke execute on function public.save_gift_finder_config(jsonb) from public, anon;
grant execute on function public.save_gift_finder_config(jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8.4 Gift recommendations. Every reason is a fact about a real product: it is inside
-- the budget, it is in stock, it carries the requested occasion tag, or it shares the
-- requested family. Nothing is claimed about a fragrance the shop has not declared.
-- ---------------------------------------------------------------------------
create or replace function public.find_gifts(
  p_recipient text default null,
  p_relationship text default null,
  p_occasion text default null,
  p_season text default null,
  p_mood text default null,
  p_gender text default null,
  p_family text default null,
  p_budget_min numeric default null,
  p_budget_max numeric default null,
  p_limit integer default 4
)
returns table (
  product_id uuid,
  score numeric,
  reason_codes text[],
  price numeric,
  stock_total integer
)
language sql
stable
set search_path = public
as $$
  with cand as (
    select p.id,
           coalesce(p.sale_price, p.base_price) as price,
           p.fragrance_family,
           p.gender,
           p.bestseller,
           p.new_arrival,
           p.featured,
           coalesce((select sum(v.stock) from public.product_variants v
                     where v.product_id = p.id and v.active = true), 0)::integer as stock_total
    from public.products p
    where p.active = true
      and coalesce((select sum(v.stock) from public.product_variants v
                    where v.product_id = p.id and v.active = true), 0) > 0
      and (p_budget_min is null or coalesce(p.sale_price, p.base_price) >= p_budget_min)
      and (p_budget_max is null or coalesce(p.sale_price, p.base_price) <= p_budget_max)
      and (p_gender is null or p_gender not in ('men', 'women') or p.gender in (p_gender, 'unisex'))
      and (p_family is null or p.fragrance_family = p_family)
  ),
  scored as (
    select c.*,
      (
        case when p_occasion is not null and exists (
               select 1 from public.product_discovery_tags t
               where t.product_id = c.id and t.kind = 'occasion' and t.value = lower(p_occasion)) then 28 else 0 end
      + case when p_season is not null and exists (
               select 1 from public.product_discovery_tags t
               where t.product_id = c.id and t.kind = 'season' and t.value = lower(p_season)) then 16 else 0 end
      + case when p_mood is not null and exists (
               select 1 from public.product_discovery_tags t
               where t.product_id = c.id and t.kind = 'mood' and t.value = lower(p_mood)) then 18 else 0 end
      + case when p_recipient is not null and exists (
               select 1 from public.product_discovery_tags t
               where t.product_id = c.id and t.kind = 'gift_for' and t.value = lower(p_recipient)) then 26 else 0 end
      + case when p_relationship is not null and exists (
               select 1 from public.product_discovery_tags t
               where t.product_id = c.id and t.kind = 'gift_for' and t.value = lower(p_relationship)) then 12 else 0 end
      + case when p_gender is not null and c.gender = p_gender then 10 else 0 end
      + case when c.stock_total > 0 then 6 else 0 end
      )::numeric as score,
      array_remove(array[
        case when p_budget_max is not null and c.price <= p_budget_max then 'within_budget' end,
        case when p_occasion is not null and exists (
               select 1 from public.product_discovery_tags t
               where t.product_id = c.id and t.kind = 'occasion' and t.value = lower(p_occasion)) then 'occasion_match' end,
        case when p_season is not null and exists (
               select 1 from public.product_discovery_tags t
               where t.product_id = c.id and t.kind = 'season' and t.value = lower(p_season)) then 'season_match' end,
        case when p_mood is not null and exists (
               select 1 from public.product_discovery_tags t
               where t.product_id = c.id and t.kind = 'mood' and t.value = lower(p_mood)) then 'mood_match' end,
        case when p_recipient is not null and exists (
               select 1 from public.product_discovery_tags t
               where t.product_id = c.id and t.kind = 'gift_for' and t.value = lower(p_recipient)) then 'recipient_match' end,
        case when p_family is not null and c.fragrance_family = p_family then 'family_match' end,
        case when c.stock_total <= 3 then 'last_pieces' end
      ], null) as reason_codes
    from cand c
  )
  select id, score, reason_codes, price, stock_total
  from scored
  order by score desc, bestseller desc, new_arrival desc, featured desc, price desc, id asc
  limit least(greatest(coalesce(p_limit, 4), 1), 8);
$$;

comment on function public.find_gifts(text, text, text, text, text, text, text, numeric, numeric, integer) is
  'Gift candidates from declared tags, gender, family and budget. An empty reason list means only budget and stock drove the order.';

revoke execute on function public.find_gifts(text, text, text, text, text, text, text, numeric, numeric, integer) from public;
grant execute on function public.find_gifts(text, text, text, text, text, text, text, numeric, numeric, integer) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Verification, run once at apply time.
-- ---------------------------------------------------------------------------
select 'phase8b '
  || 'tag_columns ' || (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'product_discovery_tags')
  || ' | tag_rows ' || (select count(*) from public.product_discovery_tags)
  || ' | tags_rls ' || (select relrowsecurity from pg_class where oid = 'public.product_discovery_tags'::regclass)
  || ' | tags_anon_insert ' || has_table_privilege('anon', 'public.product_discovery_tags', 'insert')
  || ' | tags_anon_select ' || has_table_privilege('anon', 'public.product_discovery_tags', 'select')
  || ' | gift_config_row ' || (select count(*) from public.site_settings where key = 'gift_finder_config')
  || ' | facets_result ' || (select coalesce(left(public.discovery_facets()::text, 60), 'null'))
  || ' | discover_anon_exec ' || has_function_privilege('anon', 'public.discover_products(jsonb, text, integer, integer)', 'execute')
  || ' | discover_secdef ' || (select prosecdef from pg_proc where oid = 'public.discover_products(jsonb, text, integer, integer)'::regprocedure)
  || ' | find_gifts_secdef ' || (select prosecdef from pg_proc where oid = 'public.find_gifts(text, text, text, text, text, text, text, numeric, numeric, integer)'::regprocedure)
  || ' | discover_all_count ' || (select count(*) from public.discover_products('{}'::jsonb, 'matching', 48, 0))
  || ' | gifts_budget_count ' || (select count(*) from public.find_gifts(p_budget_max => 4000))
  || ' | save_tag_anon_exec ' || has_function_privilege('anon', 'public.save_product_discovery_tag(uuid, text, text)', 'execute')
  || ' | save_gift_config_anon_exec ' || has_function_privilege('anon', 'public.save_gift_finder_config(jsonb)', 'execute')
  || ' | new_functions ' || (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('filter_text_array', 'discovery_facets', 'discover_products', 'find_gifts', 'gift_finder_config', 'save_gift_finder_config', 'save_product_discovery_tag', 'remove_product_discovery_tag'));

commit;
