-- ============================================================================
-- Hardening pass driven by the security, database and inventory QA audits.
-- Additive / corrective only: no table is dropped and no stored row is deleted.
--
-- F-1 CRITICAL apply_order_cancellation(uuid,text,uuid) is SECURITY DEFINER with
--        no authorization test of its own, and EXECUTE was granted to anon, so any
--        visitor could cancel any order by calling the internal helper directly.
-- F-2 CRITICAL bootstrap_primary_admin() was executable by anon: an unauthenticated
--        caller could re-run the primary-admin bootstrap on demand.
-- F-3 HIGH     Staff / session RPCs (analytics, customers, refunds, tracking writes,
--        inventory adjustment, cart, notes, proof) were executable by anon even
--        though each one self-checks auth.uid() — removed as defence in depth.
-- F-4 HIGH     verify_payment had no state machine: a Refunded payment could be
--        approved again and a Cancelled order could be marked Paid.
--        submit_payment_proof let a cancelled order re-enter the verification queue.
-- F-5 MEDIUM   orders.admin_notes (staff-only commentary) was readable by the order
--        owner through the SELECT policy. Internal notes now live in
--        order_internal_notes, which has a staff-only RLS policy, and the legacy
--        column is frozen by trigger.
-- F-6 HIGH     ON DELETE CASCADE on the audit tables (payments, refunds, order_items,
--        order_status_history, shipments, inventory_transactions) meant one product
--        or order delete silently erased the money / stock / timeline history that
--        the cancellation ledger relies on.
-- F-7 MEDIUM   payments had no uniqueness per order; shipments.tracking_number was
--        globally UNIQUE, so the 'PENDING' placeholder made a second shipment insert
--        fail.
-- F-8 MEDIUM   A delivered order that was fully refunded produced no restock, so the
--        'return' ledger type counted by get_inventory_position was always zero and
--        the Inventory Position "Restocked" figure could never be reconciled.
-- ============================================================================

-- ---------------------------------------------------------------- F-1 / F-3
REVOKE EXECUTE ON FUNCTION public.apply_order_cancellation(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_primary_admin() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.adjust_inventory_stock(uuid, integer, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_order(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_self_order(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_abandoned_carts(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_analytics(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_customers() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_inventory_position() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_cart() FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_refund(uuid, numeric, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.save_order_tracking(uuid, text, text, text, date, text, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_order_gift_options(uuid, boolean, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_payment_proof(uuid, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_order_notes(uuid, text, text) FROM anon;

-- place_order(uuid,text,text,text,jsonb,text,text,jsonb) and
-- get_order_tracking(text,text) keep anon EXECUTE: guest checkout and the public
-- tracking page are supported journeys, and both authorize inside the function.

-- ------------------------------------------------------------------ F-5 notes
CREATE TABLE IF NOT EXISTS public.order_internal_notes (
    order_id   UUID PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
    notes      TEXT NOT NULL DEFAULT '',
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.order_internal_notes IS
    'Staff-only commentary about an order. Deliberately separate from orders so a customer reading their own order through RLS cannot receive internal notes.';

ALTER TABLE public.order_internal_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff Manage Internal Order Notes" ON public.order_internal_notes;
CREATE POLICY "Staff Manage Internal Order Notes" ON public.order_internal_notes
    FOR ALL TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

REVOKE ALL ON TABLE public.order_internal_notes FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_internal_notes TO authenticated;

-- Preserve anything that was already stored on the order row, then freeze it.
INSERT INTO public.order_internal_notes (order_id, notes, updated_at)
SELECT o.id, btrim(o.admin_notes), COALESCE(o.updated_at, NOW())
FROM public.orders o
WHERE NULLIF(btrim(COALESCE(o.admin_notes, '')), '') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.order_internal_notes n WHERE n.order_id = o.id);

CREATE OR REPLACE FUNCTION public.freeze_orders_admin_notes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
    IF NULLIF(btrim(COALESCE(NEW.admin_notes, '')), '') IS NOT NULL THEN
        RAISE EXCEPTION 'Internal order notes are stored in order_internal_notes; write them through update_order_notes.';
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_orders_admin_notes_frozen ON public.orders;
CREATE TRIGGER trg_orders_admin_notes_frozen
    BEFORE INSERT OR UPDATE OF admin_notes ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.freeze_orders_admin_notes();

COMMENT ON COLUMN public.orders.admin_notes IS
    'Deprecated: kept empty by trigger trg_orders_admin_notes_frozen because the owner can read this table. Internal notes live in order_internal_notes.';

-- Notes RPC now routes staff commentary to the protected table.
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
        IF p_admin_notes IS NOT NULL THEN
            INSERT INTO public.order_internal_notes (order_id, notes, updated_by, updated_at)
            VALUES (p_order_id, btrim(p_admin_notes), auth.uid(), NOW())
            ON CONFLICT (order_id)
            DO UPDATE SET notes = EXCLUDED.notes,
                          updated_by = EXCLUDED.updated_by,
                          updated_at = NOW();
        END IF;

        UPDATE public.orders
        SET customer_notes = COALESCE(p_customer_notes, customer_notes),
            updated_at = NOW()
        WHERE id = p_order_id;
    ELSIF v_order.customer_id = auth.uid()
          AND v_order.status IN ('Pending', 'Confirmed', 'Processing') THEN
        UPDATE public.orders
        SET customer_notes = COALESCE(p_customer_notes, customer_notes),
            updated_at = NOW()
        WHERE id = p_order_id;
    ELSE
        RAISE EXCEPTION 'You are not permitted to edit notes on this order.';
    END IF;

    RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$function$;

-- ----------------------------------------------------------------- F-4 guards
-- Lock order before payment (the same order submit_payment_proof uses) so two
-- concurrent review actions cannot deadlock, then refuse illegal transitions.
CREATE OR REPLACE FUNCTION public.verify_payment(p_payment_id uuid, p_staff_id uuid, p_new_status text, p_note text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_payment public.payments%ROWTYPE;
    v_order public.orders%ROWTYPE;
    v_order_id UUID;
    v_new_order_status TEXT;
    v_actor UUID := auth.uid();
BEGIN
    -- p_staff_id is retained only so existing clients keep a matching
    -- signature; it is never trusted.
    IF v_actor IS NULL OR NOT public.is_staff(v_actor) THEN
        RAISE EXCEPTION 'Access Denied: Only authorized staff members can verify payments.';
    END IF;

    SELECT order_id INTO v_order_id FROM public.payments WHERE id = p_payment_id;
    IF v_order_id IS NULL THEN
        RAISE EXCEPTION 'Payment record % not found.', p_payment_id;
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = v_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment % belongs to a missing order, so it cannot be reviewed.', p_payment_id;
    END IF;

    SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;

    IF p_new_status NOT IN ('Verified', 'Paid', 'Rejected', 'Failed') THEN
        RAISE EXCEPTION 'Invalid payment status: %', p_new_status;
    END IF;

    IF v_payment.status = p_new_status THEN
        RETURN jsonb_build_object('success', true, 'unchanged', true,
                                  'payment_id', p_payment_id, 'status', p_new_status);
    END IF;

    IF v_payment.status = 'Refunded' THEN
        RAISE EXCEPTION 'This payment was already refunded and cannot be moved to %. Record the refund against the payment it belongs to.', p_new_status;
    END IF;

    IF p_new_status IN ('Verified', 'Paid') AND v_order.status IN ('Cancelled', 'Returned') THEN
        RAISE EXCEPTION 'Order % is %, so its payment cannot be approved.', v_order.order_number, LOWER(v_order.status);
    END IF;

    UPDATE public.payments
    SET status = p_new_status, verified_by = v_actor, verified_at = NOW(), updated_at = NOW()
    WHERE id = p_payment_id;

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

REVOKE EXECUTE ON FUNCTION public.verify_payment(uuid, uuid, text, text) FROM anon;

-- A cancelled order is closed business: evidence submitted against it must not
-- reopen the verification queue.
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

    IF v_order.status = 'Cancelled' THEN
        RAISE EXCEPTION 'This order is cancelled, so no further payment evidence is needed.';
    END IF;

    SELECT * INTO v_payment FROM public.payments WHERE order_id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'This order has no payment record yet.';
    END IF;

    v_is_cod := v_payment.method IN ('COD', 'Cash on Delivery');

    IF NOT v_is_cod AND v_reference IS NULL AND v_path IS NULL THEN
        RAISE EXCEPTION 'Enter your transaction reference or attach a payment screenshot.';
    END IF;

    IF v_payment.status IN ('Paid', 'Verified', 'Refunded', 'Rejected') THEN
        RETURN jsonb_build_object(
            'success', true,
            'unchanged', true,
            'payment_status', v_payment.status,
            'reason', 'This payment has already been reviewed.'
        );
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
        v_payment.id,
        'proof_uploaded',
        auth.uid(),
        'Payment evidence submitted' || CASE WHEN v_path IS NOT NULL THEN ' (screenshot attached)' ELSE '' END,
        jsonb_build_object('reference', v_reference, 'proof_path', v_path)
    );

    INSERT INTO public.order_status_history (order_id, status, note, changed_by)
    VALUES (
        p_order_id,
        v_order.status,
        CASE WHEN v_is_cod THEN 'Cash on delivery order confirmed by the client.'
             ELSE 'Payment evidence submitted — awaiting verification.' END,
        auth.uid()
    );

    RETURN jsonb_build_object(
        'success', true,
        'payment_status', v_next_payment_status,
        'order_id', p_order_id
    );
END;
$function$;

-- --------------------------------------------------------- F-6 audit FKs
-- History must outlive the row it describes: a delete that would erase ledger,
-- payment, refund, timeline or shipment records now fails loudly instead.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_order_id_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;

ALTER TABLE public.refunds DROP CONSTRAINT IF EXISTS refunds_order_id_fkey;
ALTER TABLE public.refunds ADD CONSTRAINT refunds_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;

ALTER TABLE public.refunds DROP CONSTRAINT IF EXISTS refunds_payment_id_fkey;
ALTER TABLE public.refunds ADD CONSTRAINT refunds_payment_id_fkey
    FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE RESTRICT;

ALTER TABLE public.payment_events DROP CONSTRAINT IF EXISTS payment_events_payment_id_fkey;
ALTER TABLE public.payment_events ADD CONSTRAINT payment_events_payment_id_fkey
    FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE RESTRICT;

ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;

ALTER TABLE public.order_status_history DROP CONSTRAINT IF EXISTS order_status_history_order_id_fkey;
ALTER TABLE public.order_status_history ADD CONSTRAINT order_status_history_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;

ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_order_id_fkey;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;

ALTER TABLE public.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_variant_id_fkey;
ALTER TABLE public.inventory_transactions ADD CONSTRAINT inventory_transactions_variant_id_fkey
    FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE RESTRICT;

-- ------------------------------------------------------------------ F-7 keys
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_order_id_key;
ALTER TABLE public.payments ADD CONSTRAINT payments_order_id_key UNIQUE (order_id);

ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_tracking_number_key;
DROP INDEX IF EXISTS public.shipments_tracking_number_key;

-- Real courier references are unique while they are live, but a placeholder such
-- as PENDING is not a reference at all.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_shipments_live_tracking
    ON public.shipments (lower(btrim(tracking_number)))
    WHERE tracking_number IS NOT NULL
      AND btrim(tracking_number) <> ''
      AND upper(btrim(tracking_number)) NOT IN ('PENDING', 'TO_GENERATE', 'GENERATE', 'N/A');

CREATE INDEX IF NOT EXISTS idx_shipments_live_tracking
    ON public.shipments (lower(btrim(tracking_number)));

-- ------------------------------------------------------------------ F-8 restock
CREATE OR REPLACE FUNCTION public.record_refund(
    p_payment_id UUID,
    p_amount NUMERIC,
    p_currency TEXT DEFAULT 'PKR',
    p_reference TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'processed'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_payment public.payments%ROWTYPE;
    v_order public.orders%ROWTYPE;
    v_refunded NUMERIC(12, 2);
    v_new_total NUMERIC(12, 2);
    v_refund_id UUID;
    v_fully BOOLEAN := FALSE;
    v_restocked BOOLEAN := FALSE;
    v_item RECORD;
    v_old_stock INT;
    v_new_stock INT;
BEGIN
    IF NOT public.is_staff(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Only staff members can record refunds.';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Refund amount must be greater than zero.';
    END IF;
    IF p_status NOT IN ('pending', 'processed', 'failed', 'rejected') THEN
        RAISE EXCEPTION 'Invalid refund status: %', p_status;
    END IF;

    SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment record % not found.', p_payment_id;
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = v_payment.order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'The order for payment % no longer exists.', p_payment_id;
    END IF;

    IF v_payment.status NOT IN ('Paid', 'Verified') THEN
        RAISE EXCEPTION 'Only paid or verified payments can be refunded (current status: %).', v_payment.status;
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO v_refunded
    FROM public.refunds
    WHERE payment_id = p_payment_id AND status IN ('pending', 'processed');

    v_new_total := v_refunded + p_amount;
    IF v_new_total > v_payment.amount THEN
        RAISE EXCEPTION 'Refund exceeds paid amount. Already refunded: %, payment total: %, requested: %.',
            v_refunded, v_payment.amount, p_amount;
    END IF;

    INSERT INTO public.refunds (
        payment_id, order_id, amount, currency, status, refund_reference, reason, notes,
        processed_by, refunded_at, created_at, updated_at
    ) VALUES (
        p_payment_id, v_payment.order_id, p_amount, p_currency, p_status, p_reference, p_reason, p_notes,
        auth.uid(), CASE WHEN p_status = 'processed' THEN NOW() ELSE NULL END, NOW(), NOW()
    )
    RETURNING id INTO v_refund_id;

    INSERT INTO public.payment_events (payment_id, event_type, actor_id, notes, payload)
    VALUES (
        p_payment_id, 'refund_issued', auth.uid(),
        COALESCE(p_reason, 'Refund recorded') || ' (Rs. ' || p_amount || ' ' || p_currency || ')',
        jsonb_build_object('refund_id', v_refund_id, 'amount', p_amount, 'currency', p_currency, 'status', p_status)
    );

    IF p_status = 'processed' AND v_new_total >= v_payment.amount THEN
        v_fully := TRUE;

        UPDATE public.payments
        SET status = 'Refunded', updated_at = NOW()
        WHERE id = p_payment_id;

        UPDATE public.orders
        SET payment_status = 'Refunded',
            status = CASE WHEN status NOT IN ('Cancelled', 'Returned') THEN 'Returned' ELSE status END,
            updated_at = NOW()
        WHERE id = v_payment.order_id;

        INSERT INTO public.order_status_history (order_id, status, note, changed_by)
        SELECT v_payment.order_id,
               CASE WHEN o.status = 'Cancelled' THEN 'Cancelled'::text ELSE 'Returned'::text END,
               'Order fully refunded',
               auth.uid()
        FROM public.orders o WHERE o.id = v_payment.order_id;

        -- Only a Delivered order can give the bottles back; a Cancelled order was
        -- already released by apply_order_cancellation, and the ledger reference
        -- keeps this exactly-once if a refund is ever re-processed.
        IF v_order.status = 'Delivered'
           AND NOT EXISTS (
               SELECT 1 FROM public.inventory_transactions
               WHERE reference_id = v_order.order_number AND transaction_type = 'return'
           ) THEN
            FOR v_item IN
                SELECT variant_id, quantity FROM public.order_items
                WHERE order_id = v_payment.order_id AND variant_id IS NOT NULL
            LOOP
                SELECT stock INTO v_old_stock FROM public.product_variants
                WHERE id = v_item.variant_id FOR UPDATE;
                IF v_old_stock IS NOT NULL THEN
                    v_new_stock := v_old_stock + v_item.quantity;
                    UPDATE public.product_variants SET stock = v_new_stock, updated_at = NOW()
                    WHERE id = v_item.variant_id;

                    INSERT INTO public.inventory_transactions (
                        variant_id, transaction_type, quantity_change, previous_stock, new_stock,
                        reference_id, created_by, notes
                    ) VALUES (
                        v_item.variant_id, 'return', v_item.quantity, v_old_stock, v_new_stock,
                        v_order.order_number, auth.uid(), 'Stock restored on the fully refunded delivery'
                    );
                    v_restocked := TRUE;
                END IF;
            END LOOP;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'refund_id', v_refund_id,
        'refunded_total', v_new_total,
        'payment_amount', v_payment.amount,
        'fully_refunded', v_fully,
        'restocked', v_restocked
    );
END;
$function$;

-- --------------------------------------------------------------- legacy table
COMMENT ON TABLE public.inventory IS
    'Legacy placeholder table: no application code, function or view reads it and it holds no rows. Bottle-level stock lives in product_variants with the audit trail in inventory_transactions.';
