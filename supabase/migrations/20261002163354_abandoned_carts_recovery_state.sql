-- ============================================================================
-- The recovery columns added by 20261002163016 are written by mark_cart_recovery
-- but the queue RPC still returned only the stalled timestamp, so the admin table
-- could not show whether a reminder had already been recorded. Additive: the
-- projection gains three fields; no row is updated and no policy changes.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_abandoned_carts(p_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_out JSONB;
BEGIN
    IF NOT public.is_staff(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Only staff members can view abandoned carts.';
    END IF;

    SELECT jsonb_agg(row_to_json(x)::jsonb ORDER BY x.stalled_since DESC) INTO v_out
    FROM (
        SELECT
            c.id AS cart_id,
            pr.email AS customer_email,
            pr.full_name AS customer_name,
            COUNT(ci.id) AS line_count,
            COALESCE(SUM(COALESCE(v.sale_price, v.price) * ci.quantity), 0) AS cart_value,
            MAX(c.updated_at) AS stalled_since,
            MAX(c.reminder_sent_at) AS reminder_sent_at,
            MAX(c.recovered_at) AS recovered_at,
            MAX(c.recovery_updated_by) AS recovery_updated_by
        FROM public.cart c
        JOIN public.profiles pr ON pr.id = c.user_id
        LEFT JOIN public.cart_items ci ON ci.cart_id = c.id
        LEFT JOIN public.product_variants v ON v.id = ci.variant_id
        WHERE c.updated_at < NOW() - make_interval(hours => GREATEST(COALESCE(p_hours, 24), 1))
          AND NOT EXISTS (
              SELECT 1 FROM public.orders o
              WHERE o.customer_id = c.user_id
                AND o.created_at > c.updated_at
          )
        GROUP BY c.id, pr.email, pr.full_name, c.updated_at
    ) x;

    RETURN COALESCE(v_out, '[]'::jsonb);
END;
$function$;

COMMENT ON FUNCTION public.get_abandoned_carts(integer) IS
    'Staff-only stalled-bag queue. Reports the recovery state recorded by mark_cart_recovery so a reminder is never dispatched twice.';
