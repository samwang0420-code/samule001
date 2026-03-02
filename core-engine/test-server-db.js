import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

console.log('URL:', process.env.SUPABASE_URL);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const testData = {
  id: crypto.randomUUID(),
  website: 'https://server-direct-test.com',
  business_name: 'SERVER DIRECT TEST ' + Date.now(),
  industry: 'medical-spa',
  contact_name: 'Server Tester',
  contact_email: 'server@test.com',
  source: 'server-test',
  created_at: new Date().toISOString()
};

async function test() {
  console.log('Inserting:', testData.business_name);
  const { data, error } = await supabase.from('questionnaire_submissions').insert(testData).select();
  if (error) {
    console.error('ERROR:', error.message);
  } else {
    console.log('SUCCESS! Inserted:', data?.[0]?.business_name);
  }
}

test();
