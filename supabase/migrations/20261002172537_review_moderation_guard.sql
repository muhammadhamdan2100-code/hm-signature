-- ============================================================================
-- The storefront review form sends no moderation fields, but a signed-in customer
-- can post straight to the REST endpoint. The insert policy only proves ownership
-- (user_id = auth.uid()), so a customer could have written status = 'Approved' and
-- published their own review past moderation, or claimed a verified purchase they
-- never made. Both fields are now owned by the database, never by the writer.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.stamp_review_verified_purchase()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
    -- BEFORE ROW triggers run before the row-level-security WITH CHECK expression,
    -- so normalising here is authoritative rather than a suggestion a client can skip.
    IF NOT public.is_staff(auth.uid()) THEN
        NEW.status := 'Pending';
        NEW.verified_purchase := FALSE;
    END IF;

    IF NEW.user_id IS NOT NULL AND NEW.verified_purchase IS NOT TRUE THEN
        NEW.verified_purchase := EXISTS (
            SELECT 1
            FROM public.orders o
            JOIN public.order_items oi ON oi.order_id = o.id
            WHERE o.customer_id = NEW.user_id
              AND oi.product_id = NEW.product_id
              AND o.status <> 'Cancelled'
        );
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_reviews_verified_purchase ON public.reviews;
CREATE TRIGGER trg_reviews_guard
    BEFORE INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.stamp_review_verified_purchase();

COMMENT ON FUNCTION public.stamp_review_verified_purchase() IS
    'Owns reviews.status and reviews.verified_purchase for non-staff writers: a customer insert is always Pending, and Verified Purchase is derived only from a non-cancelled order by that customer containing that product.';
