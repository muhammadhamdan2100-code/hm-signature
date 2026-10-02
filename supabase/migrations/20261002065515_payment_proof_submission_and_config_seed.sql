-- ====================================================================
-- Customer-submitted payment evidence must be written server-side: RLS gives
-- customers no UPDATE rights on payments/orders, so the previous client-side
-- patch after checkout silently did nothing and proofs never reached staff.
-- ====================================================================

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
        COALESCE(
            'Payment evidence submitted' || CASE WHEN v_path IS NOT NULL THEN ' (screenshot attached)' ELSE '' END,
            'Payment evidence submitted'
        ),
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

GRANT EXECUTE ON FUNCTION public.submit_payment_proof(uuid, text, text, text) TO authenticated;

-- Configurable manual payment instructions and delivery pricing.
INSERT INTO public.site_settings (key, value, description)
VALUES (
    'payment_config',
    '{"methods": [
        {"id": "Cash on Delivery", "label": "Cash on Delivery", "description": "Pay cash upon courier delivery", "enabled": true, "requiresReference": false, "requiresProof": false, "referenceLabel": "", "referencePlaceholder": "", "instructionHeading": "CASH ON DELIVERY", "details": [{"label": "Amount to hand over", "value": "Your order total, collected at the door"}, {"label": "Courier", "value": "HM Signature concierge delivery"}]},
        {"id": "JazzCash", "label": "JazzCash Mobile Wallet", "description": "Instant mobile wallet transfer", "enabled": true, "requiresReference": true, "requiresProof": true, "referenceLabel": "Transaction Reference / TID (12 Digits)", "referencePlaceholder": "e.g. 098234112984", "instructionHeading": "JAZZCASH PAYMENT INSTRUCTIONS", "details": [{"label": "Account Number", "value": "0300 8472910", "copyValue": "03008472910"}, {"label": "Account Title", "value": "HM Signature Atelier"}]},
        {"id": "Raast", "label": "Raast Instant Transfer", "description": "State Bank zero-fee Raast ID", "enabled": true, "requiresReference": true, "requiresProof": true, "referenceLabel": "Raast Transaction Reference ID", "referencePlaceholder": "e.g. RAAST-992381", "instructionHeading": "RAAST INSTANT PAYMENT INSTRUCTIONS", "details": [{"label": "Raast ID (Phone)", "value": "03008472910", "copyValue": "03008472910"}, {"label": "IBAN Raast ID", "value": "PK36MEZN0001029384756101", "copyValue": "PK36MEZN0001029384756101"}]},
        {"id": "Bank Transfer", "label": "Direct Bank Transfer", "description": "Meezan Bank IBAN transfer", "enabled": true, "requiresReference": true, "requiresProof": true, "referenceLabel": "Bank Transfer Reference / Deposit Slip No.", "referencePlaceholder": "e.g. HBL-DEPOSIT-88213", "instructionHeading": "DIRECT BANK TRANSFER DETAILS", "details": [{"label": "Bank Name", "value": "Meezan Bank Ltd."}, {"label": "Account Title", "value": "HM Signature (Pvt) Ltd"}, {"label": "Account Number", "value": "0102 9384 7561 01", "copyValue": "01029384756101"}, {"label": "IBAN", "value": "PK36 MEZN 0001 0293 8475 6101", "copyValue": "PK36MEZN0001029384756101"}]}
    ]}'::jsonb,
    'Manual payment instructions shown at checkout.'
)
ON CONFLICT (key) DO NOTHING;

UPDATE public.site_settings
SET value = value || jsonb_build_object('estimatedDays', '2 - 3 Business Days')
WHERE key = 'shipping_config' AND NOT (value ? 'estimatedDays');

-- Fragrance family: copy the existing merchandising category into the new
-- attribute so the finder and filters have real data to work with today.
UPDATE public.products p
SET fragrance_family = c.name
FROM public.categories c
WHERE p.category_id = c.id
  AND p.fragrance_family IS NULL;
