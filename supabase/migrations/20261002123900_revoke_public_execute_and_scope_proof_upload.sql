-- ============================================================================
-- Completion of the previous hardening pass.
--
-- The Supabase-managed functions in this project carry an explicit
-- `=X/postgres` ACL entry, i.e. EXECUTE is granted to PUBLIC, and PUBLIC is the
-- union of every role including anon. REVOKE ... FROM anon therefore left anon
-- reachable through PUBLIC, which the post-hardening probe caught
-- (rpc/get_admin_analytics as a visitor still executed the function body and only
-- failed on its internal auth.uid() test). Execution privilege is revoked from
-- PUBLIC here as well, so the privilege layer and the in-function authorization
-- agree instead of one of them having to carry all the weight.
--
-- Also closes the payment-proof upload gap found while wiring the customer proof
-- upload: the INSERT policy accepted any authenticated user for any key inside the
-- private bucket, so a signed-in customer could write into another customer's
-- proofs/<uid>/ folder. Uploads are now namespaced to the caller's own uid.
--
-- No data is touched; guest checkout (place_order) and the public tracking lookup
-- (get_order_tracking) keep their anon EXECUTE because they are supported journeys.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.adjust_inventory_stock(uuid, integer, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_order(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_self_order(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_abandoned_carts(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_analytics(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_customers() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_inventory_position() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_cart() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.record_refund(uuid, numeric, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_order_tracking(uuid, text, text, text, date, text, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_order_gift_options(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_payment_proof(uuid, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_order_notes(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.verify_payment(uuid, uuid, text, text) FROM PUBLIC, anon;

-- Every one of the above is reachable by a signed-in principal; authorization
-- inside each function still decides whether that principal is staff or the
-- owner of the rows involved.
GRANT EXECUTE ON FUNCTION public.adjust_inventory_stock(uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_self_order(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_abandoned_carts(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_customers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_position() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_cart() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_refund(uuid, numeric, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_order_tracking(uuid, text, text, text, date, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_order_gift_options(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_payment_proof(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_notes(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_payment(uuid, uuid, text, text) TO authenticated;

-- --------------------------------------------------------------------------
-- Private proof bucket: a customer may only create objects under their own uid.
DROP POLICY IF EXISTS "Customer Upload Payment Proof" ON storage.objects;
CREATE POLICY "Customer Upload Payment Proof" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'payment-proofs'::text
        AND (storage.foldername(name))[1] = 'proofs'
        AND (storage.foldername(name))[2] = (auth.uid())::text
    );
