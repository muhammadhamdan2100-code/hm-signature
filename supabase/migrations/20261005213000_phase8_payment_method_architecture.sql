-- Phase 8: payment-method architecture and boutique locator.
--
-- Two rules shaped this file. First, nothing here pretends a gateway is live: the stored
-- `status` is merchandising intent, and whether a provider can actually settle money depends on
-- credentials that only the server-side layer can see, so availability is computed there
-- (api/_payments.js) as intent ∩ credentials ∩ country/currency. Second, no column in any of
-- these tables may hold card credentials — Stripe's own API and webhooks are the only path to
-- that data, and this schema stores only the identifiers Stripe hands back.

begin;

-- ─── provider registry ──────────────────────────────────────────────────────────────────────
-- Names of the environment variables a provider needs, never their values. A provider is
-- "connected" only when every listed variable is present in the deployment environment.
create table if not exists public.payment_providers (
  code                  text primary key check (code ~ '^[a-z0-9_]{2,40}$'),
  display_name           text not null,
  integration_kind       text not null check (integration_kind in
                           ('card_checkout', 'hosted_redirect', 'wallet', 'bnpl', 'instant', 'manual_transfer', 'cash')),
  credential_env_vars    text[] not null default '{}',
  documentation_url      text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.payment_providers is
  'Payment providers known to the system and the environment variables each one needs. Values are never stored here.';
comment on column public.payment_providers.credential_env_vars is
  'Names only (e.g. {STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET}). Presence is checked at request time; absence means the provider is not connected.';

-- ─── configurable methods per country/currency ──────────────────────────────────────────────
create table if not exists public.payment_methods (
  id                     uuid primary key default gen_random_uuid(),
  code                   text not null unique check (code ~ '^[a-z0-9_]{2,40}$'),
  provider_code          text not null references public.payment_providers(code) on update cascade,
  type                   text not null default 'card' check (type in
                           ('card','wallet','bank_transfer','cod','bnpl','qr','instant','cash')),
  display_name           text not null,
  description            text not null default '',
  icon                   text,
  country_codes          text[] not null default '{}',
  currency_codes         text[] not null default '{}',
  -- Merchandising intent. 'connected' is deliberately absent: connection is a runtime fact
  -- about credentials, not something an admin can assert.
  status                 text not null default 'coming_soon' check (status in
                           ('configured', 'enabled', 'coming_soon', 'unavailable')),
  environment            text not null default 'none' check (environment in ('none', 'test', 'live')),
  is_enabled             boolean not null default false,
  is_coming_soon         boolean not null default true,
  requires_reference     boolean not null default false,
  requires_proof         boolean not null default false,
  configuration_reference text,
  sort_order             integer not null default 100,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  check (length(btrim(display_name)) > 0)
);

create index if not exists payment_methods_country_idx on public.payment_methods (country_codes, sort_order);

comment on table public.payment_methods is
  'Which payment methods a destination country offers, in which currencies, and what state each is in.';
comment on column public.payment_methods.status is
  'Admin intent only: configured|enabled|coming_soon|unavailable. Whether payment actually works also requires provider credentials, resolved in api/_payments.js.';

-- is_enabled / is_coming_soon must never disagree with status, or the storefront could show a
-- live-looking row that the submit path then refuses (or vice versa).
create or replace function public.sync_payment_method_flags() returns trigger
language plpgsql as $$
begin
  new.is_enabled     := new.status in ('configured', 'enabled');
  new.is_coming_soon := new.status = 'coming_soon';
  new.updated_at     := now();
  return new;
end $$;

drop trigger if exists payment_methods_sync_flags on public.payment_methods;
create trigger payment_methods_sync_flags
  before insert or update on public.payment_methods
  for each row execute function public.sync_payment_method_flags();

-- ─── boutiques ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.boutiques (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (length(btrim(name)) > 0),
  country_code  text not null,
  city          text not null,
  address       text not null default '',
  phone         text,
  opening_hours text,
  maps_url      text,
  status        text not null default 'coming_soon' check (status in ('coming_soon', 'live', 'closed')),
  is_enabled    boolean not null default true,
  sort_order    integer not null default 100,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists boutiques_enabled_idx on public.boutiques (is_enabled, sort_order);

comment on table public.boutiques is
  'Physical boutique locations shown on /boutiques. Deliberately seeded empty: real addresses must come from the business.';

-- ─── money-side columns on the existing payments ledger ──────────────────────────────────────
alter table public.payments add column if not exists provider_code            text references public.payment_providers(code);
alter table public.payments add column if not exists payment_method_code      text references public.payment_methods(code);
alter table public.payments add column if not exists stripe_payment_intent_id text;
alter table public.payments add column if not exists stripe_checkout_session_id text;
alter table public.payments add column if not exists provider_status          text;
alter table public.payments add column if not exists captured_at              timestamptz;

-- Stripe identifiers are unique per payment: a replayed webhook or a double submit must land on
-- the same row instead of creating a second "paid" record.
create unique index if not exists payments_stripe_intent_uq
  on public.payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
create unique index if not exists payments_stripe_session_uq
  on public.payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create index if not exists payments_provider_idx on public.payments (provider_code, created_at desc);

comment on column public.payments.stripe_payment_intent_id is
  'Stripe-assigned identifier. Card number, expiry, CVV and PIN are never stored by this application.';

-- Webhook idempotency needs the provider''s own event id, which payment_events did not carry.
alter table public.payment_events add column if not exists provider_event_id text;
create unique index if not exists payment_events_provider_event_uq
  on public.payment_events (event_type, provider_event_id)
  where provider_event_id is not null;

-- ─── row level security ───────────────────────────────────────────────────────────────────────
-- Shoppers must be able to read the method list before signing in, so checkout needs an
-- anonymous SELECT. Writes have no policy at all: they go through the guarded functions below.
alter table public.payment_providers enable row level security;
alter table public.payment_methods   enable row level security;
alter table public.boutiques         enable row level security;

drop policy if exists "payment providers readable" on public.payment_providers;
create policy "payment providers readable" on public.payment_providers
  for select to anon, authenticated using (true);

drop policy if exists "payment methods readable" on public.payment_methods;
create policy "payment methods readable" on public.payment_methods
  for select to anon, authenticated using (true);

drop policy if exists "boutiques readable" on public.boutiques;
create policy "boutiques readable" on public.boutiques
  for select to anon, authenticated using (is_enabled);

drop policy if exists "boutiques readable staff" on public.boutiques;
create policy "boutiques readable staff" on public.boutiques
  for select to authenticated using (public.is_staff());

-- ─── guarded writers (Super Admin only) ────────────────────────────────────────────────────────
create or replace function public.save_payment_method(
  p_code text,
  p_provider_code text,
  p_type text,
  p_display_name text,
  p_description text,
  p_icon text,
  p_country_codes text[],
  p_currency_codes text[],
  p_status text,
  p_environment text,
  p_configuration_reference text,
  p_sort_order integer
) returns public.payment_methods
language plpgsql security definer
set search_path = public
as $$
declare row public.payment_methods;
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can change payment configuration.';
  end if;
  if p_code is null or p_code !~ '^[a-z0-9_]{2,40}$' then
    raise exception 'A payment method code must be lower-case letters, digits or underscore.';
  end if;
  if not exists (select 1 from public.payment_providers where code = p_provider_code) then
    raise exception 'Unknown payment provider: %', p_provider_code;
  end if;
  if p_status not in ('configured', 'enabled', 'coming_soon', 'unavailable') then
    raise exception 'Unknown payment method status: %', p_status;
  end if;

  insert into public.payment_methods as m (
    code, provider_code, type, display_name, description, icon,
    country_codes, currency_codes, status, environment, configuration_reference, sort_order
  ) values (
    p_code, p_provider_code, coalesce(nullif(p_type, ''), 'card'),
    coalesce(nullif(btrim(p_display_name), ''), initcap(replace(p_code, '_', ' '))),
    coalesce(p_description, ''), nullif(p_icon, ''),
    coalesce(p_country_codes, '{}'), coalesce(p_currency_codes, '{}'),
    p_status, coalesce(nullif(p_environment, ''), 'none'),
    nullif(p_configuration_reference, ''), coalesce(p_sort_order, 100)
  )
  on conflict (code) do update set
    provider_code = excluded.provider_code,
    type = excluded.type,
    display_name = excluded.display_name,
    description = excluded.description,
    icon = excluded.icon,
    country_codes = excluded.country_codes,
    currency_codes = excluded.currency_codes,
    status = excluded.status,
    environment = excluded.environment,
    configuration_reference = excluded.configuration_reference,
    sort_order = excluded.sort_order
  returning m.* into row;

  return row;
end $$;

create or replace function public.set_payment_method_status(p_code text, p_status text)
returns public.payment_methods
language plpgsql security definer
set search_path = public
as $$
declare row public.payment_methods;
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can change payment configuration.';
  end if;
  if p_status not in ('configured', 'enabled', 'coming_soon', 'unavailable') then
    raise exception 'Unknown payment method status: %', p_status;
  end if;
  update public.payment_methods set status = p_status where code = p_code returning * into row;
  if row.code is null then
    raise exception 'No payment method named %', p_code;
  end if;
  return row;
end $$;

create or replace function public.delete_payment_method(p_code text) returns boolean
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can change payment configuration.';
  end if;
  -- Payments already reference methods, so a method with history is retired, not erased.
  if exists (select 1 from public.payments where payment_method_code = p_code) then
    update public.payment_methods set status = 'unavailable' where code = p_code;
    return false;
  end if;
  delete from public.payment_methods where code = p_code;
  return true;
end $$;

create or replace function public.save_boutique(
  p_id uuid,
  p_name text,
  p_country_code text,
  p_city text,
  p_address text,
  p_phone text,
  p_opening_hours text,
  p_maps_url text,
  p_status text,
  p_is_enabled boolean,
  p_sort_order integer
) returns public.boutiques
language plpgsql security definer
set search_path = public
as $$
declare row public.boutiques;
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can manage boutique locations.';
  end if;
  if p_status not in ('coming_soon', 'live', 'closed') then
    raise exception 'Unknown boutique status: %', p_status;
  end if;
  if btrim(coalesce(p_name, '')) = '' or btrim(coalesce(p_city, '')) = '' then
    raise exception 'A boutique needs a name and a city.';
  end if;

  insert into public.boutiques as b (
    id, name, country_code, city, address, phone, opening_hours, maps_url, status, is_enabled, sort_order
  ) values (
    coalesce(p_id, gen_random_uuid()), btrim(p_name), upper(left(p_country_code, 2)), btrim(p_city),
    coalesce(p_address, ''), nullif(p_phone, ''), nullif(p_opening_hours, ''), nullif(p_maps_url, ''),
    p_status, coalesce(p_is_enabled, true), coalesce(p_sort_order, 100)
  )
  on conflict (id) do update set
    name = excluded.name, country_code = excluded.country_code, city = excluded.city,
    address = excluded.address, phone = excluded.phone, opening_hours = excluded.opening_hours,
    maps_url = excluded.maps_url, status = excluded.status, is_enabled = excluded.is_enabled,
    sort_order = excluded.sort_order
  returning b.* into row;
  return row;
end $$;

create or replace function public.delete_boutique(p_id uuid) returns boolean
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can manage boutique locations.';
  end if;
  delete from public.boutiques where id = p_id;
  return found;
end $$;

-- Supabase grants EXECUTE on new functions to anon/authenticated by default; the guards above
-- would still refuse the call, but the grant and the check should agree.
revoke execute on function
  public.save_payment_method(text, text, text, text, text, text, text[], text[], text, text, text, integer),
  public.set_payment_method_status(text, text),
  public.delete_payment_method(text),
  public.save_boutique(uuid, text, text, text, text, text, text, text, text, boolean, integer),
  public.delete_boutique(uuid)
from anon;

grant execute on function
  public.save_payment_method(text, text, text, text, text, text, text[], text[], text, text, text, integer),
  public.set_payment_method_status(text, text),
  public.delete_payment_method(text),
  public.save_boutique(uuid, text, text, text, text, text, text, text, text, boolean, integer),
  public.delete_boutique(uuid)
to authenticated, service_role;

-- ─── seed: providers and the country matrix from the Phase 8 brief ────────────────────────────
-- Existing manual rails keep working and are recorded as enabled; everything that would need a
-- credential this deployment does not have is seeded as coming_soon.
insert into public.payment_providers (code, display_name, integration_kind, credential_env_vars, documentation_url) values
  ('stripe',        'Stripe',            'card_checkout',    array['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET'], 'https://docs.stripe.com/api'),
  ('payfast',       'PayFast',           'hosted_redirect',  array['PAYFAST_MERCHANT_ID','PAYFAST_STORE_ID','PAYFAST_MERCHANT_KEY'], 'https://developers.payfast.co.za'),
  ('google_pay',    'Google Pay',        'wallet',           array['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET'], 'https://developers.google.com/pay/api'),
  ('apple_pay',     'Apple Pay',         'wallet',           array['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET'], 'https://developer.apple.com/apple-pay'),
  ('paypal',        'PayPal',            'hosted_redirect',  array['PAYPAL_CLIENT_ID','PAYPAL_CLIENT_SECRET'], 'https://developer.paypal.com'),
  ('klarna',        'Klarna',            'bnpl',             array['KLARNA_API_CLIENT_ID','KLARNA_API_CLIENT_SECRET'], 'https://developers.klarna.com'),
  ('tabby',         'Tabby',             'bnpl',             array['TABBY_API_KEY'], null),
  ('tamara',        'Tamara',            'bnpl',             array['TAMARA_API_KEY'], null),
  ('mada',          'mada',              'card_checkout',    array['MADA_MERCHANT_KEY'], null),
  ('stc_pay',       'STC Pay',           'wallet',           array['STC_PAY_API_KEY'], null),
  ('carte_bancaire','Carte Bancaire',    'card_checkout',    array['CB_MERCHANT_KEY'], null),
  ('bizum',         'Bizum',             'instant',          array['BIZUM_API_KEY'], null),
  ('jazzcash',      'JazzCash',          'wallet',           array['JAZZCASH_MERCHANT_ID','JAZZCASH_PASSWORD','JAZZCASH_INTEGRITY_SALT'], null),
  ('easypaisa',     'Easypaisa',         'wallet',           array['EASYPAISA_STORE_ID','EASYPAISA_MERCHANT_KEY'], null),
  ('raast',         'Raast',             'instant',          array['RAAST_API_KEY'], null),
  ('bank_transfer', 'Bank Transfer',      'manual_transfer',  '{}', null),
  ('cash',          'Cash on Delivery',   'cash',             '{}', null)
on conflict (code) do update set
  display_name = excluded.display_name,
  integration_kind = excluded.integration_kind,
  credential_env_vars = excluded.credential_env_vars,
  updated_at = now();

insert into public.payment_methods
  (code, provider_code, type, display_name, description, country_codes, currency_codes, status, environment, sort_order)
values
  -- Pakistan: the rails that already settle orders today stay enabled; the rest are announced.
  ('cod',              'cash',           'cash',    'Cash on Delivery', 'Pay the exact order total in cash to the courier when the parcel arrives.', array['PK'], array['PKR'], 'enabled',     'none', 10),
  ('jazzcash_wallet',  'jazzcash',       'wallet',  'JazzCash',         'Move the total from your JazzCash mobile account and record the transaction ID.', array['PK'], array['PKR'], 'enabled', 'none', 20),
  ('raast_instant',    'raast',          'instant', 'Raast',            'Send the exact total to the wallet ID shown at confirmation.', array['PK'], array['PKR'], 'enabled',   'none', 30),
  ('bank_transfer_pk', 'bank_transfer',  'bank_transfer', 'Bank Transfer', 'Direct transfer to the account shown at confirmation, then upload the receipt.', array['PK'], array['PKR'], 'enabled', 'none', 40),
  ('payfast_pk',       'payfast',        'card',    'PayFast',          'Card and hosted wallet payments through PayFast.', array['PK'], array['PKR'], 'coming_soon', 'none', 50),
  ('easypaisa_pk',     'easypaisa',      'wallet',  'Easypaisa',        'Move the total from your Easypaisa mobile account.', array['PK'], array['PKR'], 'coming_soon', 'none', 60),
  ('stripe_pk',        'stripe',         'card',    'Bank Card',        'Visa, Mastercard and Amex handled by Stripe.', array['PK'], array['PKR'], 'coming_soon', 'none', 70),
  ('google_pay_pk',    'google_pay',     'wallet',  'Google Pay',       'Pay with the card saved in your Google account.', array['PK'], array['PKR'], 'coming_soon', 'none', 80),
  ('apple_pay_pk',     'apple_pay',      'wallet',  'Apple Pay',        'Pay with the card saved in your Apple Wallet.', array['PK'], array['PKR'], 'coming_soon', 'none', 90),
  -- UAE
  ('stripe_ae',        'stripe',         'card',    'Bank Card',        'Visa, Mastercard and Amex handled by Stripe.', array['AE'], array['AED'], 'coming_soon', 'none', 100),
  ('tabby_ae',         'tabby',          'bnpl',    'Tabby',            'Split the order into instalments with Tabby.', array['AE'], array['AED'], 'coming_soon', 'none', 110),
  ('tamara_ae',        'tamara',         'bnpl',    'Tamara',           'Pay later or in instalments with Tamara.', array['AE'], array['AED'], 'coming_soon', 'none', 120),
  ('google_pay_ae',    'google_pay',     'wallet',  'Google Pay',       'Pay with the card saved in your Google account.', array['AE'], array['AED'], 'coming_soon', 'none', 130),
  ('apple_pay_ae',     'apple_pay',      'wallet',  'Apple Pay',        'Pay with the card saved in your Apple Wallet.', array['AE'], array['AED'], 'coming_soon', 'none', 140),
  -- Saudi Arabia
  ('stripe_sa',        'stripe',         'card',    'Bank Card',        'Visa, Mastercard and Amex handled by Stripe.', array['SA'], array['SAR'], 'coming_soon', 'none', 150),
  ('mada_sa',          'mada',           'card',    'mada',             'Pay with a mada-issued card.', array['SA'], array['SAR'], 'coming_soon', 'none', 160),
  ('stc_pay_sa',       'stc_pay',        'wallet',  'STC Pay',          'Pay from your STC Pay wallet.', array['SA'], array['SAR'], 'coming_soon', 'none', 170),
  ('google_pay_sa',    'google_pay',     'wallet',  'Google Pay',       'Pay with the card saved in your Google account.', array['SA'], array['SAR'], 'coming_soon', 'none', 180),
  ('apple_pay_sa',     'apple_pay',      'wallet',  'Apple Pay',        'Pay with the card saved in your Apple Wallet.', array['SA'], array['SAR'], 'coming_soon', 'none', 190),
  -- United Kingdom
  ('stripe_gb',        'stripe',         'card',    'Bank Card',        'Visa, Mastercard and Amex handled by Stripe.', array['GB'], array['GBP'], 'coming_soon', 'none', 200),
  ('paypal_gb',        'paypal',         'wallet', 'PayPal',   'Pay with your PayPal balance or linked card.', array['GB'], array['GBP'], 'coming_soon', 'none', 210),
  ('klarna_gb',        'klarna',         'bnpl',    'Klarna',           'Pay now or in interest-free instalments.', array['GB'], array['GBP'], 'coming_soon', 'none', 220),
  ('google_pay_gb',    'google_pay',     'wallet',  'Google Pay',       'Pay with the card saved in your Google account.', array['GB'], array['GBP'], 'coming_soon', 'none', 230),
  ('apple_pay_gb',     'apple_pay',      'wallet',  'Apple Pay',        'Pay with the card saved in your Apple Wallet.', array['GB'], array['GBP'], 'coming_soon', 'none', 240),
  -- United States
  ('stripe_us',        'stripe',         'card',    'Bank Card',        'Visa, Mastercard, Amex and Discover handled by Stripe.', array['US'], array['USD'], 'coming_soon', 'none', 250),
  ('paypal_us',        'paypal',         'wallet', 'PayPal',   'Pay with your PayPal balance or linked card.', array['US'], array['USD'], 'coming_soon', 'none', 260),
  ('klarna_us',        'klarna',         'bnpl',    'Klarna',           'Pay now or in interest-free instalments.', array['US'], array['USD'], 'coming_soon', 'none', 270),
  ('google_pay_us',    'google_pay',     'wallet',  'Google Pay',       'Pay with the card saved in your Google account.', array['US'], array['USD'], 'coming_soon', 'none', 280),
  ('apple_pay_us',     'apple_pay',      'wallet',  'Apple Pay',        'Pay with the card saved in your Apple Wallet.', array['US'], array['USD'], 'coming_soon', 'none', 290),
  -- France
  ('stripe_fr',        'stripe',         'card',    'Bank Card',        'Visa, Mastercard and Amex handled by Stripe.', array['FR'], array['EUR'], 'coming_soon', 'none', 300),
  ('carte_bancaire_fr','carte_bancaire', 'card',    'Carte Bancaire',   'Pay with a French CB card.', array['FR'], array['EUR'], 'coming_soon', 'none', 310),
  ('paypal_fr',        'paypal',         'wallet', 'PayPal',   'Pay with your PayPal balance or linked card.', array['FR'], array['EUR'], 'coming_soon', 'none', 320),
  ('google_pay_fr',    'google_pay',     'wallet',  'Google Pay',       'Pay with the card saved in your Google account.', array['FR'], array['EUR'], 'coming_soon', 'none', 330),
  ('apple_pay_fr',     'apple_pay',      'wallet',  'Apple Pay',        'Pay with the card saved in your Apple Wallet.', array['FR'], array['EUR'], 'coming_soon', 'none', 340),
  -- Spain
  ('stripe_es',        'stripe',         'card',    'Bank Card',        'Visa, Mastercard and Amex handled by Stripe.', array['ES'], array['EUR'], 'coming_soon', 'none', 350),
  ('bizum_es',         'bizum',          'instant', 'Bizum',            'Confirm the payment from the Bizum app.', array['ES'], array['EUR'], 'coming_soon', 'none', 360),
  ('paypal_es',        'paypal',         'wallet', 'PayPal',   'Pay with your PayPal balance or linked card.', array['ES'], array['EUR'], 'coming_soon', 'none', 370),
  ('google_pay_es',    'google_pay',     'wallet',  'Google Pay',       'Pay with the card saved in your Google account.', array['ES'], array['EUR'], 'coming_soon', 'none', 380),
  ('apple_pay_es',     'apple_pay',      'wallet',  'Apple Pay',        'Pay with the card saved in your Apple Wallet.', array['ES'], array['EUR'], 'coming_soon', 'none', 390),
  -- Germany
  ('stripe_de',        'stripe',         'card',    'Bank Card',        'Visa, Mastercard and Amex handled by Stripe.', array['DE'], array['EUR'], 'coming_soon', 'none', 400),
  ('paypal_de',        'paypal',         'wallet', 'PayPal',   'Pay with your PayPal balance or linked card.', array['DE'], array['EUR'], 'coming_soon', 'none', 410),
  ('klarna_de',        'klarna',         'bnpl',    'Klarna',           'Pay now or in interest-free instalments.', array['DE'], array['EUR'], 'coming_soon', 'none', 420),
  ('google_pay_de',    'google_pay',     'wallet',  'Google Pay',       'Pay with the card saved in your Google account.', array['DE'], array['EUR'], 'coming_soon', 'none', 430),
  ('apple_pay_de',     'apple_pay',      'wallet',  'Apple Pay',        'Pay with the card saved in your Apple Wallet.', array['DE'], array['EUR'], 'coming_soon', 'none', 440)
on conflict (code) do update set
  provider_code = excluded.provider_code,
  type = excluded.type,
  display_name = excluded.display_name,
  description = excluded.description,
  country_codes = excluded.country_codes,
  currency_codes = excluded.currency_codes,
  sort_order = excluded.sort_order,
  updated_at = now();

commit;

select
  (select count(*) from public.payment_providers)                                  as providers,
  (select count(*) from public.payment_methods)                                    as methods,
  (select count(*) from public.payment_methods where status = 'enabled')           as enabled_now,
  (select count(*) from public.payment_methods where status = 'coming_soon')       as coming_soon,
  (select count(*) from public.boutiques)                                           as boutiques,
  (select count(*) from pg_policies where schemaname='public' and tablename in ('payment_methods','payment_providers','boutiques')) as policies;
