const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read .env.local
const envPath = path.join(__dirname, '.env.local');
const envData = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envData.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(part => part.trim()))
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyTables() {
  const tables = ['queries', 'models', 'concept_cache', 'analytics'];
  console.log('Verifying Supabase tables...');

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`❌ Table "${table}" verification failed:`, error.message);
    } else {
      console.log(`✅ Table "${table}" exists and is accessible.`);
    }
  }
}

verifyTables();
