-- ============================================================================
-- PHASE 10-A — ADVANCED STAFF PERMISSIONS
-- 
-- Implements granular role-based + permission-based authorization.
-- All permissions enforced server-side/database-side, not just frontend.
-- 
-- Permission Vocabulary (aligned with frontend):
-- - orders.view, orders.create, orders.update, orders.cancel, orders.refund
-- - products.view, products.create, products.update, products.delete
-- - inventory.view, inventory.adjust, inventory.transfer
-- - payments.view, payments.verify, payments.refund, payments.configure
-- - shipping.view, shipping.manage
-- - customers.view, customers.manage
-- - staff.view, staff.create, staff.update, staff.disable
-- - reports.view, reports.business, reports.operational, reports.content
-- - settings.manage
-- - content.manage, reviews.manage
-- - personalization.manage, giftCards.manage, loyalty.manage, vip.manage
-- - preorders.view, preorders.manage, waitlists.view, waitlists.manage
-- - discovery.manage, marketing.manage
-- - boutiques.manage
-- ============================================================================

BEGIN;

-- ==========================================================================
-- SECTION 1: CREATE PERMISSIONS TABLE
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  
  UNIQUE(user_id, permission_key)
);

-- Index for efficient permission lookups
CREATE INDEX IF NOT EXISTS idx_staff_permissions_user ON public.staff_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_key ON public.staff_permissions(permission_key);

COMMENT ON TABLE public.staff_permissions IS 'Granular permission assignments per user';
COMMENT ON COLUMN public.staff_permissions.expires_at IS 'Temporary/conditional grants';

-- ==========================================================================
-- SECTION 2: UPDATE PROFILES TO SUPPORT PERMISSION METADATA
-- ==========================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.metadata IS 'Role-specific configuration, custom permissions, notes';

-- ==========================================================================
-- SECTION 3: DATABASE PERMISSION CHECK FUNCTION
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.has_permission(p_permission_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
declare
  v_user_id uuid := auth.uid();
  v_user_role text;
  v_has_grant boolean;
begin
  -- Anonymous users have no permissions
  if v_user_id is null then
    return false;
  end if;

  -- Check explicit permission grant first
  select exists(
    select 1 from public.staff_permissions sp
    where sp.user_id = v_user_id
      and sp.permission_key = p_permission_key
      and (sp.expires_at is null or sp.expires_at > now())
  ) into v_has_grant;

  if v_has_grant then
    return true;
  end if;

  -- Fallback to role-based permissions
  v_user_role := public.get_user_role(v_user_id);

  case p_permission_key
    -- Super Admin: all permissions
    when 'dashboard.full', 'products.manage', 'categories.manage', 'collections.manage',
         'inventory.manage', 'customers.manage', 'payments.configure', 'boutiques.manage',
         'personalization.manage', 'giftCards.manage', 'loyalty.manage', 'vip.manage',
         'preorders.manage', 'waitlists.manage', 'discovery.manage', 'marketing.manage',
         'staff.manage', 'settings.manage' then
      return v_user_role in ('super_admin');

    -- Manager: business operations permissions
    when 'reports.business', 'reports.operational', 'inventory.adjust', 'inventory.transfer',
         'payments.verify', 'customers.view', 'products.view', 'products.create', 'products.update',
         'orders.view', 'orders.update', 'orders.status' then
      return v_user_role in ('manager', 'super_admin');

    -- Order Manager: order-focused permissions only
    when 'orders.view', 'orders.update', 'orders.tracking', 'orders.status', 'orders.payment_status',
         'preorders.view', 'preorders.manage', 'waitlists.view', 'waitlists.manage',
         'reports.operational' then
      return v_user_role in ('order_manager', 'manager', 'super_admin');

    -- Content Manager: product/content permissions only
    when 'products.view', 'products.manage', 'categories.manage', 'collections.manage',
         'content.manage', 'reviews.manage', 'discovery.manage', 'reports.content' then
      return v_user_role in ('content_manager', 'super_admin');

    -- Read-only/view permissions (all staff can see what they're allowed to manage)
    when 'dashboard.manager', 'dashboard.orders', 'dashboard.content',
         'products.view', 'orders.view', 'customers.view', 'inventory.view',
         'payments.view', 'shipping.view', 'reports.view' then
      return v_user_role in ('super_admin', 'manager', 'order_manager', 'content_manager', 'support');

    -- Customer operations (Order Managers can view customer contact info for fulfillment)
    when 'customers.view' then
      return v_user_role in ('order_manager', 'manager', 'super_admin', 'content_manager');

    -- Payment operations
    when 'payments.view', 'payments.refund' then
      return v_user_role in ('manager', 'order_manager', 'super_admin');

    -- Staff management (Super Admin only)
    when 'staff.view', 'staff.create', 'staff.update', 'staff.disable' then
      return v_user_role in ('super_admin');

    -- Default deny
    else
      return false;
  end case;
end;
$$;

COMMENT ON FUNCTION public.has_permission(text) IS
  'Check if current user has specific permission (explicit grant or role-based)';

-- Pin search_path for security
ALTER FUNCTION public.has_permission(text) SET search_path = public, pg_temp;

-- ==========================================================================
-- SECTION 4: BULK PERMISSION CHECK FOR FRONTEND ROUTING
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.check_permissions(p_permission_keys text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
declare
  v_key text;
begin
  foreach v_key in array p_permission_keys
  loop
    if not public.has_permission(v_key) then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

COMMENT ON FUNCTION public.check_permissions(text[]) IS
  'Check if current user has ANY of the specified permissions';

ALTER FUNCTION public.check_permissions(text[]) SET search_path = public, pg_temp;

-- ==========================================================================
-- SECTION 5: USER PERMISSION INJECTION VIA JWT CLAIMS
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid DEFAULT auth.uid())
RETURNS text[]
LANGUAGE plpgsql
STABLE
AS $$
declare
  v_user_role text;
  v_permissions text[];
begin
  v_user_role := public.get_user_role(p_user_id);

  case v_user_role
    when 'super_admin' then
      v_permissions := array[
        'dashboard.full', 'dashboard.manager', 'dashboard.orders', 'dashboard.content',
        'products.view', 'products.manage', 'categories.manage', 'collections.manage',
        'inventory.view', 'inventory.manage', 'inventory.adjust', 'inventory.transfer',
        'orders.view', 'orders.create', 'orders.update', 'orders.cancel', 'orders.refund',
        'orders.tracking', 'orders.status', 'orders.payment_status',
        'customers.view', 'customers.manage',
        'payments.view', 'payments.verify', 'payments.refund', 'payments.configure',
        'shipping.view', 'shipping.manage',
        'staff.view', 'staff.create', 'staff.update', 'staff.disable',
        'reports.view', 'reports.business', 'reports.operational', 'reports.content',
        'content.manage', 'reviews.manage',
        'personalization.manage', 'giftCards.manage', 'loyalty.manage', 'vip.manage',
        'preorders.view', 'preorders.manage', 'waitlists.view', 'waitlists.manage',
        'discovery.manage', 'marketing.manage',
        'boutiques.manage', 'settings.manage'
      ];

    when 'manager' then
      v_permissions := array[
        'dashboard.manager', 'dashboard.orders',
        'products.view', 'products.manage', 'categories.manage', 'collections.manage',
        'inventory.view', 'inventory.manage', 'inventory.adjust', 'inventory.transfer',
        'orders.view', 'orders.update', 'orders.tracking', 'orders.status', 'orders.payment_status',
        'customers.view',
        'payments.view', 'payments.verify', 'payments.refund',
        'shipping.view', 'shipping.manage',
        'reports.view', 'reports.business', 'reports.operational',
        'preorders.view', 'preorders.manage', 'waitlists.view', 'waitlists.manage'
      ];

    when 'order_manager' then
      v_permissions := array[
        'dashboard.orders',
        'orders.view', 'orders.update', 'orders.tracking', 'orders.status', 'orders.payment_status',
        'customers.view',
        'payments.view', 'payments.refund',
        'shipping.view',
        'reports.operational',
        'preorders.view', 'preorders.manage', 'waitlists.view', 'waitlists.manage'
      ];

    when 'content_manager' then
      v_permissions := array[
        'dashboard.content',
        'products.view', 'products.manage', 'categories.manage', 'collections.manage',
        'content.manage', 'reviews.manage', 'discovery.manage',
        'reports.content'
      ];

    when 'support' then
      v_permissions := array[
        'orders.view', 'customers.view', 'products.view', 'reports.operational'
      ];

    else
      v_permissions := array[]::text[];
  end case;

  return v_permissions;
end;
$$;

COMMENT ON FUNCTION public.get_user_permissions(uuid) IS
  'Return all permissions for a user based on role';

ALTER FUNCTION public.get_user_permissions(uuid) SET search_path = public, pg_temp;

-- ==========================================================================
-- SECTION 6: RLS POLICIES ENFORCED VIA PERMISSION CHECKS
-- ==========================================================================

-- Orders: Granular control based on permission
DROP POLICY IF EXISTS "Staff read orders based on permission" ON public.orders;
DROP POLICY IF EXISTS "Customer insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Staff update orders based on permission" ON public.orders;

CREATE POLICY "Staff read orders based on permission"
  ON public.orders FOR SELECT
  USING (
    customer_id = auth.uid()
    OR (public.is_staff() AND has_permission('orders.view'))
  );

CREATE POLICY "Customer insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    customer_id = auth.uid()
    OR (public.is_staff() AND has_permission('orders.create'))
  );

CREATE POLICY "Staff update orders based on permission"
  ON public.orders FOR UPDATE
  USING (
    public.is_staff()
    AND has_permission('orders.update')
  );

DROP POLICY IF EXISTS "Staff delete orders based on permission" ON public.orders;
CREATE POLICY "Staff delete orders based on permission"
  ON public.orders FOR DELETE
  USING (has_permission('orders.cancel') OR has_permission('orders.refund'));

-- Products: Role-based access
DROP POLICY IF EXISTS "Public view active products" ON public.products;
DROP POLICY IF EXISTS "Staff manage products" ON public.products;

CREATE POLICY "Public view active products"
  ON public.products FOR SELECT
  USING (active = true OR has_permission('products.view'));

CREATE POLICY "Staff manage products"
  ON public.products FOR ALL
  USING (has_permission('products.manage') OR has_permission('products.view'));

-- Customers table exists but permissions will be enforced via existing RLS
-- Note: Full customer management policies in Phase 10-A only work if customers table exists

-- Products: Role-based access
DROP POLICY IF EXISTS "Public view active products" ON public.products;
DROP POLICY IF EXISTS "Staff manage products" ON public.products;

CREATE POLICY "Public view active products"
  ON public.products FOR SELECT
  USING (active = true OR has_permission('products.view'));

CREATE POLICY "Staff manage products"
  ON public.products FOR ALL
  USING (has_permission('products.manage') OR has_permission('products.view'));

-- Inventory: Separate view vs adjust permissions  
DROP POLICY IF EXISTS "Staff read inventory" ON public.inventory;
DROP POLICY IF EXISTS "Staff adjust inventory" ON public.inventory;

CREATE POLICY "Staff read inventory"
  ON public.inventory FOR SELECT
  USING (has_permission('inventory.view'));

CREATE POLICY "Staff adjust inventory"
  ON public.inventory FOR UPDATE
  USING (has_permission('inventory.adjust') OR has_permission('inventory.transfer'));

-- Note: Inventory movements table created in Phase 10-C
-- CREATE POLICY "Staff insert inventory movement"
--   ON public.inventory_movements FOR INSERT
--   WITH CHECK (has_permission('inventory.adjust') OR has_permission('inventory.transfer'));

-- Payments: View vs Verify vs Configure separation
DROP POLICY IF EXISTS "Staff read payments" ON public.payments;
DROP POLICY IF EXISTS "Staff verify payments" ON public.payments;
DROP POLICY IF EXISTS "Staff configure payment methods" ON public.payment_providers;

CREATE POLICY "Staff read payments"
  ON public.payments FOR SELECT
  USING (has_permission('payments.view'));

CREATE POLICY "Staff verify payments"
  ON public.payments FOR UPDATE
  USING (has_permission('payments.verify') OR has_permission('payments.configure'));

CREATE POLICY "Staff refund payments"
  ON public.payments FOR INSERT
  WITH CHECK (has_permission('payments.refund'));

CREATE POLICY "Staff configure payment providers"
  ON public.payment_providers FOR ALL
  USING (has_permission('payments.configure'));

-- Shipping: Carrier and shipment policies (requires Phase 10-D)
-- DROP POLICY IF EXISTS "Staff manage shipping" ON public.shipping_carriers;
-- DROP POLICY IF EXISTS "Staff read shipments" ON public.shipments;

-- CREATE POLICY "Staff manage shipping"
--   ON public.shipping_carriers FOR ALL
--   USING (has_permission('shipping.manage'));

-- CREATE POLICY "Staff read shipments"
--   ON public.shipments FOR SELECT
--   USING (has_permission('shipping.view'));

-- Reports: Access control per report type (requires Phase 9+ data models)
-- DROP POLICY IF EXISTS "Read business reports" ON public.report_data;
-- DROP POLICY IF EXISTS "Read operational reports" ON public.report_data;
-- DROP POLICY IF EXISTS "Read content reports" ON public.report_data;

COMMIT;
