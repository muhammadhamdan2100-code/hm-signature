-- Phase 8 (8.6) follow-up: a cancellation must also take back the points the order earned.
--
-- Without this, cancelling an order would return redeemed points but leave the award the payment
-- generated, so a customer could earn and keep points on an order that no longer exists. Points are
-- money-equivalent, so the ledger has to close both halves. The original loyalty migration stays
-- exactly as it was applied; this extends the entry types and the trigger.

begin;

alter table public.loyalty_ledger
  drop constraint if exists loyalty_ledger_entry_type_check;

alter table public.loyalty_ledger
  add constraint loyalty_ledger_entry_type_check check (
    entry_type in ('earn_purchase', 'earn_signup', 'earn_review', 'earn_referral', 'earn_birthday',
                   'earn_campaign', 'redeem', 'cancel_reversal', 'cancel_clawback', 'expire', 'adjust')
  );

comment on column public.loyalty_ledger.entry_type is
  'Why the points moved. cancel_reversal returns what was redeemed; cancel_clawback takes back what the order earned.';

create unique index if not exists loyalty_ledger_clawback_order_uidx
  on public.loyalty_ledger (order_id)
  where entry_type = 'cancel_clawback' and order_id is not null;

create or replace function public.reverse_loyalty_on_cancellation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redeemed integer;
  v_earned integer;
begin
  if new.status <> 'Cancelled' or old.status = 'Cancelled' then
    return new;
  end if;

  -- Return points the customer spent on this order, once.
  if new.loyalty_points_used > 0
     and not exists (select 1 from public.loyalty_ledger where order_id = new.id and entry_type = 'cancel_reversal') then
    select coalesce(sum(-points), 0)::integer into v_redeemed
    from public.loyalty_ledger
    where order_id = new.id and entry_type = 'redeem';

    if v_redeemed > 0 then
      insert into public.loyalty_ledger (customer_id, points, entry_type, reason, order_id, written_by)
      values (new.customer_id, v_redeemed, 'cancel_reversal',
              'Points returned after cancellation of ' || coalesce(new.order_number, new.id::text),
              new.id, auth.uid());
    end if;
  end if;

  -- Take back the award this order generated, once.
  if not exists (select 1 from public.loyalty_ledger where order_id = new.id and entry_type = 'cancel_clawback') then
    select coalesce(sum(points), 0)::integer into v_earned
    from public.loyalty_ledger
    where order_id = new.id and entry_type like 'earn%';

    if v_earned > 0 then
      insert into public.loyalty_ledger (customer_id, points, entry_type, reason, order_id, written_by)
      values (new.customer_id, -v_earned, 'cancel_clawback',
              'Award removed after cancellation of ' || coalesce(new.order_number, new.id::text),
              new.id, auth.uid());
    end if;
  end if;

  return new;
exception
  when unique_violation then
    return new;
end;
$$;

select 'phase8c_clawback '
  || 'entry_check ' || (select count(*) from pg_constraint where conname = 'loyalty_ledger_entry_type_check')
  || ' | clawback_index ' || (select count(*) from pg_class where relname = 'loyalty_ledger_clawback_order_uidx')
  || ' | trigger ' || (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid where t.tgname = 'trg_loyalty_cancel_reversal' and c.relname = 'orders');

commit;
