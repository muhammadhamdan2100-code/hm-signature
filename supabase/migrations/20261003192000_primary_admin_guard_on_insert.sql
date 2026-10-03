-- Make the primary-admin guard run on INSERT as well.
--
-- trg_protect_primary_admin was created as BEFORE DELETE OR UPDATE, so the INSERT rule
-- added in 20261003191000 could never fire (verified: pg_trigger.tgtype = 27 carries no
-- INSERT bit). Without it, a profile row created directly with is_primary_admin = true
-- would bypass every lock.
--
-- New signups are unaffected: handle_new_user() inserts without the flag, so the column
-- default (false) passes the branch, and the internal bootstrap keeps working through
-- app.bypass_primary_admin_guard.

drop trigger if exists trg_protect_primary_admin on public.profiles;

create trigger trg_protect_primary_admin
  before insert or delete or update on public.profiles
  for each row execute function public.check_primary_admin_protection();
