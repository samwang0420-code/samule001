import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

async function checkTables() {
  console.log('Checking Supabase tables...\n');
  
  // Check clients table
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .limit(3);
  
  if (clientsError) {
    console.error('❌ clients table error:', clientsError.message);
  } else {
    console.log('✅ clients table OK, count:', clients?.length || 0);
  }
  
  // Check questionnaire_submissions table
  const { data: subs, error: subsError } = await supabase
    .from('questionnaire_submissions')
    .select('*')
    .limit(3);
  
  if (subsError) {
    console.error('❌ questionnaire_submissions table error:', subsError.message);
    console.log('\n⚠️ 需要先执行 schema-update-questionnaire.sql');
  } else {
    console.log('✅ questionnaire_submissions table OK, count:', subs?.length || 0);
  }
  
  // Check analysis_jobs table
  const { data: jobs, error: jobsError } = await supabase
    .from('analysis_jobs')
    .select('*')
    .limit(3);
  
  if (jobsError) {
    console.error('❌ analysis_jobs table error:', jobsError.message);
  } else {
    console.log('✅ analysis_jobs table OK, count:', jobs?.length || 0);
  }
}

checkTables();
