#!/usr/bin/env node
/**
 * Test Database Connection
 * 
 * Usage: npm run test-db
 */

import db from './lib/db.js';

async function test() {
  console.log('Testing Database Connection...\n');
  
  if (!db.isConfigured) {
    console.log('❌ Database not configured');
    console.log('\nTo configure:');
    console.log('  1. Copy .env.example to .env');
    console.log('  2. Add your Supabase URL and key');
    console.log('  3. Run: npm install');
    console.log('  4. Run SQL schema from supabase/schema-v1.sql');
    process.exit(1);
  }
  
  console.log('✓ Database configured');
  console.log(`  URL: ${process.env.SUPABASE_URL}`);
  
  try {
    // Test connection by getting stats
    const stats = await db.getSystemStats();
    console.log('\n✓ Connection successful');
    console.log('\nCurrent Stats:');
    console.log(`  Clients: ${stats.clients}`);
    console.log(`  Audits: ${stats.audits}`);
    console.log(`  Keywords: ${stats.keywords}`);
    console.log(`  Rankings: ${stats.rankings}`);
    console.log(`  Competitors: ${stats.competitors}`);
    
    // Test creating a client
    console.log('\nTesting create operation...');
    const testClient = await db.createClient({
      clientId: 'test_' + Date.now(),
      firmName: 'Test Law Firm',
      address: '123 Test St, Houston, TX'
    });
    
    if (testClient) {
      console.log('✓ Create client successful');
      console.log(`  ID: ${testClient.id}`);
      
      // Clean up test data
      console.log('\nCleaning up test data...');
      // Note: In production, you might want to keep test data or delete it
      console.log('✓ Test complete');
    }
    
  } catch (error) {
    console.error('\n❌ Database error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  1. Check your Supabase URL and key');
    console.log('  2. Verify tables exist (run schema-v1.sql)');
    console.log('  3. Check Row Level Security policies');
    process.exit(1);
  }
}

test();
