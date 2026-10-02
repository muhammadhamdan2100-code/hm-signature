-- ====================================================================
-- Customer self-cancellation, verified-purchase reviews, and the indexes the
-- new tracking / discovery / analytics paths rely on.
-- ====================================================================

-- 1. SHARED CANCELLATION ENGINE -----------------------------------------
-- Staff and customer-initiated cancellations must behave identically, so the
-- state transition lives in one helper.
CREATE OR REPLACE FUNCTION public.apply_order_cancellation(p_order_id uuid, p_note text, p_actor uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_order public.orders%ROWTYPE;
    v_item RECORD;
    v_old_stock INT;
    v_new_stock INT;
    v_released BOOLEAN := FALSE;
    v_restocked BOOLEAN := FALSE;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found.', p_order_id;
    END IF;

    IF v_order.status = 'Cancelled' THEN
        RETURN jsonb_build_object(
            'success', true, 'already_cancelled', true,
            'order_number', v_order.order_number, 'restocked', false
        );
    END IF;

    UPDATE public.orders SET status = 'Cancelled', updated_at = NOW() WHERE id = p_order_id;

    INSERT INTO public.order_status_history (order_id, status, note, changed_by)
    VALUES (p_order_id, 'Cancelled', COALESCE(p_note, 'Order cancelled'), p_actor);

    UPDATE public.payments SET status = 'Failed', updated_at = NOW()
    WHERE order_id = p_order_id AND status IN ('Pending', 'Verification Pending');

    UPDATE public.orders SET payment_status = 'Failed'
    WHERE id = p_order_id AND payment_status IN ('Pending', 'Verification Pending');

    SELECT EXISTS (
        SELECT 1 FROM public.inventory_transactions
        WHERE reference_id = v_order.order_number AND transaction_type = 'cancellation_release'
    ) INTO v_released;

    IF NOT v_released THEN
        FOR v_item IN
            SELECT variant_id, quantity FROM public.order_items
            WHERE order_id = p_order_id AND variant_id IS NOT NULL
        LOOP
            SELECT stock INTO v_old_stock FROM public.product_variants WHERE id = v_item.variant_id FOR UPDATE;
            IF v_old_stock IS NOT NULL THEN
                v_new_stock := v_old_stock + v_item.quantity;
                UPDATE public.product_variants SET stock = v_new_stock, updated_at = NOW()
                WHERE id = v_item.variant_id;

                INSERT INTO public.inventory_transactions (
                    variant_id, transaction_type, quantity_change, previous_stock, new_stock,
                    reference_id, created_by, notes
                ) VALUES (
                    v_item.variant_id, 'cancellation_release', v_item.quantity, v_old_stock, v_new_stock,
                    v_order.order_number, p_actor, 'Stock restored on order cancellation'
                );
                v_restocked := TRUE;
            END IF;
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 'already_cancelled', false,
        'order_number', v_order.order_number, 'restocked', v_restocked
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id UUID, p_note TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    IF NOT public.is_staff(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Only staff members can cancel orders.';
    END IF;
    RETURN public.apply_order_cancellation(p_order_id, COALESCE(p_note, 'Order cancelled by staff'), auth.uid());
END;
$function$;

-- A client may cancel their own order only while it is still unconfirmed and
-- nothing has been collected.
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

    IF v_order.payment_status IN ('Paid', 'Verified', 'Refunded') THEN
        RAISE EXCEPTION 'A settled payment cannot be reversed from here. Please request a refund through the concierge.';
    END IF;

    RETURN public.apply_order_cancellation(
        p_order_id,
        COALESCE(NULLIF(TRIM(p_reason), ''), 'Cancelled by the client'),
        auth.uid()
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.cancel_self_order(uuid, text) TO authenticated;

-- 2. VERIFIED PURCHASE ---------------------------------------------------
-- Marked server-side from delivered orders so the storefront badge is truth.
CREATE OR REPLACE FUNCTION public.tag_verified_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    IF NEW.user_id IS NOT NULL AND NEW.verified_purchase IS DISTINCT FROM TRUE THEN
        NEW.verified_purchase := EXISTS (
            SELECT 1
            FROM public.order_items oi
            JOIN public.orders o ON o.id = oi.order_id
            WHERE o.customer_id = NEW.user_id
              AND o.status = 'Delivered'
              AND oi.product_id = NEW.product_id
        );
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_reviews_verified_purchase ON public.reviews;
CREATE TRIGGER trg_reviews_verified_purchase
    BEFORE INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.tag_verified_purchase();

-- 3. INDEXES -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_tracking_id ON public.orders (upper(tracking_id)) WHERE tracking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON public.orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_variant_date ON public.inventory_transactions (variant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds (status);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items (cart_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_user ON public.coupon_usage (coupon_id, user_id);
