-- Phase 8: orders must record *which configured method* was chosen, not only a label, and a
-- "Coming Soon" rail must not be orderable even if a browser posts its name.
--
-- Deliberately built from outside place_order. That function's live body in the linked database
-- does not hash-match the copy in supabase/migrations (same character count, different bytes),
-- so reproducing it here from the file would risk silently reverting a change that is only in the
-- database. A BEFORE trigger on the two rows that carry a payment label achieves the same
-- guarantees without touching the pricing, stock-reservation or tax logic at all.
--
--   * the label is resolved against payment_methods, and the resolved code + provider are stored;
--   * a label whose configured row is disabled, coming_soon or unavailable is refused;
--   * the CHECK lists widen to the labels Phase 8 configures, and stay static on purpose:
--     `authenticated` holds INSERT on orders, so that CHECK is a real line of defence.

begin;

alter table public.orders
  add column if not exists payment_method_code text,
  add column if not exists payment_provider text;

comment on column public.orders.payment_method_code is
  'payment_methods.code behind the chosen rail, resolved by the database from the submitted label and the destination country.';
comment on column public.orders.payment_provider is
  'payment_providers.code behind the chosen method, for the admin order view and reconciliation.';

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check check (
  payment_method = any (array[
    'COD', 'Cash on Delivery', 'JazzCash', 'Raast', 'Bank Transfer', 'PayFast', 'Easypaisa',
    'Bank Card', 'Google Pay', 'Apple Pay', 'Tabby', 'Tamara', 'mada', 'STC Pay',
    'PayPal', 'Klarna', 'Carte Bancaire', 'Bizum'
  ])
);

alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments add constraint payments_method_check check (
  method = any (array[
    'COD', 'Cash on Delivery', 'JazzCash', 'Raast', 'Bank Transfer', 'PayFast', 'Easypaisa',
    'Bank Card', 'Google Pay', 'Apple Pay', 'Tabby', 'Tamara', 'mada', 'STC Pay',
    'PayPal', 'Klarna', 'Carte Bancaire', 'Bizum'
  ])
);

-- Resolve a submitted label to one configured method. The destination country breaks ties when two
-- countries offer the same display name, which is the case for every card rail.
create or replace function public.resolve_payment_method(p_label text, p_country text)
returns public.payment_methods
language sql
stable
as $$
  select m.*
    from public.payment_methods m
   where m.display_name = p_label
   order by (m.country_codes @> array[upper(left(coalesce(p_country, ''), 2))]) desc,
            m.is_enabled desc,
            m.sort_order
   limit 1
$$;

create or replace function public.capture_order_payment_method()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_method public.payment_methods;
begin
  v_method := public.resolve_payment_method(NEW.payment_method, NEW.destination_country);
  if v_method.code is null then
    -- A label that is not in the configuration is a legacy rail, and those keep working.
    NEW.payment_method_code := null;
    NEW.payment_provider := null;
    return NEW;
  end if;

  if v_method.status in ('coming_soon', 'unavailable') or not v_method.is_enabled then
    raise exception 'That payment method is not available for ordering yet.';
  end if;

  NEW.payment_method_code := v_method.code;
  NEW.payment_provider := v_method.provider_code;
  return NEW;
end $$;

drop trigger if exists capture_order_payment_method on public.orders;
create trigger capture_order_payment_method
  before insert or update of payment_method on public.orders
  for each row execute function public.capture_order_payment_method();

-- The payment row mirrors the order it belongs to, so the provider and method code are recorded
-- once and never derived from a client-supplied string.
create or replace function public.capture_payment_row_provider()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders o where o.id = NEW.order_id;
  if found then
    -- provider_code and payment_method_code are metadata here. NEW.provider is deliberately left
    -- alone: 'manual' is what the reconciliation functions look for on the existing rails.
    NEW.provider_code := coalesce(NEW.provider_code, v_order.payment_provider);
    NEW.payment_method_code := coalesce(NEW.payment_method_code, v_order.payment_method_code);
  end if;
  return NEW;
end $$;

drop trigger if exists capture_payment_row_provider on public.payments;
create trigger capture_payment_row_provider
  before insert or update of method on public.payments
  for each row execute function public.capture_payment_row_provider();

revoke execute on function public.resolve_payment_method(text, text) from public;
grant execute on function public.resolve_payment_method(text, text) to authenticated, service_role;
alter function public.capture_order_payment_method() owner to postgres;
alter function public.capture_payment_row_provider() owner to postgres;

-- A configured method whose display name is outside the CHECK list would make checkout fail at
-- insert time, so the two lists cannot be allowed to drift apart unnoticed.
create or replace function public.assert_method_labels_are_permitted()
returns void
language plpgsql
as $$
declare
  v_bad text;
begin
  select string_agg(m.display_name, ', ') into v_bad
    from public.payment_methods m
   where m.display_name not in (
     'COD', 'Cash on Delivery', 'JazzCash', 'Raast', 'Bank Transfer', 'PayFast', 'Easypaisa',
     'Bank Card', 'Google Pay', 'Apple Pay', 'Tabby', 'Tamara', 'mada', 'STC Pay',
     'PayPal', 'Klarna', 'Carte Bancaire', 'Bizum'
   );
  if v_bad is not null then
    raise exception 'These payment method names are not permitted by the order write guard: %', v_bad;
  end if;
end $$;

select public.assert_method_labels_are_permitted();

comment on function public.assert_method_labels_are_permitted() is
  'Drift check: a payment_methods.display_name outside the orders/payments CHECK list would make checkout fail. A Super Admin must reuse a permitted name or widen the constraint in a migration.';

commit;

select
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='orders'
       and column_name in ('payment_method_code','payment_provider')) as order_payment_columns,
  (select count(*) from pg_trigger where tgname in ('capture_order_payment_method','capture_payment_row_provider') and not tgisinternal) as triggers,
  (select count(*) from public.payment_methods) as methods,
  (select payment_method from public.orders limit 1) as existing_label,
  (select count(*) from public.orders where payment_method_code is not null) as backfilled_now;
