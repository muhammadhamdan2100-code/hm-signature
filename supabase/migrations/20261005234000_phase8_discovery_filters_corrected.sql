-- Phase 8 (8.3 + 8.4) correction, found by running the previous functions against the live
-- catalogue rather than reading them:
--
--   1. fragrance_family is stored as "Floral Amber" while filters are normalised lower-case, so
--      a family filter could never match. Now both sides are lower-cased.
--   2. mood / occasion / season / intensity / sillage / longevity were scored but never applied,
--      so asking for an untagged mood returned all six products. A requested facet that nothing
--      satisfies must now return nothing, which is what lets the page say "not tagged yet".
--
-- The two functions are redefined here; the earlier migration stays exactly as it was applied.

begin;

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
           lower(coalesce(p.fragrance_family, '')) as fragrance_family,
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
      and (cardinality(sel.families) = 0 or lower(p.fragrance_family) = any (sel.families))
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
        where pfn.product_id = b.id and lower(fn.name) = any (sel.notes)) as note_hit,
      cardinality(sel.moods) = 0 as moods_open,
      cardinality(sel.sillage) = 0 as sillage_open,
      cardinality(sel.longevity) = 0 as longevity_open,
      cardinality(sel.occasions) = 0 as occasions_open,
      cardinality(sel.seasons) = 0 as seasons_open,
      cardinality(sel.intensities) = 0 as intensities_open
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
    -- A facet the shopper asked for has to be satisfied. Nothing satisfies it, nothing appears.
    where (h.moods_open or h.mood_hit)
      and (h.sillage_open or h.sillage_hit)
      and (h.longevity_open or h.longevity_hit)
      and (h.occasions_open or h.occasion_hit)
      and (h.seasons_open or h.season_hit)
      and (h.intensities_open or h.intensity_hit)
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

-- The family choice in the Gift Finder arrives from the storefront, which displays the stored
-- spelling; matching is case-insensitive so the two cannot drift apart.
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
      and (p_family is null or lower(coalesce(p.fragrance_family, '')) = lower(p_family))
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
        case when p_family is not null and lower(coalesce(c.fragrance_family, '')) = lower(p_family) then 'family_match' end,
        case when c.stock_total <= 3 then 'last_pieces' end
      ], null) as reason_codes
    from cand c
  )
  select id, score, reason_codes, price, stock_total
  from scored
  order by score desc, bestseller desc, new_arrival desc, featured desc, price desc, id asc
  limit least(greatest(coalesce(p_limit, 4), 1), 8);
$$;

-- ---------------------------------------------------------------------------
-- Verification, run once at apply time. Every number below is a live count.
-- ---------------------------------------------------------------------------
select 'phase8b_fix '
  || 'family_floral_amber ' || (select count(*) from public.discover_products(jsonb_build_object('families', jsonb_build_array('floral amber')), 'matching', 48, 0))
  || ' | untagged_mood ' || (select count(*) from public.discover_products(jsonb_build_object('moods', jsonb_build_array('romantic')), 'matching', 48, 0))
  || ' | untagged_season ' || (select count(*) from public.discover_products(jsonb_build_object('seasons', jsonb_build_array('winter')), 'matching', 48, 0))
  || ' | gender_men ' || (select count(*) from public.discover_products(jsonb_build_object('genders', jsonb_build_array('men')), 'matching', 48, 0))
  || ' | no_filters ' || (select count(*) from public.discover_products('{}'::jsonb, 'matching', 48, 0))
  || ' | family_and_untagged_mood ' || (select count(*) from public.discover_products(jsonb_build_object('families', jsonb_build_array('floral amber'), 'moods', jsonb_build_array('romantic')), 'matching', 48, 0))
  || ' | gifts_family_case ' || (select count(*) from public.find_gifts(p_family => 'FLORAL AMBER'))
  || ' | gifts_budget ' || (select count(*) from public.find_gifts(p_budget_max => 4000))
  || ' | price_sort ' || (select count(*) from public.discover_products('{}'::jsonb, 'price_asc', 3, 0))
  || ' | pagination ' || (select count(*) from public.discover_products('{}'::jsonb, 'matching', 2, 4));

commit;
