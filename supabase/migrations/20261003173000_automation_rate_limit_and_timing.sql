-- Phase 6 §17/§18: the workflow row advertises a per-customer rate limit and a
-- configurable waiting period, so both must actually be enforced.
--
-- queue_abandoned_cart_followups previously limited reminders per bag only. A customer
-- with several saved bags could therefore receive several reminders. The cap now applies
-- per customer as well, using automation_workflows.max_per_customer.

create or replace function public.queue_abandoned_cart_followups(p_limit integer default 50)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_workflow public.automation_workflows%rowtype;
  v_row record;
  v_queued integer := 0;
  v_capacity integer;
begin
  select * into v_workflow from public.automation_workflows w where w.id = 'abandoned_cart';
  if not found or v_workflow.enabled is not true then
    return 0;
  end if;

  v_capacity := greatest(coalesce(v_workflow.max_per_customer, 1), 1);

  for v_row in
    select c.id as cart_id,
           c.user_id,
           p.full_name as customer_name,
           u.email as customer_email,
           coalesce(summary.bag_total, 0) as bag_total,
           coalesce(summary.item_count, 0) as item_count
    from public.cart c
    join auth.users u on u.id = c.user_id
    left join public.profiles p on p.id = c.user_id
    left join lateral (
      select coalesce(sum(ci.quantity * coalesce(v.price, 0)), 0) as bag_total,
             coalesce(sum(ci.quantity), 0) as item_count
      from public.cart_items ci
      left join public.product_variants v on v.id = ci.variant_id
      where ci.cart_id = c.id
    ) summary on true
    left join public.customer_communication_preferences pref on pref.user_id = c.user_id
    where c.user_id is not null
      and c.reminder_sent_at is null
      and c.recovered_at is null
      and c.updated_at < now() - v_workflow.delay_interval
      and coalesce(summary.item_count, 0) > 0
      and coalesce(pref.marketing_emails, false) = true
      -- This bag has never been reminded.
      and not exists (
        select 1 from public.follow_up_tasks t
        where t.workflow_id = 'abandoned_cart'
          and t.cart_id = c.id
      )
      -- and this customer still has room under the workflow's own limit.
      and (
        select count(*) from public.follow_up_tasks t2
        where t2.workflow_id = 'abandoned_cart'
          and t2.customer_id = c.user_id
      ) < v_capacity
    order by c.updated_at
    limit greatest(coalesce(p_limit, 50), 1)
  loop
    insert into public.follow_up_tasks (workflow_id, task_key, customer_id, cart_id, due_at, payload)
    values (
      'abandoned_cart',
      'abandoned_cart:' || v_row.cart_id::text,
      v_row.user_id,
      v_row.cart_id,
      now(),
      jsonb_build_object(
        'customerName', coalesce(v_row.customer_name, ''),
        'email', v_row.customer_email,
        'bagTotal', v_row.bag_total,
        'itemCount', v_row.item_count
      )
    )
    on conflict (task_key) do nothing;

    if found then
      v_queued := v_queued + 1;
    end if;
  end loop;

  return v_queued;
end;
$$;

-- Staff-adjustable waiting period. Clamped so a mistyped value cannot make the
-- reminder fire instantly or never at all.
create or replace function public.update_workflow_timing(p_workflow_id text, p_delay_minutes integer)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_changed boolean := false;
begin
  if not public.has_permission(auth.uid(), 'manage_settings') then
    raise exception 'Only settings-authorized staff can change automation timing.';
  end if;

  update public.automation_workflows w
  set delay_interval = (least(greatest(coalesce(p_delay_minutes, 240), 15), 10080)
                        || ' minutes')::interval,
      updated_at = now()
  where w.id = p_workflow_id;
  v_changed := found;

  return v_changed;
end;
$$;

alter function public.queue_abandoned_cart_followups(integer) owner to postgres;
alter function public.update_workflow_timing(text, integer) owner to postgres;

revoke execute on function public.queue_abandoned_cart_followups(integer) from public, anon, authenticated;
revoke execute on function public.update_workflow_timing(text, integer) from public, anon;
grant execute on function public.update_workflow_timing(text, integer) to authenticated;

comment on function public.queue_abandoned_cart_followups(integer) is
  'Queues abandoned-bag reminders for eligible, consented customers. Limits are per bag and per customer (max_per_customer); the workflow ships disabled.';
comment on function public.update_workflow_timing(text, integer) is
  'Settings-authorized staff only. Waiting period is clamped between 15 minutes and 7 days.';
