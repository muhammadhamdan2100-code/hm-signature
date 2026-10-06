-- Phase 7: German as the sixth offered interface language.
--
-- Additive only: one row in `languages`. No table is created, dropped or altered, and no
-- product, order, stock, price or account row is touched. `content_translations.language_code`
-- already references `languages`, so existing translation writers and readers accept 'de'
-- without any further change.
--
-- Applied deliberately AFTER src/i18n/dictionaries/de.ts reaches full key parity: a row here
-- with an incomplete dictionary would offer customers a language that silently renders English.

insert into public.languages (code, name, native_name, direction, enabled, is_default, locale, sort_order)
values ('de', 'German', 'Deutsch', 'ltr', true, false, 'de-DE', 6)
on conflict (code) do update
  set name = excluded.name,
      native_name = excluded.native_name,
      direction = excluded.direction,
      enabled = excluded.enabled,
      is_default = excluded.is_default,
      locale = excluded.locale,
      sort_order = excluded.sort_order;
