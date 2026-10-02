-- Fix place_order RPC: referencing v_coupon.id when no coupon row was found
-- raises 'record "v_coupon" is not assigned yet' (500) for every coupon-less order.
-- v_discount > 0 can only occur when a coupon was found, so the record access is redundant.

CREATE OR REPLACE FUNCTION public.place_order(
    p_customer_id UUID,
    p_customer_name TEXT,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_shipping_address JSONB,
    p_payment_method TEXT,
    p_coupon_code TEXT DEFAULT NULL,
    p_items JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB AS $$
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
BEGIN
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cannot place order with an empty cart.';
    END IF;

    -- Generate unique order number
    v_order_number := 'HMS-' || to_char(NOW(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
    v_order_id := gen_random_uuid();

    -- Calculate subtotal & validate stock per variant
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_quantity := (v_item->>'quantity')::INT;

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Invalid item quantity %', v_quantity;
        END IF;

        -- Lock variant row for update
        SELECT * INTO v_variant FROM public.product_variants WHERE id = v_variant_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product variant % not found.', v_variant_id;
        END IF;

        IF NOT v_variant.active THEN
            RAISE EXCEPTION 'Product variant SKU % is currently unavailable.', v_variant.sku;
        END IF;

        IF v_variant.stock < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for SKU %. Available: %, Requested: %', v_variant.sku, v_variant.stock, v_quantity;
        END IF;

        SELECT * INTO v_product FROM public.products WHERE id = v_variant.product_id;

        -- Determine server-side authoritative price
        v_unit_price := COALESCE(v_variant.sale_price, v_variant.price);
        v_line_total := v_unit_price * v_quantity;
        v_subtotal := v_subtotal + v_line_total;

        -- Deduct stock safely
        UPDATE public.product_variants
        SET stock = stock - v_quantity,
            updated_at = NOW()
        WHERE id = v_variant_id;

        -- Audit Inventory Transaction
        INSERT INTO public.inventory_transactions (
            variant_id, transaction_type, quantity_change, previous_stock, new_stock, reference_id, notes
        ) VALUES (
            v_variant_id, 'sale', -v_quantity, v_variant.stock, v_variant.stock - v_quantity, v_order_number, 'Customer Order Acquisition'
        );
    END LOOP;

    -- Calculate Coupon Discount if applicable
    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
        SELECT * INTO v_coupon FROM public.coupons
        WHERE UPPER(code) = UPPER(TRIM(p_coupon_code)) AND active = TRUE FOR UPDATE;

        IF FOUND THEN
            IF (v_coupon.start_date IS NULL OR NOW() >= v_coupon.start_date) AND
               (v_coupon.end_date IS NULL OR NOW() <= v_coupon.end_date) AND
               (v_coupon.min_spend IS NULL OR v_subtotal >= v_coupon.min_spend) AND
               (v_coupon.usage_limit IS NULL OR v_coupon.used_count < v_coupon.usage_limit) THEN

                IF v_coupon.type = 'percentage' THEN
                    v_discount := (v_subtotal * v_coupon.value) / 100.0;
                    IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
                        v_discount := v_coupon.max_discount;
                    END IF;
                ELSE
                    v_discount := LEAST(v_coupon.value, v_subtotal);
                END IF;

                -- Update coupon usage count
                UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
            END IF;
        END IF;
    END IF;

    -- Calculate Shipping Fee (Free for orders >= Rs 10,000, else standard Rs 250)
    IF v_subtotal >= 10000 THEN
        v_shipping := 0;
    ELSE
        v_shipping := 250;
    END IF;

    v_total := GREATEST(0, v_subtotal - v_discount) + v_shipping;

    -- Create Order Record
    INSERT INTO public.orders (
        id, order_number, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, status, payment_status, payment_method, subtotal,
        discount_amount, shipping_cost, total, coupon_code
    ) VALUES (
        v_order_id, v_order_number, p_customer_id, p_customer_name, p_customer_email, p_customer_phone,
        p_shipping_address, 'Pending', 'Pending', p_payment_method, v_subtotal,
        v_discount, v_shipping, v_total, p_coupon_code
    );

    -- Create Order Items Snapshots
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_quantity := (v_item->>'quantity')::INT;

        SELECT * INTO v_variant FROM public.product_variants WHERE id = v_variant_id;
        SELECT * INTO v_product FROM public.products WHERE id = v_variant.product_id;

        v_unit_price := COALESCE(v_variant.sale_price, v_variant.price);
        v_line_total := v_unit_price * v_quantity;

        INSERT INTO public.order_items (
            order_id, product_id, variant_id, product_name, variant_size, sku, unit_price, quantity, line_total
        ) VALUES (
            v_order_id, v_product.id, v_variant.id, v_product.name, v_variant.size, v_variant.sku, v_unit_price, v_quantity, v_line_total
        );
    END LOOP;

    -- Create Initial Payment Record
    INSERT INTO public.payments (
        order_id, order_number, customer_name, customer_email, amount, method, status
    ) VALUES (
        v_order_id, v_order_number, p_customer_name, p_customer_email, v_total, p_payment_method, 'Pending'
    );

    -- Create Order Status History
    INSERT INTO public.order_status_history (
        order_id, status, note
    ) VALUES (
        v_order_id, 'Pending', 'Order created and payment pending.'
    );

    -- Create Coupon Usage Record if applied (v_discount > 0 implies a coupon was found)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
