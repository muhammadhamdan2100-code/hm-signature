-- ====================================================================
-- Corrects the two aggregation helpers added in
-- 20261002062025_business_intelligence_rpc.sql: unambiguous aggregate column
-- names and numeric casting (round(double precision, int) does not exist).
-- ====================================================================

CREATE OR REPLACE FUNCTION public.get_admin_analytics(p_days integer DEFAULT 90)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_days CONSTANT INT := GREATEST(COALESCE(p_days, 90), 1);
    v_window CONSTANT INTERVAL := make_interval(days => GREATEST(COALESCE(p_days, 90), 1));
    v_totals JSONB;
    v_cancellations JSONB;
    v_refunds JSONB;
    v_status_dist JSONB;
    v_method_dist JSONB;
    v_pay_status_dist JSONB;
    v_top_products JSONB;
    v_top_sizes JSONB;
    v_trend JSONB;
    v_growth JSONB;
    v_coupons JSONB;
    v_alerts JSONB;
BEGIN
    IF NOT public.is_staff(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Only staff members can view business analytics.';
    END IF;

    SELECT jsonb_build_object(
        'orders', COUNT(*),
        'gross_revenue', COALESCE(SUM(o.total), 0)::numeric(12, 2),
        'customers', (SELECT COUNT(DISTINCT o2.customer_email) FROM public.orders o2),
        'average_order_value', ROUND(COALESCE(AVG(o.total), 0)::numeric, 2),
        'units_sold', COALESCE((SELECT SUM(i.quantity) FROM public.order_items i
                                JOIN public.orders ow ON ow.id = i.order_id
                                WHERE ow.status <> 'Cancelled'), 0)
    ) INTO v_totals
    FROM public.orders o
    WHERE o.status <> 'Cancelled';

    SELECT jsonb_build_object(
        'cancelled_orders', COUNT(*) FILTER (WHERE o.status = 'Cancelled'),
        'returned_orders', COUNT(*) FILTER (WHERE o.status = 'Returned'),
        'cancelled_value', COALESCE(SUM(o.total) FILTER (WHERE o.status = 'Cancelled'), 0)::numeric(12, 2)
    ) INTO v_cancellations
    FROM public.orders o;

    SELECT jsonb_build_object(
        'records', COUNT(*),
        'processed_amount', COALESCE(SUM(r.amount) FILTER (WHERE r.status = 'processed'), 0)::numeric(12, 2),
        'pending_amount', COALESCE(SUM(r.amount) FILTER (WHERE r.status = 'pending'), 0)::numeric(12, 2),
        'rejected_or_failed', COUNT(*) FILTER (WHERE r.status IN ('rejected', 'failed'))
    ) INTO v_refunds
    FROM public.refunds r;

    SELECT jsonb_agg(row_json ORDER BY (row_json->>'count')::INT DESC) INTO v_status_dist
    FROM (
        SELECT jsonb_build_object('status', o.status, 'count', COUNT(*)) AS row_json
        FROM public.orders o GROUP BY o.status
    ) q;

    SELECT jsonb_agg(row_json ORDER BY (row_json->>'value')::NUMERIC DESC) INTO v_method_dist
    FROM (
        SELECT jsonb_build_object('method', o.payment_method, 'count', COUNT(*), 'value', COALESCE(SUM(o.total), 0)) AS row_json
        FROM public.orders o WHERE o.status <> 'Cancelled' GROUP BY o.payment_method
    ) q;

    SELECT jsonb_agg(row_json ORDER BY (row_json->>'count')::INT DESC) INTO v_pay_status_dist
    FROM (
        SELECT jsonb_build_object('status', p.status, 'count', COUNT(*), 'value', COALESCE(SUM(p.amount), 0)) AS row_json
        FROM public.payments p GROUP BY p.status
    ) q;

    SELECT jsonb_agg(row_json ORDER BY (row_json->>'revenue')::NUMERIC DESC) INTO v_top_products
    FROM (
        SELECT jsonb_build_object(
            'name', i.product_name,
            'units', SUM(i.quantity),
            'revenue', ROUND(SUM(i.line_total)::numeric, 2),
            'orders', COUNT(DISTINCT i.order_id)
        ) AS row_json
        FROM public.order_items i
        JOIN public.orders o ON o.id = i.order_id
        WHERE o.status <> 'Cancelled' AND i.created_at >= NOW() - v_window
        GROUP BY i.product_name
        LIMIT 8
    ) q;

    SELECT jsonb_agg(row_json ORDER BY (row_json->>'units')::INT DESC) INTO v_top_sizes
    FROM (
        SELECT jsonb_build_object(
            'size', i.variant_size,
            'units', SUM(i.quantity),
            'revenue', ROUND(SUM(i.line_total)::numeric, 2)
        ) AS row_json
        FROM public.order_items i
        JOIN public.orders o ON o.id = i.order_id
        WHERE o.status <> 'Cancelled' AND i.created_at >= NOW() - v_window
        GROUP BY i.variant_size
    ) q;

    SELECT jsonb_agg(row_json ORDER BY row_json->>'day') INTO v_trend
    FROM (
        SELECT jsonb_build_object(
            'day', to_char(date_trunc('day', o.created_at), 'YYYY-MM-DD'),
            'orders', COUNT(*),
            'revenue', ROUND(SUM(o.total)::numeric, 2)
        ) AS row_json
        FROM public.orders o
        WHERE o.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY 1
    ) q;

    SELECT jsonb_agg(row_json ORDER BY row_json->>'month') INTO v_growth
    FROM (
        SELECT jsonb_build_object(
            'month', to_char(date_trunc('month', pr.created_at), 'YYYY-MM'),
            'signups', COUNT(*)
        ) AS row_json
        FROM public.profiles pr WHERE pr.role = 'customer' GROUP BY 1
    ) q;

    SELECT jsonb_agg(row_json ORDER BY (row_json->>'discount_given')::NUMERIC DESC) INTO v_coupons
    FROM (
        SELECT jsonb_build_object(
            'code', cp.code,
            'uses', COUNT(cu.id),
            'discount_given', ROUND(COALESCE(SUM(cu.discount_amount), 0)::numeric, 2),
            'status', CASE WHEN cp.active THEN 'active' ELSE 'inactive' END
        ) AS row_json
        FROM public.coupons cp
        LEFT JOIN public.coupon_usage cu ON cu.coupon_id = cp.id
        GROUP BY cp.code, cp.active
        LIMIT 10
    ) q;

    SELECT jsonb_build_object(
        'out_of_stock', COUNT(*) FILTER (WHERE v.stock = 0),
        'low_stock', COUNT(*) FILTER (WHERE v.stock > 0 AND v.stock <= v.low_stock_threshold),
        'inactive', COUNT(*) FILTER (WHERE NOT v.active)
    ) INTO v_alerts
    FROM public.product_variants v;

    RETURN jsonb_build_object(
        'window_days', v_days,
        'totals', v_totals,
        'cancellations', v_cancellations,
        'refunds', COALESCE(v_refunds, '{}'::jsonb),
        'order_status_distribution', COALESCE(v_status_dist, '[]'::jsonb),
        'payment_method_distribution', COALESCE(v_method_dist, '[]'::jsonb),
        'payment_status_distribution', COALESCE(v_pay_status_dist, '[]'::jsonb),
        'top_products', COALESCE(v_top_products, '[]'::jsonb),
        'top_sizes', COALESCE(v_top_sizes, '[]'::jsonb),
        'sales_trend', COALESCE(v_trend, '[]'::jsonb),
        'customer_growth', COALESCE(v_growth, '[]'::jsonb),
        'coupon_performance', COALESCE(v_coupons, '[]'::jsonb),
        'inventory_alerts', COALESCE(v_alerts, '{}'::jsonb)
    );
END;
$function$;

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

    SELECT jsonb_agg(row_json ORDER BY row_json->>'product_name', row_json->>'size') INTO v_out
    FROM (
        SELECT jsonb_build_object(
            'product_name', p.name,
            'variant_id', v.id,
            'sku', v.sku,
            'size', v.size,
            'on_hand', v.stock,
            'low_stock_threshold', v.low_stock_threshold,
            'active', v.active,
            'sold_units', COALESCE(m.sold, 0),
            'restocked_units', COALESCE(m.restocked, 0),
            'net_adjustments', COALESCE(m.adjusted, 0),
            'reserved_in_open_orders', COALESCE(o.committed, 0),
            'daily_velocity', ROUND(
                COALESCE(m.sold, 0)::numeric
                / GREATEST(EXTRACT(EPOCH FROM NOW() - m.first_movement) / 86400.0, 1)::numeric,
                2
            ),
            'last_movement', m.last_movement
        ) AS row_json
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
            JOIN public.orders ord ON ord.id = oi.order_id
            WHERE oi.variant_id = v.id AND ord.status IN ('Pending', 'Confirmed', 'Processing')
        ) o ON TRUE
    ) q;

    RETURN COALESCE(v_out, '[]'::jsonb);
END;
$function$;
