-- ====================================================================
-- Order cancellation (idempotent, with exactly-once stock restoration)
-- and a proper refund architecture for manual Pakistani payment methods.
-- Additive only: no existing object is dropped or rewritten destructively.
-- ====================================================================

-- 1. REFUND RECORDS ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'PKR',
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('pending', 'processed', 'failed', 'rejected')),
    refund_reference TEXT,
    reason TEXT,
    notes TEXT,
    processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON public.refunds(order_id);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff Manage Refunds" ON public.refunds;
CREATE POLICY "Staff Manage Refunds" ON public.refunds
  FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Customers may see that a refund exists for their own order (status/amount);
-- internal notes remain visible only to staff in the admin UI.
DROP POLICY IF EXISTS "Customers Read Own Refunds" ON public.refunds;
CREATE POLICY "Customers Read Own Refunds" ON public.refunds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = refunds.order_id
        AND o.customer_id = auth.uid()
    )
  );

-- 2. IDEMPOTENT ORDER CANCELLATION ------------------------------------
-- Marks the order Cancelled (history preserved), writes a status-history
-- entry, fails any still-pending payment, and restores stock EXACTLY ONCE
-- guarded by the inventory_transactions ledger (cancellation_release).
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id UUID, p_note TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_item RECORD;
    v_old_stock INT;
    v_new_stock INT;
    v_released BOOLEAN := FALSE;
    v_restocked BOOLEAN := FALSE;
BEGIN
    IF NOT public.is_staff(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Only staff members can cancel orders.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found.', p_order_id;
    END IF;

    -- Idempotency: already cancelled → no-ops (no double restock, no dup history)
    IF v_order.status = 'Cancelled' THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_cancelled', true,
            'order_number', v_order.order_number,
            'restocked', false
        );
    END IF;

    UPDATE public.orders
    SET status = 'Cancelled', updated_at = NOW()
    WHERE id = p_order_id;

    INSERT INTO public.order_status_history (order_id, status, note, changed_by)
    VALUES (p_order_id, 'Cancelled', COALESCE(p_note, 'Order cancelled by staff'), auth.uid());

    -- Pending/unverified payments on a cancelled order can never be collected.
    UPDATE public.payments
    SET status = 'Failed', updated_at = NOW()
    WHERE order_id = p_order_id
      AND status IN ('Pending', 'Verification Pending');
    UPDATE public.orders
    SET payment_status = 'Failed'
    WHERE id = p_order_id
      AND payment_status IN ('Pending', 'Verification Pending');

    -- Restore stock exactly once, guarded by the ledger for this order number.
    SELECT EXISTS (
        SELECT 1 FROM public.inventory_transactions
        WHERE reference_id = v_order.order_number
          AND transaction_type = 'cancellation_release'
    ) INTO v_released;

    IF NOT v_released THEN
        FOR v_item IN
            SELECT variant_id, quantity FROM public.order_items
            WHERE order_id = p_order_id AND variant_id IS NOT NULL
        LOOP
            SELECT stock INTO v_old_stock FROM public.product_variants WHERE id = v_item.variant_id FOR UPDATE;
            IF v_old_stock IS NOT NULL THEN
                v_new_stock := v_old_stock + v_item.quantity;
                UPDATE public.product_variants
                SET stock = v_new_stock, updated_at = NOW()
                WHERE id = v_item.variant_id;

                INSERT INTO public.inventory_transactions (
                    variant_id, transaction_type, quantity_change, previous_stock, new_stock,
                    reference_id, created_by, notes
                ) VALUES (
                    v_item.variant_id, 'cancellation_release', v_item.quantity, v_old_stock, v_new_stock,
                    v_order.order_number, auth.uid(), 'Stock restored on order cancellation'
                );
                v_restocked := TRUE;
            END IF;
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'already_cancelled', false,
        'order_number', v_order.order_number,
        'restocked', v_restocked
    );
END;
$$;

-- 3. MANUAL REFUND RECORDING -------------------------------------------
-- Provider-ready: records a refund against an existing payment; no external
-- payment API is called. Enforces: only paid/verified payments, refund total
-- never exceeds the paid amount, and status transitions on full refund.
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
AS $$
DECLARE
    v_payment public.payments%ROWTYPE;
    v_refunded NUMERIC(12, 2);
    v_new_total NUMERIC(12, 2);
    v_refund_id UUID;
    v_fully BOOLEAN := FALSE;
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
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'refund_id', v_refund_id,
        'refunded_total', v_new_total,
        'payment_amount', v_payment.amount,
        'fully_refunded', v_fully
    );
END;
$$;
