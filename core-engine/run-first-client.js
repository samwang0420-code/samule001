#!/usr/bin/env node
/**
 * 跑通第一个真实客户 - 完整流程测试
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  'https://cqtqanpuqmvicjjwqnwu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdHFhbnB1cW12aWNqandxbnd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwOTI4MDAwMCwiZXhwIjoyMDI0ODU2MDAwfQ.demo'
);

async function runFirstClient() {
  console.log('🚀 Running first real client test...\n');
  
  const testClient = {
    businessName: 'Glow Med Spa Houston',
    address: '1315 St Joseph Pkwy, Houston, TX 77002',
    industry: 'medical',
    services: ['Botox', 'Fillers', 'Laser Hair Removal'],
    email: 'test@glowmedspa.com',
    phone: '555-0123'
  };
  
  const clientId = `client_${Date.now()}`;
  
  // 1. 运行分析
  console.log('1️⃣ Running GEO analysis...');
  try {
    execSync(
      `node medical-pipeline.js "${testClient.businessName}" "${testClient.address}" "${testClient.industry}" "${testClient.services.join('" "')}"`,
      { cwd: __dirname, stdio: 'inherit', timeout: 120000 }
    );
    console.log('✅ Analysis complete\n');
  } catch (e) {
    console.log('⚠️ Analysis had issues but continuing...\n');
  }
  
  // 2. 保存到Supabase
  console.log('2️⃣ Saving to Supabase...');
  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      client_code: clientId,
      business_name: testClient.businessName,
      address: testClient.address,
      city: 'Houston',
      state: 'TX',
      industry: testClient.industry,
      services: testClient.services,
      email: testClient.email,
      phone: testClient.phone,
      status: 'active',
      plan_type: 'growth'
    })
    .select()
    .single();
  
  if (error) {
    console.log('❌ Supabase error:', error.message);
  } else {
    console.log('✅ Saved to Supabase:', client.id, '\n');
  }
  
  // 3. 执行自动部署
  console.log('3️⃣ Running auto-implementation...');
  const clientData = {
    ...testClient,
    firmName: testClient.businessName,
    city: 'Houston',
    geoScore: 75
  };
  
  try {
    const { executeGEOOptimization } = await import('./lib/auto-implement.js');
    const result = await executeGEOOptimization(clientId, clientData);
    
    if (result.success) {
      console.log('✅ Implementation complete!');
      console.log(`   Steps completed: ${result.summary.completed}/${result.summary.totalSteps}`);
    } else {
      console.log('❌ Implementation failed:', result.error);
    }
  } catch (e) {
    console.log('❌ Implementation error:', e.message);
  }
  
  console.log('\n🎉 First client test completed!');
  console.log(`Client ID: ${clientId}`);
  console.log(`Dashboard: https://dashboard.gspr-hub.site`);
}

runFirstClient().catch(console.error);
