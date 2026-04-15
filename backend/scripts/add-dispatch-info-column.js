// Run this script to add the dispatch_info column to the incidents table.
// Usage: node scripts/add-dispatch-info-column.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addColumn() {
  console.log('📦 Adding dispatch_info column to incidents table...\n');

  // Try to select dispatch_info to see if column already exists
  const { error: checkError } = await supabase
    .from('incidents')
    .select('dispatch_info')
    .limit(1);

  if (!checkError) {
    console.log('✅ Column dispatch_info already exists. Nothing to do.');
    process.exit(0);
  }

  console.log('Column does not exist yet. Attempting to add via Supabase...');
  console.log('\n⚠️  Supabase JS client cannot run DDL (ALTER TABLE) statements.');
  console.log('Please add the column manually via one of these methods:\n');
  console.log('Option 1: Supabase Dashboard');
  console.log(`  1. Go to: ${process.env.SUPABASE_URL.replace('.co', '.co').replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase.co', '')}/sql/new`);
  console.log('  2. Run this SQL:\n');
  console.log('     ALTER TABLE incidents ADD COLUMN IF NOT EXISTS dispatch_info JSONB DEFAULT NULL;\n');
  console.log('Option 2: psql command');
  console.log(`  PGPASSWORD='${process.env.SUPABASE_DB_PASSWORD}' psql -h db.${process.env.SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')}.supabase.co -p 5432 -U postgres -d postgres -c "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS dispatch_info JSONB DEFAULT NULL;"\n`);
}

addColumn().catch(console.error);
