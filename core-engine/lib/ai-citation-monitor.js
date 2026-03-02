/**
 * AI Citation Monitor - 追踪AI平台引用
 * 
 * 监控 Perplexity, ChatGPT, Claude 是否引用客户内容
 * 这是GEO的核心指标
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// AI平台配置
const AI_PLATFORMS = {
  perplexity: {
    name: 'Perplexity',
    queryUrl: 'https://www.perplexity.ai/search',
    // Perplexity没有官方API，需要爬虫
    scrapingEnabled: true
  },
  
  // ChatGPT/Claude没有搜索功能，但可以通过其他方式追踪
  // 如：品牌提及监控、引用链接分析
  
  youcom: {
    name: 'You.com',
    apiEndpoint: 'https://api.you.com/v1/search',
    enabled: false // 需要API key
  }
};

/**
 * 监控客户在AI平台的引用
 */
export async function monitorAICitations(clientId, queries, options = {}) {
  console.log(`🔍 Monitoring AI citations for ${clientId}...\n`);
  
  const results = {
    clientId,
    timestamp: new Date().toISOString(),
    platforms: {}
  };
  
  // 监控Perplexity
  if (options.perplexity !== false) {
    results.platforms.perplexity = await monitorPerplexity(clientId, queries);
  }
  
  // 监控品牌提及 (通过其他数据源)
  results.platforms.brandMentions = await monitorBrandMentions(clientId, queries);
  
  // 保存结果
  await saveAICitationResults(clientId, results);
  
  // 分析趋势
  const analysis = await analyzeCitationTrends(clientId, results);
  results.analysis = analysis;
  
  return results;
}

/**
 * 监控Perplexity引用
 * 
 * 策略：使用Bright Data或类似服务模拟搜索
 * 提取回答中引用的来源
 * 检查是否包含客户网站
 */
async function monitorPerplexity(clientId, queries) {
  console.log('  📡 Checking Perplexity...');
  
  const results = {
    platform: 'Perplexity',
    queriesChecked: queries.length,
    citations: [],
    summary: {
      totalMentions: 0,
      asPrimarySource: 0,
      asSecondarySource: 0
    }
  };
  
  for (const query of queries) {
    try {
      // 这里需要Bright Data或其他爬虫服务
      // 模拟实现
      const citation = await scrapePerplexityForQuery(query, clientId);
      
      if (citation.found) {
        results.citations.push(citation);
        results.summary.totalMentions++;
        
        if (citation.rank === 1) {
          results.summary.asPrimarySource++;
        } else {
          results.summary.asSecondarySource++;
        }
      }
    } catch (e) {
      console.log(`    ⚠️  Failed to check query: "${query}"`);
    }
  }
  
  return results;
}

async function scrapePerplexityForQuery(query, clientId) {
  // TODO: 实现真实的Perplexity爬虫
  // 需要Bright Data或类似服务
  
  // Demo模式 - 模拟结果
  const demoResults = {
    found: Math.random() > 0.5,
    query,
    rank: Math.floor(Math.random() * 5) + 1,
    answerSnippet: 'Sample answer snippet...',
    sources: [
      { url: 'https://example-client.com', rank: 1 },
      { url: 'https://competitor.com', rank: 2 }
    ],
    timestamp: new Date().toISOString()
  };
  
  return demoResults;
}

/**
 * 监控品牌提及
 * 通过Google Alerts、社交监听等方式
 */
async function monitorBrandMentions(clientId, queries) {
  console.log('  📡 Checking brand mentions...');
  
  // TODO: 集成品牌监听服务
  // 如: Mention, Brand24, Google Alerts API
  
  return {
    platform: 'Brand Mentions',
    mentions: [],
    summary: {
      totalMentions: 0,
      sentiment: 'neutral'
    }
  };
}

/**
 * 分析引用趋势
 */
async function analyzeCitationTrends(clientId, currentResults) {
  // 加载历史数据
  const history = await loadCitationHistory(clientId);
  
  const analysis = {
    trend: 'stable', // improving, declining, stable
    changeFromLastMonth: 0,
    topPerformingQueries: [],
    underperformingQueries: [],
    recommendations: []
  };
  
  // 对比历史数据
  if (history.length > 0) {
    const lastMonth = history[history.length - 1];
    const currentMentions = currentResults.platforms.perplexity?.summary?.totalMentions || 0;
    const lastMonthMentions = lastMonth.platforms?.perplexity?.summary?.totalMentions || 0;
    
    analysis.changeFromLastMonth = currentMentions - lastMonthMentions;
    
    if (analysis.changeFromLastMonth > 0) {
      analysis.trend = 'improving';
    } else if (analysis.changeFromLastMonth < 0) {
      analysis.trend = 'declining';
    }
  }
  
  // 生成建议
  if (analysis.trend === 'declining') {
    analysis.recommendations.push({
      priority: 'high',
      action: 'Increase content freshness and authority signals',
      impact: 'Reverse declining citation trend'
    });
  }
  
  analysis.recommendations.push({
    priority: 'medium',
    action: 'Add more FAQ content to target conversational queries',
    impact: 'Increase AI citation probability'
  });
  
  return analysis;
}

/**
 * 保存AI引用结果
 */
async function saveAICitationResults(clientId, results) {
  const outputDir = path.join(__dirname, '../outputs', clientId);
  const filePath = path.join(outputDir, 'ai-citations.json');
  
  await fs.mkdir(outputDir, { recursive: true });
  
  // 加载现有历史
  let history = [];
  try {
    const existing = await fs.readFile(filePath, 'utf8');
    history = JSON.parse(existing);
  } catch (e) {}
  
  // 添加新记录
  history.push(results);
  
  // 只保留最近90天
  const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
  history = history.filter(h => new Date(h.timestamp).getTime() > cutoff);
  
  await fs.writeFile(filePath, JSON.stringify(history, null, 2));
}

async function loadCitationHistory(clientId) {
  const filePath = path.join(__dirname, '../outputs', clientId, 'ai-citations.json');
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

/**
 * 生成AI引用报告
 */
export async function generateAICitationReport(clientId) {
  const history = await loadCitationHistory(clientId);
  
  if (history.length === 0) {
    return 'No AI citation data available yet.';
  }
  
  const latest = history[history.length - 1];
  
  const report = `
# AI Citation Report

**Client:** ${clientId}  
**Generated:** ${new Date().toLocaleString()}

## Perplexity Citations

**Current Status:**
- Total Mentions: ${latest.platforms.perplexity?.summary?.totalMentions || 0}
- As Primary Source: ${latest.platforms.perplexity?.summary?.asPrimarySource || 0}
- As Secondary Source: ${latest.platforms.perplexity?.summary?.asSecondarySource || 0}

**Trend:** ${latest.analysis?.trend || 'N/A'}  
**Change from Last Month:** ${latest.analysis?.changeFromLastMonth || 0}

## Top Performing Queries

${latest.platforms.perplexity?.citations?.map(c =
  c.found ? `- "${c.query}": Rank #${c.rank}` : ''
).filter(Boolean).join('\n') || 'No citations found'}

## Recommendations

${latest.analysis?.recommendations?.map(r =
  `- **[${r.priority.toUpperCase()}]** ${r.action}\n  Impact: ${r.impact}`
).join('\n') || 'No recommendations available'}

---

*Track your AI visibility. Be where your customers are asking questions.*
  `.trim();
  
  return report;
}

/**
 * 检查特定查询的AI引用
 * 用于即时验证
 */
export async function checkQueryAIVisibility(query, clientWebsite) {
  console.log(`\n🔍 Checking AI visibility for: "${query}"`);
  
  const results = {
    query,
    clientWebsite,
    timestamp: new Date().toISOString(),
    platforms: {}
  };
  
  // 检查Perplexity
  const perplexityResult = await scrapePerplexityForQuery(query, null);
  results.platforms.perplexity = {
    found: perplexityResult.sources?.some(s =
      s.url.includes(clientWebsite)
    ) || false,
    rank: perplexityResult.sources?.findIndex(s =
      s.url.includes(clientWebsite)
    ) + 1 || null,
    totalSources: perplexityResult.sources?.length || 0
  };
  
  console.log(`  Perplexity: ${results.platforms.perplexity.found ? '✅ Found' : '❌ Not found'}`);
  if (results.platforms.perplexity.found) {
    console.log(`    Rank: #${results.platforms.perplexity.rank} of ${results.platforms.perplexity.totalSources}`);
  }
  
  return results;
}

// CLI
async function main() {
  const [,, command, clientId, ...args] = process.argv;
  
  switch (command) {
    case 'monitor':
      if (!clientId) {
        console.log('Usage: ai-citation.js monitor "client_id"');
        process.exit(1);
      }
      // 加载客户的关键词
      const queries = args.length > 0 ? args : [
        'best botox houston',
        'med spa near me',
        'fillers houston tx'
      ];
      
      const results = await monitorAICitations(clientId, queries);
      console.log('\n✅ Monitoring complete');
      console.log(`  Perplexity mentions: ${results.platforms.perplexity?.summary?.totalMentions || 0}`);
      console.log(`  Trend: ${results.analysis?.trend || 'N/A'}`);
      break;
      
    case 'report':
      if (!clientId) {
        console.log('Usage: ai-citation.js report "client_id"');
        process.exit(1);
      }
      const report = await generateAICitationReport(clientId);
      console.log('\n' + report);
      break;
      
    case 'check':
      const [query, website] = [clientId, args[0]];
      if (!query || !website) {
        console.log('Usage: ai-citation.js check "query" "website"');
        process.exit(1);
      }
      await checkQueryAIVisibility(query, website);
      break;
      
    default:
      console.log(`
AI Citation Monitor - 追踪AI平台引用

Commands:
  monitor "client_id" [query1] [query2] ...
    Monitor AI citations for client
    
  report "client_id"
    Generate AI citation report
    
  check "query" "website"
    Check visibility for specific query

Examples:
  node ai-citation.js monitor client_123 "botox houston" "med spa near me"
  node ai-citation.js report client_123
  node ai-citation.js check "best botox houston" "example.com"
`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default {
  monitorAICitations,
  generateAICitationReport,
  checkQueryAIVisibility
};
