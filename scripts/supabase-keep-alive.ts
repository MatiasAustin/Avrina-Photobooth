import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local if running locally
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function keepAlive() {
  console.log('--- Supabase Keep-Alive Routine ---');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase credentials missing.');
    console.log('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_ equivalents).');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log(`Connecting to: ${supabaseUrl}`);
    
    // Perform a simple query to keep the database active
    // We try to list tables or just run a simple select
    const { data, error } = await supabase.from('_keep_alive').select('*').limit(1).maybeSingle();
    
    // Note: If the table doesn't exist, it still counts as activity in some cases,
    // but better to hit a real table or use a generic query if possible.
    // However, Supabase JS doesn't have a direct 'SELECT 1' helper without a table.
    // So we'll just try to fetch anything or handle the 'table not found' gracefully.
    
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      console.warn('Query returned an error, but connection was attempted:', error.message);
    } else {
      console.log('Successfully pinged Supabase database.');
    }

    console.log('Last active update triggered at:', new Date().toISOString());
  } catch (err) {
    console.error('Unexpected error during keep-alive:', err);
    process.exit(1);
  }
}

keepAlive();
