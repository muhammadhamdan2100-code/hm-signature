-- ====================================================================
-- Order operations: tracking, notes, timeline integrity, coupon limits and
-- configurable shipping. Business rules stay server-side.
-- ====================================================================

-- 1. SHIPPING CONFIG -----------------------------------------------------
-- place_order reads free_threshold / standard_cost from site_settings so the
-- admin can change delivery pricing without a code deploy.
INSERT INTO public.site_settings (key, value, description)
VALUES ('shipping_config',
        '{"freeThreshold": 10000, "standardCost": 250}'::jsonb,
        'Delivery cost rules applied server-side when an order is placed.')
ON CONFLICT (key) DO NOTHING;

-- 2. PLACE ORDER (v2) ----------------------------------------------------
-- Changes: collision-safe order number, explicit coupon errors + per-user
-- limit, configurable shipping, snapshot image on line items.
CREATE OR REPLACE FUNCTION public.place_order(
    p_customer_id uuid,
    p_customer_name text,
    p_customer_email text,
    p_customer_phone text,
    p_shipping_address jsonb,
    p_payment_method text,
    p_coupon_code text DEFAULT NULL::text,
    p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_subtotal NUMERIC(10, 2) := 0;
    v_discount NUMERIC(10, 2) := 0;
    v_shipping NUMERIC(10, 2) := 0;
    v_total NUMERIC(10, 2) := 0;
    v_item JSONB;
    v_variant_id UUID;
    v_quantity INT;
    v_variant RECORD;
    v_product RECORD;
    v_unit_price NUMERIC(10, 2);
    v_line_total NUMERIC(10, 2);
    v_coupon RECORD;
    v_image TEXT;
    v_cfg JSONB;
    v_free_threshold NUMERIC(12, 2);
    v_standard_cost NUMERIC(12, 2);
    v_personal_uses INT := 0;
BEGIN
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Your bag is empty. Add a fragrance before placing an order.';
    END IF;

    IF p_payment_method NOT IN ('COD', 'Cash on Delivery', 'JazzCash', 'Raast', 'Bank Transfer', 'PayFast') THEN
        RAISE EXCEPTION 'Unsupported payment method: %', p_payment_method;
    END IF;

    -- Collision-safe order number
    LOOP
        v_order_number := 'HMS-' || to_char(NOW(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_order_number);
    END LOOP;
    v_order_id := gen_random_uuid();

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_quantity := (v_item->>'quantity')::INT;

        IF v_quantity IS NULL OR v_quantity <= 0 THEN
            RAISE EXCEPTION 'Invalid item quantity.';
        END IF;
        IF v_quantity > 50 THEN
            RAISE EXCEPTION 'Orders are limited to 50 units of a single size. Please contact the concierge for larger requirements.';
        END IF;

        SELECT * INTO v_variant FROM public.product_variants WHERE id = v_variant_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'The selected bottle size is no longer available.';
        END IF;
        IF NOT v_variant.active THEN
            RAISE EXCEPTION '% is currently unavailable.', v_variant.sku;
        END IF;
        IF v_variant.stock < v_quantity THEN
            RAISE EXCEPTION 'Only % of % remains in stock.', v_variant.stock, v_variant.size;
        END IF;

        SELECT * INTO v_product FROM public.products WHERE id = v_variant.product_id;

        v_unit_price := COALESCE(v_variant.sale_price, v_variant.price);
        v_line_total := v_unit_price * v_quantity;
        v_subtotal := v_subtotal + v_line_total;

        UPDATE public.product_variants
        SET stock = stock - v_quantity, updated_at = NOW()
        WHERE id = v_variant_id;

        INSERT INTO public.inventory_transactions (
            variant_id, transaction_type, quantity_change, previous_stock, new_stock, reference_id, notes
        ) VALUES (
            v_variant_id, 'sale', -v_quantity, v_variant.stock, v_variant.stock - v_quantity, v_order_number, 'Customer Order Acquisition'
        );
    END LOOP;

    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
        SELECT * INTO v_coupon FROM public.coupons
        WHERE UPPER(code) = UPPER(TRIM(p_coupon_code)) FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'The promotion code % is not recognised.', TRIM(p_coupon_code);
        END IF;
        IF NOT v_coupon.active THEN
            RAISE EXCEPTION 'The promotion % is no longer active.', v_coupon.code;
        END IF;
        IF v_coupon.start_date IS NOT NULL AND NOW() < v_coupon.start_date THEN
            RAISE EXCEPTION 'The promotion % is not active yet.', v_coupon.code;
        END IF;
        IF v_coupon.end_date IS NOT NULL AND NOW() > v_coupon.end_date THEN
            RAISE EXCEPTION 'The promotion % has expired.', v_coupon.code;
        END IF;
        IF v_coupon.min_spend IS NOT NULL AND v_subtotal < v_coupon.min_spend THEN
            RAISE EXCEPTION 'A minimum spend of Rs % is required for %.', to_char(v_coupon.min_spend, 'FM999,999'), v_coupon.code;
        END IF;
        IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
            RAISE EXCEPTION 'The promotion % has reached its usage limit.', v_coupon.code;
        END IF;

        IF v_coupon.per_user_limit > 0 AND p_customer_id IS NOT NULL THEN
            SELECT COUNT(*) INTO v_personal_uses FROM public.coupon_usage
            WHERE coupon_id = v_coupon.id AND user_id = p_customer_id;
            IF v_personal_uses >= v_coupon.per_user_limit THEN
                RAISE EXCEPTION 'The promotion % can only be used % time(s) per client.', v_coupon.code, v_coupon.per_user_limit;
            END IF;
        END IF;

        IF v_coupon.type = 'percentage' THEN
            v_discount := (v_subtotal * v_coupon.value) / 100.0;
            IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
                v_discount := v_coupon.max_discount;
            END IF;
        ELSE
            v_discount := LEAST(v_coupon.value, v_subtotal);
        END IF;

        UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
    END IF;

    v_cfg := COALESCE((SELECT value FROM public.site_settings WHERE key = 'shipping_config'), '{}'::jsonb);
    v_free_threshold := COALESCE((v_cfg->>'freeThreshold')::NUMERIC, 10000);
    v_standard_cost := COALESCE((v_cfg->>'standardCost')::NUMERIC, 250);

    IF v_subtotal - v_discount >= v_free_threshold THEN
        v_shipping := 0;
    ELSE
        v_shipping := v_standard_cost;
    END IF;

    v_total := GREATEST(0, v_subtotal - v_discount) + v_shipping;

    INSERT INTO public.orders (
        id, order_number, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, status, payment_status, payment_method, subtotal,
        discount_amount, shipping_cost, total, coupon_code
    ) VALUES (
        v_order_id, v_order_number, p_customer_id, p_customer_name, p_customer_email, p_customer_phone,
        p_shipping_address, 'Pending', 'Pending', p_payment_method, v_subtotal,
        v_discount, v_shipping, v_total, NULLIF(TRIM(p_coupon_code), '')
    );

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_quantity := (v_item->>'quantity')::INT;

        SELECT * INTO v_variant FROM public.product_variants WHERE id = v_variant_id;
        SELECT * INTO v_product FROM public.products WHERE id = v_variant.product_id;
        v_unit_price := COALESCE(v_variant.sale_price, v_variant.price);
        v_line_total := v_unit_price * v_quantity;

        SELECT image_url INTO v_image FROM public.product_images
        WHERE product_id = v_product.id AND (variant_id = v_variant_id OR variant_id IS NULL)
        ORDER BY variant_id NULLS LAST, is_primary DESC, display_order ASC
        LIMIT 1;

        INSERT INTO public.order_items (
            order_id, product_id, variant_id, product_name, variant_size, sku,
            unit_price, quantity, line_total, image_url
        ) VALUES (
            v_order_id, v_product.id, v_variant.id, v_product.name, v_variant.size, v_variant.sku,
            v_unit_price, v_quantity, v_line_total, v_image
        );
    END LOOP;

    INSERT INTO public.payments (
        order_id, order_number, customer_name, customer_email, amount, method, status
    ) VALUES (
        v_order_id, v_order_number, p_customer_name, p_customer_email, v_total, p_payment_method, 'Pending'
    );

    INSERT INTO public.order_status_history (order_id, status, note, changed_by)
    VALUES (v_order_id, 'Pending', 'Order created and payment pending.', p_customer_id);

    IF v_discount > 0 THEN
        INSERT INTO public.coupon_usage (coupon_id, user_id, order_id, discount_amount)
        VALUES (v_coupon.id, p_customer_id, v_order_id, v_discount);
    END IF;

    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_number', v_order_number,
        'subtotal', v_subtotal,
        'discount', v_discount,
        'shipping', v_shipping,
        'total', v_total,
        'status', 'Pending'
    );
END;
$function$;

-- 3. VERIFY PAYMENT: also record the resulting order transition -----------
CREATE OR REPLACE FUNCTION public.verify_payment(p_payment_id uuid, p_staff_id uuid, p_new_status text, p_note text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_payment RECORD;
    v_order public.orders%ROWTYPE;
    v_new_order_status TEXT;
BEGIN
    IF NOT public.is_staff(p_staff_id) THEN
        RAISE EXCEPTION 'Access Denied: Only authorized staff members can verify payments.';
    END IF;

    SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment record % not found.', p_payment_id;
    END IF;

    IF p_new_status NOT IN ('Verified', 'Paid', 'Rejected', 'Failed') THEN
        RAISE EXCEPTION 'Invalid payment status: %', p_new_status;
    END IF;

    UPDATE public.payments
    SET status = p_new_status, verified_by = p_staff_id, verified_at = NOW(), updated_at = NOW()
    WHERE id = p_payment_id;

    SELECT * INTO v_order FROM public.orders WHERE id = v_payment.order_id;

    IF p_new_status IN ('Verified', 'Paid') THEN
        v_new_order_status := CASE WHEN v_order.status = 'Pending' THEN 'Confirmed' ELSE v_order.status END;
        UPDATE public.orders
        SET payment_status = CASE WHEN p_new_status = 'Paid' THEN 'Paid' ELSE 'Verified' END,
            status = v_new_order_status,
            updated_at = NOW()
        WHERE id = v_payment.order_id;
    ELSIF p_new_status IN ('Rejected', 'Failed') THEN
        v_new_order_status := v_order.status;
        UPDATE public.orders
        SET payment_status = 'Failed', updated_at = NOW()
        WHERE id = v_payment.order_id;
    END IF;

    INSERT INTO public.payment_events (payment_id, event_type, actor_id, notes)
    VALUES (
        p_payment_id,
        CASE WHEN p_new_status IN ('Verified', 'Paid') THEN 'approved' ELSE 'rejected' END,
        p_staff_id,
        COALESCE(p_note, 'Payment status updated to ' || p_new_status)
    );

    INSERT INTO public.order_status_history (order_id, status, note, changed_by)
    VALUES (
        v_payment.order_id,
        v_new_order_status,
        COALESCE(p_note, 'Payment ' || LOWER(p_new_status) || ' by staff'),
        p_staff_id
    );

    RETURN jsonb_build_object('success', true, 'payment_id', p_payment_id, 'status', p_new_status);
END;
$function$;

-- 4. TRACKING: staff writes, customers/guests read a safe projection -------
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

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found.', p_order_id;
    END IF;

    IF p_generate AND v_tracking IS NULL THEN
        LOOP
            v_tracking := 'HM-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE tracking_id = v_tracking);
        END LOOP;
    END IF;

    IF p_shipping_status IS NOT NULL AND NOT (p_shipping_status = ANY (v_valid_status)) THEN
        RAISE EXCEPTION 'Invalid shipping status: %', p_shipping_status;
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

-- Customer notes are owned by the customer and only editable before the
-- parcel leaves the boutique. Admin notes are staff-only.
CREATE OR REPLACE FUNCTION public.update_order_notes(
    p_order_id uuid,
    p_customer_notes text DEFAULT NULL,
    p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_order public.orders%ROWTYPE;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found.', p_order_id;
    END IF;

    IF public.is_staff(auth.uid()) THEN
        UPDATE public.orders
        SET admin_notes = COALESCE(p_admin_notes, admin_notes),
            customer_notes = COALESCE(p_customer_notes, customer_notes),
            updated_at = NOW()
        WHERE id = p_order_id;
    ELSIF v_order.customer_id = auth.uid()
          AND v_order.status IN ('Pending', 'Confirmed', 'Processing') THEN
        UPDATE public.orders
        SET customer_notes = COALESCE(p_customer_notes, customer_notes), updated_at = NOW()
        WHERE id = p_order_id;
    ELSE
        RAISE EXCEPTION 'You are not permitted to edit notes on this order.';
    END IF;

    RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$function$;

-- Guest / customer tracking lookup. Returns only fulfilment-safe fields, so
-- internal admin notes can never reach a public route.
CREATE OR REPLACE FUNCTION public.get_order_tracking(p_lookup text, p_email text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_order public.orders%ROWTYPE;
    v_timeline JSONB;
    v_shipment JSONB;
    v_items JSONB;
    uid UUID := auth.uid();
BEGIN
    IF p_lookup IS NULL OR TRIM(p_lookup) = '' THEN
        RETURN jsonb_build_object('found', false, 'reason', 'empty');
    END IF;

    SELECT * INTO v_order FROM public.orders
    WHERE UPPER(TRIM(order_number)) = UPPER(TRIM(p_lookup))
       OR UPPER(TRIM(COALESCE(tracking_id, ''))) = UPPER(TRIM(p_lookup))
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('found', false, 'reason', 'not_found');
    END IF;

    IF uid IS NOT NULL AND (v_order.customer_id = uid OR public.is_staff(uid)) THEN
        NULL; -- owner or staff may look up without proving the email
    ELSIF p_email IS NULL OR TRIM(p_email) = ''
          OR LOWER(TRIM(p_email)) <> LOWER(TRIM(v_order.customer_email)) THEN
        -- Same answer either way so the route cannot confirm which emails exist.
        RETURN jsonb_build_object('found', false, 'reason', 'not_found');
    END IF;

    SELECT jsonb_agg(jsonb_build_object('status', h.status, 'note', h.note, 'date', h.created_at) ORDER BY h.created_at)
    INTO v_timeline
    FROM public.order_status_history h WHERE h.order_id = v_order.id;

    SELECT jsonb_build_object(
        'courier', s.courier_name,
        'tracking_number', s.tracking_number,
        'tracking_url', s.tracking_url,
        'status', s.status,
        'estimated_delivery', s.estimated_delivery,
        'delivered_at', s.delivered_at
    ) INTO v_shipment
    FROM public.shipments s WHERE s.order_id = v_order.id LIMIT 1;

    SELECT jsonb_agg(jsonb_build_object(
        'name', i.product_name, 'size', i.variant_size, 'quantity', i.quantity,
        'unit_price', i.unit_price, 'line_total', i.line_total, 'image', i.image_url
    ) ORDER BY i.created_at) INTO v_items
    FROM public.order_items i WHERE i.order_id = v_order.id;

    RETURN jsonb_build_object(
        'found', true,
        'order_number', v_order.order_number,
        'placed_at', v_order.created_at,
        'status', v_order.status,
        'payment_status', v_order.payment_status,
        'payment_method', v_order.payment_method,
        'total', v_order.total,
        'courier', v_order.courier_name,
        'tracking_id', v_order.tracking_id,
        'tracking_url', v_order.tracking_url,
        'estimated_delivery', v_order.estimated_delivery,
        'city', v_order.shipping_address->>'city',
        'is_gift_wrap', v_order.is_gift_wrap,
        'gift_message', v_order.gift_message,
        'items', COALESCE(v_items, '[]'::jsonb),
        'timeline', COALESCE(v_timeline, '[]'::jsonb),
        'shipment', v_shipment
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_order_tracking(text, text) TO authenticated, anon;
