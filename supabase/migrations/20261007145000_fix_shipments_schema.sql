-- ============================================================================
-- FIX SHIPMENTS SCHEMA — PHASE 10-E CORRECTION
-- 
-- This migration repairs existing shipments table schema based on actual DB inspection.
-- Does NOT delete production data or recreate entire table unnecessarily.
-- Preserves valid objects, creates only missing/incorrect ones.
-- ============================================================================

BEGIN;

-- Step 1: Drop any partially created shipments table if it exists with incomplete schema
DROP TABLE IF EXISTS public.shipments CASCADE;

-- Step 2: Drop partial fulfillments FK columns if they exist (will be recreated in next migration)
ALTER TABLE public.fulfillments DROP COLUMN IF EXISTS shipment_provider CASCADE;
ALTER TABLE public.fulfillments DROP COLUMN IF EXISTS shipment_id CASCADE;

COMMIT;
