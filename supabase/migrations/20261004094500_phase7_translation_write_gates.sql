-- Multilingual write functions must not be callable by an anonymous session at all.
--
-- Supabase grants EXECUTE on new functions to anon/authenticated/service_role through its
-- default privileges, so `revoke ... from public` alone left anon able to call the write
-- functions. They refused the call from the inside, which is the layer that mattered, but
-- the permission check and the grant should agree: an anonymous visitor has no path to
-- saving or removing content translations.

revoke execute on function public.save_content_translation(text, text, text, jsonb) from anon;
revoke execute on function public.delete_content_translation(text, text, text) from anon;

grant execute on function public.save_content_translation(text, text, text, jsonb) to authenticated, service_role;
grant execute on function public.delete_content_translation(text, text, text) to authenticated, service_role;

comment on function public.save_content_translation(text, text, text, jsonb) is
  'Creates or replaces one language bundle for a content row. Requires manage_cms or manage_settings; not executable by anon.';
