-- ============================================================================
-- PHASE 10-G — AUTOMATED WORKFLOWS (EVENT-DRIVEN)
-- 
-- Event-driven operational workflows with idempotency:
-- - Order created → inventory reservation → payment processing
-- - Payment verified → invoice creation → fulfillment
-- - Shipment delivered → customer lifecycle update → CRM sync
-- - Payment failed → release reservation → order notification
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  idempotency_key TEXT UNIQUE
);

COMMENT ON TABLE public.workflow_events IS 'Event queue for automated workflows';

CREATE INDEX IF NOT EXISTS idx_workflow_unprocessed ON public.workflow_events(created_at) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_workflow_type ON public.workflow_events(event_type);

COMMIT;
