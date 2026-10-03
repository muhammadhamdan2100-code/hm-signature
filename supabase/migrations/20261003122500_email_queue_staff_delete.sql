-- Phase 5: staff may clear the delivery queue.
--
-- The queue doubles as the delivery log, so this is an operational action rather
-- than routine use; it exists because a deployment must be able to remove rows
-- that hold customer addresses once they are no longer needed, and because an
-- automated test suite has to be able to clean up after itself. Reads remain
-- staff-only and no other role may delete anything.

CREATE POLICY "Staff Delete Email Outbox" ON public.email_outbox
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));
