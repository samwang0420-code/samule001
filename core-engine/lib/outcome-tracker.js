#!/usr/bin/env node
/**
 * Outcome Tracker - 策略效果追踪系统
 * 
 * 记录每个策略/变更的实际效果
 * 为知识更新提供数据依据
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTCOMES_FILE = path.join(__dirname, '../data', 'outcomes.json');
const STRATEGIES_FILE = path.join(__dirname, '../data', 'strategies.json');

/**
 * 注册新策略
 */
export async function registerStrategy(strategy) {
  const record = {
    id: `strat_${Date.now()}`,
    name: strategy.name,
    description: strategy.description,
    type: strategy.type, // 'schema_change', 'content_update', 'new_factor'
    affectedComponent: strategy.component,
    expectedImpact: strategy.expectedImpact || 'unknown',
    deployedAt: new Date().toISOString(),
    status: 'ACTIVE',
    sampleSize: strategy.sampleSize || 0,
    clients: strategy.clientIds || [],
    
    // 效果数据（后续填充）
    metrics: {
      before: null,
      after: null,
      delta: null
    },
    
    // 统计分析
    significance: null,
    confidence: null,
    conclusion: null // 'POSITIVE', 'NEGATIVE', 'NEUTRAL', 'INCONCLUSIVE'
  };
  
  await saveStrategy(record);
  console.log(`✓ Strategy registered: ${record.id} - ${record.name}`);
  
  return record;
}

/**
 * 记录策略效果
 */
export async function recordOutcome(strategyId, metrics) {
  const strategies = await loadStrategies();
  const strategy = strategies.find(s => s.id === strategyId);
  
  if (!strategy) {
    throw new Error(`Strategy ${strategyId} not found`);
  }
  
  strategy.metrics = {
    before: metrics.before,
    after: metrics.after,
    delta: calculateDelta(metrics.before, metrics.after)
  };
  
  strategy.measuredAt = new Date().toISOString();
  
  // 自动评估
  const evaluation = evaluateStrategy(strategy);
  strategy.significance = evaluation.significance;
  strategy.confidence = evaluation.confidence;
  strategy.conclusion = evaluation.conclusion;
  
  await saveStrategies(strategies);
  
  console.log(`✓ Outcome recorded for ${strategyId}`);
  console.log(`  Conclusion: ${strategy.conclusion}`);
  console.log(`  Confidence: ${strategy.confidence}`);
  
  // 如果效果显著，建议更新知识库
  if (strategy.conclusion === 'POSITIVE' && strategy.confidence === 'HIGH') {
    console.log(`\n🎯 Recommendation: ADOPT this strategy in knowledge base`);
    console.log(`   Run: node knowledge-update.js adopt ${strategyId}`);
  }
  
  return strategy;
}

function calculateDelta(before, after) {
  return {
    ranking: after.ranking - before.ranking, // 负数=排名上升（变好）
    citationRate: after.citationRate - before.citationRate,
    traffic: after.traffic - before.traffic
  };
}

function evaluateStrategy(strategy) {
  const delta = strategy.metrics.delta;
  const sampleSize = strategy.sampleSize;
  
  // 简单统计逻辑（实际应用更复杂的统计检验）
  let score = 0;
  
  // 排名改善
  if (delta.ranking < -2) score += 3;      // 提升2位以上
  else if (delta.ranking < 0) score += 1;  // 有所提升
  else if (delta.ranking > 2) score -= 3;  // 下降2位以上
  
  // 引用率改善
  if (delta.citationRate > 0.05) score += 2;
  else if (delta.citationRate > 0) score += 1;
  else if (delta.citationRate < -0.05) score -= 2;
  
  // 样本量可信度
  const confidence = sampleSize >= 30 ? 'HIGH' : 
                     sampleSize >= 10 ? 'MEDIUM' : 'LOW';
  
  // 结论
  let conclusion;
  if (score >= 3) conclusion = 'POSITIVE';
  else if (score <= -3) conclusion = 'NEGATIVE';
  else if (score === 0) conclusion = 'NEUTRAL';
  else conclusion = 'INCONCLUSIVE';
  
  // 显著性（简化版p-value概念）
  const significance = confidence === 'HIGH' && Math.abs(score) >= 3 ? 0.95 :
                       confidence === 'MEDIUM' && Math.abs(score) >= 2 ? 0.85 :
                       0.70;
  
  return { significance, confidence, conclusion };
}

/**
 * 获取策略效果报告
 */
export async function getEffectivenessReport() {
  const strategies = await loadStrategies();
  
  const report = {
    total: strategies.length,
    active: strategies.filter(s => s.status === 'ACTIVE').length,
    byConclusion: {
      POSITIVE: strategies.filter(s => s.conclusion === 'POSITIVE').length,
      NEGATIVE: strategies.filter(s => s.conclusion === 'NEGATIVE').length,
      NEUTRAL: strategies.filter(s => s.conclusion === 'NEUTRAL').length,
      INCONCLUSIVE: strategies.filter(s => s.conclusion === 'INCONCLUSIVE').length,
      pending: strategies.filter(s => !s.conclusion).length
    },
    
    topPerformers: strategies
      .filter(s => s.conclusion === 'POSITIVE' && s.confidence === 'HIGH')
      .sort((a, b) => a.metrics.delta.ranking - b.metrics.delta.ranking)
      .slice(0, 5),
      
    failures: strategies
      .filter(s => s.conclusion === 'NEGATIVE')
      .sort((a, b) => b.metrics.delta.ranking - a.metrics.delta.ranking)
  };
  
  return report;
}

/**
 * 推荐知识库更新
 */
export async function recommendKnowledgeUpdate() {
  const strategies = await loadStrategies();
  
  // 找出应该采纳的策略
  const toAdopt = strategies.filter(s => 
    s.conclusion === 'POSITIVE' && 
    s.confidence === 'HIGH' &&
    s.status === 'ACTIVE'
  );
  
  // 找出应该废弃的策略
  const toDeprecate = strategies.filter(s => 
    s.conclusion === 'NEGATIVE' &&
    s.status === 'ACTIVE'
  );
  
  return {
    toAdopt: toAdopt.map(s => ({
      id: s.id,
      name: s.name,
      component: s.affectedComponent,
      evidence: `${s.sampleSize} clients, avg ranking change: ${s.metrics.delta.ranking}`
    })),
    toDeprecate: toDeprecate.map(s => ({
      id: s.id,
      name: s.name,
      reason: `Negative impact on ${s.sampleSize} clients`
    }))
  };
}

/**
 * 数据持久化
 */
async function loadStrategies() {
  try {
    const content = await fs.readFile(STRATEGIES_FILE, 'utf8');
    return JSON.parse(content).strategies || [];
  } catch (e) {
    return [];
  }
}

async function saveStrategies(strategies) {
  await fs.mkdir(path.dirname(STRATEGIES_FILE), { recursive: true });
  await fs.writeFile(STRATEGIES_FILE, JSON.stringify({ strategies }, null, 2));
}

async function saveStrategy(strategy) {
  const strategies = await loadStrategies();
  strategies.push(strategy);
  await saveStrategies(strategies);
}

// CLI
async function main() {
  const [,, command, ...args] = process.argv;
  
  switch (command) {
    case 'register':
      if (!args[0]) {
        console.log('Usage: outcome.js register "Strategy Name"');
        process.exit(1);
      }
      await registerStrategy({
        name: args[0],
        description: args[1] || '',
        type: args[2] || 'content_update',
        component: args[3] || 'geo-score',
        sampleSize: parseInt(args[4]) || 0
      });
      break;
      
    case 'record':
      if (!args[0]) {
        console.log('Usage: outcome.js record "strategy_id"');
        process.exit(1);
      }
      // 简化的记录方式，实际需从数据自动收集
      await recordOutcome(args[0], {
        before: { ranking: 8, citationRate: 0.10 },
        after: { ranking: 6, citationRate: 0.15 }
      });
      break;
      
    case 'report':
      const report = await getEffectivenessReport();
      console.log('\n📊 Strategy Effectiveness Report');
      console.log('=================================');
      console.log(`Total Strategies: ${report.total}`);
      console.log(`Active: ${report.active}`);
      console.log('\nBy Conclusion:');
      console.log(`  ✅ Positive: ${report.byConclusion.POSITIVE}`);
      console.log(`  ❌ Negative: ${report.byConclusion.NEGATIVE}`);
      console.log(`  ➖ Neutral: ${report.byConclusion.NEUTRAL}`);
      console.log(`  ❓ Inconclusive: ${report.byConclusion.INCONCLUSIVE}`);
      console.log(`  ⏳ Pending: ${report.byConclusion.pending}`);
      
      if (report.topPerformers.length > 0) {
        console.log('\n🏆 Top Performers:');
        report.topPerformers.forEach(s => {
          console.log(`  • ${s.name}: ${s.metrics.delta.ranking} ranking change`);
        });
      }
      break;
      
    case 'recommend':
      const rec = await recommendKnowledgeUpdate();
      console.log('\n🎯 Knowledge Update Recommendations');
      console.log('====================================');
      
      if (rec.toAdopt.length > 0) {
        console.log('\nAdopt these strategies:');
        rec.toAdopt.forEach(s => {
          console.log(`  + ${s.name} (${s.component})`);
          console.log(`    Evidence: ${s.evidence}`);
        });
      }
      
      if (rec.toDeprecate.length > 0) {
        console.log('\nDeprecate these strategies:');
        rec.toDeprecate.forEach(s => {
          console.log(`  - ${s.name}`);
          console.log(`    Reason: ${s.reason}`);
        });
      }
      
      if (rec.toAdopt.length === 0 && rec.toDeprecate.length === 0) {
        console.log('No update recommendations at this time.');
      }
      break;
      
    default:
      console.log(`
Outcome Tracker - 策略效果追踪

Commands:
  register "name" [desc] [type] [component] [sampleSize]
    Register a new strategy
    
  record "strategy_id"
    Record outcome for a strategy
    
  report
    Show effectiveness report
    
  recommend
    Get knowledge update recommendations

Examples:
  node outcome.js register "Add parking to GMB" "Test parking info impact" schema_change geo-score 50
  node outcome.js record strat_1234567890
  node outcome.js report
  node outcome.js recommend
`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default {
  registerStrategy,
  recordOutcome,
  getEffectivenessReport,
  recommendKnowledgeUpdate
};
