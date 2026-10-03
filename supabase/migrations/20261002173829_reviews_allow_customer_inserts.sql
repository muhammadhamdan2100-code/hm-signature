-- ============================================================================
-- Customer review submission could never succeed. PostgREST evaluates the WITH
-- CHECK of every applicable permissive policy, so the old "Staff Manage Reviews"
-- policy — written FOR ALL, with no explicit WITH CHECK, so its USING expression
-- is reused — was AND-ed with "Users Create Reviews". A customer therefore had to
-- satisfy is_staff(auth.uid()) to insert their own review, and every storefront
-- submission was rejected with 42501. This is why the review table stayed empty.
--
-- Staff moderation is split into UPDATE and DELETE, which is all the admin review
-- panel ever does. No row is changed and no privilege is widened: customers can
-- now do the one thing the product already promised them.
-- ============================================================================

DROP POLICY IF EXISTS "Staff Manage Reviews" ON public.reviews;

CREATE POLICY "Staff Moderate Reviews" ON public.reviews
    FOR UPDATE TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff Delete Reviews" ON public.reviews
    FOR DELETE TO authenticated
    USING (public.is_staff(auth.uid()));
