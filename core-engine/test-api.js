#!/usr/bin/env node
/**
 * API Test Suite - API端点测试
 * 
 * 验证所有API端点是否正常工作
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'geo-api-key-demo';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`${colors.green}✅ PASS${colors.reset}: ${name}`);
    passed++;
  } catch (error) {
    console.log(`${colors.red}❌ FAIL${colors.reset}: ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...options.headers
    }
  });
  
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     GEO API Test Suite                                   ║');
  console.log(`║     Testing: ${BASE_URL.padEnd(46)} ║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Test 1: Health Check
  await test('GET /health - Server is running', async () => {
    const { status, data } = await request('/health');
    if (status !== 200) throw new Error(`Status: ${status}`);
    if (data.status !== 'ok') throw new Error('Status not ok');
  });

  // Test 2: API Health
  await test('GET /api/health - API endpoint', async () => {
    const { status, data } = await request('/api/health');
    if (status !== 200) throw new Error(`Status: ${status}`);
    if (!data.version) throw new Error('No version in response');
  });

  // Test 3: Authentication Required
  await test('GET /api/clients without API key - Should reject', async () => {
    const res = await fetch(`${BASE_URL}/api/clients`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // Test 4: List Clients
  await test('GET /api/clients - List all clients', async () => {
    const { status, data } = await request('/api/clients');
    if (status !== 200) throw new Error(`Status: ${status}`);
    if (!data.success) throw new Error('Response not successful');
    if (!Array.isArray(data.data)) throw new Error('Data is not an array');
  });

  // Test 5: Create Analysis
  let clientId;
  await test('POST /api/analyze - Start new analysis', async () => {
    const { status, data } = await request('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        businessName: 'Test Business',
        address: '123 Test St, Houston, TX',
        industry: 'medical',
        services: ['Botox', 'Fillers'],
        async: true
      })
    });
    if (status !== 202) throw new Error(`Status: ${status}, expected 202`);
    if (!data.success) throw new Error('Analysis not started');
    clientId = data.data.clientId;
  });

  // Test 6: Get Analysis (if clientId exists)
  if (clientId) {
    await test(`GET /api/analysis/${clientId} - Get analysis results`, async () => {
      const { status, data } = await request(`/api/analysis/${clientId}`);
      // May be 404 if not completed yet, that's ok
      if (status !== 200 && status !== 404) {
        throw new Error(`Unexpected status: ${status}`);
      }
    });
  }

  // Test 7: Invalid Endpoint
  await test('GET /api/invalid - Should return 404', async () => {
    const { status } = await request('/api/invalid');
    if (status !== 404) throw new Error(`Expected 404, got ${status}`);
  });

  // Test 8: Bad Request
  await test('POST /api/analyze without required fields', async () => {
    const { status } = await request('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ industry: 'medical' }) // Missing required fields
    });
    if (status !== 400) throw new Error(`Expected 400, got ${status}`);
  });

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('Test Summary');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}🎉 All API tests passed!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}⚠️  Some tests failed${colors.reset}`);
    process.exit(1);
  }
}

// SSL Certificate Check
async function checkSSL() {
  if (!BASE_URL.includes('https')) {
    console.log(`${colors.yellow}⚠️  Skipping SSL check (not HTTPS)${colors.reset}`);
    return;
  }
  
  console.log('\n🔒 Checking SSL Certificate...\n');
  
  try {
    const { execSync } = await import('child_process');
    const domain = new URL(BASE_URL).hostname;
    
    const result = execSync(
      `echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates`,
      { encoding: 'utf8' }
    );
    
    console.log('Certificate Info:');
    console.log(result);
    
    const notAfter = result.match(/notAfter=(.+)/)?.[1];
    if (notAfter) {
      const expiry = new Date(notAfter);
      const daysUntilExpiry = Math.floor((expiry - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 30) {
        console.log(`${colors.yellow}⚠️  Certificate expires in ${daysUntilExpiry} days${colors.reset}`);
      } else {
        console.log(`${colors.green}✅ Certificate valid for ${daysUntilExpiry} days${colors.reset}`);
      }
    }
  } catch (e) {
    console.log(`${colors.red}❌ SSL check failed: ${e.message}${colors.reset}`);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--ssl-only')) {
    await checkSSL();
    return;
  }
  
  await runTests();
  
  if (BASE_URL.includes('https')) {
    await checkSSL();
  }
}

main().catch(console.error);
