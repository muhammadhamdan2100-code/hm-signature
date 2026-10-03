-- Complete the anonymous RPC tightening.
--
-- The first pass revoked EXECUTE from the anon role, but these functions still carry a
-- PUBLIC execute grant, and permissive GRANTs are additive: anon kept the privilege
-- through PUBLIC. Revoking from PUBLIC closes that path while the explicit
-- authenticated / service_role grants stay in place, so staff-triggered notification
-- writes keep working.

REVOKE EXECUTE ON FUNCTION public.notify_staff(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_status(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.notify_staff(text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_status(uuid) TO authenticated, service_role;
