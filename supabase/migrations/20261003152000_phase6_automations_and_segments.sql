-- Phase 6 §17–§19: consent, controlled follow-up workflows, abandoned-cart
-- automation and customer segmentation.
--
-- Design rules this migration enforces:
--   * Every workflow ships DISABLED. Nothing reaches a customer until a staff
--     member turns it on deliberately.
--   * Marketing-shaped messages (cart reminders, re-engagement) additionally
--     require the customer's stored marketing consent, which defaults to OFF.
--   * Follow-ups are queued as tasks with a natural key, so a repeated or
--     overlapping run cannot queue the same reminder twice; delivery itself stays
--     in the one transactional email queue from Phase 5.
--   * Segments are explicit SQL rules over real rows, exposed as counts. No
--     sensitive attribute is used, and no individual is exported here.

-- ---------------------------------------------------------------------------
-- Communication preferences
-- ---------------------------------------------------------------------------

create table if not exists public.customer_communication_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  order_updates boolean not null default true,
  marketing_emails boolean not null default false,
  source text not null default 'default',
  updated_at timestamptz not null default now(),
  constraint customer_communication_preferences_source_check
    check (source in ('default', 'customer', 'staff', 'unsubscribe_link'))
);

alter table public.customer_communication_preferences enable row level security;

create policy "Owner reads communication preferences" on public.customer_communication_preferences
  for select using (user_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "Owner writes communication preferences" on public.customer_communication_preferences;
create policy "Owner writes communication preferences" on public.customer_communication_preferences
  for insert to authenticated with check (user_id = auth.uid());
create policy "Owner updates communication preferences" on public.customer_communication_preferences
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Every account gets an explicit row at signup so "no row" never has to be
-- interpreted as consent.
create or replace function public.ensure_communication_preferences() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.customer_communication_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_profiles_communication_preferences on public.profiles;
create trigger trg_profiles_communication_preferences
  after insert on public.profiles
  for each row execute function public.ensure_communication_preferences();

-- Backfill for accounts that already exist.
insert into public.customer_communication_preferences (user_id)
select p.id from public.profiles p
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Workflow definitions, run ledger and follow-up tasks
-- ---------------------------------------------------------------------------

create table if not exists public.automation_workflows (
  id text primary key,
  name text not null,
  description text not null,
  enabled boolean not null default false,
  delay_interval interval not null default '4 hours',
  max_per_customer integer not null default 1,
  requires_marketing_consent boolean not null default false,
  channel text not null default 'email' check (channel = 'email'),
  email_template text not null,
  updated_at timestamptz not null default now()
);

alter table public.automation_workflows enable row level security;
drop policy if exists "Staff read automation workflows" on public.automation_workflows;
create policy "Staff read automation workflows" on public.automation_workflows
  for select to authenticated using (public.is_staff(auth.uid()));
-- Changing the enabled flag is a deliberate, permission-gated act. The code is
-- the one stored in public.permissions (manage_settings); the browser's own
-- marketing.manage gate is applied on top by the admin console.
drop policy if exists "Staff manage automation workflows" on public.automation_workflows;
create policy "Staff manage automation workflows" on public.automation_workflows
  for update to authenticated
  using (public.has_permission(auth.uid(), 'manage_settings'))
  with check (public.has_permission(auth.uid(), 'manage_settings'));

insert into public.automation_workflows
  (id, name, description, delay_interval, max_per_customer, requires_marketing_consent, email_template)
values
  ('abandoned_cart', 'Abandoned bag reminder',
   'One reminder for a bag left unpaid for longer than the waiting period. Skipped once the bag is recovered or emptied, and only to a customer who accepted promotional email.',
   interval '4 hours', 1, true, 'abandoned_cart'),
  ('review_request', 'Review request after delivery',
   'Asks a customer to describe the fragrance once their parcel is marked delivered. One request per order; it is written from the order record only.',
   interval '2 days', 1, false, 'review_request'),
  ('delivery_followup', 'Delivery follow-up',
   'Confirms the parcel arrived and points at the concierge if something is wrong. Sent when a delivery is recorded.',
   interval '1 day', 1, false, 'order_delivered')
on conflict (id) do nothing;

create table if not exists public.automation_runs (
  id bigint generated by default as identity primary key,
  workflow_id text references public.automation_workflows (id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  candidates integer not null default 0,
  queued integer not null default 0,
  skipped integer not null default 0,
  error text,
  created_by uuid
);

alter table public.automation_runs enable row level security;
drop policy if exists "Staff read automation runs" on public.automation_runs;
create policy "Staff read automation runs" on public.automation_runs
  for select to authenticated using (public.is_staff(auth.uid()));

create table if not exists public.follow_up_tasks (
  id bigint generated by default as identity primary key,
  workflow_id text not null references public.automation_workflows (id) on delete cascade,
  task_key text not null,
  customer_id uuid references auth.users (id) on delete cascade,
  order_ref text,
  cart_id uuid,
  payload jsonb not null default '{}'::jsonb,
  due_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'claimed', 'completed', 'failed', 'skipped')),
  attempts integer not null default 0,
  last_error text,
  skip_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint follow_up_tasks_key_unique unique (task_key),
  constraint follow_up_tasks_attempts_check check (attempts >= 0 and attempts <= 12)
);

create index if not exists idx_follow_up_tasks_due
  on public.follow_up_tasks (status, due_at);
create index if not exists idx_follow_up_tasks_customer
  on public.follow_up_tasks (customer_id, workflow_id);

alter table public.follow_up_tasks enable row level security;
drop policy if exists "Staff read follow up tasks" on public.follow_up_tasks;
create policy "Staff read follow up tasks" on public.follow_up_tasks
  for select to authenticated using (public.is_staff(auth.uid()));

comment on table public.follow_up_tasks is
  'Scheduled follow-up work. Delivery happens through email_outbox; nothing here sends on its own and every workflow starts disabled.';

-- ---------------------------------------------------------------------------
-- Queueing: abandoned bags
-- ---------------------------------------------------------------------------

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
begin
  select * into v_workflow from public.automation_workflows w where w.id = 'abandoned_cart';
  if not found or v_workflow.enabled is not true then
    return 0;
  end if;

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
      -- A customer who already received the maximum reminders for this bag is
      -- never asked twice.
      and not exists (
        select 1 from public.follow_up_tasks t
        where t.workflow_id = 'abandoned_cart'
          and t.cart_id = c.id
      )
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

-- ---------------------------------------------------------------------------
-- Delivering due follow-ups into the transactional email queue
-- ---------------------------------------------------------------------------

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
  v_cart record;
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
      -- The bag must still be there and still unrecovered.
      select c.id, c.reminder_sent_at, c.recovered_at into v_cart
      from public.cart c where c.id = v_task.cart_id;

      if v_cart.id is null or v_cart.recovered_at is not null then
        update public.follow_up_tasks t
        set status = 'skipped', skip_reason = 'bag recovered or emptied', updated_at = now()
        where t.id = v_task.id;
        return query select v_task.id, v_task.workflow_id, 'skipped: recovered'::text;
        continue;
      end if;

      -- Reuse the reminder bookkeeping so a second reminder is impossible.
      begin
        perform public.mark_cart_recovery(v_task.cart_id, 'reminder');
      exception when others then
        update public.follow_up_tasks t
        set status = 'skipped', skip_reason = left(sqlerrm, 200), updated_at = now()
        where t.id = v_task.id;
        return query select v_task.id, v_task.workflow_id, 'skipped: already reminded'::text;
        continue;
      end;

      perform public.enqueue_email(
        'abandoned_cart:' || v_task.cart_id::text,
        'abandoned_cart',
        'customer',
        v_email,
        'Your bag at HM Signature is still open',
        jsonb_build_object(
          'customerName', coalesce(v_name, 'there'),
          'summary', v_task.payload ->> 'itemCount' || ' item(s), ' || coalesce(v_task.payload ->> 'bagTotal', '0'),
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

-- ---------------------------------------------------------------------------
-- One sweep entry point the worker calls
-- ---------------------------------------------------------------------------

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
    v_queued := public.queue_abandoned_cart_followups(p_limit);

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

-- ---------------------------------------------------------------------------
-- Admin visibility
-- ---------------------------------------------------------------------------

create or replace function public.get_automation_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Only staff can review automations.';
  end if;

  select jsonb_build_object(
    'workflows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', w.id,
        'name', w.name,
        'description', w.description,
        'enabled', w.enabled,
        'delayMinutes', greatest(0, floor(extract(epoch from w.delay_interval) / 60)),
        'requiresMarketingConsent', w.requires_marketing_consent,
        'pending', (select count(*) from public.follow_up_tasks t where t.workflow_id = w.id and t.status = 'pending'),
        'completed', (select count(*) from public.follow_up_tasks t where t.workflow_id = w.id and t.status = 'completed'),
        'skipped', (select count(*) from public.follow_up_tasks t where t.workflow_id = w.id and t.status = 'skipped'),
        'failed', (select count(*) from public.follow_up_tasks t where t.workflow_id = w.id and t.status = 'failed'),
        'lastRun', (
          select jsonb_build_object('at', r.finished_at, 'status', r.status, 'error', r.error)
          from public.automation_runs r where r.workflow_id = w.id
          order by r.started_at desc limit 1
        )
      ) order by w.name)
      from public.automation_workflows w
    ), '[]'::jsonb),
    'recentRuns', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'workflowId', r.workflow_id,
        'startedAt', r.started_at,
        'finishedAt', r.finished_at,
        'status', r.status,
        'queued', r.queued,
        'processed', r.candidates,
        'error', left(coalesce(r.error, ''), 200)
      ) order by r.started_at desc)
      from (select * from public.automation_runs order by started_at desc limit 12) r
    ), '[]'::jsonb),
    'queue', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'workflowId', t.workflow_id,
        'status', t.status,
        'dueAt', t.due_at,
        'attempts', t.attempts,
        'orderRef', t.order_ref,
        'lastError', left(coalesce(t.last_error, ''), 160),
        'skipReason', t.skip_reason
      ) order by t.due_at)
      from (select * from public.follow_up_tasks order by due_at desc limit 40) t
    ), '[]'::jsonb),
    'emailQueue', coalesce((
      select jsonb_agg(jsonb_build_object('status', e.status, 'count', cnt))
      from (
        select e.status, count(*) as cnt
        from public.email_outbox e
        group by e.status
      ) e
    ), '[]'::jsonb),
    'serverTime', now()
  ) into result;

  return result;
end;
$$;

create or replace function public.set_workflow_enabled(p_workflow_id text, p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_changed boolean := false;
begin
  if not public.has_permission(auth.uid(), 'manage_settings') then
    raise exception 'Only settings-authorized staff can change automations.';
  end if;

  update public.automation_workflows w
  set enabled = p_enabled, updated_at = now()
  where w.id = p_workflow_id;
  v_changed := found;

  return v_changed;
end;
$$;

-- ---------------------------------------------------------------------------
-- Segments: explicit rules, real counts, no personal export
-- ---------------------------------------------------------------------------

create or replace function public.get_customer_segments()
returns table (
  segment_id text,
  label text,
  rule text,
  customer_count bigint,
  measured_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with buyers as (
    select o.customer_id,
           count(*) filter (where lower(o.status) <> 'cancelled') as orders,
           max(o.created_at) as last_order
    from public.orders o
    where o.customer_id is not null
    group by o.customer_id
  ),
  people as (
    select p.id,
           b.orders,
           b.last_order,
           coalesce(pref.marketing_emails, false) as marketing_ok
    from public.profiles p
    left join buyers b on b.customer_id = p.id
    left join public.customer_communication_preferences pref on pref.user_id = p.id
    where p.role = 'customer' and p.status = 'active'
  ),
  cart_eligible as (
    select distinct c.user_id as id
    from public.cart c
    join public.follow_up_tasks t on t.cart_id = c.id and t.workflow_id = 'abandoned_cart'
    where c.recovered_at is null
  )
  select 'all_customers'::text, 'All active customers'::text,
         'profiles.role = customer and status = active'::text,
         count(*)::bigint, now() from people
  union all
  select 'new_customers', 'New customers',
         'active customers with no completed order yet',
         count(*)::bigint, now()
  from people where coalesce(orders, 0) = 0
  union all
  select 'repeat_customers', 'Repeat customers',
         'two or more non-cancelled orders',
         count(*)::bigint, now()
  from people where coalesce(orders, 0) >= 2
  union all
  select 'high_frequency', 'Frequent buyers',
         'three or more orders in the last 90 days',
         count(*)::bigint, now()
  from (
    select o.customer_id
    from public.orders o
    where o.created_at >= now() - interval '90 days' and lower(o.status) <> 'cancelled'
    group by o.customer_id
    having count(*) >= 3
  ) f
  union all
  select 'recently_active', 'Recently active',
         'an order within the last 30 days',
         count(*)::bigint, now()
  from people where last_order >= now() - interval '30 days'
  union all
  select 'inactive', 'Quiet for 120 days',
         'at least one order and nothing for 120 days',
         count(*)::bigint, now()
  from people
  where orders > 0 and (last_order is null or last_order < now() - interval '120 days')
  union all
  select 'cart_eligible', 'Eligible abandoned bags',
         'a queued bag reminder, unrecovered, with marketing consent',
         count(*)::bigint, now()
  from people p
  join cart_eligible e on e.id = p.id
  where p.marketing_ok
  order by 1;
$$;

alter function public.queue_abandoned_cart_followups(integer) owner to postgres;
alter function public.run_due_followups(integer) owner to postgres;
alter function public.run_automation_sweep(integer) owner to postgres;
alter function public.get_automation_dashboard() owner to postgres;
alter function public.set_workflow_enabled(text, boolean) owner to postgres;
alter function public.get_customer_segments() owner to postgres;

-- The sweep is server-side only: a browser must never be able to trigger sends.
revoke execute on function public.queue_abandoned_cart_followups(integer) from public, anon, authenticated;
revoke execute on function public.run_due_followups(integer) from public, anon, authenticated;
revoke execute on function public.run_automation_sweep(integer) from public, anon, authenticated;
revoke execute on function public.get_automation_dashboard() from public, anon;
revoke execute on function public.set_workflow_enabled(text, boolean) from public, anon;
revoke execute on function public.get_customer_segments() from public, anon;
grant execute on function public.get_automation_dashboard() to authenticated;
grant execute on function public.set_workflow_enabled(text, boolean) to authenticated;
grant execute on function public.get_customer_segments() to authenticated;

comment on function public.run_automation_sweep(integer) is
  'Server-only entry point for the scheduler: queues eligible abandoned bags and moves due follow-ups into email_outbox. Every workflow starts disabled and consent-gated.';
comment on function public.get_customer_segments() is
  'Explicit rules over real rows, returned as counts only — no individual customer is exposed.';
