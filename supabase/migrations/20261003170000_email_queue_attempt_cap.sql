-- Phase 5 queue robustness, found while wiring the Phase 6 scheduler.
--
-- Two ways the outbox could stop working permanently:
--   1. email_outbox has CHECK (attempts <= 25) but the claim query kept selecting
--      'failed' rows, so a 26th claim would raise and abort the whole batch — one
--      undeliverable address would then block every other customer's email.
--   2. a claim marks a row 'sending'; if the function dies mid-batch the row is left
--      in 'sending', which the claim query never selected again.
-- Both are fixed here: attempt ceiling is respected, and a stale 'sending' row is
-- reclaimable.

create or replace function public.claim_email_batch(p_limit integer default 10)
returns setof public.email_outbox
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_limit is null or p_limit < 1 then
    p_limit := 1;
  end if;
  if p_limit > 50 then
    p_limit := 50;
  end if;

  return query
  with picked as (
    select e.id
    from public.email_outbox e
    where e.next_attempt_at <= now()
      and e.attempts < 25
      and (
        e.status in ('pending', 'failed')
        -- A previous worker that died mid-batch leaves 'sending' behind; after the
        -- function's own timeout window it is safe to try that row again.
        or (e.status = 'sending' and e.updated_at < now() - interval '15 minutes')
      )
    order by e.created_at
    for update of e skip locked
    limit p_limit
  )
  update public.email_outbox e
  set status = 'sending',
      attempts = e.attempts + 1,
      updated_at = now()
  from picked
  where e.id = picked.id
  returning e.*;
end;
$$;

create or replace function public.claim_email_batch_for_self(p_limit integer default 3)
returns setof public.email_outbox
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text;
begin
  select u.email into v_email from auth.users u where u.id = auth.uid();
  if v_email is null then
    return;
  end if;

  if p_limit is null or p_limit < 1 then
    p_limit := 1;
  end if;
  if p_limit > 5 then
    p_limit := 5;
  end if;

  return query
  with picked as (
    select e.id
    from public.email_outbox e
    where e.recipient_kind = 'customer'
      and lower(e.recipient_email) = lower(v_email)
      and e.next_attempt_at <= now()
      and e.attempts < 25
      and (
        e.status in ('pending', 'failed')
        or (e.status = 'sending' and e.updated_at < now() - interval '15 minutes')
      )
    order by e.created_at
    for update of e skip locked
    limit p_limit
  )
  update public.email_outbox e
  set status = 'sending',
      attempts = e.attempts + 1,
      updated_at = now()
  from picked
  where e.id = picked.id
  returning e.*;
end;
$$;

alter function public.claim_email_batch(integer) owner to postgres;
alter function public.claim_email_batch_for_self(integer) owner to postgres;

-- Signatures are unchanged, so the existing grants survive the replace; restated so
-- a fresh branch off these migrations ends up in the same state.
revoke execute on function public.claim_email_batch(integer) from public, anon;
grant execute on function public.claim_email_batch(integer) to service_role;
revoke execute on function public.claim_email_batch_for_self(integer) from public, anon;
grant execute on function public.claim_email_batch_for_self(integer) to authenticated, service_role;

comment on function public.claim_email_batch(integer) is
  'Claims due outbox rows for the server worker. Respects the attempt ceiling and reclaims rows a crashed worker left in sending.';
comment on function public.claim_email_batch_for_self(integer) is
  'Claims queued customer mail for the caller''s own auth email only. Used by the email worker''s session path so a checkout does not wait on a scheduler.';
