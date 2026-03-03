#!/usr/bin/env node
/**
 * Rank Tracker - 关键词排名追踪器
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  'https://fixemvsckapejyfwphft.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeGVtdnNja2FwZWp5ZndwaGZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkxNDczNSwiZXhwIjoyMDg3NDkwNzM1fQ.q_mgJQlae4B0AJMv9RziN2MzjVRKylG-06WIKFoG434'
);

/**
 * 模拟排名检查（实际实现需要接入第三方API）
 */
async function checkRankings(clientId, keywords) {
  const results = [];
  
  for (const keyword of keywords) {
    // 模拟排名检查 - 实际应调用SERP API
    const rank = Math.floor(Math.random() * 50) + 1; // 1-50随机排名
    
    results.push({
      keyword,
      rank,
      previousRank: null, // 需要查询历史
      change: null,
      url: null,
      checkedAt: new Date().toISOString()
    });
  }
  
  return results;
}

/**
 * 记录排名历史
 */
async function saveRankingHistory(clientId, results) {
  const historyFile = path.join(__dirname, `../../outputs/${clientId}/ranking-history.json`);
  
  let history = [];
  try {
    const existing = await fs.readFile(historyFile, 'utf8');
    history = JSON.parse(existing);
  } catch (e) {
    // 文件不存在，创建新历史
  }
  
  // 添加新记录
  history.push({
    date: new Date().toISOString(),
    results
  });
  
  // 只保留最近90天
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  history = history.filter(h => new Date(h.date) > cutoff);
  
  await fs.mkdir(path.dirname(historyFile), { recursive: true });
  await fs.writeFile(historyFile, JSON.stringify(history, null, 2));
  
  return history;
}

/**
 * 生成排名报告
 */
async function generateRankingReport(clientId) {
  const historyFile = path.join(__dirname, `../../outputs/${clientId}/ranking-history.json`);
  
  try {
    const data = await fs.readFile(historyFile, 'utf8');
    const history = JSON.parse(data);
    
    if (history.length < 2) {
      return { message: 'Not enough data for comparison' };
    }
    
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    // 计算变化
    const changes = latest.results.map(current => {
      const prev = previous.results.find(p => p.keyword === current.keyword);
      return {
        keyword: current.keyword,
        currentRank: current.rank,
        previousRank: prev?.rank || null,
        change: prev ? prev.rank - current.rank : null, // 正数表示上升
        status: prev ? (prev.rank > current.rank ? '📈' : prev.rank < current.rank ? '📉' : '➡️') : '🆕'
      };
    });
    
    // 统计
    const improved = changes.filter(c => c.change > 0).length;
    const declined = changes.filter(c => c.change < 0).length;
    const unchanged = changes.filter(c => c.change === 0).length;
    const top10 = changes.filter(c => c.currentRank <= 10).length;
    
    return {
      date: latest.date,
      summary: { improved, declined, unchanged, top10, total: changes.length },
      changes,
      trend: improved > declined ? 'upward' : improved < declined ? 'downward' : 'stable'
    };
    
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * 主追踪函数
 */
async function trackRankings(clientId) {
  console.log(`🔍 Tracking rankings for: ${clientId}`);
  
  // 获取客户数据
  const { data: client } = await supabase
    .from('clients')
    .select('target_keywords, business_name')
    .eq('id', clientId)
    .single();
  
  if (!client || !client.target_keywords || client.target_keywords.length === 0) {
    console.log('  ⚠️ No keywords configured');
    return;
  }
  
  console.log(`  📊 Checking ${client.target_keywords.length} keywords...`);
  
  // 检查排名
  const results = await checkRankings(clientId, client.target_keywords);
  
  // 保存历史
  await saveRankingHistory(clientId, results);
  
  // 生成报告
  const report = await generateRankingReport(clientId);
  
  console.log(`  ✅ Ranking check complete`);
  console.log(`  📈 Trend: ${report.trend || 'N/A'}`);
  if (report.summary) {
    console.log(`  📊 Summary: ${report.summary.improved}↑ ${report.summary.declined}↓ ${report.summary.unchanged}→ (Top 10: ${report.summary.top10})`);
  }
  
  return report;
}

/**
 * 追踪所有客户
 */
async function trackAllRankings() {
  const { data: clients } = await supabase
    .from('clients')
    .select('id, business_name')
    .eq('status', 'active');
  
  console.log(`🚀 Starting ranking tracker for ${clients?.length || 0} clients\n`);
  
  for (const client of clients || []) {
    try {
      await trackRankings(client.id);
    } catch (e) {
      console.error(`  ❌ Error tracking ${client.business_name}:`, e.message);
    }
  }
  
  console.log('\n✅ All rankings tracked');
}

// CLI usage
const clientId = process.argv[2];

if (clientId === 'all') {
  trackAllRankings();
} else if (clientId) {
  trackRankings(clientId).then(report => {
    console.log('\n📋 Report:');
    console.log(JSON.stringify(report, null, 2));
  });
} else {
  console.log('Usage: node rank-tracker.js [client_id|all]');
  console.log('Example: node rank-tracker.js geo_123');
  console.log('Example: node rank-tracker.js all');
}

export { trackRankings, trackAllRankings, generateRankingReport };
