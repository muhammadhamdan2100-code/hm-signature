-- ============================================================================
-- HM SIGNATURE — ADD CAD, AUD, QAR AND OMR CURRENCIES + CORRECT FOUR COUNTRY MAPPINGS
-- Version: 20261013120000 (prepared 2026-10-13)
--
-- SUPERSEDED by 20261013180000_derive_currency_rates_from_usd_anchor.sql, which inserts the
-- same four currencies AND adds the owner's requested automation: one PKR anchor, everything
-- else derived. Run ONE of the two files, not both. This one is kept because it is the
-- simpler option — literal rates, no new column, no trigger.
--
-- *** PREPARED, NOT APPLIED. DELIBERATELY OUTSIDE supabase/migrations/ ***
-- Nothing that runs migrations (`supabase db push`, `supabase migration up`, a CI
-- migrate step) will see this file. It is applied only by a person who has read it
-- and chosen to run it against production. The four rates were supplied and approved
-- by the owner on 2026-10-13; see "WHAT THE OWNER SUPPLIED" below.
--
-- WHY IT CANNOT BE RUN AS WRITTEN
--   `currencies.rate_to_base` is `not null check (rate_to_base > 0)` with no default,
--   so a row cannot be inserted without a real rate. Setting a missing rate to 1 is
--   not a workaround: it would price a CA$ 199 basket at Rs 199. The guard below stops
--   the script before it can do any damage if a rate is still blank, and it is the
--   only honest way to leave this file in review.
--
-- WHAT THE OWNER SUPPLIED (2026-10-13, approved as the "derived set")
--   rate_to_base means "how many base rupees (PKR) make one unit of this currency",
--   the same convention as the seeded USD row (278.500000 PKR per USD).
--     CAD  195.34  = 278.5 x 0.7014   (CAD->USD mid-market, 13 Oct 2026)
--     AUD  193.64  = 278.5 x 0.6953   (AUD->USD, 12 Oct 2026)
--     QAR   76.51  = 278.5 / 3.6400   (Qatar's official USD peg)
--     OMR  724.32  = 278.5 x 2.6008   (Oman's official USD peg, 0.3845 OMR/USD)
--   Each figure is derived from THIS STORE'S OWN USD rate, not from a fresh market feed, so
--   the four sit on the same manual basis as the six rows already in the table. The method
--   reproduces the existing rows: 278.5 / 75.8 = 3.674 AED (CBUAE published 3.6725) and
--   278.5 / 74.3 = 3.748 SAR (SAMA published 3.7500), both within 0.1%.
--
--   These are indicative manual figures. They are not live and must be refreshed by hand,
--   exactly like the existing six.
--
-- WHAT THIS SCRIPT DOES NOT DO
--   * It does not enable any currency. `enabled` stays false, so the storefront cannot
--     select these currencies and `quote_order` will still refuse to price in them
--     ("That currency is not available for display right now") until the owner turns them on.
--     Step 3b is the one-statement way to do that.
--   * It does not enable any country. `countries.enabled` is never touched.
--   * It does not touch payment rails, shipping fees, taxes, or a single order row.
--   * It does not re-price history: `orders.currency`, `orders.currency_rate_to_base`
--     and `orders.total_in_currency` are snapshots and are left exactly as stored.
--
-- READ THIS BEFORE ENABLING (step 3b) — payment rails filter on the DISPLAY currency
--   `src/pages/Checkout.tsx:109` calls `fetchCheckoutMethods(form.countryCode, currency.code)`,
--   and `payment_methods.currency_codes` is matched exactly. Every enabled rail today names one
--   currency, and only PKR/AED/SAR/GBP/EUR/USD appear across the 44 rows. So a shopper who
--   displays CAD while shipping to Pakistan already gets zero rails — that is the current state
--   for USD too, not something enabling creates. Enabling the four makes that condition
--   reachable for more shoppers. If you want a rail to accept one of them, add the code to that
--   rail's `currency_codes` (see validation 6f); that is a payment-configuration decision.
--
-- ONE THING TO DECIDE BEFORE APPLYING (OMR precision)
--   `orders.total_in_currency` is `numeric(12, 2)`, while OMR has three minor units.
--   A snapshot in OMR would therefore be silently rounded to two decimals at insert
--   time (`quote_order` computes `round(v_total / rate, minor_units)` = 3 digits, then
--   the column keeps 2). CAD, AUD and QAR are unaffected at two decimals.
--   Option A (default here): accept two-decimal snapshots for OMR.
--   Option B: widen the column — see step 5, commented out, because it changes how
--   money is stored and belongs to the owner, not to this script.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. OWNER INPUT — supplied and approved 2026-10-13 (derived from the store's own USD rate).
-- ---------------------------------------------------------------------------
-- Rates are held in one place so the diff a reviewer signs off on is the rate list.
create temporary table _owner_rates (code text primary key, rate text) on commit drop;

insert into _owner_rates (code, rate) values
  ('CAD', '195.34'),  -- PKR per 1 Canadian Dollar
  ('AUD', '193.64'),  -- PKR per 1 Australian Dollar
  ('QAR', '76.51'),   -- PKR per 1 Qatari Riyal  (USD-pegged)
  ('OMR', '724.32');  -- PKR per 1 Omani Rial    (USD-pegged, three minor units)

-- ---------------------------------------------------------------------------
-- 2. GUARD — refuse to continue on a missing, unparsable or non-positive rate.
-- ---------------------------------------------------------------------------
do $$
declare
  v_code text;
  v_raw text;
  v_rate numeric;
  v_missing text := '';
begin
  for v_code, v_raw in select code, rate from _owner_rates order by code loop
    if v_raw is null or trim(v_raw) = '' then
      v_missing := concat_ws(', ', v_missing, v_code || ' (blank)');
      continue;
    end if;
    begin
      v_rate := trim(v_raw)::numeric;
    exception when others then
      v_missing := concat_ws(', ', v_missing, v_code || ' (not a number: ' || v_raw || ')');
      continue;
    end;
    if v_rate <= 0 then
      v_missing := concat_ws(', ', v_missing, v_code || ' (must be > 0, got ' || v_rate || ')');
    end if;
    -- A rate of exactly 1 for a foreign currency is almost always a placeholder.
    if v_rate = 1 then
      v_missing := concat_ws(', ', v_missing, v_code || ' (rate 1 looks like a placeholder, not a PKR figure)');
    end if;
  end loop;

  if v_missing <> '' then
    raise exception
      'Aborting: rate_to_base still missing or implausible for %. currencies.rate_to_base is not null and must be > 0, and a blank rate is never filled with 1.',
      v_missing;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. INSERT THE FOUR CURRENCIES (metadata + the owner's rates), enabled = false.
-- ---------------------------------------------------------------------------
-- Idempotent for the descriptive columns. On a re-run it deliberately does NOT
-- overwrite an existing rate_to_base, rate_source, rate_updated_at or enabled flag,
-- because those may have been maintained since through the admin configuration
-- screens (save_currency) and this script has no authority to reset them.
insert into public.currencies (
  code, name, symbol, minor_units, rate_to_base, is_base, enabled, rate_source, rate_updated_at, sort_order
)
select
  r.code,
  case r.code
    when 'CAD' then 'Canadian Dollar'
    when 'AUD' then 'Australian Dollar'
    when 'QAR' then 'Qatari Riyal'
    when 'OMR' then 'Omani Rial'
  end,
  -- Symbols are disambiguated: ISO prints USD and CAD both as "$", which is unreadable
  -- in a console that lists rupees, dollars and dirhams together. These four match
  -- src/lib/currencyDisplay.ts exactly, which is what the storefront and admin render —
  -- `mapCurrency` takes the registry symbol over the stored one, so a disagreement here
  -- would be invisible to shoppers but would mislead anyone reading the table.
  case r.code
    when 'CAD' then 'C$'
    when 'AUD' then 'A$'
    when 'QAR' then 'ر.ق'
    when 'OMR' then 'ر.ع.'
  end,
  case r.code when 'OMR' then 3 else 2 end,
  trim(r.rate)::numeric(18, 6),
  false,
  false,               -- not enabled: the storefront cannot offer these yet
  'manual',
  now(),
  case r.code when 'CAD' then 6 when 'AUD' then 7 when 'QAR' then 8 when 'OMR' then 9 end
from _owner_rates r
on conflict (code) do update set
  name = excluded.name,
  symbol = excluded.symbol,
  minor_units = excluded.minor_units,
  sort_order = excluded.sort_order,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 3b. TURN THEM ON — deliberately commented out; this is the owner's switch.
-- ---------------------------------------------------------------------------
-- Until this runs, the storefront still shows these four in the currency list labelled
-- "Rate not set" and keeps their prices in rupees: `buildSelectorCurrencies()` only treats a
-- currency as priced when a row exists AND is enabled AND carries rate_to_base > 0. Running
-- this makes the label disappear and converts prices immediately, everywhere the shared
-- formatter is used. It does not open a country for delivery.
--
-- Read the payment-rails note at the top of this file first: rails are matched against the
-- display currency, so a shopper displaying CAD while shipping to Pakistan sees no payment
-- options — the same situation that already exists for USD.
--
-- update public.currencies set enabled = true, updated_at = now()
--  where code in ('CAD', 'AUD', 'QAR', 'OMR');

-- ---------------------------------------------------------------------------
-- 4. POINT THE FOUR DESTINATIONS AT THEIR OWN CURRENCY — but only once that
--    currency is enabled.
-- ---------------------------------------------------------------------------
-- Today the seed maps Canada and Australia to USD and Qatar and Oman to SAR, which is
-- simply not their money. `countries.currency_code` is a nullable foreign key, so a
-- disabled or missing target would make `quote_order` fail for that destination, and a
-- shopper who had already picked it would not be able to check out. The EXISTS guard
-- keeps this statement inert until the owner enables the row, so steps 3 and 4 can be
-- run together safely.
update public.countries c
   set currency_code = t.code,
       updated_at = now()
  from (values
          ('CA', 'CAD'),
          ('AU', 'AUD'),
          ('QA', 'QAR'),
          ('OM', 'OMR')
       ) as t(country_code, code)
 where c.code = t.country_code
   and c.currency_code is distinct from t.code
   and exists (
     select 1 from public.currencies cur
      where cur.code = t.code and cur.enabled
   );

-- ---------------------------------------------------------------------------
-- 5. OPTIONAL — OMR at three decimals. LEFT COMMENTED OUT ON PURPOSE.
-- ---------------------------------------------------------------------------
-- Widening the column that stores what a shopper was charged changes money storage for
-- every past and future order. Decide it, uncomment, and re-review before running.
--
-- Widening alone does NOT deliver three-decimal OMR. The operative place_order declares its
-- snapshot as `numeric(12, 2)` (20261003212000_...sql:53), and the loyalty and gift-card
-- restatements hard-code `round(..., 2)` (20261005235000_...sql:492, 20261005240000_...sql:537
-- and :623). Those are server-side changes and are deliberately not part of this script —
-- see docs/money-and-currency-displays.md.
--
-- alter table public.orders
--   alter column total_in_currency type numeric(12, 3);
--
-- Existing rows are unaffected in value: a snapshot stored as 161.58 reads back as
-- 161.580. After this, `quote_order`'s round(total / rate, minor_units) keeps the
-- thousandth for OMR instead of dropping it.

commit;

-- ---------------------------------------------------------------------------
-- 6. VALIDATION — run each of these after the commit and read the output.
-- ---------------------------------------------------------------------------

-- 6a. The four rows exist with the rates the owner supplied, and are still disabled.
--     Expect: 4 rows, enabled = false.
select code, name, symbol, minor_units, rate_to_base, is_base, enabled, rate_source
  from public.currencies
 where code in ('CAD', 'AUD', 'QAR', 'OMR')
 order by sort_order;

-- 6b. Nothing else moved. Expect exactly the six seeded currencies, PKR the only base.
select count(*) as currency_rows,
       count(*) filter (where is_base) as base_rows,
       count(*) filter (where enabled) as enabled_rows
  from public.currencies;

-- 6c. No destination points at a currency that cannot be quoted yet. Expect zero rows,
--     because step 4 only re-points enabled currencies.
select c.code, c.name, c.currency_code, cur.enabled
  from public.countries c
  left join public.currencies cur on cur.code = c.currency_code
 where c.currency_code is not null
   and (cur.code is null or not cur.enabled);

-- 6d. The four destinations and their delivery switches. Expect enabled = false: this
--     script does not open a country for business.
select code, name, enabled, currency_code
  from public.countries
 where code in ('CA', 'AU', 'QA', 'OM')
 order by code;

-- 6e. History is untouched. Expect the same distribution as before the run: no order
--     row was read or written by this script.
select currency, count(*) as orders, min(created_at) as first_order
  from public.orders
 group by currency
 order by currency;

-- 6f. Which rails would a shopper in each new currency actually be offered? Expect zero rows
--     for all four until a rail's currency_codes is extended — see the rails note at the top.
select v.code as currency,
       (select count(*) from public.payment_methods pm
         where pm.status = 'enabled' and v.code = any (pm.currency_codes)) as enabled_rails
  from (values ('CAD'), ('AUD'), ('QAR'), ('OMR')) as v(code);

-- ---------------------------------------------------------------------------
-- 7. ROLLBACK — run only to undo THIS script.
-- ---------------------------------------------------------------------------
-- The countries are returned to the seeded mapping first, then the rows are dropped.
-- Deleting a currency a live order still references would leave that order's snapshot
-- pointing at a missing row, so the delete is guarded the same way step 4 is.
--
-- begin;
--
-- update public.countries c
--    set currency_code = t.code, updated_at = now()
--   from (values ('CA', 'USD'), ('AU', 'USD'), ('QA', 'SAR'), ('OM', 'SAR')) as t(country_code, code)
--  where c.code = t.country_code;
--
-- delete from public.currencies cur
--  where cur.code in ('CAD', 'AUD', 'QAR', 'OMR')
--    and not exists (select 1 from public.countries c where c.currency_code = cur.code)
--    and not exists (select 1 from public.orders o where o.currency = cur.code);
--
-- commit;
--
-- If step 6a still shows a row after that delete, an order or a country still uses it,
-- which is correct: history keeps its currency. Leave the row in place and set
-- enabled = false instead of deleting it.
