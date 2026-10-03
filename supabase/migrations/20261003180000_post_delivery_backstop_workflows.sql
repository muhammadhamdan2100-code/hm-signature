-- Phase 6 §17: the two post-delivery workflows existed but nothing ever queued them,
-- so enabling them did nothing. They are now backed by a real event scan, and they are
-- deliberately a backstop rather than a second send: the delivery trigger already
-- queues the same message, and the queue dedupes by event key. A follow-up therefore
-- produces an email only when the original one is missing.

create or replace function public.queue_post_delivery_followups(p_limit integer default 50)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_workflow public.automation_workflows%rowtype;
  v_row record;
  v_queued integer := 0;
  v_workflow_id text;
begin
  foreach v_workflow_id in array array['delivery_followup', 'review_request']
  loop
    select * into v_workflow from public.automation_workflows w where w.id = v_workflow_id;
    if not found or v_workflow.enabled is not true then
      continue;
    end if;

    for v_row in
      select o.id as order_id,
             o.order_number,
             o.customer_id,
             s.delivered_at,
             p.full_name as customer_name,
             u.email as customer_email
      from public.orders o
      join public.shipments s on s.order_id = o.id and s.delivered_at is not null
      join auth.users u on u.id = o.customer_id
      left join public.profiles p on p.id = o.customer_id
      where o.customer_id is not null
        and lower(o.status) <> 'cancelled'
        and s.delivered_at < now() - v_workflow.delay_interval
        -- One request per order, forever. The waiting period is measured from the
        -- recorded delivery, not from when the sweep happens to run.
        and not exists (
          select 1 from public.follow_up_tasks t
          where t.workflow_id = v_workflow_id
            and t.order_ref = o.order_number
        )
      order by s.delivered_at
      limit greatest(coalesce(p_limit, 50), 1)
    loop
      insert into public.follow_up_tasks (workflow_id, task_key, customer_id, order_ref, due_at, payload)
      values (
        v_workflow_id,
        v_workflow_id || ':' || v_row.order_number,
        v_row.customer_id,
        v_row.order_number,
        now(),
        jsonb_build_object(
          'customerName', coalesce(v_row.customer_name, ''),
          'email', v_row.customer_email,
          'deliveredAt', v_row.delivered_at
        )
      )
      on conflict (task_key) do nothing;

      if found then
        v_queued := v_queued + 1;
      end if;
    end loop;
  end loop;

  return v_queued;
end;
$$;

-- The sweep now covers both sources of work.
create or replace function public.run_automation_sweep(p_limit integer default 25)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_queued integer := 0;
  v_delivered integer := 0;
  v_run bigint;
  v_error text;
begin
  insert into public.automation_runs (workflow_id, status, created_by)
  values (null, 'running', auth.uid())
  returning id into v_run;

  begin
    v_queued := public.queue_abandoned_cart_followups(p_limit)
             + public.queue_post_delivery_followups(p_limit);

    select count(*) into v_delivered from public.run_due_followups(p_limit);

    update public.automation_runs r
    set status = 'succeeded', finished_at = now(), queued = v_queued, candidates = v_delivered
    where r.id = v_run;

    return jsonb_build_object('queued', v_queued, 'processed', v_delivered, 'runId', v_run);
  exception when others then
    v_error := left(sqlerrm, 300);
    update public.automation_runs r
    set status = 'failed', finished_at = now(), error = v_error
    where r.id = v_run;
    return jsonb_build_object('error', v_error, 'runId', v_run);
  end;
end;
$$;

-- Same change as above plus one fix: the delivery check-in must reuse the event key the
-- delivery trigger uses, otherwise a customer would receive the same message twice.
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
      -- Reuses the delivery trigger's own event key, so this can only fill a gap.
      perform public.enqueue_email(
        'order_delivered:' || coalesce(v_task.order_ref, v_task.id::text),
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

-- The description shown to staff has to match what the workflow actually does.
update public.automation_workflows
set description = 'Backstop for the delivery check-in. The delivery event normally queues this message immediately; this run only creates it when that record is missing, and the queue refuses a duplicate.'
where id = 'delivery_followup';

update public.automation_workflows
set description = 'Backstop for the review request, measured from the recorded delivery time. One per order, and the queue refuses a duplicate of the message the delivery event already sent.'
where id = 'review_request';

alter function public.queue_post_delivery_followups(integer) owner to postgres;
alter function public.run_automation_sweep(integer) owner to postgres;
alter function public.run_due_followups(integer) owner to postgres;

revoke execute on function public.queue_post_delivery_followups(integer) from public, anon, authenticated;
grant execute on function public.queue_post_delivery_followups(integer) to service_role;

comment on function public.queue_post_delivery_followups(integer) is
  'Server-only. Scans recorded deliveries older than the workflow waiting period and queues one task per order; the queue itself prevents duplicate messages.';
