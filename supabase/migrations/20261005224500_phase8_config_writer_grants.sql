-- Phase 8: the payment/boutique configuration writers were relying only on the is_super_admin()
-- check inside their bodies. Postgres grants EXECUTE to PUBLIC by default, which left them
-- callable by `anon` - the guard held, but it was the only guard. This matches them to the
-- pattern already used by save_content_translation, where anon has no EXECUTE at all.
--
-- Belt and braces, not a substitute: every one of these functions still raises unless
-- public.is_super_admin() is true for the calling role.

begin;

revoke execute on function public.save_payment_method(text, text, text, text, text, text, text[], text[], text, text, text, integer) from public, anon;
revoke execute on function public.set_payment_method_status(text, text) from public, anon;
revoke execute on function public.delete_payment_method(text) from public, anon;
revoke execute on function public.save_boutique(uuid, text, text, text, text, text, text, text, text, boolean, integer) from public, anon;
revoke execute on function public.delete_boutique(uuid) from public, anon;

grant execute on function public.save_payment_method(text, text, text, text, text, text, text[], text[], text, text, text, integer) to authenticated, service_role;
grant execute on function public.set_payment_method_status(text, text) to authenticated, service_role;
grant execute on function public.delete_payment_method(text) to authenticated, service_role;
grant execute on function public.save_boutique(uuid, text, text, text, text, text, text, text, text, boolean, integer) to authenticated, service_role;
grant execute on function public.delete_boutique(uuid) to authenticated, service_role;

-- Supabase hands anon and authenticated full DML on every new public table. RLS already refuses
-- those writes because no INSERT/UPDATE/DELETE policy exists, but this project's hardening
-- standard does not leave a table's safety dependent on one mechanism, and the configuration
-- rows must only change through the guarded functions above.
revoke insert, update, delete, truncate, references, trigger on table public.payment_methods from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.payment_providers from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.boutiques from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.payment_events from anon, authenticated;

grant select on table public.payment_methods, public.payment_providers, public.boutiques to anon, authenticated;

commit;

select c.relname,
  (select c.relrowsecurity) as rls_enabled,
  has_table_privilege('anon', c.oid, 'INSERT') as anon_can_insert,
  has_table_privilege('authenticated', c.oid, 'INSERT') as auth_can_insert,
  has_table_privilege('authenticated', c.oid, 'SELECT') as auth_can_select
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('payment_methods','payment_providers','boutiques','payment_events')
order by c.relname;

select p.proname,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec,
  p.prosecdef as definer
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in ('save_payment_method','set_payment_method_status','delete_payment_method','save_boutique','delete_boutique')
order by p.proname;
