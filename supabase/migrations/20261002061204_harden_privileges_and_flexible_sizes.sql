-- ====================================================================
-- Hardening + variant size flexibility.
-- Additive: no table/column is dropped, no existing row is rewritten.
-- ====================================================================

-- 1. PRIVILEGE ESCALATION ------------------------------------------------
-- Permissive RLS policies OR together. "Users Update Own Profile" allowed a
-- customer to change their own role (no WITH CHECK guard) while the older,
-- properly guarded policy still exists, so the weak policy is removed and a
-- trigger is added as a second line of defence.
DROP POLICY IF EXISTS "Users Update Own Profile" ON public.profiles;

CREATE OR REPLACE FUNCTION public.enforce_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Staff (or a system/service context with no JWT subject) may change role,
    -- status and admin flags. Everyone else is pinned to their stored values.
    IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN
        RETURN NEW;
    END IF;

    NEW.role := OLD.role;
    NEW.status := OLD.status;
    NEW.is_primary_admin := OLD.is_primary_admin;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_profile_privileges ON public.profiles;
CREATE TRIGGER trg_enforce_profile_privileges
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_profile_privileges();

-- 2. CUSTOM BOTTLE SIZES -------------------------------------------------
-- The variant model is intended to support any millilitre size (75ml, 150ml,
-- discovery sets, ...). Replace the four-value allow-list with a validated
-- pattern so arbitrary sizes persist without free-form junk values.
ALTER TABLE public.product_variants
    DROP CONSTRAINT IF EXISTS product_variants_size_check;

ALTER TABLE public.product_variants
    ADD CONSTRAINT product_variants_size_check
    CHECK (size ~ '^[1-9][0-9]{0,3}ml$');

COMMENT ON CONSTRAINT product_variants_size_check ON public.product_variants IS
    'Size label must be a positive whole-millilitre value such as 10ml or 75ml; custom sizes are supported.';
