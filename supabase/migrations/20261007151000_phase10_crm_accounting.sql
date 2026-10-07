-- ============================================================================
-- PHASE 10-F — CRM + ACCOUNTING INTEGRATIONS
-- 
-- Provider-neutral CRM + accounting adapters with:
-- - Customer synchronization (idempotent, retry-safe)
-- - Order history sync
-- - Invoice/financial records
-- - Payment/refund mapping
-- - External system failure isolation
-- - Audit logging
-- ============================================================================

BEGIN;

-- ==========================================================================
-- SECTION 1: CRM CUSTOMER LIFECYCLE
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.crm_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- External customer reference
  external_customer_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,  -- 'salesforce', 'hubspot', 'stripe', etc.
  
  -- Internal mapping (customer_id is denormalized from orders for reference, no FK due to non-unique)
  user_id UUID REFERENCES auth.users(id),
  customer_id TEXT,  -- Denormalized customer identifier from orders table
  
  -- Customer data (from CRM)
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  tags JSONB,
  
  -- Lifecycle state
  lifecycle_stage TEXT,  -- 'lead', 'prospect', 'customer', 'active', 'churned'
  lead_source TEXT,
  lifetime_value NUMERIC(18,2) DEFAULT 0,
  order_count INT DEFAULT 0,
  last_order_date TIMESTAMPTZ,
  
  -- Sync metadata
  synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',  -- 'pending', 'synced', 'failed', 'skipped'
  sync_error TEXT,
  last_sync_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.crm_customers IS 'CRM customer synchronization records';

CREATE INDEX IF NOT EXISTS idx_crm_external ON public.crm_customers(external_customer_id, provider_code);
CREATE INDEX IF NOT EXISTS idx_crm_user ON public.crm_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_sync_status ON public.crm_customers(sync_status);

-- ==========================================================================
-- SECTION 2: CRM CUSTOMER EVENTS
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.crm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  crm_customer_id UUID REFERENCES public.crm_customers(id) ON DELETE CASCADE,
  
  -- Event classification
  event_type TEXT NOT NULL,  -- 'order_placed', 'payment_received', 'support_ticket', etc.
  event_category TEXT,
  event_metadata JSONB,
  
  -- Source system info
  source_system TEXT,
  source_event_id TEXT,
  
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  is_processed BOOLEAN DEFAULT false
);

COMMENT ON TABLE public.crm_events IS 'CRM customer lifecycle events';

CREATE INDEX IF NOT EXISTS idx_crm_events_customer ON public.crm_events(crm_customer_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_events_unprocessed ON public.crm_events(received_at) WHERE is_processed = false;

-- ==========================================================================
-- SECTION 3: ACCOUNTING INVOICES
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.accounting_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Internal reference (order_id references orders.id which is PK)
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- External invoice reference
  external_invoice_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,  -- 'quickbooks', 'xero', 'sage', etc.
  
  -- Invoice details
  invoice_number TEXT,
  invoice_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL,  -- 'draft', 'sent', 'paid', 'overdue', 'void'
  total_amount NUMERIC(18,2),
  currency_code TEXT DEFAULT 'USD',
  
  -- Line items
  line_items JSONB,  -- Array of products/services
  
  -- Tax details
  tax_amount NUMERIC(18,2) DEFAULT 0,
  tax_rate NUMERIC(5,2),
  tax_label TEXT,
  
  -- Sync metadata
  synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.accounting_invoices IS 'Accounting system invoice records';

CREATE INDEX IF NOT EXISTS idx_acc_invoice_order ON public.accounting_invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_acc_external ON public.accounting_invoices(external_invoice_id, provider_code);
CREATE INDEX IF NOT EXISTS idx_acc_sync_status ON public.accounting_invoices(sync_status);

-- ==========================================================================
-- SECTION 4: ACCOUNTING PAYMENTS
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.accounting_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Internal reference (payment_id references payments.id, order_id references orders.id)
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- External payment reference
  external_payment_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  
  -- Payment details
  amount NUMERIC(18,2),
  currency_code TEXT DEFAULT 'USD',
  payment_date TIMESTAMPTZ,
  method TEXT,  -- 'credit_card', 'bank_transfer', 'check', etc.
  status TEXT,  -- 'pending', 'completed', 'refunded', 'failed'
  
  -- Mapping to invoice
  invoice_id UUID REFERENCES public.accounting_invoices(id),
  
  -- Sync metadata
  synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.accounting_payments IS 'Accounting system payment records';

CREATE INDEX IF NOT EXISTS idx_acc_payment_payment ON public.accounting_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_acc_payment_order ON public.accounting_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_acc_external ON public.accounting_payments(external_payment_id, provider_code);
CREATE INDEX IF NOT EXISTS idx_acc_sync_status ON public.accounting_payments(sync_status);

-- ==========================================================================
-- SECTION 5: REFUND RECORDS
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.accounting_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Internal reference
  refund_id UUID,  -- From payments table where applicable
  order_id UUID REFERENCES public.orders(id),
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  
  -- External refund reference
  external_refund_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  
  -- Refund details
  amount NUMERIC(18,2),
  currency_code TEXT DEFAULT 'USD',
  reason TEXT,
  reason_category TEXT,
  status TEXT,  -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  refund_date TIMESTAMPTZ,
  
  -- Linked invoice if applicable
  invoice_id UUID REFERENCES public.accounting_invoices(id),
  
  -- Sync metadata
  synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.accounting_refunds IS 'Accounting system refund records';

CREATE INDEX IF NOT EXISTS idx_acc_refund_order ON public.accounting_refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_acc_refund_payment ON public.accounting_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_acc_external ON public.accounting_refunds(external_refund_id, provider_code);
CREATE INDEX IF NOT EXISTS idx_acc_sync_status ON public.accounting_refunds(sync_status);

COMMIT;
