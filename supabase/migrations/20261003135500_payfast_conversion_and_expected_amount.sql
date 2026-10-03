-- Phase 5 §5 correction after reading the provider documentation.
--
-- The provider settles in ZAR while this store prices in PKR, so the amount that
-- goes to the provider is a server-side conversion of the recorded order total —
-- never a number a browser supplies, and never a silently mismatched figure. The
-- incoming notification is therefore compared against the amount THIS deployment
-- recorded for that payment, and the documented provider minimum is enforced.

create or replace function public.start_payfast_payment(
  p_order_id uuid,
  p_currency text default 'ZAR',
  p_conversion_rate numeric default 1
)
returns table (
  order_id uuid,
  order_number text,
  amount numeric,
  currency text,
  item_name text,
  customer_name text,
  customer_email text,
  m_payment_id text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_caller uuid := auth.uid();
  v_rate numeric;
  v_amount numeric(12,2);
  v_currency text := upper(left(coalesce(nullif(trim(p_currency), ''), 'ZAR'), 3));
begin
  if v_caller is null then
    raise exception 'Sign in before starting a hosted payment.';
  end if;

  select * into v_order from public.orders o where o.id = p_order_id;
  if not found then
    raise exception 'Order not found.';
  end if;

  if not public.is_staff(v_caller) and v_order.customer_id is distinct from v_caller then
    raise exception 'This order belongs to another account.';
  end if;

  if v_order.payment_method <> 'PayFast' then
    raise exception 'This order is not set up for hosted card payment.';
  end if;

  if v_order.status ilike 'cancelled%' or v_order.payment_status in ('Paid', 'Refunded') then
    raise exception 'This order can no longer be paid.';
  end if;

  -- A conversion rate outside a plausible band is a configuration mistake; refuse
  -- rather than send the provider a nonsense amount.
  v_rate := coalesce(p_conversion_rate, 1);
  if v_rate <= 0 or v_rate > 1000 then
    raise exception 'The payment conversion rate is not configured correctly.';
  end if;

  v_amount := round((v_order.total::numeric * v_rate), 2);
  -- The provider documents a minimum trade amount of 5.00.
  if v_amount < 5.00 then
    raise exception 'The order total is below the provider minimum for a hosted payment.';
  end if;

  insert into public.payments as p (
    order_id, order_number, customer_name, customer_email, amount, method, status,
    provider, provider_currency, provider_amount
  )
  values (
    v_order.id, v_order.order_number, v_order.customer_name, v_order.customer_email,
    v_amount, 'PayFast', 'Pending', 'payfast', v_currency, v_amount
  )
  on conflict (order_id) do update
    set amount = excluded.amount,
        method = 'PayFast',
        status = 'Pending',
        provider = 'payfast',
        provider_currency = excluded.provider_currency,
        provider_amount = excluded.provider_amount,
        updated_at = now()
    where p.status not in ('Paid', 'Verified', 'Rejected')
      and p.provider in ('manual', 'payfast');

  return query
  select v_order.id,
         v_order.order_number,
         v_amount,
         v_currency::text,
         left('HM Signature order ' || v_order.order_number, 100)::text,
         v_order.customer_name,
         v_order.customer_email,
         v_order.order_number;
end;
$$;

create or replace function public.apply_payfast_notification(
  p_m_payment_id text,
  p_pf_payment_id text,
  p_payment_status text,
  p_amount_gross numeric,
  p_currency text,
  p_merchant_id text,
  p_expected_merchant_id text,
  p_source text default 'itn'
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_expected numeric(12,2);
  v_result text;
begin
  if nullif(trim(coalesce(p_m_payment_id, '')), '') is null then
    return 'ignored: no order reference';
  end if;

  select * into v_payment from public.payments p where p.order_number = trim(p_m_payment_id);
  if not found then
    return 'ignored: unknown order';
  end if;

  select * into v_order from public.orders o where o.id = v_payment.order_id;
  if not found then
    return 'ignored: order missing';
  end if;

  if nullif(trim(coalesce(p_expected_merchant_id, '')), '') is not null
     and trim(coalesce(p_merchant_id, '')) <> trim(p_expected_merchant_id) then
    insert into public.payment_events (payment_id, event_type, actor_id, notes, payload)
    values (v_payment.id, 'rejected', null, 'merchant id mismatch',
            jsonb_build_object('received', p_merchant_id, 'source', p_source));
    return 'rejected: merchant mismatch';
  end if;

  -- Compare against the amount this deployment recorded for the payment.
  v_expected := round(v_payment.amount::numeric, 2);
  if p_amount_gross is null or abs(p_amount_gross - v_expected) > 0.01 then
    insert into public.payment_events (payment_id, event_type, actor_id, notes, payload)
    values (v_payment.id, 'rejected', null, 'amount mismatch',
            jsonb_build_object('received', p_amount_gross, 'expected', v_expected, 'source', p_source));
    return 'rejected: amount mismatch';
  end if;

  if upper(coalesce(p_currency, '')) <> upper(coalesce(v_payment.provider_currency, 'ZAR')) then
    insert into public.payment_events (payment_id, event_type, actor_id, notes, payload)
    values (v_payment.id, 'rejected', null, 'currency mismatch',
            jsonb_build_object('received', p_currency, 'expected', v_payment.provider_currency,
                               'source', p_source));
    return 'rejected: currency mismatch';
  end if;

  if v_payment.provider_reference is not null
     and v_payment.provider_reference = nullif(trim(coalesce(p_pf_payment_id, '')), '')
     and v_payment.status in ('Paid', 'Verified', 'Failed') then
    insert into public.payment_events (payment_id, event_type, actor_id, notes, payload)
    values (v_payment.id, 'status_change', null, 'duplicate notification ignored',
            jsonb_build_object('pf_payment_id', p_pf_payment_id, 'source', p_source));
    return 'duplicate: already applied';
  end if;

  v_result := lower(coalesce(p_payment_status, ''));

  if v_result = 'complete' then
    update public.payments p
    set status = 'Paid',
        provider = 'payfast',
        provider_reference = nullif(trim(coalesce(p_pf_payment_id, '')), ''),
        provider_amount = p_amount_gross,
        provider_currency = upper(coalesce(p_currency, 'ZAR')),
        confirmed_at = now(),
        updated_at = now()
    where p.id = v_payment.id;

    update public.orders o
    set payment_status = 'Paid',
        status = case when o.status ilike 'pending%' then 'Confirmed' else o.status end,
        updated_at = now()
    where o.id = v_order.id;

    insert into public.payment_events (payment_id, event_type, actor_id, notes, payload)
    values (v_payment.id, 'approved', null, 'hosted payment completed',
            jsonb_build_object('pf_payment_id', p_pf_payment_id, 'amount', p_amount_gross,
                               'currency', p_currency, 'source', p_source));

    insert into public.order_status_history (order_id, status, note)
    values (v_order.id, 'Confirmed', 'Payment received through the hosted payment page.');

    return 'applied: paid';
  end if;

  if v_result = 'cancelled' then
    update public.payments p
    set status = 'Failed',
        provider = 'payfast',
        provider_reference = nullif(trim(coalesce(p_pf_payment_id, '')), ''),
        updated_at = now()
    where p.id = v_payment.id
      and p.status not in ('Paid', 'Verified');

    insert into public.payment_events (payment_id, event_type, actor_id, notes, payload)
    values (v_payment.id, 'rejected', null, 'customer cancelled at the payment page',
            jsonb_build_object('pf_payment_id', p_pf_payment_id, 'source', p_source));

    return 'applied: cancelled';
  end if;

  insert into public.payment_events (payment_id, event_type, actor_id, notes, payload)
  values (v_payment.id, 'status_change', null, 'unrecognised provider status',
          jsonb_build_object('status', p_payment_status, 'source', p_source));
  return 'recorded: unhandled status';
end;
$$;

comment on function public.start_payfast_payment(uuid, text, numeric) is
  'Server-side conversion of the recorded order total into the provider currency. p_conversion_rate comes from deployment configuration, never from the browser.';
