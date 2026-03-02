import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fixemvsckapejyfwphft.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeGVtdnNja2FwZWp5ZndwaGZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkxNDczNSwiZXhwIjoyMDg3NDkwNzM1fQ.q_mgJQlae4B0AJMv9RziN2MzjVRKylG-06WIKFoG434'
);

async function check() {
  const { data, error } = await supabase.from('questionnaire_submissions').select('*').limit(5);
  console.log('Data count:', data ? data.length : 0);
  console.log('Data:', JSON.stringify(data, null, 2));
  if (error) console.log('Error:', error);
}
check();
