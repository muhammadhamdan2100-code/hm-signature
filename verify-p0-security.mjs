import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://ttnfdxabfkmqlqssqdep.supabase.co';
const serviceRoleKey = import.meta.env?.SUPABASE_SERVICE_ROLE_KEY || 
                       process.env.SUPABASE_SERVICE_ROLE_KEY ||
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE1ODkwOTk5OTl9.CRXP1A7WOeojeWVOC4Xd0iCNweLjWuvMPdoBvPnMK2Q';

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
      console.log('  ⚠️  No policies found via RPC');
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
      console.log('  ⚠️  No policies found via RPC');
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
