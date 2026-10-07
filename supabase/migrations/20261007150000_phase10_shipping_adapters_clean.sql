-- ============================================================================
-- PHASE 10-E — SHIPPING PROVIDER ADAPTERS (COMPLETE REIMPLEMENTATION)
-- 
-- Provider-neutral shipping architecture with:
-- - Shipping provider configuration
-- - Shipment creation/tracking  
-- - Status workflow
-- - Webhook/event handling
-- - Delivery confirmation
-- - Returns/cancellations
-- - Audit logging
-- ============================================================================

BEGIN;

-- ==========================================================================
-- SECTION 1: SHIPPING PROVIDERS CONFIGURATION
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.shipping_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code TEXT NOT NULL UNIQUE,
  provider_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  base_url TEXT,
  webhooks_configured BOOLEAN DEFAULT false,
  supports_rates BOOLEAN DEFAULT true,
  supports_label BOOLEAN DEFAULT true,
  supports_tracking BOOLEAN DEFAULT true,
  supports_return BOOLEAN DEFAULT false,
  api_version TEXT,
  environment TEXT DEFAULT 'production',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.shipping_providers IS 'Shipping provider configuration';

INSERT INTO public.shipping_providers (provider_code, provider_name, is_active, is_default, supports_rates, supports_label, supports_tracking, environment)
VALUES ('default', 'Default/Manual Tracking', false, false, false, false, true, 'production')
ON CONFLICT (provider_code) DO NOTHING;

-- ==========================================================================
-- SECTION 2: SHIPPING RATES CACHE
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  from_location_id UUID REFERENCES public.locations(id),
  to_address JSONB NOT NULL,
  package_details JSONB NOT NULL,
  rates JSONB NOT NULL,
  selected_rate_id TEXT,
  selected_carrier TEXT,
  selected_service TEXT,
  selected_price NUMERIC(12,2),
  selected_currency TEXT DEFAULT 'USD',
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

COMMENT ON TABLE public.shipping_rates IS 'Cached shipping rates for orders';

CREATE INDEX IF NOT EXISTS idx_shipping_rates_order ON public.shipping_rates(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_to ON public.shipping_rates((to_address->>'postal_code'));

-- ==========================================================================
-- SECTION 3: SHIPMENTS TABLE
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fulfillment_id UUID REFERENCES public.fulfillments(id) ON DELETE CASCADE,
  shipment_number TEXT NOT NULL UNIQUE,
  provider_code TEXT NOT NULL,
  external_shipment_id TEXT NOT NULL,
  tracking_number TEXT NOT NULL,
  tracking_url TEXT,
  carrier_name TEXT,
  carrier_service TEXT,
  weight DECIMAL(10,2),
  weight_unit TEXT DEFAULT 'lb' CHECK (weight_unit IN ('lb', 'oz', 'kg', 'g')),
  dimensions JSONB,
  packaging_type TEXT,
  ship_from_address JSONB,
  ship_to_address JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status in ('pending', 'created', 'in_transit', 'delivered', 'failed', 'returned', 'exception')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  exception_at TIMESTAMPTZ,
  error_message TEXT,
  webhook_events JSONB,
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.shipments IS 'Shipping records linked to fulfillments';

CREATE INDEX IF NOT EXISTS idx_shipments_fulfillment ON public.shipments(fulfillment_id);
CREATE INDEX IF NOT EXISTS idx_shipments_provider ON public.shipments(provider_code);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_external ON public.shipments(external_shipment_id, provider_code);

ALTER TABLE public.shipments ADD CONSTRAINT fk_shipments_fulfillment FOREIGN KEY (fulfillment_id) REFERENCES public.fulfillments(id) ON DELETE CASCADE;

-- ==========================================================================
-- SECTION 4: TRACKING EVENTS LOG
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.shipment_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  event_code TEXT NOT NULL,
  event_description TEXT,
  event_location JSONB,
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  source_provider TEXT,
  raw_event JSONB,
  UNIQUE (shipment_id, occurred_at, event_code)
);

COMMENT ON TABLE public.shipment_tracking_events IS 'Detailed tracking timeline';

CREATE INDEX IF NOT EXISTS idx_tracking_shipment ON public.shipment_tracking_events(shipment_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_code ON public.shipment_tracking_events(event_code);

-- ==========================================================================
-- SECTION 5: WEBHOOK HANDLERS
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.webhook_handlers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handler_name TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  callback_url TEXT NOT NULL,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  event_types_filter JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ,
  failure_count INT DEFAULT 0
);

COMMENT ON TABLE public.webhook_handlers IS 'Webhook endpoint registrations';

CREATE INDEX IF NOT EXISTS idx_webhook_provider ON public.webhook_handlers(provider_code, is_active);

-- ==========================================================================
-- SECTION 6: FULFILLMENT TABLE UPDATES
-- ==========================================================================

ALTER TABLE public.fulfillments ADD COLUMN IF NOT EXISTS shipment_provider TEXT;
ALTER TABLE public.fulfillments ADD COLUMN IF NOT EXISTS shipment_id TEXT;

COMMIT;
