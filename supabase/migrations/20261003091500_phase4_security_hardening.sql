-- Phase 4 security hardening (additive / privilege-tightening only).
--
-- 1. notification_templates had row level security enabled but no policies, so the
--    staff template editor could neither read nor save (silent empty results).
-- 2. anon and authenticated hold table-level DDL privileges (TRUNCATE, REFERENCES,
--    TRIGGER) on every public table. PostgREST never uses them at runtime; RLS
--    remains the write gate, so dropping them removes a needless blast radius.
-- 3. notify_staff / get_user_role / get_user_status were callable by anon. Nothing in
--    the app calls them from an anonymous session (guest checkout writes go through
--    place_order, which runs as the function owner), so anon loses the ability to
--    spam the staff inbox or enumerate roles.
-- 4. The remaining SECURITY DEFINER authorisation helpers had no pinned search_path.

-- 1. Staff-only access to notification templates.
CREATE POLICY "Staff Read Notification Templates" ON public.notification_templates
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff Insert Notification Templates" ON public.notification_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff Update Notification Templates" ON public.notification_templates
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff Delete Notification Templates" ON public.notification_templates
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- 2. Drop table-level DDL privileges from the web roles.
DO $$
DECLARE
  rel record;
BEGIN
  FOR rel IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'REVOKE TRUNCATE, REFERENCES, TRIGGER ON %I.%I FROM anon, authenticated',
      rel.schemaname,
      rel.tablename
    );
  END LOOP;
END
$$;

-- 3. Anonymous callers may no longer execute these helpers.
REVOKE EXECUTE ON FUNCTION public.notify_staff(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_status(uuid) FROM anon;

-- 4. Pin search_path on the authorisation helpers used by RLS policies.
ALTER FUNCTION public.is_staff() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_staff(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_super_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.has_permission(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_role(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_status(uuid) SET search_path = public, pg_temp;
