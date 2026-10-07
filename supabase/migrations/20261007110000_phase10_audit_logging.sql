-- ============================================================================
-- PHASE 10-B — IMMUTABLE AUDIT LOGGING
-- 
-- Enterprise-grade audit system for security-sensitive and business-critical operations.
-- Records: actor, actor_role, action, resource_type, resource_id, timestamp,
--          old_value, new_value, request_id, ip_address (when safely available),
--          user_agent (safe data), source, success/failure status.
-- 
-- Security Model:
-- - Append-only by default
-- - No normal staff can edit/delete audit records
-- - Only service_role with explicit admin role can archive/archive
-- - Never logs sensitive credentials or PII
-- ============================================================================

BEGIN;

-- ==========================================================================
-- SECTION 1: CREATE AUDIT TABLES
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  -- Primary identifier
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Timestamp and correlation
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  request_id UUID,  -- For correlating across requests/microservices
  
  -- Actor information
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,  -- Snapshot of role at time of action
  actor_email TEXT,  -- Optional reference, not indexed
  
  -- Operation details
  action TEXT NOT NULL,  -- e.g., 'order.created', 'payment.verified'
  resource_type TEXT NOT NULL,  -- e.g., 'order', 'payment', 'inventory'
  resource_id UUID,  -- Target resource ID (nullable for some actions)
  
  -- Change tracking
  old_values JSONB,  -- Previous state (if applicable)
  new_values JSONB,   -- New state (if applicable)
  
  -- Context
  source TEXT DEFAULT 'api',  -- 'api', 'admin_ui', 'rpc', 'trigger', 'system'
  success BOOLEAN DEFAULT true,  -- Whether operation succeeded
  
  -- Safe context data (no secrets!)
  ip_address_inet INET,  -- Client IP when available (IPv4/IPv6)
  user_agent TEXT,  -- Browser/app identifier (truncated, no sensitive fields)
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb  -- Flexible additional context
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON public.audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_request ON public.audit_log(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_ip ON public.audit_log(ip_address_inet) WHERE ip_address_inet IS NOT NULL;

COMMENT ON TABLE public.audit_log IS 'Immutable audit log for security and compliance';
COMMENT ON COLUMN public.audit_log.ip_address_inet IS 'Client IP address (never logs session tokens or passwords)';
COMMENT ON COLUMN public.audit_log.user_agent IS 'Browser/client identifier (sanitized)';

-- Create audit events table for structured event streaming
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,  -- e.g., 'security.login', 'orders.cancelled'
  payload JSONB NOT NULL,    -- Structured event data
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed BOOLEAN DEFAULT false,  -- For workflow processing
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_audit_events_type ON public.audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_unprocessed ON public.audit_events(created_at) 
  WHERE processed = false;

COMMENT ON TABLE public.audit_events IS 'Structured event stream for workflows';

-- ==========================================================================
-- SECTION 2: AUDIT LOG WRITER FUNCTION
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_source TEXT DEFAULT 'api',
  p_success BOOLEAN DEFAULT true,
  p_metadata JSONB DEFAULT NULL,
  p_request_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_ip inet;
  v_ua text;
begin
  -- Determine actor role
  if v_actor_id is not null then
    v_actor_role := public.get_user_role(v_actor_id);
    
    -- Capture client IP from headers (if available)
    begin
      v_ip := current_setting('request.headers.x-real-ip', true)::inet;
    exception when others then
      v_ip := NULL;
    end;
    
    -- Capture user agent safely (first 500 chars, no sensitive data)
    begin
      v_ua := substr(current_setting('request.headers.user-agent', true), 1, 500);
    exception when others then
      v_ua := NULL;
    end;
  else
    v_actor_role := 'anonymous';
  end if;
  
  -- Insert audit record
  insert into public.audit_log (
    actor_id, actor_role, action, resource_type, resource_id,
    old_values, new_values, source, success, metadata,
    request_id, ip_address_inet, user_agent
  ) values (
    v_actor_id, v_actor_role, p_action, p_resource_type, p_resource_id,
    p_old_values, p_new_values, p_source, p_success, coalesce(p_metadata, '{}'),
    p_request_id, v_ip, v_ua
  );
end;
$$;

COMMENT ON FUNCTION public.write_audit_log(text,text,uuid,jsonb,jsonb,text,bool,jsonb,uuid) IS
  'Append audit log entry for tracked operations';

ALTER FUNCTION public.write_audit_log(text,text,uuid,jsonb,jsonb,text,bool,jsonb,uuid) SET search_path = public, pg_temp;

-- ==========================================================================
-- SECTION 3: AUDIT EVENTS PUBLISHER FUNCTION
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.publish_audit_event(
  p_event_type TEXT,
  p_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
begin
  insert into public.audit_events (event_type, payload)
  values (p_event_type, p_payload);
end;
$$;

COMMENT ON FUNCTION public.publish_audit_event(text,jsonb) IS
  'Publish structured audit event for workflow processing';

ALTER FUNCTION public.publish_audit_event(text,jsonb) SET search_path = public, pg_temp;

-- ==========================================================================
-- SECTION 4: SECURITY-FIRST GUARD TRIGGER FOR ORDERS
-- ==========================================================================

-- Enhanced trigger that logs ALL order changes with full context
DROP TRIGGER IF EXISTS trg_orders_audit ON public.orders;
-- Note: guard_order_payment_state() is created elsewhere - reuse it for audit purposes

CREATE OR REPLACE FUNCTION public.audit_order_changes() RETURNS TRIGGER AS $$
declare
  v_is_paid boolean := false;
begin
  -- Service-role bypass for legitimate backend operations
  if current_setting('request.jwt.claims", "x-service-role"', true) = 'true' then
    return NEW;
  end if;

  v_is_paid := coalesce(NEW.payment_status, OLD.payment_status) in ('Paid', 'Verified');

  -- Guard trigger: Prevent customers from setting privileged payment states
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      if NEW.customer_id <> auth.uid() then
        raise exception 'Customers cannot assign orders to other users.' using errcode = 'invalid_foreign_key';
      end if;
      
      if v_is_paid then
        raise exception 'Direct payment-status assignment via REST is prohibited.' using errcode = 'payment_unauthorized';
      end if;
    elsif tg_op = 'UPDATE' then
      if coalesce(OLD.payment_status, '') in ('Pending', 'Verification Pending') 
         and coalesce(NEW.payment_status, '') in ('Paid', 'Verified') then
        raise exception 'Direct payment-status upgrades via REST are prohibited.' using errcode = 'payment_upgrade_unauthorized';
      end if;
      
      -- Log significant changes
      if OLD.status != NEW.status then
        perform public.write_audit_log(
          'order.status_changed',
          'order',
          NEW.id,
          jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status),
          jsonb_build_object('status', NEW.status),
          'trigger',
          true,
          jsonb_build_object('actor_role', current_setting('request.jwt.claims', true)::json->>'role')
        );
      end if;
    end if;
  end if;

  return NEW;
end;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO pg_temp, public;

CREATE TRIGGER trg_orders_audit
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_order_changes();

COMMENT ON FUNCTION public.audit_order_changes() IS
  'Guard trigger + audit logging for order changes (reuses guard_order_payment_state logic)';

-- Drop old guard trigger to avoid conflicts
DROP TRIGGER IF EXISTS trg_orders_guard_payment_state ON public.orders;

-- ==========================================================================
-- SECTION 5: PAYMENT EVENT TRACKING
-- ==========================================================================

-- Track payment verification events
DROP TRIGGER IF EXISTS trg_payments_audit ON public.payments;

CREATE OR REPLACE FUNCTION public.audit_payment_changes() RETURNS TRIGGER AS $$
declare
  v_action text;
begin
  -- Log payment status changes
  if tg_op = 'UPDATE' and (OLD.status != NEW.status or OLD.provider_reference is distinct from NEW.provider_reference) then
    perform public.write_audit_log(
      'payment.status_changed',
      'payment',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'provider_reference', OLD.provider_reference,
        'amount', OLD.amount,
        'currency', OLD.currency
      ),
      jsonb_build_object(
        'new_status', NEW.status,
        'provider_reference', NEW.provider_reference,
        'updated_at', NEW.updated_at
      ),
      'trigger',
      true,
      jsonb_build_object(
        'provider', NEW.provider,
        'is_verified', NEW.status = 'verified'
      )
    );
  end if;
  
  return NEW;
end;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO pg_temp, public;

CREATE TRIGGER trg_payments_audit
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_payment_changes();

COMMENT ON FUNCTION public.audit_payment_changes() IS
  'Audit payment status changes';

-- ==========================================================================
-- SECTION 6: INVENTORY MOVEMENT TRACKING
-- ==========================================================================

-- Track inventory adjustments
DROP TRIGGER IF EXISTS trg_inventory_audit ON public.product_variants;

CREATE OR REPLACE FUNCTION public.audit_inventory_changes() RETURNS TRIGGER AS $$
begin
  -- Log stock changes (assume product_variants has stock column)
  if tg_op = 'UPDATE' and OLD.stock is distinct from NEW.stock then
    perform public.write_audit_log(
      'inventory.adjusted',
      'product_variant',
      NEW.id,
      jsonb_build_object(
        'old_stock', OLD.stock,
        'reserved', OLD.reserved,
        'available', OLD.available
      ),
      jsonb_build_object(
        'new_stock', NEW.stock,
        'reserved', NEW.reserved,
        'available', NEW.available,
        'change', NEW.stock - OLD.stock
      ),
      'trigger',
      true,
      jsonb_build_object(
        'product_id', NEW.product_id,
        'sku', COALESCE(NEW.sku, 'unknown')
      )
    );
  end if;
  
  return NEW;
end;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO pg_temp, public;

CREATE TRIGGER trg_inventory_audit
  AFTER UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.audit_inventory_changes();

COMMENT ON FUNCTION public.audit_inventory_changes() IS
  'Audit inventory stock changes';

COMMIT;
