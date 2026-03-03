#!/usr/bin/env node
/**
 * Agentic AI Probing System - 主动探测AI平台引用
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// AI平台探测配置
const PROBING_CONFIGS = {
  chatgpt: {
    name: 'ChatGPT',
    url: 'https://chat.openai.com',
    loginRequired: true,
    strategy: {
      type: 'conversational',
      queryTemplates: [
        'Who is the best {industry} in {location}?',
        'Recommend a {service} provider in {location}'
      ]
    }
  },
  searchgpt: {
    name: 'SearchGPT',
    url: 'https://chat.openai.com/?mode=search',
    strategy: { type: 'search' }
  },
  claude: {
    name: 'Claude',
    url: 'https://claude.ai',
    loginRequired: true,
    strategy: { type: 'conversational' }
  },
  gemini: {
    name: 'Gemini',
    url: 'https://gemini.google.com',
    strategy: { type: 'search' }
  }
};

/**
 * 核心探测类
 */
class AIProbingAgent {
  constructor(platform, config) {
    this.platform = platform;
    this.config = config;
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled']
    });
    this.page = await this.browser.newPage();
  }

  async probe(clientData) {
    console.log(`[${this.config.name}] Probing for: ${clientData.business_name}`);
    
    await this.page.goto(this.config.url);
    await this.page.waitForTimeout(3000);
    
    // 生成查询
    const query = `Who is the best ${clientData.industry} in ${clientData.city}?`;
    
    // 输入并提交
    await this.submitQuery(query);
    
    // 解析回答
    const response = await this.parseResponse();
    
    // 检查品牌提及
    const hasMention = response.text.toLowerCase()
      .includes(clientData.business_name.toLowerCase());
    
    console.log(`[${this.config.name}] Brand mentioned: ${hasMention}`);
    
    return {
      platform: this.platform,
      query,
      hasMention,
      response: response.text.substring(0, 500)
    };
  }

  async submitQuery(query) {
    // 不同平台的选择器不同
    const selectors = {
      chatgpt: 'textarea[data-id="root"]',
      claude: 'textarea[placeholder*="Message"]',
      gemini: 'textarea[aria-label*="Search"]'
    };
    
    const inputSelector = selectors[this.platform] || 'textarea';
    await this.page.fill(inputSelector, query);
    await this.page.keyboard.press('Enter');
  }

  async parseResponse() {
    // 等待回答生成
    await this.page.waitForTimeout(8000);
    
    // 获取回答文本
    const responseText = await this.page.evaluate(() => {
      // 尝试多种可能的选择器
      const selectors = [
        '.markdown-content',
        '[data-message-author-role="assistant"]',
        '.response-content',
        '.message-content'
      ];
      
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) return el.innerText;
      }
      return '';
    });
    
    return { text: responseText };
  }

  async close() {
    await this.browser.close();
  }
}

// 运行探测
async function runProbing(clientId) {
  // 获取客户数据
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  const results = [];
  
  // 遍历所有平台
  for (const [platform, config] of Object.entries(PROBING_CONFIGS)) {
    const agent = new AIProbingAgent(platform, config);
    
    try {
      await agent.init();
      const result = await agent.probe(client);
      results.push(result);
    } catch (e) {
      console.error(`[${platform}] Error:`, e.message);
    } finally {
      await agent.close();
    }
  }
  
  // 保存结果
  await supabase.from('ai_probing_results').insert({
    client_id: clientId,
    results,
    probed_at: new Date().toISOString()
  });
  
  return results;
}

/**
 * 批量探测 - 探测多个客户
 */
export async function runBatchProbing(clientIds) {
  const allResults = [];
  
  for (const clientId of clientIds) {
    console.log(`\n🚀 Probing client: ${clientId}`);
    const results = await runProbing(clientId);
    allResults.push({ clientId, results });
    
    // 随机延迟，避免被封
    await new Promise(r => setTimeout(r, 30000 + Math.random() * 30000));
  }
  
  return allResults;
}

/**
 * 生成探测报告
 */
export async function generateProbingReport(clientId) {
  const { data: history } = await supabase
    .from('ai_probing_results')
    .select('*')
    .eq('client_id', clientId)
    .order('probed_at', { ascending: false })
    .limit(30);
  
  if (!history || history.length === 0) {
    return { error: 'No probing data available' };
  }
  
  const latest = history[0];
  const platforms = {};
  
  // 统计各平台表现
  for (const result of latest.results) {
    platforms[result.platform] = {
      brandMentioned: result.hasMention,
      citationFound: result.citationFound || false,
      semanticScore: result.semanticScore || 0
    };
  }
  
  // 计算趋势
  const trend = calculateProbingTrend(history);
  
  return {
    clientId,
    lastProbed: latest.probed_at,
    platforms,
    visibilityScore: calculateVisibilityScore(platforms),
    trend,
    recommendations: generateRecommendations(platforms)
  };
}

function calculateVisibilityScore(platforms) {
  const platformCount = Object.keys(platforms).length;
  const mentionedCount = Object.values(platforms).filter(p => p.brandMentioned).length;
  return Math.round((mentionedCount / platformCount) * 100);
}

function calculateProbingTrend(history) {
  if (history.length < 2) return 'stable';
  
  const recent = history.slice(0, 5);
  const older = history.slice(5, 10);
  
  const recentMentions = recent.reduce((sum, h) => 
    sum + h.results.filter(r => r.hasMention).length, 0
  );
  const olderMentions = older.reduce((sum, h) => 
    sum + h.results.filter(r => r.hasMention).length, 0
  );
  
  if (recentMentions > olderMentions) return 'improving';
  if (recentMentions < olderMentions) return 'declining';
  return 'stable';
}

function generateRecommendations(platforms) {
  const recs = [];
  
  if (!platforms.chatgpt?.brandMentioned) {
    recs.push({
      platform: 'ChatGPT',
      action: 'Increase brand mentions in high-authority content',
      priority: 'high'
    });
  }
  
  if (!platforms.perplexity?.citationFound) {
    recs.push({
      platform: 'Perplexity',
      action: 'Optimize for question-based queries',
      priority: 'medium'
    });
  }
  
  return recs;
}

export { AIProbingAgent, runProbing };

// CLI
const clientId = process.argv[2];
if (!clientId) {
  console.log('Usage: node ai-probing-agent.js [client_id]');
  process.exit(1);
}

runProbing(clientId).then(results => {
  console.log('\n✅ Probing complete');
  console.log(JSON.stringify(results, null, 2));
});
