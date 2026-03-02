#!/usr/bin/env node
/**
 * GEO AI Pipeline - 完整的GEO优化流程
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as aiBooster from './lib/ai-ranking-booster.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function geoAIPipeline(businessName, address, industry, services) {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     GEO AI PIPELINE - Complete AI Optimization           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const clientId = `geo_${Date.now()}`;
  
  // Phase 1: 传统SEO分析
  console.log('📊 PHASE 1: Traditional SEO Analysis\n');
  
  try {
    const output = execSync(
      `node run.js "${businessName}" "${address}"`,
      { encoding: 'utf8', cwd: __dirname, timeout: 120000 }
    );
    console.log(output);
    
    const match = output.match(/Client ID:\s+(client_\d+)/);
    const baseClientId = match ? match[1] : clientId;
    
    // Phase 2: AI排名策略
    console.log('\n🤖 PHASE 2: AI Ranking Strategy\n');
    
    const content = `${businessName} offers ${services.join(', ')} in Houston.`;
    const aiStrategy = await aiBooster.generateAIRankingStrategy(
      baseClientId, content, { industry: industry || 'medical' }
    );
    
    console.log(`  Current AI Score: ${aiStrategy.projectedResults.currentScore}%`);
    console.log(`  Projected: ${aiStrategy.projectedResults.projectedScore}%`);
    console.log(`  Improvement: +${aiStrategy.projectedResults.improvement}%\n`);
    
    console.log('✅ GEO AI Pipeline Complete!');
    
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error.message);
    process.exit(1);
  }
}

// CLI
const [,, businessName, address, industry, ...services] = process.argv;

if (!businessName || !address) {
  console.log(`
GEO AI Pipeline

Usage:
  ./geo-ai-pipeline.js "Business Name" "Address" "Industry" "Service1" "Service2"

Example:
  ./geo-ai-pipeline.js "Glow Med Spa" "123 Main St, Houston, TX" "Medical Spa" "Botox" "Fillers"
`);
  process.exit(1);
}

geoAIPipeline(businessName, address, industry, services);
