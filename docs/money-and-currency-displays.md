# Money: which column means what, and how each screen must print it

Verified against `supabase/migrations/20261003211000_phase7_shipping_tax_currency_orders.sql`
(the column comments are quoted below) and `quote_order` in the same file. Read this before
adding a monetary display to the console.

## Two registers, never mixed

| figure | stored in | print with |
| --- | --- | --- |
| `orders.subtotal`, `discount_amount`, `shipping_cost`, `tax_amount`, `total` | **base currency (PKR)** | `formatBaseMoney` / `formatPKR` |
| `orders.total_in_currency` | the order's own `currency` at `currency_rate_to_base` | `formatStoredAmount(amount, code)` |
| `payments.amount`, `refunds.amount` | **base currency (PKR)** — `record_refund` validates a refund against `payments.amount` | `formatBaseMoney` |
| `gift_cards.balance`, `initial_amount` | **the card's own `currency`** (`20261005240000_...sql:103`) | `formatStoredAmount(balance, card.currency)` |
| `countries.shipping_fee`, `free_shipping_threshold` | **base currency (PKR)** — `quote_order` adds them to rupee goods, then converts the total once | `formatBaseMoney` |
| `products` / variant prices, coupons, loyalty, gift cards | base currency (PKR) | `formatBaseMoney` |
| Report aggregates (Phase 9) | already converted by the RPC | `useReportFormat()` in `Phase9Shared.tsx` — applies symbol and precision only, never re-converts |

The schema states the rule for history:

> `orders.total` — "Always the base currency (PKR). The display currency of the sale is recorded separately."
> `orders.total_in_currency` — "Order total expressed in `currency` at `currency_rate_to_base`, kept so a later
> rate change cannot alter a past order."

## Console display rules

1. **An order's currency comes from the order, not the session.** Use `formatOrderCharged(order)`
   (`src/utils/currency.ts`). It reads `currency` + `total_in_currency` from the stored snapshot, so
   a PKR order prints as `Rs 45,000` however the storefront is browsing, and a USD order prints as
   `$ 161.58`. Where a screen shows both registers, the rupee line comes from
   `orderBaseAmountLabel(order)`, never from a re-conversion.
2. **Never re-derive a past amount.** Dividing `orders.total` by today's rate would move an order
   that was already charged. If `total_in_currency` is absent, `formatOrderCharged` falls back to the
   base figure **with the currency stated** (`Rs 45,000 (PKR)`) rather than guessing a conversion.
3. **Do not stamp a rupee figure with a foreign code.** This was the defect in the order list, the
   order detail page, the reconciliation ledger (`provider_currency` labels the settlement, not the
   rupee amount) and the destination table (country fees are rupees). Symbols carry the currency now.
4. **`refund.currency` is a settlement record**, not the currency of `refunds.amount`. Shown on its
   own line for the same reason.

## Formatting

`src/lib/money.ts` owns integer minor-unit arithmetic and `formatMinor`, which pins
`numberingSystem: "latn"` so Arabic and Urdu shoppers see the same Latin digits that are on the
order record, while grouping separators follow the locale (`Rs 1.370` in German,
`Rs 1 370` in French — a narrow no-break space, U+202F).

`src/lib/currencyDisplay.ts` holds **display metadata only** — symbol and ISO 4217 minor units — for
all 154 codes the 241 countries in `src/lib/countries.ts` use, derived from three tables
(`ZERO_DECIMAL`, `THREE_DECIMAL`, and a `GLYPHS` map whose members are unique). It carries no rates
on purpose: a code can be rendered before the store prices it, but it cannot be converted there —
`isSettlementPrecisionReady()` reports separately whether a code can actually be settled. Codes
outside the table keep their own code as the symbol rather than borrowing another currency's
identity.

## Four separate capabilities

Knowing a country's money means one thing only: the storefront can print it. Nothing else follows.

| capability | where it is decided | shown as |
| --- | --- | --- |
| Currency display | `src/lib/countries.ts` + `src/lib/currencyDisplay.ts` (static ISO tables) | the symbol and decimal count used wherever that currency is printed |
| Currency conversion | the `currencies` table: a row must exist, be `enabled`, and carry a real `rate_to_base` | the currency control shows the money prices are actually computed in; a listed currency with no rate is marked "Rate not set" and prices stay in rupees |
| Shipping and checkout | the `countries` table (`enabled`, `shipping_fee`) | rows the store does not serve are disabled in checkout's own picker |
| Payment methods | `payment_methods` joined by country **and** currency (`src/services/storeConfig.ts`) | the existing Coming soon / Not available badges in checkout |

The navbar carries a currency control and a language control only — there is no country selector
there. A destination is chosen where it has consequences, in checkout, and is persisted under
`hm-signature-country`; `CurrencyContext.country` remains the database's answer, so a destination
the shop does not serve can never make checkout claim it does.

**The destination's money is read from ISO metadata, not from the `countries` row.** Four of
those rows still name the wrong currency for their country — `CA` and `AU` say USD, `QA` and `OM`
say SAR — and correcting them is a configuration write, which is not this layer's to make.
`CONFIGURED_DESTINATIONS` in `src/lib/countries.ts` lists the twelve destinations the shop keeps
rows for, and `src/lib/currencyOffer.ts` turns them into the selector's offer.

### What the currency control offers

`buildSelectorCurrencies()` returns the currencies the store prices in, then the own money of each
configured destination, deduplicated by code: **ten entries for twelve countries**, because France,
Germany and Spain share one EUR.

A destination the shop has no rate for is still offered — a Canadian shopper must be able to say
Canada — but its entry carries `rateToBase: 0`, which `hasUsableRate()` refuses to convert with.
`format()` then prints the rupee price as itself, the row is labelled "Rate not set", and the menu
footer states which currency is missing a rate. **A missing rate is never read as parity with the
rupee, and never as 1.** As of 2026-10-13 the priced set is PKR, USD, AED, SAR, GBP, EUR; the
rate-less set is CAD, AUD, QAR, OMR.

Symbols and exponents come from `currencyDisplay.ts` for live rows (`mapCurrency`), for the offline
fallback (`FALLBACK_CURRENCIES`) and for rate-less entries alike, so a degraded configuration read
cannot print a different money from a healthy one.

`src/lib/countries.ts` carries 241 ISO 3166-1 countries and territories; `currencyDisplay.ts`
carries the 154 ISO 4217 codes they use, with the exponent each one is written to (JPY and PKR
have no minor unit, OMR, KWD, BHD, IQD, JOD, LYD and TND have three). Symbols are unique across
the table, which is why the Canadian and Australian dollars are `C$` and `A$` and not a second
`$`.


## The customer's own order history

`src/services/customerOrders.ts` now carries the order's `currency` and `total_in_currency`
through to the account view, and `src/pages/Account.tsx` renders its order card from them:
the total via `formatOrderCharged` (the recorded currency) and the line items, discounts and
refunds via `formatBaseMoney` (rupees, which is what those columns hold). The screen therefore
reads in the money the order was taken in, whatever currency the shopper is browsing the
catalog in — changing the navbar currency cannot rewrite a past order.

Pakistan is the only enabled destination — verified against the live `countries` configuration
on 2026-10-13, all twelve rows except `PK` have `enabled = false` and no `shipping_fee` — so
every order the store can currently take is PKR and the two registers are identical. The rule
matters the moment a foreign destination opens.

The checkout confirmation screen reads the same way. `src/pages/Checkout.tsx:636` renders
`formatOrderCharged({ total: placedTotal, currency: placedReceipt?.currency, totalInCurrency:
placedReceipt?.totalInCurrency })`, so the receipt prints the snapshot the order just stored rather
than a figure re-derived from the live rate. Before that change it printed `format(placedTotal)` —
the amount was right at that instant because the live and snapshot rates were the same number, but
the source was wrong.

## Latent defects found while auditing, not fixed here

These are all server-side (RPC or schema) and every one of them is a decision for the owner. None is
reachable in the current configuration, which is why they are recorded rather than patched.

1. **`payments.provider_currency` does not describe `payments.amount`.**
   `start_payfast_payment` (`20261003130000_...sql:75-90`) stores `payments.amount = round(orders.total, 2)`
   — rupees — alongside `provider_currency`, which defaults to `'ZAR'` and is **never converted**. The
   webhook then rejects a notification unless `p_amount_gross` matches the rupee total
   (`abs(diff) > 0.01`, line 167) *and* its currency equals the stored `provider_currency` (line 174).
   A PayFast charge genuinely settled in ZAR therefore can never be accepted, because the gateway's
   ZAR total will not equal the rupee figure. The reconciliation console now shows this honestly: the
   amount carries the rupee symbol and the settlement code sits on its own line instead of labelling
   the rupee number. Making the rail money-consistent needs an owner decision about what amount and
   currency are actually sent to the gateway.
2. **OMR cannot be settled at three decimals without changing more than the column.**
   `orders.total_in_currency` is `numeric(12, 2)` (`20261003211000_...sql:18`; no later migration widens
   it). The value is also truncated before it reaches the column, and every restatement rounds to two:
   `quote_order` produces `round(v_total / rate, minor_units)` (line 201, so 3 for OMR), the operative
   `place_order` declares `v_total_in_currency numeric(12, 2)` (`20261003212000_...sql:53`), loyalty
   redemption restates the snapshot with `round(v_new_total * v_ratio, 2)`
   (`20261005235000_...sql:492`), gift-card application does the same twice
   (`20261005240000_...sql:537` and `:623`), and the Phase 9 sales core reads it with a two-decimal
   fallback (`20261006011000_...sql:126`). Widening only the column would leave five server-side sites
   still rounding to 2. Until that work is done, OMR must be treated as a two-decimal stored value
   even though ISO 4217 gives it three — the display metadata is correct, the storage is not.
3. **Gift-card balances and order totals share a number but may not share a register.**
   Redemption refuses a mismatch (`20261005240000_...sql:506`): a card can only be spent on an order
   whose `currency` equals the card's. The amount applied is then subtracted from `orders.total`, which
   is base rupees, and from the card balance, which is in the card's currency — correct while every
   order is PKR, wrong the moment a foreign-currency order can exist. Flag, do not enable.
4. **`RewardsPanel` restates order figures from the current rate.**
   `src/components/RewardsPanel.tsx:96` defines `money = (value) => formatIn(value, order.currency)`,
   which takes a base amount and divides by today's rate to reach the order's currency — the very
   reconstruction the snapshot exists to prevent. `orders.loyalty_discount` and
   `orders.gift_card_amount` are base rupees, so this coincides with the truth only while every order
   is PKR. Left as-is: deciding whether rewards are shown in the order's money or the session's is a
   product choice, and the panel is reachable from the order confirmation page only.

**Fixed while auditing:** `src/components/AccountRewards.tsx` rendered a gift card's balance with
`format(balance)` — reading the card's own-currency balance as rupees and converting it into whatever
the shopper is browsing in, so a non-PKR card would have been relabelled and rescaled. It now renders
`formatStoredAmount(card.balance, card.currency, locale)` — the stored number with the stored currency,
no conversion. Identical output for the PKR cards that exist today.


