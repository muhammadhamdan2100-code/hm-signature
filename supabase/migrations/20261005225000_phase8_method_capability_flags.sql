-- Phase 8: the capability flags of the rails that already work must live in the configuration
-- table, because checkout now reads availability and requirements from there rather than from the
-- legacy site_settings copy. Without this, JazzCash / Raast / Bank Transfer would stop asking for
-- the transaction reference and screenshot, and staff would lose the evidence they verify.
--
-- site_settings.payment_config keeps its job: the instruction text (account numbers, titles,
-- reference labels) that the shopkeeper edits on the Payments page. It no longer decides what a
-- customer may submit.

begin;

update public.payment_methods
   set requires_reference = true, requires_proof = true, updated_at = now()
 where code in ('jazzcash_wallet', 'raast_instant', 'bank_transfer_pk');

update public.payment_methods
   set requires_reference = false, requires_proof = false, updated_at = now()
 where code = 'cod';

-- The card and wallet rails that are not connected collect no reference: Stripe settles them and
-- tells us through the webhook.
update public.payment_methods
   set requires_reference = false, requires_proof = false, updated_at = now()
 where code in ('payfast_pk', 'easypaisa_pk', 'stripe_pk', 'stripe_ae', 'stripe_sa', 'stripe_gb', 'stripe_us', 'stripe_fr', 'stripe_es', 'stripe_de');

commit;

select code, display_name, status, is_enabled, requires_reference, requires_proof
  from public.payment_methods
 where country_codes @> array['PK']
 order by sort_order;
