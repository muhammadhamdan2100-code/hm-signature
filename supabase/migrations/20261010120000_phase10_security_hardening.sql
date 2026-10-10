-- ============================================================================
-- PHASE 10 SECURITY HARDENING — RLS on new Phase 10 tables + audit immutability
--                                    + two broken inventory RPCs corrected.
--
-- WHY THIS EXISTS:
-- The Phase 10 workstreams (10-A..10-J) created ~30 tables and their SECURITY
-- DEFINER functions but never ran `ENABLE ROW LEVEL SECURITY` on any of them, and
-- never installed the audit-immutability trigger its header advertised. Verified
-- against the live project with the anon key (the credential an unauthenticated
-- visitor holds): every one of those tables answered HTTP 200, and `locations` and
-- `shipping_providers` returned real rows. So warehouse locations, provider config,
-- staff permissions, the audit ledger, CRM and accounting data were publicly
-- readable and tamperable — directly contradicting the earlier "Phase 10 complete /
-- production-ready" report.
--
-- DESIGN (deliberately non-breaking):
-- * RLS is ENABLED but NOT FORCED. The table owner (the migration role) and every
--   SECURITY DEFINER function run as that owner, so they keep seeing and writing
--   rows exactly as before; `service_role` carries BYPASSRLS and is likewise
--   unaffected. Only `anon` and `authenticated` — which are NOT the owner and are
--   given no permissive policy — are now denied. This is safe because the React
--   client reads NONE of these tables directly (verified by a repo-wide grep); all
--   legitimate access is through the SECURITY DEFINER functions above.
-- * `shipments` is intentionally left out of the blanket lock: the storefront/track
--   order and admin order-detail views embed it, so it needs a least-privilege
--   *policy* (customer sees only their own order's shipment; staff via
--   has_permission), not an owner-only posture. That follow-up is recorded as an
--   open item; it is not claimed as fixed here.
-- * audit_log is append-only: a guard trigger rejects UPDATE/DELETE from any role
--   other than the maintenance owner, so an unauthorized user cannot rewrite or
--   erase the ledger even if a future policy ever granted it a write.
-- ============================================================================

BEGIN;

-- ─── 1. Enable RLS on every new Phase 10 table that has no client read path ───────────────────
-- (IF EXISTS guards against a table that a partially-applied migration never created.)
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
    'shipping_providers', 'shipping_rates', 'shipment_tracking_events', 'webhook_handlers',
    'crm_customers', 'crm_events',
    'accounting_invoices', 'accounting_payments', 'accounting_refunds',
    'workflow_events'
    -- NOTE: 'shipments' deliberately excluded — see header.
  ];
BEGIN
  FOREACH t IN ARRAY phase10_tables LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END
$$;

-- ─── 2. Audit ledger immutability ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_audit_log_immutable() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
begin
  -- The maintenance owner and the service role may still archive/prune via a
  -- controlled migration path; everyone else is blocked. RLS already denies
  -- anon/authenticated reach, so this is the second, independent layer.
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
  'Prevent non-owner roles from modifying or deleting audit_log rows (append-only ledger).';

-- ─── 3. Correct adjust_location_stock ─────────────────────────────────────────────────────────
-- The deployed body is 100% non-executable: it issued `commit;` and `rollback;` inside the
-- function (Postgres raises "invalid transaction termination" for a function's transaction
-- control) and updated product_variants.global_stock, a column that does not exist. Both are
-- removed; the atomic location_stock upsert and its movement log — the function's real
-- contract — are preserved. Volatility corrected from STABLE to VOLATILE (it writes).
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
  if p_operator_id is not null and not public.has_permission('inventory.adjust') then
    raise exception 'Permission denied: inventory.adjust required';
  end if;

  select * into v_current_stock from public.get_location_stock(p_location_id, p_variant_id);

  v_new_available := coalesce(v_current_stock.available, 0) + p_quantity;

  if v_new_available < 0 and p_movement_type_code not in ('adjustment', 'correction') then
    raise exception 'Insufficient stock: cannot reduce below zero without adjustment approval';
  end if;

  -- A PL/pgSQL function runs inside the caller's transaction; there is nothing to
  -- commit here. On error the enclosing transaction rolls back automatically.
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
    p_reference_type, p_reference_id, p_operator_id,
    coalesce(v_current_stock.available, 0), v_new_available, now()
  ) returning id into v_movement_id;

  return v_movement_id;
end;
$$;

ALTER FUNCTION public.adjust_location_stock(uuid,uuid,int,text,text,uuid,uuid) SET search_path = public, pg_temp;

-- ─── 4. Correct reserve_order_stock (over-reservation race) ───────────────────────────────────
-- The deployed body read the free stock with an unlocked helper then blind-updated reserved,
-- so two concurrent reservations both saw the same `available` and both succeeded — the classic
-- read-then-write oversell. The fix locks the location_stock row FOR UPDATE for the duration of
-- the check-and-reserve, and measures availability against available-minus-already-reserved (the
-- free figure), matching release_reservation, which returns stock by lowering reserved only.
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
begin
  if not public.has_permission('inventory.manage') and not public.has_permission('orders.update') then
    raise exception 'Permission denied: inventory.manage or orders.update required';
  end if;

  -- Serialize concurrent reservations on the same variant+location.
  select coalesce(available, 0), coalesce(reserved, 0)
    into v_available, v_reserved
    from public.location_stock
    where location_id = p_location_id and product_variant_id = p_variant_id
    for update;

  v_free := v_available - v_reserved;

  if v_free < p_quantity then
    raise exception 'Insufficient stock at location %: need %, have %',
      p_location_id, p_quantity, v_free;
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

COMMIT;
