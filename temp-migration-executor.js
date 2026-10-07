const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.supabase' });

const supabaseUrl = 'https://ttnfdxabfkmqlqssqdep.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env.supabase');
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceRoleKey);

async function executeMigration() {
  try {
    const fs = require('fs');
    const migrationPath = './supabase/migrations/20261006018002_p0_security_remediation_final.sql';
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing P0 Security Gate migration...\n');
    
    const { data, error } = await client.rpc('sql', { sql_query: sql });
    
    if (error) {
      console.error('Migration ERROR:', error.message);
      console.error('Error details:', error);
      process.exit(1);
    }

    console.log('Migration completed successfully!');
    console.log('Result:', data);

  } catch (err) {
    console.error('Execution ERROR:', err.message);
    process.exit(1);
  }
}

executeMigration();
