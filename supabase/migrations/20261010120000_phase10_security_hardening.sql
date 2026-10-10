-- ============================================================================
-- PHASE 10 SECURITY HARDENING + INVENTORY-RPC CORRECTNESS
--
-- WHY THIS EXISTS:
-- The Phase 10 workstreams (10-A..10-J) created ~30 tables and their SECURITY
-- DEFINER functions but never ran `ENABLE ROW LEVEL SECURITY` on any of them, never
-- revoked their default grants, and never installed the audit-immutability trigger
-- their headers advertised. Verified against the live project with the anon key (the
-- credential any unauthenticated visitor holds): every table answered HTTP 200, and
-- `locations` / `shipping_providers` returned real rows. An anon INSERT into
-- `audit_log` also succeeded. Warehouse locations, provider config, staff permissions,
-- the audit ledger, CRM and accounting data were publicly readable and tamperable.
--
-- DESIGN (non-breaking, defence-in-depth):
-- * RLS is ENABLED but NOT FORCED. The table owner and every SECURITY DEFINER function
--   run as that owner, so they keep seeing/writing rows; `service_role` carries
--   BYPASSRLS. `anon`/`authenticated` get no permissive policy and their table grants
--   are REVOKED, so both the privilege layer and the RLS layer independently deny them.
--   Safe because the React client reads NONE of these tables directly (re-verified by
--   grep): all legitimate access is through the SECURITY DEFINER functions below.
-- * `shipments` is now INCLUDED. Its former orders→shipments embed was removed in
--   668bc6e (the relationship never existed), so no client read depends on it; leaving
--   it unlocked would keep leaking it. When a customer shipment view is built later it
--   gets a least-privilege policy plus a re-GRANT, both recorded as a follow-up.
-- * audit_log is append-only via a guard trigger for every role other than the
--   owner/service_role maintenance path. Ordinary anon/authenticated are already denied
--   by RLS + REVOKE; the guard is the second, independent layer. Retention/deletion is
--   a controlled, owner-only migration — never exposed to application roles.
-- * This migration is idempotent: CREATE OR REPLACE functions, DROP TRIGGER IF EXISTS,
--   ENABLE RLS, and pg_constraint-guarded CHECKs, so it is safe to run once or re-run.
-- ============================================================================

BEGIN;

-- ─── 1. Enable RLS on every new Phase 10 table (no client direct read path) ────────────────────
DO $$
DECLARE
  t text;
  phase10_tables text[] := ARRAY[
    'staff_permissions',
    'audit_log', 'audit_events',
    'locations', 'warehouse_bins', 'location_stock', 'stock_movements',
    'stock_transfers', 'transfer_items', 'stock_adjustments', 'stock_reservations',
    'fulfillments', 'fulfillment_lines', 'pick_lists', 'pick_list_items',
    'packing_slips', 'backorders', 'returns', 'return_items', 'return_authorizations',
    'shipping_providers', 'shipping_rates', 'shipments', 'shipment_tracking_events', 'webhook_handlers',
    'crm_customers', 'crm_events',
    'accounting_invoices', 'accounting_payments', 'accounting_refunds',
    'workflow_events'
  ];
BEGIN
  FOREACH t IN ARRAY phase10_tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    -- Independent privilege lockdown: strip anon/authenticated default table grants.
    -- SECURITY DEFINER functions run as the owner, so they are unaffected.
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END
$$;

-- ─── 2. Audit ledger immutability ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_audit_log_immutable() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
begin
  -- Only the owner (postgres) and service_role maintenance path may modify the ledger.
  -- anon and authenticated never reach here (RLS + REVOKE deny them) and are NOT in this
  -- allow-list, so no ordinary application role has a bypass.
  if current_user in ('postgres', 'service_role') then
    return coalesce(NEW, OLD);
  end if;

  if tg_op = 'UPDATE' then
    raise exception 'audit_log is append-only: updates are prohibited'
      using errcode = 'insufficient_privilege';
  end if;
  if tg_op = 'DELETE' then
    raise exception 'audit_log is append-only: deletes are prohibited'
      using errcode = 'insufficient_privilege';
  end if;
  return coalesce(NEW, OLD);
end;
$$;

DROP TRIGGER IF EXISTS trg_audit_log_immutable ON public.audit_log;
CREATE TRIGGER trg_audit_log_immutable
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.guard_audit_log_immutable();

COMMENT ON FUNCTION public.guard_audit_log_immutable() IS
  'Append-only audit ledger: only owner/service_role maintenance may modify; app roles denied.';

-- ─── 3. Stock invariants (rerun-safe CHECKs; tables are empty so no data can violate them) ─────
DO $$
BEGIN
  IF to_regclass('public.location_stock') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'location_stock_available_nonneg' AND conrelid = 'public.location_stock'::regclass) THEN
      ALTER TABLE public.location_stock ADD CONSTRAINT location_stock_available_nonneg CHECK (available >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'location_stock_reserved_nonneg' AND conrelid = 'public.location_stock'::regclass) THEN
      ALTER TABLE public.location_stock ADD CONSTRAINT location_stock_reserved_nonneg CHECK (reserved >= 0);
    END IF;
    -- Never let reserved exceed the physical stock: the core no-oversell invariant.
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'location_stock_reserved_within_available' AND conrelid = 'public.location_stock'::regclass) THEN
      ALTER TABLE public.location_stock ADD CONSTRAINT location_stock_reserved_within_available CHECK (reserved <= available);
    END IF;
  END IF;
  IF to_regclass('public.stock_reservations') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_reservations_quantity_positive' AND conrelid = 'public.stock_reservations'::regclass) THEN
      ALTER TABLE public.stock_reservations ADD CONSTRAINT stock_reservations_quantity_positive CHECK (quantity > 0);
    END IF;
  END IF;
END
$$;

-- ─── 4. adjust_location_stock (was non-executable + trusted a caller-supplied operator) ────────
-- Old body issued `commit;`/`rollback;` inside a function (invalid in Postgres), wrote a
-- non-existent product_variants.global_stock, and skipped authorization whenever the optional
-- operator id was omitted. Now: VOLATILE, no transaction control, authorization keyed on the
-- real auth.uid() (not a forgeable parameter), and only writes columns that exist.
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
VOLATILE
AS $$
declare
  v_current_stock record;
  v_new_available int;
  v_movement_id uuid;
begin
  -- Authorize the actual acting user; a null auth.uid() is a trusted service-role/backend path.
  if auth.uid() is not null and not public.has_permission('inventory.adjust') then
    raise exception 'Permission denied: inventory.adjust required';
  end if;

  select * into v_current_stock from public.get_location_stock(p_location_id, p_variant_id);

  v_new_available := coalesce(v_current_stock.available, 0) + p_quantity;

  if v_new_available < 0 and p_movement_type_code not in ('adjustment', 'correction') then
    raise exception 'Insufficient stock: cannot reduce below zero without adjustment approval';
  end if;

  insert into public.location_stock (location_id, product_variant_id, available, last_synced_at)
    values (p_location_id, p_variant_id, v_new_available, now())
    on conflict (location_id, product_variant_id) do update set
      available = coalesce(location_stock.available, 0) + p_quantity,
      last_synced_at = now();

  insert into public.stock_movements (
    location_id, product_variant_id, movement_type_code, quantity,
    reference_type, reference_id, operator_id,
    old_available, new_available, created_at
  ) values (
    p_location_id, p_variant_id, p_movement_type_code, p_quantity,
    p_reference_type, p_reference_id, coalesce(p_operator_id, auth.uid()),
    coalesce(v_current_stock.available, 0), v_new_available, now()
  ) returning id into v_movement_id;

  return v_movement_id;
end;
$$;

ALTER FUNCTION public.adjust_location_stock(uuid,uuid,int,text,text,uuid,uuid) SET search_path = public, pg_temp;

-- ─── 5. reserve_order_stock (row-lock + oversell + replay + missing-row + quantity guards) ──────
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
VOLATILE
AS $$
declare
  v_available int;
  v_reserved  int;
  v_free      int;
  v_existing  int;
begin
  if auth.uid() is not null and not (public.has_permission('inventory.manage') or public.has_permission('orders.update')) then
    raise exception 'Permission denied: inventory.manage or orders.update required';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Reservation quantity must be a positive integer';
  end if;

  -- Replay/duplicate protection: one active reservation per (order, location, variant).
  select coalesce(max(quantity), 0) into v_existing
    from public.stock_reservations
    where order_id = p_order_id and location_id = p_location_id and product_variant_id = p_variant_id
      and status = 'active';
  if v_existing > 0 then
    if v_existing = p_quantity then return; end if; -- idempotent replay of the same reservation
    raise exception 'A different active reservation already exists for order % / variant %', p_order_id, p_variant_id;
  end if;

  -- Serialize on the physical row so concurrent reservations cannot both pass the check.
  select coalesce(available, 0), coalesce(reserved, 0)
    into v_available, v_reserved
    from public.location_stock
    where location_id = p_location_id and product_variant_id = p_variant_id
    for update;

  if v_available is null then
    raise exception 'No stock row for location % / variant %', p_location_id, p_variant_id;
  end if;

  v_free := v_available - v_reserved;
  if v_free < p_quantity then
    raise exception 'Insufficient stock at location %: need %, have %', p_location_id, p_quantity, v_free;
  end if;

  update public.location_stock
    set reserved = reserved + p_quantity, last_synced_at = now()
    where location_id = p_location_id and product_variant_id = p_variant_id;

  insert into public.stock_reservations (
    order_id, location_id, product_variant_id, quantity, expires_at, status, created_at
  ) values (
    p_order_id, p_location_id, p_variant_id, p_quantity,
    now() + (p_expiry_hours || ' hours')::interval, 'active', now()
  );
end;
$$;

ALTER FUNCTION public.reserve_order_stock(uuid,uuid,uuid,int,int) SET search_path = public, pg_temp;

-- ─── 6. release_reservation (lock + release-once, no double release) ───────────────────────────
CREATE OR REPLACE FUNCTION public.release_reservation(p_reservation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
AS $$
declare
  v_reservation record;
begin
  if auth.uid() is not null and not (public.has_permission('inventory.manage') or public.has_permission('orders.update')) then
    raise exception 'Permission denied: inventory.manage or orders.update required';
  end if;

  -- Lock the reservation row so two releases cannot both decrement `reserved`.
  select * into v_reservation from public.stock_reservations
    where id = p_reservation_id
    for update;

  if v_reservation is null then
    raise exception 'Reservation not found: %', p_reservation_id;
  end if;

  if v_reservation.status <> 'active' then
    return; -- release-once: an already released/cancelled reservation is a no-op
  end if;

  -- Lock the stock row before lowering reserved; greatest() keeps reserved >= 0 (also CHECK-enforced).
  perform 1 from public.location_stock
    where location_id = v_reservation.location_id and product_variant_id = v_reservation.product_variant_id
    for update;

  update public.location_stock
    set reserved = greatest(reserved - v_reservation.quantity, 0), last_synced_at = now()
    where location_id = v_reservation.location_id and product_variant_id = v_reservation.product_variant_id;

  update public.stock_reservations
    set status = 'released', released_at = now()
    where id = p_reservation_id;
end;
$$;

ALTER FUNCTION public.release_reservation(uuid) SET search_path = public, pg_temp;

COMMIT;
