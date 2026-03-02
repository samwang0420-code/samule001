import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testFullFlow() {
  const submissionId = crypto.randomUUID();
  const submissionData = {
    id: submissionId,
    website: 'https://api-flow-test.com',
    business_name: 'API FLOW TEST',
    industry: 'medical-spa',
    contact_name: 'Flow Tester',
    contact_email: 'flow@test.com',
    source: 'api-test',
    created_at: new Date().toISOString()
  };
  
  console.log('Inserting to DB:', submissionData);
  const { data, error } = await supabase.from('questionnaire_submissions').insert(submissionData);
  
  if (error) {
    console.error('DB ERROR:', error);
  } else {
    console.log('DB SUCCESS:', data);
  }
}

testFullFlow();
