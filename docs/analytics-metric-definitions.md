# Analytics metric definitions

Every figure on `/admin/analytics` and on the admin dashboards comes from the single
server-side aggregation `get_admin_analytics(p_days)` (`supabase/migrations/20261002062025_business_intelligence_rpc.sql`,
later revised by the analytics and policy migrations). Nothing on those pages is
sampled, estimated or filled in on the client.

The aggregation is staff-only: `get_admin_analytics` raises for anyone the database does
not consider staff, and `runInsights` returns `501 { configured: false }` before it
reads a single business row when no AI provider is configured.

## Window

| Term | Meaning |
| --- | --- |
| `p_days` | Reporting window in days. The window buttons on the analytics page send 30, 90 or 365. It is applied to **top products**, **top bottle sizes** and **coupon usage**, all measured on `order_items.created_at` / order date. |
| Lifetime panels | Order-status mix, payment mix, cancellations, refunds, inventory alerts, customer growth and the KPI totals are **not** windowed; each of those panels carries its own "all time" label on screen. |
| Revenue trend | Emitted as daily rows for `GREATEST(p_days, 90)` days — a 30-day view still shows 90 days of trend so the chart keeps a usable shape. Weeks between the first and last order with no activity are genuine zeros, never interpolation. |

## Money

| Metric | Definition |
| --- | --- |
| Gross revenue | `SUM(orders.total)` for every order whose status is **not** `Cancelled`. Order totals are the values written by `place_order`, which recomputes line prices, coupon discount and shipping server-side; the client never supplies a total. |
| Cancelled value | `SUM(orders.total)` for orders with status `Cancelled`. Reported separately and **excluded** from every revenue figure, including the trend and the payment-method rollup. |
| Processed refunds | `SUM(refunds.amount)` where `refunds.status = 'processed'`. |
| `processed_on_live_orders` | The same sum restricted to refunds whose order is **not** cancelled. This is the only amount subtracted from gross revenue, because a refund against a cancelled order was never part of gross revenue either. |
| Net revenue | `gross revenue − processed_on_live_orders`. Shown with its arithmetic spelled out on the panel. |
| Pending refunds | `SUM(refunds.amount)` where `status = 'pending'`. Reported, never subtracted. |
| Rejected / failed refunds | Count of rows with status `rejected` or `failed`. |
| Average order value | Gross revenue ÷ number of non-cancelled orders (the SQL `AVG(orders.total)` over the same rows). |
| Units sold | `SUM(order_items.quantity)` across non-cancelled orders. |
| Discount given (coupons) | `SUM(coupon_usage.discount_amount)` per code. Codes with zero redemptions are still returned so an unused promotion is visibly unused. |

## Counts

| Metric | Definition |
| --- | --- |
| Orders | Count of order rows whose status is not `Cancelled`. |
| Customers (KPI) | `COUNT(DISTINCT orders.customer_email)` over all order rows — the number of people who have actually ordered. |
| Customer growth | One row per calendar month of `profiles.created_at` where `role = 'customer'`; months with no signups are absent rather than padded. |
| Order status distribution | Every order row grouped by its current status, including `Cancelled` and `Returned`, so the panel always adds up to the order count. |
| Payment method distribution | Non-cancelled orders grouped by `payment_method`, valued at `orders.total`. |
| Payment status distribution | Rows of the `payments` table grouped by status — one row per recorded payment, so it can legitimately include a paid record belonging to a cancelled order. |
| Top products / top sizes | Windowed by `order_items.created_at`, ranked by line revenue / units, capped server-side. |
| Inventory alerts | Current state of every variant: `stock = 0` (out of stock), `0 < stock <= low_stock_threshold` (low stock), `active = false` (inactive). A snapshot, not a history. |

## Dashboard tiles that are not from the aggregation

| Tile | Definition |
| --- | --- |
| Total Revenue (executive dashboard) | Same rule as gross revenue: `orders.total` summed over non-cancelled orders, read from the order rows the page already has. |
| Today's Revenue | Sum of `orders.total` for orders created today **in the viewer's local calendar day** (not UTC) whose status is not `Cancelled`. The subtitle states how many orders were received today and how many of those were cancelled, so the excluded ones are visible rather than silently priced in. |
| Delivered Rate | Delivered orders ÷ all order rows, with both numbers shown. |

---

# Phase 9 — business intelligence

Phase 9 reports do **not** read `get_admin_analytics`. They read one shared core,
`analytics_orders()` / `analytics_order_lines()`
(`supabase/migrations/20261006011000_phase9_sales_core_cohort_clv_repeat_rate.sql`),
so that a cohort, a customer's lifetime value and a sales report cannot disagree
about what was sold. The older aggregation stays in place for the pages already
built on it.

## What counts as a purchase

| Term | Definition |
| --- | --- |
| Purchase | An order whose status is **not** `Cancelled` or `Returned` **and** whose `payment_status` is `Paid` or `Verified`. Every Phase 9 metric uses this and only this. |
| Delivered | `orders.status = 'Delivered'`, reported separately from "purchase" so a settled payment that has not been delivered is not counted as a completed journey. |
| Net revenue per order | `orders.total` less `SUM(refunds.amount)` where the refund is `processed`. The refund sum is taken from the `refunds` table, never from the order row. |
| `is_purchase` | The flag the core returns per order, so a reader can show both "orders placed" and "purchases" without recomputing the rule. |

An order that was paid for and then cancelled is therefore excluded from every
Phase 9 figure. On the live project today exactly one order exists and it is in
that state, which is why the customer metrics report `insufficient_data`.

## Money and currency

Amounts are stored in the base currency (`currencies.is_base`, PKR) with a
per-order snapshot: `currency`, `currency_rate_to_base`, `total_in_currency`.

* Asking for a currency converts by `public.analytics_rate(code)` — base units
  per one unit of that currency. Rates are the house's own manual configuration.
* An order already placed **in** the requested currency keeps its stored
  `total_in_currency`, so a later rate change cannot rewrite a past order.
* Anything else converts at the rate configured today, and the core returns
  `converted_at_configured_rate = true` so a reader can label that number as
  calculated rather than recorded.
* An unknown or disabled currency code falls back to the base currency instead of
  guessing a rate.

## Report scopes

`public.can_see_report(kind)` is checked inside every Phase 9 function, so the
database — not the navigation — decides:

| Scope | Role | Sees |
| --- | --- | --- |
| `business` | Super Admin, Manager | Cohorts, lifetime value, repeat rate, funnel, attribution, segments, sales and customer reports |
| `operational` | Super Admin, Manager, Order Manager | Payment and inventory reports, stock cover |
| `content` | Super Admin, Manager, Content Manager | Product profitability and the products report, **with `customer_id` and `customer_email` nulled by the core itself** |

Provider references, payment identifiers, proof links and card data appear in no
Phase 9 payload or export; the payment report is a summary grouped by method and
currency.

## Statuses a reader must render

Every payload carries `data_status`, and one of these is not the same as another:

| Status | Meaning |
| --- | --- |
| `actual` | Read from stored rows. |
| `calculated` | Arithmetic over stored rows — e.g. an order-level discount shared across basket lines by value. |
| `forecast` | Projected forward. Never drawn as if it were history. |
| `insufficient_data` | The dataset is too small to answer. Not a zero. |
| `not_tracked` | The measurement did not exist for the period asked about. Not a zero. |
| `not_configured` | An input the house has not supplied, e.g. product cost. Not a zero. |
| `configuration_pending` | A rule the shop still owns, e.g. VIP tier thresholds. |

## Funnel and attribution

`analytics_events` (`20261006010000_…`) collects `visit`, `product_view`,
`add_to_cart`, `begin_checkout`, `payment_started`, `payment_completed` and
`order_completed` **from that deployment onward**. A stage that was never captured
returns `sessions: null`, and a step percentage is computed only when the stage in
front of it was also measured. `capture_started_at` states the first recorded
event. Nothing is extrapolated backwards.

Attribution reads first or last touch from the visit log, joins revenue through
`order_completed.order_id` into the same purchase rule, and publishes
`purchases_in_window` against `attributed_purchases` so the unattributed share is
visible. Coupon codes are the one channel provable from history, since
`orders.coupon_code` was always stored.

Collected per event: a random per-browser id, a random per-tab id, a path, the
`utm_*` parameters already in the URL, the referring **host**, and optional
currency/country. Never collected: IP address, user agent, full referrer, query
string, or anything the shopper typed. `customer_id` is taken from the JWT, and an
`order_id` is honoured only when the caller owns that order.

## Forecasting

| Report | Guards |
| --- | --- |
| Product profitability | Revenue, units, discount share and refund share always. `unit_cost`, `gross_profit` and `gross_margin` are `null` unless `product_variant_costs` holds a real cost — an uncosted size is never treated as free stock. |
| Inventory forecast | Velocity = window purchases ÷ window days. A size with no purchase in the window reports `no_recorded_demand` instead of an infinite or zero days-of-cover. Lead time is supplied by the viewer and echoed back. |
| Demand forecast | Needs **8 completed paid purchases across 6 different ISO weeks**. Below that it returns `insufficient_historical_data` with `purchases_found` against `purchases_required` and an empty product list. Above it, the forecast is a trailing weekly mean ± one standard deviation of the observed weeks, labelled `forecast`. |
| Seasonality | Never applied: it needs the same period of two previous years. Reported as `insufficient_data` with that reason. |

The thresholds are method parameters of this code, not business rules of the
house; they are returned in the payload so the reason a forecast is missing is
legible.

## Exports

`CSV` and `XLSX` are generated in the browser from the rows already authorised
(`src/lib/reportExport.ts`): the exported columns are the payload's own column
list, so a file cannot contain a field the screen never showed. Text beginning
with `=`, `+`, `-` or `@` is prefixed so a spreadsheet cannot execute it, and the
CSV is written with a byte-order mark so Excel reads Arabic and Urdu correctly.
PDF is produced through the browser's own print of the report panel; no
server-side PDF renderer was added. The print stylesheet opens every scroll box
inside `.admin-print-sheet` and lets cells wrap, because a clipped table would
otherwise print the first columns of a report and silently drop the rest.

## Measured cost

Each intelligence window was timed over REST as a signed-in manager with three
samples per call (October 2026, one real order, 24 variants, six products):
every report answered in 213–252 ms median, the first call of a session taking
up to 2.8 s while the connection warms. `get_phase9_segments` is the slowest at
252 ms against 217 ms for the raw order core — about 35 ms for eleven
sub-selects over that core. That is far below anything worth restructuring, so
the segmentation query still calls the core once per segment. If the order book
grows enough for that to show, the fix is one materialised CTE of buyer
purchases rather than a second definition of a sale.

| Low Stock Warning | Products whose stock is at or below their own low-stock threshold. |
| Revenue Trend (dashboard) | Daily non-cancelled order value over the last 90 days, with the exclusion stated under the chart. |

## Reviews

`/admin/reviews`'s "Average Client Rating" is computed from **approved** reviews only —
the same definition the storefront uses when it prints a rating — and shows `—` when no
approved review exists yet. Pending and rejected submissions never move it.
