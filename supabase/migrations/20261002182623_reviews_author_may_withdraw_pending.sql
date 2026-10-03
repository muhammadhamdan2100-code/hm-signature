-- ============================================================================
-- A customer could submit a review and then not withdraw it before moderation,
-- because the only delete policy on the table was the staff one. The withdrawal is
-- limited to the author's own row while it is still Pending, so a published review
-- stays on the record and only staff can remove it.
-- ============================================================================

DROP POLICY IF EXISTS "Customers Withdraw Own Pending Reviews" ON public.reviews;
CREATE POLICY "Customers Withdraw Own Pending Reviews" ON public.reviews
    FOR DELETE TO authenticated
    USING (user_id = auth.uid() AND status = 'Pending');
