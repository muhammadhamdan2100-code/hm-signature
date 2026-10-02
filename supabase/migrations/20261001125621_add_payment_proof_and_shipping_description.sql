-- Additive columns required by the checkout payment-proof flow,
-- admin shipping-method management, and SEO canonical/slug persistence.
-- Safe on existing databases (IF NOT EXISTS).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

ALTER TABLE public.shipping_methods
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.seo_settings
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT;
