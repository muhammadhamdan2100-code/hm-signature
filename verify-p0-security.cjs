const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Use existing service role key from .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('ERROR: No service role key found in .env');
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.toLowerCase().includes('supabase') || k.toLowerCase().includes('service')));
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function runVerification() {
  console.log('=== P0 Security Control Verification ===\n');
  
  // Test 1: Verify guard trigger exists and is active
  console.log('TEST 1: Guard Trigger Status');
  try {
    const { data: triggerData, error: triggerError } = await adminClient.rpc('get_guard_trigger_status');
    if (triggerError) {
      console.log('  ❌ Error:', triggerError.message);
    } else {
      console.log('  ✅ Function exists and accessible');
      console.log('     EXISTS:', triggerData?.exists || 'N/A');
    }
  } catch (err) {
    console.log('  ❌ Exception:', err.message);
  }
  
  // Test 2: Check RLS policies on orders table
  console.log('\nTEST 2: Orders Table RLS Policies');
  try {
    const { data: policies, error: polError } = await adminClient
      .rpc('list_policies', { tablename: 'orders' });
    
    if (polError) {
      console.log('  ❌ Error:', polError.message);
    } else if (!policies || policies.length === 0) {
      console.log('  ⚠️  No policies found - checking via direct query...');
      const { data: directPolicies, error: directError } = await adminClient
        .from('pg_policies')
        .select('*')
        .eq('schemaname', 'public')
        .eq('tablename', 'orders');
      
      if (directError) {
        console.log('  ❌ Direct query error:', directError.message);
      } else {
        console.log(`  ✅ Found ${directPolicies.length} policy/policies:`);
        directPolicies.forEach(p => {
          console.log(`     - ${p.polname.padEnd(45)} [${p.polcmd}]`);
        });
      }
    } else {
      console.log(`  ✅ Found ${policies.length} policy/policies:`);
      policies.forEach(p => {
        console.log(`     - ${p.polname.padEnd(45)} [${p.command}]`);
      });
    }
  } catch (err) {
    console.log('  ❌ Exception:', err.message);
  }
  
  // Test 3: Verify place_order grant status
  console.log('\nTEST 3: Place Order Function Grants');
  try {
    const { data: grants, error: grantError } = await adminClient.rpc('check_function_grants', { 
      func_name: 'place_order' 
    });
    
    if (grantError) {
      console.log('  ❌ Error:', grantError.message);
    } else {
      console.log('  anon EXECUTE:', grants?.anon ? '❌ VULNERABLE (should be revoked)' : '✅ Revoked');
      console.log('  authenticated EXECUTE:', grants?.authenticated ? '⚠️  Granted (expected for staff)' : '✅ Revoked');
      console.log('  service_role EXECUTE:', grants?.service_role ? '✅ Granted (expected)' : '⚠️  Revoked (unexpected)');
    }
  } catch (err) {
    console.log('  ❌ Exception:', err.message);
  }
  
  // Test 4: Verify payments table policies
  console.log('\nTEST 4: Payments Table RLS Policies');
  try {
    const { data: paymentPolicies, error: ppError } = await adminClient
      .rpc('list_policies', { tablename: 'payments' });
    
    if (ppError) {
      console.log('  ❌ Error:', ppError.message);
    } else if (!paymentPolicies || paymentPolicies.length === 0) {
      const { data: directPPolicies, error: dppError } = await adminClient
        .from('pg_policies')
        .select('*')
        .eq('schemaname', 'public')
        .eq('tablename', 'payments');
      
      if (dppError) {
        console.log('  ❌ Query error:', dppError.message);
      } else {
        console.log(`  ✅ Found ${directPPolicies.length} policy/policies:`);
        directPPolicies.forEach(p => {
          console.log(`     - ${p.polname.padEnd(45)} [${p.polcmd}]`);
        });
      }
    } else {
      console.log(`  ✅ Found ${paymentPolicies.length} policy/policies:`);
      paymentPolicies.forEach(p => {
        console.log(`     - ${p.polname.padEnd(45)} [${p.command}]`);
      });
    }
  } catch (err) {
    console.log('  ❌ Exception:', err.message);
  }
  
  console.log('\n=== P0 Verification Complete ===');
}

runVerification();
