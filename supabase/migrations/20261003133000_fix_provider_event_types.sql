-- Phase 5 correction: payment_events.event_type is constrained to
-- proof_uploaded | verification_started | approved | rejected | refund_initiated | status_change.
-- The provider notification routine wrote 'pending', which the check rejects, so an
-- informational event (duplicate callback, unrecognised status) would have failed the
-- whole notification instead of being recorded. Informational rows now use
-- 'status_change', which is what they are.

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
      -- A completed payment is never downgraded by a later cancel notice.
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

comment on function public.apply_payfast_notification(text, text, text, numeric, text, text, text, text) is
  'Server-only. Applies a signature-verified provider notification idempotently; refuses amount, currency or merchant mismatches and never touches stock.';
