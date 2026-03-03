#!/usr/bin/env node
/**
 * Test AI Probing Service - 验证服务可以运行
 */

import { AIProbingService } from './ai-probing-service.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://fixemvsckapejyfwphft.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

async function testService() {
  console.log('🧪 Testing AI Probing Service...\n');
  
  const service = new AIProbingService();
  
  try {
    // 1. 测试初始化
    console.log('1. Testing browser initialization...');
    await service.init();
    console.log('   ✅ Browser initialized\n');
    
    // 2. 测试数据库连接
    console.log('2. Testing database connection...');
    const { data, error } = await supabase
      .from('clients')
      .select('count')
      .single();
    
    if (error) throw error;
    console.log(`   ✅ Database connected (${data.count} clients)\n`);
    
    // 3. 测试单个客户探测 (使用第一个活跃客户)
    console.log('3. Testing single client probe...');
    const { data: clients } = await supabase
      .from('clients')
      .select('id, business_name')
      .eq('status', 'active')
      .limit(1);
    
    if (clients && clients.length > 0) {
      const client = clients[0];
      console.log(`   Probing: ${client.business_name} (${client.id})`);
      
      const results = await service.probeClient(client.id);
      
      console.log('   ✅ Probe completed');
      console.log(`   - Platforms tested: ${results.summary.totalPlatforms}`);
      console.log(`   - Brand mentioned on: ${results.summary.brandMentionedOn.join(', ') || 'none'}`);
      console.log(`   - Citations found: ${results.summary.citationsFound}\n`);
    } else {
      console.log('   ⚠️  No active clients found\n');
    }
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await service.close();
  }
}

testService();
