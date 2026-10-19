-- ============================================================================
-- HM SIGNATURE — DERIVE CURRENCY RATES FROM ONE PKR ANCHOR (the "set once" trigger)
-- Version: 20261013180000
--
-- *** PREPARED, NOT APPLIED. DELIBERATELY OUTSIDE supabase/migrations/ ***
-- This supersedes 20261013120000_add_cad_aud_qar_omr_currencies.sql. Run ONE of the two,
-- not both: this file inserts the same four currencies itself, and adds the automation.
--
-- WHAT THE OWNER ASKED FOR
--   "Jo PKR me set karoon, wo baakiyon me khud set ho jaye."
--   One number — the store's PKR-per-US-Dollar rate — anchors every other currency. Change
--   that row and the dependent rates recompute themselves, instead of ten figures being
--   retyped by hand and drifting out of agreement.
--
-- HOW IT WORKS
--   A new nullable column `currencies.rate_to_usd` marks a row as DERIVED and stores its
--   price in dollars. `rate_to_base` for such a row is computed, never typed:
--
--       rate_to_base = rate_to_base(USD) x rate_to_usd
--
--   A row with `rate_to_usd` left NULL keeps its own hand-set `rate_to_base` and is never
--   touched by the trigger. The six currencies already in the table are all NULL, so this
--   migration changes nothing about how they behave.
--
--   Why USD and not the base directly: the base IS the rupee (PKR.rate_to_base = 1), so a
--   "PKR per PKR" factor would be 1 for everything. The store's own USD row is the number it
--   already maintains, and every other currency has a well-known price in dollars. The four
--   factors below reproduce the existing rows to within 0.1%:
--     278.5 / 75.8 = 3.674 AED  (Central Bank of the UAE published 3.6725 on 12 Oct 2026)
--     278.5 / 74.3 = 3.748 SAR  (SAMA published 3.7500 on 12 Oct 2026)
--
-- WHAT THIS SCRIPT DOES NOT DO
--   * It does not enable any currency. The four are inserted `enabled = false`; step 5 is the
--     owner's switch. Until then the storefront still lists them as "Rate not set" and keeps
--     their prices in rupees.
--   * It does not enable any country, and it does not touch any payment rail.
--   * It does not re-price history: `orders.currency`, `orders.currency_rate_to_base` and
--     `orders.total_in_currency` are per-order snapshots and are never read or written.
--   * It never overwrites a rate for a row that has not opted in (`rate_to_usd is null`).
--
-- READ BEFORE STEP 5 — checkout prices in the DISPLAY currency, and rails filter on it too
--   `src/pages/Checkout.tsx:170` calls quote_order with the shopper's display currency, and
--   `payment_methods.currency_codes` is matched exactly. All 14 enabled rails today name only
--   PKR/AED/SAR/GBP/EUR/USD. So a shopper displaying CAD while shipping to Pakistan gets a
--   priced basket and then NO payment options. Enabling the four makes that reachable; step 6
--   is the (deliberately commented) payment-configuration change that closes it.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. THE ANCHOR FACTOR COLUMN — opt-in per row, positive when present.
-- ---------------------------------------------------------------------------
alter table public.currencies
  add column if not exists rate_to_usd numeric(18, 6)
    constraint currencies_rate_to_usd_positive check (rate_to_usd is null or rate_to_usd > 0);

comment on column public.currencies.rate_to_usd is
  'Price of one unit of this currency in US dollars. When set, rate_to_base is derived from '
  'the USD row by trigger currencies_derive_rate and must not be typed by hand. NULL means '
  'this currency keeps its own manually configured rate_to_base.';

-- ---------------------------------------------------------------------------
-- 2. THE TRIGGER — derive on write, propagate when the anchor moves.
-- ---------------------------------------------------------------------------
create or replace function public.currencies_derive_rate()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_anchor numeric;
begin
  -- The base rupee, and every row that has not opted in, keep their own figures.
  if new.is_base or new.rate_to_usd is null then
    return new;
  end if;

  if new.code = 'USD' then
    v_anchor := new.rate_to_base;
  else
    select rate_to_base into v_anchor from public.currencies where code = 'USD';
  end if;

  -- No usable anchor yet: keep the incoming rate rather than inventing one. A missing anchor
  -- must never be read as parity with the rupee.
  if v_anchor is null or v_anchor <= 0 then
    return new;
  end if;

  new.rate_to_base := round(v_anchor * new.rate_to_usd, 6);
  new.rate_source := 'manual';
  new.rate_updated_at := coalesce(new.rate_updated_at, now());
  return new;
end $$;

drop trigger if exists currencies_derive_rate on public.currencies;
create trigger currencies_derive_rate
  before insert or update of rate_to_usd, rate_to_base, is_base on public.currencies
  for each row execute function public.currencies_derive_rate();

-- When the USD row itself moves, restate every derived row. The `is distinct from` test makes
-- this a no-op when nothing changed, so it cannot churn updated_at on every unrelated edit.
create or replace function public.currencies_propagate_anchor()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.code = 'USD' and new.rate_to_base is distinct from old.rate_to_base then
    update public.currencies
       set rate_to_base    = round(new.rate_to_base * rate_to_usd, 6),
           rate_updated_at = now(),
           updated_at      = now()
     where rate_to_usd is not null
       and code <> 'USD'
       and not is_base
       and rate_to_base is distinct from round(new.rate_to_base * rate_to_usd, 6);
  end if;
  return null;
end $$;

drop trigger if exists currencies_propagate_anchor on public.currencies;
create trigger currencies_propagate_anchor
  after update of rate_to_base on public.currencies
  for each row execute function public.currencies_propagate_anchor();

-- The functions read and write the table itself, so they run as its owner and take no caller
-- privileges. Same convention as save_currency in 20261003210000.
alter function public.currencies_derive_rate() owner to postgres;
alter function public.currencies_propagate_anchor() owner to postgres;
revoke execute on function public.currencies_derive_rate(), public.currencies_propagate_anchor()
  from public, anon;

-- ---------------------------------------------------------------------------
-- 3. GUARD — the anchor must exist and be plausible before anything derives from it.
-- ---------------------------------------------------------------------------
do $$
declare
  v_anchor numeric;
begin
  select rate_to_base into v_anchor from public.currencies where code = 'USD';
  if v_anchor is null then
    raise exception
      'Aborting: no USD row to anchor derived rates to. Create USD first, or use the '
      'literal-rate migration 20261013120000 instead.';
  end if;
  if v_anchor <= 0 or v_anchor = 1 then
    raise exception 'Aborting: USD rate_to_base is %; a derived rate needs a real PKR figure.', v_anchor;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. THE FOUR CURRENCIES — factor typed once, rupee figure computed by the trigger.
-- ---------------------------------------------------------------------------
-- Factors approved by the owner on 2026-10-13: CAD/AUD from that day's mid-market, QAR/OMR
-- from their official USD pegs. `rate_to_base` is written by the trigger, not by this insert.
insert into public.currencies (
  code, name, symbol, minor_units, rate_to_usd, rate_to_base, is_base, enabled, rate_source, sort_order
)
values
  ('CAD', 'Canadian Dollar',  'C$',   2, 0.7014,   1, false, false, 'manual', 6),
  ('AUD', 'Australian Dollar','A$',   2, 0.6953,   1, false, false, 'manual', 7),
  ('QAR', 'Qatari Riyal',     'ر.ق',  2, 0.274725, 1, false, false, 'manual', 8),
  ('OMR', 'Omani Rial',       'ر.ع.', 3, 2.60078,  1, false, false, 'manual', 9)
on conflict (code) do update set
  name = excluded.name,
  symbol = excluded.symbol,
  minor_units = excluded.minor_units,
  rate_to_usd = excluded.rate_to_usd,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Symbols match src/lib/currencyDisplay.ts, which is what the storefront and admin render:
-- `mapCurrency` takes the registry symbol over the stored one, so a disagreement here would be
-- invisible to shoppers but would mislead anyone reading the table.

-- 4b. PROOF THE DERIVATION ACTUALLY HAPPENED. The insert above carries a placeholder rate of 1
--     precisely so that it cannot survive: the trigger must have replaced it. If the anchor was
--     missing or the trigger did not fire, this aborts the whole transaction rather than leaving
--     a currency priced at parity with the rupee.
do $$
declare
  v_bad text := '';
  r record;
begin
  for r in
    select c.code as code, c.rate_to_base as actual, round(u.rate_to_base * c.rate_to_usd, 6) as expected
      from public.currencies c
      join public.currencies u on u.code = 'USD'
     where c.rate_to_usd is not null
  loop
    if r.actual is null or r.actual <= 0 or r.actual = 1 or r.actual is distinct from r.expected then
      v_bad := concat_ws(', ', v_bad, r.code || ' (got ' || coalesce(r.actual::text, 'null')
                         || ', expected ' || r.expected || ')');
    end if;
  end loop;

  if v_bad <> '' then
    raise exception
      'Aborting: derived rate_to_base is wrong or still the placeholder for %. '
      'The currencies_derive_rate trigger did not compute from the USD anchor.', v_bad;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. POINT THE FOUR DESTINATIONS AT THEIR OWN CURRENCY — gated on it being enabled.
-- ---------------------------------------------------------------------------
-- Today the seed maps Canada and Australia to USD and Qatar and Oman to SAR. The storefront no
-- longer asks these rows what a country's money is (it reads ISO metadata), but quote_order
-- does, so this is the one place the wrong answer still counts.
update public.countries c
   set currency_code = t.code,
       updated_at = now()
  from (values ('CA', 'CAD'), ('AU', 'AUD'), ('QA', 'QAR'), ('OM', 'OMR')) as t(country_code, code)
 where c.code = t.country_code
   and c.currency_code is distinct from t.code
   and exists (select 1 from public.currencies cur where cur.code = t.code and cur.enabled);

commit;

-- ============================================================================
-- OWNER SWITCHES — deliberately outside the transaction above. Run each only
-- after reading validation 6a/6b and the payment-rails note at the top.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 6. TURN THE FOUR ON. Until this runs, prices stay in rupees and the selector says
--    "Rate not set". After it, the label disappears and every surface using the shared
--    formatter converts immediately — no code change involved.
-- ---------------------------------------------------------------------------
-- update public.currencies set enabled = true, updated_at = now()
--  where code in ('CAD', 'AUD', 'QAR', 'OMR');

-- ---------------------------------------------------------------------------
-- 7. PAYMENT RAILS (only if step 6 is run). A shopper displaying one of these four while
--    shipping to Pakistan is currently offered nothing, because every enabled PK rail names
--    PKR only. This adds the display currency to the manual rails so they can be chosen.
--    It changes payment configuration, so it is not part of the migration above.
-- ---------------------------------------------------------------------------
-- update public.payment_methods
--    set currency_codes = currency_codes || 'CAD'::text[], updated_at = now()
--  where status = 'enabled' and country_codes @> array['PK'] and not currency_codes @> array['CAD'];
-- (repeat for AUD, QAR, OMR)

-- ---------------------------------------------------------------------------
-- 8. VALIDATION — run each and read the output.
-- ---------------------------------------------------------------------------

-- 8a. The four exist, are derived, and still disabled. Expect 4 rows, enabled = false.
-- select code, symbol, minor_units, rate_to_usd, rate_to_base, enabled
--   from public.currencies where rate_to_usd is not null order by sort_order;

-- 8b. Every derived row agrees with anchor x factor. Expect zero rows.
-- select a.code, a.rate_to_base, round(u.rate_to_base * a.rate_to_usd, 6) as expected
--   from public.currencies a join public.currencies u on u.code = 'USD'
--  where a.rate_to_usd is not null
--    and a.rate_to_base is distinct from round(u.rate_to_base * a.rate_to_usd, 6);

-- 8c. The six seeded currencies were not converted into derived ones. Expect 6 rows, all
--    with rate_to_usd null.
-- select code, rate_to_usd, rate_to_base from public.currencies
--  where code in ('PKR','USD','AED','SAR','GBP','EUR') order by sort_order;

-- 8d. The trigger actually fires: change USD, watch the four follow, then put it back.
--    Expect the second select to show all four scaled by 278.50 -> 280.00.
-- update public.currencies set rate_to_base = 280 where code = 'USD';
-- select code, rate_to_base from public.currencies where rate_to_usd is not null order by code;
-- update public.currencies set rate_to_base = 278.5 where code = 'USD';
-- select code, rate_to_base from public.currencies where rate_to_usd is not null order by code;

-- 8e. No destination points at a currency that cannot be quoted. Expect zero rows while the
--    four are disabled, because step 5 only re-points enabled currencies.
-- select c.code, c.currency_code, cur.enabled from public.countries c
--   left join public.currencies cur on cur.code = c.currency_code
--  where c.currency_code is not null and (cur.code is null or not cur.enabled);

-- 8f. History untouched. Expect the same distribution as before the run.
-- select currency, count(*) from public.orders group by currency order by currency;

-- ---------------------------------------------------------------------------
-- 9. ROLLBACK — undo everything, including the automation.
-- ---------------------------------------------------------------------------
-- begin;
--
-- update public.countries c
--    set currency_code = t.code, updated_at = now()
--   from (values ('CA','USD'),('AU','USD'),('QA','SAR'),('OM','SAR')) as t(country_code, code)
--  where c.code = t.country_code;
--
-- delete from public.currencies cur
--  where cur.rate_to_usd is not null
--    and not exists (select 1 from public.countries c where c.currency_code = cur.code)
--    and not exists (select 1 from public.orders o where o.currency = cur.code);
--
-- drop trigger if exists currencies_propagate_anchor on public.currencies;
-- drop trigger if exists currencies_derive_rate on public.currencies;
-- drop function if exists public.currencies_propagate_anchor();
-- drop function if exists public.currencies_derive_rate();
-- alter table public.currencies drop column if exists rate_to_usd;
--
-- commit;
--
-- If 9's delete leaves a row behind, an order or a country still references it — that is
-- correct, history keeps its currency. Set enabled = false instead of deleting.
