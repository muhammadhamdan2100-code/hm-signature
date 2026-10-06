# HM Signature — production deployment, domain and configuration

Written 2026-10-03 during Phase 5. Nothing in this file has been deployed: this
working copy is not linked to a Vercel project, the Vercel CLI is not installed
here, and no deployment was performed or verified from this machine. Treat every
"deploy" step below as an owner action until it is done in your own account.

## 1. What this application is

| Piece | Where it runs | Notes |
| --- | --- | --- |
| Storefront + admin console | Static SPA (`dist/`) built by Vite | One codebase; `/admin/*` is guarded in the client **and** by Postgres RLS |
| API | Vercel serverless functions in `api/` (`ai-chat`, `send-email`, plus the outbox/payment workers) | `server/index.js` is the local dev proxy on port 3001 only — it is not the production server |
| Data + auth + storage | Supabase project `ttnfdxabfkmqlqssqdep` (region: Northeast Asia, Tokyo) | Row-level security decides authorisation; the browser never holds a service-role key |
| Authoritative money/stock maths | Postgres (`place_order`, `verify_payment`, `record_refund`, …) | The client sends intent only (variant ids, quantities, coupon code) |

Routing is a SPA catch-all (`vercel.json` → `/(.*)` → `/index.html`) with `api/`
functions taking precedence, so deep links such as `/product/mystic-oud` and
`/account/orders` work on refresh.

## 2. Build and run

```bash
npm ci
npx tsc -b          # types
npm run lint        # oxlint (0 errors expected; warnings are non-blocking)
npm run build       # tsc -b && vite build → dist/
npm test            # permanent suites; Supabase-backed suites skip without suite accounts
node server/index.js  # local API on :3001 (dev only)
npx vite            # local app on :5173, proxies /api to :3001
```

Vercel configuration (`vercel.json`): `buildCommand: npm run build`,
`outputDirectory: dist`, `framework: vite`, plus the security-header block. The
same headers are applied by the Vite dev/preview middleware so a policy mistake
shows up locally, not in production.

### Security headers now sent

`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
(camera/mic/geolocation/payment/usb/interest-cohort all disabled),
`Strict-Transport-Security: max-age=15552000; includeSubDomains`,
`Cross-Origin-Opener-Policy: same-origin`, and `Cache-Control: public, max-age=31536000, immutable`
for hashed `/assets/*`.

The CSP allows: scripts from this origin only, `styles` from this origin, inline
style attributes (the design system uses them) and `fonts.googleapis.com`,
fonts from `fonts.gstatic.com`, images from this origin/`data:`/`https:`, and
`connect-src` to `*.supabase.co` (REST, Auth, realtime over `wss:`) plus the
PayFast hosts. Verified in a browser against the production bundle: no console
violations, Cormorant Garamond/Inter load, storefront data loads.

If you add another third-party script or endpoint, its host must be added to
`connect-src`/`script-src` in `vercel.json` — that single file is also what the
local middleware reads.

## 3. Environment variables

See `.env.example` for the full inventory with comments. Rules:

- Anything secret must **not** be prefixed `VITE_` (Vite inlines `VITE_*` into the browser bundle).
- Client needs only `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (or the legacy anon key).
- Optional services are optional: with no SMTP, no AI key and no PayFast
  credentials the app still builds, boots and sells through the manual payment
  methods; the corresponding endpoints answer `501/503 {configured:false}` and the
  UI says so plainly instead of pretending.
- `APP_URL` must be the public HTTPS origin once a domain is attached — emailed
  links, provider callbacks and signature `return_url`s are built from it because a
  serverless function has no `window.location`.

Set these in the Vercel project (Project → Settings → Environment Variables) for
Production, Preview and Development as relevant, and in the Supabase dashboard for
Auth/SMTP under Project Settings → Authentication.

## 4. Domain, DNS and SSL — owner actions

Not performed here: this machine holds no domain-registrar or Vercel credentials.

1. Add the domain in Vercel (Project → Settings → Domains). Vercel issues a
   Let's Encrypt certificate automatically once DNS validates.
2. DNS records (adjust the host to your registrar; `@` = apex, `www` = alias):

   | Type | Name | Value | Notes |
   | --- | --- | --- | --- |
   | A | `@` | `76.76.21.21` | Vercel apex IP |
   | CNAME | `www` | `cname.vercel-dns.com` | Remove any legacy CNAME/A record first |

   Prefer the exact values Vercel shows you for the project — they occasionally
   change, and Vercel's own UI is authoritative.
3. Redirect `www ⇄ apex` to one canonical host (Vercel does this when both are added).
4. HTTPS: verify `https://your-domain` returns `200` and that the
   `Strict-Transport-Security` header survives the CDN.
5. Supabase → Project Settings → Authentication → URL Configuration:
   - **Site URL** = `https://your-domain`
   - **Redirect URLs** = add `https://your-domain/**` (and the preview URL pattern if you use it)
   - Without both, email verification and password-reset links bounce to the old
     host and logins appear to "do nothing".
6. `APP_URL=https://your-domain` and `CORS_ORIGIN=https://your-domain,https://www.your-domain` in Vercel.
7. Secure cookies: Supabase Auth issues its own cookies server-side; nothing in
   this app sets a cookie, so `Secure`/`SameSite` are handled by Supabase defaults.
   Verified: `mailer_autoconfirm = false` on this project, so signup requires an
   email confirmation click — meaning the **Auth SMTP sender must be configured**
   (Supabase → Authentication → SMTP) with a real provider and a sender address on
   your own domain, otherwise confirmation and reset mails are rate-limited and
   likely quarantined.
8. SPF/DKIM/DMARC for the mailing domain (whatever provider you configure) —
   required for transactional deliverability; not something the app can do.

## 5. Payments

- Live, working methods today: Cash on Delivery, JazzCash, Raast, Bank Transfer —
  all manual: the customer transfers/pays, uploads or states a reference, and staff
  verify server-side (`verify_payment`), which is what moves the order forward.
- PayFast is integrated provider-ready but **disabled until credentials exist**
  (`PAYFAST_MERCHANT_ID`/`PAYFAST_STORE_ID`/`PAYFAST_MERCHANT_KEY`,
  `PAYFAST_PASSPHRASE`, `PAYFAST_SANDBOX=true`). With those unset, checkout simply
  does not show the option; nothing is faked.
- Amounts and stock are never taken from the browser: `place_order` recomputes
  everything, and the PayFast ITN handler re-verifies signature, amount, currency,
  merchant identity and order reference before any status changes.
- The earlier dead Stripe code paths (client-priced `/api/create-checkout-session`,
  dummy `sk_test_*`/`whsec_*` fallbacks, unimported `src/utils/stripe.ts`) have been
  removed so no unauthenticated, browser-priced payment route exists. The
  `@stripe/stripe-js` / `stripe` npm packages remain in `package.json` but nothing
  imports them; removing the packages is a dependency change left for you.
- ⚠️ The bank/wallet destinations in `site_settings.payment_config` and
  `src/services/storeConfig.ts` (Meezan IBAN, account numbers, titles) are
  unconfirmed scaffolding values shown to customers at checkout. Confirm or replace
  them before taking bank-transfer orders.

## 6. Email

Two separate paths, deliberately not merged:

1. **Supabase Auth mail** — welcome/verification/password-reset. Configured in the
   Supabase dashboard (SMTP + sender). The app cannot send these.
2. **Transactional order mail** — order confirmation, payment confirmation,
   processing, shipped, delivered, cancelled, refund, admin notice. Written by
   Postgres triggers into `email_outbox`, drained by the `api/email-worker`
   function. Sending is server-side only, recipients are validated against the
   order's own address or the staff inbox, sends are deduplicated by a unique key
   per (event, subject), retried with backoff, and failures are logged without
   secret material.

Nothing has been sent: no SMTP credentials exist in this environment
(`GET /api/health` → `capabilities.email = false`), so the worker answers
`503 {configured:false}` — no delivery is ever claimed.

The worker needs a scheduler to actually run on time. See
`docs/monitoring-and-backups.md` §"Scheduling" for what must be enabled
(Supabase `pg_cron` + a scheduled function, or a Vercel Cron entry) — until then
the pipeline is implemented and tested but **not live**.

## 7. Marketing, transactional and follow-up automation

Three separate things, deliberately kept apart:

| Kind | Written by | Sent by | Consent needed |
| --- | --- | --- | --- |
| Transactional (order confirmation, receipt, shipping, delivery, refund) | `email_outbox` triggers on the real event | `/api/email-worker`, or the customer's own session right after checkout | no — it is part of the purchase |
| Follow-up automation (abandoned bag, review request, delivery check-in) | `follow_up_tasks`, created by `/api/automation-worker` scans | the same worker, after the sweep | yes for the abandoned-bag reminder |
| Promotional campaigns (`marketing_campaigns`) | nothing | nothing | not implemented — no bulk send path exists |

`marketing_campaigns` rows remain recorded intentions. No code reads them into a send
queue, so a campaign cannot go out by accident. Bulk promotional sending still needs
explicit owner approval plus a real recipient-selection mechanism.

### How consent is captured and enforced

- `customer_communication_preferences` holds one row per account, created by a trigger
  when the profile appears, defaulting to `marketing_emails = false`.
- The customer changes it in **Account → Email preferences** (`/account#communication-preferences`),
  which is also where the "manage your email preferences" link in every follow-up message lands.
  Row-level security limits reads and writes to the owner.
- Enforcement is in the database, not the UI: `queue_abandoned_cart_followups` only
  selects customers with `marketing_emails = true`, and `run_due_followups` re-checks
  consent at delivery time and marks the task `skipped: no marketing consent`.
  Turning consent off takes effect immediately, even for an already-queued task.
- `order_updates` is recorded but not a switch the customer is offered: order, payment
  and delivery messages are part of the purchase.

### Duplicate prevention

- A task is keyed (`abandoned_cart:<cart id>`, `review_request:<order number>`, …) with a
  unique constraint, and `email_outbox` is keyed by event, so a repeated scan inserts nothing.
- An abandoned bag records `reminder_sent_at` at the moment its reminder is queued; a bag
  that was recovered, emptied or already reminded is skipped.
- `automation_workflows.max_per_customer` caps reminders per customer (default 1).
- The post-delivery workflows reuse the event key the delivery trigger already used, so
  they can only fill a gap — never send the same message twice.
- `run_due_followups` claims rows with `FOR UPDATE … SKIP LOCKED`, so two overlapping
  scheduler invocations cannot both process the same task.

### The scheduler — what is configured and what is not

`vercel.json` now contains:

```json
"crons": [{ "path": "/api/automation-worker", "schedule": "20 4 * * *" }]
```

That is a daily run at 04:20 UTC. Verify before believing it:

1. `CRON_SECRET` (or `EMAIL_WORKER_SECRET`) must be set in the Vercel project, or the
   endpoint answers `401` and nothing runs.
2. `SUPABASE_SERVICE_ROLE_KEY` must be set, or the endpoint answers `503`.
3. `vercel cron` (Vercel CLI, linked project) or the Vercel project's Cron Jobs screen
   must show the job. On a **Hobby** plan Vercel allows at most one run per day per job;
   a **Pro** plan can use `*/15 * * * *` for near-real-time delivery.
4. Supabase `pg_cron` is **not** installed on this project (checked: no `cron` schema),
   so no database-side schedule exists. Do not add one as well as the Vercel job —
   two schedulers double-invoke; the locks above make that harmless, but pick one.

Until 1–3 are confirmed, follow-ups are queued and visible in
**Admin → Automations** but nothing is delivered on a timer. The page reports each of the
three requirements separately (`serverDatabase`, `email`, `automations`) so the gap is
explicit. The storefront's own checkout mail does not wait for the schedule: a signed-in
customer's session drains their own queued messages immediately.

### Verifying the automation rules

End-to-end rules need the service role, so they live outside the vitest suite:

```
npx supabase db query --linked --project-ref <ref> --output-format json \
  -f tests/sql/phase6-automation-rules.sql
```

It creates throwaway rows for the QA accounts only, prints one line per rule, and
restores the shipped posture (all workflows disabled, consent off, ledgers empty).
The session-level security rules — staff-only board and segments, customer-refused
toggles, and the fact that no browser can trigger a sweep — are covered permanently by
`tests/phase6-automations-and-segments.test.ts`.

## 8. Monitoring, backups, recovery

See `docs/monitoring-and-backups.md`.

## 9. Deploy checklist (owner)

1. Push the branch to GitHub after reviewing the diff (nothing has been committed
   or pushed by the agent).
2. Import the repo into Vercel; framework auto-detected (Vite); build command
   `npm run build`, output `dist`.
3. Add environment variables (Production + Preview): `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY`, `APP_URL`, `CORS_ORIGIN`,
   `STORE_CONTACT_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, `EMAIL_WORKER_SECRET`,
   `SMTP_*`, optional `AI_PROVIDER_API_KEY`, optional `PAYFAST_*`, optional DSNs.
4. Attach the domain, finish §4, update Supabase URL Configuration.
5. Confirm migrations are all applied (`npx supabase migration list --project-ref ttnfdxabfkmqlqssqdep`)
   before pointing traffic at the new build.
6. Smoke test on the live URL: browse → add to bag → checkout as a signed-in test
   customer → order appears in admin → staff verifies payment → tracking saved →
   customer sees the update. Then check the admin console, analytics, CMS, reviews.
7. Keep `PAYFAST_SANDBOX=true` and place a sandbox order before any live
   credential is used.
8. Confirm the cron job Vercel registered for `/api/automation-worker` (§7) and decide
   the cadence for your plan. Leave every workflow disabled until the owner enables one
   deliberately from **Admin → Automations**.

---

## 10. Phase 7 — international commerce configuration

Everything below is configuration, not code. Nothing in this section is a live external
integration: no exchange-rate provider, no international payment gateway and no carrier API
is connected, and the interface says so where the shopper can see it.

**Canonical origin — required before launch**

`VITE_SITE_URL` (see `.env.example`) is the origin the browser advertises in `canonical`,
`og:url`, `twitter:image` and the per-language `hreflang` alternates. Set it to the production
domain. If it is empty the code falls back to `window.location.origin`, which means a preview
deployment would canonicalise itself.

`/robots.txt` and `/sitemap.xml` are served by `api/robots.js` and `api/sitemap.js` through the
two rewrites added at the top of `vercel.json` (they must stay ahead of the single-page fallback;
`tests/deploy-config.test.ts` asserts that order). Any non-production Vercel host is answered with
`Disallow: /` so staging is never indexed twice. The product list in the sitemap is read from the
live catalogue through the same public policies a visitor uses.

**Currencies — Admin → International**

The `currencies` table holds the six offered codes with `rate_source = 'manual'`. Those rates are
the atelier's own figures and are labelled as such in the header selector and at checkout. To take
them live later, either keep editing them here or connect a provider that writes
`rate_to_base` / `rate_updated_at` and sets `rate_source = 'provider'`; no storefront code changes
are needed because every price flows through `src/lib/money.ts`.

Base currency stays PKR. An order stores `currency`, `currency_rate_to_base` and
`total_in_currency` as a snapshot: changing a rate afterwards cannot alter a past order, and the
display currency is never what the order is settled in.

**Countries — Admin → International**

Only Pakistan is enabled, with the rule the store already used (fee 250, complimentary from 10 000,
2–3 business days). The other eleven destinations are seeded closed with no fee, so they show as
"delivery unavailable" rather than being priced from invented numbers.

Opening a country means setting its shipping fee and currency — the database refuses to enable one
without both. Delivery window, free threshold, method, notes, restrictions and a tax rate are
per-country configuration. Tax is disabled everywhere; the rate a country is given is business
configuration, is applied to goods plus shipping, and is never presented as tax-law advice.

**Payments**

Existing Pakistani methods (Cash on Delivery, JazzCash, Raast, direct bank transfer) are unchanged
and remain the only selectable ones. "International payment methods coming soon" is informational:
nothing there is selectable and no fake success or failure flow exists. For a destination whose
currency is not PKR the checkout deliberately offers no method and points to the concierge, because
cash on delivery and local wallet transfers cannot settle an order abroad.

**Languages**

`languages` carries six enabled rows: en (default), ar and ur (right-to-left), fr, es and de
(left-to-right). Selecting Arabic or Urdu sets `dir="rtl"` on the document, which is what moves
forms, flow and browser widgets — not a CSS reversal. A further language needs a dictionary file
in `src/i18n/dictionaries/` as well as a `languages` row, the `BUILT_IN_LANGUAGES` entry, the
sitemap language list and the SEO language list; `tests/i18n-dictionaries.test.ts` fails if a
language is offered without a dictionary or if any language drops a key, and
`tests/international-seo.test.ts` fails if those lists drift apart.

---

## 11. Multilingual content (Phase 7 continued)

**Interface strings** live in `src/i18n/dictionaries/{en,ar,fr,es,ur,de}.ts`. English is the
source: every other file must carry the identical leaf-key set, which
`tests/i18n-dictionaries.test.ts` enforces along with placeholder parity, so a key cannot be
added in English alone. A missing string falls back to English and then to a readable
humanized label — the raw key is never rendered, asserted in `tests/localization.test.ts`.
The humanized label is a safety net, not a translation: a parity failure is a build failure.

**Direction** comes from the `languages` table: Arabic and Urdu are `rtl`; English, French,
Spanish and German are `ltr`. The provider sets `<html lang>` and `<html dir>`, and layout uses
logical Tailwind utilities (`ms-*`, `me-*`, `start-*`, `end-*`, `text-start`/`text-end`, `gap-*`)
rather than mirrored CSS.

**Customer content** — product, category, collection, homepage-section and fragrance-note
wording — is stored per language in `content_translations`, keyed to the existing rows. Nothing
is duplicated: prices, SKUs, stock and order history are never part of a translation, and the
services in `src/services/localizedContent.ts` only replace named text fields. Resolution order
is active language → English source row → whatever the row already held; an empty translation
can never blank a product name. A dropped bundle read is retried once and is deliberately *not*
cached, so one failed request cannot pin a shopper to English for the rest of the session.
Structured data follows the same localized text, so a page that reads Arabic to a customer does
not describe itself to Google in English.

**Who may change it:** `save_content_translation` / `delete_content_translation` require
`manage_cms` or `manage_settings` and are not executable by `anon`; the tables have no write
policies at all, so a browser cannot bypass the functions. In the dashboard the editor is
**Admin → Localization** (`content.manage`), and the country/currency/language configuration is
**Admin → International** (`settings.manage`). Primary Super Admin protection is untouched by
either screen.

**Adding another language** needs four coordinated steps, and the order matters: create the
dictionary file and bring it to full key parity first; then register it in
`BUILT_IN_LANGUAGES` + `dictionaries` (`src/i18n/index.ts`); then add its `languages` row with
direction and locale; then translate the catalog content into `content_translations`. The SEO
list in `src/lib/seo.ts` is the single source for hreflang, `og:locale:alternate` and the
sitemap, so registering there is enough — do not add per-file language arrays again. The parity
tests fail until all of it agrees, which is deliberate: a selectable language with an incomplete
dictionary is exactly the failure this prevents.
