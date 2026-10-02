-- ====================================================================
-- Security corrections from the RLS audit. Each closes a path where a caller
-- could name the actor or the owner rather than being bound to their own JWT.
-- No data is rewritten; grants and policies only.
-- ====================================================================

-- 1. verify_payment: the authorizer must be the CALLER, not a parameter ----
CREATE OR REPLACE FUNCTION public.verify_payment(p_payment_id uuid, p_staff_id uuid, p_new_status text, p_note text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_payment public.payments%ROWTYPE;
    v_order public.orders%ROWTYPE;
    v_new_order_status TEXT;
    v_actor UUID := auth.uid();
BEGIN
    -- p_staff_id is retained only so existing clients keep a matching
    -- signature; it is never trusted.
    IF v_actor IS NULL OR NOT public.is_staff(v_actor) THEN
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
    SET status = p_new_status, verified_by = v_actor, verified_at = NOW(), updated_at = NOW()
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
        UPDATE public.orders SET payment_status = 'Failed', updated_at = NOW()
        WHERE id = v_payment.order_id;
    END IF;

    INSERT INTO public.payment_events (payment_id, event_type, actor_id, notes)
    VALUES (
        p_payment_id,
        CASE WHEN p_new_status IN ('Verified', 'Paid') THEN 'approved' ELSE 'rejected' END,
        v_actor,
        COALESCE(p_note, 'Payment status updated to ' || p_new_status)
    );

    INSERT INTO public.order_status_history (order_id, status, note, changed_by)
    VALUES (v_payment.order_id, v_new_order_status,
            COALESCE(p_note, 'Payment ' || LOWER(p_new_status) || ' by staff'), v_actor);

    RETURN jsonb_build_object('success', true, 'payment_id', p_payment_id, 'status', p_new_status);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.verify_payment(uuid, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_payment(uuid, uuid, text, text) TO authenticated;

-- 2. ORDER INSERT: a shopper may only create orders for themselves ----------
DROP POLICY IF EXISTS "Customers insert orders" ON public.orders;
CREATE POLICY "Customers insert orders" ON public.orders
    FOR INSERT
    TO authenticated
    WITH CHECK (customer_id = auth.uid() OR public.is_staff(auth.uid()));

-- 3. REVIEWS: identity, moderation state and trust flags are server-owned --
CREATE OR REPLACE FUNCTION public.pin_review_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    -- Self-service submissions are always pending and never self-certified.
    NEW.status := 'Pending';
    NEW.verified_purchase := FALSE;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_pin_review_defaults ON public.reviews;
CREATE TRIGGER trg_pin_review_defaults
    BEFORE INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.pin_review_defaults();

DROP POLICY IF EXISTS "Users Create Reviews" ON public.reviews;
CREATE POLICY "Users Create Reviews" ON public.reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- 4. CARTS: strictly the owner's rows --------------------------------------
DROP POLICY IF EXISTS "User Manage Own Cart" ON public.cart;
CREATE POLICY "User Manage Own Cart" ON public.cart
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User Manage Own Cart Items" ON public.cart_items;
CREATE POLICY "User Manage Own Cart Items" ON public.cart_items
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.cart c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.cart c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()));

-- Staff need read access for abandoned-basket reporting.
DROP POLICY IF EXISTS "Staff Read Carts" ON public.cart;
CREATE POLICY "Staff Read Carts" ON public.cart
    FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff Read Cart Items" ON public.cart_items;
CREATE POLICY "Staff Read Cart Items" ON public.cart_items
    FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- 5. place_order: bind the buyer to the session and respect product status --
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
    v_buyer UUID := auth.uid();
BEGIN
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Your bag is empty. Add a fragrance before placing an order.';
    END IF;

    -- A signed-in session may only order for itself; guests pass NULL.
    IF v_buyer IS NOT NULL AND p_customer_id IS NOT NULL AND p_customer_id <> v_buyer
       AND NOT public.is_staff(v_buyer) THEN
        RAISE EXCEPTION 'Orders can only be placed for the signed-in account.';
    END IF;
    IF v_buyer IS NULL AND p_customer_id IS NOT NULL AND NOT public.is_staff(NULL) THEN
        v_buyer := NULL;  -- anonymous checkout keeps the supplied id only as data
    END IF;

    IF p_payment_method NOT IN ('COD', 'Cash on Delivery', 'JazzCash', 'Raast', 'Bank Transfer', 'PayFast') THEN
        RAISE EXCEPTION 'Unsupported payment method: %', p_payment_method;
    END IF;

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
        IF NOT FOUND OR NOT v_product.active THEN
            RAISE EXCEPTION '% is no longer offered.', v_variant.sku;
        END IF;

        v_unit_price := COALESCE(v_variant.sale_price, v_variant.price);
        v_line_total := v_unit_price * v_quantity;
        v_subtotal := v_subtotal + v_line_total;

        UPDATE public.product_variants SET stock = stock - v_quantity, updated_at = NOW()
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

        IF v_coupon.per_user_limit > 0 AND v_buyer IS NOT NULL THEN
            SELECT COUNT(*) INTO v_personal_uses FROM public.coupon_usage
            WHERE coupon_id = v_coupon.id AND user_id = v_buyer;
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
        v_order_id, v_order_number, v_buyer, p_customer_name, COALESCE(p_customer_email, ''), p_customer_phone,
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
        v_order_id, v_order_number, p_customer_name, COALESCE(p_customer_email, ''), v_total, p_payment_method, 'Pending'
    );

    INSERT INTO public.order_status_history (order_id, status, note, changed_by)
    VALUES (v_order_id, 'Pending', 'Order created and payment pending.', v_buyer);

    IF v_discount > 0 THEN
        INSERT INTO public.coupon_usage (coupon_id, user_id, order_id, discount_amount)
        VALUES (v_coupon.id, v_buyer, v_order_id, v_discount);
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

-- 6. Only a super admin may change roles or primary-admin flags -------------
CREATE OR REPLACE FUNCTION public.enforce_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;  -- system / migration context
    END IF;

    IF public.is_super_admin() THEN
        RETURN NEW;
    END IF;

    NEW.role := OLD.role;
    NEW.is_primary_admin := OLD.is_primary_admin;

    -- Staff who are not super admins may still activate or suspend accounts.
    IF public.is_staff(auth.uid()) THEN
        RETURN NEW;
    END IF;

    NEW.status := OLD.status;
    RETURN NEW;
END;
$function$;

-- 7. Payment evidence paths must be our own storage bucket -----------------
CREATE OR REPLACE FUNCTION public.submit_payment_proof(
    p_order_id uuid,
    p_reference text DEFAULT NULL,
    p_proof_path text DEFAULT NULL,
    p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_order public.orders%ROWTYPE;
    v_payment public.payments%ROWTYPE;
    v_reference TEXT := NULLIF(TRIM(COALESCE(p_reference, '')), '');
    v_path TEXT := NULLIF(TRIM(COALESCE(p_proof_path, '')), '');
    v_is_cod BOOLEAN;
    v_next_payment_status TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Please sign in to submit payment evidence.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    IF v_order.customer_id IS DISTINCT FROM auth.uid() AND NOT public.is_staff(auth.uid()) THEN
        RAISE EXCEPTION 'You can only submit payment evidence for your own order.';
    END IF;

    SELECT * INTO v_payment FROM public.payments WHERE order_id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'This order has no payment record yet.';
    END IF;

    -- Only a bucket-relative proof path inside proofs/ is accepted, so the
    -- field cannot be used to plant an arbitrary external link.
    IF v_path IS NOT NULL AND v_path !~ '^proofs/[A-Za-z0-9._/-]+$' THEN
        RAISE EXCEPTION 'Payment evidence must be uploaded through the checkout form.';
    END IF;

    v_is_cod := v_payment.method IN ('COD', 'Cash on Delivery');

    IF NOT v_is_cod AND v_reference IS NULL AND v_path IS NULL THEN
        RAISE EXCEPTION 'Enter your transaction reference or attach a payment screenshot.';
    END IF;

    IF v_payment.status IN ('Paid', 'Verified', 'Refunded', 'Rejected') THEN
        RETURN jsonb_build_object('success', true, 'unchanged', true, 'payment_status', v_payment.status);
    END IF;

    v_next_payment_status := CASE WHEN v_is_cod THEN 'Pending' ELSE 'Verification Pending' END;

    UPDATE public.payments
    SET reference_id = COALESCE(v_reference, reference_id),
        proof_file_path = COALESCE(v_path, proof_file_path),
        proof_note = COALESCE(NULLIF(TRIM(COALESCE(p_note, '')), ''), proof_note),
        status = v_next_payment_status,
        updated_at = NOW()
    WHERE id = v_payment.id;

    UPDATE public.orders
    SET payment_status = v_next_payment_status,
        payment_proof_url = COALESCE(v_path, payment_proof_url),
        updated_at = NOW()
    WHERE id = p_order_id;

    INSERT INTO public.payment_events (payment_id, event_type, actor_id, notes, payload)
    VALUES (
        v_payment.id, 'proof_uploaded', auth.uid(),
        'Payment evidence submitted' || CASE WHEN v_path IS NOT NULL THEN ' (screenshot attached)' ELSE '' END,
        jsonb_build_object('reference', v_reference, 'proof_path', v_path)
    );

    INSERT INTO public.order_status_history (order_id, status, note, changed_by)
    VALUES (
        p_order_id, v_order.status,
        CASE WHEN v_is_cod THEN 'Cash on delivery order confirmed by the client.'
             ELSE 'Payment evidence submitted — awaiting verification.' END,
        auth.uid()
    );

    RETURN jsonb_build_object('success', true, 'payment_status', v_next_payment_status, 'order_id', p_order_id);
END;
$function$;
