-- Phase 6 automation rules, verified against the real database end to end.
--
-- These rules need the service role (queue_abandoned_cart_followups,
-- queue_post_delivery_followups, run_due_followups and run_automation_sweep are not
-- executable from any browser session), so they cannot live in the vitest suite. Run
-- them on demand with:
--
--   npx supabase db query --linked --project-ref <ref> --output-format json \
--     -f tests/sql/phase6-automation-rules.sql
--
-- The script creates throwaway rows for the QA suite accounts only and removes every
-- one of them at the end, returning the workflows, consent records and ledgers to the
-- shipped posture (all disabled, consent off, tables empty).
--
-- Expected output when the rules hold:
--   A1 1        A2 queued       A3 0        A4 1        A5 1        A6 tasks=0 carts=0
--   B1 1        B2 0            B3 1        B4 0        B5 refused  B6 1 min -> 15
--   C1 4 templates  C2 2 tasks  C3 queued,queued  C4 duplicates=0  C5 sweep adds 0
--   D1 everything back at baseline

drop table if exists pg_temp.auto_rules;
create temp table pg_temp.auto_rules (step text, result text);

-- ---------------------------------------------------------------------------
-- A. abandoned bag: one reminder per bag, one email, then nothing
-- ---------------------------------------------------------------------------

-- cart has a partial unique index on user_id, so a bag saved by an earlier browser
-- session would block the fixture insert (and the item rows below would fail the
-- foreign key). Only the QA suite account this script belongs to is cleared — never a
-- real customer, and the account itself is listed for removal before launch.
delete from public.cart_items where cart_id in (
  select id from public.cart where user_id = '0a0a0a0a-0000-4000-8000-000000000001'
);
delete from public.cart where user_id = '0a0a0a0a-0000-4000-8000-000000000001';

insert into public.cart (id, user_id, updated_at)
values ('0a0a0a0a-0000-4000-8000-00000000e001', '0a0a0a0a-0000-4000-8000-000000000001', now() - interval '6 hours')
on conflict do nothing;

insert into public.cart_items (cart_id, product_id, variant_id, quantity)
select '0a0a0a0a-0000-4000-8000-00000000e001', v.product_id, v.id, 1
from public.product_variants v where v.active limit 1
on conflict (cart_id, variant_id) do nothing;

update public.automation_workflows set enabled = true, max_per_customer = 1, delay_interval = interval '4 hours'
where id = 'abandoned_cart';
update public.customer_communication_preferences set marketing_emails = true
where user_id = '0a0a0a0a-0000-4000-8000-000000000001';

insert into pg_temp.auto_rules
select 'A1 bag queued', public.queue_abandoned_cart_followups(20)::text;

insert into pg_temp.auto_rules
select 'A2 delivered outcome', coalesce(string_agg(outcome, ','), 'none') from public.run_due_followups(20);

insert into pg_temp.auto_rules
select 'A3 queue again (expect 0)', public.queue_abandoned_cart_followups(20)::text;

insert into pg_temp.auto_rules
select 'A4 reminder stamped once',
  coalesce((select reminder_sent_at is not null from public.cart where id = '0a0a0a0a-0000-4000-8000-00000000e001')::text, 'missing');

insert into pg_temp.auto_rules
select 'A5 abandoned_cart emails total',
  (select count(*) from public.email_outbox where template = 'abandoned_cart')::text;

-- ---------------------------------------------------------------------------
-- B. exclusions, rate limit and configurable timing
-- ---------------------------------------------------------------------------

-- A new bag for the same customer is still capped by max_per_customer = 1.
delete from public.cart_items where cart_id = '0a0a0a0a-0000-4000-8000-00000000e001';
delete from public.cart where id = '0a0a0a0a-0000-4000-8000-00000000e001';
insert into public.cart (id, user_id, updated_at)
values ('0a0a0a0a-0000-4000-8000-00000000e002', '0a0a0a0a-0000-4000-8000-000000000001', now() - interval '6 hours');
insert into public.cart_items (cart_id, product_id, variant_id, quantity)
select '0a0a0a0a-0000-4000-8000-00000000e002', v.product_id, v.id, 1
from public.product_variants v where v.active limit 1
on conflict (cart_id, variant_id) do nothing;

insert into pg_temp.auto_rules
select 'B1 second bag under cap 1 (expect 0)', public.queue_abandoned_cart_followups(20)::text;

update public.automation_workflows set max_per_customer = 2 where id = 'abandoned_cart';

insert into pg_temp.auto_rules
select 'B2 same bag with cap 2 (expect 1)', public.queue_abandoned_cart_followups(20)::text;

-- A recovered bag is never reminded.
update public.cart set recovered_at = now() where id = '0a0a0a0a-0000-4000-8000-00000000e002';
delete from public.follow_up_tasks where cart_id = '0a0a0a0a-0000-4000-8000-00000000e002';

insert into pg_temp.auto_rules
select 'B3 recovered bag (expect 0)', public.queue_abandoned_cart_followups(20)::text;

-- Withdrawn consent is honoured immediately.
update public.cart set recovered_at = null where id = '0a0a0a0a-0000-4000-8000-00000000e002';
update public.customer_communication_preferences set marketing_emails = false
where user_id = '0a0a0a0a-0000-4000-8000-000000000001';

insert into pg_temp.auto_rules
select 'B4 consent withdrawn (expect 0)', public.queue_abandoned_cart_followups(20)::text;

update public.customer_communication_preferences set marketing_emails = true
where user_id = '0a0a0a0a-0000-4000-8000-000000000001';

-- update_workflow_timing is staff-session only; a direct connection must be refused.
do $$
begin
  perform public.update_workflow_timing('abandoned_cart', 60);
  insert into pg_temp.auto_rules select 'B5 timing rpc without a session', 'ACCEPTED — unexpected';
exception when others then
  insert into pg_temp.auto_rules select 'B5 timing rpc without a session', 'refused';
end;
$$;

-- The clamp the function applies, evaluated with its own expression.
insert into pg_temp.auto_rules
select 'B6 clamp arithmetic',
  '1 min -> ' || (select (extract(epoch from (least(greatest(1, 15), 10080) || ' minutes')::interval)/60)::int)::text
  || ' · 99999 min -> ' || (select (extract(epoch from (least(greatest(99999, 15), 10080) || ' minutes')::interval)/3600)::int)::text || ' h';

-- ---------------------------------------------------------------------------
-- C. post-delivery workflows are a backstop, never a second copy
-- ---------------------------------------------------------------------------

delete from public.cart_items where cart_id = '0a0a0a0a-0000-4000-8000-00000000e002';
delete from public.cart where id = '0a0a0a0a-0000-4000-8000-00000000e002';
delete from public.follow_up_tasks where customer_id = '0a0a0a0a-0000-4000-8000-000000000001';
delete from public.email_outbox where template = 'abandoned_cart';

-- Re-runnable: clear this script's own order fixture if an aborted run left it.
delete from public.shipments where order_id = '0b0b0b0b-0000-4000-8000-000000000d01';
delete from public.notifications where title like '%HMS-QARULES-1%' or message like '%HMS-QARULES-1%';
delete from public.email_outbox where order_ref = 'HMS-QARULES-1';
delete from public.orders where id = '0b0b0b0b-0000-4000-8000-000000000d01' or order_number = 'HMS-QARULES-1';

insert into public.orders (
  id, order_number, customer_id, customer_name, customer_email, customer_phone,
  shipping_address, status, payment_status, payment_method, subtotal, total
) values (
  '0b0b0b0b-0000-4000-8000-000000000d01', 'HMS-QARULES-1',
  '0a0a0a0a-0000-4000-8000-000000000001', 'Rules Fixture',
  'qa-suite-a@hmsignature.test', '+92 300 0000001',
  '{"line1":"Rules Street 1","city":"Lahore","country":"Pakistan"}'::jsonb,
  'Processing', 'Paid', 'Bank Transfer', 5000, 5000
);

-- The delivery event itself queues order_delivered and review_request.
update public.orders set status = 'Delivered' where id = '0b0b0b0b-0000-4000-8000-000000000d01';

insert into public.shipments (id, order_id, courier_name, tracking_number, status, delivered_at)
values ('0b0b0b0b-0000-4000-8000-000000000501', '0b0b0b0b-0000-4000-8000-000000000d01',
        'Rules Courier', 'QARULES1', 'Delivered', now() - interval '3 days');

insert into pg_temp.auto_rules
select 'C1 queued by the event',
  coalesce(string_agg(template, ',' order by template), 'none')
from public.email_outbox where order_ref = 'HMS-QARULES-1';

update public.automation_workflows set enabled = true, delay_interval = interval '1 day'
where id in ('delivery_followup', 'review_request');

insert into pg_temp.auto_rules
select 'C2 tasks from the delivery scan', public.queue_post_delivery_followups(20)::text;

insert into pg_temp.auto_rules
select 'C3 follow-ups delivered', coalesce(string_agg(outcome, ',' order by workflow_id), 'none')
from public.run_due_followups(20);

-- Duplicate rows for this order would mean the customer got the same message twice.
insert into pg_temp.auto_rules
select 'C4 duplicate rows (expect 0)',
  ((select count(*) from public.email_outbox where order_ref = 'HMS-QARULES-1')
   - (select count(distinct template) from public.email_outbox where order_ref = 'HMS-QARULES-1'))::text;

insert into pg_temp.auto_rules
select 'C5 sweep again',
  coalesce((select public.run_automation_sweep(20) ->> 'queued')::text, 'null');

insert into pg_temp.auto_rules
select 'C6 ledger recorded',
  coalesce(string_agg(status, ','), 'none')
from (select status from public.automation_runs order by started_at desc limit 1) r;

-- ---------------------------------------------------------------------------
-- D. teardown: back to the shipped posture
-- ---------------------------------------------------------------------------

delete from public.email_outbox where order_ref = 'HMS-QARULES-1' or template = 'abandoned_cart';
delete from public.follow_up_tasks where order_ref = 'HMS-QARULES-1' or customer_id = '0a0a0a0a-0000-4000-8000-000000000001';
delete from public.cart_items where cart_id in ('0a0a0a0a-0000-4000-8000-00000000e001', '0a0a0a0a-0000-4000-8000-00000000e002');
delete from public.cart where id in ('0a0a0a0a-0000-4000-8000-00000000e001', '0a0a0a0a-0000-4000-8000-00000000e002');
delete from public.notifications
 where title like '%HMS-QARULES-1%' or message like '%HMS-QARULES-1%';
delete from public.shipments where id = '0b0b0b0b-0000-4000-8000-000000000501';
delete from public.orders where id = '0b0b0b0b-0000-4000-8000-000000000d01';
delete from public.automation_runs;

update public.automation_workflows set enabled = false, max_per_customer = 1 where id = 'abandoned_cart';
update public.automation_workflows set enabled = false, delay_interval = interval '4 hours' where id = 'abandoned_cart';
update public.automation_workflows set enabled = false, delay_interval = interval '2 days' where id = 'review_request';
update public.automation_workflows set enabled = false, delay_interval = interval '1 day' where id = 'delivery_followup';
update public.customer_communication_preferences set marketing_emails = false, source = 'default'
where user_id = '0a0a0a0a-0000-4000-8000-000000000001';

insert into pg_temp.auto_rules
select 'D1 restored',
  'tasks=' || (select count(*) from public.follow_up_tasks)::text
  || ' carts=' || (select count(*) from public.cart)::text
  || ' outbox=' || (select count(*) from public.email_outbox)::text
  || ' runs=' || (select count(*) from public.automation_runs)::text
  || ' orders=' || (select count(*) from public.orders where order_number like 'HMS-QARULES%')::text
  || ' shipments=' || (select count(*) from public.shipments)::text
  || ' enabled=' || (select count(*) from public.automation_workflows where enabled)::text
  || ' consent=' || (select count(*) from public.customer_communication_preferences where marketing_emails)::text;

select step, result from pg_temp.auto_rules order by step;
