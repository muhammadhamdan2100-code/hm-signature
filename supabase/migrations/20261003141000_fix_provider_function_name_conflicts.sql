-- Phase 5 fix: start_payfast_payment returned a column set whose names collide with
-- the columns of the tables it writes (order_id, amount, provider…). PL/pgSQL then
-- refused to guess which one a bare identifier meant — "column reference
-- \"order_id\" is ambiguous" — and the only documented way to steer that
-- (plpgsql.variable_conflict) is not settable on Supabase. So the routine now
-- qualifies every column it touches and replaces the ON CONFLICT upsert with an
-- explicit existence check. Behaviour is unchanged; the names are unambiguous.

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
  v_existing uuid;
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

  select p.id into v_existing from public.payments p where p.order_id = p_order_id;

  if v_existing is null then
    insert into public.payments (
      order_id, order_number, customer_name, customer_email, amount, method, status,
      provider, provider_currency, provider_amount
    )
    values (
      v_order.id, v_order.order_number, v_order.customer_name, v_order.customer_email,
      v_amount, 'PayFast', 'Pending', 'payfast', v_currency, v_amount
    );
  else
    update public.payments t
    set amount = v_amount,
        method = 'PayFast',
        status = case
          when t.status in ('Paid', 'Verified', 'Rejected') then t.status
          else 'Pending'
        end,
        provider = case
          when t.status in ('Paid', 'Verified', 'Rejected') then t.provider
          else 'payfast'
        end,
        provider_currency = v_currency,
        provider_amount = v_amount,
        updated_at = now()
    where t.order_id = p_order_id
      -- A confirmed payment is never rewritten, and a manual verification record
      -- is never silently converted into a provider row.
      and t.status not in ('Paid', 'Verified', 'Rejected')
      and t.provider in ('manual', 'payfast');
  end if;

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

comment on function public.start_payfast_payment(uuid, text, numeric) is
  'Server-side conversion of the recorded order total into the provider currency. p_conversion_rate comes from deployment configuration, never from the browser.';
