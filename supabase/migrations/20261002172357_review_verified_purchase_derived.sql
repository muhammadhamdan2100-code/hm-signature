-- ============================================================================
-- "Verified Purchase" is a trust claim, so it cannot be typed by the reviewer.
-- The storefront form has no field for it and the insert policy lets a customer
-- write their own row, which left the flag at its default forever: no genuine
-- purchase could ever be marked verified, and any future import would have to be
-- trusted by hand. The flag is now derived from a real order for the same
-- customer and product. Additive: no existing row is changed (the table is empty).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.stamp_review_verified_purchase()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
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
CREATE TRIGGER trg_reviews_verified_purchase
    BEFORE INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.stamp_review_verified_purchase();

COMMENT ON FUNCTION public.stamp_review_verified_purchase() IS
    'Derives reviews.verified_purchase from a non-cancelled order by the same customer containing the same product. Never accepted from the reviewer.';
