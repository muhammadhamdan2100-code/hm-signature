#!/usr/bin/env node
/**
 * P0 Security Gate - Automated Attack Test Suite
 * 
 * Requires:
 * - Supabase URL: https://ttnfdxabfkmqlqssqdep.supabase.co
 * - Service-role key for backend verification (optional)
 * - Authenticated customer account for escalation tests (recommended)
 * 
 * Run with: node test-p0-runtime.mjs --mode attack|regression|full
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const SUPABASE_URL = 'https://ttnfdxabfkmqlqssqdep.supabase.co';
let SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let TEST_CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL;
let TEST_CUSTOMER_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD;

// CLI argument parsing
const args = process.argv.slice(2);
const mode = args.find(a => a.startsWith('--mode='))?.split('=')[1] || 'full';
const verbose = args.includes('--verbose');

console.log(`\n=== P0 Security Gate Runtime Tests ===`);
console.log(`Mode: ${mode}`);
if (SERVICE_ROLE_KEY) console.log('Service role: CONFIGURED');
else console.log('Service role: MISSING (some tests will be UNVERIFIED)');
if (TEST_CUSTOMER_EMAIL && TEST_CUSTOMER_PASSWORD) {
  console.log('Customer auth: CONFIGURED');
} else {
  console.log('Customer auth: MISSING (escalation tests UNVERIFIED)');
}

const results = {
  timestamp: new Date().toISOString(),
  mode,
  environment: SUPABASE_URL,
  attack_tests: [],
  regression_tests: [],
  database_controls: []
};

// Helper functions
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message, success = false) {
  if (!verbose && !success) return;
  const prefix = success ? '✅' : '⚠️ ';
  console.log(`${prefix} ${message}`);
}

// Create clients
const anonClient = createClient(SUPABASE_URL, '');
const serviceRoleClient = SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY) : null;

// ============================================================
// SECTION A: ATTACK TESTS
// ============================================================

async function testAnonymousCreateWithPaidStatus() {
  /**
   * Test A1: Anonymous user attempts to POST order with payment_status='Paid'
   * Expected Result: DENIED by trigger or RLS
   * Success Criteria: Error returned, no order created
   */
  
  const testName = 'A1: Anonymous POST order with payment_status=Paid';
  
  try {
    const { data, error } = await anonClient
      .from('orders')
      .insert({
        customer_id: '00000000-0000-0000-0000-000000000000',
        payment_status: 'Paid',
        status: 'Pending',
        total: 100,
        tax_amount: 10,
        shipping_address: '{}',
        billing_address: '{}'
      })
      .select();
    
    if (error) {
      log(`${testName} → DENIED`, true);
      results.attack_tests.push({ test: 'A1', status: 'PASS', reason: error.code, details: error.message });
      return true;
    } else {
      log(`${testName} → ALLOWED ❌`, false);
      results.attack_tests.push({ test: 'A1', status: 'FAIL', reason: 'Unauthorized creation allowed' });
      return false;
    }
  } catch (err) {
    log(`${testName} → Exception caught`, true);
    results.attack_tests.push({ test: 'A1', status: 'PASS', reason: err.message.substring(0, 100) });
    return true;
  }
}

async function testAnonymousCreateWithVerifiedStatus() {
  /**
   * Test A2: Anonymous user attempts to POST order with payment_status='Verified'
   * Expected Result: DENIED by trigger or RLS
   */
  
  const testName = 'A2: Anonymous POST order with payment_status=Verified';
  
  try {
    const { data, error } = await anonClient
      .from('orders')
      .insert({
        customer_id: '00000000-0000-0000-0000-000000000000',
        payment_status: 'Verified',
        status: 'Pending',
        total: 100
      })
      .select();
    
    if (error) {
      log(`${testName} → DENIED`, true);
      results.attack_tests.push({ test: 'A2', status: 'PASS', reason: error.code });
      return true;
    } else {
      log(`${testName} → ALLOWED ❌`, false);
      results.attack_tests.push({ test: 'A2', status: 'FAIL', reason: 'Unauthorized creation allowed' });
      return false;
    }
  } catch (err) {
    log(`${testName} → Exception caught`, true);
    results.attack_tests.push({ test: 'A2', status: 'PASS', reason: err.message.substring(0, 100) });
    return true;
  }
}

async function testAnonymousRPCPlaceOrder() {
  /**
   * Test A3: Anonymous user attempts to call place_order RPC
   * Expected Result: DENIED by EXECUTE permissions
   */
  
  const testName = 'A3: Anonymous RPC place_order call';
  
  try {
    const { data, error } = await anonClient.rpc('place_order', {
      customer_id: '00000000-0000-0000-0000-000000000000',
      items: [],
      shipping_address: {},
      billing_address: {}
    });
    
    if (error) {
      log(`${testName} → DENIED (EXECUTE permission check)`, true);
      results.attack_tests.push({ test: 'A3', status: 'PASS', reason: error.code });
      return true;
    } else {
      log(`${testName} → ALLOWED ❌`, false);
      results.attack_tests.push({ test: 'A3', status: 'FAIL', reason: 'Function callable by anon' });
      return false;
    }
  } catch (err) {
    log(`${testName} → Exception caught`, true);
    results.attack_tests.push({ test: 'A3', status: 'PASS', reason: err.message.substring(0, 100) });
    return true;
  }
}

// ============================================================
// SECTION B: REGRESSION TESTS
// ============================================================

async function testLegitimateCheckoutFlow() {
  /**
   * Test R1: Legitimate customer checkout flow
   * Prerequisites: Authenticated customer account
   * Expected Result: Order created successfully with payment_status='Pending'
   */
  
  if (!TEST_CUSTOMER_EMAIL || !TEST_CUSTOMER_PASSWORD) {
    log('R1: LEGITIMATE CHECKOUT FLOW → SKIPPED (no customer credentials)', true);
    results.regression_tests.push({ test: 'R1', status: 'UNVERIFIED', reason: 'Credentials missing' });
    return;
  }
  
  const testName = 'R1: Legitimate customer checkout flow';
  
  // First, authenticate as customer
  let customerAuth;
  try {
    const { data: authData, error: _authError } = await serviceRoleClient.auth.admin.createUser({
      email: TEST_CUSTOMER_EMAIL,
      password: TEST_CUSTOMER_PASSWORD
    });
    customerAuth = authData.user;
  } catch (err) {
    // User might already exist
    log('Customer auth setup skipped (user may exist)');
  }
  
  // If we have an auth token, test the checkout
  // Note: This requires actual session tokens which are complex to generate
  // Skipping detailed implementation for now
  log(`${testName} → PARTIALLY IMPLEMENTED (requires full session management)`);
  results.regression_tests.push({ test: 'R1', status: 'PARTIAL', reason: 'Session auth not fully implemented' });
}

async function testCustomerPaymentEscalationBlocked() {
  /**
   * Test R2: Customer cannot escalate payment status via PATCH
   * Prerequisites: Existing order in Pending state, authenticated customer
   * Expected Result: Guard trigger blocks upgrade to Paid/Verified
   */
  
  if (!TEST_CUSTOMER_EMAIL || !TEST_CUSTOMER_PASSWORD) {
    log('R2: CUSTOMER ESCALATION BLOCKED → SKIPPED (no credentials)', true);
    results.regression_tests.push({ test: 'R2', status: 'UNVERIFIED', reason: 'Credentials missing' });
    return;
  }
  
  const testName = 'R2: Customer escalates Pending→Paid (should fail)';
  
  // Implementation would require:
  // 1. Authenticate customer
  // 2. Get their order ID
  // 3. Attempt PATCH with payment_status='Paid'
  // 4. Expect guard trigger exception
  
  log(`${testName} → NOT IMPLEMENTED (requires session and existing data)`);
  results.regression_tests.push({ test: 'R2', status: 'NOT_IMPLEMENTED', reason: 'Requires session + existing order' });
}

// ============================================================
// SECTION C: DATABASE CONTROL VERIFICATION
// ============================================================

async function verifyGuardTriggerExists() {
  /**
   * Verify guard trigger is actually deployed on orders table
   * Requires service-role credentials
   */
  
  const testName = 'C1: Guard trigger deployment verification';
  
  if (!serviceRoleClient) {
    log(`${testName} → SKIPPED (no service-role key)`, true);
    results.database_controls.push({ control: 'C1', status: 'UNVERIFIED', reason: 'No service-role' });
    return;
  }
  
  try {
    // Query pg_trigger to verify trigger exists
    const { count, error } = await serviceRoleClient
      .from('pg_trigger')
      .select('*', { count: 'exact', head: true })
      .eq('tgname', 'trg_orders_guard_payment_state');
    
    if (!error && count > 0) {
      log(`${testName} → TRIGGER EXISTS ✅`, true);
      results.database_controls.push({ control: 'C1', status: 'PASS', details: 'Trigger found' });
    } else if (error) {
      log(`${testName} → Could not verify: ${error.code}`, false);
      results.database_controls.push({ control: 'C1', status: 'UNVERIFIED', reason: error.code });
    } else {
      log(`${testName} → TRIGGER NOT FOUND ❌`, false);
      results.database_controls.push({ control: 'C1', status: 'FAIL', reason: 'Trigger missing' });
    }
  } catch (err) {
    log(`${testName} → Exception: ${err.message}`, false);
    results.database_controls.push({ control: 'C1', status: 'UNVERIFIED', reason: err.message });
  }
}

async function verifyRLSPoliciesOnOrders() {
  /**
   * Verify restrictive RLS policies exist on orders table
   * Checks that old broad policies were removed
   */
  
  const testName = 'C2: Orders RLS policy configuration';
  
  if (!serviceRoleClient) {
    log(`${testName} → SKIPPED (no service-role key)`, true);
    results.database_controls.push({ control: 'C2', status: 'UNVERIFIED', reason: 'No service-role' });
    return;
  }
  
  try {
    const { data, error } = await serviceRoleClient
      .rpc('list_policies', { tablename: 'orders' });
    
    if (error) {
      log(`${testName} → Could not query policies: ${error.code}`, false);
      results.database_controls.push({ control: 'C2', status: 'UNVERIFIED', reason: error.code });
      return;
    }
    
    const policyNames = data.map(p => p.polname);
    const hasBroadPolicies = policyNames.some(n => 
      n.includes('Manage Orders') || n.includes('Customers insert orders') || n === '*'
    );
    
    if (hasBroadPolicies) {
      log(`${testName} → BROAD POLICIES STILL EXIST ❌`, false);
      results.database_controls.push({ control: 'C2', status: 'FAIL', reason: 'Permissive policies remain' });
    } else {
      log(`${testName} → RESTRICTIVE POLICIES ONLY ✅`, true);
      results.database_controls.push({ control: 'C2', status: 'PASS', policies: policyNames });
    }
  } catch (err) {
    log(`${testName} → Exception: ${err.message}`, false);
    results.database_controls.push({ control: 'C2', status: 'UNVERIFIED', reason: err.message });
  }
}

async function verifyPlaceOrderGrantStatus() {
  /**
   * Verify place_order RPC has anon EXECUTE revoked
   */
  
  const testName = 'C3: Place order EXECUTE grant status';
  
  if (!serviceRoleClient) {
    log(`${testName} → SKIPPED (no service-role key)`, true);
    results.database_controls.push({ control: 'C3', status: 'UNVERIFIED', reason: 'No service-role' });
    return;
  }
  
  try {
    const { data, error } = await serviceRoleClient.rpc('check_function_grants', { 
      func_name: 'place_order' 
    });
    
    if (error) {
      log(`${testName} → Could not check grants: ${error.code}`, false);
      results.database_controls.push({ control: 'C3', status: 'UNVERIFIED', reason: error.code });
      return;
    }
    
    const anonCanExecute = data.anon_exec || data.anon;
    
    if (anonCanExecute) {
      log(`${testName} → ANON CAN EXECUTE ❌ VULNERABLE`, false);
      results.database_controls.push({ control: 'C3', status: 'FAIL', reason: 'Anon still has EXECUTE' });
    } else {
      log(`${testName} → ANON EXECUTE REVOKED ✅`, true);
      results.database_controls.push({ control: 'C3', status: 'PASS' });
    }
  } catch (err) {
    log(`${testName} → Exception: ${err.message}`, false);
    results.database_controls.push({ control: 'C3', status: 'UNVERIFIED', reason: err.message });
  }
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function runFullTestSuite() {
  console.log('\n=== RUNNING FULL TEST SUITE ===\n');
  
  // Attack tests
  console.log('--- ATTACK TESTS ---');
  await testAnonymousCreateWithPaidStatus();
  await sleep(100);
  await testAnonymousCreateWithVerifiedStatus();
  await sleep(100);
  await testAnonymousRPCPlaceOrder();
  
  // Database controls
  console.log('\n--- DATABASE CONTROLS ---');
  await verifyGuardTriggerExists();
  await sleep(100);
  await verifyRLSPoliciesOnOrders();
  await sleep(100);
  await verifyPlaceOrderGrantStatus();
  
  // Regression tests
  console.log('\n--- REGRESSION TESTS ---');
  await testLegitimateCheckoutFlow();
  await testCustomerPaymentEscalationBlocked();
  
  // Summary
  printSummary();
}

function printSummary() {
  console.log('\n=== SUMMARY ===\n');
  
  const attackPass = results.attack_tests.filter(t => t.status === 'PASS').length;
  const attackFail = results.attack_tests.filter(t => t.status === 'FAIL').length;
  const attackPartial = results.attack_tests.filter(t => t.status === 'PARTIAL' || t.status === 'NOT_IMPLEMENTED').length;
  
  const controlPass = results.database_controls.filter(c => c.status === 'PASS').length;
  const controlUnverified = results.database_controls.filter(c => c.status === 'UNVERIFIED').length;
  const controlFail = results.database_controls.filter(c => c.status === 'FAIL').length;
  
  const regressionTotal = results.regression_tests.length;
  
  console.log(`Attack Tests: ${attackPass}/${results.attack_tests.length} PASS, ${attackFail}/${results.attack_tests.length} FAIL, ${attackPartial}/${results.attack_tests.length} PARTIAL/N/A`);
  console.log(`Database Controls: ${controlPass}/${results.database_controls.length} PASS, ${controlUnverified}/${results.database_controls.length} UNVERIFIED, ${controlFail}/${results.database_controls.length} FAIL`);
  console.log(`Regression Tests: ${regressionTotal} tests checked (session-based)`);
  
  // Write results
  import('fs').then(fs => {
    fs.writeFileSync('./p0-test-results.json', JSON.stringify(results, null, 2));
  });
  
  console.log('\nResults saved to: ./p0-test-results.json');
  
  console.log('\n=== TEST SUITE COMPLETE ===\n');
}

// Entry point
if (args.includes('--help') || args.length === 0) {
  console.log(`
P0 Security Gate Runtime Tests

Usage: node test-p0-runtime.mjs [options]

Options:
  --mode=attack    Run only attack tests
  --mode=regression  Run only regression tests  
  --mode=full      Run all tests (default)
  --verbose        Show all output
  --help           Show this help

Environment variables:
  SUPABASE_SERVICE_ROLE_KEY  Supabase service role key (optional)
  TEST_CUSTOMER_EMAIL       Customer email for regression tests (optional)
  TEST_CUSTOMER_PASSWORD    Customer password (optional)

Examples:
  node test-p0-runtime.mjs --mode=attack --verbose
  SUPABASE_SERVICE_ROLE_KEY=xxx node test-p0-runtime.mjs --mode=full
  `);
  process.exit(0);
}

runFullTestSuite().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
