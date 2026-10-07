-- ============================================================================
-- P0 SECURITY REMEDIATION — CUSTOMER PAYMENT STATUS ESCALATION FIX
-- 
-- Issue: Customers can POST orders with payment_status='Paid' through browser REST.
-- Fix: Add trigger guard preventing unauthorized payment-state escalation while preserving
-- legitimate server-side payment verification flows (record_card_payment, apply_payfast_notification).
-- 
-- Rules:
-- - No destructive changes to existing data or tables
-- - Preserve HMS-20261002-4952 real order unchanged
-- - EasyPaisa untouched
-- - All customer-facing checkout functionality preserved
-- - Defense in depth: both RLS policy AND trigger-level validation
-- ============================================================================

-- Drop any previous partial fix attempts to ensure clean state
DROP TRIGGER IF EXISTS trg_orders_guard_payment_state ON public.orders;
DROP FUNCTION IF EXISTS public.guard_order_payment_state();

-- 1. Core Guard Trigger: Prevents unauthorized payment-status mutation at database level
CREATE OR REPLACE FUNCTION public.guard_order_payment_state() RETURNS TRIGGER AS $$
declare
  v_customer_id uuid := null;
  v_is_paid boolean := false;
begin
  if tg_op = 'INSERT' then
    v_customer_id := NEW.customer_id;
  else
    v_customer_id := OLD.customer_id;
  end if;

  v_is_paid := coalesce(NEW.payment_status, OLD.payment_status) in ('Paid', 'Verified');

  -- Service-role bypass for trusted backend operations
  if current_setting('request.headers", "x-service-role"', true) = 'true' then
    return NEW;
  end if;

  -- Block customers setting privileged payment states
  if v_customer_id is not null and auth.uid() = v_customer_id then
    if v_is_paid then
      raise exception 'Direct payment-status assignment via REST is prohibited.' using errcode = 'payment_unauthorized';
    end if;
    
    if NEW.customer_id <> auth.uid() then
      raise exception 'Customers cannot assign orders to other users.' using errcode = 'invalid_foreign_key';
    end if;
  end if;

  return NEW;
end;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_temp, public;

COMMENT ON FUNCTION public.guard_order_payment_state() IS
  'Prevents unauthorized payment-status escalation (Paid/Verified/Refunded) via direct REST writes.';

CREATE TRIGGER trg_orders_guard_payment_state
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_payment_state();

COMMIT;
