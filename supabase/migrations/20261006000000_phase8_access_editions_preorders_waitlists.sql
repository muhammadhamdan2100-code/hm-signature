-- Phase 8 (8.8 - 8.11): exclusive collections, limited editions, pre-orders and waitlists.
--
-- Access control here is done with RESTRICTIVE policies. Existing SELECT policies on products and
-- collections are permissive, so several of them overlap and OR together — tightening one of the
-- duplicated pairs would change nothing. A restrictive policy is ANDed onto the result instead, so
-- the new rule applies to every reader without editing the policies the whole app already depends on.
--
-- Limited editions deliberately keep no counter of their own: remaining stock is the real sum of
-- variant stock, which is the only number place_order decrements. Two sources of truth for one
-- bottle is how overselling happens.

begin;

-- ===========================================================================
-- 8.8 Exclusive collections
-- ===========================================================================
alter table public.collections add column if not exists visibility text not null default 'Public'
  check (visibility in ('Public', 'Members', 'Vip', 'Private', 'Scheduled'));
alter table public.collections add column if not exists visible_from timestamptz;
alter table public.collections add column if not exists visible_until timestamptz;
alter table public.collections add column if not exists min_tier_rank integer
  check (min_tier_rank is null or min_tier_rank between 1 and 20);
alter table public.collections add column if not exists country_codes text[] not null default '{}';

comment on column public.collections.visibility is
  'Who may see this collection. Enforced in the database by a restrictive policy, not by hiding buttons.';
comment on column public.collections.country_codes is
  'Countries this collection is offered in, as ISO-2 codes. Empty means everywhere. Advisory at the storefront: a shopper''s country is a session choice, not verified data.';

create or replace function public.can_see_collection(p_collection_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_collection public.collections%rowtype;
  v_viewer uuid := auth.uid();
  v_rank integer;
begin
  select * into v_collection from public.collections where id = p_collection_id;
  if not found then
    return false;
  end if;

  -- Staff keep seeing everything, or the admin panel cannot edit what it already owns.
  if v_viewer is not null and public.is_staff() then
    return true;
  end if;

  if v_collection.visibility = 'Private' then
    return false;
  end if;

  if v_collection.visible_from is not null and v_collection.visible_from > now() then
    return false;
  end if;
  if v_collection.visible_until is not null and v_collection.visible_until < now() then
    return false;
  end if;

  if v_collection.visibility in ('Members', 'Vip') and v_viewer is null then
    return false;
  end if;

  if v_collection.visibility = 'Vip' then
    if v_collection.min_tier_rank is null then
      -- Asked for a tier but never set one. Fail closed rather than let everyone in.
      return false;
    end if;
    select t.rank into v_rank
    from public.vip_tiers t
    join public.profiles p on p.vip_tier_code = t.code
    where p.id = v_viewer;
    if v_rank is null or v_rank < v_collection.min_tier_rank then
      return false;
    end if;
  end if;

  return true;
end;
$$;

comment on function public.can_see_collection(uuid) is
  'The single answer to "may this viewer see this collection", used by the restrictive policies below.';

revoke execute on function public.can_see_collection(uuid) from public;
grant execute on function public.can_see_collection(uuid) to anon, authenticated, service_role;

create or replace function public.can_see_product(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.collection_id is null then true
    else public.can_see_collection(p.collection_id)
  end
  from public.products p
  where p.id = p_product_id;
$$;

revoke execute on function public.can_see_product(uuid) from public;
grant execute on function public.can_see_product(uuid) to anon, authenticated, service_role;

-- Restrictive: ANDed onto whatever permissive policies already allow.
drop policy if exists "Exclusive collections gate" on public.collections;
create policy "Exclusive collections gate"
  on public.collections as restrictive
  for select
  to anon, authenticated
  using (public.can_see_collection(id));

drop policy if exists "Exclusive collection products gate" on public.products;
create policy "Exclusive collection products gate"
  on public.products as restrictive
  for select
  to anon, authenticated
  using (public.can_see_product(id));

-- A country list is only advisory in the browser, so it is exposed as data the storefront reads,
-- not claimed as enforcement.
create or replace function public.collection_availability(p_collection_id uuid, p_country_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'visible', public.can_see_collection(c.id),
    'countryOffered', c.country_codes = '{}'
      or upper(trim(coalesce(p_country_code, ''))) = any (select upper(x) from unnest(c.country_codes) x),
    'visibility', c.visibility,
    'visibleFrom', c.visible_from,
    'visibleUntil', c.visible_until
  )
  from public.collections c
  where c.id = p_collection_id;
$$;

revoke execute on function public.collection_availability(uuid, text) from public;
grant execute on function public.collection_availability(uuid, text) to anon, authenticated, service_role;

create or replace function public.save_collection_access(
  p_collection_id uuid,
  p_visibility text,
  p_visible_from timestamptz,
  p_visible_until timestamptz,
  p_min_tier_rank integer,
  p_country_codes text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
begin
  if not public.has_permission(auth.uid(), 'manage_cms') and not public.is_super_admin() then
    raise exception 'You are not authorised to change collection access.';
  end if;
  if p_visibility not in ('Public', 'Members', 'Vip', 'Private', 'Scheduled') then
    raise exception 'That is not a collection visibility rule.';
  end if;
  if p_visibility = 'Scheduled' and p_visible_from is null and p_visible_until is null then
    raise exception 'A scheduled collection needs a start or an end date.';
  end if;
  if p_visibility = 'Vip' and p_min_tier_rank is null then
    raise exception 'A VIP collection needs the tier rank it starts at.';
  end if;
  if p_visible_from is not null and p_visible_until is not null and p_visible_until <= p_visible_from then
    raise exception 'The end of the window must come after its start.';
  end if;

  select exists (select 1 from public.collections where id = p_collection_id) into v_exists;
  if not v_exists then
    raise exception 'That collection does not exist.';
  end if;

  update public.collections
     set visibility = p_visibility,
         visible_from = p_visible_from,
         visible_until = p_visible_until,
         min_tier_rank = case when p_visibility = 'Vip' then p_min_tier_rank else null end,
         country_codes = coalesce(p_country_codes, '{}'),
         updated_at = now()
   where id = p_collection_id;

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.save_collection_access(uuid, text, timestamptz, timestamptz, integer, text[])
  from public, anon;
grant execute on function public.save_collection_access(uuid, text, timestamptz, timestamptz, integer, text[])
  to authenticated, service_role;

-- ===========================================================================
-- 8.9 Limited editions. edition_total is a promise; what is left is real stock.
-- ===========================================================================
alter table public.products add column if not exists is_limited_edition boolean not null default false;
alter table public.products add column if not exists edition_total integer;
alter table public.products add column if not exists edition_number text;
alter table public.products add column if not exists edition_released_on date;
alter table public.products add column if not exists edition_ends_on date;

alter table public.products drop constraint if exists products_limited_edition_coherence;
alter table public.products add constraint products_limited_edition_coherence check (
  not is_limited_edition
  or (edition_total is not null and edition_total > 0)
);

comment on column public.products.edition_total is
  'How many pieces the house released. Remaining is derived from variant stock, never stored here.';

create or replace function public.edition_remaining(p_product_id uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce((select sum(v.stock)::integer from public.product_variants v
                   where v.product_id = p_product_id and v.active = true), 0);
$$;

revoke execute on function public.edition_remaining(uuid) from public;
grant execute on function public.edition_remaining(uuid) to anon, authenticated, service_role;

create or replace function public.save_product_edition(
  p_product_id uuid,
  p_is_limited boolean,
  p_edition_total integer,
  p_edition_number text,
  p_released_on date,
  p_ends_on date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock integer;
begin
  if not public.has_permission(auth.uid(), 'manage_products') and not public.is_super_admin() then
    raise exception 'You are not authorised to change edition details.';
  end if;
  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'That fragrance does not exist.';
  end if;
  if p_is_limited then
    if p_edition_total is null or p_edition_total <= 0 then
      raise exception 'A limited edition needs the number of pieces released.';
    end if;
    select coalesce(sum(v.stock), 0)::integer into v_stock
    from public.product_variants v
    where v.product_id = p_product_id and v.active = true;
    if p_edition_total < v_stock then
      raise exception 'You released % pieces but % are in stock. Keep the edition at or above what the shop holds.',
        p_edition_total, v_stock;
    end if;
  end if;

  update public.products
     set is_limited_edition = coalesce(p_is_limited, false),
         edition_total = case when coalesce(p_is_limited, false) then p_edition_total else null end,
         edition_number = case when coalesce(p_is_limited, false) then nullif(trim(coalesce(p_edition_number, '')), '') else null end,
         edition_released_on = case when coalesce(p_is_limited, false) then p_released_on else null end,
         edition_ends_on = case when coalesce(p_is_limited, false) then p_ends_on else null end,
         updated_at = now()
   where id = p_product_id;

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.save_product_edition(uuid, boolean, integer, text, date, date) from public, anon;
grant execute on function public.save_product_edition(uuid, boolean, integer, text, date, date) to authenticated, service_role;

-- ===========================================================================
-- 8.10 Pre-orders
-- ===========================================================================
alter table public.products add column if not exists pre_order_enabled boolean not null default false;
alter table public.products add column if not exists pre_order_release_on date;
alter table public.products add column if not exists pre_order_max_quantity integer
  check (pre_order_max_quantity is null or pre_order_max_quantity > 0);

create table if not exists public.pre_orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  customer_id uuid references public.profiles (id) on delete cascade,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  quantity integer not null check (quantity between 1 and 50),
  status text not null default 'Reserved' check (
    status in ('Open', 'Reserved', 'Payment Pending', 'Confirmed', 'Released', 'Fulfilled', 'Cancelled')
  ),
  expected_release_on date,
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pre_orders is
  'A promise to buy a fragrance that is not sellable yet. Stock is never moved here; it moves when a real order is placed.';

create index if not exists pre_orders_product_idx on public.pre_orders (product_id, status);
create index if not exists pre_orders_customer_idx on public.pre_orders (customer_id, created_at desc);

-- One live pre-order per customer per fragrance size.
create unique index if not exists pre_orders_live_uidx
  on public.pre_orders (
    product_id,
    coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(customer_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where status <> 'Cancelled';

alter table public.pre_orders enable row level security;

drop policy if exists "Customers read own pre-orders" on public.pre_orders;
create policy "Customers read own pre-orders"
  on public.pre_orders for select
  to authenticated
  using (customer_id = auth.uid());

drop policy if exists "Staff read pre-orders" on public.pre_orders;
create policy "Staff read pre-orders"
  on public.pre_orders for select
  to authenticated
  using (public.is_staff());

revoke insert, update, delete, truncate, references, trigger on public.pre_orders from anon, authenticated;
grant select on public.pre_orders to authenticated;

create or replace function public.reserve_pre_order(
  p_product_id uuid,
  p_variant_id uuid,
  p_quantity integer,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_viewer uuid := auth.uid();
  v_reserved integer;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_row public.pre_orders;
begin
  if v_viewer is null then
    raise exception 'Sign in to reserve a pre-order.';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 50 then
    raise exception 'A pre-order is between 1 and 50 pieces.';
  end if;

  select * into v_product from public.products where id = p_product_id for update;
  if not found or v_product.active is not true then
    raise exception 'That fragrance is not available.';
  end if;
  if not v_product.pre_order_enabled then
    raise exception 'This fragrance is not open for pre-order.';
  end if;
  if v_product.pre_order_release_on is null or v_product.pre_order_release_on <= current_date then
    raise exception 'This pre-order has no future release date set.';
  end if;
  if v_email = '' or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Give an email address we can reach you on.';
  end if;
  if p_variant_id is not null and not exists (
    select 1 from public.product_variants v where v.id = p_variant_id and v.product_id = p_product_id and v.active = true
  ) then
    raise exception 'That bottle size is not offered.';
  end if;

  if v_product.pre_order_max_quantity is not null then
    select coalesce(sum(quantity), 0)::integer into v_reserved
    from public.pre_orders
    where product_id = p_product_id and status <> 'Cancelled';
    if v_reserved + p_quantity > v_product.pre_order_max_quantity then
      raise exception 'Only % pieces of this pre-order are left.',
        greatest(v_product.pre_order_max_quantity - v_reserved, 0);
    end if;
  end if;

  insert into public.pre_orders (product_id, variant_id, customer_id, email, quantity, status, expected_release_on)
  values (p_product_id, p_variant_id, v_viewer, v_email, p_quantity, 'Reserved', v_product.pre_order_release_on)
  returning * into v_row;

  return jsonb_build_object(
    'success', true, 'id', v_row.id, 'status', v_row.status,
    'expectedReleaseOn', v_row.expected_release_on, 'quantity', v_row.quantity
  );
exception
  when unique_violation then
    raise exception 'You already hold a pre-order for this fragrance.';
end;
$$;

revoke execute on function public.reserve_pre_order(uuid, uuid, integer, text) from public, anon;
grant execute on function public.reserve_pre_order(uuid, uuid, integer, text) to authenticated, service_role;

create or replace function public.cancel_my_pre_order(p_pre_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viewer uuid := auth.uid();
  v_row public.pre_orders%rowtype;
begin
  if v_viewer is null then
    raise exception 'Sign in to manage your pre-orders.';
  end if;
  select * into v_row from public.pre_orders where id = p_pre_order_id for update;
  if not found or v_row.customer_id is distinct from v_viewer then
    raise exception 'That pre-order was not found on your account.';
  end if;
  if v_row.status in ('Fulfilled', 'Cancelled') then
    raise exception 'This pre-order can no longer be cancelled.';
  end if;

  update public.pre_orders set status = 'Cancelled', updated_at = now() where id = p_pre_order_id;
  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.cancel_my_pre_order(uuid) from public, anon;
grant execute on function public.cancel_my_pre_order(uuid) to authenticated, service_role;

-- Staff move a pre-order along. Fulfilment is only ever possible against a real, paid order,
-- which is the rule the brief asks for: no "fulfilled" before stock and payment actually moved.
create or replace function public.set_pre_order_status(p_pre_order_id uuid, p_status text, p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.pre_orders%rowtype;
  v_order public.orders%rowtype;
begin
  if not public.is_staff() then
    raise exception 'Only staff can change a pre-order.';
  end if;
  if p_status not in ('Reserved', 'Payment Pending', 'Confirmed', 'Released', 'Fulfilled', 'Cancelled') then
    raise exception 'That is not a pre-order status.';
  end if;

  select * into v_row from public.pre_orders where id = p_pre_order_id for update;
  if not found then
    raise exception 'That pre-order was not found.';
  end if;

  if p_status = 'Fulfilled' then
    if p_order_id is null and v_row.order_id is null then
      raise exception 'A pre-order is only fulfilled against a real order.';
    end if;
    select * into v_order from public.orders where id = coalesce(p_order_id, v_row.order_id);
    if not found then
      raise exception 'The linked order could not be found.';
    end if;
    if v_order.payment_status not in ('Paid', 'Verified') then
      raise exception 'The linked order is not paid yet, so it cannot be fulfilled.';
    end if;
  end if;

  update public.pre_orders
     set status = p_status,
         order_id = coalesce(p_order_id, order_id),
         updated_at = now()
   where id = p_pre_order_id;

  return jsonb_build_object('success', true, 'status', p_status);
end;
$$;

revoke execute on function public.set_pre_order_status(uuid, text, uuid) from public, anon;
grant execute on function public.set_pre_order_status(uuid, text, uuid) to authenticated, service_role;

-- ===========================================================================
-- 8.11 Waitlists
-- ===========================================================================
create table if not exists public.waitlists (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  customer_id uuid references public.profiles (id) on delete cascade,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  country_code text,
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  status text not null default 'Waiting' check (status in ('Waiting', 'Notified', 'Purchased', 'Cancelled')),
  created_at timestamptz not null default now(),
  notified_at timestamptz
);

comment on table public.waitlists is
  'Shoppers waiting for a fragrance, size, edition or collection to come back. Notification is queued, never assumed sent.';

create index if not exists waitlists_product_idx on public.waitlists (product_id, status);

create unique index if not exists waitlists_live_uidx
  on public.waitlists (
    product_id,
    coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(email)
  )
  where status in ('Waiting', 'Notified');

alter table public.waitlists enable row level security;

drop policy if exists "Customers read own waitlist entries" on public.waitlists;
create policy "Customers read own waitlist entries"
  on public.waitlists for select
  to authenticated
  using (customer_id = auth.uid());

drop policy if exists "Staff read waitlists" on public.waitlists;
create policy "Staff read waitlists"
  on public.waitlists for select
  to authenticated
  using (public.is_staff());

revoke insert, update, delete, truncate, references, trigger on public.waitlists from anon, authenticated;
grant select on public.waitlists to authenticated;

create or replace function public.join_waitlist(
  p_product_id uuid,
  p_variant_id uuid,
  p_email text,
  p_country_code text,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_viewer uuid := auth.uid();
  v_row public.waitlists;
begin
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Give an email address we can reach you on.';
  end if;
  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'That fragrance does not exist.';
  end if;
  if p_variant_id is not null and not exists (
    select 1 from public.product_variants v where v.id = p_variant_id and v.product_id = p_product_id
  ) then
    raise exception 'That bottle size is not offered.';
  end if;

  insert into public.waitlists (product_id, variant_id, customer_id, email, country_code, currency)
  values (
    p_product_id, p_variant_id, v_viewer, v_email,
    nullif(upper(trim(coalesce(p_country_code, ''))), ''),
    nullif(upper(trim(coalesce(p_currency, ''))), '')
  )
  returning * into v_row;

  return jsonb_build_object('success', true, 'id', v_row.id, 'status', v_row.status);
exception
  when unique_violation then
    return jsonb_build_object('success', true, 'alreadyOnList', true);
end;
$$;

revoke execute on function public.join_waitlist(uuid, uuid, text, text, text) from public;
grant execute on function public.join_waitlist(uuid, uuid, text, text, text) to anon, authenticated, service_role;

create or replace function public.leave_waitlist(p_waitlist_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viewer uuid := auth.uid();
begin
  if v_viewer is null then
    raise exception 'Sign in to leave the waitlist.';
  end if;
  delete from public.waitlists where id = p_waitlist_id and customer_id = v_viewer;
  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.leave_waitlist(uuid) from public, anon;
grant execute on function public.leave_waitlist(uuid) to authenticated, service_role;

-- Queueing a notification uses the existing outbox. With no SMTP configured the row simply waits,
-- which is the truth; nothing here claims an email was sent.
create or replace function public.notify_waitlist(p_waitlist_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.waitlists%rowtype;
  v_product public.products%rowtype;
begin
  if not public.is_staff() then
    raise exception 'Only staff can notify the waitlist.';
  end if;
  select * into v_row from public.waitlists where id = p_waitlist_id for update;
  if not found then
    raise exception 'That waitlist entry was not found.';
  end if;
  if v_row.status <> 'Waiting' then
    raise exception 'This entry has already been handled.';
  end if;

  select * into v_product from public.products where id = v_row.product_id;

  perform public.enqueue_email(
    'waitlist-' || v_row.id::text,
    'waitlist_available',
    'customer',
    v_row.email,
    coalesce(v_product.name, 'A fragrance') || ' is available again',
    jsonb_build_object('productId', v_row.product_id, 'productSlug', v_product.slug, 'waitlistId', v_row.id),
    null
  );

  update public.waitlists set status = 'Notified', notified_at = now() where id = p_waitlist_id;
  return jsonb_build_object('success', true, 'queued', true);
end;
$$;

revoke execute on function public.notify_waitlist(uuid) from public, anon;
grant execute on function public.notify_waitlist(uuid) to authenticated, service_role;

-- ===========================================================================
-- Verification, run once at apply time. Every count is read from the live schema.
-- ===========================================================================
select 'phase8e '
  || 'collection_columns ' || (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'collections' and column_name in ('visibility', 'visible_from', 'visible_until', 'min_tier_rank', 'country_codes'))
  || ' | restrictive_policies ' || (select count(*) from pg_policies where schemaname = 'public' and permissive = 'RESTRICTIVE')
  || ' | product_columns ' || (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name in ('is_limited_edition', 'edition_total', 'edition_number', 'edition_released_on', 'edition_ends_on', 'pre_order_enabled', 'pre_order_release_on', 'pre_order_max_quantity'))
  || ' | edition_check ' || (select count(*) from pg_constraint where conname = 'products_limited_edition_coherence')
  || ' | preorder_columns ' || (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'pre_orders')
  || ' | waitlist_columns ' || (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'waitlists')
  || ' | pre_orders_rows ' || (select count(*) from public.pre_orders)
  || ' | waitlist_rows ' || (select count(*) from public.waitlists)
  || ' | exclusive_collections_today ' || (select count(*) from public.collections where visibility <> 'Public')
  || ' | public_collections_still_visible ' || (select count(*) from public.collections where public.can_see_collection(id))
  || ' | products_visible_anon ' || (select count(*) from public.products)
  || ' | reserve_anon_exec ' || has_function_privilege('anon', 'public.reserve_pre_order(uuid, uuid, integer, text)', 'execute')
  || ' | join_waitlist_anon_exec ' || has_function_privilege('anon', 'public.join_waitlist(uuid, uuid, text, text, text)', 'execute')
  || ' | notify_anon_exec ' || has_function_privilege('anon', 'public.notify_waitlist(uuid)', 'execute')
  || ' | save_access_anon_exec ' || has_function_privilege('anon', 'public.save_collection_access(uuid, text, timestamptz, timestamptz, integer, text[])', 'execute');

commit;
