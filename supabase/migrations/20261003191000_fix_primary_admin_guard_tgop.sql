-- Correction to 20261003190000_super_admin_identity_guard.sql.
--
-- That version had two defects, both found by testing against the live database:
--
--   1. TG_OP was compared in lowercase ('update' / 'delete'). PL/pgSQL reports TG_OP in
--      uppercase, so the transfer and delete branches could never match and a
--      super_admin could still hand the primary flag to another profile.
--   2. OLD was referenced outside an UPDATE guard. This trigger also fires on INSERT
--      (a profile row is created for every new signup), and reading OLD in an INSERT
--      trigger aborts the statement — that would have broken registration outright.
--
-- Structure below keeps every OLD reference inside the UPDATE branch, matching the
-- original guard's shape while adding the two new locks: the flag cannot be revoked
-- from the protected row, and it cannot be granted to any other row.

create or replace function public.check_primary_admin_protection()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Internal bootstrap only (bootstrap_primary_admin sets this).
  if current_setting('app.bypass_primary_admin_guard', true) = 'true' then
    return case when TG_OP = 'DELETE' then OLD else NEW end;
  end if;

  if TG_OP = 'DELETE' then
    -- The flag is the identity; the historical email is also matched so a row created
    -- before the flag existed cannot escape the guard by being renamed first.
    if OLD.is_primary_admin or OLD.email = 'muhammadhamdan2100@gmail.com' then
      raise exception 'CRITICAL SECURITY: Primary Super Admin profile cannot be deleted.';
    end if;
    return OLD;
  end if;

  if TG_OP = 'INSERT' then
    if NEW.is_primary_admin then
      raise exception 'CRITICAL SECURITY: The primary Super Admin identity cannot be created outside the bootstrap path.';
    end if;
    return NEW;
  end if;

  -- UPDATE
  if OLD.is_primary_admin or OLD.email = 'muhammadhamdan2100@gmail.com' then
    if NEW.status <> 'active' then
      raise exception 'CRITICAL SECURITY: Primary Super Admin status cannot be deactivated or suspended.';
    end if;

    if NEW.role <> 'super_admin' then
      raise exception 'CRITICAL SECURITY: Primary Super Admin role cannot be modified.';
    end if;

    if not NEW.is_primary_admin then
      raise exception 'CRITICAL SECURITY: Primary Super Admin identity cannot be revoked.';
    end if;
  end if;

  if NEW.is_primary_admin and not OLD.is_primary_admin then
    raise exception 'CRITICAL SECURITY: The primary Super Admin identity cannot be transferred to another profile.';
  end if;

  -- Existing rule, unchanged: only staff may move role, status or the flag at all.
  if NEW.role is distinct from OLD.role
     or NEW.status is distinct from OLD.status
     or NEW.is_primary_admin is distinct from OLD.is_primary_admin then
    if not public.is_staff(auth.uid()) and auth.uid() is not null then
      raise exception 'Access Denied: Only authorized staff members can modify user roles or account status.';
    end if;
  end if;

  return NEW;
end;
$$;

comment on function public.check_primary_admin_protection() is
  'Row trigger on profiles (insert/update/delete): the primary Super Admin cannot be deleted, deactivated, downgraded, un-flagged or transferred, and no new row may be created carrying the flag. Internal bootstrap sets app.bypass_primary_admin_guard.';
