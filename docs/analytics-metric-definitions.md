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
| Low Stock Warning | Products whose stock is at or below their own low-stock threshold. |
| Revenue Trend (dashboard) | Daily non-cancelled order value over the last 90 days, with the exclusion stated under the chart. |

## Reviews

`/admin/reviews`'s "Average Client Rating" is computed from **approved** reviews only —
the same definition the storefront uses when it prints a rating — and shows `—` when no
approved review exists yet. Pending and rejected submissions never move it.
