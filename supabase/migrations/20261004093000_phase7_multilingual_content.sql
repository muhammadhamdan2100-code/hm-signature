-- Phase 7 multilingual — localized marketing content, and Urdu.
--
-- Content translation must not duplicate products. Prices, SKUs, stock, inventory and the
-- order history stay exactly where they are; only the words a shopper reads are stored per
-- language, in one table that names the entity rather than inventing four parallel columns
-- on four different tables.
--
-- Nothing here changes an existing row. The Urdu language row is additive, and the existing
-- en/ar/fr/es rows keep their values.

-- ---------------------------------------------------------------------------
-- Urdu, the fifth interface language
-- ---------------------------------------------------------------------------
insert into public.languages (code, name, native_name, direction, enabled, is_default, locale, sort_order)
values ('ur', 'Urdu', 'اردو', 'rtl', true, false, 'ur-PK', 5)
on conflict (code) do update
  set name = excluded.name,
      native_name = excluded.native_name,
      direction = excluded.direction,
      locale = excluded.locale,
      sort_order = excluded.sort_order,
      updated_at = now();

-- ---------------------------------------------------------------------------
-- One localization table for every translatable content entity
-- ---------------------------------------------------------------------------
create table if not exists public.content_translations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('product','category','collection','homepage_section','fragrance_note')),
  -- The row being translated. A uuid text for products/categories/collections/sections/notes.
  entity_ref text not null check (entity_ref ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  language_code text not null references public.languages (code) on delete cascade,
  -- Field-name to text. Flat on purpose: a nested document cannot be edited safely in a form,
  -- and the shape is validated by the guarded write function rather than by a constraint,
  -- because a check expression may not contain a subquery.
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_translations_one_row_per_language
    unique (entity_type, entity_ref, language_code),
  constraint content_translations_payload_is_object check (jsonb_typeof(payload) = 'object')
);

create index if not exists content_translations_lookup_idx
  on public.content_translations (language_code, entity_type, entity_ref);

comment on table public.content_translations is
  'Marketing copy per language, keyed to an existing content row. Never holds prices, SKUs, stock or anything an order depends on.';
comment on column public.content_translations.payload is
  'Flat object of field name to translated text, e.g. {"name":"…","shortDescription":"…"}. Absent fields fall back to the source row.';

alter table public.content_translations enable row level security;

-- Visitors read translations; that is the whole point of the table.
drop policy if exists content_translations_public_read on public.content_translations;
create policy content_translations_public_read
  on public.content_translations for select
  to anon, authenticated
  using (true);

-- Deliberately no insert/update/delete policy: every write goes through the
-- permission-checked functions below, so a browser session cannot write a row directly.

-- ---------------------------------------------------------------------------
-- Guarded writes
-- ---------------------------------------------------------------------------
create or replace function public.save_content_translation(
  p_entity_type text,
  p_entity_ref text,
  p_language text,
  p_values jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ref uuid;
  v_key text;
  v_value jsonb;
begin
  if not (public.has_permission(auth.uid(), 'manage_cms') or public.has_permission(auth.uid(), 'manage_settings')) then
    raise exception 'Only content-authorized staff can manage translations.';
  end if;

  if p_entity_type is null
     or p_entity_type not in ('product','category','collection','homepage_section','fragrance_note') then
    raise exception 'That content type cannot be translated here.';
  end if;

  if p_entity_ref is null or trim(p_entity_ref) = '' then
    raise exception 'A content row must be named.';
  end if;

  begin
    v_ref := trim(p_entity_ref)::uuid;
  exception when others then
    raise exception 'The content reference must be a valid identifier.';
  end;

  if p_language is null or p_language !~ '^[a-z]{2}$' then
    raise exception 'Language code must be two lowercase letters.';
  end if;

  if not exists (select 1 from public.languages l where l.code = p_language and l.enabled) then
    raise exception 'That language is not offered by the store.';
  end if;

  if p_values is null or jsonb_typeof(p_values) <> 'object' then
    raise exception 'Translations must be an object of text fields.';
  end if;

  for v_key, v_value in select key, value from jsonb_each(p_values)
  loop
    if v_key !~ '^[a-z][a-zA-Z]{0,39}$' then
      raise exception 'Translation field "%" is not a recognised field name.', v_key;
    end if;
    if jsonb_typeof(v_value) not in ('string','null') then
      raise exception 'Translation field "%" must be plain text.', v_key;
    end if;
    if jsonb_typeof(v_value) = 'string' and length(v_value #>> '{}') > 8000 then
      raise exception 'Translation field "%" is too long.', v_key;
    end if;
  end loop;

  insert into public.content_translations (entity_type, entity_ref, language_code, payload, updated_at)
  values (p_entity_type, v_ref::text, p_language, p_values, now())
  on conflict (entity_type, entity_ref, language_code)
    do update set payload = excluded.payload, updated_at = now();

  return found;
end;
$$;

create or replace function public.delete_content_translation(
  p_entity_type text,
  p_entity_ref text,
  p_language text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not (public.has_permission(auth.uid(), 'manage_cms') or public.has_permission(auth.uid(), 'manage_settings')) then
    raise exception 'Only content-authorized staff can remove translations.';
  end if;

  delete from public.content_translations
  where entity_type = p_entity_type
    and entity_ref = trim(p_entity_ref)::uuid::text
    and language_code = p_language;

  return found;
end;
$$;

-- Read helper the storefront uses: one round trip for every translation in one language.
create or replace function public.content_translations_for(p_language text)
returns table (entity_type text, entity_ref text, language_code text, payload jsonb, updated_at timestamptz)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select ct.entity_type, ct.entity_ref, ct.language_code, ct.payload, ct.updated_at
  from public.content_translations ct
  where ct.language_code = lower(trim(coalesce(p_language, '')));
$$;

alter function public.save_content_translation(text, text, text, jsonb) owner to postgres;
alter function public.delete_content_translation(text, text, text) owner to postgres;
alter function public.content_translations_for(text) owner to postgres;

revoke execute on function public.save_content_translation(text, text, text, jsonb) from public;
grant execute on function public.save_content_translation(text, text, text, jsonb) to authenticated, service_role;

revoke execute on function public.delete_content_translation(text, text, text) from public;
grant execute on function public.delete_content_translation(text, text, text) to authenticated, service_role;

-- An anonymous session may read translations but is never allowed to write them.
revoke execute on function public.content_translations_for(text) from public;
grant execute on function public.content_translations_for(text) to anon, authenticated, service_role;

comment on function public.save_content_translation(text, text, text, jsonb) is
  'Creates or replaces one language bundle for a content row. Requires manage_cms or manage_settings.';
comment on function public.delete_content_translation(text, text, text) is
  'Removes one language bundle, returning that content to its original English source. Requires manage_cms or manage_settings.';
comment on function public.content_translations_for(text) is
  'All translations for one language, for a single fetch at page load.';
