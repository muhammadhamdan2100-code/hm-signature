-- ====================================================================
-- QA-driven corrections: analytics must exclude cancelled orders from the
-- revenue trend, top-N lists must be ordered before being limited, net
-- revenue must only subtract refunds that belong to live orders, shipping
-- methods need read policies, and self-cancellation must respect the
-- payment row as well as the order row.
-- ====================================================================

-- 1. SHIPPING METHODS WERE UNREADABLE (RLS on, zero policies) -----------
DROP POLICY IF EXISTS "Public Read Active Shipping Methods" ON public.shipping_methods;
CREATE POLICY "Public Read Active Shipping Methods" ON public.shipping_methods
    FOR SELECT USING (active = TRUE OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff Manage Shipping Methods" ON public.shipping_methods;
CREATE POLICY "Staff Manage Shipping Methods" ON public.shipping_methods
    FOR ALL
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

-- 2. SELF-CANCELLATION MUST ALSO RESPECT THE PAYMENT ROW ---------------
CREATE OR REPLACE FUNCTION public.cancel_self_order(p_order_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_order public.orders%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Please sign in to manage this order.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    IF v_order.customer_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'You can only cancel your own orders.';
    END IF;

    IF v_order.status NOT IN ('Pending', 'Confirmed') THEN
        RAISE EXCEPTION 'This order can no longer be cancelled because it has entered preparation. Please contact the concierge.';
    END IF;

    -- Either record settling the payment blocks a self-service reversal.
    IF v_order.payment_status IN ('Paid', 'Verified', 'Refunded')
       OR EXISTS (SELECT 1 FROM public.payments ps
                  WHERE ps.order_id = p_order_id
                    AND ps.status IN ('Paid', 'Verified', 'Refunded')) THEN
        RAISE EXCEPTION 'A settled payment cannot be reversed from here. Please request a refund through the concierge.';
    END IF;

    RETURN public.apply_order_cancellation(
        p_order_id,
        COALESCE(NULLIF(TRIM(p_reason), ''), 'Cancelled by the client'),
        auth.uid()
    );
END;
$function$;

-- 3. ANALYTICS CORRECTIONS ---------------------------------------------
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

    -- processed_on_live_orders is the figure net revenue must subtract; a refund
    -- on an order that was cancelled never counted toward gross revenue.
    SELECT jsonb_build_object(
        'records', COUNT(*),
        'processed_amount', COALESCE(SUM(r.amount) FILTER (WHERE r.status = 'processed'), 0)::numeric(12, 2),
        'processed_on_live_orders', COALESCE(SUM(r.amount) FILTER (WHERE r.status = 'processed' AND o.status <> 'Cancelled'), 0)::numeric(12, 2),
        'pending_amount', COALESCE(SUM(r.amount) FILTER (WHERE r.status = 'pending'), 0)::numeric(12, 2),
        'rejected_or_failed', COUNT(*) FILTER (WHERE r.status IN ('rejected', 'failed'))
    ) INTO v_refunds
    FROM public.refunds r
    JOIN public.orders o ON o.id = r.order_id;

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
        ORDER BY SUM(i.line_total) DESC
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
        ORDER BY SUM(i.quantity) DESC
    ) q;

    -- The trend must agree with the revenue definition: cancelled orders are out.
    SELECT jsonb_agg(row_json ORDER BY row_json->>'day') INTO v_trend
    FROM (
        SELECT jsonb_build_object(
            'day', to_char(date_trunc('day', o.created_at), 'YYYY-MM-DD'),
            'orders', COUNT(*),
            'revenue', ROUND(SUM(o.total)::numeric, 2)
        ) AS row_json
        FROM public.orders o
        WHERE o.created_at >= NOW() - make_interval(days => GREATEST(v_days, 90))
          AND o.status <> 'Cancelled'
        GROUP BY to_char(date_trunc('day', o.created_at), 'YYYY-MM-DD')
    ) q;

    SELECT jsonb_agg(row_json ORDER BY row_json->>'month') INTO v_growth
    FROM (
        SELECT jsonb_build_object(
            'month', to_char(date_trunc('month', pr.created_at), 'YYYY-MM'),
            'signups', COUNT(*)
        ) AS row_json
        FROM public.profiles pr
        WHERE pr.role = 'customer'
        GROUP BY to_char(date_trunc('month', pr.created_at), 'YYYY-MM')
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
        ORDER BY COALESCE(SUM(cu.discount_amount), 0) DESC
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
