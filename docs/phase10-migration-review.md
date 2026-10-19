> ## APPLIED — 2026-10-19, live project `ttnfdxabfkmqlqssqdep`
>
> All three security files were run through the owner’s dashboard SQL editor and verified from
> outside with the public anon key: anon DELETE now returns **401** on every probed table
> (products, site_settings, coupons, orders, audit_log, locations), `GET /coupons` is **401**,
> `checkout_coupon("WELCOME10")` returns the row and an unknown code returns `[]`, RLS is enabled
> on the 31 Phase 10 tables, the `audit_log` append-only trigger is installed, and the four
> inventory `CHECK` constraints exist. `tests/phase10-security-hardening.test.ts` passes **35/35**
> and the full suite is **3662 passed / 0 failed**. The two privilege files moved to
> `supabase/migrations/` with an `APPLIED` header.
>
> **Not applied from this file:** the three rewritten RPC bodies (`adjust_location_stock`,
> `reserve_order_stock`, `release_reservation`). `adjust_location_stock` still ends in
> `500 invalid transaction termination`; no file under `src/` calls any of the three, so it is a
> latent bug, not an open hole.
>
> **Closed after that first pass:** functions reach `anon` through the **default `PUBLIC` execute
> grant** as well as explicit ones, so `proacl LIKE '%anon=X%'` undercounts — `has_function_privilege()`
> is the only honest predicate. Twelve warehouse / fulfilment / audit RPCs were still enterable by a
> visitor for that reason. `20261019200000_anon_function_execute_lockdown.sql` revokes them from
> `PUBLIC, anon` and re-grants to `authenticated, service_role`; applied and verified (401 at REST,
> `still-anon-executable=NONE` in the catalog), with a standing test block in
> `phase10-security-hardening.test.ts`. Every public route was re-swept afterwards: 0 failed
> requests, 0 console errors.

# Phase 10 hardening + currency migrations — review before any execution

Reviewed 2026-10-19 against the repository and the live project, **read-only**. Nothing in this
document has been executed. Each claim names the check that produced it.

## 1. Target environment and current state

| question | answer | how it was established |
| --- | --- | --- |
| Are the Phase 10 tables present? | **Yes** | anon `GET /rest/v1/locations` → HTTP 200 with 1 row; `shipping_providers` → HTTP 200 with 1 row |
| Is `20261010120000_phase10_security_hardening.sql` applied? | **No** | the same anon `GET`s returned **200**. Once RLS is enabled and grants are revoked, anon must receive 401/403 or an empty set. Every one of the 32 tables probed answered 200 |
| Is `audit_log` writable by anon today? | **Not re-tested** | an INSERT probe would mutate production. The migration header records it as verified on 2026-10-10; this review relies on the read evidence above, which already proves RLS is off |
| Is `audit_log` leaking rows? | No rows exist | anon count = 0. The exposure is structural, not yet populated |
| Are the four currencies present? | **No** | `currencies` returns exactly 6 rows: PKR 1, USD 278.5, AED 75.8, SAR 74.3, GBP 355, EUR 302 — all enabled |
| Do the destination rows name the right money? | **4 do not** | `CA→USD`, `AU→USD`, `QA→SAR`, `OM→SAR`; only `PK` is `enabled` |

The live exposure is therefore real but currently shallow: the schema is unlocked, `locations` and
`shipping_providers` hold one row each, and the ledger is empty. That argues for applying the
hardening **before** Phase 10 features are used, not after.

## 2. What the hardening migration changes

`BEGIN … COMMIT` as one transaction: 32 × `ENABLE ROW LEVEL SECURITY` + 32 × `REVOKE ALL FROM anon,
authenticated`, one guard trigger on `audit_log`, three `CHECK` constraints, and three
`SECURITY DEFINER` inventory functions replaced.

### Preconditions — verified, not assumed

| precondition | status | evidence |
| --- | --- | --- |
| No client reads these tables directly (so `REVOKE` cannot break the app) | **Verified** | grep for `.from("<table>")` across `src/` for all 32 names → **0 matches**. The only inventory calls are `rpc("adjust_inventory_stock")`, which is a function, not a table read |
| `location_stock`, `stock_reservations`, `stock_movements` are empty, so the new `CHECK`s cannot fail on existing rows | **Verified** | anon counts: 0, 0, 0 |
| `has_permission(text)` single-argument overload exists (used by all three functions) | **Verified** | defined in `20261007100000_phase10_staff_permissions.sql:60`, pinned `search_path`, owner `postgres` |
| `get_location_stock(uuid, uuid)` exists (called by `adjust_location_stock`) | **Verified** | defined in `20261007120000_phase10_multi_location_inventory.sql:384` |
| `ON CONFLICT (location_id, product_variant_id)` has a matching unique index | **Verified** | `location_stock` declares `PRIMARY KEY (location_id, product_variant_id)` |
| Functions have `search_path` pinned | **Verified** | `ALTER FUNCTION … SET search_path = public, pg_temp` for all three; the trigger functions declare `SET search_path` inline |
| Re-runnable | **Verified by reading** | `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS`, `to_regclass` guards, and `pg_constraint` checks before each `ADD CONSTRAINT` |

**A probe that proves nothing, recorded so nobody re-reads it as evidence:** calling
`POST /rest/v1/rpc/<name>` with `{}` returned 404 for all six functions including
`has_permission`, which certainly exists. PostgREST reports "no function matches that parameter
signature", so that result says nothing about existence. Existence was established from the
migration files above.

## 3. Risks and residual gaps

1. **RLS is enabled, not `FORCED`.** The table owner bypasses RLS, which is exactly why the
   `SECURITY DEFINER` functions keep working — they run as the owner. The cost: any future
   `SECURITY DEFINER` function owned by `postgres` is outside RLS entirely. The independent
   `REVOKE` is what stops `anon`/`authenticated`, and it is the layer that actually closes the hole.
2. **`audit_log` immutability is role-based, not user-based.** The guard allows
   `current_user in ('postgres','service_role')`. Inside a `SECURITY DEFINER` function
   `current_user` is the owner, so any owner-defined function can update or delete the ledger.
   Acceptable for the current design; the fix if it ever matters is to compare `auth.uid()` against
   a maintenance allow-list instead of the role.
3. **`location_stock_reserved_within_available` is a behavior change, not just a guard.** After it
   exists, `adjust_location_stock` reducing `available` below a live `reserved` will fail where it
   previously succeeded. That is the intended no-oversell invariant, but staff will see a new error
   on shrink-while-reserved operations.
4. **`adjust_location_stock` is created, not repaired.** No earlier migration defines it, so the
   header's "old body issued `commit;`" describes a live function created outside the migration
   history. `CREATE OR REPLACE` covers both cases, but it means the pre-change body cannot be
   diffed from the repository.
5. **The client's actual stock path is `adjust_inventory_stock(uuid,integer,text,text)`**
   (`src/services/adminCatalog.ts:432,449,720`), granted only to `authenticated`
   (`20261002123900`). The hardening migration does not touch it. Its `adminCatalog` fallback
   writes `product_variants.stock` and `inventory_transactions` directly when the RPC is
   unavailable — that path is unaffected by this migration and remains a second writer.
6. **Lock ordering.** `reserve_order_stock` takes the `location_stock` row lock; `release_reservation`
   takes the reservation lock then the stock lock. Both end at `location_stock FOR UPDATE`, and the
   reservation read in `reserve_order_stock` is not a locking read, so a deadlock is not expected —
   worth a concurrency test rather than an argument (see §6).

## 4. The two currency migrations

`20261013120000` (literal rates) and `20261013180000` (USD anchor + derivation trigger) both insert
the same four rows. **Run one, not both.** Neither has been executed anywhere; there is no local
Postgres in this environment and no database credential, so the SQL has been read, not run.

Checked by reading: statement order and the temp-table dependency (steps 1→3→4 need one session);
the guard rejecting blank/unparsable/non-positive/exactly-1 rates; the `180000` step-4b proof that
aborts if a derived row still holds the placeholder; `on conflict (code)` so a re-run cannot create
duplicates; symbols matching `src/lib/currencyDisplay.ts`; `rate_to_usd` left NULL on the six
existing rows so their behaviour is untouched; the propagation trigger's `is distinct from` test
that makes it a no-op when nothing changed.

Not verified, and cannot be here: real `plpgsql` execution, trigger firing order under concurrency,
and the `numeric(18,6)` rounding of `round(anchor × factor, 6)`.

## 5. Exact action for the owner

Nothing here is inferred on your behalf. Each step is a separate, explicit approval.

```bash
# 0. Back up first — Supabase dashboard → Database → Backups (PITR), or:
pg_dump "$DATABASE_URL" > pre-phase10-hardening.dump

# 1. Apply the hardening (needs the postgres/service credential, not the anon key):
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261010120000_phase10_security_hardening.sql
#    or, if the local CLI is linked and you want the history recorded:
supabase db push

# 2. Then ONE currency migration:
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f docs/db-migrations-pending/20261013180000_derive_currency_rates_from_usd_anchor.sql
```

### Verification after step 1 — must change from today's readings

```sql
select relname, relrowsecurity from pg_class
 where relname in ('locations','audit_log','staff_permissions','shipping_providers') order by relname;
-- expect relrowsecurity = true for all four (today: false)

select grantee, privilege_type from information_schema.role_table_grants
 where table_name = 'locations' and grantee in ('anon','authenticated');
-- expect zero rows (today: select/insert/update/delete)

select has_table_privilege('anon','locations','select');
-- expect false (today: true)
```

Then from a terminal, no credential needed:

```bash
curl -s -o /dev/null -w '%{http_code}\n' "$SUPABASE_URL/rest/v1/locations?select=id&limit=1" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY"
# expect 401 or 403 — today it is 200
```

### Verification after step 2

Run the file's own steps 8a–8f. Minimum: four rows exist with `rate_to_usd` set and
`rate_to_base = 278.5 × factor`; the six seeded rows still have `rate_to_usd` NULL; and step 8d
shows all four moving when USD moves, then returning.

### Rollback

`20261010120000` has **no rollback section** — that is a real gap, recorded here rather than
silently fixed. To undo it you must explicitly re-grant and disable RLS per table:

```sql
-- do this only from a backup-verified session
DO $$
declare t text;
begin
  foreach t in array array['staff_permissions','audit_log','audit_events','locations','warehouse_bins',
    'location_stock','stock_movements','stock_transfers','transfer_items','stock_adjustments','stock_reservations',
    'fulfillments','fulfillment_lines','pick_lists','pick_list_items','packing_slips','backorders','returns',
    'return_items','return_authorizations','shipping_providers','shipping_rates','shipments',
    'shipment_tracking_events','webhook_handlers','crm_customers','crm_events','accounting_invoices',
    'accounting_payments','accounting_refunds','workflow_events'] loop
    if to_regclass('public.'||t) is not null then
      execute format('alter table public.%I disable row level security', t);
      execute format('grant select,insert,update,delete on public.%I to anon, authenticated', t);
    end if;
  end loop;
end $$;
drop trigger if exists trg_audit_log_immutable on public.audit_log;
drop function if exists public.guard_audit_log_immutable();
-- the three CHECK constraints and the replaced functions are not reverted by the above
```

Restoring the replaced function bodies is **not** possible from the repository, because
`adjust_location_stock` never existed in a migration (§3.4). That is the strongest argument for the
backup in step 0. `20261013180000` does have a complete rollback (step 9).

## 6. Tests still required, and why they are not in this repository

These need a database the tests can write to. None of them can be run against production, and none
are faked here:

- anon/authenticated denial on all 32 tables (positive control: the same call succeeds today).
- `audit_log` rejects UPDATE and DELETE for `authenticated`, accepts INSERT.
- Two concurrent `reserve_order_stock` calls for the last unit — exactly one succeeds.
- `release_reservation` called twice — the second is a no-op, `reserved` decrements once.
- `adjust_location_stock` shrinking below `reserved` — fails on the new CHECK.
- Trigger propagation: move USD, assert every `rate_to_usd` row restates, and assert a NULL-factor
  row is untouched.
- A restore into an isolated database, then re-run the currency matrix.

The client-side half of the same guarantees **is** covered here: `tests/phase10-authorization-rls.test.ts`,
`tests/currency-matrix.test.ts`, `tests/currency-selector-offer.test.ts` and
`tests/admin-order-currency.test.ts`.
