/**
 * Competitor Tracker
 * Tracks competitor positions and changes
 * 
 * Usage:
 *   node competitor.js track "client_id" "competitor_name" "address"
 *   node competitor.js analyze "client_id"
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const COMPETITORS_FILE = path.join(DATA_DIR, 'competitors.json');

async function init() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function addCompetitor(clientId, name, address, notes = '') {
  await init();
  
  let data = { competitors: [] };
  try {
    const existing = await fs.readFile(COMPETITORS_FILE, 'utf8');
    data = JSON.parse(existing);
  } catch (e) {}
  
  const competitor = {
    id: `comp_${Date.now()}`,
    clientId,
    name,
    address,
    notes,
    addedAt: new Date().toISOString(),
    history: [],
    currentRank: null,
    geoScore: null
  };
  
  data.competitors.push(competitor);
  await fs.writeFile(COMPETITORS_FILE, JSON.stringify(data, null, 2));
  
  console.log(`✓ Added competitor: ${name}`);
  return competitor;
}

async function updateCompetitorRank(competitorId, rank) {
  await init();
  
  const content = await fs.readFile(COMPETITORS_FILE, 'utf8');
  const data = JSON.parse(content);
  
  const comp = data.competitors.find(c => c.id === competitorId);
  if (!comp) return;
  
  const previousRank = comp.currentRank;
  comp.currentRank = rank;
  
  comp.history.push({
    date: new Date().toISOString(),
    rank
  });
  
  // Keep last 90 days
  comp.history = comp.history.slice(-90);
  
  await fs.writeFile(COMPETITORS_FILE, JSON.stringify(data, null, 2));
  
  if (previousRank && previousRank !== rank) {
    console.log(`  ${comp.name}: #${previousRank} → #${rank}`);
  }
}

async function analyzeClient(clientId) {
  await init();
  
  const content = await fs.readFile(COMPETITORS_FILE, 'utf8');
  const data = JSON.parse(content);
  
  const competitors = data.competitors.filter(c => c.clientId === clientId);
  
  if (competitors.length === 0) {
    console.log(`No competitors tracked for ${clientId}`);
    return;
  }
  
  console.log(`\n🎯 COMPETITOR ANALYSIS: ${clientId}\n`);
  
  // Sort by current rank
  const sorted = competitors.sort((a, b) => (a.currentRank || 999) - (b.currentRank || 999));
  
  console.log('Current Rankings:');
  sorted.forEach((c, i) => {
    const rank = c.currentRank || '?';
    const trend = c.history.length > 1 
      ? c.history[c.history.length - 2].rank - c.currentRank 
      : 0;
    const trendStr = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
    console.log(`  ${i + 1}. ${c.name}: #${rank} ${trendStr}`);
  });
  
  // Calculate threats
  const top3 = sorted.filter(c => c.currentRank && c.currentRank <= 3);
  const threats = sorted.filter(c => {
    if (!c.currentRank || c.currentRank > 10) return false;
    const recent = c.history.slice(-3);
    if (recent.length < 2) return false;
    return recent[recent.length - 1].rank < recent[0].rank; // Improving
  });
  
  console.log(`\nTop 3: ${top3.map(c => c.name).join(', ') || 'None tracked'}`);
  console.log(`Rising threats: ${threats.map(c => c.name).join(', ') || 'None detected'}`);
}

async function listCompetitors(clientId) {
  await init();
  
  const content = await fs.readFile(COMPETITORS_FILE, 'utf8');
  const data = JSON.parse(content);
  
  const competitors = clientId 
    ? data.competitors.filter(c => c.clientId === clientId)
    : data.competitors;
  
  console.log('\nTracked Competitors:\n');
  competitors.forEach(c => {
    console.log(`  ${c.clientId}: ${c.name} (${c.currentRank ? '#' + c.currentRank : 'unranked'})`);
  });
}

// CLI
async function main() {
  const [,, command, ...args] = process.argv;
  
  switch (command) {
    case 'track':
      if (args.length < 3) {
        console.log('Usage: competitor.js track "client_id" "name" "address" [notes]');
        process.exit(1);
      }
      await addCompetitor(args[0], args[1], args[2], args[3]);
      break;
      
    case 'analyze':
      if (!args[0]) {
        console.log('Usage: competitor.js analyze "client_id"');
        process.exit(1);
      }
      await analyzeClient(args[0]);
      break;
      
    case 'list':
      await listCompetitors(args[0]);
      break;
      
    case 'update-rank':
      if (args.length < 2) {
        console.log('Usage: competitor.js update-rank "competitor_id" rank');
        process.exit(1);
      }
      await updateCompetitorRank(args[0], parseInt(args[1]));
      break;
      
    default:
      console.log(`
Competitor Tracker

Commands:
  track "client_id" "name" "address" [notes]  Add competitor
  analyze "client_id"                         Analyze competition
  list ["client_id"]                          List competitors
  update-rank "competitor_id" rank           Update rank manually
`);
  }
}

main();
