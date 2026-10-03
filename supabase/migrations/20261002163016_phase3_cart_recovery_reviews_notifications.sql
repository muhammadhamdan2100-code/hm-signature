-- ============================================================================
-- Phase 3 gaps that were genuinely missing, not rebuilt:
--
-- G-1 The abandoned-cart queue reported a hardcoded "Pending" state. Staff could
--       mark a reminder in the browser only, and it vanished on refresh, so a
--       reminder could be sent to the same customer twice and a recovered basket
--       was indistinguishable from one still stalled.
-- G-2 Nothing in the application produced a notification: the admin centre read a
--       table that no code ever wrote, so order, refund and low-stock events left
--       no trace for the team.
-- G-3 A customer could post any number of reviews for the same fragrance, because
--       the review table had no uniqueness beyond the primary key.
--
-- All three are additive: new columns, new indexes, new triggers and one new RPC.
-- No existing row is updated, rewritten or removed.
-- ============================================================================

-- ------------------------------------------------------- G-1 cart recovery
ALTER TABLE public.cart
    ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS recovery_updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.cart.reminder_sent_at IS
    'When the atelier last recorded a recovery reminder for this stalled bag. Written only by mark_cart_recovery, which refuses a second reminder while the bag has been untouched since.';
COMMENT ON COLUMN public.cart.recovered_at IS
    'Set once the customer came back and ordered. Never inferred from the cart row itself.';

CREATE OR REPLACE FUNCTION public.mark_cart_recovery(
    p_cart_id uuid,
    p_action text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_cart public.cart%ROWTYPE;
    v_ordered boolean;
BEGIN
    IF NOT public.is_staff(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Only staff members can record cart recovery.';
    END IF;

    IF p_action NOT IN ('reminder', 'recovered', 'reset') THEN
        RAISE EXCEPTION 'Unknown cart recovery action: %', p_action;
    END IF;

    SELECT * INTO v_cart FROM public.cart WHERE id = p_cart_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cart % not found.', p_cart_id;
    END IF;

    IF p_action = 'reminder' THEN
        IF v_cart.reminder_sent_at IS NOT NULL AND v_cart.updated_at <= v_cart.reminder_sent_at THEN
            RAISE EXCEPTION 'A reminder was already sent for this bag on % and nothing has changed since.',
                to_char(v_cart.reminder_sent_at, 'DD Mon YYYY');
        END IF;
        UPDATE public.cart
        SET reminder_sent_at = NOW(), recovered_at = NULL, recovery_updated_by = auth.uid()
        WHERE id = p_cart_id;
    ELSIF p_action = 'recovered' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.customer_id = v_cart.user_id
              AND o.created_at > COALESCE(v_cart.updated_at, o.created_at)
        ) INTO v_ordered;
        IF NOT v_ordered THEN
            RAISE EXCEPTION 'This bag cannot be marked recovered yet: % has not ordered since the cart was last changed.',
                COALESCE((SELECT email FROM public.profiles WHERE id = v_cart.user_id), 'the customer');
        END IF;
        UPDATE public.cart
        SET recovered_at = NOW(), recovery_updated_by = auth.uid()
        WHERE id = p_cart_id;
    ELSE
        UPDATE public.cart
        SET reminder_sent_at = NULL, recovered_at = NULL, recovery_updated_by = auth.uid()
        WHERE id = p_cart_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'cart_id', p_cart_id,
        'action', p_action,
        'reminder_sent_at', (SELECT reminder_sent_at FROM public.cart WHERE id = p_cart_id),
        'recovered_at', (SELECT recovered_at FROM public.cart WHERE id = p_cart_id)
    );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.mark_cart_recovery(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_cart_recovery(uuid, text) TO authenticated;

-- ------------------------------------------------------------ G-3 reviews
-- One review per signed-in customer per fragrance; anonymous rows keep their own
-- freedom because they cannot be deduplicated.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_review_customer_product
    ON public.reviews (product_id, user_id)
    WHERE user_id IS NOT NULL;

-- ---------------------------------------------------- G-2 notifications
CREATE OR REPLACE FUNCTION public.notify_staff(
    p_type text,
    p_title text,
    p_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    INSERT INTO public.notifications (user_id, recipient_email, type, title, message, read, sent_at)
    VALUES (NULL, 'system@internal', p_type, p_title, p_message, FALSE, NOW());
END;
$function$;

-- New order: one staff row. Insert happens once per order, so no duplicate risk.
CREATE OR REPLACE FUNCTION public.ntf_orders_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    PERFORM public.notify_staff(
        'Order',
        'New order ' || NEW.order_number,
        'Rs ' || trim(trailing '.' from trim(trailing '0' from NEW.total::text)) ||
        ' via ' || COALESCE(NEW.payment_method, 'unrecorded') ||
        ' from ' || COALESCE(NEW.customer_name, 'a guest') ||
        ' in ' || COALESCE(NEW.shipping_address ->> 'city', 'an unlisted city') || '.'
    );
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_orders_notify_insert ON public.orders;
CREATE TRIGGER trg_orders_notify_insert
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.ntf_orders_insert();

-- Status transitions: a staff row always, plus one row for the owner when the
-- order belongs to a signed-in customer. DISTINCT FROM keeps retries silent.
CREATE OR REPLACE FUNCTION public.ntf_orders_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    PERFORM public.notify_staff(
        'Order',
        'Order ' || NEW.order_number || ' is now ' || NEW.status,
        'Moved from ' || COALESCE(OLD.status, 'unknown') || ' to ' || NEW.status ||
        CASE WHEN NEW.tracking_id IS NOT NULL THEN ' (tracking ' || NEW.tracking_id || ')' ELSE '' END || '.'
    );

    IF NEW.customer_id IS NOT NULL AND NEW.status IN ('Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned') THEN
        INSERT INTO public.notifications (user_id, recipient_email, type, title, message, read, sent_at)
        SELECT NEW.customer_id, p.email, 'Order',
               'Your order ' || NEW.order_number || ' is ' || NEW.status,
               CASE NEW.status
                   WHEN 'Confirmed' THEN 'We have your order and payment details, and the atelier is preparing it.'
                   WHEN 'Shipped' THEN 'Your parcel has left the atelier with ' || COALESCE(NEW.courier_name, 'our courier') || '.'
                   WHEN 'Out for Delivery' THEN 'The courier is delivering your parcel today.'
                   WHEN 'Delivered' THEN 'Your parcel has been delivered. We hope you enjoy it.'
                   WHEN 'Cancelled' THEN 'Your order is cancelled and any reserved stock has returned to the atelier.'
                   WHEN 'Returned' THEN 'Your return is complete and the payment has been refunded.'
                   ELSE 'The order status has changed.'
               END,
               FALSE, NOW()
        FROM public.profiles p WHERE p.id = NEW.customer_id;
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_orders_notify_status ON public.orders;
CREATE TRIGGER trg_orders_notify_status
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.ntf_orders_status();

-- Low stock: fires only when a size falls to or below its own threshold, and at
-- most once a day per size, so repeated deductions cannot flood the centre.
CREATE OR REPLACE FUNCTION public.ntf_variant_low_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_threshold int := COALESCE(NEW.low_stock_threshold, 10);
BEGIN
    IF NEW.stock > v_threshold OR OLD.stock <= v_threshold THEN
        RETURN NEW;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.type = 'Stock'
          AND n.title = 'Low stock on ' || NEW.sku
          AND n.sent_at > NOW() - INTERVAL '24 hours'
    ) THEN
        RETURN NEW;
    END IF;

    PERFORM public.notify_staff(
        'Stock',
        'Low stock on ' || NEW.sku,
        NEW.size || ' is at ' || NEW.stock || ' unit(s), against a threshold of ' || v_threshold || '.'
    );
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_variants_notify_low_stock ON public.product_variants;
CREATE TRIGGER trg_variants_notify_low_stock
    AFTER UPDATE OF stock ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.ntf_variant_low_stock();

COMMENT ON FUNCTION public.ntf_orders_status() IS
    'Emits one staff notification per real status transition and one owner notification for the customer-facing statuses listed in the body.';
