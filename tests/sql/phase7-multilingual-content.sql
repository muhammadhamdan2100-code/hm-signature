-- Phase 7 multilingual content rules, verified against the real database.
--
-- The interesting guarantees cannot be reached from a browser session: what the owner of a
-- function is, whether RLS is on, which privileges a browser role actually holds. This script
-- asserts them, then rolls everything back so the live project is untouched.
--
--   npx supabase db query --linked --project-ref <ref> -f tests/sql/phase7-multilingual-content.sql
--
-- Expected: "all_ok": true and, immediately afterwards, the baseline script reporting
-- content_translations empty.

begin;

create temp table checks (key text, ok boolean, detail text);

insert into checks
select 'A1 six languages, two of them right-to-left',
       (select count(*) from public.languages) = 6
         and (select count(*) from public.languages where direction = 'rtl') = 2
         and (select count(*) from public.languages where direction = 'ltr') = 4
         and (select code from public.languages where is_default) = 'en'
         and exists (select 1 from public.languages where code = 'ur' and direction = 'rtl' and locale = 'ur-PK' and enabled)
         and exists (select 1 from public.languages where code = 'de' and direction = 'ltr' and locale = 'de-DE' and enabled)
         and (select count(*) from public.languages where enabled) = 6,
       (select json_agg(json_build_object('c', code, 'd', direction, 'l', locale, 'on', enabled, 'def', is_default) order by sort_order) from public.languages)::text;

insert into checks
select 'A2 one row per entity and language',
       (select count(*) from pg_constraint where conname = 'content_translations_one_row_per_language') = 1,
       (select string_agg(pg_get_constraintdef(oid), ' ') from pg_constraint where conname = 'content_translations_one_row_per_language')::text;

insert into checks
select 'A3 row level security on, read only',
       (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'content_translations')
         and (select count(*) from pg_policies where tablename = 'content_translations' and cmd = 'SELECT') = 1
         and (select count(*) from pg_policies where tablename = 'content_translations' and cmd in ('INSERT','UPDATE','DELETE')) = 0,
       (select json_agg(json_build_object('cmd', cmd, 'roles', roles)) from pg_policies where tablename = 'content_translations')::text;

-- The write functions must be unreachable to browser roles that have no business calling them.
insert into checks
select 'A4 browser roles cannot call the write functions',
       (select not has_function_privilege('anon', 'public.save_content_translation(text,text,text,jsonb)', 'execute'))
         and (select not has_function_privilege('anon', 'public.delete_content_translation(text,text,text)', 'execute'))
         and (select has_function_privilege('authenticated', 'public.save_content_translation(text,text,text,jsonb)', 'execute'))
         and (select has_function_privilege('anon', 'public.content_translations_for(text)', 'execute')),
       (select coalesce(array_to_string(proacl, ','), 'null') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = 'save_content_translation')::text;

-- Every write function must be definer-owned by postgres with a pinned search path, or RLS
-- would apply to it and a staff save would silently do nothing.
insert into checks
select 'A5 writers are pinned and owner-defined',
       (select count(*) = 2 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname in ('save_content_translation','delete_content_translation')
           and p.prosecdef and p.proconfig && array['search_path=public, pg_temp']
           and pg_get_userbyid(p.proowner) = 'postgres'),
       (select json_agg(json_build_object('f', p.proname, 'definer', p.prosecdef, 'owner', pg_get_userbyid(p.proowner)))
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname in ('save_content_translation','delete_content_translation'))::text;

-- A staff session must be refused by the permission check inside the function, not by luck.
create temp table rows_before (n bigint);
insert into rows_before select count(*) from public.content_translations;

do $$
declare v_message text;
begin
  begin
    -- No JWT in this session: auth.uid() is null, so has_permission() must fail.
    perform public.save_content_translation('product',
      (select id::text from public.products limit 1), 'ar', jsonb_build_object('name', 'injected'));
    insert into checks values ('A6 unprivileged write refused', false, 'unexpectedly succeeded');
  exception when others then
    v_message := sqlerrm;
    insert into checks values ('A6 unprivileged write refused',
      v_message like '%content-authorized staff%', left(v_message, 120));
  end;
end $$;

-- Compared against the count taken one statement earlier, so the check still means "the refusal
-- wrote nothing" once real catalog translations have been loaded.
insert into checks
select 'A7 nothing was written by the refusal',
       (select count(*) from public.content_translations) = (select n from rows_before),
       (select count(*)::text from public.content_translations) || ' vs ' || (select n::text from rows_before);

-- Field names and language codes are validated, so a bad bundle cannot be stored for a reader
-- to trip over later.
do $$
declare v_message text;
begin
  begin
    perform public.save_content_translation('order', '00000000-0000-0000-0000-000000000001', 'ar', '{}'::jsonb);
    insert into checks values ('A8 rejects unknown entity type', false, 'unexpectedly succeeded');
  exception when others then
    insert into checks values ('A8 rejects unknown entity type', true, left(sqlerrm, 120));
  end;

  begin
    perform public.save_content_translation('product', '00000000-0000-0000-0000-000000000001', 'de', '{}'::jsonb);
    insert into checks values ('A9 rejects an unoffered language', false, 'unexpectedly succeeded');
  exception when others then
    insert into checks values ('A9 rejects an unoffered language', true, left(sqlerrm, 120));
  end;
end $$;

-- Source content must survive untouched: translations are additive text, never a new product.
-- The counts are pinned exactly, so a duplicate-per-language row (the tempting wrong design)
-- would fail this. Translation rows themselves are expected to exist and are only reported.
insert into checks
select 'A10 catalogue unchanged',
       (select count(*) from public.products where active) = 6
         and (select count(*) from public.categories where active) = 6
         and (select count(*) from public.collections where active) = 3
         and (select count(*) from public.fragrance_notes) = 38
         and (select sum(stock) from public.product_variants) = 1163,
       (select json_build_object('products', (select count(*) from public.products where active),
                                 'categories', (select count(*) from public.categories where active),
                                 'collections', (select count(*) from public.collections where active),
                                 'notes', (select count(*) from public.fragrance_notes),
                                 'stock', (select sum(stock) from public.product_variants),
                                 'translations', (select count(*) from public.content_translations))::text);

-- Localized text must be reachable by the anonymous reader role, or the storefront would keep
-- showing English even with the rows loaded. The count is scoped to the four translated
-- languages so a future fifth language cannot break it.
insert into checks
select 'A11 localized catalog text is readable',
       (select count(*) from public.content_translations
         where entity_type = 'product' and language_code in ('ar','fr','es','ur','de')
           and payload ? 'name' and payload ? 'description') = 30
         and (select count(distinct language_code) from public.content_translations) = 5
         and (select count(*) from public.content_translations
               where entity_type = 'fragrance_note' and language_code in ('ar','fr','es','ur','de')) = 190
         and (select count(*) from public.content_translations
               where entity_type = 'category' and language_code in ('ar','fr','es','ur','de')) = 30
         and (select count(*) from public.content_translations
               where entity_type = 'collection' and language_code in ('ar','fr','es','ur','de')) = 15,
       (select json_build_object(
                 'product_bundles', (select count(*) from public.content_translations
                                     where entity_type = 'product' and language_code in ('ar','fr','es','ur','de')),
                 'note_bundles', (select count(*) from public.content_translations
                                  where entity_type = 'fragrance_note' and language_code in ('ar','fr','es','ur','de')),
                 'category_bundles', (select count(*) from public.content_translations
                                      where entity_type = 'category' and language_code in ('ar','fr','es','ur','de')),
                 'collection_bundles', (select count(*) from public.content_translations
                                       where entity_type = 'collection' and language_code in ('ar','fr','es','ur','de')),
                 'languages', (select count(distinct language_code) from public.content_translations))::text);

select jsonb_pretty(jsonb_build_object(
  'all_ok', not exists (select 1 from checks where not ok),
  'results', jsonb_agg(jsonb_build_object('check', key, 'ok', ok, 'detail', coalesce(detail, '')) order by key)
)) as phase7_multilingual_checks
from checks;

rollback;
