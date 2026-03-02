#!/usr/bin/env node
/**
 * Signal Monitor - 外部变化感知系统
 * 
 * 监控GEO/AI领域的变化信号
 * 生成更新建议和告警
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SIGNALS_FILE = path.join(__dirname, '../data', 'signals.json');
const KNOWLEDGE_VERSION_FILE = path.join(__dirname, '../knowledge-base', 'version.json');

// 监控源配置
const MONITORING_SOURCES = [
  {
    name: 'Google Search Central',
    type: 'rss',
    url: 'https://developers.google.com/search/updates.rss',
    priority: 'CRITICAL',
    keywords: ['algorithm', 'update', 'core', 'helpful content', 'spam']
  },
  {
    name: 'Schema.org Releases',
    type: 'github',
    repo: 'schemaorg/schemaorg',
    priority: 'HIGH',
    watchReleases: true
  },
  {
    name: 'Search Engine Journal',
    type: 'rss',
    url: 'https://www.searchenginejournal.com/feed/',
    priority: 'MEDIUM',
    keywords: ['google update', 'ranking factor', 'local seo', 'ai search']
  }
];

/**
 * 主监控循环
 */
export async function monitorSignals() {
  console.log('🔍 Scanning for GEO/AI signals...\n');
  
  const signals = [];
  
  for (const source of MONITORING_SOURCES) {
    try {
      const sourceSignals = await checkSource(source);
      signals.push(...sourceSignals);
    } catch (e) {
      console.log(`  ⚠️  Failed to check ${source.name}: ${e.message}`);
    }
  }
  
  // 保存信号
  await saveSignals(signals);
  
  // 分析影响
  const analysis = await analyzeImpact(signals);
  
  // 生成建议
  const recommendations = generateRecommendations(analysis);
  
  return {
    signalsFound: signals.length,
    criticalSignals: signals.filter(s => s.priority === 'CRITICAL').length,
    analysis,
    recommendations
  };
}

/**
 * 检查单个信号源
 */
async function checkSource(source) {
  const signals = [];
  
  switch (source.type) {
    case 'rss':
      // 简化的RSS检查（实际需RSS解析库）
      console.log(`  📡 Checking ${source.name}...`);
      // TODO: 实现RSS抓取
      break;
      
    case 'github':
      console.log(`  📡 Checking ${source.name}...`);
      const releases = await checkGitHubReleases(source.repo);
      for (const release of releases) {
        if (isNewRelease(release)) {
          signals.push({
            source: source.name,
            type: 'schema_release',
            priority: source.priority,
            title: release.name,
            description: release.body?.substring(0, 200),
            url: release.html_url,
            detectedAt: new Date().toISOString()
          });
        }
      }
      break;
  }
  
  return signals;
}

async function checkGitHubReleases(repo) {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
    if (!response.ok) return [];
    const release = await response.json();
    return [release];
  } catch (e) {
    return [];
  }
}

function isNewRelease(release) {
  // 检查是否已记录
  // TODO: 与数据库比对
  const publishedAt = new Date(release.published_at);
  const daysAgo = (Date.now() - publishedAt) / (1000 * 60 * 60 * 24);
  return daysAgo < 7; // 7天内的新发布
}

/**
 * 分析信号影响
 */
async function analyzeImpact(signals) {
  const impact = {
    high: [],
    medium: [],
    low: []
  };
  
  for (const signal of signals) {
    const affectedComponents = [];
    
    // 判断影响范围
    if (signal.type === 'algorithm_update') {
      affectedComponents.push('geo-score-algorithm', 'ranking-predictor');
    }
    if (signal.type === 'schema_release') {
      affectedComponents.push('schema-generator', 'knowledge-graph');
    }
    if (signal.title?.toLowerCase().includes('local')) {
      affectedComponents.push('local-seo-module');
    }
    if (signal.title?.toLowerCase().includes('ai') || 
        signal.title?.toLowerCase().includes('perplexity')) {
      affectedComponents.push('citation-engine');
    }
    
    const impactItem = {
      signal: signal.title,
      components: affectedComponents,
      estimatedEffort: estimateEffort(affectedComponents),
      estimatedImpact: signal.priority === 'CRITICAL' ? 'HIGH' : 'MEDIUM'
    };
    
    if (signal.priority === 'CRITICAL') {
      impact.high.push(impactItem);
    } else if (signal.priority === 'HIGH') {
      impact.medium.push(impactItem);
    } else {
      impact.low.push(impactItem);
    }
  }
  
  return impact;
}

function estimateEffort(components) {
  const effortMap = {
    'geo-score-algorithm': '1-2 days',
    'citation-engine': '2-3 days',
    'schema-generator': '1 day',
    'knowledge-graph': '3-5 days'
  };
  
  const maxEffort = components
    .map(c => effortMap[c] || '1 day')
    .sort((a, b) => b.localeCompare(a))[0];
  
  return maxEffort || '1 day';
}

/**
 * 生成更新建议
 */
function generateRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.high.length > 0) {
    recommendations.push({
      priority: 'IMMEDIATE',
      action: '暂停新部署',
      reason: '检测到高影响信号，需先评估',
      steps: [
        '1. 审查所有高优先级信号',
        '2. 在测试环境验证影响',
        '3. 更新知识库',
        '4. 小范围A/B测试',
        '5. 全量部署'
      ]
    });
  }
  
  for (const item of analysis.medium) {
    recommendations.push({
      priority: 'THIS_WEEK',
      action: `更新: ${item.components.join(', ')}`,
      estimatedTime: item.estimatedEffort,
      testingPlan: 'A/B test on 5-10 clients'
    });
  }
  
  return recommendations;
}

/**
 * 保存信号到数据库
 */
async function saveSignals(signals) {
  if (signals.length === 0) return;
  
  let existing = { signals: [] };
  try {
    const content = await fs.readFile(SIGNALS_FILE, 'utf8');
    existing = JSON.parse(content);
  } catch (e) {}
  
  // 去重并合并
  const allSignals = [...existing.signals, ...signals];
  const uniqueSignals = allSignals.filter((s, i, arr) => 
    arr.findIndex(t => t.title === s.title) === i
  );
  
  // 只保留最近100条
  existing.signals = uniqueSignals.slice(-100);
  
  await fs.mkdir(path.dirname(SIGNALS_FILE), { recursive: true });
  await fs.writeFile(SIGNALS_FILE, JSON.stringify(existing, null, 2));
}

/**
 * 知识版本检查
 */
export async function checkKnowledgeFreshness() {
  const knowledgeAge = await getKnowledgeAge();
  
  return {
    status: knowledgeAge > 30 ? 'STALE' : knowledgeAge > 14 ? 'AGING' : 'FRESH',
    age: knowledgeAge,
    lastUpdated: await getLastUpdateDate(),
    suggestion: knowledgeAge > 30 ? '建议立即审查知识库' : 
                knowledgeAge > 14 ? '建议安排审查' : '知识库新鲜'
  };
}

async function getKnowledgeAge() {
  try {
    const content = await fs.readFile(KNOWLEDGE_VERSION_FILE, 'utf8');
    const version = JSON.parse(content);
    const lastUpdate = new Date(version.lastUpdated);
    return Math.floor((Date.now() - lastUpdate) / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 999; // 未知，视为过期
  }
}

async function getLastUpdateDate() {
  try {
    const content = await fs.readFile(KNOWLEDGE_VERSION_FILE, 'utf8');
    const version = JSON.parse(content);
    return version.lastUpdated;
  } catch (e) {
    return 'Unknown';
  }
}

// CLI
async function main() {
  const [,, command] = process.argv;
  
  switch (command) {
    case 'scan':
      const result = await monitorSignals();
      console.log('\n📊 Scan Results:');
      console.log(`  Signals found: ${result.signalsFound}`);
      console.log(`  Critical: ${result.criticalSignals}`);
      
      if (result.recommendations.length > 0) {
        console.log('\n🎯 Recommendations:');
        result.recommendations.forEach(r => {
          console.log(`  [${r.priority}] ${r.action}`);
          if (r.steps) {
            r.steps.forEach(s => console.log(`    ${s}`));
          }
        });
      }
      break;
      
    case 'status':
      const freshness = await checkKnowledgeFreshness();
      console.log('\n📚 Knowledge Base Status:');
      console.log(`  Status: ${freshness.status}`);
      console.log(`  Age: ${freshness.age} days`);
      console.log(`  Last Updated: ${freshness.lastUpdated}`);
      console.log(`  Suggestion: ${freshness.suggestion}`);
      break;
      
    case 'list':
      try {
        const content = await fs.readFile(SIGNALS_FILE, 'utf8');
        const data = JSON.parse(content);
        console.log(`\n📡 Recent Signals (${data.signals.length}):`);
        data.signals.slice(-10).forEach(s => {
          console.log(`  [${s.priority}] ${s.source}: ${s.title?.substring(0, 50)}...`);
        });
      } catch (e) {
        console.log('No signals recorded yet');
      }
      break;
      
    default:
      console.log(`
Signal Monitor - 外部变化感知

Commands:
  scan     Scan for new signals
  status   Check knowledge freshness
  list     List recent signals

Examples:
  node signal-monitor.js scan
  node signal-monitor.js status
`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default {
  monitorSignals,
  checkKnowledgeFreshness
};
