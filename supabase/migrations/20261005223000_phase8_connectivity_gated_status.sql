-- Phase 8: separate what the admin *intends* from what the deployment can *do*.
--
-- payment_methods.status is the Super Admin's intent. Whether a provider can actually take money
-- is decided at request time by the presence of its credential environment variables (see
-- api/_payments.js -> providerReadiness). A rail therefore needs one of two states:
--
--   * enabled + credentials missing  -> the API reports "not_configured". Checkout shows Coming
--                                        Soon and refuses submission, and the moment the keys are
--                                        added the same row becomes a live option with no further
--                                        change. This is the card rails, incl. PayFast, which the
--                                        storefront already hides until credentials exist.
--   * coming_soon                    -> there is no integration path yet (JazzCash, Easypaisa,
--                                        Google Pay, Apple Pay, Tabby, Tamara, mada, STC Pay,
--                                        PayPal, Klarna, CB, Bizum). A Super Admin must both
--                                        configure the provider and set the status to enabled.
--
-- Paying attention to this split is what keeps the existing PayFast flow working: its row used to
-- be coming_soon here, which would have made place_order refuse an order the storefront was
-- happily offering.

begin;

update public.payment_methods
   set status = 'enabled', environment = 'none', updated_at = now()
 where code in (
   'payfast_pk',
   'stripe_pk', 'stripe_ae', 'stripe_sa', 'stripe_gb', 'stripe_us', 'stripe_fr', 'stripe_es', 'stripe_de'
 );

-- Nothing is marked live or test until a credential actually exists, so the storefront can never
-- present a rail as usable on the strength of configuration alone.
update public.payment_methods
   set environment = 'none'
 where environment <> 'none'
   and code in ('payfast_pk','stripe_pk','stripe_ae','stripe_sa','stripe_gb','stripe_us','stripe_fr','stripe_es','stripe_de');

-- 'configured' means the Super Admin has entered a rail but not offered it yet, so it must not
-- raise is_enabled. Only 'enabled' is offered, and the API then still checks connectivity.
create or replace function public.sync_payment_method_flags() returns trigger
language plpgsql as $$
begin
  new.is_enabled     := new.status = 'enabled';
  new.is_coming_soon := new.status = 'coming_soon';
  new.updated_at     := now();
  return new;
end $$;

-- Re-derive every row so the flags match the tightened rule above.
update public.payment_methods set status = status;

commit;

select
  (select count(*) from public.payment_methods where is_enabled and status = 'enabled')  as intended_enabled,
  (select count(*) from public.payment_methods where status = 'coming_soon')             as awaiting_integration,
  (select count(*) from public.payment_methods where environment <> 'none')              as marked_with_credentials,
  (select count(*) from public.payment_methods where code like 'stripe_%' and is_enabled) as card_rails_ready_to_activate,
  (select count(*) from public.payment_methods where is_enabled <> (status = 'enabled'))   as flag_drift;
