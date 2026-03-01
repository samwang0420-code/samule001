#!/usr/bin/env node
/**
 * GEO Master Control
 * 
 * Unified CLI for all GEO operations
 * 
 * Usage:
 *   ./geo.js onboard "Firm Name" "Address"   # Full onboarding
 *   ./geo.js monitor add "client" "keyword"  # Add tracking
 *   ./geo.js report "client"                 # Generate report
 *   ./geo.js competitor add "client" "name"  # Track competitor
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commands = {
  // Full client onboarding
  async onboard(args) {
    if (args.length < 2) {
      console.log('Usage: geo.js onboard "Firm Name" "Address" ["email"]');
      process.exit(1);
    }
    
    const [firmName, address, email] = args;
    
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║              CLIENT ONBOARDING WORKFLOW                  ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    // Step 1: Run analysis
    console.log('📊 Step 1: GEO Analysis');
    const output = execSync(`node run.js "${firmName}" "${address}"`, { 
      encoding: 'utf8',
      cwd: __dirname 
    });
    console.log(output);
    
    // Extract client ID from output
    const clientIdMatch = output.match(/Client ID:\s+(client_\d+)/);
    const clientId = clientIdMatch ? clientIdMatch[1] : null;
    
    if (!clientId) {
      console.error('❌ Failed to extract client ID');
      process.exit(1);
    }
    
    // Step 2: Set up keyword tracking
    console.log('\n📡 Step 2: Set Up Monitoring');
    
    const keywords = [
      'immigration lawyer houston',
      'houston immigration attorney',
      'visa lawyer houston',
      'green card attorney houston'
    ];
    
    for (const kw of keywords) {
      try {
        execSync(`node monitor.js add "${clientId}" "${kw}"`, { cwd: __dirname });
      } catch (e) {}
    }
    console.log(`   ✓ Tracking ${keywords.length} keywords`);
    
    // Step 3: Identify competitors (would need real data)
    console.log('\n🎯 Step 3: Competitor Tracking');
    console.log('   Add competitors manually:');
    console.log(`   geo.js competitor add "${clientId}" "Competitor Name" "Address"`);
    
    // Summary
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                   ONBOARDING COMPLETE                    ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║ Client ID: ${clientId.padEnd(46)} ║`);
    console.log(`║ Output:    ./outputs/${clientId.padEnd(38)} ║`);
    console.log(`║ Monitor:   Run daily checks with ./scheduler.sh daily   ║`);
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    console.log('Next Steps:');
    console.log(`  1. Review output in ./outputs/${clientId}/`);
    console.log(`  2. Deploy schema to client website`);
    console.log(`  3. Add competitors: ./geo.js competitor add "${clientId}" "Name" "Address"`);
    console.log(`  4. Generate report: ./geo.js report "${clientId}"`);
    
    return clientId;
  },
  
  // Quick report generation
  async report(args) {
    if (!args[0]) {
      console.log('Usage: geo.js report "client_id" [--full]');
      process.exit(1);
    }
    
    const clientId = args[0];
    const fullReport = args.includes('--full');
    
    console.log(`Generating report for ${clientId}...\n`);
    
    // Rank report
    try {
      execSync(`node monitor.js report "${clientId}"`, { 
        cwd: __dirname,
        stdio: 'inherit'
      });
    } catch (e) {}
    
    // Competitor analysis
    if (fullReport) {
      console.log('\n');
      try {
        execSync(`node competitor.js analyze "${clientId}"`, {
          cwd: __dirname,
          stdio: 'inherit'
        });
      } catch (e) {}
    }
  },
  
  // Status overview
  async status() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                 SYSTEM STATUS                            ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    // Count clients
    try {
      const outputDir = path.join(__dirname, 'outputs');
      const clients = await fs.readdir(outputDir);
      console.log(`📁 Clients: ${clients.length}`);
    } catch (e) {
      console.log('📁 Clients: 0');
    }
    
    // Count tracked keywords
    try {
      const keywordsFile = path.join(__dirname, 'data', 'tracked-keywords.json');
      const data = JSON.parse(await fs.readFile(keywordsFile, 'utf8'));
      console.log(`📡 Keywords: ${data.keywords.length}`);
    } catch (e) {
      console.log('📡 Keywords: 0');
    }
    
    // Count competitors
    try {
      const compFile = path.join(__dirname, 'data', 'competitors.json');
      const data = JSON.parse(await fs.readFile(compFile, 'utf8'));
      console.log(`🎯 Competitors: ${data.competitors.length}`);
    } catch (e) {
      console.log('🎯 Competitors: 0');
    }
    
    console.log('');
    console.log('Commands:');
    console.log('  ./geo.js onboard "Firm" "Address"  - New client onboarding');
    console.log('  ./geo.js report "client_id"        - Generate report');
    console.log('  ./geo.js status                    - System overview');
  },
  
  // Passthrough to monitor
  async monitor(args) {
    const subcommand = args[0];
    const rest = args.slice(1);
    
    try {
      execSync(`node monitor.js ${subcommand} ${rest.map(a => `"${a}"`).join(' ')}`, {
        cwd: __dirname,
        stdio: 'inherit'
      });
    } catch (e) {
      process.exit(1);
    }
  },
  
  // Passthrough to competitor
  async competitor(args) {
    const subcommand = args[0];
    const rest = args.slice(1);
    
    try {
      execSync(`node competitor.js ${subcommand} ${rest.map(a => `"${a}"`).join(' ')}`, {
        cwd: __dirname,
        stdio: 'inherit'
      });
    } catch (e) {
      process.exit(1);
    }
  }
};

// Main
async function main() {
  const [,, command, ...args] = process.argv;
  
  if (!command || command === 'help') {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║           StackMatrices GEO - Master Control             ║
╚══════════════════════════════════════════════════════════╝

Commands:

  onboard "Firm Name" "Address" [email]
    Full client onboarding (analysis + monitoring setup)

  report "client_id" [--full]
    Generate client report

  monitor add "client" "keyword"
    Add keyword tracking (passthrough)

  competitor add "client" "name" "address"
    Add competitor (passthrough)

  status
    System overview

Examples:
  ./geo.js onboard "Garcia Law" "123 Main St, Houston, TX"
  ./geo.js report "client_1772389766088" --full
  ./geo.js status
`);
    process.exit(0);
  }
  
  const cmd = commands[command];
  if (!cmd) {
    console.error(`Unknown command: ${command}`);
    console.log('Run "./geo.js help" for usage');
    process.exit(1);
  }
  
  await cmd(args);
}

main();
