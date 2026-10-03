-- Phase 5 §6: reconciliation must show the payment reference the customer stated as
-- well as the provider transaction id, so a mismatch can be investigated without
-- opening each order separately. A return type cannot be changed in place, so the
-- function is dropped and rebuilt, and its grants are re-applied in the same
-- transaction (Supabase grants EXECUTE to PUBLIC on new functions by default).

drop function if exists public.get_payment_reconciliation(integer);

create or replace function public.get_payment_reconciliation(p_days integer default 30)
returns table (
  order_id uuid,
  order_number text,
  order_status text,
  payment_status text,
  provider text,
  method text,
  payment_reference text,
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
      p.reference_id as payment_reference,
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
    s.payment_reference,
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

alter function public.get_payment_reconciliation(integer) owner to postgres;
revoke execute on function public.get_payment_reconciliation(integer) from public, anon;
grant execute on function public.get_payment_reconciliation(integer) to authenticated;

comment on function public.get_payment_reconciliation(integer) is
  'Staff-only comparison of recorded order totals against payment records, refunds and provider transactions. Read-only: it never marks anything as paid.';
