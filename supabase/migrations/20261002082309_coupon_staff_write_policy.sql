-- ====================================================================
-- The coupons table has RLS enabled but only ever received a policy for
-- coupon_usage, so staff could not create or edit promotions and the
-- storefront could not validate a code. Additive policies only.
-- ====================================================================

DROP POLICY IF EXISTS "Staff Manage Coupons" ON public.coupons;
CREATE POLICY "Staff Manage Coupons" ON public.coupons
    FOR ALL
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

-- Promotion rules must be readable by shoppers so the cart can validate a
-- code before checkout; inactive codes stay invisible.
DROP POLICY IF EXISTS "Public Read Active Coupons" ON public.coupons;
CREATE POLICY "Public Read Active Coupons" ON public.coupons
    FOR SELECT
    USING (active = TRUE OR public.is_staff(auth.uid()));
