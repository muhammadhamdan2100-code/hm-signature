-- ====================================================================
-- Product / variant / order model enrichment for the international catalogue.
-- All columns are nullable or defaulted, so existing rows and code keep working.
-- ====================================================================

-- 1. PRODUCTS ------------------------------------------------------------
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS short_description TEXT,
    ADD COLUMN IF NOT EXISTS fragrance_family TEXT,
    ADD COLUMN IF NOT EXISTS occasions TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS seasons TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS intensity TEXT
        CHECK (intensity IN ('Light', 'Moderate', 'Strong', 'Enormous')),
    ADD COLUMN IF NOT EXISTS scent_profile TEXT;

COMMENT ON COLUMN public.products.short_description IS 'One-line editorial summary used on cards and meta descriptions.';
COMMENT ON COLUMN public.products.fragrance_family IS 'Fragrance family label (e.g. Woody Oriental). Categories remain the merchandising grouping.';
COMMENT ON COLUMN public.products.intensity IS 'Declared projection level only; never a longevity guarantee.';

CREATE INDEX IF NOT EXISTS idx_products_family ON public.products (fragrance_family);
CREATE INDEX IF NOT EXISTS idx_products_intensity ON public.products (intensity);

-- 2. VARIANT LEVEL IMAGES ------------------------------------------------
-- Optional per-variant artwork; product_id stays the owning product.
ALTER TABLE public.product_images
    ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_product_images_variant ON public.product_images (variant_id);

-- 3. ORDER NOTES SPLIT ---------------------------------------------------
-- notes = what the customer asked for; admin_notes = internal and never shown
-- on customer routes.
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS admin_notes TEXT,
    ADD COLUMN IF NOT EXISTS customer_notes TEXT,
    ADD COLUMN IF NOT EXISTS shipping_method_id UUID REFERENCES public.shipping_methods (id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS estimated_delivery DATE;

COMMENT ON COLUMN public.orders.admin_notes IS 'Internal staff note. Must never be returned to customer-facing reads.';

CREATE INDEX IF NOT EXISTS idx_orders_shipping_method ON public.orders (shipping_method_id);

-- 4. COUPON PER-USER LIMITS -----------------------------------------------
ALTER TABLE public.coupons
    ADD COLUMN IF NOT EXISTS per_user_limit INTEGER NOT NULL DEFAULT 0
        CHECK (per_user_limit >= 0);

COMMENT ON COLUMN public.coupons.per_user_limit IS 'Maximum redemptions per authenticated customer. 0 means unlimited.';
