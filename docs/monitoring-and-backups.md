# Monitoring, error handling and backup/recovery

Written during Phase 5 (2026-10-03). Anything marked **not verified** could not be
confirmed from this working copy — it needs the owner's dashboard or an account.

## 1. What is implemented

### Structured logs with correlation ids
Every API surface (`api/send-email.js`, `api/email-worker.js`, `api/ai-chat.js`,
`api/payfast-start.js`, `api/payfast-notify.js`, and the dev server) is wrapped in
`withRequestId` from `api/_config.js`:

- a request id is accepted from `x-request-id` or generated, echoed back as
  `X-Request-Id`, and attached to every log line of that request;
- logs are single JSON lines: `{ at, level, message, requestId, route, method, … }`
  so any log sink can parse them;
- keys matching `secret|key|token|password|passphrase` are replaced with
  `[redacted]`, and email addresses are reduced to `qa***@hmsignature.***` by
  `redactEmail()`. Nothing writes request bodies, order payloads, payment
  references, proof files or provider secrets to a log.

### Business errors vs system failures
`reportFailure()` classifies an exception: expected outcomes (unconfigured service,
permission denied, missing/already-processed record, invalid input, expired
coupon) are **business** and are logged without alarming; everything else is
**system**. System failures are:

- logged with a stable failure id,
- counted in-process for one hour and exposed publicly as a number only on
  `GET /api/health` → `{ status: "OK" | "DEGRADED", recentSystemFailures, failureWindowMinutes, capabilities }`,
- posted, if `ERROR_REPORT_URL` is set, to any JSON webhook with the reduced
  `{ service, environment, failure: { at, route, requestId, message, name, status } }`
  payload — fire-and-forget, 3 s timeout, never blocking the failed request.

Sentry (or an equivalent) is a drop-in replacement for that webhook. It is
**deliberately not a dependency yet**: `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` are
documented in `.env.example` and nothing requires them, because no account exists.
Adding it later means one initialisation call per side — no architectural change.

### Customer-facing messages
Handlers return short, generic sentences. Provider or Postgres detail goes to the
log only; the earlier echoes of raw `provider error` / `userError.message` in the
AI endpoint and staff-creation endpoint are gone.

### Honest capability reporting
`/api/health` answers `capabilities: { email, concierge, payfast, serverDatabase }`
as booleans. The storefront reads it, so checkout copy can promise an email only
when SMTP exists, and the PayFast option is rendered only when merchant
credentials, a settlement currency **and** a conversion rate are configured.
Verified locally: `{ email:false, concierge:false, payfast:false, serverDatabase:false }`
and `POST /api/email-worker` → `503 {configured:false, reason:"server credentials"}`
— no simulated delivery, no simulated payment.

## 2. What to watch once deployed

| Signal | Where | What it means |
| --- | --- | --- |
| `DEGRADED` on `/api/health` | uptime check or browser | a system failure happened in the last hour |
| Vercel function errors / invocations | Project → Functions → Invocations, filter by `X-Request-Id` | crash, timeout, provider unreachable |
| `payment_events` rows with `event_type='rejected'` | admin Payments/Reconciliation | provider notifications that failed a check (amount/currency/merchant) |
| `email_outbox` rows stuck in `pending`/`failed` | admin → Notifications → Outbound Message Queue | SMTP missing, or no scheduler draining the queue |
| `get_duplicate_payment_events()` returning rows | admin → Payments → Reconciliation | the provider recorded one transaction twice (should be impossible: `uniq_payments_provider_reference`) |
| Supabase logs (Auth, Postgres, PostgREST) | Dashboard → Logs | failed sign-ins, RLS denials, slow queries |

Alerting itself (uptime monitor, Vercel alert rules, error-service alerts) is an
**owner action**: it needs an account and a notification channel.

## 3. Backups and recovery

**Verified from here**

- The complete schema lives in `supabase/migrations/` and every file listed by
  `npx supabase migration list --project-ref ttnfdxabfkmqlqssqdep` matches a local
  file (count them there rather than trusting any number written into this doc —
  the set grows every phase). A new database can therefore be rebuilt from the
  repository with `supabase db push`.
- `supabase/schema.sql` exists as a readable reference of the same shape.
- The dangerous legacy path (`public.inventory`, an empty unused table) is
  commented as dead, so a restore cannot accidentally resurrect demo stock data.

**Not verified — the owner must look in the dashboard**

- Whether this project's plan includes automatic daily backups, and how many days
  they are retained (Supabase documents PITR as a paid add-on; the plan and the
  current toggle are not readable from this machine — the CLI has no backup
  subcommand and `supabase db diff` needs Docker, which is not installed here).
- Point-in-time recovery availability, and whether Storage objects (payment
  proofs, product images) are covered by the chosen backup method.
- That a restore has ever been tested. Nobody should claim it until it is done.

**Recovery procedure to rehearse (never against production)**

1. Create a **separate** Supabase project (`hm-signature-recovery`).
2. Restore the most recent backup (or PITR target) into that new project from
   Dashboard → Backups. If no backup exists, run `supabase link --project-ref <new>`
   and `supabase db push` to rebuild the schema, then load a logical dump taken
   from production with `pg_dump` over the session pooler URL (the URL contains a
   password — keep it out of the repository and out of logs).
3. Point a local checkout at it: `VITE_SUPABASE_URL` + publishable key of the new
   project, `APP_URL=http://localhost:5173`.
4. Verify counts and behaviour, not just connectivity:
   `auth.users`, `orders`, `order_items`, `payments`, `refunds`,
   `inventory_transactions`, `product_variants.stock`, `site_settings` keys; then
   run `npm test` with the suite accounts pointed at the restored project, and
   walk checkout and the admin console in a browser.
5. Record the date, the source backup, the person who performed it and the
   outcome. Repeat on a schedule you can commit to (a sensible starting point is
   quarterly).

**Rollback without a restore.** Because every schema change is an additive
migration file, a bad deploy is usually reverted by redeploying the previous
commit; the data stays. Restoring data is only needed for corruption or an
accidental destructive statement — which is exactly why no such statement belongs
in this repository's workflow (see the standing rule against `db reset`).

**Backup responsibilities.** This is a single-owner project: the owner holds the
Supabase and Vercel accounts, so backup configuration, retention choice and the
restore test are owner actions; the code side (migrations as the schema source of
truth, redacted logs, health endpoint) is in the repository and reviewable.
