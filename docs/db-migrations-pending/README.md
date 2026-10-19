> **2026-10-19:** the two privilege files that were listed here
> (`20261019180000_anon_privilege_lockdown.sql`, `20261019190000_coupon_codes_not_public.sql`)
> have since been applied to the live project and moved to `supabase/migrations/`.
> What remains here is the currency-rate anchor migration, which the owner superseded
> by entering the four rates directly in the admin panel.

# Pending database migrations — prepared, NOT applied

Files here are written for review and are deliberately kept **outside `supabase/migrations/`** so
that no `supabase db push`, `supabase migration up`, or CI migrate step can pick them up. Nothing
in this folder has been run against production.

## Why nothing here is applied yet

Two hard facts, both verified in this repository:

- **No write path from this environment.** `.env` carries only the public `VITE_SUPABASE_ANON_KEY` — no service-role key
  and no database password. Anon INSERT into `currencies` is refused by RLS, and the sanctioned
  write is the `save_currency` RPC, which demands `manage_settings`.
- **The rate has to live in the database.** `src/pages/Checkout.tsx:170` calls `quote_order` with
  the shopper's **display** currency, so a rate kept only in frontend code would show converted
  prices while checkout still rejected that currency. Deriving rates in the app is not a fix — it
  splits display from pricing, which is the exact defect this whole area exists to prevent.

**So there are two ways in, and neither needs this folder:** Admin → International now has an
**Add currency** form that reaches `save_currency` directly — type the three-letter code, and the
name, symbol and decimal count come from the ISO tables with the approved PKR figure prefilled.
Or run the SQL below, which additionally installs the anchor trigger so future USD edits re-derive
every dependent rate automatically. The admin form cannot do that part: `rate_to_usd` is a column,
and adding one is a schema change.

## `20261013180000_derive_currency_rates_from_usd_anchor.sql` — the "set once" option

**Run this OR the file below, not both.** This is the owner's requested behaviour: set one number —
the store's PKR-per-USD rate — and every other currency that opts in recomputes itself.

- Adds nullable `currencies.rate_to_usd`. Set = "derive me from the USD anchor"; NULL = "my
  `rate_to_base` is my own". The six existing rows are all NULL, so their behaviour does not change.
- `rate_to_base = round(rate_to_base(USD) × rate_to_usd, 6)`, computed by a BEFORE trigger, plus an
  AFTER trigger on the USD row that restates every dependent row when the anchor moves.
- Inserts CAD (0.7014), AUD (0.6953), QAR (0.274725), OMR (2.60078) with `enabled = false`. The
  insert carries a deliberate placeholder rate of `1` that **must not survive**: step 4b aborts the
  whole transaction if any derived row still reads 1, or disagrees with anchor × factor. So a
  missing anchor fails loudly instead of quietly pricing a Canadian dollar at one rupee.
- Step 6 (commented) enables the four; step 7 (commented) is the payment-rails change that becomes
  relevant once they are enabled. Step 8d proves the trigger fires by moving USD 278.5 → 280 and
  back. Step 9 drops the triggers and the column.

## `20261013120000_add_cad_aud_qar_omr_currencies.sql` — the literal-rate option

Adds four currencies (CAD, AUD, QAR, OMR) and re-points the Canada, Australia, Qatar and Oman
destination rows at their own money instead of the borrowed one they were seeded with
(`CA`/`AU` → USD, `QA`/`OM` → SAR).

**Status: rates supplied and approved by the owner on 2026-10-13. Blocked only on a person
running the file against production** — the anon key this app ships cannot write to `currencies`
(INSERT is blocked by RLS; the sanctioned path is the `save_currency` RPC, which demands
`manage_settings`), and no database credentials are configured in this environment.

| currency | `rate_to_base` (PKR per one unit) | how it was derived |
| --- | --- | --- |
| CAD | 195.34 | 278.5 × 0.7014 — CAD→USD mid-market, 13 Oct 2026 |
| AUD | 193.64 | 278.5 × 0.6953 — AUD→USD, 12 Oct 2026 |
| QAR | 76.51 | 278.5 ÷ 3.6400 — Qatar's official USD peg |
| OMR | 724.32 | 278.5 × 2.6008 — Oman's official USD peg (0.3845 OMR/USD) |

Every figure is cross-derived from **this store's own USD rate (278.5)**, not from a fresh feed, so
the four join the same `rate_source = 'manual'` family as the six rows already in the table. The
method reproduces the existing rows: 278.5 ÷ 75.8 = 3.674 AED against CBUAE's published 3.6725, and
278.5 ÷ 74.3 = 3.748 SAR against SAMA's published 3.7500 — both within 0.1%. These are indicative
manual figures and need refreshing by hand, exactly like the existing six.

`currencies.rate_to_base` is `not null check (rate_to_base > 0)` with no default. The guard in step 2
still aborts on a blank, unparsable, non-positive or exactly-`1` rate, so a future copy of this file
cannot be run with a placeholder.

### What the script deliberately does not do

- **Does not enable a currency.** All four are inserted with `enabled = false`. Step 3b is the one
  statement that turns them on, and it is commented out.
- **Does not enable a country.** `countries.enabled` is never touched, so no destination starts
  shipping and no payment rail changes.
- **Does not re-point a destination at a disabled currency.** Step 4 only updates a country when its
  new currency row is already `enabled`, which keeps steps 3 and 4 safe to run together: with the
  rows disabled, the country mapping simply stays as it is.
- **Does not touch history.** `orders.currency`, `orders.currency_rate_to_base` and
  `orders.total_in_currency` are per-order snapshots, and no order row is read or written.
- **Does not overwrite a rate that already exists.** A re-run refreshes name, symbol, precision and
  sort order only; `rate_to_base`, `rate_source`, `rate_updated_at` and `enabled` are left alone.

### Read this before running step 3b: payment rails filter on the display currency

`src/pages/Checkout.tsx:109` calls `fetchCheckoutMethods(form.countryCode, currency.code)` and
`payment_methods.currency_codes` is matched exactly. All 14 enabled rails today name one currency
each, and only `PKR AED SAR GBP EUR USD` appear across the 44 rows. So a shopper displaying CAD
while shipping to Pakistan is offered **no** payment methods — that is already true for USD today,
it is not something enabling creates, but enabling makes it reachable for more shoppers. Either add
the code to the relevant rail's `currency_codes`, or leave the currency display-only. Validation 6f
answers this with real numbers.

### One decision to make first: OMR precision

`orders.total_in_currency` is `numeric(12, 2)`, but Omani Rial has three minor units, so an OMR
snapshot is rounded to two decimals when stored. CAD, AUD and QAR are unaffected. The script leaves
this alone by default and offers the widening statement commented out at step 5.

Widening the column is **not sufficient on its own**: the operative `place_order` declares its
snapshot variable as `numeric(12, 2)`, and the loyalty and gift-card restatements hard-code
`round(..., 2)`. The full write-site list is in
[`docs/money-and-currency-displays.md`](../money-and-currency-displays.md). Until those change, OMR
is a two-decimal stored value and must not be described as three-decimal settlement — the storefront
will still print three decimals, because display precision comes from the ISO table.

### How to run it

Every statement must run as **one script in one session** — step 1 creates a temporary table that
steps 3 and 4 read. If the guard aborts, the transaction is left aborted: issue `ROLLBACK;` before
re-running.

1. Run against a **staging/preview database first** and read every result in step 6:
   6a four rows, disabled · 6b ten currencies, one base · 6c zero rows · 6d four countries still
   `enabled = false` · 6e order distribution unchanged · 6f enabled rails per new currency.
2. Confirm the OMR decision (accept two decimals, or uncomment step 5).
3. Apply, then decide on step 3b (enabling) separately — that is what shoppers actually feel.
4. If it should become a normal tracked migration, move the file into `supabase/migrations/`
   **only after** it has been reviewed and applied — that directory is the apply path.
5. Rollback is step 7 and is guarded: a currency still referenced by a country or an order is not
   deleted, because the history needs it. Disable it instead.

## The frontend half is already in the tree and needs no migration

- `src/lib/countries.ts` maps 241 ISO 3166-1 countries to the currency each is priced in, and lists
  the twelve configured destinations in `CONFIGURED_DESTINATIONS`.
- `src/lib/currencyDisplay.ts` carries symbol and ISO 4217 minor units for 154 codes, including
  CAD `C$`/2, AUD `A$`/2, QAR `ر.ق`/2 and OMR `ر.ع.`/3 — the symbols the owner specified.
- `src/lib/currencyOffer.ts` builds the navbar's ten unique options and defines what counts as a
  usable rate.
- `src/services/internationalConfig.ts` renders every configured row with the registry's symbol and
  exponent, and reads an absent `rate_to_base` as **0, never 1**.

Because of that last layer, **applying this migration changes nothing about how the four currencies
look until they are enabled**: `buildSelectorCurrencies()` still lists them, labelled "Rate not set",
and `format()` keeps printing rupees rather than converting with a rate the storefront has not been
handed. That is deliberate — the label disappears the moment the row is enabled, with no code change.

Coverage: `tests/country-currency-metadata.test.ts`, `tests/admin-order-currency.test.ts`,
`tests/currency-selector-offer.test.ts`.

**What step 4 also fixes on the data side:** the seeded `countries` rows point Canada and Australia
at USD and Qatar and Oman at SAR. The storefront no longer asks those rows what a country's money is
— it reads ISO metadata — so the mismatch is invisible to shoppers today. Step 4 corrects the data so
`quote_order`, which does read the row, stops being the one place the wrong answer still counts.
