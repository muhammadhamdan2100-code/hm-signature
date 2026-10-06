-- Phase 8: the three server-only functions a card provider needs.
--
-- Modelled on start_payfast_payment, which already proves the pattern this project uses:
-- the caller's own token runs the function, so Postgres - not the browser - decides who may
-- start a payment for an order and what amount is authoritative. record_card_payment is the
-- only path that may move a payment to Paid, and it refuses downgrades and replays.

begin;

-- Returns the order as the server understands it. The client never supplies the amount.
create or replace function public.start_card_payment(
  p_order_id uuid,
  p_method_code text,
  p_currency text default null
)
returns table (
  order_id uuid,
  order_number text,
  amount numeric,
  currency text,
  country_code text,
  display_name text,
  provider_code text,
  customer_name text,
  customer_email text,
  existing_session_id text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_caller uuid := auth.uid();
  v_method public.payment_methods%rowtype;
  v_currency text;
begin
  if v_caller is null then
    raise exception 'Sign in before starting a card payment.';
  end if;

  select * into v_order from public.orders o where o.id = p_order_id;
  if not found then
    raise exception 'Order not found.';
  end if;

  if not public.is_staff(v_caller) and v_order.customer_id is distinct from v_caller then
    raise exception 'This order belongs to another account.';
  end if;

  if v_order.status = 'Cancelled' or v_order.payment_status in ('Paid', 'Refunded') then
    raise exception 'This order can no longer be paid.';
  end if;

  select * into v_method from public.payment_methods m where m.code = p_method_code;
  if not found then
    raise exception 'That payment method is not configured.';
  end if;
  -- Coming soon and disabled rows cannot start a payment even if a browser posts them anyway.
  if v_method.status in ('coming_soon', 'unavailable') or not v_method.is_enabled then
    raise exception 'This payment method is not available yet.';
  end if;
  if not (v_method.country_codes @> array[upper(left(coalesce(v_order.destination_country, 'PK'), 2))]) then
    raise exception 'This payment method is not offered for the delivery country.';
  end if;

  -- The rail actually used must be the rail the order was created on, so a pending Cash on
  -- Delivery order cannot be converted into a card payment behind the shopkeeper's back.
  if v_order.payment_method_code is not null and v_order.payment_method_code <> v_method.code then
    raise exception 'This order was placed on a different payment method.';
  end if;

  v_currency := upper(coalesce(nullif(trim(p_currency), ''), v_order.currency, 'PKR'));
  if not (v_method.currency_codes @> array[v_currency]) then
    raise exception 'This payment method cannot take %.', v_currency;
  end if;
  if round(v_order.total::numeric, 2) <= 0 then
    raise exception 'The recorded order total is not payable.';
  end if;

  -- place_order already created the 1:1 payment row; claim it for this provider without ever
  -- reopening a confirmed one.
  update public.payments p
     set provider = v_method.provider_code,
         provider_code = v_method.provider_code,
         payment_method_code = v_method.code,
         provider_currency = v_currency,
         provider_status = null,
         updated_at = now()
   where p.order_id = v_order.id
     and p.status not in ('Paid', 'Verified', 'Refunded');

  return query
  select
    o.id,
    o.order_number,
    round(o.total::numeric, 2),
    v_currency,
    upper(left(coalesce(o.destination_country, 'PK'), 2)),
    m.display_name,
    m.provider_code,
    o.customer_name,
    o.customer_email,
    p.stripe_checkout_session_id
  from public.orders o
  join public.payment_methods m on m.code = v_method.code
  join public.payments p on p.order_id = o.id
  where o.id = p_order_id
  limit 1;
end $$;

-- Stores the identifiers the provider returned for a session this server created. It holds no
-- card data because it never sees any: Stripe's hosted page collects that.
create or replace function public.attach_card_session(
  p_order_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text
)
returns table (applied boolean, reason text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
begin
  if p_checkout_session_id is null or trim(p_checkout_session_id) = '' then
    return query select false, 'No provider session reference.';
    return;
  end if;

  select * into v_payment from public.payments p where p.order_id = p_order_id;
  if not found then
    return query select false, 'No payment row for this order.';
    return;
  end if;

  -- A confirmed payment is never re-pointed at a new session.
  if v_payment.status in ('Paid', 'Verified', 'Refunded') then
    return query select false, 'Payment already completed.';
    return;
  end if;

  update public.payments p set
    stripe_checkout_session_id = trim(p_checkout_session_id),
    stripe_payment_intent_id = coalesce(nullif(trim(coalesce(p_payment_intent_id, '')), ''), p.stripe_payment_intent_id),
    updated_at = now()
  where p.id = v_payment.id;

  return query select true, 'Applied';
end $$;

-- Applies one provider notification. Safe to call twice for the same event, and it will never
-- move a settled payment backwards. Card credentials are not parameters and are never stored.
create or replace function public.record_card_payment(
  p_provider_event_id text,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_status text,
  p_amount numeric,
  p_currency text
)
returns table (applied boolean, reason text, order_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_next_status text;
  v_duplicate boolean;
begin
  if p_status not in ('paid', 'unpaid', 'processing', 'failed', 'no_payment_required') then
    return query select false, 'Unknown provider status.', null::uuid;
    return;
  end if;
  v_next_status := case p_status
    when 'paid' then 'Paid'
    when 'no_payment_required' then 'Paid'
    when 'failed' then 'Failed'
    else 'Pending'
  end;

  select * into v_payment from public.payments p
    where p.stripe_checkout_session_id = p_checkout_session_id
       or (p_payment_intent_id is not null and p.stripe_payment_intent_id = p_payment_intent_id)
    order by p.created_at desc limit 1;

  if not found then
    return query select false, 'No payment matches this provider reference.', null::uuid;
    return;
  end if;

  select exists (
    select 1 from public.payment_events e
    where e.payment_id = v_payment.id and e.provider_event_id = p_provider_event_id
  ) into v_duplicate;
  if v_duplicate then
    return query select false, 'Already processed.', v_payment.order_id;
    return;
  end if;

  -- A completed payment is never reopened by a late or out-of-order notification, and the
  -- amount must match what this deployment recorded for the order.
  if v_payment.status = 'Paid' and v_next_status <> 'Paid' then
    insert into public.payment_events (payment_id, event_type, actor_id, notes, provider_event_id, payload)
    values (v_payment.id, 'rejected_downgrade', null,
            'Ignored a late notification that would have reopened a completed payment.',
            p_provider_event_id, jsonb_build_object('attempted', v_next_status));
    return query select false, 'Payment already completed.', v_payment.order_id;
    return;
  end if;

  select * into v_order from public.orders o where o.id = v_payment.order_id;
  if v_next_status = 'Paid' and round(abs(coalesce(p_amount, 0) - coalesce(v_order.total, 0)), 2) > 0.005 then
    insert into public.payment_events (payment_id, event_type, actor_id, notes, provider_event_id, payload)
    values (v_payment.id, 'amount_mismatch', null,
            'Provider reported a different amount than the order total; payment left unconfirmed.',
            p_provider_event_id, jsonb_build_object('reported', p_amount, 'expected', v_order.total));
    return query select false, 'Amount mismatch.', v_payment.order_id;
    return;
  end if;

  update public.payments p set
    status = v_next_status,
    provider_status = p_status,
    stripe_payment_intent_id = coalesce(p_payment_intent_id, p.stripe_payment_intent_id),
    stripe_checkout_session_id = coalesce(p_checkout_session_id, p.stripe_checkout_session_id),
    verified_at = case when v_next_status = 'Paid' then now() else p.verified_at end,
    captured_at = case when v_next_status = 'Paid' then now() else p.captured_at end,
    updated_at = now()
  where p.id = v_payment.id;

  if v_next_status = 'Paid' then
    update public.orders o set payment_status = 'Paid', updated_at = now() where o.id = v_payment.order_id;
    insert into public.order_status_history (order_id, status, note, created_at)
    select v_payment.order_id, o.status, 'Payment confirmed by the card provider.', now()
      from public.orders o where o.id = v_payment.order_id and o.status <> 'Cancelled';
  end if;

  insert into public.payment_events (payment_id, event_type, actor_id, notes, provider_event_id, payload)
  values (v_payment.id, 'card_' || lower(p_status), null,
          'Card provider notification applied.', p_provider_event_id,
          jsonb_build_object('amount', p_amount, 'currency', upper(p_currency)));

  return query select true, 'Applied', v_payment.order_id;
end $$;

-- Only the service role (the webhook and the start endpoint) may call these; the buyer's own
-- token starts a payment, so EXECUTE stays with authenticated too, guarded inside the body.
-- Postgres grants EXECUTE to PUBLIC by default, so PUBLIC must be revoked explicitly - removing
-- only "authenticated" here would still leave the function callable by any role.
revoke execute on function public.start_card_payment(uuid, text, text) from public, anon;
revoke execute on function public.record_card_payment(text, text, text, text, numeric, text) from public, anon;
revoke execute on function public.attach_card_session(uuid, text, text) from public, anon;
grant execute on function public.start_card_payment(uuid, text, text) to authenticated, service_role;
-- The webhook has no user token at all: it is service-role only.
revoke execute on function public.record_card_payment(text, text, text, text, numeric, text) from authenticated;
grant execute on function public.record_card_payment(text, text, text, text, numeric, text) to service_role;
-- A browser must not be able to point an order at a session id it invented.
revoke execute on function public.attach_card_session(uuid, text, text) from authenticated;
grant execute on function public.attach_card_session(uuid, text, text) to service_role;

comment on function public.record_card_payment(text, text, text, text, numeric, text) is
  'Server-only. The single path that may set payment_status = Paid for a card payment; refuses replays, downgrades and amount mismatches.';
comment on function public.attach_card_session(uuid, text, text) is
  'Server-only. Records the provider references for a session this server created; never re-points a completed payment.';

commit;

select
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname in ('start_card_payment','record_card_payment','attach_card_session')) as card_functions,
  (select count(*) from pg_policies where tablename = 'payments') as payment_policies,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='payments' and column_name ~* 'card|cvv|pan|expiry') as card_columns,
  (select array_agg(concat(proname, ' to authenticated=',
     case when has_function_privilege('authenticated', p.oid, 'EXECUTE') then 'yes' else 'no' end) order by proname)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.proname in ('start_card_payment','record_card_payment','attach_card_session')) as buyer_reach;
