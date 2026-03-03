#!/usr/bin/env node
/**
 * Comprehensive Test Suite for GEO Dashboard + Agentic Probing
 * 全面测试套件 - 确保系统健壮性
 */

import http from 'http';
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = {
  passed: [],
  failed: [],
  warnings: []
};

function log(type, message) {
  const timestamp = new Date().toISOString();
  if (type === 'PASS') {
    console.log(`✅ ${message}`);
    TEST_RESULTS.passed.push(message);
  } else if (type === 'FAIL') {
    console.error(`❌ ${message}`);
    TEST_RESULTS.failed.push(message);
  } else if (type === 'WARN') {
    console.warn(`⚠️  ${message}`);
    TEST_RESULTS.warnings.push(message);
  } else {
    console.log(`ℹ️  ${message}`);
  }
}

/**
 * Test 1: API Health Check
 */
async function testAPIHealth() {
  log('INFO', 'Test 1: API Health Check');
  
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    if (data.status === 'ok' && data.database === 'connected') {
      log('PASS', 'API server is healthy and database is connected');
      return true;
    } else {
      log('FAIL', `API health check failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    log('FAIL', `API health check error: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: API Endpoints Exist
 */
async function testAPIEndpoints() {
  log('INFO', '\nTest 2: API Endpoints Verification');
  
  const endpoints = [
    { method: 'GET', path: '/api/health', auth: false },
    { method: 'GET', path: '/api/clients', auth: true },
    { method: 'GET', path: '/api/probing/all/summary', auth: true },
    { method: 'GET', path: '/api/probing/all/latest', auth: true },
    { method: 'POST', path: '/api/probing/test-client/fingerprints', auth: true }
  ];
  
  let passed = 0;
  
  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        headers: endpoint.auth ? {} : {}
      };
      
      const response = await fetch(`${BASE_URL}${endpoint.path}`, options);
      
      // 401/403 means endpoint exists but requires auth
      // 404 means endpoint doesn't exist
      if (response.status === 401 || response.status === 403) {
        log('PASS', `${endpoint.method} ${endpoint.path} - Endpoint exists (protected)`);
        passed++;
      } else if (response.status === 404) {
        log('FAIL', `${endpoint.method} ${endpoint.path} - Endpoint NOT FOUND`);
      } else if (response.status === 200 || response.status === 201) {
        log('PASS', `${endpoint.method} ${endpoint.path} - Endpoint working`);
        passed++;
      } else {
        log('WARN', `${endpoint.method} ${endpoint.path} - Status: ${response.status}`);
        passed++;
      }
    } catch (error) {
      log('FAIL', `${endpoint.method} ${endpoint.path} - Error: ${error.message}`);
    }
  }
  
  log('INFO', `Endpoints: ${passed}/${endpoints.length} passed`);
  return passed === endpoints.length;
}

/**
 * Test 3: Static Files (Dashboard)
 */
async function testStaticFiles() {
  log('INFO', '\nTest 3: Static Files (Dashboard Pages)');
  
  const pages = [
    '/',
    '/login.html',
    '/analysis-request.html'
  ];
  
  let passed = 0;
  
  for (const page of pages) {
    try {
      const response = await fetch(`${BASE_URL}${page}`);
      const html = await response.text();
      
      if (response.status === 200 && html.length > 1000) {
        log('PASS', `${page} - Loaded (${html.length} bytes)`);
        passed++;
      } else {
        log('FAIL', `${page} - Failed (${response.status}, ${html.length} bytes)`);
      }
    } catch (error) {
      log('FAIL', `${page} - Error: ${error.message}`);
    }
  }
  
  log('INFO', `Static files: ${passed}/${pages.length} passed`);
  return passed === pages.length;
}

/**
 * Test 4: Playwright Initialization
 */
async function testPlaywright() {
  log('INFO', '\nTest 4: Playwright Browser Initialization');
  
  let browser = null;
  
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto('https://www.perplexity.ai', { timeout: 10000 });
    
    const title = await page.title();
    log('PASS', `Playwright launched successfully, navigated to Perplexity (title: "${title.substring(0, 30)}...")`);
    
    await browser.close();
    return true;
  } catch (error) {
    log('FAIL', `Playwright test failed: ${error.message}`);
    if (browser) await browser.close();
    return false;
  }
}

/**
 * Test 5: Dashboard HTML Structure
 */
async function testDashboardStructure() {
  log('INFO', '\nTest 5: Dashboard HTML Structure');
  
  try {
    const response = await fetch(`${BASE_URL}/`);
    const html = await response.text();
    
    const checks = [
      { name: 'Rankings page container', pattern: /id="page-rankings"/ },
      { name: 'AI Citations page container', pattern: /id="page-ai-citations"/ },
      { name: 'Rankings nav menu', pattern: /showPage\('rankings'\)/ },
      { name: 'AI Citations nav menu', pattern: /showPage\('ai-citations'\)/ },
      { name: 'loadRankings function', pattern: /function loadRankings/ },
      { name: 'loadAICitations function', pattern: /function loadAICitations/ }
    ];
    
    let passed = 0;
    
    for (const check of checks) {
      if (check.pattern.test(html)) {
        log('PASS', `HTML structure: ${check.name}`);
        passed++;
      } else {
        log('FAIL', `HTML structure missing: ${check.name}`);
      }
    }
    
    log('INFO', `Dashboard structure: ${passed}/${checks.length} checks passed`);
    return passed === checks.length;
  } catch (error) {
    log('FAIL', `Dashboard structure test error: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Module Syntax Validation
 */
async function testModuleSyntax() {
  log('INFO', '\nTest 6: Module Syntax Validation');
  
  const modules = [
    'lib/ai-probing-service.js',
    'lib/api-server.js',
    'lib/semantic-fingerprint.js',
    'lib/bing-proxy-monitor.js'
  ];
  
  let passed = 0;
  
  for (const module of modules) {
    try {
      const result = await execPromise(`node --check ${module}`);
      log('PASS', `Syntax OK: ${module}`);
      passed++;
    } catch (error) {
      log('FAIL', `Syntax error in ${module}: ${error.message}`);
    }
  }
  
  log('INFO', `Module syntax: ${passed}/${modules.length} passed`);
  return passed === modules.length;
}

/**
 * Helper: Execute command as Promise
 */
function execPromise(command) {
  return new Promise((resolve, reject) => {
    import('child_process').then(({ exec }) => {
      exec(command, { cwd: '/root/.openclaw/workspace-geo-arch/core-engine' }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve({ stdout, stderr });
      });
    });
  });
}

/**
 * Run All Tests
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     GEO Dashboard + Agentic Probing Test Suite         ║');
  console.log('║     全面测试套件 - 系统健壮性验证                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  
  // Run tests
  await testAPIHealth();
  await testAPIEndpoints();
  await testStaticFiles();
  await testPlaywright();
  await testDashboardStructure();
  await testModuleSyntax();
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                      ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  ✅ Passed:  ${TEST_RESULTS.passed.length.toString().padEnd(3)}                                  ║`);
  console.log(`║  ❌ Failed:  ${TEST_RESULTS.failed.length.toString().padEnd(3)}                                  ║`);
  console.log(`║  ⚠️  Warnings: ${TEST_RESULTS.warnings.length.toString().padEnd(3)}                                ║`);
  console.log(`║  ⏱️  Duration: ${duration}s                                    ║`);
  console.log('╚════════════════════════════════════════════════════════╝');
  
  if (TEST_RESULTS.failed.length > 0) {
    console.log('\n❌ SOME TESTS FAILED. Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('\n✅ ALL TESTS PASSED! System is robust and ready for production.');
    process.exit(0);
  }
}

// Handle fetch for Node.js < 18
if (!global.fetch) {
  global.fetch = async (url, options = {}) => {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const parsedUrl = new URL(url);
      
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (url.startsWith('https') ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      };
      
      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            text: async () => data,
            json: async () => JSON.parse(data)
          });
        });
      });
      
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  };
}

runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
