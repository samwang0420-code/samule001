#!/usr/bin/env node
/**
 * Send Daily Iteration Summary
 * Sends a summary of completed iterations
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fixemvsckapejyfwphft.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeGVtdnNja2FwZWp5ZndwaGZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkxNDczNSwiZXhwIjoyMDg3NDkwNzM1fQ.q_mgJQlae4B0AJMv9RziN2MzjVRKylG-06WIKFoG434'
);

async function sendDailySummary() {
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's completed iterations
  const { data: completed, error } = await supabase
    .from('geo_implementation_iterations')
    .select('*')
    .eq('status', 'completed')
    .gte('completed_at', `${today}T00:00:00`)
    .order('completed_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching summary:', error);
    return;
  }
  
  if (!completed || completed.length === 0) {
    console.log(`📊 Daily Summary (${today}): No iterations completed today.`);
    return;
  }
  
  console.log(`\n📊 Daily Iteration Summary (${today})`);
  console.log('=' .repeat(60));
  console.log(`Total Completed: ${completed.length}`);
  console.log('');
  
  completed.forEach((item, i) => {
    console.log(`${i + 1}. [${item.category}] ${item.title}`);
    console.log(`   Priority: ${item.priority} | Hours: ${item.actual_hours || 'N/A'}`);
    console.log(`   Affects: ${item.affects?.join(', ') || 'N/A'}`);
    console.log('');
  });
  
  console.log('=' .repeat(60));
  console.log('System auto-updated successfully ✅');
  console.log('');
}

sendDailySummary();
