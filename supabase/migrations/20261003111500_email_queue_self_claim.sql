-- Phase 5: let a signed-in customer ask for their own queued notifications to be
-- delivered immediately, without exposing anyone else's queue.
--
-- The worker endpoint drains everything under the deployment secret. A checkout
-- page, however, should not have to wait for a scheduler to see its own
-- confirmation go out. This claim variant is SECURITY DEFINER but derives the
-- recipient from auth.uid() server-side: a caller can only ever claim rows whose
-- recipient address is the address of their own authenticated account.

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
    where e.status in ('pending', 'failed')
      and e.recipient_kind = 'customer'
      and lower(e.recipient_email) = lower(v_email)
      and e.next_attempt_at <= now()
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

alter function public.claim_email_batch_for_self(integer) owner to postgres;

-- Anonymous callers get nothing; a session is required for the identity lookup.
revoke execute on function public.claim_email_batch_for_self(integer) from public, anon;
grant execute on function public.claim_email_batch_for_self(integer) to authenticated;

comment on function public.claim_email_batch_for_self(integer) is
  'Claims queued customer mail for the caller''s own auth email only. Used by the email worker''s session path so a checkout does not wait on a scheduler.';
