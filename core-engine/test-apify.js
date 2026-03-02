#!/usr/bin/env node
/**
 * Test Apify Connection
 * 
 * Usage: npm run test-apify
 */

import * as apify from './lib/apify.js';

async function test() {
  console.log('Testing Apify Connection...\n');
  
  const connected = await apify.testConnection();
  
  if (!connected) {
    console.log('\nTo configure Apify:');
    console.log('  1. Get API token from https://console.apify.com');
    console.log('  2. Add to .env: APIFY_TOKEN=your_token');
    console.log('  3. Run: npm install');
    process.exit(1);
  }
  
  console.log('\n✓ Apify ready for real data scraping');
}

test();
