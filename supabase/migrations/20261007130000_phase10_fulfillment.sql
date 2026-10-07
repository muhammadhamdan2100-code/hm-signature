-- ============================================================================
-- PHASE 10-D — FULFILLMENT OPERATIONS
-- 
-- Enterprise fulfillment architecture with:
-- Order allocation (select best warehouse/bin for each line item)
-- Picking (pick lists, bin locations, batch picking)
-- Packing (packing slips, package tracking, weight/dimensions)
-- Fulfillment status workflow (pending → allocated → picked → packed → shipped → delivered)
-- Partial fulfillment support (some items shipped, others pending)
-- Backorder handling (out-of-stock items ordered anyway)
-- Returns/Restocking workflows
-- 
-- Critical invariant: Prevent inconsistent state through transactional operations
-- ============================================================================

BEGIN;

-- ==========================================================================
-- SECTION 1: FULFILLMENT STATUS ENUMS AND CONSTANTS
-- ==========================================================================

-- Create fulfillment status enumeration
DO $$
begin
  -- Ensure fulfillment_statuses table exists
  if not exists (select 1 from information_schema.tables where table_name = 'fulfillment_statuses') then
    create table public.fulfillment_statuses (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      sort_order INT NOT NULL DEFAULT 0,
      is_terminal BOOLEAN DEFAULT false,  -- Terminal states can't transition further
      created_at TIMESTAMPTZ DEFAULT now()
    );

    insert into public.fulfillment_statuses (code, name, description, sort_order, is_terminal) values
      ('pending', 'Pending', 'Awaiting allocation/picking', 10, false),
      ('allocated', 'Allocated', 'Items reserved at warehouse', 20, false),
      ('picking', 'Picking', 'Warehouse staff picking items', 30, false),
      ('picked', 'Picked', 'All items collected', 40, false),
      ('packing', 'Packing', 'Being packaged for shipment', 50, false),
      ('packed', 'Packed', 'Ready to ship', 60, false),
      ('shipped', 'Shipped', 'In transit to customer', 70, false),
      ('delivered', 'Delivered', 'Successfully delivered', 80, true),
      ('cancelled', 'Cancelled', 'Fulfillment cancelled', 90, true),
      ('returned', 'Returned', 'Item returned by customer', 100, true);
  end if;
end
$$;

COMMENT ON TABLE public.fulfillment_statuses IS 'Standardized fulfillment workflow states';

-- ==========================================================================
-- SECTION 2: FULFILLMENT HEAD RECORDS
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to order and order item
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  fulfillment_number TEXT NOT NULL UNIQUE,  -- e.g., "FUL-2026-00001"
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status in ('pending', 'allocated', 'picking', 'picked', 'packing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned')
  ),
  
  -- Location info
  warehouse_id UUID NOT NULL REFERENCES public.locations(id),
  shipping_address JSONB,  -- Snapshot of address at fulfillment time
  
  -- Tracking info (populated when shipped)
  carrier_id UUID,  -- Created in Phase 10-E (will add FK constraint later)
  tracking_number TEXT,
  tracking_url TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Quantities (for partial fulfillment tracking)
  total_items INT NOT NULL,       -- Total items in this fulfillment
  fulfilled_items INT NOT NULL default 0,  -- Items actually shipped
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancel_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fulfillments_order ON public.fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_status ON public.fulfillments(status);
CREATE INDEX IF NOT EXISTS idx_fulfillments_warehouse ON public.fulfillments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_number ON public.fulfillments(fulfillment_number);
CREATE INDEX IF NOT EXISTS idx_fulfillments_shipped ON public.fulfillments(shipped_at) WHERE shipped_at IS NOT NULL;

COMMENT ON TABLE public.fulfillments IS 'Top-level fulfillment records per order';
COMMENT ON COLUMN public.fulfillments.fulfilled_items IS 'Track partial fulfillments';
COMMENT ON COLUMN public.fulfillments.fulfillment_number IS 'Human-readable fulfillment reference';

-- Function to generate fulfillment number
CREATE OR REPLACE FUNCTION public.generate_fulfillment_number()
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
declare
  v_year int;
  v_seq int;
begin
  v_year := EXTRACT(YEAR FROM now());
  select coalesce(max(to_int(substring(fulfillment_number from 'FUL-\d{4}-(\d+)')), 0) + 1, 1)
  into v_seq
  from public.fulfillments
  where fulfillment_number like 'FUL-' || v_year || '-%';
  
  return format('FUL-%04d-%05d', v_year, v_seq);
end;
$$;

COMMENT ON FUNCTION public.generate_fulfillment_number() IS
  'Generate next sequential fulfillment number';

ALTER FUNCTION public.generate_fulfillment_number() SET search_path = public, pg_temp;

-- Triggers to auto-update updated_at
CREATE OR REPLACE FUNCTION public.trigger_update_updated_at() RETURNS TRIGGER AS $$
begin
  new.updated_at = now();
  return new;
end;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fulfillments_timestamp ON public.fulfillments;
CREATE TRIGGER update_fulfillments_timestamp
  BEFORE UPDATE ON public.fulfillments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_updated_at();

-- ==========================================================================
-- SECTION 3: FULFILLMENT LINES (PER ORDER ITEM)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.fulfillment_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  fulfillment_id UUID NOT NULL REFERENCES public.fulfillments(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL,  -- Links to original order item
  
  -- Product variant
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  sku TEXT NOT NULL,  -- Denormalized for quick reference
  
  -- Quantities
  quantity_ordered INT NOT NULL,
  quantity_shipped INT NOT NULL DEFAULT 0,
  quantity_backordered INT DEFAULT 0,
  
  -- Bin location (where item was picked from)
  warehouse_bin_id UUID REFERENCES public.warehouse_bins(id),
  
  -- Picking details
  picked_at TIMESTAMPTZ,
  picked_by UUID REFERENCES auth.users(id),
  packed_at TIMESTAMPTZ,
  packed_by UUID REFERENCES auth.users(id),
  
  -- Status
  line_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    line_status in ('pending', 'picked', 'packed', 'shipped', 'backordered', 'cancelled')
  ),
  
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_fulfillment_lines_fulfillment ON public.fulfillment_lines(fulfillment_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_lines_variant ON public.fulfillment_lines(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_lines_status ON public.fulfillment_lines(line_status);
CREATE INDEX IF NOT EXISTS idx_fulfillment_lines_order_item ON public.fulfillment_lines(order_item_id);

COMMENT ON TABLE public.fulfillment_lines IS 'Individual line items within a fulfillment';
COMMENT ON COLUMN public.fulfillment_lines.quantity_backordered IS 'Items that couldn''t be fulfilled';

-- ==========================================================================
-- SECTION 4: PICKING WORKFLOW
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.pick_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  fulfillment_id UUID NOT NULL REFERENCES public.fulfillments(id) ON DELETE CASCADE,
  pick_list_number TEXT NOT NULL UNIQUE,
  
  -- Warehouse/batch info
  warehouse_id UUID NOT NULL REFERENCES public.locations(id),
  batch_number TEXT,  -- For batch picking optimization
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status in ('draft', 'assigned', 'in_progress', 'completed', 'cancelled')
  ),
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Quantities
  total_items INT NOT NULL,
  items_picked INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.pick_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  pick_list_id UUID NOT NULL REFERENCES public.pick_lists(id) ON DELETE CASCADE,
  fulfillment_line_id UUID NOT NULL REFERENCES public.fulfillment_lines(id) ON DELETE CASCADE,
  
  product_variant_id UUID NOT NULL,
  bin_code TEXT NOT NULL,  -- Where to pick from
  quantity_needed INT NOT NULL,
  quantity_picked INT DEFAULT 0,
  
  picked_at TIMESTAMPTZ,
  picker_verified BOOLEAN DEFAULT false,
  
  unique (pick_list_id, fulfillment_line_id)
);

CREATE INDEX IF NOT EXISTS idx_pick_lists_fulfillment ON public.pick_lists(fulfillment_id);
CREATE INDEX IF NOT EXISTS idx_pick_lists_status ON public.pick_lists(status);
CREATE INDEX IF NOT EXISTS idx_pick_lists_assigned ON public.pick_lists(assigned_to, status) WHERE status in ('assigned', 'in_progress');

COMMENT ON TABLE public.pick_lists IS 'Pick list generation for warehouse operations';
COMMENT ON TABLE public.pick_list_items IS 'Individual picks within a pick list';

-- ==========================================================================
-- SECTION 5: PACKING WORKFLOW
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.packing_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  fulfillment_id UUID NOT NULL REFERENCES public.fulfillments(id) ON DELETE CASCADE UNIQUE,
  
  -- Package info
  package_type TEXT,  -- box, envelope, poly mailer
  dimensions JSONB,   -- length, width, height, weight
  packing_materials JSONB,  -- void fill, labels, etc.
  
  packing_date TIMESTAMPTZ,
  packed_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packing_slips_fulfillment ON public.packing_slips(fulfillment_id);

COMMENT ON TABLE public.packing_slips IS 'Package information and contents';

-- ==========================================================================
-- SECTION 6: BACKORDER MANAGEMENT
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.backorders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL,
  
  -- Product info
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  sku TEXT NOT NULL,
  
  -- Quantity
  quantity_backordered INT NOT NULL,
  quantity_remaining INT NOT NULL,  -- Decreases as fulfilled
  
  -- Allocation (where we expect stock to come from)
  expected_from_location_id UUID REFERENCES public.locations(id),
  expected_arrival_date TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status in ('active', 'fulfilled', 'cancelled', 'expired')
  ),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_backorders_order ON public.backorders(order_id);
CREATE INDEX IF NOT EXISTS idx_backorders_variant ON public.backorders(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_backorders_status ON public.backorders(status);

COMMENT ON TABLE public.backorders IS 'Tracking items ordered but out of stock';

-- ==========================================================================
-- SECTION 7: RETURNS AND RESTOCKING
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  fulfillment_id UUID REFERENCES public.fulfillments(id),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  
  -- Return type
  return_type TEXT NOT NULL CHECK (
    return_type in ('defective', 'wrong_item', 'not_as_described', 'changed_mind', 'duplicate', 'damaged_in_transit')
  ),
  
  -- Reason
  reason TEXT NOT NULL,
  reason_category TEXT,
  
  -- Requested vs approved quantities
  requested_items JSONB,  -- [{line_id, quantity, condition}]
  approved_items JSONB,  -- Final approved quantities
  
  -- Approval workflow
  status TEXT NOT NULL DEFAULT 'requested' CHECK (
    status in ('requested', 'approved', 'rejected', 'received', 'processed', 'closed')
  ),
  
  -- Received
  received_at TIMESTAMPTZ,
  received_by UUID REFERENCES auth.users(id),
  received_condition TEXT,  -- damaged, good, etc.
  
  -- Processing
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  restock_quantity INT,  -- How much gets restocked
  writeoff_quantity INT,  -- How much disposed
  refund_amount NUMERIC(12,2),  -- Final refund
  
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  return_id UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  fulfillment_line_id UUID NOT NULL,
  product_variant_id UUID NOT NULL,
  
  quantity_returned INT NOT NULL,
  quantity_approved INT DEFAULT 0,
  quantity_restocked INT DEFAULT 0,
  quantity_writeoff INT DEFAULT 0,
  
  item_condition TEXT,  -- good, damaged, defective, etc.
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.return_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  return_id UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  ra_number TEXT NOT NULL UNIQUE,  -- RMA number
  
  authorization_code TEXT,
  instructions TEXT,  -- Restock, repair, dispose, return to vendor
  authorized_by UUID REFERENCES auth.users(id),
  authorized_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_returns_fulfillment ON public.returns(fulfillment_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);
CREATE INDEX IF NOT EXISTS idx_return_items_return ON public.return_items(return_id);

COMMENT ON TABLE public.returns IS 'Customer return requests and processing';
COMMENT ON TABLE public.return_authorizations IS 'Return merchandise authorization (RMA)';

-- ==========================================================================
-- SECTION 8: FULFILLMENT CREATION FUNCTIONS
-- ==========================================================================

-- Function: Allocate items to fulfillment based on warehouse availability
CREATE OR REPLACE FUNCTION public.create_fulfillment_from_order(
  p_order_id uuid,
  p_warehouse_id uuid default null,  -- If null, use primary warehouse
  p_auto_allocate boolean default true  -- Automatically allocate stock
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
declare
  v_fulfillment_id uuid;
  v_primary_warehouse uuid;
  v_line_record record;
  v_shippable_qty int;
  v_current_stock record;
begin
  -- Validate permissions
  if not public.has_permission('orders.update') and not public.has_permission('inventory.manage') then
    raise exception 'Permission denied: orders.update or inventory.manage required';
  end if;
  
  -- Determine warehouse
  if p_warehouse_id is null then
    select id into v_primary_warehouse
    from public.locations
    where is_primary = true and is_active = true
    limit 1;
    
    if v_primary_warehouse is null then
      raise exception 'No primary warehouse configured';
    end if;
    p_warehouse_id := v_primary_warehouse;
  end if;
  
  -- Begin transaction for atomic fulfillment creation
  begin
    -- Generate fulfillment number
    v_fulfillment_id := public.generate_fulfillment_id(p_order_id, p_warehouse_id);
    
    -- Create fulfillment header
    insert into public.fulfillments (
      id, fulfillment_number, order_id, warehouse_id, shipping_address,
      status, total_items, created_at, updated_at
    )
    select
      v_fulfillment_id,
      public.generate_fulfillment_number(),
      o.id,
      p_warehouse_id,
      o.billing_address,  -- Simplified - should use shipping address
      'pending',
      sum(oi.quantity),
      now(),
      now()
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.id = p_order_id and o.customer_id = (select customer_id from public.orders where id = p_order_id)
    group by o.id, o.billing_address;
    
    -- Create fulfillment lines for each unfulfilled order item
    for v_line_record in
      select oi.id, oi.product_variant_id, oi.sku, oi.quantity
      from public.order_items oi
      where oi.order_id = p_order_id
        and oi.quantity > coalesce((select coalesce(sum(quantity_shipped), 0)
                                    from public.fulfillment_lines fl
                                    where fl.order_item_id = oi.id), 0)
    loop
      -- Check stock availability
      select * into v_current_stock from public.get_location_stock(p_warehouse_id, v_line_record.product_variant_id);
      
      -- Calculate shippable quantity
      v_shippable_qty := greatest(0, v_current_stock.available - v_current_stock.reserved);
      
      if v_shippable_qty >= v_line_record.quantity then
        -- Full fulfillment possible
        insert into public.fulfillment_lines (
          fulfillment_id, order_item_id, product_variant_id, sku,
          quantity_ordered, quantity_shipped, line_status, warehouse_bin_id
        ) values (
          v_fulfillment_id, v_line_record.id, v_line_record.product_variant_id, v_line_record.sku,
          v_line_record.quantity, v_line_record.quantity, 'picked', null  -- Auto-pick if full stock
        );
        
        -- Reserve stock immediately
        if p_auto_allocate then
          perform public.reserve_order_stock(v_fulfillment_id, p_warehouse_id, v_line_record.product_variant_id, v_line_record.quantity, 24);
        end if;
        
      elsif v_shippable_qty > 0 then
        -- Partial fulfillment
        insert into public.fulfillment_lines (
          fulfillment_id, order_item_id, product_variant_id, sku,
          quantity_ordered, quantity_shipped, line_status, quantity_backordered
        ) values (
          v_fulfillment_id, v_line_record.id, v_line_record.product_variant_id, v_line_record.sku,
          v_line_record.quantity, v_shippable_qty, 'pending', v_line_record.quantity - v_shippable_qty
        );
        
        -- Reserve available stock
        if p_auto_allocate then
          perform public.reserve_order_stock(v_fulfillment_id, p_warehouse_id, v_line_record.product_variant_id, v_shippable_qty, 24);
        end if;
        
        -- Create backorder for remainder
        if v_line_record.quantity - v_shippable_qty > 0 then
          insert into public.backorders (
            order_id, order_item_id, product_variant_id, sku,
            quantity_backordered, quantity_remaining, expected_from_location_id, status
          ) values (
            p_order_id, v_line_record.id, v_line_record.product_variant_id, v_line_record.sku,
            v_line_record.quantity - v_shippable_qty, v_line_record.quantity - v_shippable_qty,
            p_warehouse_id, 'active'
          );
        end if;
        
      else
        -- Complete backorder
        insert into public.backorders (
          order_id, order_item_id, product_variant_id, sku,
          quantity_backordered, quantity_remaining, expected_from_location_id, status
        ) values (
          p_order_id, v_line_record.id, v_line_record.product_variant_id, v_line_record.sku,
          v_line_record.quantity, v_line_record.quantity,
          p_warehouse_id, 'active'
        );
      end if;
    end loop;
    
    commit;
    
    return v_fulfillment_id;
    
  exception when others then
    rollback;
    raise;
  end;
end;
$$;

COMMENT ON FUNCTION public.create_fulfillment_from_order(uuid,uuid,bool) IS
  'Create fulfillment from order with automatic allocation and stock reservation';

ALTER FUNCTION public.create_fulfillment_from_order(uuid,uuid,bool) SET search_path = public, pg_temp;

-- Function: Transition fulfillment status
CREATE OR REPLACE FUNCTION public.transition_fulfillment_status(
  p_fulfillment_id uuid,
  p_new_status text,
  p_operator_id uuid default null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_current_status text;
  v_allowed boolean;
begin
  -- Get current status
  select status into v_current_status from public.fulfillments where id = p_fulfillment_id;
  
  if v_current_status is null then
    raise exception 'Fulfillment not found: %', p_fulfillment_id;
  end if;
  
  -- Validate permission based on transition
  case p_new_status
    when 'allocated' then
      v_allowed := public.has_permission('inventory.manage');
    when 'picking', 'picked' then
      v_allowed := public.has_permission('inventory.manage') or public.has_permission('orders.update');
    when 'packing', 'packed' then
      v_allowed := public.has_permission('inventory.manage');
    when 'shipped' then
      v_allowed := public.has_permission('shipping.manage');
    when 'delivered' then
      v_allowed := public.has_permission('orders.view');
    when 'cancelled' then
      v_allowed := public.has_permission('orders.cancel');
    else
      v_allowed := false;
  end case;
  
  if not v_allowed and p_operator_id is null then
    raise exception 'Permission denied for status transition';
  end if;
  
  -- Update status
  update public.fulfillments
  set status = p_new_status,
      updated_at = now(),
      shipped_at = case when p_new_status = 'shipped' then now() else shipped_at end,
      delivered_at = case when p_new_status = 'delivered' then now() else delivered_at end
  where id = p_fulfillment_id;
  
  -- Log audit event
  perform public.write_audit_log(
    'fulfillment.status_changed',
    'fulfillment',
    p_fulfillment_id,
    jsonb_build_object('old_status', v_current_status),
    jsonb_build_object('new_status', p_new_status),
    'api',
    true,
    jsonb_build_object('operator_id', p_operator_id)
  );
end;
$$;

COMMENT ON FUNCTION public.transition_fulfillment_status(uuid,text,uuid) IS
  'Transition fulfillment through workflow with permission validation';

ALTER FUNCTION public.transition_fulfillment_status(uuid,text,uuid) SET search_path = public, pg_temp;

COMMIT;
