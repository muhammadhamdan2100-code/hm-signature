-- Phase 6 follow-up: cart.recovery_updated_by is a uuid column (it records which
-- staff member last changed the recovery state), so the automation cannot write a
-- text marker into it. The runner now stamps only reminder_sent_at — which is what
-- makes a second reminder impossible — and leaves the human-action author column
-- untouched.

create or replace function public.run_due_followups(p_limit integer default 25)
returns table (task_id bigint, workflow_id text, outcome text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_task public.follow_up_tasks%rowtype;
  v_workflow public.automation_workflows%rowtype;
  v_email text;
  v_name text;
  v_marketing boolean;
  v_cart_id uuid;
begin
  for v_task in
    select t.* from public.follow_up_tasks t
    where t.status = 'pending'
      and t.due_at <= now()
      and t.attempts < 6
    order by t.due_at
    for update of t skip locked
    limit greatest(coalesce(p_limit, 25), 1)
  loop
    update public.follow_up_tasks t
    set status = 'claimed', attempts = t.attempts + 1, updated_at = now()
    where t.id = v_task.id;

    select * into v_workflow from public.automation_workflows w where w.id = v_task.workflow_id;

    if v_workflow.id is null or v_workflow.enabled is not true then
      update public.follow_up_tasks t
      set status = 'skipped', skip_reason = 'workflow disabled', updated_at = now()
      where t.id = v_task.id;
      return query select v_task.id, v_task.workflow_id, 'skipped: disabled'::text;
      continue;
    end if;

    select u.email, p.full_name into v_email, v_name
    from auth.users u
    left join public.profiles p on p.id = u.id
    where u.id = v_task.customer_id;

    if v_email is null then
      update public.follow_up_tasks t
      set status = 'failed', last_error = 'no address on record', updated_at = now()
      where t.id = v_task.id;
      return query select v_task.id, v_task.workflow_id, 'failed: no address'::text;
      continue;
    end if;

    select pref.marketing_emails into v_marketing
    from public.customer_communication_preferences pref
    where pref.user_id = v_task.customer_id;

    if v_workflow.requires_marketing_consent and coalesce(v_marketing, false) is not true then
      update public.follow_up_tasks t
      set status = 'skipped', skip_reason = 'no marketing consent', updated_at = now()
      where t.id = v_task.id;
      return query select v_task.id, v_task.workflow_id, 'skipped: consent'::text;
      continue;
    end if;

    if v_task.workflow_id = 'abandoned_cart' then
      -- Claim the bag at the same moment the reminder is stamped: a bag that was
      -- recovered, emptied or already reminded is skipped, so a customer can never
      -- receive the same reminder twice.
      update public.cart c
      set reminder_sent_at = now(),
          updated_at = now()
      where c.id = v_task.cart_id
        and c.reminder_sent_at is null
        and c.recovered_at is null
      returning c.id into v_cart_id;

      if v_cart_id is null then
        update public.follow_up_tasks t
        set status = 'skipped', skip_reason = 'bag recovered, emptied or already reminded', updated_at = now()
        where t.id = v_task.id;
        return query select v_task.id, v_task.workflow_id, 'skipped: not eligible'::text;
        continue;
      end if;

      perform public.enqueue_email(
        'abandoned_cart:' || v_task.cart_id::text,
        'abandoned_cart',
        'customer',
        v_email,
        'Your bag at HM Signature is still open',
        jsonb_build_object(
          'customerName', coalesce(v_name, 'there'),
          'summary', coalesce(v_task.payload ->> 'itemCount', '0') || ' item(s), '
                     || coalesce(v_task.payload ->> 'bagTotal', '0'),
          'cartId', v_task.cart_id
        ),
        null
      );
    elsif v_task.workflow_id = 'review_request' then
      perform public.enqueue_email(
        'review_request:' || coalesce(v_task.order_ref, v_task.id::text),
        'review_request',
        'customer',
        v_email,
        'How does ' || coalesce(v_task.order_ref, 'your order') || ' feel on skin?',
        jsonb_build_object('orderNumber', v_task.order_ref, 'customerName', coalesce(v_name, 'there')),
        v_task.order_ref
      );
    elsif v_task.workflow_id = 'delivery_followup' then
      perform public.enqueue_email(
        'delivery_followup:' || coalesce(v_task.order_ref, v_task.id::text),
        'order_delivered',
        'customer',
        v_email,
        'Checking in on ' || coalesce(v_task.order_ref, 'your delivery'),
        jsonb_build_object('orderNumber', v_task.order_ref, 'customerName', coalesce(v_name, 'there')),
        v_task.order_ref
      );
    else
      update public.follow_up_tasks t
      set status = 'skipped', skip_reason = 'unknown workflow', updated_at = now()
      where t.id = v_task.id;
      return query select v_task.id, v_task.workflow_id, 'skipped: unknown'::text;
      continue;
    end if;

    update public.follow_up_tasks t
    set status = 'completed', completed_at = now(), updated_at = now(), last_error = null
    where t.id = v_task.id;

    return query select v_task.id, v_task.workflow_id, 'queued'::text;
  end loop;
end;
$$;

comment on function public.run_due_followups(integer) is
  'Moves due follow-up tasks into email_outbox. Consent and one-reminder-per-bag are enforced here; delivery still needs the email worker and SMTP.';
