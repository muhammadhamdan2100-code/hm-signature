-- Grant staff management access and customer ownership visibility for the
-- operational tables that shipped without RLS policies in the backend migration.
-- Additive only: no existing policy is dropped or altered.

-- Order status history: staff manage; customers read their own order timeline
DROP POLICY IF EXISTS "Staff Manage Order Status History" ON public.order_status_history;
CREATE POLICY "Staff Manage Order Status History" ON public.order_status_history
  FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Customers Read Own Order History" ON public.order_status_history;
CREATE POLICY "Customers Read Own Order History" ON public.order_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id
        AND o.customer_id = auth.uid()
    )
  );

-- Shipments: staff manage; customers read their own
DROP POLICY IF EXISTS "Staff Manage Shipments" ON public.shipments;
CREATE POLICY "Staff Manage Shipments" ON public.shipments
  FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Customers Read Own Shipments" ON public.shipments;
CREATE POLICY "Customers Read Own Shipments" ON public.shipments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = shipments.order_id
        AND o.customer_id = auth.uid()
    )
  );

-- Coupon usage audit: staff manage
DROP POLICY IF EXISTS "Staff Manage Coupon Usage" ON public.coupon_usage;
CREATE POLICY "Staff Manage Coupon Usage" ON public.coupon_usage
  FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Abandoned carts: staff manage
DROP POLICY IF EXISTS "Staff Manage Abandoned Carts" ON public.abandoned_carts;
CREATE POLICY "Staff Manage Abandoned Carts" ON public.abandoned_carts
  FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Notifications: staff manage system/operational rows; customers read+update own
DROP POLICY IF EXISTS "Staff Manage Notifications" ON public.notifications;
CREATE POLICY "Staff Manage Notifications" ON public.notifications
  FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Customers Read Own Notifications" ON public.notifications;
CREATE POLICY "Customers Read Own Notifications" ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers Mark Own Notifications Read" ON public.notifications;
CREATE POLICY "Customers Mark Own Notifications Read" ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Marketing campaigns: staff manage
DROP POLICY IF EXISTS "Staff Manage Marketing Campaigns" ON public.marketing_campaigns;
CREATE POLICY "Staff Manage Marketing Campaigns" ON public.marketing_campaigns
  FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Roles and permissions catalog: staff read/manage
DROP POLICY IF EXISTS "Staff Manage Roles" ON public.roles;
CREATE POLICY "Staff Manage Roles" ON public.roles
  FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff Manage Permissions" ON public.permissions;
CREATE POLICY "Staff Manage Permissions" ON public.permissions
  FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff Manage Role Permissions" ON public.role_permissions;
CREATE POLICY "Staff Manage Role Permissions" ON public.role_permissions
  FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Payment events audit: staff read (inserts already covered by Staff Manage Payment Events)
DROP POLICY IF EXISTS "Staff Manage Payment Proof Events" ON public.payment_events;
CREATE POLICY "Staff Manage Payment Proof Events" ON public.payment_events
  FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Customers table: customers read their own extension record
DROP POLICY IF EXISTS "Customers Read Own Customer Record Only" ON public.customers;
CREATE POLICY "Customers Read Own Customer Record Only" ON public.customers
  FOR SELECT
  USING (profile_id = auth.uid());
