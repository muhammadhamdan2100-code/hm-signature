-- Tracks whether a variant price is derived automatically from the 50ml
-- base price (proportional volume pricing) or manually overridden by admin.
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS is_auto_price BOOLEAN NOT NULL DEFAULT TRUE;
