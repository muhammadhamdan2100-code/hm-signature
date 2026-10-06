-- Phase 8 follow-up, found by running the new test suite against the live database rather than by
-- reading the code: after privileges hygiene revoked anon's inherited SELECT on product_views,
-- recommend_products stopped answering guests at all.
--
--   401 permission denied for table product_views
--
-- A SECURITY INVOKER function needs the caller to hold the table grant even when row-level security
-- would have returned zero rows: the privilege is checked when the query is set up, before any
-- filter runs. So the guest path is taken off that table entirely. The recent-views seed now comes
-- from a definer helper that names auth.uid() in its own WHERE clause, which means an anonymous
-- caller gets an empty list and a signed-in caller can only ever see their own history.

begin;

create or replace function public.my_recent_view_ids(p_days integer default 90)
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select array_agg(v.product_id)
      from (
        select pv.product_id
        from public.product_views pv
        where pv.customer_id = auth.uid()
          and pv.viewed_at > now() - make_interval(
            days => least(greatest(coalesce(p_days, 90), 1), 365)
          )
        order by pv.viewed_at desc
        limit 12
      ) v
    ),
    '{}'::uuid[]
  );
$$;

comment on function public.my_recent_view_ids(integer) is
  'The caller''s own recently viewed fragrances, capped and windowed. Empty for anyone with no session, because there is no history to read.';

revoke execute on function public.my_recent_view_ids(integer) from public;
grant execute on function public.my_recent_view_ids(integer) to anon, authenticated, service_role;

-- The seed arm that read the table directly is replaced; everything else is unchanged.
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
seed as (
  select p_product_id as product_id
  where p_product_id is not null
  union
  select v.product_id
  from unnest(public.my_recent_view_ids(
    (select least(greatest(coalesce(nullif(public.personalization_config() ->> 'viewHistoryDays', '')::integer, 90), 1), 365))
  )) as v(product_id)
  where p_kind in ('recommended_for_you', 'because_you_viewed', 'you_may_also_like', 'similar_fragrances', 'complete_your_collection')
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
  'Deterministic, explainable recommendations over stored attributes and real orders. Reads a guest''s own browser history only through the caller''s parameters, never through a table it cannot see.';

revoke execute on function public.recommend_products(text, uuid, uuid[], integer, text) from public;
grant execute on function public.recommend_products(text, uuid, uuid[], integer, text) to anon, authenticated, service_role;

-- Verification, run once at apply time. These are live anonymous reads.
select 'phase8a_guest_fix '
  || 'helper_secdef ' || (select prosecdef from pg_proc where oid = 'public.my_recent_view_ids(integer)'::regprocedure)
  || ' | helper_anon_exec ' || has_function_privilege('anon', 'public.my_recent_view_ids(integer)', 'execute')
  || ' | helper_rows_anon ' || (select coalesce(array_length(public.my_recent_view_ids(90), 1), -1))
  || ' | rails_for_guest ' || (select count(*) from public.recommend_products('recommended_for_you', null, null, 4, null))
  || ' | rails_basis ' || coalesce((select distinct basis from public.recommend_products('recommended_for_you', null, null, 4, null)), 'none')
  || ' | seeded_rail ' || (select count(*) from public.recommend_products('similar_fragrances', (select id from public.products where active limit 1), null, 3, null))
  || ' | discovery_still_works ' || (select count(*) from public.discover_products('{}'::jsonb, 'matching', 48, 0));

commit;
