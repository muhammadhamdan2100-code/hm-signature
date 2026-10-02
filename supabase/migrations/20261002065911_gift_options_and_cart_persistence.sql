-- ====================================================================
-- Gift options for the ordering client, and server-side cart persistence so a
-- bag survives reloads and moves with the customer across sessions.
-- ====================================================================

-- 1. GIFT WRAP / GIFT MESSAGE -------------------------------------------
-- The client may only touch its own order, and only before dispatch.
CREATE OR REPLACE FUNCTION public.set_order_gift_options(
    p_order_id uuid,
    p_is_gift_wrap boolean,
    p_gift_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_order public.orders%ROWTYPE;
    v_message TEXT := NULLIF(TRIM(COALESCE(p_gift_message, '')), '');
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Please sign in to change gift options.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    IF v_order.customer_id IS DISTINCT FROM auth.uid() AND NOT public.is_staff(auth.uid()) THEN
        RAISE EXCEPTION 'You can only change gift options on your own order.';
    END IF;

    IF NOT public.is_staff(auth.uid())
       AND v_order.status NOT IN ('Pending', 'Confirmed', 'Processing') THEN
        RAISE EXCEPTION 'Gift options can no longer be changed on this order.';
    END IF;

    IF v_message IS NOT NULL AND char_length(v_message) > 500 THEN
        RAISE EXCEPTION 'Gift messages are limited to 500 characters.';
    END IF;

    UPDATE public.orders
    SET is_gift_wrap = COALESCE(p_is_gift_wrap, false),
        gift_message = CASE WHEN COALESCE(p_is_gift_wrap, false) THEN v_message ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'is_gift_wrap', COALESCE(p_is_gift_wrap, false));
END;
$function$;

GRANT EXECUTE ON FUNCTION public.set_order_gift_options(uuid, boolean, text) TO authenticated;

-- 2. CART PERSISTENCE ---------------------------------------------------
-- One bag per signed-in customer, one line per bottle size.
WITH ranked AS (
    SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) AS rn
    FROM public.cart
    WHERE user_id IS NOT NULL
)
DELETE FROM public.cart c
WHERE c.id IN (SELECT id FROM ranked WHERE rn > 1);

DELETE FROM public.cart_items ci
WHERE ci.cart_id NOT IN (SELECT id FROM public.cart);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_cart_user ON public.cart (user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_cart_item ON public.cart_items (cart_id, variant_id) WHERE variant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_cart_item_product ON public.cart_items (cart_id, product_id) WHERE variant_id IS NULL AND product_id IS NOT NULL;

-- Priced from the catalogue, so the bag never trusts a client-side total.
CREATE OR REPLACE FUNCTION public.get_my_cart()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_cart UUID;
    v_items JSONB;
    v_subtotal NUMERIC(12, 2) := 0;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('cart_id', NULL, 'items', '[]'::jsonb, 'subtotal', 0);
    END IF;

    SELECT id INTO v_cart FROM public.cart WHERE user_id = auth.uid() ORDER BY updated_at DESC LIMIT 1;
    IF v_cart IS NULL THEN
        RETURN jsonb_build_object('cart_id', NULL, 'items', '[]'::jsonb, 'subtotal', 0);
    END IF;

    SELECT jsonb_agg(jsonb_build_object(
        'id', ci.id,
        'product_id', ci.product_id,
        'variant_id', ci.variant_id,
        'quantity', ci.quantity,
        'product_name', p.name,
        'slug', p.slug,
        'size', v.size,
        'unit_price', COALESCE(v.sale_price, v.price, p.base_price),
        'line_total', COALESCE(v.sale_price, v.price, p.base_price) * ci.quantity,
        'image', (
            SELECT pi.image_url FROM public.product_images pi
            WHERE pi.product_id = p.id
            ORDER BY pi.variant_id NULLS LAST, pi.is_primary DESC, pi.display_order ASC
            LIMIT 1
        )
    ) ORDER BY ci.created_at) INTO v_items
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    LEFT JOIN public.product_variants v ON v.id = ci.variant_id
    WHERE ci.cart_id = v_cart AND p.active = TRUE;

    SELECT COALESCE(SUM((each->>'line_total')::numeric), 0) INTO v_subtotal FROM jsonb_array_elements(COALESCE(v_items, '[]'::jsonb)) each;

    RETURN jsonb_build_object(
        'cart_id', v_cart,
        'items', COALESCE(v_items, '[]'::jsonb),
        'subtotal', COALESCE(v_subtotal, 0)
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_my_cart() TO authenticated;
