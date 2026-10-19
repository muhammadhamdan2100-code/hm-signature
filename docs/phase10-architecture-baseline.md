# Phase 10 — architecture baseline

Recorded 2026-10-13 to close the P10-0 step. This describes the system as it now stands, before
any further Phase 10 work, and states plainly what is deployed versus what is only written down.

## Shape of the application

| layer | what it is |
| --- | --- |
| Runtime | Vite + React 19 + TypeScript single-page app, built to static files and served by Vercel Hobby |
| Serverless | **none, by constraint.** `api/` and `server/` do not exist and must not be reintroduced — the plan allows zero functions |
| Data access | 25 modules under `src/services/`, each a typed wrapper over the Supabase JS client using the **anon** key |
| Authorization | Postgres row-level security plus `SECURITY DEFINER` RPCs; the browser never holds a service-role key |
| Admin console | `src/admin/`, hydrated through `AdminDataContext`, gated by DB-derived staff permissions rather than by a client flag |
| Localisation | six languages (en, fr, es, de, ar, ur) with a dot-path lookup, English fallback and a source-text parity harness |
| Money | integer minor units in `src/lib/money.ts`; display metadata in `src/lib/currencyDisplay.ts` and `src/lib/countries.ts` |
| Quality gates | `tsc -b`, `oxlint src`, `vitest`, production build |

## Where Phase 10 stands

Eight `phase10_*` migrations exist in `supabase/migrations/` out of 98 total. The functional ones —
staff permissions, audit logging, multi-location inventory, fulfilment, shipping adapters, CRM and
accounting, workflows — are applied.

**The security-hardening migration is not.** `20261010120000_phase10_security_hardening.sql` is
written, reviewed and committed, but has never been executed against production: the environment
available to the agent cannot reach the dashboard's query runner, and no database credentials were
supplied. Applying it needs an explicit owner decision.

Until it is applied, the live hole it closes is open and measurable: anonymous reads return rows from
the Phase 10 tables including `locations` and `shipping_providers`, and an anonymous insert into
`audit_log` succeeds. `tests/phase10-security-hardening.test.ts` proves this on every run — its five
failures are the finding, not a broken test. Do not treat that file as flaky and do not silence it.

## Conventions a new contributor must keep

1. **No endpoints.** Anything that must be secret or authoritative is a Postgres function called
   through the existing client, never a route handler.
2. **Money has two registers.** Base rupee figures and per-order currency snapshots are different
   things and must never be printed as each other — see
   [`money-and-currency-displays.md`](money-and-currency-displays.md).
3. **Countries and currencies are configuration, not code.** The static ISO tables in `src/lib/`
   describe what a place is priced in; they say nothing about shipping, checkout or payment support,
   which come from the database.
4. **No live mutations from tests.** Several suites deliberately attempt writes to prove they are
   refused; the ones that can actually create rows are excluded from a normal verification run.
5. **Dictionaries are inserted into, never rewritten.** Duplicate nested groups are valid
   JavaScript and silently discard translations; `scripts/i18n-parity.mjs` is the check that catches it.

## Known open items at the time of writing

- Apply the Phase 10 hardening migration (owner decision; blocked on environment and credentials).
- Four currency rows (CAD, AUD, QAR, OMR) and the matching country corrections are prepared in
  [`db-migrations-pending/`](db-migrations-pending/README.md) and blocked on four owner-supplied rates.
- OMR and the other three-decimal currencies are display-ready but not settlement-ready:
  `orders.total_in_currency` is `numeric(12, 2)` and five server-side sites round to two.
- `payments.provider_currency` does not describe `payments.amount`, which makes the PayFast rail
  unable to accept a genuinely foreign-currency notification.
