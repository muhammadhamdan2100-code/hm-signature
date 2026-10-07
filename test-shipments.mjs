import { createClient } from '@supabase/supabase-js';

const client = createClient(
  'https://ttnfdxabfkmqlqssqdep.supabase.co', 
  'sb_publishable_YddIVoREaSe7cD-pgEUHNQ_ID1H0fY9'
);

async function check() {
  // Try querying pg_tables directly via RPC or direct select
  const { data: tables, error } = await client
    .from('pg_tables')
    .select('*')
    .eq('schemaname', 'public')
    .eq('tablename', 'shipments');
  
  if (error) {
    console.log('❌ Cannot query pg_tables:', error.message);
    return;
  }
  
  if (tables && tables.length > 0) {
    console.log('✅ SHIPMENTS TABLE EXISTS in remote database!');
  } else {
    console.log('⚠️ Shipments table not found in pg_tables results');
  }
  
  // Also try selecting from shipping_providers
  const { data: providers } = await client.from('shipping_providers').select('*', { count: 'exact', head: true });
  console.log('Shipping providers table accessible:', providers !== null ? '✅ YES' : '❌ NO');
}

check();
