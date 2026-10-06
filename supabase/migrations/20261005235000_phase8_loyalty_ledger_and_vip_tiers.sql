-- Phase 8 (8.6 + 8.7): loyalty ledger and VIP tiers.
--
-- Two decisions shape this file.
--
-- 1. There is no points balance anywhere. A balance is whatever the ledger sums to, so no code can
--    "set" it; every change is an immutable append. Rows cannot be updated or deleted by anyone but
--    the append functions, and the ledger records who wrote each entry.
-- 2. The shop's business rules are not invented here. The programme is created DISABLED with no
--    earning rate, no conversion rate and no tier thresholds, because HM Signature has not defined
--    them. Every function refuses to compute against a missing rule and says so, instead of
--    guessing a number that would then quietly become real money.
--
-- Points are earned only when an order genuinely becomes paid, and a cancellation returns exactly
-- what was redeemed — never more, because a compensating entry is written once per order.

begin;

-- ---------------------------------------------------------------------------
-- 8.6 Programme configuration
-- ---------------------------------------------------------------------------
insert into public.site_settings (key, value, description)
values (
  'loyalty_config',
  $json${
    "enabled": false,
    "pointsPerUnit": null,
    "conversionRate": null,
    "minRedeemPoints": null,
    "maxRedeemPercent": null,
    "expiryDays": null,
    "earnOn": {
      "purchase": false,
      "signup": false,
      "review": false,
      "referral": false,
      "birthday": false,
      "campaign": false
    },
    "eligibleCategoryIds": []
  }$json$,
  'Loyalty rules. Null rates mean the shop has not set them, and the ledger will not earn or redeem until it does.'
)
on conflict (key) do nothing;

create or replace function public.loyalty_config()
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce((select value from public.site_settings where key = 'loyalty_config'), '{}'::jsonb);
$$;

revoke execute on function public.loyalty_config() from public;
grant execute on function public.loyalty_config() to anon, authenticated, service_role;

create or replace function public.save_loyalty_config(p_config jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean jsonb;
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can change loyalty rules.';
  end if;
  if p_config is null or jsonb_typeof(p_config) <> 'object' then
    raise exception 'Loyalty rules must be an object.';
  end if;

  -- A rate is stored only if it is a real, finite, non-negative number. Anything else becomes null,
  -- which keeps "not configured" distinguishable from "configured as zero".
  select jsonb_build_object(
    'enabled', coalesce((p_config ->> 'enabled')::boolean, false),
    'pointsPerUnit', case
      when jsonb_typeof(p_config -> 'pointsPerUnit') = 'number'
        and (p_config ->> 'pointsPerUnit')::numeric >= 0
        and (p_config ->> 'pointsPerUnit')::numeric <= 1000
      then (p_config -> 'pointsPerUnit') end,
    'conversionRate', case
      when jsonb_typeof(p_config -> 'conversionRate') = 'number'
        and (p_config ->> 'conversionRate')::numeric > 0
        and (p_config ->> 'conversionRate')::numeric <= 1000000
      then (p_config -> 'conversionRate') end,
    'minRedeemPoints', case
      when jsonb_typeof(p_config -> 'minRedeemPoints') = 'number'
        and (p_config ->> 'minRedeemPoints')::numeric >= 0
      then (p_config -> 'minRedeemPoints')::integer end,
    'maxRedeemPercent', case
      when jsonb_typeof(p_config -> 'maxRedeemPercent') = 'number'
        and (p_config ->> 'maxRedeemPercent')::numeric between 1 and 100
      then (p_config -> 'maxRedeemPercent')::integer end,
    'expiryDays', case
      when jsonb_typeof(p_config -> 'expiryDays') = 'number'
        and (p_config ->> 'expiryDays')::numeric between 1 and 3650
      then (p_config ->> 'expiryDays')::integer end,
    'earnOn', coalesce(p_config -> 'earnOn', jsonb_build_object(
      'purchase', false, 'signup', false, 'review', false,
      'referral', false, 'birthday', false, 'campaign', false)),
    'eligibleCategoryIds', coalesce(p_config -> 'eligibleCategoryIds', '[]'::jsonb)
  ) into v_clean;

  -- Turning the programme on without the rates it needs would promise rewards it cannot compute.
  if (v_clean ->> 'enabled')::boolean then
    if v_clean -> 'pointsPerUnit' is null or v_clean -> 'pointsPerUnit' = 'null'::jsonb then
      raise exception 'Set how many points a customer earns per unit of currency first.';
    end if;
    if v_clean -> 'conversionRate' is null or v_clean -> 'conversionRate' = 'null'::jsonb then
      raise exception 'Set how many points are worth one unit of currency first.';
    end if;
  end if;

  insert into public.site_settings (key, value, updated_at)
  values ('loyalty_config', v_clean, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();

  return jsonb_build_object('success', true, 'value', v_clean);
end;
$$;

revoke execute on function public.save_loyalty_config(jsonb) from public, anon;
grant execute on function public.save_loyalty_config(jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8.6 The ledger. Append-only.
-- ---------------------------------------------------------------------------
create table if not exists public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  points integer not null check (points <> 0),
  entry_type text not null check (
    entry_type in ('earn_purchase', 'earn_signup', 'earn_review', 'earn_referral', 'earn_birthday',
                   'earn_campaign', 'redeem', 'cancel_reversal', 'expire', 'adjust')
  ),
  reason text,
  order_id uuid references public.orders (id) on delete set null,
  written_by uuid,
  expires_at timestamptz,
  occurred_at timestamptz not null default now()
);

comment on table public.loyalty_ledger is
  'Immutable loyalty movements. A balance is the sum of these rows; nothing else can state one.';

create index if not exists loyalty_ledger_customer_idx on public.loyalty_ledger (customer_id, occurred_at desc);
create index if not exists loyalty_ledger_order_idx on public.loyalty_ledger (order_id);

-- One earning row per order, one redemption row per order, one reversal per order.
create unique index if not exists loyalty_ledger_earn_order_uidx
  on public.loyalty_ledger (order_id)
  where entry_type = 'earn_purchase' and order_id is not null;
create unique index if not exists loyalty_ledger_redeem_order_uidx
  on public.loyalty_ledger (order_id)
  where entry_type = 'redeem' and order_id is not null;
create unique index if not exists loyalty_ledger_reversal_order_uidx
  on public.loyalty_ledger (order_id)
  where entry_type = 'cancel_reversal' and order_id is not null;

alter table public.loyalty_ledger enable row level security;

drop policy if exists "Customers read own loyalty ledger" on public.loyalty_ledger;
create policy "Customers read own loyalty ledger"
  on public.loyalty_ledger for select
  to authenticated
  using (customer_id = auth.uid());

drop policy if exists "Staff read loyalty ledger" on public.loyalty_ledger;
create policy "Staff read loyalty ledger"
  on public.loyalty_ledger for select
  to authenticated
  using (public.is_staff());

-- No INSERT/UPDATE/DELETE policy at all: only the definer writers below can append, and nothing
-- here can change or remove an existing entry.
revoke update, delete, truncate, references, trigger on public.loyalty_ledger from anon, authenticated;
revoke insert on public.loyalty_ledger from anon, authenticated;
grant select on public.loyalty_ledger to authenticated;

-- ---------------------------------------------------------------------------
-- 8.6 Order columns. Defaults keep every existing order untouched.
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists loyalty_points_used integer not null default 0
  check (loyalty_points_used >= 0);
alter table public.orders add column if not exists loyalty_discount numeric not null default 0
  check (loyalty_discount >= 0);

comment on column public.orders.loyalty_points_used is
  'Points applied to this order by redeem_loyalty_points. Written by the server only.';

-- ---------------------------------------------------------------------------
-- 8.7 VIP tiers, declared before the functions that read them: Postgres validates
-- a SQL function body at creation time, so the table and column must already exist.
-- The ladder exists because the brief names it; the thresholds are null because
-- HM Signature has not set them, and an unconfigured tier assigns nobody.
-- ---------------------------------------------------------------------------
create table if not exists public.vip_tiers (
  code text primary key check (code ~ '^[a-z][a-z_]{1,39}$'),
  name text not null,
  rank integer not null unique check (rank between 1 and 20),
  min_lifetime_spend numeric check (min_lifetime_spend is null or min_lifetime_spend >= 0),
  min_points integer check (min_points is null or min_points >= 0),
  benefits jsonb not null default '[]'::jsonb,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table public.vip_tiers is
  'Configurable VIP ladder. A tier with no thresholds is shown as not configured and assigns no customer.';

insert into public.vip_tiers (code, name, rank) values
  ('member', 'Member', 1),
  ('silver', 'Silver', 2),
  ('gold', 'Gold', 3),
  ('platinum', 'Platinum', 4),
  ('private_client', 'Private Client', 5)
on conflict (code) do nothing;

alter table public.vip_tiers enable row level security;

drop policy if exists "Staff read VIP tiers" on public.vip_tiers;
create policy "Staff read VIP tiers"
  on public.vip_tiers for select
  to authenticated
  using (public.is_staff());

revoke insert, update, delete, truncate, references, trigger on public.vip_tiers from anon, authenticated;
grant select on public.vip_tiers to authenticated;

alter table public.profiles add column if not exists vip_tier_code text not null default 'member';

comment on column public.profiles.vip_tier_code is
  'Derived from real paid orders and the loyalty ledger by refresh_customer_vip_tier. Never edited by hand.';

-- ---------------------------------------------------------------------------
-- 8.6 Balance reading. FIFO allocation makes "expiring soon" honest: a redemption
-- consumes the oldest points first, so only what genuinely survives can expire.
-- ---------------------------------------------------------------------------
create or replace function public.loyalty_balance(p_customer_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select sum(points)::integer from public.loyalty_ledger where customer_id = p_customer_id), 0);
$$;

revoke execute on function public.loyalty_balance(uuid) from public, anon;
grant execute on function public.loyalty_balance(uuid) to authenticated, service_role;

create or replace function public.my_loyalty()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with l as (
    select points, entry_type, occurred_at, expires_at
    from public.loyalty_ledger
    where customer_id = auth.uid()
  ),
  pos as (
    select points, occurred_at, expires_at,
           sum(points) over (order by occurred_at, expires_at nulls last) as cum
    from l
    where points > 0
  ),
  neg as (
    select coalesce(sum(-points), 0)::bigint as used from l where points < 0
  ),
  remaining as (
    select p.points - greatest(0, least(p.points, n.used - (p.cum - p.points)))::integer as left_points,
           p.expires_at
    from pos p cross join neg n
  )
  select jsonb_build_object(
    'configured', (select coalesce((select value -> 'enabled' from public.site_settings where key = 'loyalty_config'), 'false'::jsonb)),
    'balance', coalesce((select sum(points)::integer from l), 0),
    'lifetimeEarned', coalesce((select sum(points)::integer from l where points > 0 and entry_type like 'earn%'), 0),
    'lifetimeRedeemed', coalesce((select sum(-points)::integer from l where entry_type = 'redeem'), 0),
    'expiringIn90Days', coalesce((
      select sum(left_points) from remaining
      where expires_at is not null and expires_at > now() and expires_at < now() + interval '90 days'
    ), 0),
    'expired', coalesce((select sum(-points)::integer from l where entry_type = 'expire'), 0),
    'tier', (select coalesce(p.vip_tier_code, 'member') from public.profiles p where p.id = auth.uid()),
    'lifetimeSpend', coalesce((
      select sum(o.total) from public.orders o
      where o.customer_id = auth.uid() and o.status <> 'Cancelled' and o.payment_status in ('Paid', 'Verified')
    ), 0)
  );
$$;

revoke execute on function public.my_loyalty() from public, anon;
grant execute on function public.my_loyalty() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8.6 Earning. Fires when an order genuinely becomes paid.
-- ---------------------------------------------------------------------------
create or replace function public.earn_loyalty_on_paid_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_config jsonb := public.loyalty_config();
  v_enabled boolean := coalesce((v_config ->> 'enabled')::boolean, false);
  v_earn_purchase boolean := coalesce((v_config -> 'earnOn' ->> 'purchase')::boolean, false);
  v_rate numeric := case when jsonb_typeof(v_config -> 'pointsPerUnit') = 'number' then (v_config ->> 'pointsPerUnit')::numeric else null end;
  v_points integer;
  v_expiry integer := case when jsonb_typeof(v_config -> 'expiryDays') = 'number' then (v_config ->> 'expiryDays')::integer else null end;
begin
  if not v_enabled or not v_earn_purchase or new.customer_id is null then
    return new;
  end if;
  if v_rate is null or v_rate <= 0 then
    -- Enabled without a rate: refuse rather than invent one.
    return new;
  end if;
  if new.payment_status not in ('Paid', 'Verified') or new.status = 'Cancelled' then
    return new;
  end if;
  if exists (select 1 from public.loyalty_ledger where order_id = new.id and entry_type = 'earn_purchase') then
    return new;
  end if;

  v_points := floor(coalesce(new.total, 0) * v_rate)::integer;
  if v_points <= 0 then
    return new;
  end if;

  insert into public.loyalty_ledger (customer_id, points, entry_type, reason, order_id, written_by, expires_at)
  values (
    new.customer_id, v_points, 'earn_purchase',
    'Purchase ' || coalesce(new.order_number, new.id::text),
    new.id, auth.uid(),
    case when v_expiry is not null then now() + make_interval(days => v_expiry) else null end
  );

  return new;
exception
  when unique_violation then
    return new;
end;
$$;

drop trigger if exists trg_loyalty_earn_on_paid on public.orders;
create trigger trg_loyalty_earn_on_paid
  after update of payment_status, total on public.orders
  for each row execute function public.earn_loyalty_on_paid_order();

drop trigger if exists trg_loyalty_earn_on_insert on public.orders;
create trigger trg_loyalty_earn_on_insert
  after insert on public.orders
  for each row execute function public.earn_loyalty_on_paid_order();

-- ---------------------------------------------------------------------------
-- 8.6 Cancellation returns redeemed points. Only an insert happens here, so the
-- trigger on orders cannot re-enter itself.
-- ---------------------------------------------------------------------------
create or replace function public.reverse_loyalty_on_cancellation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redeemed integer;
begin
  if new.status <> 'Cancelled' or old.status = 'Cancelled' or new.loyalty_points_used <= 0 then
    return new;
  end if;
  if exists (select 1 from public.loyalty_ledger where order_id = new.id and entry_type = 'cancel_reversal') then
    return new;
  end if;

  select coalesce(sum(-points), 0)::integer into v_redeemed
  from public.loyalty_ledger
  where order_id = new.id and entry_type = 'redeem';

  if v_redeemed > 0 then
    insert into public.loyalty_ledger (customer_id, points, entry_type, reason, order_id, written_by)
    values (new.customer_id, v_redeemed, 'cancel_reversal',
            'Points returned after cancellation of ' || coalesce(new.order_number, new.id::text),
            new.id, auth.uid());
  end if;

  return new;
exception
  when unique_violation then
    return new;
end;
$$;

drop trigger if exists trg_loyalty_cancel_reversal on public.orders;
create trigger trg_loyalty_cancel_reversal
  after update of status on public.orders
  for each row execute function public.reverse_loyalty_on_cancellation();

-- ---------------------------------------------------------------------------
-- 8.6 Redemption. Never trusts a client-side discount: the rate, the cap and the
-- balance are all recomputed here, and the order's own money columns are restated.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_loyalty_points(p_order_id uuid, p_points integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer uuid := auth.uid();
  v_order public.orders%rowtype;
  v_config jsonb := public.loyalty_config();
  v_enabled boolean := coalesce((v_config ->> 'enabled')::boolean, false);
  v_rate numeric;
  v_min integer;
  v_max_percent integer;
  v_balance integer;
  v_discount numeric;
  v_cap numeric;
  v_new_total numeric;
  v_ratio numeric;
begin
  if v_customer is null then
    raise exception 'Sign in to use loyalty points.';
  end if;
  if p_points is null or p_points <= 0 then
    raise exception 'Choose how many points you want to use.';
  end if;
  if not v_enabled then
    raise exception 'The loyalty programme is not open yet.';
  end if;
  if jsonb_typeof(v_config -> 'conversionRate') <> 'number' then
    raise exception 'The loyalty conversion rate has not been set.';
  end if;
  v_rate := (v_config ->> 'conversionRate')::numeric;
  v_min := case when jsonb_typeof(v_config -> 'minRedeemPoints') = 'number' then (v_config ->> 'minRedeemPoints')::integer else 0 end;
  v_max_percent := case when jsonb_typeof(v_config -> 'maxRedeemPercent') = 'number' then (v_config ->> 'maxRedeemPercent')::integer else 100 end;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'That order was not found.';
  end if;
  if v_order.customer_id is distinct from v_customer then
    raise exception 'That order belongs to another account.';
  end if;
  if v_order.status = 'Cancelled' then
    raise exception 'Points cannot be used on a cancelled order.';
  end if;
  if v_order.payment_status in ('Paid', 'Verified') then
    raise exception 'This order is already paid, so its total can no longer change.';
  end if;
  if v_order.loyalty_points_used > 0 then
    raise exception 'Points have already been used on this order.';
  end if;
  if p_points < v_min then
    raise exception 'This order needs at least % points.', v_min;
  end if;

  v_balance := public.loyalty_balance(v_customer);
  if p_points > v_balance then
    raise exception 'Only % points are available on this account.', v_balance;
  end if;

  v_discount := round(p_points::numeric / v_rate, 2);
  v_cap := round(coalesce(v_order.subtotal, 0) * v_max_percent / 100, 2);
  if v_discount > v_cap then
    raise exception 'Points can cover at most % on this order — use % points.', v_cap, floor(v_cap * v_rate)::integer;
  end if;
  if v_discount > coalesce(v_order.total, 0) then
    raise exception 'Points cannot exceed the order total.';
  end if;

  v_new_total := round(coalesce(v_order.total, 0) - v_discount, 2);
  -- The shopper-facing currency figure was produced by the pricing snapshot, so restate it in the
  -- same proportion instead of assuming which way the stored rate divides.
  v_ratio := case
    when coalesce(v_order.total, 0) > 0 and v_order.total_in_currency is not null
    then v_order.total_in_currency / v_order.total
    else null
  end;

  update public.orders
     set discount_amount = round(coalesce(discount_amount, 0) + v_discount, 2),
         loyalty_discount = round(loyalty_discount + v_discount, 2),
         loyalty_points_used = loyalty_points_used + p_points,
         total = v_new_total,
         total_in_currency = case when v_ratio is not null then round(v_new_total * v_ratio, 2) else total_in_currency end
   where id = p_order_id;

  update public.payments
     set amount = v_new_total
   where order_id = p_order_id
     and coalesce(status, '') not in ('Paid', 'Verified', 'Refunded')
     and amount is not null;

  insert into public.loyalty_ledger (customer_id, points, entry_type, reason, order_id, written_by)
  values (v_customer, -p_points, 'redeem', 'Redeemed on order ' || coalesce(v_order.order_number, v_order.id::text), p_order_id, v_customer);

  return jsonb_build_object(
    'success', true,
    'points', p_points,
    'discount', v_discount,
    'orderTotal', v_new_total,
    'balance', v_balance - p_points
  );
exception
  when unique_violation then
    raise exception 'Points have already been used on this order.';
end;
$$;

revoke execute on function public.redeem_loyalty_points(uuid, integer) from public, anon;
grant execute on function public.redeem_loyalty_points(uuid, integer) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8.6 Manual adjustment. Super Admin only, and never allowed to push a balance below zero.
-- ---------------------------------------------------------------------------
create or replace function public.adjust_loyalty_points(p_customer_id uuid, p_points integer, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can adjust loyalty points.';
  end if;
  if p_customer_id is null or p_points is null or p_points = 0 then
    raise exception 'Choose a customer and a non-zero number of points.';
  end if;
  if not exists (select 1 from public.profiles where id = p_customer_id) then
    raise exception 'That customer does not exist.';
  end if;
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'Give a short reason — it is kept on the ledger forever.';
  end if;

  v_balance := public.loyalty_balance(p_customer_id) + p_points;
  if v_balance < 0 then
    raise exception 'This would leave % with % points. A balance cannot go below zero.', p_customer_id, v_balance;
  end if;

  insert into public.loyalty_ledger (customer_id, points, entry_type, reason, written_by)
  values (p_customer_id, p_points, 'adjust', trim(p_reason), auth.uid());

  return jsonb_build_object('success', true, 'balance', v_balance);
end;
$$;

revoke execute on function public.adjust_loyalty_points(uuid, integer, text) from public, anon;
grant execute on function public.adjust_loyalty_points(uuid, integer, text) to authenticated, service_role;

create or replace function public.resolve_vip_tier(p_customer_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  with spend as (
    select coalesce(sum(o.total), 0) as lifetime
    from public.orders o
    where o.customer_id = p_customer_id
      and o.status <> 'Cancelled'
      and o.payment_status in ('Paid', 'Verified')
  ),
  points as (
    select coalesce(sum(l.points), 0)::integer as balance from public.loyalty_ledger l where l.customer_id = p_customer_id
  )
  select coalesce((
    select t.code
    from public.vip_tiers t, spend s, points p
    where t.enabled
      and t.code <> 'member'
      and (
        (t.min_lifetime_spend is not null and s.lifetime >= t.min_lifetime_spend)
        or (t.min_points is not null and p.balance >= t.min_points)
      )
    order by t.rank desc
    limit 1
  ), 'member');
$$;

revoke execute on function public.resolve_vip_tier(uuid) from public, anon;
grant execute on function public.resolve_vip_tier(uuid) to authenticated, service_role;

create or replace function public.refresh_customer_vip_tier(p_customer_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  with resolved as (select public.resolve_vip_tier(p_customer_id) as tier)
  update public.profiles p
     set vip_tier_code = r.tier, updated_at = now()
    from resolved r
    where p.id = p_customer_id
      and p.vip_tier_code is distinct from r.tier
  returning p.vip_tier_code;
$$;

revoke execute on function public.refresh_customer_vip_tier(uuid) from public, anon;
grant execute on function public.refresh_customer_vip_tier(uuid) to authenticated, service_role;

create or replace function public.sync_vip_tier_on_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.customer_id is not null then
    perform public.refresh_customer_vip_tier(new.customer_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vip_tier_sync on public.orders;
create trigger trg_vip_tier_sync
  after insert or update of payment_status, status, total on public.orders
  for each row execute function public.sync_vip_tier_on_order();

create or replace function public.save_vip_tier(
  p_code text,
  p_name text,
  p_rank integer,
  p_min_lifetime_spend numeric,
  p_min_points integer,
  p_benefits jsonb,
  p_enabled boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can change VIP tiers.';
  end if;
  if p_code !~ '^[a-z][a-z_]{1,39}$' then
    raise exception 'A tier code must be lower-case letters and underscores.';
  end if;
  if p_name is null or trim(p_name) = '' then
    raise exception 'A tier needs a name.';
  end if;
  if p_rank is null or p_rank < 1 or p_rank > 20 then
    raise exception 'A tier rank must be between 1 and 20.';
  end if;
  if p_min_lifetime_spend is not null and p_min_lifetime_spend < 0 then
    raise exception 'A spending threshold cannot be negative.';
  end if;
  if p_min_points is not null and p_min_points < 0 then
    raise exception 'A points threshold cannot be negative.';
  end if;

  insert into public.vip_tiers (code, name, rank, min_lifetime_spend, min_points, benefits, enabled, updated_at)
  values (p_code, trim(p_name), p_rank, p_min_lifetime_spend, p_min_points,
          coalesce(p_benefits, '[]'::jsonb), coalesce(p_enabled, true), now())
  on conflict (code) do update
    set name = excluded.name,
        rank = excluded.rank,
        min_lifetime_spend = excluded.min_lifetime_spend,
        min_points = excluded.min_points,
        benefits = excluded.benefits,
        enabled = excluded.enabled,
        updated_at = now();

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.save_vip_tier(text, text, integer, numeric, integer, jsonb, boolean)
  from public, anon;
grant execute on function public.save_vip_tier(text, text, integer, numeric, integer, jsonb, boolean)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Verification, run once at apply time.
-- ---------------------------------------------------------------------------
select 'phase8c '
  || 'ledger_columns ' || (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'loyalty_ledger')
  || ' | ledger_rows ' || (select count(*) from public.loyalty_ledger)
  || ' | ledger_rls ' || (select relrowsecurity from pg_class where oid = 'public.loyalty_ledger'::regclass)
  || ' | ledger_anon_select ' || has_table_privilege('anon', 'public.loyalty_ledger', 'select')
  || ' | ledger_insert_policies ' || (select count(*) from pg_policies where tablename = 'loyalty_ledger' and cmd in ('INSERT', 'ALL'))
  || ' | order_loyalty_columns ' || (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name in ('loyalty_points_used', 'loyalty_discount'))
  || ' | tiers ' || (select count(*) from public.vip_tiers)
  || ' | tiers_configured ' || (select count(*) from public.vip_tiers where min_lifetime_spend is not null or min_points is not null)
  || ' | loyalty_disabled ' || (select (value ->> 'enabled') from public.site_settings where key = 'loyalty_config')
  || ' | earn_triggers ' || (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid where not t.tgisinternal and c.relname = 'orders' and t.tgname in ('trg_loyalty_earn_on_paid', 'trg_loyalty_earn_on_insert', 'trg_loyalty_cancel_reversal', 'trg_vip_tier_sync'))
  || ' | redeem_anon_exec ' || has_function_privilege('anon', 'public.redeem_loyalty_points(uuid, integer)', 'execute')
  || ' | adjust_anon_exec ' || has_function_privilege('anon', 'public.adjust_loyalty_points(uuid, integer, text)', 'execute')
  || ' | save_config_anon_exec ' || has_function_privilege('anon', 'public.save_loyalty_config(jsonb)', 'execute')
  || ' | tier_of_real_customer ' || coalesce(public.resolve_vip_tier((select customer_id from public.orders where customer_id is not null limit 1)), 'null')
  || ' | balance_of_real_customer ' || coalesce(public.loyalty_balance((select customer_id from public.orders where customer_id is not null limit 1)), -1);

commit;
