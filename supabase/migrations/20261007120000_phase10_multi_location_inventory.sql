-- ============================================================================
-- PHASE 10-C — MULTI-LOCATION INVENTORY AND TRANSFERS
-- 
-- Enterprise inventory management across multiple warehouses/locations.
-- Supports:
-- - Warehouse/boutique/location management
-- - Bin-level tracking within locations  
-- - Stock levels per location (available, reserved, damaged, incoming)
-- - Stock movements (receive, sale, adjust, damage, return)
-- - Stock transfers between locations
-- - Stock adjustments with audit trail
-- - Negative stock prevention with exceptions
-- - Concurrent stock change safety via transactions
-- ============================================================================

BEGIN;

-- ==========================================================================
-- SECTION 1: LOCATIONS/WAREHOUSES TABLE
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Location identity
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,  -- Short code for operations
  
  -- Location type
  type TEXT NOT NULL DEFAULT 'warehouse' CHECK (
    type IN ('warehouse', 'boutique', 'fulfillment_center', 'retail_store', 'distribution_center')
  ),
  
  -- Contact information
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  stateprovince TEXT,
  postalcode TEXT,
  country_code TEXT REFERENCES public.countries(code),
  phone TEXT,
  email TEXT,
  
  -- Operational settings
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,  -- Main warehouse for order allocation
  timezone TEXT DEFAULT 'Asia/Karachi',
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_active ON public.locations(is_active) WHERE is_active = true;

COMMENT ON TABLE public.locations IS 'Warehouses, boutiques, fulfillment centers';
COMMENT ON COLUMN public.locations.is_primary IS 'Primary location for default order allocation';

-- Seed default warehouse if none exists
INSERT INTO public.locations (name, code, type, is_primary, is_active, country_code)
VALUES ('Main Warehouse', 'WH-MAIN', 'warehouse', true, true, 'PK')
ON CONFLICT (code) DO NOTHING;

-- ==========================================================================
-- SECTION 2: WAREHOUSE BINS
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.warehouse_bins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Location reference
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  
  -- Bin identifier
  bin_code TEXT NOT NULL,  -- e.g., 'A-01-02' (aisle-rack-shelf)
  bin_name TEXT,  -- Human-readable name
  
  -- Bin properties
  capacity DECIMAL(12,2),  -- Maximum units this bin can hold
  weight_capacity_kg DECIMAL(12,2),
  
  -- Active status
  is_active BOOLEAN DEFAULT true,
  
  -- Created by staff
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bins_location ON public.warehouse_bins(location_id);
CREATE INDEX IF NOT EXISTS idx_bins_active ON public.warehouse_bins(is_active) WHERE is_active = true;

COMMENT ON TABLE public.warehouse_bins IS 'Physical storage locations within warehouses';

-- ==========================================================================
-- SECTION 3: LOCATION STOCK LEVELS
-- ==========================================================================

-- Create or extend product_variants to support location-based inventory
-- If already has stock column, we'll add location tracking
CREATE TABLE IF NOT EXISTS public.location_stock (
  -- Composite primary key: location + product variant
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  
  -- Stock quantities
  available INT NOT NULL DEFAULT 0,
  reserved INT NOT NULL DEFAULT 0,
  damaged INT NOT NULL DEFAULT 0,
  incoming INT NOT NULL DEFAULT 0,
  
  -- Low-stock threshold for this location
  reorder_point INT DEFAULT 0,
  max_stock INT,  -- Optional cap to prevent overstocking
  
  -- Last sync timestamp
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (location_id, product_variant_id)
);

-- Add global fallback stock if not present
ALTER TABLE public.product_variants 
  ADD COLUMN IF NOT EXISTS global_stock INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reserved INT DEFAULT 0;

-- Indexes for location stock queries
CREATE INDEX IF NOT EXISTS idx_location_stock_variant ON public.location_stock(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_location_stock_available ON public.location_stock(location_id, available) WHERE available > 0;

COMMENT ON TABLE public.location_stock IS 'Per-location stock levels for each product variant';
COMMENT ON COLUMN public.location_stock.reserved IS 'Stock reserved for pending orders';
COMMENT ON COLUMN public.location_stock.incoming IS 'Stock in-transit from suppliers';

-- ==========================================================================
-- SECTION 4: STOCK MOVEMENT TYPES
-- ==========================================================================

DO $$
begin
  -- Ensure stock_movement_types table exists with all standard types
  if not exists (select 1 from information_schema.tables where table_name = 'stock_movement_types') then
    create table public.stock_movement_types (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      affects_available BOOLEAN DEFAULT true,
      affects_reserved BOOLEAN DEFAULT false,
      affects_damaged BOOLEAN DEFAULT false,
      affects_incoming BOOLEAN DEFAULT false,
      requires_approval BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    insert into public.stock_movement_types (code, name, description, affects_available, affects_reserved, requires_approval) values
      ('receive', 'Stock Receive', 'Inbound shipment from supplier', true, false, false),
      ('sale', 'Sale', 'Order fulfillment', true, false, false),
      ('adjustment', 'Adjustment', 'Manual stock correction', true, false, true),
      ('damage', 'Damage Write-off', 'Damaged goods removed', true, false, false),
      ('return', 'Customer Return', 'Returned items restocked', true, false, false),
      ('transfer_out', 'Transfer Out', 'Sent to another location', true, false, true),
      ('transfer_in', 'Transfer In', 'Received from another location', true, false, false),
      ('reservation', 'Reservation', 'Reserved for order', false, true, false),
      ('release', 'Release', 'Unreserved after cancellation', false, true, false),
      ('inventory_count', 'Cycle Count', 'Periodic count adjustment', true, false, true),
      ('transfer_adjustment', 'Transfer Adjustment', 'Correction during transfer', true, false, true)
    on conflict (code) do nothing;
  end if;
end
$$;

COMMENT ON TABLE public.stock_movement_types IS 'Standardized stock movement classifications';

-- ==========================================================================
-- SECTION 5: STOCK MOVEMENTS/AUDIT TABLE
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Movement details
  location_id UUID NOT NULL REFERENCES public.locations(id),
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  warehouse_bin_id UUID REFERENCES public.warehouse_bins(id),
  
  -- Movement classification
  movement_type_id INT REFERENCES public.stock_movement_types(id),
  movement_type_code TEXT NOT NULL,  -- Denormalized for fast filtering
  
  -- Quantity and reference
  quantity INT NOT NULL,
  reference_type TEXT,  -- 'order', 'purchase_order', 'transfer', 'adjustment', etc.
  reference_id UUID,  -- Reference record ID
  
  -- State before/after
  old_available INT,
  new_available INT,
  old_reserved INT,
  new_reserved INT,
  
  -- Operator and context
  operator_id UUID REFERENCES auth.users(id),
  operator_ip_address INET,
  
  -- Approval (if required)
  approved_by UUID REFERENCES auth.users(id),
  approval_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Indexes for movements queries
CREATE INDEX IF NOT EXISTS idx_movements_location ON public.stock_movements(location_id);
CREATE INDEX IF NOT EXISTS idx_movements_variant ON public.stock_movements(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON public.stock_movements(movement_type_code);
CREATE INDEX IF NOT EXISTS idx_movements_reference ON public.stock_movements(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON public.stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_operator ON public.stock_movements(operator_id);

COMMENT ON TABLE public.stock_movements IS 'Complete audit trail of all stock changes';

-- ============================================================================
-- SECTION 6: STOCK TRANSFERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Transfer metadata
  from_location_id UUID NOT NULL REFERENCES public.locations(id),
  to_location_id UUID NOT NULL REFERENCES public.locations(id),
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_transit', 'completed', 'cancelled', 'partially_completed')
  ),
  
  -- Timeline
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Cancellation reason
  cancelled_by UUID REFERENCES auth.users(id),
  cancel_reason TEXT,
  
  -- Notes
  internal_notes TEXT,
  external_notes TEXT,
  
  -- Approval (if required)
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  
  -- Quantities
  quantity_requested INT NOT NULL,
  quantity_shipped INT NOT NULL DEFAULT 0,
  quantity_received INT NOT NULL DEFAULT 0,
  
  -- Bin information (where items were picked from)
  source_bin_id UUID REFERENCES public.warehouse_bins(id),
  
  -- Tracking
  picked_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  
  unique (transfer_id, product_variant_id)
);

CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_location ON public.stock_transfers(from_location_id, to_location_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items ON public.transfer_items(transfer_id);

COMMENT ON TABLE public.stock_transfers IS 'Inter-location stock transfers';
COMMENT ON TABLE public.transfer_items IS 'Items included in stock transfers';

-- ============================================================================
-- SECTION 7: STOCK ADJUSTMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Adjustment classification
  location_id UUID NOT NULL REFERENCES public.locations(id),
  adjustment_type TEXT NOT NULL CHECK (
    adjustment_type IN ('positive', 'negative', 'correction')
  ),
  
  -- Reason
  reason TEXT NOT NULL,
  category TEXT,  -- 'damaged', 'lost', 'found', 'cycle_count', 'system_error'
  
  -- Status and approval
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'processed')
  ),
  
  -- Operator
  requested_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  processed_by UUID REFERENCES auth.users(id),
  
  -- Timeline
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  
  rejection_reason TEXT,
  review_notes TEXT,
  
  -- Related movement (auto-created when approved)
  related_movement_id UUID REFERENCES public.stock_movements(id)
);

CREATE INDEX IF NOT EXISTS idx_adjustments_status ON public.stock_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_adjustments_requestor ON public.stock_adjustments(requested_by);

COMMENT ON TABLE public.stock_adjustments IS 'Stock adjustment requests requiring approval';

-- ============================================================================
-- SECTION 8: RESERVATIONS (PENDING ORDERS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id),
  
  -- Product variant and quantity
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  
  -- Reservation expiry
  expires_at TIMESTAMPTZ,  -- When reservation auto-releases
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'released', 'converted', 'expired')
  ),
  
  -- Conversion to fulfilled order
  converted_to_fulfillment_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reservations_order ON public.stock_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_location ON public.stock_reservations(location_id);
CREATE INDEX IF NOT EXISTS idx_reservations_expiry ON public.stock_reservations(expires_at) WHERE status = 'active';

COMMENT ON TABLE public.stock_reservations IS 'Temporary stock reservations for pending orders';

-- ============================================================================
-- SECTION 9: STORAGE FUNCTIONS FOR STOCK OPERATIONS
-- ============================================================================

-- Function: Get current stock level for a location+variant
CREATE OR REPLACE FUNCTION public.get_location_stock(p_location_id uuid, p_variant_id uuid)
RETURNS TABLE (
  available INT,
  reserved INT,
  damaged INT,
  incoming INT,
  total INT
)
LANGUAGE plpgsql
STABLE
AS $$
begin
  return query
  select coalesce(ls.available, 0), coalesce(ls.reserved, 0), coalesce(ls.damaged, 0), 
         coalesce(ls.incoming, 0),
         coalesce(ls.available, 0) - coalesce(ls.reserved, 0) - coalesce(ls.damaged, 0) as net_available
  from public.location_stock ls
  where ls.location_id = p_location_id and ls.product_variant_id = p_variant_id;
end;
$$;

-- Function: Get total stock across all active locations
CREATE OR REPLACE FUNCTION public.get_global_stock(p_variant_id uuid)
RETURNS TABLE (
  location_id uuid,
  location_name text,
  available int,
  reserved int,
  damaged int,
  incoming int
)
LANGUAGE plpgsql
STABLE
AS $$
begin
  return query
  select ls.location_id, l.name, ls.available, ls.reserved, ls.damaged, ls.incoming
  from public.location_stock ls
  join public.locations l on l.id = ls.location_id
  where ls.product_variant_id = p_variant_id and l.is_active = true
  order by ls.available desc;
end;
$$;

-- Function: Adjust stock with validation (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.adjust_location_stock(
  p_location_id uuid,
  p_variant_id uuid,
  p_quantity int,
  p_movement_type_code text,
  p_reference_type text default null,
  p_reference_id uuid default null,
  p_operator_id uuid default null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
declare
  v_current_stock record;
  v_new_available int;
  v_movement_id uuid;
  v_movement_code text;
begin
  -- Validate operator permissions
  if p_operator_id is not null and not public.has_permission('inventory.adjust') then
    raise exception 'Permission denied: inventory.adjust required';
  end if;
  
  -- Get current stock
  select * into v_current_stock from public.get_location_stock(p_location_id, p_variant_id);
  
  -- Calculate new available
  v_new_available := v_current_stock.available + p_quantity;
  
  -- Prevent negative available unless explicitly allowed
  if v_new_available < 0 and p_movement_type_code not in ('adjustment', 'correction') then
    raise exception 'Insufficient stock: cannot reduce below zero without adjustment approval';
  end if;
  
  -- Begin transaction to ensure consistency
  begin
    -- Upsert location stock
    insert into public.location_stock (location_id, product_variant_id, available, last_synced_at)
    values (p_location_id, p_variant_id, v_new_available, now())
    on conflict (location_id, product_variant_id) do update set
      available = coalesce(location_stock.available, 0) + p_quantity,
      last_synced_at = now();
    
    -- Create movement record
    insert into public.stock_movements (
      location_id, product_variant_id, movement_type_code, quantity,
      reference_type, reference_id, operator_id,
      old_available, new_available, created_at
    ) values (
      p_location_id, p_variant_id, p_movement_type_code, p_quantity,
      p_reference_type, p_reference_id, p_operator_id,
      v_current_stock.available, v_new_available, now()
    ) returning id into v_movement_id;
    
    -- Update global stock in product_variants
    update public.product_variants pv
    set global_stock = global_stock + p_quantity, reserved = least(reserved, 0)
    where id = p_variant_id;
    
    commit;
    
    return v_movement_id;
  exception when others then
    rollback;
    raise;
  end;
end;
$$;

COMMENT ON FUNCTION public.adjust_location_stock(uuid,uuid,int,text,text,uuid,uuid) IS
  'Atomically adjust stock with automatic movement logging';

ALTER FUNCTION public.adjust_location_stock(uuid,uuid,int,text,text,uuid,uuid) SET search_path = public, pg_temp;

-- Function: Reserve stock for order
CREATE OR REPLACE FUNCTION public.reserve_order_stock(
  p_order_id uuid,
  p_location_id uuid,
  p_variant_id uuid,
  p_quantity int,
  p_expiry_hours int default 24
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_current_stock record;
begin
  -- Check permissions
  if not public.has_permission('inventory.manage') and not public.has_permission('orders.update') then
    raise exception 'Permission denied: inventory.manage or orders.update required';
  end if;
  
  -- Get current available stock
  select * into v_current_stock from public.get_location_stock(p_location_id, p_variant_id);
  
  if v_current_stock.available < p_quantity then
    raise exception 'Insufficient stock at location %: need %, have %', p_location_id, p_quantity, v_current_stock.available;
  end if;
  
  -- Reserve stock
  update public.location_stock
  set reserved = reserved + p_quantity, last_synced_at = now()
  where location_id = p_location_id and product_variant_id = p_variant_id;
  
  -- Create reservation record
  insert into public.stock_reservations (
    order_id, location_id, product_variant_id, quantity, expires_at, status, created_at
  ) values (
    p_order_id, p_location_id, p_variant_id, p_quantity,
    now() + (p_expiry_hours || ' hours')::interval, 'active', now()
  );
end;
$$;

COMMENT ON FUNCTION public.reserve_order_stock(uuid,uuid,uuid,int,int) IS
  'Reserve stock for an order, releasing after expiry or conversion';

ALTER FUNCTION public.reserve_order_stock(uuid,uuid,uuid,int,int) SET search_path = public, pg_temp;

-- Function: Release reservation back to available
CREATE OR REPLACE FUNCTION public.release_reservation(
  p_reservation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_reservation record;
begin
  select * into v_reservation from public.stock_reservations where id = p_reservation_id;
  
  if v_reservation is null then
    raise exception 'Reservation not found: %', p_reservation_id;
  end if;
  
  -- Release stock
  update public.location_stock
  set reserved = greatest(reserved - v_reservation.quantity, 0), last_synced_at = now()
  where location_id = v_reservation.location_id and product_variant_id = v_reservation.product_variant_id;
  
  -- Mark reservation as released
  update public.stock_reservations
  set status = 'released', released_at = now()
  where id = p_reservation_id;
end;
$$;

COMMENT ON FUNCTION public.release_reservation(uuid) IS
  'Release stock reservation and return to available pool';

ALTER FUNCTION public.release_reservation(uuid) SET search_path = public, pg_temp;

COMMIT;
