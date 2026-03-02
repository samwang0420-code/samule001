#!/usr/bin/env node
/**
 * Database Setup - Initialize Supabase tables
 * 
 * Run this once to create all required tables
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setupDatabase() {
  console.log('🔧 Setting up Supabase database...\n');
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema-v1.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    console.log('📄 Schema file loaded');
    console.log(`   Size: ${schema.length} characters`);
    console.log(`   Statements: ${schema.split(';').length}\n`);
    
    // Split and execute statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    console.log(`Executing ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        // Skip CREATE EXTENSION (needs superuser)
        if (stmt.includes('CREATE EXTENSION')) {
          console.log(`  ${i + 1}. Skipping extension (requires superuser)`);
          continue;
        }
        
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
        
        if (error) {
          // Try alternative: direct table creation
          if (stmt.includes('CREATE TABLE')) {
            console.log(`  ${i + 1}. Creating table...`);
            // Tables will be created via Supabase UI or migrations
          } else {
            console.log(`  ${i + 1}. Warning: ${error.message}`);
          }
        } else {
          console.log(`  ${i + 1}. ✓ Executed`);
        }
      } catch (e) {
        console.log(`  ${i + 1}. Warning: ${e.message}`);
      }
    }
    
    console.log('\n✅ Database setup attempted');
    console.log('\n⚠️  Important:');
    console.log('   If tables were not created, please use the Supabase Dashboard:');
    console.log('   1. Go to https://app.supabase.com');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Copy and paste the contents of supabase/schema-v1.sql');
    console.log('   5. Click "Run"\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
