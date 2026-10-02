-- ============================================================================
-- The admin "Generate" button on an order could not create a tracking
-- reference: save_order_tracking resolves gen_random_bytes(), which Supabase
-- installs in the `extensions` schema, while the function runs with
-- search_path = public, pg_temp. Every generated reference therefore failed
-- with 42883 "function gen_random_bytes(integer) does not exist" (proved by the
-- regression harness: save_order_tracking -> 404/42883, shipments row never
-- written, and the customer's tracking read came back empty).
--
-- The reference is now built from core functions only, so it does not depend on
-- which schema an optional extension was installed into. Everything else about
-- the function is unchanged, and the EXECUTE privileges granted by the previous
-- migrations stay attached to the same function OID.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.save_order_tracking(
    p_order_id uuid,
    p_courier text DEFAULT NULL,
    p_tracking_id text DEFAULT NULL,
    p_tracking_url text DEFAULT NULL,
    p_estimated_delivery date DEFAULT NULL,
    p_shipping_status text DEFAULT NULL,
    p_generate boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_order public.orders%ROWTYPE;
    v_tracking TEXT := NULLIF(TRIM(COALESCE(p_tracking_id, '')), '');
    v_courier TEXT := NULLIF(TRIM(COALESCE(p_courier, '')), '');
    v_valid_status CONSTANT TEXT[] := ARRAY['Preparing','Dispatched','In Transit','Out for Delivery','Failed Attempt','Delivered','Returned'];
BEGIN
    IF NOT public.is_staff(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Only staff members can manage shipment tracking.';
    END IF;

    IF p_shipping_status IS NOT NULL AND NOT (p_shipping_status = ANY (v_valid_status)) THEN
        RAISE EXCEPTION 'Invalid shipping status: %', p_shipping_status;
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found.', p_order_id;
    END IF;

    IF p_generate AND v_tracking IS NULL THEN
        LOOP
            v_tracking := 'HM-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE tracking_id = v_tracking);
        END LOOP;
    END IF;

    UPDATE public.orders
    SET courier_name = COALESCE(v_courier, courier_name),
        tracking_id = COALESCE(v_tracking, tracking_id),
        tracking_url = COALESCE(NULLIF(TRIM(COALESCE(p_tracking_url, '')), ''), tracking_url),
        estimated_delivery = COALESCE(p_estimated_delivery, estimated_delivery),
        updated_at = NOW()
    WHERE id = p_order_id;

    IF v_tracking IS NOT NULL OR p_shipping_status IS NOT NULL THEN
        INSERT INTO public.shipments (order_id, courier_name, tracking_number, tracking_url, status, estimated_delivery, dispatch_date, updated_at)
        VALUES (
            p_order_id,
            COALESCE(v_courier, 'Courier'),
            COALESCE(v_tracking, v_order.tracking_id, 'PENDING'),
            COALESCE(NULLIF(TRIM(COALESCE(p_tracking_url, '')), ''), v_order.tracking_url),
            COALESCE(p_shipping_status, 'Preparing'),
            COALESCE(p_estimated_delivery, v_order.estimated_delivery),
            CASE WHEN p_shipping_status IS NOT NULL AND p_shipping_status <> 'Preparing' THEN NOW()::date ELSE NULL END,
            NOW()
        )
        ON CONFLICT (order_id) DO UPDATE SET
            courier_name = EXCLUDED.courier_name,
            tracking_number = EXCLUDED.tracking_number,
            tracking_url = COALESCE(EXCLUDED.tracking_url, shipments.tracking_url),
            status = COALESCE(p_shipping_status, shipments.status),
            estimated_delivery = COALESCE(EXCLUDED.estimated_delivery, shipments.estimated_delivery),
            delivered_at = CASE WHEN p_shipping_status = 'Delivered' THEN NOW() ELSE shipments.delivered_at END,
            updated_at = NOW();
    END IF;

    INSERT INTO public.order_status_history (order_id, status, note, changed_by)
    VALUES (
        p_order_id,
        v_order.status,
        'Tracking updated' ||
            CASE WHEN v_tracking IS NOT NULL THEN ' — ' || v_courier || ' ' || v_tracking ELSE '' END ||
            CASE WHEN p_shipping_status IS NOT NULL THEN ' — ' || p_shipping_status ELSE '' END,
        auth.uid()
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'courier', COALESCE(v_courier, v_order.courier_name),
        'tracking_id', COALESCE(v_tracking, v_order.tracking_id),
        'estimated_delivery', COALESCE(p_estimated_delivery, v_order.estimated_delivery)
    );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.save_order_tracking(uuid, text, text, text, date, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_order_tracking(uuid, text, text, text, date, text, boolean) TO authenticated;
