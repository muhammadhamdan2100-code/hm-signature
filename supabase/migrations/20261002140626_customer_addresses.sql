-- ============================================================================
-- Phase 1 gap: customer addresses lived only in browser localStorage
-- (`hm_auth_addresses`) and nothing in the UI read or wrote them, so an
-- address book could not survive a device change and the admin "Addresses"
-- tab could only describe addresses inferred from past orders.
--
-- This migration is additive: a new `addresses` table with owner-scoped row
-- level security, one-default-per-client enforced in the database, and a
-- staff read policy so the admin customer view can show the real book. No
-- existing table, row or policy is changed or removed.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'shipping'
        CHECK (type IN ('shipping', 'billing', 'home', 'work', 'other')),
    label TEXT,
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city TEXT NOT NULL,
    state TEXT,
    postal_code TEXT,
    country TEXT NOT NULL DEFAULT 'Pakistan',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT addresses_address_line_1_required CHECK (btrim(address_line_1) <> ''),
    CONSTRAINT addresses_city_required CHECK (btrim(city) <> ''),
    CONSTRAINT addresses_type_required CHECK (btrim(type) <> '')
);

COMMENT ON TABLE public.addresses IS
    'Saved delivery addresses owned by a customer. `label` carries the name the account page shows (for example "Primary Residence"); `type` is the constrained classification.';

CREATE INDEX IF NOT EXISTS idx_addresses_customer ON public.addresses (customer_id, is_default DESC, created_at DESC);

-- Exactly one default per customer, enforced twice: the trigger clears the
-- siblings before the new default lands, and the partial unique index makes a
-- second default impossible even if two sessions race.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_address_default_per_customer
    ON public.addresses (customer_id)
    WHERE is_default;

CREATE OR REPLACE FUNCTION public.enforce_single_default_address()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
    IF NEW.is_default THEN
        UPDATE public.addresses
        SET is_default = FALSE, updated_at = NOW()
        WHERE customer_id = NEW.customer_id
          AND id IS DISTINCT FROM NEW.id
          AND is_default;
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_addresses_single_default ON public.addresses;
CREATE TRIGGER trg_addresses_single_default
    BEFORE INSERT OR UPDATE OF is_default ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION public.enforce_single_default_address();

CREATE OR REPLACE FUNCTION public.touch_addresses_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_addresses_updated_at ON public.addresses;
CREATE TRIGGER trg_addresses_updated_at
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION public.touch_addresses_updated_at();

-- --------------------------------------------------------------------- RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- The account owner manages their own book.
DROP POLICY IF EXISTS "Customers Manage Own Addresses" ON public.addresses;
CREATE POLICY "Customers Manage Own Addresses" ON public.addresses
    FOR ALL TO authenticated
    USING (customer_id = auth.uid())
    WITH CHECK (customer_id = auth.uid());

-- Staff may read the book for the admin customer view, never edit it.
DROP POLICY IF EXISTS "Staff Read Customer Addresses" ON public.addresses;
CREATE POLICY "Staff Read Customer Addresses" ON public.addresses
    FOR SELECT TO authenticated
    USING (public.is_staff(auth.uid()));

REVOKE ALL ON TABLE public.addresses FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.addresses TO authenticated;
