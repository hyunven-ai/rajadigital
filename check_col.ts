import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1] || '';

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('transactions').select('username').limit(1);
  if (error) {
    console.error(error.message);
  } else {
    console.log('Username column exists!', data);
  }
}
run();
