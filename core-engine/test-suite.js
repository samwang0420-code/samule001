#!/usr/bin/env node
/**
 * Integration Test Suite - 集成测试套件
 * 
 * 测试所有核心功能，确保达到生产标准
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 测试统计
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

async function test(name, fn) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

async function skip(name, reason) {
  results.skipped++;
  results.tests.push({ name, status: 'SKIP', reason });
  console.log(`  ⏭️  ${name} (${reason})`);
}

// ============================================
// TEST SUITE
// ============================================

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     INTEGRATION TEST SUITE                               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  // Group 1: Module Loading
  console.log('📦 Group 1: Module Loading');
  
  await test('Load database module', async () => {
    const db = await import('./lib/db.js');
    if (!db.default) throw new Error('Module not exported correctly');
  });
  
  await test('Load logger module', async () => {
    const logger = await import('./lib/logger.js');
    if (!logger.createLogger) throw new Error('createLogger not found');
  });
  
  await test('Load error handler module', async () => {
    const eh = await import('./lib/error-handler.js');
    if (!eh.handleError) throw new Error('handleError not found');
  });
  
  await test('Load medical knowledge module', async () => {
    const med = await import('./lib/medical-knowledge.js');
    if (!med.MEDICAL_ONTOLOGY) throw new Error('Medical ontology not found');
  });
  
  // Group 2: Input Validation
  console.log('\n🔍 Group 2: Input Validation');
  
  await test('Validate valid input', async () => {
    const { validateInput } = await import('./lib/error-handler.js');
    validateInput(
      { firmName: 'Test Firm', address: '123 Main St' },
      { firmName: { required: true, minLength: 2 }, address: { required: true, minLength: 5 } }
    );
  });
  
  await test('Reject invalid input', async () => {
    const { validateInput } = await import('./lib/error-handler.js');
    try {
      validateInput(
        { firmName: '', address: '123' },
        { firmName: { required: true }, address: { minLength: 5 } }
      );
      throw new Error('Should have thrown validation error');
    } catch (e) {
      if (!e.message.includes('Validation')) throw e;
    }
  });
  
  // Group 3: File Operations
  console.log('\n📁 Group 3: File Operations');
  
  await test('Create and read test file', async () => {
    const testFile = path.join(__dirname, 'test-output.txt');
    await fs.writeFile(testFile, 'test content');
    const content = await fs.readFile(testFile, 'utf8');
    if (content !== 'test content') throw new Error('File content mismatch');
    await fs.unlink(testFile);
  });
  
  await test('Safe write file with retry', async () => {
    const { safeWriteFile } = await import('./lib/error-handler.js');
    const testFile = path.join(__dirname, 'test-safe.txt');
    await safeWriteFile(testFile, 'safe content');
    const content = await fs.readFile(testFile, 'utf8');
    if (content !== 'safe content') throw new Error('Safe write failed');
    await fs.unlink(testFile);
  });
  
  // Group 4: Medical Content Generation
  console.log('\n💉 Group 4: Medical Content Generation');
  
  await test('Generate medical location page', async () => {
    const content = await import('./lib/medical-content.js');
    const page = content.generateMedicalLocationPage(
      { name: 'Test Med Spa', city: 'Houston' },
      ['Botox', 'Fillers']
    );
    if (!page.title) throw new Error('Title not generated');
    if (!page.citationScore) throw new Error('Citation score not calculated');
  });
  
  await test('Generate medical GMB post', async () => {
    const content = await import('./lib/medical-content.js');
    const post = content.generateMedicalGMBPost('promotion');
    if (!post.title || !post.content) throw new Error('Post incomplete');
  });
  
  // Group 5: Citation Analysis
  console.log('\n📊 Group 5: Citation Analysis');
  
  await test('Calculate citation probability', async () => {
    const { calculateCitationProbability } = await import('./lib/citation-engine.js');
    const result = calculateCitationProbability(
      'H1B visa process for Houston immigrants with FAQ'
    );
    if (result.percentage < 0 || result.percentage > 100) {
      throw new Error('Invalid percentage');
    }
    if (!result.recommendations) throw new Error('No recommendations');
  });
  
  await test('Calculate medical citation probability', async () => {
    const { calculateMedicalCitationProbability } = await import('./lib/medical-citation.js');
    const result = calculateMedicalCitationProbability(
      'Board certified plastic surgeon offering Botox and fillers in Houston'
    );
    if (result.percentage < 0 || result.percentage > 100) {
      throw new Error('Invalid percentage');
    }
  });
  
  // Group 6: Knowledge Graph
  console.log('\n🧠 Group 6: Knowledge Graph');
  
  await test('Get medical entities', async () => {
    const { getMedicalEntities } = await import('./lib/medical-knowledge.js');
    const entities = getMedicalEntities('Botox and fillers treatment');
    if (!Array.isArray(entities)) throw new Error('Not an array');
    if (entities.length === 0) throw new Error('No entities found');
  });
  
  await test('Generate medical schema', async () => {
    const { generateMedicalSchema } = await import('./lib/medical-knowledge.js');
    const schema = generateMedicalSchema(
      { name: 'Test Practice', website: 'https://test.com' },
      ['Botox', 'Fillers']
    );
    if (!schema['@context']) throw new Error('Invalid schema');
  });
  
  // Group 7: End-to-End (if Apify configured)
  console.log('\n🔄 Group 7: End-to-End Tests');
  
  if (process.env.APIFY_TOKEN) {
    await test('Run basic analysis', async () => {
      const output = execSync(
        'node run.js "Test Business" "123 Main St, Houston, TX"',
        { encoding: 'utf8', cwd: __dirname, timeout: 60000 }
      );
      if (!output.includes('CORE ENGINE RUNNING')) {
        throw new Error('Analysis did not complete');
      }
    }, 60000);
  } else {
    await skip('End-to-end test with real data', 'APIFY_TOKEN not set');
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST SUMMARY');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`
Total: ${results.passed + results.failed + results.skipped} tests`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) failed`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
