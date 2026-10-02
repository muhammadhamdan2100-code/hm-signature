-- ====================================================================
-- Business intelligence: every metric is computed from stored rows, so the
-- admin never renders invented numbers. Staff-only, aggregation server-side.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.get_admin_analytics(p_days integer DEFAULT 90)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_window CONSTANT INTERVAL := make_interval(days => GREATEST(COALESCE(p_days, 90), 1));
    v_out JSONB;
BEGIN
    IF NOT public.is_staff(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Only staff members can view business analytics.';
    END IF;

    SELECT jsonb_build_object(
        'window_days', GREATEST(COALESCE(p_days, 90), 1),
        'totals', (
            SELECT jsonb_build_object(
                'orders', COUNT(*),
                'gross_revenue', COALESCE(SUM(o.total), 0),
                'refunded', COALESCE((SELECT SUM(r.amount) FROM public.refunds r WHERE r.status = 'processed'), 0),
                'customers', (SELECT COUNT(DISTINCT customer_email) FROM public.orders),
                'average_order_value', ROUND(COALESCE(AVG(o.total), 0), 2),
                'units_sold', COALESCE((SELECT SUM(i.quantity) FROM public.order_items i JOIN public.orders ow ON ow.id = i.order_id WHERE ow.status <> 'Cancelled'), 0)
            )
            FROM public.orders o WHERE o.status <> 'Cancelled'
        ),
        'cancellations', (
            SELECT jsonb_build_object(
                'cancelled_orders', COUNT(*) FILTER (WHERE status = 'Cancelled'),
                'returned_orders', COUNT(*) FILTER (WHERE status = 'Returned'),
                'cancelled_value', COALESCE(SUM(total) FILTER (WHERE status = 'Cancelled'), 0)
            ) FROM public.orders
        ),
        'refunds', (
            SELECT jsonb_build_object(
                'records', COUNT(*),
                'processed_amount', COALESCE(SUM(amount) FILTER (WHERE status = 'processed'), 0),
                'pending_amount', COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0),
                'rejected_or_failed', COUNT(*) FILTER (WHERE status IN ('rejected', 'failed'))
            ) FROM public.refunds
        ),
        'order_status_distribution', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('status', s, 'count', n) ORDER BY n DESC)
            FROM (SELECT status, COUNT(*) n FROM public.orders GROUP BY status) x
        ), '[]'::jsonb),
        'payment_method_distribution', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('method', m, 'count', n, 'value', v) ORDER BY v DESC)
            FROM (SELECT payment_method m, COUNT(*) n, SUM(total) v FROM public.orders WHERE status <> 'Cancelled' GROUP BY payment_method) y
        ), '[]'::jsonb),
        'payment_status_distribution', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('status', ps, 'count', n, 'value', v) ORDER BY n DESC)
            FROM (SELECT status ps, COUNT(*) n, SUM(amount) v FROM public.payments GROUP BY status) z
        ), '[]'::jsonb),
        'top_products', COALESCE((
            SELECT jsonb_agg(t ORDER BY t->'revenue' DESC) FROM (
                SELECT jsonb_build_object(
                    'name', i.product_name, 'units', SUM(i.quantity),
                    'revenue', ROUND(SUM(i.line_total), 2), 'orders', COUNT(DISTINCT i.order_id)
                ) t
                FROM public.order_items i JOIN public.orders o ON o.id = i.order_id
                WHERE o.status <> 'Cancelled' AND i.created_at >= NOW() - v_window
                GROUP BY i.product_name
                ORDER BY SUM(i.line_total) DESC LIMIT 8
            ) s
        ), '[]'::jsonb),
        'top_sizes', COALESCE((
            SELECT jsonb_agg(s ORDER BY s->'units' DESC) FROM (
                SELECT jsonb_build_object('size', i.variant_size, 'units', SUM(i.quantity), 'revenue', ROUND(SUM(i.line_total), 2)) s
                FROM public.order_items i JOIN public.orders o ON o.id = i.order_id
                WHERE o.status <> 'Cancelled' AND i.created_at >= NOW() - v_window
                GROUP BY i.variant_size ORDER BY SUM(i.quantity) DESC
            ) x
        ), '[]'::jsonb),
        'sales_trend', COALESCE((
            SELECT jsonb_agg(d ORDER BY d->'day') FROM (
                SELECT jsonb_build_object('day', to_char(date_trunc('day', created_at), 'YYYY-MM-DD'), 'orders', COUNT(*), 'revenue', ROUND(SUM(total), 2)) d
                FROM public.orders WHERE created_at >= NOW() - INTERVAL '90 days' GROUP BY 1 ORDER BY 1
            ) x
        ), '[]'::jsonb),
        'customer_growth', COALESCE((
            SELECT jsonb_agg(c ORDER BY c->'month') FROM (
                SELECT jsonb_build_object('month', to_char(date_trunc('month', created_at), 'YYYY-MM'), 'signups', COUNT(*)) c
                FROM public.profiles WHERE role = 'customer' GROUP BY 1 ORDER BY 1
            ) x
        ), '[]'::jsonb),
        'coupon_performance', COALESCE((
            SELECT jsonb_agg(c ORDER BY c->'discount_given' DESC) FROM (
                SELECT jsonb_build_object(
                    'code', cp.code, 'uses', COUNT(cu.id),
                    'discount_given', ROUND(COALESCE(SUM(cu.discount_amount), 0), 2),
                    'status', CASE WHEN cp.active THEN 'active' ELSE 'inactive' END
                ) c
                FROM public.coupons cp LEFT JOIN public.coupon_usage cu ON cu.coupon_id = cp.id
                GROUP BY cp.code, cp.active ORDER BY COALESCE(SUM(cu.discount_amount), 0) DESC LIMIT 10
            ) x
        ), '[]'::jsonb),
        'inventory_alerts', COALESCE((
            SELECT jsonb_build_object(
                'out_of_stock', COUNT(*) FILTER (WHERE v.stock = 0),
                'low_stock', COUNT(*) FILTER (WHERE v.stock > 0 AND v.stock <= v.low_stock_threshold),
                'inactive', COUNT(*) FILTER (WHERE NOT v.active)
            ) FROM public.product_variants v
        ), '{}'::jsonb)
    ) INTO v_out;

    RETURN v_out;
END;
$function$;

-- Inventory position per size. Reserved units are those committed to orders
-- that have not been dispatched yet; stock is already decremented at checkout,
-- so available_to_sell is the live figure and reserved is reported for context.
CREATE OR REPLACE FUNCTION public.get_inventory_position()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_out JSONB;
BEGIN
    IF NOT public.is_staff(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Only staff members can view inventory positions.';
    END IF;

    SELECT jsonb_agg(row_to_json(x)::jsonb ORDER BY x.product_name, x.size) INTO v_out
    FROM (
        SELECT
            p.name AS product_name,
            v.sku,
            v.size,
            v.stock AS on_hand,
            v.low_stock_threshold,
            v.active,
            COALESCE(m.sold, 0) AS sold_units,
            COALESCE(m.restocked, 0) AS restocked_units,
            COALESCE(m.adjusted, 0) AS net_adjustments,
            COALESCE(o.committed, 0) AS reserved_in_open_orders,
            ROUND(COALESCE(m.sold, 0) / GREATEST(EXTRACT(EPOCH FROM NOW() - m.first_movement) / 86400.0, 1), 2) AS daily_velocity,
            m.last_movement
        FROM public.product_variants v
        JOIN public.products p ON p.id = v.product_id
        LEFT JOIN LATERAL (
            SELECT
                SUM(-it.quantity_change) FILTER (WHERE it.transaction_type = 'sale') AS sold,
                SUM(it.quantity_change) FILTER (WHERE it.transaction_type IN ('return', 'cancellation_release')) AS restocked,
                SUM(it.quantity_change) FILTER (WHERE it.transaction_type IN ('adjustment', 'restock')) AS adjusted,
                MIN(it.created_at) AS first_movement,
                MAX(it.created_at) AS last_movement
            FROM public.inventory_transactions it WHERE it.variant_id = v.id
        ) m ON TRUE
        LEFT JOIN LATERAL (
            SELECT SUM(oi.quantity) AS committed
            FROM public.order_items oi
            JOIN public.orders o ON o.id = oi.order_id
            WHERE oi.variant_id = v.id AND o.status IN ('Pending', 'Confirmed', 'Processing')
        ) o ON TRUE
    ) x;

    RETURN COALESCE(v_out, '[]'::jsonb);
END;
$function$;

-- Admin customer directory with real aggregates and derived segments.
CREATE OR REPLACE FUNCTION public.get_admin_customers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_out JSONB;
BEGIN
    IF NOT public.is_staff(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Only staff members can view the customer directory.';
    END IF;

    SELECT jsonb_agg(row_to_json(x)::jsonb ORDER BY x.total_spent DESC, x.last_order DESC) INTO v_out
    FROM (
        SELECT
            pr.id,
            pr.full_name,
            pr.email,
            pr.phone,
            pr.status,
            pr.created_at AS joined_at,
            COUNT(o.id) FILTER (WHERE o.status <> 'Cancelled') AS orders,
            COALESCE(SUM(o.total) FILTER (WHERE o.status <> 'Cancelled'), 0) AS total_spent,
            MAX(o.created_at) AS last_order,
            CASE
                WHEN COUNT(o.id) = 0 THEN 'Unconverted'
                WHEN COALESCE(SUM(o.total) FILTER (WHERE o.status <> 'Cancelled'), 0) >= 15000 THEN 'VIP'
                WHEN COUNT(o.id) > 1 THEN 'Returning'
                ELSE 'New'
            END AS segment,
            COALESCE(w.wishlist_count, 0) AS wishlist_count,
            COALESCE(rv.review_count, 0) AS review_count
        FROM public.profiles pr
        LEFT JOIN public.orders o ON o.customer_id = pr.id
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS wishlist_count
            FROM public.wishlist_items wi
            JOIN public.wishlists wl ON wl.id = wi.wishlist_id
            WHERE wl.user_id = pr.id
        ) w ON TRUE
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS review_count FROM public.reviews r WHERE r.user_id = pr.id
        ) rv ON TRUE
        WHERE pr.role = 'customer'
        GROUP BY pr.id, pr.full_name, pr.email, pr.phone, pr.status, pr.created_at, w.wishlist_count, rv.review_count
    ) x;

    RETURN COALESCE(v_out, '[]'::jsonb);
END;
$function$;

-- Derived abandoned baskets: a synced cart with no order after 24 hours.
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
            MAX(c.updated_at) AS stalled_since
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
