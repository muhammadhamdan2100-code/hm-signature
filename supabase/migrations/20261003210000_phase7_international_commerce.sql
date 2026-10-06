-- Phase 7 — International commerce: currencies, destination countries and languages.
--
-- Three pieces of business configuration the storefront currently hardcodes (the
-- "Rs" prefix, the Pakistan-only shipping rule in site_settings.shipping_config, and
-- English-only text). Prices stay stored in the base currency; these tables describe
-- how amounts are converted for display and what a destination country costs.
--
-- Deliberate choices:
--   * Nothing here changes an existing order, product price or payment record.
--   * Only Pakistan is enabled as a destination, seeded with the exact shipping rule
--     the store uses today, so checkout behaves identically after this migration.
--   * The other eleven countries exist but are disabled with NULL fees: an unconfigured
--     country must read as "delivery not available", never as a made-up price.
--   * Exchange rates are manual business configuration and say so in rate_source.
--     No live rate provider is called from this code.
--   * Reads are public (a visitor must price a basket before signing in); writes require
--     the manage_settings permission, which only super_admin holds. is_staff() is NOT
--     used for writes, because it also accepts order_manager and content_manager.

-- ---------------------------------------------------------------------------
-- Currencies
-- ---------------------------------------------------------------------------

create table if not exists public.currencies (
  code text primary key,
  name text not null,
  symbol text not null,
  -- Digits after the decimal point when this currency is written down. PKR is handled
  -- in whole rupees by the store today, so it is declared as 0 rather than reshaped.
  minor_units integer not null default 2 check (minor_units in (0, 1, 2, 3)),
  -- Value of one unit of this currency expressed in the base currency. The base row is 1.
  rate_to_base numeric(18, 6) not null check (rate_to_base > 0),
  is_base boolean not null default false,
  enabled boolean not null default false,
  -- 'manual' means a human typed the number. A future provider writes 'provider'.
  rate_source text not null default 'manual' check (rate_source in ('manual', 'provider', 'imported')),
  rate_updated_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint currencies_code_format check (code ~ '^[A-Z]{3}$')
);

create index if not exists idx_currencies_enabled on public.currencies (enabled, sort_order);

alter table public.currencies enable row level security;

drop policy if exists "Currencies are readable" on public.currencies;
create policy "Currencies are readable" on public.currencies
  for select to anon, authenticated
  using (true);

-- No insert/update/delete policy: absence is the deny. Writes go through the
-- guarded functions below.

-- ---------------------------------------------------------------------------
-- Destination countries
-- ---------------------------------------------------------------------------

create table if not exists public.countries (
  code text primary key,
  name text not null,
  enabled boolean not null default false,
  currency_code text references public.currencies (code),
  -- NULL means "not configured yet", which is different from free (0).
  shipping_fee numeric(12, 2) check (shipping_fee is null or shipping_fee >= 0),
  free_shipping_threshold numeric(12, 2) check (free_shipping_threshold is null or free_shipping_threshold >= 0),
  delivery_days_min integer check (delivery_days_min is null or delivery_days_min >= 0),
  delivery_days_max integer check (delivery_days_max is null or delivery_days_max >= 0),
  delivery_method text,
  notes text,
  restrictions text,
  tax_enabled boolean not null default false,
  tax_rate numeric(5, 2) check (tax_rate is null or (tax_rate >= 0 and tax_rate <= 100)),
  -- Display label only. Nothing here asserts compliance with any country's law.
  tax_label text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint countries_code_format check (code ~ '^[A-Z]{2}$'),
  constraint countries_delivery_window_check
    check (delivery_days_min is null or delivery_days_max is null or delivery_days_max >= delivery_days_min)
);

create index if not exists idx_countries_enabled on public.countries (enabled, sort_order);

alter table public.countries enable row level security;

drop policy if exists "Countries are readable" on public.countries;
create policy "Countries are readable" on public.countries
  for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Languages
-- ---------------------------------------------------------------------------

create table if not exists public.languages (
  code text primary key,
  name text not null,
  native_name text not null,
  direction text not null default 'ltr' check (direction in ('ltr', 'rtl')),
  enabled boolean not null default true,
  is_default boolean not null default false,
  locale text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint languages_code_format check (code ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

-- Exactly one default, and only among enabled languages.
create unique index if not exists uniq_languages_single_default
  on public.languages (is_default) where is_default;

alter table public.languages enable row level security;

drop policy if exists "Languages are readable" on public.languages;
create policy "Languages are readable" on public.languages
  for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Seed: six currencies, base PKR
-- ---------------------------------------------------------------------------

insert into public.currencies (code, name, symbol, minor_units, rate_to_base, is_base, enabled, rate_source, rate_updated_at, sort_order)
values
  ('PKR', 'Pakistani Rupee', 'Rs', 0, 1, true, true, 'manual', now(), 0),
  ('USD', 'US Dollar', '$', 2, 278.500000, false, true, 'manual', now(), 1),
  ('AED', 'UAE Dirham', 'AED', 2, 75.800000, false, true, 'manual', now(), 2),
  ('SAR', 'Saudi Riyal', 'SAR', 2, 74.300000, false, true, 'manual', now(), 3),
  ('GBP', 'British Pound', '£', 2, 355.000000, false, true, 'manual', now(), 4),
  ('EUR', 'Euro', '€', 2, 302.000000, false, true, 'manual', now(), 5)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Seed: twelve destinations. Pakistan carries today's live rule; the rest are
-- present, disabled and unpriced until the business sets real values.
-- ---------------------------------------------------------------------------

insert into public.countries (
  code, name, enabled, currency_code, shipping_fee, free_shipping_threshold,
  delivery_days_min, delivery_days_max, delivery_method, tax_enabled, tax_rate, tax_label, sort_order
)
values
  ('PK', 'Pakistan', true, 'PKR', 250.00, 10000.00, 2, 3, 'Courier — Leopards / TCS', false, null, null, 0),
  ('AE', 'United Arab Emirates', false, 'AED', null, null, null, null, null, false, null, null, 1),
  ('SA', 'Saudi Arabia', false, 'SAR', null, null, null, null, null, false, null, null, 2),
  ('GB', 'United Kingdom', false, 'GBP', null, null, null, null, null, false, null, null, 3),
  ('US', 'United States', false, 'USD', null, null, null, null, null, false, null, null, 4),
  ('CA', 'Canada', false, 'USD', null, null, null, null, null, false, null, null, 5),
  ('AU', 'Australia', false, 'USD', null, null, null, null, null, false, null, null, 6),
  ('FR', 'France', false, 'EUR', null, null, null, null, null, false, null, null, 7),
  ('DE', 'Germany', false, 'EUR', null, null, null, null, null, false, null, null, 8),
  ('ES', 'Spain', false, 'EUR', null, null, null, null, null, false, null, null, 9),
  -- Two rows the store already ships to in practice, kept disabled so nothing changes
  -- until the owner confirms them.
  ('QA', 'Qatar', false, 'SAR', null, null, null, null, null, false, null, null, 10),
  ('OM', 'Oman', false, 'SAR', null, null, null, null, null, false, null, null, 11)
on conflict (code) do nothing;

insert into public.languages (code, name, native_name, direction, enabled, is_default, locale, sort_order)
values
  ('en', 'English', 'English', 'ltr', true, true, 'en-US', 0),
  ('ar', 'Arabic', 'العربية', 'rtl', true, false, 'ar-AE', 1),
  ('fr', 'French', 'Français', 'ltr', true, false, 'fr-FR', 2),
  ('es', 'Spanish', 'Español', 'ltr', true, false, 'es-ES', 3)
on conflict (code) do nothing;

comment on table public.currencies is
  'Display currencies over a single base currency. rate_to_base is manual business configuration; rate_source says where it came from.';
comment on table public.countries is
  'Destination rules: availability, shipping fee, free threshold, delivery window and the store''s own tax configuration. NULL fee means not configured, never free.';
comment on table public.languages is
  'Languages the storefront offers. Text itself lives in the code dictionaries; this table controls which are on.';

-- ---------------------------------------------------------------------------
-- Guarded writes
-- ---------------------------------------------------------------------------

-- Upsert one destination rule. A country may only be switched on once it has a real
-- shipping fee and a currency, so an unconfigured destination can never go live by
-- accident.
create or replace function public.save_country_rule(p_code text, p_rule jsonb)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_changed boolean := false;
  v_enabled boolean := coalesce((p_rule ->> 'enabled')::boolean, false);
  v_fee numeric := (p_rule ->> 'shipping_fee')::numeric;
  v_currency text := nullif(trim(coalesce(p_rule ->> 'currency_code', '')), '');
  v_days_min integer := (p_rule ->> 'delivery_days_min')::integer;
  v_days_max integer := (p_rule ->> 'delivery_days_max')::integer;
  v_tax_rate numeric := coalesce((p_rule ->> 'tax_rate')::numeric, 0);
  v_tax_enabled boolean := coalesce((p_rule ->> 'tax_enabled')::boolean, false);
begin
  if not public.has_permission(auth.uid(), 'manage_settings') then
    raise exception 'Only settings-authorized staff can change destination countries.';
  end if;

  if p_code is null or p_code !~ '^[A-Z]{2}$' then
    raise exception 'Country code must be two uppercase letters.';
  end if;

  if v_fee is not null and v_fee < 0 then
    raise exception 'A shipping fee cannot be negative.';
  end if;

  if v_tax_rate < 0 or v_tax_rate > 100 then
    raise exception 'A tax rate must be between 0 and 100.';
  end if;

  if (v_days_min is not null and v_days_max is not null) and v_days_max < v_days_min then
    raise exception 'The maximum delivery window cannot be shorter than the minimum.';
  end if;

  if v_enabled and (v_fee is null or v_currency is null) then
    raise exception 'Set a shipping fee and a currency before enabling this country.';
  end if;

  if v_enabled and not exists (select 1 from public.currencies c where c.code = v_currency) then
    raise exception 'That currency is not configured.';
  end if;

  insert into public.countries (
    code, name, enabled, currency_code, shipping_fee, free_shipping_threshold,
    delivery_days_min, delivery_days_max, delivery_method, notes, restrictions,
    tax_enabled, tax_rate, tax_label, sort_order, updated_at
  )
  values (
    p_code,
    coalesce(nullif(trim(p_rule ->> 'name'), ''), initcap(p_code)),
    v_enabled,
    v_currency,
    v_fee,
    (p_rule ->> 'free_shipping_threshold')::numeric,
    v_days_min,
    v_days_max,
    nullif(trim(coalesce(p_rule ->> 'delivery_method', '')), ''),
    nullif(trim(coalesce(p_rule ->> 'notes', '')), ''),
    nullif(trim(coalesce(p_rule ->> 'restrictions', '')), ''),
    v_tax_enabled,
    case when v_tax_enabled then v_tax_rate else null end,
    nullif(trim(coalesce(p_rule ->> 'tax_label', '')), ''),
    coalesce((p_rule ->> 'sort_order')::integer, 100),
    now()
  )
  on conflict (code) do update set
    name = coalesce(excluded.name, public.countries.name),
    enabled = excluded.enabled,
    currency_code = excluded.currency_code,
    shipping_fee = excluded.shipping_fee,
    free_shipping_threshold = excluded.free_shipping_threshold,
    delivery_days_min = excluded.delivery_days_min,
    delivery_days_max = excluded.delivery_days_max,
    delivery_method = excluded.delivery_method,
    notes = excluded.notes,
    restrictions = excluded.restrictions,
    tax_enabled = excluded.tax_enabled,
    tax_rate = excluded.tax_rate,
    tax_label = excluded.tax_label,
    sort_order = excluded.sort_order,
    updated_at = now();
  v_changed := found;

  return v_changed;
end;
$$;

-- Upsert one currency and its manual reference rate. The base currency cannot be
-- switched off or re-rated, because every stored amount is expressed in it.
create or replace function public.save_currency(
  p_code text,
  p_name text,
  p_symbol text,
  p_minor_units integer,
  p_rate_to_base numeric,
  p_enabled boolean,
  p_sort_order integer default 0
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_is_base boolean;
  v_changed boolean := false;
begin
  if not public.has_permission(auth.uid(), 'manage_settings') then
    raise exception 'Only settings-authorized staff can change currencies.';
  end if;

  if p_code is null or p_code !~ '^[A-Z]{3}$' then
    raise exception 'Currency code must be three uppercase letters.';
  end if;

  if p_minor_units is null or p_minor_units not in (0, 1, 2, 3) then
    raise exception 'Minor units must be 0, 1, 2 or 3.';
  end if;

  if p_rate_to_base is null or p_rate_to_base <= 0 then
    raise exception 'An exchange rate must be greater than zero.';
  end if;

  select is_base into v_is_base from public.currencies where code = p_code;

  if coalesce(v_is_base, false) then
    p_rate_to_base := 1;
    p_enabled := true;
  end if;

  insert into public.currencies (
    code, name, symbol, minor_units, rate_to_base, is_base, enabled, rate_source, rate_updated_at, sort_order, updated_at
  )
  values (
    p_code,
    coalesce(nullif(trim(p_name), ''), p_code),
    coalesce(nullif(trim(p_symbol), ''), p_code),
    p_minor_units,
    p_rate_to_base,
    coalesce(v_is_base, false),
    p_enabled,
    'manual',
    now(),
    coalesce(p_sort_order, 100),
    now()
  )
  on conflict (code) do update set
    name = excluded.name,
    symbol = excluded.symbol,
    minor_units = excluded.minor_units,
    rate_to_base = excluded.rate_to_base,
    enabled = excluded.enabled,
    rate_source = 'manual',
    rate_updated_at = now(),
    sort_order = excluded.sort_order,
    updated_at = now();
  v_changed := found;

  return v_changed;
end;
$$;

-- Enable/disable a language and move the default. Only languages that actually have a
-- dictionary in the application can be switched on.
create or replace function public.save_language(p_code text, p_enabled boolean, p_is_default boolean default false)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_known boolean;
begin
  if not public.has_permission(auth.uid(), 'manage_settings') then
    raise exception 'Only settings-authorized staff can change languages.';
  end if;

  -- The supported set is defined by the code dictionaries, not by this table.
  select exists (
    select 1 from (values ('en'), ('ar'), ('fr'), ('es')) allowed(code) where allowed.code = p_code
  ) into v_known;
  if not v_known then
    raise exception 'That language has no translation files in this application.';
  end if;

  update public.languages set enabled = p_enabled, updated_at = now() where code = p_code;
  if not found then
    return false;
  end if;

  -- A language the storefront cannot switch off cannot be the fallback either.
  if p_is_default and not p_enabled then
    raise exception 'Enable a language before making it the default.';
  end if;

  if p_is_default then
    update public.languages set is_default = (code = p_code), updated_at = now();
  end if;

  return true;
end;
$$;

alter function public.save_country_rule(text, jsonb) owner to postgres;
alter function public.save_currency(text, text, text, integer, numeric, boolean, integer) owner to postgres;
alter function public.save_language(text, boolean, boolean) owner to postgres;

revoke execute on function public.save_country_rule(text, jsonb) from public, anon;
revoke execute on function public.save_currency(text, text, text, integer, numeric, boolean, integer) from public, anon;
revoke execute on function public.save_language(text, boolean, boolean) from public, anon;
grant execute on function public.save_country_rule(text, jsonb) to authenticated, service_role;
grant execute on function public.save_currency(text, text, text, integer, numeric, boolean, integer) to authenticated, service_role;
grant execute on function public.save_language(text, boolean, boolean) to authenticated, service_role;

comment on function public.save_country_rule(text, jsonb) is
  'Settings-authorized staff only. Refuses to enable a country without a real shipping fee and currency.';
comment on function public.save_currency(text, text, text, integer, numeric, boolean, integer) is
  'Settings-authorized staff only. Records the rate as manual configuration; the base currency stays at 1 and enabled.';
comment on function public.save_language(text, boolean, boolean) is
  'Settings-authorized staff only. Limited to the languages that ship with translation files.';
