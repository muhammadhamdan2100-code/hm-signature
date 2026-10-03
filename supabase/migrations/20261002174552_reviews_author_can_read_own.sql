-- ============================================================================
-- A customer who submits a review could not read it back: the storefront asks for
-- the inserted row (Prefer: return=representation), and the only SELECT policy
-- exposed Approved rows or staff, so the author's own Pending submission was
-- invisible to them. Ownership-scoped read is added; nothing else widens.
-- ============================================================================

DROP POLICY IF EXISTS "Customers Read Own Reviews" ON public.reviews;
CREATE POLICY "Customers Read Own Reviews" ON public.reviews
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());
