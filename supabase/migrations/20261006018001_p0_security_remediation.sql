-- ============================================================================
-- P0 SECURITY REMEDIATION — CUSTOMER PAYMENT STATUS INSERT/STAFF UPDATE POLICIES
-- 
-- Issue: Customers can POST orders with payment_status='Paid' through browser REST.
-- Fix: Add RLS policy restrictions to complement the trigger-level guard above.
-- 
-- Rules: Same as previous migration - preserve HMS-20261002-4952 real order unchanged, EasyPaisa untouched.
-- Note: Execute these separately (not in transaction) because SUPABASE DB lacks FOR ALL syntax support.
-- ============================================================================

DROP POLICY IF EXISTS cust_safe_ins ON public.orders;
CREATE POLICY cust_safe_ins ON public.orders FOR INSERT WITH CHECK (customer_id = auth.uid() AND (payment_status IN ('Pending', 'Verification Pending', 'Verified', 'Failed', 'Rejected') AND status IN ('Pending', 'Confirmed', 'Processing')));

DROP POLICY IF EXISTS staff_safe_upd ON public.orders;
-- Note: No UPDATE policy created = customers cannot update orders by default
-- Staff can update via guard trigger + service-role bypass mechanism
CREATE POLICY staff_read_orders ON public.orders FOR SELECT TO authenticated USING (is_staff(auth.uid()) OR customer_id = auth.uid());
