#!/usr/bin/env node
/**
 * Real Data Test - Part 2: API and Database Integration Test
 * 测试真实API端点和数据库集成
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';

function fetch(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}${path}`, { 
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: data.substring(0, 500) });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Timeout')));
  });
}

async function testRealAPIs() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     API Integration Test - 真实API端点测试             ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // Test 1: Health Check
  console.log('🧪 Test 1: API Health');
  try {
    const res = await fetch('/api/health');
    console.log(`   Status: ${res.status}`);
    console.log(`   Data: ${JSON.stringify(res.data, null, 2)}\n`);
  } catch (e) {
    console.error(`   ❌ Error: ${e.message}\n`);
  }
  
  // Test 2: Try to access probing summary (will get 401 without auth)
  console.log('🧪 Test 2: Probing Summary Endpoint');
  try {
    const res = await fetch('/api/probing/all/summary');
    console.log(`   Status: ${res.status}`);
    if (res.status === 401 || res.status === 403) {
      console.log(`   ✅ Endpoint protected correctly (requires auth)\n`);
    } else {
      console.log(`   Data: ${JSON.stringify(res.data, null, 2).substring(0, 500)}\n`);
    }
  } catch (e) {
    console.error(`   ❌ Error: ${e.message}\n`);
  }
  
  // Test 3: Try to access AI citations endpoint
  console.log('🧪 Test 3: AI Citations Endpoint');
  try {
    const res = await fetch('/api/probing/all/latest');
    console.log(`   Status: ${res.status}`);
    if (res.status === 401 || res.status === 403) {
      console.log(`   ✅ Endpoint protected correctly (requires auth)\n`);
    } else {
      console.log(`   Data: ${JSON.stringify(res.data, null, 2).substring(0, 500)}\n`);
    }
  } catch (e) {
    console.error(`   ❌ Error: ${e.message}\n`);
  }
  
  // Test 4: Dashboard HTML
  console.log('🧪 Test 4: Dashboard HTML Structure');
  try {
    const res = await fetch('/');
    const html = res.data;
    
    const checks = [
      { name: 'Rankings menu', pattern: /showPage\('rankings'\)/ },
      { name: 'AI Citations menu', pattern: /showPage\('ai-citations'\)/ },
      { name: 'loadRankings function', pattern: /async function loadRankings/ },
      { name: 'loadAICitations function', pattern: /async function loadAICitations/ },
      { name: 'Rankings page container', pattern: /id="page-rankings"/ },
      { name: 'AI Citations page container', pattern: /id="page-ai-citations"/ },
      { name: 'Rankings table body', pattern: /id="rankings-table-body"/ },
      { name: 'Citations list', pattern: /id="citations-list"/ }
    ];
    
    console.log(`   HTML Size: ${html.length} bytes\n`);
    
    let passed = 0;
    for (const check of checks) {
      if (check.pattern.test(html)) {
        console.log(`   ✅ ${check.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${check.name} - NOT FOUND`);
      }
    }
    
    console.log(`\n   Structure: ${passed}/${checks.length} checks passed\n`);
    
  } catch (e) {
    console.error(`   ❌ Error: ${e.message}\n`);
  }
  
  console.log('✅ API Integration Test Complete!');
}

testRealAPIs().catch(console.error);
