-- Phase 5 §5–§7: provider-ready hosted payments, reconciliation and refund review.
--
-- Everything here is additive. The four existing manual methods (Cash on Delivery,
-- JazzCash, Raast, Bank Transfer) keep working exactly as before: a provider row is
-- only created when a hosted payment is actually started. Amounts are always read
-- from the orders table — nothing in this schema lets the browser state a price,
-- a currency or a merchant identity.

alter table public.payments
  add column if not exists provider text not null default 'manual',
  add column if not exists provider_reference text,
  add column if not exists provider_amount numeric(12,2),
  add column if not exists provider_currency text,
  add column if not exists confirmed_at timestamptz;

comment on column public.payments.provider is
  'manual for Cash on Delivery / JazzCash / Raast / Bank Transfer records; payfast once a hosted payment is started.';
comment on column public.payments.provider_reference is
  'Provider transaction id (pf_payment_id). Unique per provider so a replayed callback cannot be applied twice.';

-- Replay / duplicate protection: one provider transaction may be recorded once.
create unique index if not exists uniq_payments_provider_reference
  on public.payments (provider, provider_reference)
  where provider_reference is not null;

create index if not exists idx_payments_provider
  on public.payments (provider, status);

-- ---------------------------------------------------------------------------
-- Start a hosted payment: the server reads the authoritative total.
-- ---------------------------------------------------------------------------

create or replace function public.start_payfast_payment(
  p_order_id uuid,
  p_currency text default 'ZAR'
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

  -- Only the buyer (or staff) may start a payment for an order.
  if not public.is_staff(v_caller) and v_order.customer_id is distinct from v_caller then
    raise exception 'This order belongs to another account.';
  end if;

  if v_order.payment_method <> 'PayFast' then
    raise exception 'This order is not set up for hosted card payment.';
  end if;

  if v_order.status ilike 'cancelled%' or v_order.payment_status in ('Paid', 'Refunded') then
    raise exception 'This order can no longer be paid.';
  end if;

  v_amount := round(v_order.total::numeric, 2);
  if v_amount <= 0 then
    raise exception 'The recorded order total is not payable.';
  end if;

  insert into public.payments as p (
    order_id, order_number, customer_name, customer_email, amount, method, status,
    provider, provider_currency
  )
  values (
    v_order.id, v_order.order_number, v_order.customer_name, v_order.customer_email,
    v_amount, 'PayFast', 'Pending', 'payfast', v_currency
  )
  on conflict (order_id) do update
    set amount = excluded.amount,
        method = 'PayFast',
        status = 'Pending',
        provider = 'payfast',
        provider_currency = excluded.provider_currency,
        updated_at = now()
    -- A confirmed payment is never rewritten, and a manual verification record is
    -- never silently converted to a provider row.
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

-- ---------------------------------------------------------------------------
-- Apply a verified provider notification. The signature and the provider
-- postback are verified in api/payfast-notify.js; this routine decides what
-- happens to the data and refuses anything that does not match the order.
-- ---------------------------------------------------------------------------

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

  -- Merchant identity: the notification must name this deployment's merchant.
  if nullif(trim(coalesce(p_expected_merchant_id, '')), '') is not null
     and trim(coalesce(p_merchant_id, '')) <> trim(p_expected_merchant_id) then
    insert into public.payment_events (payment_id, event_type, actor_id, notes, payload)
    values (v_payment.id, 'rejected', null, 'merchant id mismatch',
            jsonb_build_object('received', p_merchant_id, 'source', p_source));
    return 'rejected: merchant mismatch';
  end if;

  -- Amount must match the recorded order total, not anything a browser reported.
  v_expected := round(v_order.total::numeric, 2);
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

  -- Replay protection: the same provider transaction is only ever applied once.
  if v_payment.provider_reference is not null
     and v_payment.provider_reference = nullif(trim(coalesce(p_pf_payment_id, '')), '')
     and v_payment.status in ('Paid', 'Verified', 'Failed') then
    insert into public.payment_events (payment_id, event_type, actor_id, notes, payload)
    values (v_payment.id, 'pending', null, 'duplicate notification ignored',
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
      -- A completed payment is never downgraded by a later cancel notice.
      and p.status not in ('Paid', 'Verified');

    insert into public.payment_events (payment_id, event_type, actor_id, notes, payload)
    values (v_payment.id, 'rejected', null, 'customer cancelled at the payment page',
            jsonb_build_object('pf_payment_id', p_pf_payment_id, 'source', p_source));

    return 'applied: cancelled';
  end if;

  insert into public.payment_events (payment_id, event_type, actor_id, notes, payload)
  values (v_payment.id, 'pending', null, 'unrecognised provider status',
          jsonb_build_object('status', p_payment_status, 'source', p_source));
  return 'recorded: unhandled status';
end;
$$;

-- ---------------------------------------------------------------------------
-- Reconciliation: expected against recorded, from real rows only.
-- ---------------------------------------------------------------------------

create or replace function public.get_payment_reconciliation(p_days integer default 30)
returns table (
  order_id uuid,
  order_number text,
  order_status text,
  payment_status text,
  provider text,
  method text,
  expected_amount numeric,
  recorded_amount numeric,
  difference numeric,
  currency text,
  provider_reference text,
  payment_state text,
  refunded_amount numeric,
  reconciliation_state text,
  payment_date timestamptz,
  order_created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Only staff can review payment reconciliation.';
  end if;

  return query
  with scored as (
    select
      o.id as order_id,
      o.order_number,
      o.status as order_status,
      o.payment_status,
      coalesce(nullif(p.provider, ''), 'manual')::text as provider,
      o.payment_method as method,
      round(o.total::numeric, 2) as expected_amount,
      round(coalesce(p.amount, 0)::numeric, 2) as recorded_amount,
      round((coalesce(p.amount, 0) - o.total)::numeric, 2) as difference,
      coalesce(p.provider_currency, 'PKR')::text as currency,
      p.provider_reference,
      coalesce(p.status, 'none')::text as payment_state,
      round(coalesce(r.refunded, 0)::numeric, 2) as refunded_amount,
      p.created_at as payment_date,
      o.created_at as order_created_at
    from public.orders o
    left join public.payments p on p.order_id = o.id
    left join (
      select rf.order_id, sum(rf.amount) as refunded
      from public.refunds rf
      where lower(rf.status) = 'processed'
      group by rf.order_id
    ) r on r.order_id = o.id
    where o.created_at >= (now() - make_interval(days => greatest(coalesce(p_days, 30), 1)))
  )
  select
    s.order_id,
    s.order_number,
    s.order_status,
    s.payment_status,
    s.provider,
    s.method,
    s.expected_amount,
    s.recorded_amount,
    s.difference,
    s.currency,
    s.provider_reference,
    s.payment_state,
    s.refunded_amount,
    case
      when s.payment_status = 'Paid' and s.payment_state in ('Paid', 'Verified') and s.difference = 0
        then 'matched'
      when s.payment_status = 'Paid' and s.payment_state not in ('Paid', 'Verified')
        then 'missing_payment_record'
      when s.payment_state in ('Paid', 'Verified') and s.difference <> 0
        then 'amount_mismatch'
      when s.payment_status in ('Pending', 'Verification Pending') and s.payment_state = 'Pending'
        then 'pending'
      when s.payment_state = 'Failed'
        then 'failed'
      when s.order_status ilike 'cancelled%' and s.payment_status = 'Paid' and s.refunded_amount = 0
        then 'unrefunded_cancellation'
      when s.refunded_amount > s.recorded_amount
        then 'refund_discrepancy'
      else 'review'
    end::text as reconciliation_state,
    s.payment_date,
    s.order_created_at
  from scored s
  order by s.order_created_at desc;
end;
$$;

-- Duplicate provider transactions, if any ever appear. The unique index should make
-- this impossible; the function exists so staff can prove it rather than trust it.
create or replace function public.get_duplicate_payment_events(p_days integer default 30)
returns table (provider_reference text, occurrences bigint, order_numbers text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Only staff can review payment reconciliation.';
  end if;

  return query
  select p.provider_reference,
         count(*)::bigint,
         string_agg(distinct p.order_number, ', ')::text
  from public.payments p
  where p.provider_reference is not null
    and p.created_at >= (now() - make_interval(days => greatest(coalesce(p_days, 30), 1)))
  group by p.provider_reference
  having count(*) > 1;
end;
$$;

alter function public.start_payfast_payment(uuid, text) owner to postgres;
alter function public.apply_payfast_notification(text, text, text, numeric, text, text, text, text) owner to postgres;
alter function public.get_payment_reconciliation(integer) owner to postgres;
alter function public.get_duplicate_payment_events(integer) owner to postgres;

-- Only the server applies provider notifications; nothing anonymous may call these.
revoke execute on function public.apply_payfast_notification(text, text, text, numeric, text, text, text, text)
  from public, anon, authenticated;
revoke execute on function public.start_payfast_payment(uuid, text) from public, anon;
grant execute on function public.start_payfast_payment(uuid, text) to authenticated;
revoke execute on function public.get_payment_reconciliation(integer) from public, anon;
grant execute on function public.get_payment_reconciliation(integer) to authenticated;
revoke execute on function public.get_duplicate_payment_events(integer) from public, anon;
grant execute on function public.get_duplicate_payment_events(integer) to authenticated;

comment on function public.start_payfast_payment(uuid, text) is
  'Returns the authoritative order data used to build a signed hosted-payment form. Reads the stored total; the browser supplies no amount.';
comment on function public.apply_payfast_notification(text, text, text, numeric, text, text, text, text) is
  'Server-only. Applies a signature-verified provider notification idempotently; refuses amount, currency or merchant mismatches and never touches stock.';
