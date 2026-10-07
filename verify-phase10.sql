-- ============================================================================
-- PHASE 10 DATABASE VERIFICATION SQL
-- Run this via Supabase SQL editor to verify migrations applied correctly
-- ============================================================================

-- Check shipments table exists
SELECT 
    tablename,
    tabletype
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'shipping_providers',
    'shipping_rates', 
    'shipments',
    'shipment_tracking_events',
    'webhook_handlers'
  )
ORDER BY tablename;

-- Check shipments columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'shipments'
ORDER BY ordinal_position;

-- Check shipments FK constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' AND tc.table_name = 'shipments';

-- Check CRM tables
SELECT 
    tablename
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'crm_%' OR tablename LIKE 'accounting_%'
ORDER BY tablename;

-- Check workflow events table
SELECT * FROM public.workflow_events LIMIT 1;
