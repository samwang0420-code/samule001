#!/usr/bin/env node
/**
 * Alert System - Monitor changes and send notifications
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ALERTS_FILE = path.join(__dirname, 'data', 'alerts.json');

// Alert thresholds
const THRESHOLDS = {
  ranking: {
    drop: 3,        // Alert if ranking drops by 3+ positions
    belowPage1: 10  // Alert if drops to page 2
  },
  competitor: {
    overtakes: true // Alert if competitor overtakes client
  },
  citation: {
    scoreDrop: 10   // Alert if citation score drops 10+ points
  }
};

/**
 * Check for ranking changes and generate alerts
 */
export async function checkRankingAlerts(clientId) {
  const alerts = [];
  
  try {
    const keywordsFile = path.join(__dirname, 'data', 'tracked-keywords.json');
    const data = JSON.parse(await fs.readFile(keywordsFile, 'utf8'));
    
    const clientKeywords = data.keywords.filter(k => k.clientId === clientId);
    
    for (const kw of clientKeywords) {
      if (kw.history.length < 2) continue;
      
      const current = kw.history[kw.history.length - 1];
      const previous = kw.history[kw.history.length - 2];
      const change = previous.rank - current.rank;
      
      // Ranking dropped significantly
      if (change < -THRESHOLDS.ranking.drop) {
        alerts.push({
          type: 'ranking_drop',
          severity: 'high',
          clientId,
          keyword: kw.keyword,
          message: `Ranking dropped ${Math.abs(change)} positions for "${kw.keyword}"`,
          details: {
            previous: previous.rank,
            current: current.rank,
            change
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // Dropped to page 2
      if (previous.rank <= 10 && current.rank > 10) {
        alerts.push({
          type: 'ranking_page2',
          severity: 'critical',
          clientId,
          keyword: kw.keyword,
          message: `Dropped to page 2 for "${kw.keyword}"`,
          details: { previous: previous.rank, current: current.rank },
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (e) {
    // No data yet
  }
  
  return alerts;
}

/**
 * Check for competitor overtakes
 */
export async function checkCompetitorAlerts(clientId) {
  const alerts = [];
  
  try {
    const compFile = path.join(__dirname, 'data', 'competitors.json');
    const data = JSON.parse(await fs.readFile(compFile, 'utf8'));
    
    const competitors = data.competitors.filter(c => c.clientId === clientId);
    
    for (const comp of competitors) {
      if (!comp.history || comp.history.length < 2) continue;
      
      const current = comp.history[comp.history.length - 1];
      const previous = comp.history[comp.history.length - 2];
      
      // Competitor improved while client didn't
      if (current.rank < previous.rank) {
        alerts.push({
          type: 'competitor_improving',
          severity: 'medium',
          clientId,
          competitor: comp.name,
          message: `Competitor "${comp.name}" improved from #${previous.rank} to #${current.rank}`,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (e) {
    // No data yet
  }
  
  return alerts;
}

/**
 * Save alerts to file
 */
export async function saveAlerts(alerts) {
  if (alerts.length === 0) return;
  
  let existing = { alerts: [] };
  try {
    const content = await fs.readFile(ALERTS_FILE, 'utf8');
    existing = JSON.parse(content);
  } catch (e) {}
  
  existing.alerts.push(...alerts);
  
  // Keep only last 100 alerts
  existing.alerts = existing.alerts.slice(-100);
  
  await fs.mkdir(path.dirname(ALERTS_FILE), { recursive: true });
  await fs.writeFile(ALERTS_FILE, JSON.stringify(existing, null, 2));
}

/**
 * Get recent alerts
 */
export async function getRecentAlerts(clientId, hours = 24) {
  try {
    const content = await fs.readFile(ALERTS_FILE, 'utf8');
    const data = JSON.parse(content);
    
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return data.alerts.filter(a => {
      const matchesClient = !clientId || a.clientId === clientId;
      const isRecent = new Date(a.timestamp) > cutoff;
      return matchesClient && isRecent;
    });
  } catch (e) {
    return [];
  }
}

/**
 * Generate daily summary
 */
export async function generateDailySummary(clientId) {
  const alerts = await getRecentAlerts(clientId, 24);
  
  const summary = {
    date: new Date().toISOString(),
    clientId,
    totalAlerts: alerts.length,
    bySeverity: {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length
    },
    byType: alerts.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {}),
    recentAlerts: alerts.slice(-5)
  };
  
  return summary;
}

/**
 * Send notification (placeholder for now)
 */
export async function sendNotification(alert) {
  // TODO: Integrate with Slack, email, or webhook
  console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
  
  // Log to console
  if (alert.severity === 'critical') {
    console.error(`   Critical alert for ${alert.clientId}: ${alert.message}`);
  }
}

/**
 * Run all checks
 */
export async function runAllChecks(clientId) {
  console.log(`🔍 Running monitoring checks for ${clientId}...`);
  
  const rankingAlerts = await checkRankingAlerts(clientId);
  const competitorAlerts = await checkCompetitorAlerts(clientId);
  
  const allAlerts = [...rankingAlerts, ...competitorAlerts];
  
  if (allAlerts.length > 0) {
    await saveAlerts(allAlerts);
    
    for (const alert of allAlerts) {
      await sendNotification(alert);
    }
    
    console.log(`   ${allAlerts.length} alert(s) generated`);
  } else {
    console.log('   No issues detected');
  }
  
  return allAlerts;
}

// CLI
async function main() {
  const [,, command, ...args] = process.argv;
  
  switch (command) {
    case 'check':
      if (!args[0]) {
        console.log('Usage: alert.js check "client_id"');
        process.exit(1);
      }
      await runAllChecks(args[0]);
      break;
      
    case 'summary':
      const summary = await generateDailySummary(args[0]);
      console.log('\n📊 Daily Summary');
      console.log('================');
      console.log(`Total Alerts: ${summary.totalAlerts}`);
      console.log(`Critical: ${summary.bySeverity.critical}`);
      console.log(`High: ${summary.bySeverity.high}`);
      console.log(`Medium: ${summary.bySeverity.medium}`);
      break;
      
    case 'list':
      const alerts = await getRecentAlerts(args[0], 24);
      console.log(`\n🚨 Recent Alerts (${alerts.length})`);
      console.log('===========================');
      alerts.forEach(a => {
        console.log(`[${a.severity.toUpperCase()}] ${a.message}`);
      });
      break;
      
    default:
      console.log(`
Alert System

Commands:
  check "client_id"    Run all checks for client
  summary ["client_id"] Show daily summary
  list ["client_id"]    List recent alerts
`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default {
  checkRankingAlerts,
  checkCompetitorAlerts,
  runAllChecks,
  generateDailySummary,
  sendNotification
};
