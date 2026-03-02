import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://fixemvsckapejyfwphft.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeGVtdnNja2FwZWp5ZndwaGZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkxNDczNSwiZXhwIjoyMDg3NDkwNzM1fQ.q_mgJQlae4B0AJMv9RziN2MzjVRKylG-06WIKFoG434'
);

async function checkClients() {
  console.log('Checking clients table...');
  const { data, error, count } = await supabase
    .from('clients')
    .select('*', { count: 'exact' });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Clients count:', count);
    console.log('Clients:', data);
  }
}

checkClients();
