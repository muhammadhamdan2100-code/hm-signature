-- Phase 8 (8.5): gift cards.
--
-- A gift card is money the house already holds, so this file treats it as such: the balance lives
-- in one row that only guarded functions move, every movement is written to gift_card_redemptions,
-- and no client value is trusted anywhere. Redemption is refused for an expired card, a cancelled
-- or paid order, a currency that does not match the order, an amount over the balance, an amount
-- over what the order still owes, and a second application to the same order.
--
-- Applying a redemption lowers orders.total (the amount still to be collected) and records the same
-- figure in orders.gift_card_amount so revenue reporting can tell the two apart. Because the
-- outstanding amount ends up in the column the payment rails already read, start_card_payment and
-- record_card_payment are untouched — a gift card cannot make a card charge disagree with the order.
--
-- Selling gift cards at checkout is deliberately NOT implemented here: the catalogue holds six
-- fragrances and no gift-card product, and inventing one would mean inventing a price, a SKU and
-- stock. Cards are issued by the Super Admin until the business defines how it wants to sell them.

begin;

-- ---------------------------------------------------------------------------
-- Programme configuration. Created off and unconfigured, on purpose.
-- ---------------------------------------------------------------------------
insert into public.site_settings (key, value, description)
values (
  'gift_card_config',
  $json${
    "enabled": false,
    "denominations": [],
    "allowCustom": false,
    "minCustom": null,
    "maxCustom": null,
    "expiryDays": null
  }$json$,
  'Gift card rules. Disabled until the shop sets denominations and an expiry policy.'
)
on conflict (key) do nothing;

create or replace function public.gift_card_config()
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce((select value from public.site_settings where key = 'gift_card_config'), '{}'::jsonb);
$$;

revoke execute on function public.gift_card_config() from public;
grant execute on function public.gift_card_config() to anon, authenticated, service_role;

create or replace function public.save_gift_card_config(p_config jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean jsonb;
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can change gift card rules.';
  end if;
  if p_config is null or jsonb_typeof(p_config) <> 'object' then
    raise exception 'Gift card rules must be an object.';
  end if;

  select jsonb_build_object(
    'enabled', coalesce((p_config ->> 'enabled')::boolean, false),
    'denominations', coalesce(p_config -> 'denominations', '[]'::jsonb),
    'allowCustom', coalesce((p_config ->> 'allowCustom')::boolean, false),
    'minCustom', case when jsonb_typeof(p_config -> 'minCustom') = 'number' and (p_config ->> 'minCustom')::numeric >= 0
                      then (p_config -> 'minCustom') end,
    'maxCustom', case when jsonb_typeof(p_config -> 'maxCustom') = 'number' and (p_config ->> 'maxCustom')::numeric > 0
                      then (p_config -> 'maxCustom') end,
    'expiryDays', case when jsonb_typeof(p_config -> 'expiryDays') = 'number'
                        and (p_config ->> 'expiryDays')::numeric between 1 and 3650
                      then (p_config ->> 'expiryDays')::integer end
  ) into v_clean;

  if (v_clean ->> 'enabled')::boolean
     and jsonb_typeof(v_clean -> 'denominations') = 'array'
     and jsonb_array_length(v_clean -> 'denominations') = 0
     and coalesce((v_clean ->> 'allowCustom')::boolean, false) = false then
    raise exception 'Add at least one denomination, or allow a custom amount, before turning gift cards on.';
  end if;

  insert into public.site_settings (key, value, updated_at)
  values ('gift_card_config', v_clean, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();

  return jsonb_build_object('success', true, 'value', v_clean);
end;
$$;

revoke execute on function public.save_gift_card_config(jsonb) from public, anon;
grant execute on function public.save_gift_card_config(jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- The card.
-- ---------------------------------------------------------------------------
create table if not exists public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^HM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  initial_amount numeric not null check (initial_amount > 0),
  balance numeric not null check (balance >= 0 and balance <= initial_amount),
  status text not null default 'Created' check (
    status in ('Created', 'Purchased', 'Active', 'Partially Redeemed', 'Fully Redeemed', 'Expired', 'Cancelled')
  ),
  purchaser_name text,
  purchaser_email text,
  recipient_name text,
  recipient_email text,
  sender_name text,
  message text,
  delivery_date date,
  activated_at timestamptz,
  expires_at timestamptz,
  order_id uuid references public.orders (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.gift_cards is
  'Stored-value cards. balance is authoritative and moves only inside guarded functions; the movements are written to gift_card_redemptions.';

create index if not exists gift_cards_status_idx on public.gift_cards (status);
create index if not exists gift_cards_recipient_email_idx on public.gift_cards (lower(recipient_email));

alter table public.gift_cards enable row level security;

drop policy if exists "Staff read gift cards" on public.gift_cards;
create policy "Staff read gift cards"
  on public.gift_cards for select
  to authenticated
  using (public.is_staff());

-- A signed-in customer can see the cards addressed to the email on their own profile.
drop policy if exists "Recipients read their own gift cards" on public.gift_cards;
create policy "Recipients read their own gift cards"
  on public.gift_cards for select
  to authenticated
  using (
    recipient_email is not null
    and lower(recipient_email) = lower(coalesce((select p.email from public.profiles p where p.id = auth.uid()), ''))
  );

revoke insert, update, delete, truncate, references, trigger on public.gift_cards from anon, authenticated;
grant select on public.gift_cards to authenticated;

create table if not exists public.gift_card_redemptions (
  id uuid primary key default gen_random_uuid(),
  gift_card_id uuid not null references public.gift_cards (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  amount numeric not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  applied_by uuid,
  applied_at timestamptz not null default now(),
  released_at timestamptz,
  release_reason text
);

comment on table public.gift_card_redemptions is
  'One row per application of a card to an order. Releasing keeps the row and stamps released_at.';

create index if not exists gift_card_redemptions_card_idx on public.gift_card_redemptions (gift_card_id, applied_at desc);

-- Only one live application per order.
create unique index if not exists gift_card_redemptions_live_order_uidx
  on public.gift_card_redemptions (order_id)
  where released_at is null;

alter table public.gift_card_redemptions enable row level security;

drop policy if exists "Staff read gift card redemptions" on public.gift_card_redemptions;
create policy "Staff read gift card redemptions"
  on public.gift_card_redemptions for select
  to authenticated
  using (public.is_staff());

drop policy if exists "Customers read redemptions on their own orders" on public.gift_card_redemptions;
create policy "Customers read redemptions on their own orders"
  on public.gift_card_redemptions for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = gift_card_redemptions.order_id and o.customer_id = auth.uid()
    )
  );

revoke insert, update, delete, truncate, references, trigger on public.gift_card_redemptions from anon, authenticated;
grant select on public.gift_card_redemptions to authenticated;

alter table public.orders add column if not exists gift_card_amount numeric not null default 0
  check (gift_card_amount >= 0);

comment on column public.orders.gift_card_amount is
  'Value drawn from a gift card on this order. orders.total already excludes it, so payment rails charge the remainder.';

-- ---------------------------------------------------------------------------
-- Codes. Generated server-side only: a shopper can never choose one, and an
-- existing code can never be overwritten.
-- ---------------------------------------------------------------------------
create or replace function public.new_gift_card_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_attempt text;
  v_group text;
  i integer;
begin
  loop
    v_attempt := 'HM-';
    for i in 1..3 loop
      v_group := '';
      while length(v_group) < 4 loop
        v_group := v_group || substring(v_alphabet from 1 + floor(random() * length(v_alphabet))::integer for 1);
      end loop;
      v_attempt := v_attempt || v_group || case when i < 3 then '-' else '' end;
    end loop;

    if not exists (select 1 from public.gift_cards where code = v_attempt) then
      return v_attempt;
    end if;
  end loop;
end;
$$;

revoke execute on function public.new_gift_card_code() from public, anon;
grant execute on function public.new_gift_card_code() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Issuing. Money in is required first: a card cannot be issued as Active with no
-- purchase record, so this creates it as Created and activation is its own step.
-- ---------------------------------------------------------------------------
create or replace function public.issue_gift_card(
  p_amount numeric,
  p_currency text,
  p_recipient_name text default null,
  p_recipient_email text default null,
  p_sender_name text default null,
  p_message text default null,
  p_delivery_date date default null,
  p_purchaser_name text default null,
  p_purchaser_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_config jsonb := public.gift_card_config();
  v_clean text := upper(trim(coalesce(p_currency, '')));
  v_expiry integer;
  v_card public.gift_cards%rowtype;
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can issue gift cards.';
  end if;
  if not coalesce((v_config ->> 'enabled')::boolean, false) then
    raise exception 'Gift cards are not enabled for this shop yet.';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 10000000 then
    raise exception 'A gift card needs a real amount above zero.';
  end if;
  if v_clean !~ '^[A-Z]{3}$' then
    raise exception 'Choose the currency the card is issued in.';
  end if;
  if p_recipient_email is not null
     and p_recipient_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'The recipient email address is not valid.';
  end if;

  v_expiry := case when jsonb_typeof(v_config -> 'expiryDays') = 'number' then (v_config ->> 'expiryDays')::integer else null end;

  insert into public.gift_cards (
    code, currency, initial_amount, balance, status,
    purchaser_name, purchaser_email, recipient_name, recipient_email,
    sender_name, message, delivery_date, created_by, expires_at
  ) values (
    public.new_gift_card_code(), v_clean, round(p_amount, 2), round(p_amount, 2), 'Created',
    nullif(trim(coalesce(p_purchaser_name, '')), ''), nullif(trim(coalesce(p_purchaser_email, '')), ''),
    nullif(trim(coalesce(p_recipient_name, '')), ''), nullif(lower(trim(coalesce(p_recipient_email, ''))), ''),
    nullif(trim(coalesce(p_sender_name, '')), ''), nullif(trim(coalesce(p_message, '')), ''),
    p_delivery_date, auth.uid(),
    case when v_expiry is not null then now() + make_interval(days => v_expiry) else null end
  )
  returning * into v_card;

  return jsonb_build_object(
    'success', true, 'id', v_card.id, 'code', v_card.code,
    'status', v_card.status, 'balance', v_card.balance, 'currency', v_card.currency
  );
end;
$$;

revoke execute on function public.issue_gift_card(numeric, text, text, text, text, text, date, text, text)
  from public, anon;
grant execute on function public.issue_gift_card(numeric, text, text, text, text, text, date, text, text)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Status changes, with the lifecycle enforced here rather than in a button.
-- ---------------------------------------------------------------------------
create or replace function public.set_gift_card_status(p_card_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card public.gift_cards%rowtype;
  v_allowed boolean;
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can change a gift card status.';
  end if;
  if p_status not in ('Created', 'Purchased', 'Active', 'Partially Redeemed', 'Fully Redeemed', 'Expired', 'Cancelled') then
    raise exception 'That is not a gift card status.';
  end if;

  select * into v_card from public.gift_cards where id = p_card_id for update;
  if not found then
    raise exception 'That gift card was not found.';
  end if;

  -- A card that has been spent down cannot be stepped back by hand.
  v_allowed := case
    when v_card.status = p_status then true
    when v_card.status = 'Fully Redeemed' then false
    when v_card.status = 'Cancelled' and p_status <> 'Cancelled' then false
    when p_status = 'Fully Redeemed' then false
    when p_status = 'Partially Redeemed' then false
    else true
  end;
  if not v_allowed then
    raise exception 'A card cannot move from % to %.', v_card.status, p_status;
  end if;

  -- Expiring or cancelling leaves the balance where it is on purpose: the money is still owed by
  -- the house, and a card that can no longer be spent must not silently lose its recorded value.
  update public.gift_cards
     set status = p_status,
         activated_at = case when p_status = 'Active' and v_card.activated_at is null then now() else activated_at end,
         updated_at = now()
   where id = p_card_id;

  return jsonb_build_object('success', true, 'status', p_status);
end;
$$;

revoke execute on function public.set_gift_card_status(uuid, text) from public, anon;
grant execute on function public.set_gift_card_status(uuid, text) to authenticated, service_role;

create or replace function public.update_gift_card_details(
  p_card_id uuid,
  p_recipient_name text,
  p_recipient_email text,
  p_sender_name text,
  p_message text,
  p_delivery_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card public.gift_cards%rowtype;
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can edit gift card details.';
  end if;
  if p_recipient_email is not null
     and p_recipient_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'The recipient email address is not valid.';
  end if;

  select * into v_card from public.gift_cards where id = p_card_id for update;
  if not found then
    raise exception 'That gift card was not found.';
  end if;
  if v_card.status in ('Partially Redeemed', 'Fully Redeemed', 'Cancelled') then
    raise exception 'A card that has been spent or cancelled can no longer be edited.';
  end if;

  update public.gift_cards
     set recipient_name = nullif(trim(coalesce(p_recipient_name, '')), ''),
         recipient_email = nullif(lower(trim(coalesce(p_recipient_email, ''))), ''),
         sender_name = nullif(trim(coalesce(p_sender_name, '')), ''),
         message = nullif(trim(coalesce(p_message, '')), ''),
         delivery_date = p_delivery_date,
         updated_at = now()
   where id = p_card_id;

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.update_gift_card_details(uuid, text, text, text, text, date) from public, anon;
grant execute on function public.update_gift_card_details(uuid, text, text, text, text, date) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Balance lookup by code. Returns the least that lets a shopper check a card, and
-- nothing about who it was sent to.
-- ---------------------------------------------------------------------------
create or replace function public.gift_card_state(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  -- A scalar subselect, not a filtered FROM: an unknown code must answer {found:false} rather
  -- than return no rows at all, which a browser cannot tell apart from a network failure.
  select coalesce(
    (
      select jsonb_build_object(
        'found', true,
        'status', g.status,
        'balance', g.balance,
        'currency', g.currency,
        'expiresAt', g.expires_at,
        'expired', g.expires_at is not null and g.expires_at < now()
      )
      from public.gift_cards g
      where g.code = upper(trim(coalesce(p_code, '')))
      limit 1
    ),
    jsonb_build_object('found', false)
  );
$$;

revoke execute on function public.gift_card_state(text) from public;
grant execute on function public.gift_card_state(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Redemption. Everything that could be forged in a browser is re-read here.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_gift_card(p_order_id uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer uuid := auth.uid();
  v_order public.orders%rowtype;
  v_card public.gift_cards%rowtype;
  v_apply numeric;
  v_new_balance numeric;
  v_status text;
  v_ratio numeric;
begin
  if v_customer is null then
    raise exception 'Sign in to use a gift card.';
  end if;
  if p_order_id is null or p_code is null or length(trim(p_code)) < 8 then
    raise exception 'Enter the gift card code exactly as printed.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'That order was not found.';
  end if;
  if v_order.customer_id is distinct from v_customer then
    raise exception 'That order belongs to another account.';
  end if;
  if v_order.status = 'Cancelled' then
    raise exception 'A gift card cannot be applied to a cancelled order.';
  end if;
  if v_order.payment_status in ('Paid', 'Verified', 'Refunded') then
    raise exception 'This order has already been paid for.';
  end if;
  if v_order.gift_card_amount > 0 then
    raise exception 'A gift card has already been applied to this order.';
  end if;

  select * into v_card from public.gift_cards
   where code = upper(trim(p_code))
   for update;
  if not found then
    raise exception 'That gift card code is not recognised.';
  end if;
  if v_card.status in ('Created', 'Purchased') then
    raise exception 'This gift card has not been activated yet.';
  end if;
  if v_card.status = 'Cancelled' then
    raise exception 'This gift card has been cancelled.';
  end if;
  if v_card.status = 'Expired' or (v_card.expires_at is not null and v_card.expires_at < now()) then
    if v_card.status <> 'Expired' then
      update public.gift_cards set status = 'Expired', updated_at = now() where id = v_card.id;
    end if;
    raise exception 'This gift card expired on %.', to_char(v_card.expires_at, 'DD Mon YYYY');
  end if;
  if v_card.status not in ('Active', 'Partially Redeemed') then
    raise exception 'This gift card cannot be used right now.';
  end if;
  if coalesce(v_order.currency, 'PKR') <> v_card.currency then
    raise exception 'This card is held in % and cannot be used on an order in %.', v_card.currency, coalesce(v_order.currency, 'PKR');
  end if;
  if v_card.balance <= 0 then
    raise exception 'This gift card has no remaining balance.';
  end if;

  v_apply := round(least(v_card.balance, coalesce(v_order.total, 0)), 2);
  if v_apply <= 0 then
    raise exception 'There is nothing left to pay on this order.';
  end if;

  v_new_balance := round(v_card.balance - v_apply, 2);
  v_status := case when v_new_balance <= 0 then 'Fully Redeemed' else 'Partially Redeemed' end;

  update public.gift_cards
     set balance = v_new_balance, status = v_status, updated_at = now()
   where id = v_card.id;

  insert into public.gift_card_redemptions (gift_card_id, order_id, amount, currency, applied_by)
  values (v_card.id, v_order.id, v_apply, v_card.currency, v_customer);

  v_ratio := case
    when coalesce(v_order.total, 0) > 0 and v_order.total_in_currency is not null
    then v_order.total_in_currency / v_order.total
    else null
  end;

  update public.orders
     set gift_card_amount = round(gift_card_amount + v_apply, 2),
         total = round(coalesce(total, 0) - v_apply, 2),
         total_in_currency = case
           when v_ratio is not null then round((coalesce(total, 0) - v_apply) * v_ratio, 2)
           else total_in_currency
         end
   where id = v_order.id;

  update public.payments
     set amount = round(coalesce(v_order.total, 0) - v_apply, 2)
   where order_id = v_order.id
     and coalesce(status, '') not in ('Paid', 'Verified', 'Refunded')
     and amount is not null;

  return jsonb_build_object(
    'success', true,
    'applied', v_apply,
    'remainingOnCard', v_new_balance,
    'orderTotal', round(coalesce(v_order.total, 0) - v_apply, 2),
    'cardStatus', v_status
  );
end;
$$;

revoke execute on function public.redeem_gift_card(uuid, text) from public, anon;
grant execute on function public.redeem_gift_card(uuid, text) to authenticated, service_role;

create or replace function public.release_gift_card(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer uuid := auth.uid();
  v_order public.orders%rowtype;
  v_redemption public.gift_card_redemptions%rowtype;
  v_card public.gift_cards%rowtype;
  v_ratio numeric;
begin
  if v_customer is null then
    raise exception 'Sign in to remove a gift card.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'That order was not found.';
  end if;
  if v_order.customer_id is distinct from v_customer then
    raise exception 'That order belongs to another account.';
  end if;
  if v_order.payment_status in ('Paid', 'Verified', 'Refunded') then
    raise exception 'This order has already been paid for.';
  end if;
  if v_order.gift_card_amount <= 0 then
    raise exception 'No gift card is applied to this order.';
  end if;

  select * into v_redemption from public.gift_card_redemptions
   where order_id = v_order.id and released_at is null
   for update;
  if not found then
    raise exception 'The gift card movement for this order cannot be found.';
  end if;

  select * into v_card from public.gift_cards where id = v_redemption.gift_card_id for update;

  update public.gift_cards
     set balance = round(balance + v_redemption.amount, 2),
         status = case when status = 'Fully Redeemed' and round(balance + v_redemption.amount, 2) >= initial_amount then 'Active'
                       when status = 'Fully Redeemed' then 'Partially Redeemed'
                       else status end,
         updated_at = now()
   where id = v_card.id;

  update public.gift_card_redemptions
     set released_at = now(), release_reason = 'Removed by the customer before payment'
   where id = v_redemption.id;

  v_ratio := case
    when coalesce(v_order.total, 0) > 0 and v_order.total_in_currency is not null
    then v_order.total_in_currency / v_order.total
    else null
  end;

  update public.orders
     set gift_card_amount = round(gift_card_amount - v_redemption.amount, 2),
         total = round(coalesce(total, 0) + v_redemption.amount, 2),
         total_in_currency = case
           when v_ratio is not null then round((coalesce(total, 0) + v_redemption.amount) * v_ratio, 2)
           else total_in_currency
         end
   where id = v_order.id;

  update public.payments
     set amount = round(coalesce(v_order.total, 0) + v_redemption.amount, 2)
   where order_id = v_order.id
     and coalesce(status, '') not in ('Paid', 'Verified', 'Refunded')
     and amount is not null;

  return jsonb_build_object('success', true, 'restored', v_redemption.amount);
end;
$$;

revoke execute on function public.release_gift_card(uuid) from public, anon;
grant execute on function public.release_gift_card(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Verification, run once at apply time.
-- ---------------------------------------------------------------------------
select 'phase8d '
  || 'card_columns ' || (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'gift_cards')
  || ' | cards ' || (select count(*) from public.gift_cards)
  || ' | redemption_columns ' || (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'gift_card_redemptions')
  || ' | live_redemption_uidx ' || (select count(*) from pg_class where relname = 'gift_card_redemptions_live_order_uidx')
  || ' | cards_rls ' || (select relrowsecurity from pg_class where oid = 'public.gift_cards'::regclass)
  || ' | cards_anon_select ' || has_table_privilege('anon', 'public.gift_cards', 'select')
  || ' | cards_insert_policies ' || (select count(*) from pg_policies where tablename = 'gift_cards' and cmd in ('INSERT', 'ALL'))
  || ' | order_gift_column ' || (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'gift_card_amount')
  || ' | gift_config_row ' || (select count(*) from public.site_settings where key = 'gift_card_config')
  || ' | gift_enabled ' || (select value ->> 'enabled' from public.site_settings where key = 'gift_card_config')
  || ' | issue_anon_exec ' || has_function_privilege('anon', 'public.issue_gift_card(numeric, text, text, text, text, text, date, text, text)', 'execute')
  || ' | redeem_anon_exec ' || has_function_privilege('anon', 'public.redeem_gift_card(uuid, text)', 'execute')
  || ' | status_anon_exec ' || has_function_privilege('anon', 'public.set_gift_card_status(uuid, text)', 'execute')
  || ' | state_anon_exec ' || has_function_privilege('anon', 'public.gift_card_state(text)', 'execute');

commit;
