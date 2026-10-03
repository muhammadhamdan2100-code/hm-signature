-- Super Admin identity lock, tightened (no permissions are widened by this change).
--
-- The existing guard already refuses to delete, deactivate or downgrade the profile
-- flagged is_primary_admin. Two holes remained, both reachable by a *different*
-- super_admin rather than by the owner:
--
--   1. the flag itself could be cleared from the protected row, after which the
--      role/status locks no longer applied to it;
--   2. the flag could be handed to another profile, replacing the primary identity.
--
-- Both are closed here. The owner can still change their own login email (that is an
-- authentication credential, not the identity lock), and the internal
-- bootstrap_primary_admin() path keeps working because it sets the documented bypass
-- setting. The function's existing execution grants are deliberately untouched: a
-- trigger function's ACL is checked when the trigger fires, so changing it here could
-- break unrelated profile writes for no security benefit.

create or replace function public.check_primary_admin_protection()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Internal bootstrap only.
  if current_setting('app.bypass_primary_admin_guard', true) = 'true' then
    return case when tg_op = 'delete' then old else new end;
  end if;

  -- The flag is the identity. The historical email match is kept as well so that a
  -- profile created before the flag existed cannot escape the guard by being renamed
  -- first.
  if old.is_primary_admin or old.email = 'muhammadhamdan2100@gmail.com' then
    if tg_op = 'delete' then
      raise exception 'CRITICAL SECURITY: Primary Super Admin profile cannot be deleted.';
    end if;

    if new.status <> 'active' then
      raise exception 'CRITICAL SECURITY: Primary Super Admin status cannot be deactivated or suspended.';
    end if;

    if new.role <> 'super_admin' then
      raise exception 'CRITICAL SECURITY: Primary Super Admin role cannot be modified.';
    end if;

    -- New: clearing the flag would silently remove every protection above.
    if not new.is_primary_admin then
      raise exception 'CRITICAL SECURITY: Primary Super Admin identity cannot be revoked.';
    end if;
  end if;

  -- New: the identity cannot be handed to anybody else, in either direction.
  if tg_op = 'update' and new.is_primary_admin and not old.is_primary_admin then
    raise exception 'CRITICAL SECURITY: The primary Super Admin identity cannot be transferred to another profile.';
  end if;

  if tg_op = 'insert' and new.is_primary_admin then
    raise exception 'CRITICAL SECURITY: The primary Super Admin identity cannot be created outside the bootstrap path.';
  end if;

  -- Existing rule, unchanged: only staff may move role, status or the flag at all.
  if tg_op = 'update'
     and (new.role is distinct from old.role
          or new.status is distinct from old.status
          or new.is_primary_admin is distinct from old.is_primary_admin) then
    if not public.is_staff(auth.uid()) and auth.uid() is not null then
      raise exception 'Access Denied: Only authorized staff members can modify user roles or account status.';
    end if;
  end if;

  return case when tg_op = 'delete' then old else new end;
end;
$$;

comment on function public.check_primary_admin_protection() is
  'Row trigger on profiles: the primary Super Admin cannot be deleted, deactivated, downgraded, un-flagged or replaced, and the flag cannot be transferred. Internal bootstrap sets app.bypass_primary_admin_guard.';
