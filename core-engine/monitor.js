/**
 * Rank Monitor - Track keyword positions over time
 * 
 * Usage:
 *   node monitor.js add "client_id" "immigration lawyer houston"
 *   node monitor.js run              # Check all keywords
 *   node monitor.js report "client_id"  # Generate report
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const KEYWORDS_FILE = path.join(DATA_DIR, 'tracked-keywords.json');

// Ensure data directory exists
async function init() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {}
}

// Add keyword to track
async function addKeyword(clientId, keyword, location = 'Houston, TX') {
  await init();
  
  let data = { keywords: [] };
  try {
    const existing = await fs.readFile(KEYWORDS_FILE, 'utf8');
    data = JSON.parse(existing);
  } catch (e) {}
  
  const entry = {
    id: `track_${Date.now()}`,
    clientId,
    keyword: keyword.toLowerCase().trim(),
    location,
    addedAt: new Date().toISOString(),
    history: []
  };
  
  data.keywords.push(entry);
  await fs.writeFile(KEYWORDS_FILE, JSON.stringify(data, null, 2));
  
  console.log(`✓ Tracking: "${keyword}" for ${clientId}`);
  return entry;
}

// Run rank check (demo mode without API)
async function runChecks() {
  await init();
  
  let data;
  try {
    const content = await fs.readFile(KEYWORDS_FILE, 'utf8');
    data = JSON.parse(content);
  } catch (e) {
    console.log('No keywords configured');
    return;
  }
  
  console.log(`🔍 Checking ${data.keywords.length} keywords...\n`);
  
  for (const item of data.keywords) {
    const rank = await simulateRankCheck(item);
    
    item.history.push({
      date: new Date().toISOString(),
      rank: rank.position,
      page: rank.page,
      serpFeatures: rank.features
    });
    
    // Keep only last 90 days
    item.history = item.history.slice(-90);
    
    const previous = item.history.length > 1 ? item.history[item.history.length - 2].rank : null;
    const change = previous ? previous - rank.position : 0;
    const changeStr = change > 0 ? `+${change}↑` : change < 0 ? `${change}↓` : '→';
    
    console.log(`${item.clientId}: "${item.keyword}"`);
    console.log(`  Position: #${rank.position} ${changeStr}`);
    console.log(`  Page: ${rank.page}`);
    console.log();
  }
  
  await fs.writeFile(KEYWORDS_FILE, JSON.stringify(data, null, 2));
  console.log('✓ Rank check complete');
}

// Simulate rank check (replace with real SERP API)
async function simulateRankCheck(item) {
  // Deterministic based on keyword + date
  const seed = stringHash(item.keyword + new Date().toDateString());
  const random = seededRandom(seed);
  
  // Simulate position with some volatility
  const basePosition = (seed % 15) + 1;
  const volatility = Math.floor(random() * 3) - 1;
  const position = Math.max(1, basePosition + volatility);
  
  return {
    position,
    page: position <= 10 ? 1 : 2,
    features: position <= 3 ? ['local_pack', 'knowledge_panel'] : ['local_pack']
  };
}

// Generate client report
async function generateReport(clientId) {
  await init();
  
  let data;
  try {
    const content = await fs.readFile(KEYWORDS_FILE, 'utf8');
    data = JSON.parse(content);
  } catch (e) {
    console.log('No data found');
    return;
  }
  
  const clientKeywords = data.keywords.filter(k => k.clientId === clientId);
  
  if (clientKeywords.length === 0) {
    console.log(`No keywords found for ${clientId}`);
    return;
  }
  
  console.log(`\n📊 RANK REPORT: ${clientId}\n`);
  console.log('=' .repeat(50));
  
  for (const kw of clientKeywords) {
    const history = kw.history;
    if (history.length === 0) continue;
    
    const current = history[history.length - 1];
    const first = history[0];
    const change = first.rank - current.rank;
    
    console.log(`\nKeyword: "${kw.keyword}"`);
    console.log(`  Current: #${current.rank}`);
    console.log(`  Started: #${first.rank} (${new Date(kw.addedAt).toLocaleDateString()})`);
    console.log(`  Change: ${change >= 0 ? '+' : ''}${change} positions`);
    console.log(`  History: ${history.slice(-7).map(h => '#' + h.rank).join(' → ')}`);
  }
  
  console.log('\n' + '='.repeat(50));
}

// CLI
async function main() {
  const [,, command, ...args] = process.argv;
  
  switch (command) {
    case 'add':
      if (args.length < 2) {
        console.log('Usage: monitor.js add "client_id" "keyword" [location]');
        process.exit(1);
      }
      await addKeyword(args[0], args[1], args[2]);
      break;
      
    case 'run':
      await runChecks();
      break;
      
    case 'report':
      if (!args[0]) {
        console.log('Usage: monitor.js report "client_id"');
        process.exit(1);
      }
      await generateReport(args[0]);
      break;
      
    case 'list':
      await init();
      try {
        const content = await fs.readFile(KEYWORDS_FILE, 'utf8');
        const data = JSON.parse(content);
        console.log('\nTracked Keywords:\n');
        data.keywords.forEach(k => {
          console.log(`  ${k.clientId}: "${k.keyword}" (${k.history.length} data points)`);
        });
      } catch (e) {
        console.log('No keywords tracked');
      }
      break;
      
    default:
      console.log(`
Rank Monitor - Track keyword positions

Commands:
  add "client_id" "keyword" [location]  Add keyword to track
  run                                  Check all keywords
  report "client_id"                   Generate client report
  list                                 Show all tracked keywords

Examples:
  node monitor.js add "client_123" "immigration lawyer houston"
  node monitor.js run
  node monitor.js report "client_123"
`);
  }
}

// Utilities
function stringHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

main();
