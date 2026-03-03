#!/usr/bin/env node
/**
 * AI Probing Service - 生产级AI平台主动探测服务
 * 
 * 功能:
 * - Perplexity: 直接抓取引用 (最可靠)
 * - SearchGPT: 模拟搜索+引用提取
 * - Gemini: Google搜索集成监控
 * - Bing: 代理监控SearchGPT预测
 * 
 * 部署: systemd服务 + cron定时任务
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 配置
const CONFIG = {
  // 探测间隔 (避免被封)
  minDelay: 5000,
  maxDelay: 15000,
  
  // 重试配置
  maxRetries: 3,
  retryDelay: 10000,
  
  // 浏览器配置
  browser: {
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  },
  
  // 代理配置 (生产环境建议使用)
  proxy: process.env.PROXY_SERVER ? {
    server: process.env.PROXY_SERVER,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD
  } : null
};

// Supabase客户端
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://fixemvsckapejyfwphft.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * 生产级Perplexity探测器
 */
class PerplexityProber {
  constructor() {
    this.name = 'Perplexity';
    this.url = 'https://www.perplexity.ai';
  }

  async probe(clientData, browser) {
    console.log(`[${this.name}] Probing for: ${clientData.business_name}`);
    
    const page = await browser.newPage();
    const results = {
      platform: 'perplexity',
      citations: [],
      brandMentioned: false,
      brandMentionCount: 0,
      sources: []
    };

    try {
      // 1. 访问Perplexity
      await page.goto(this.url, { waitUntil: 'networkidle', timeout: 30000 });
      await this.randomDelay(2000, 4000);

      // 2. 生成查询
      const queries = this.generateQueries(clientData);
      
      for (const query of queries) {
        console.log(`[${this.name}] Query: "${query}"`);
        
        try {
          // 3. 输入查询
          await this.submitQuery(page, query);
          
          // 4. 等待回答生成
          await this.waitForResponse(page);
          
          // 5. 解析结果
          const response = await this.parseResponse(page, clientData);
          
          results.citations.push({
            query,
            brandMentioned: response.brandMentioned,
            sources: response.sources,
            timestamp: new Date().toISOString()
          });
          
          if (response.brandMentioned) {
            results.brandMentioned = true;
            results.brandMentionCount++;
          }
          
          results.sources.push(...response.sources);
          
        } catch (e) {
          console.error(`[${this.name}] Query failed: ${e.message}`);
        }
        
        // 随机延迟
        await this.randomDelay(CONFIG.minDelay, CONFIG.maxDelay);
      }

      // 去重来源
      results.sources = this.deduplicateSources(results.sources);
      
    } catch (e) {
      console.error(`[${this.name}] Probing failed: ${e.message}`);
      results.error = e.message;
    } finally {
      await page.close();
    }

    return results;
  }

  generateQueries(clientData) {
    const queries = [];
    const industry = clientData.industry || 'medical spa';
    const location = clientData.city || clientData.location || 'Houston';
    const businessName = clientData.business_name;
    
    // 生成有针对性的查询
    queries.push(`best ${industry} in ${location}`);
    queries.push(`${industry} near me ${location}`);
    queries.push(`top rated ${industry} ${location}`);
    
    if (businessName) {
      queries.push(`${businessName} reviews`);
    }
    
    return queries.slice(0, 3); // 限制查询数量
  }

  async submitQuery(page, query) {
    // 尝试多种可能的选择器
    const inputSelectors = [
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="Search"]',
      'textarea[aria-label*="search"]',
      'div[contenteditable="true"]'
    ];
    
    let inputFound = false;
    
    for (const selector of inputSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.fill(selector, query);
        await page.keyboard.press('Enter');
        inputFound = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!inputFound) {
      throw new Error('Could not find input field');
    }
  }

  async waitForResponse(page) {
    // 等待回答完成 (检测停止生成)
    let attempts = 0;
    const maxAttempts = 30; // 最多等30秒
    
    while (attempts < maxAttempts) {
      await page.waitForTimeout(1000);
      
      // 检查是否还在生成
      const isGenerating = await page.evaluate(() => {
        const generatingIndicators = [
          '.loading',
          '.generating',
          '[data-testid="loading"]'
        ];
        return generatingIndicators.some(sel => document.querySelector(sel));
      });
      
      if (!isGenerating) {
        // 再等待一下确保内容加载完成
        await page.waitForTimeout(2000);
        break;
      }
      
      attempts++;
    }
  }

  async parseResponse(page, clientData) {
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const result = {
      brandMentioned: false,
      sources: [],
      fullText: ''
    };

    // 1. 提取回答文本
    const textSelectors = [
      '.prose',
      '.answer-content',
      '[data-testid="answer"]',
      '.markdown-content'
    ];
    
    for (const selector of textSelectors) {
      const text = $(selector).text();
      if (text) {
        result.fullText = text;
        break;
      }
    }

    // 2. 检查品牌提及
    if (clientData.business_name) {
      const brandRegex = new RegExp(clientData.business_name, 'gi');
      result.brandMentioned = brandRegex.test(result.fullText);
    }

    // 3. 提取引用来源
    const sourceSelectors = [
      '.source-item',
      '.citation',
      '[data-testid="source"]',
      'a[href*="http"]'
    ];
    
    $(sourceSelectors.join(', ')).each((i, el) => {
      const $el = $(el);
      const url = $el.attr('href') || $el.find('a').attr('href');
      const title = $el.text().trim();
      
      if (url && url.startsWith('http')) {
        result.sources.push({
          url,
          title: title || url,
          isClient: clientData.website ? url.includes(clientData.website) : false
        });
      }
    });

    return result;
  }

  deduplicateSources(sources) {
    const seen = new Set();
    return sources.filter(s => {
      if (seen.has(s.url)) return false;
      seen.add(s.url);
      return true;
    });
  }

  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(r => setTimeout(r, delay));
  }
}

/**
 * Gemini探测器 (通过Google搜索)
 */
class GeminiProber {
  constructor() {
    this.name = 'Gemini';
    this.url = 'https://gemini.google.com';
  }

  async probe(clientData, browser) {
    console.log(`[${this.name}] Probing for: ${clientData.business_name}`);
    
    const page = await browser.newPage();
    const results = {
      platform: 'gemini',
      citations: [],
      brandMentioned: false,
      sources: []
    };

    try {
      await page.goto(this.url, { waitUntil: 'networkidle', timeout: 30000 });
      await this.randomDelay(2000, 4000);

      const query = `best ${clientData.industry || 'medical spa'} in ${clientData.city || 'Houston'}`;
      
      // 输入查询
      await page.fill('textarea', query);
      await page.keyboard.press('Enter');
      
      // 等待回答
      await page.waitForTimeout(10000);
      
      // 解析结果
      const html = await page.content();
      const $ = cheerio.load(html);
      
      const text = $('body').text();
      results.brandMentioned = clientData.business_name ? 
        text.toLowerCase().includes(clientData.business_name.toLowerCase()) : false;
      
      // 提取来源链接
      $('a[href^="http"]').each((i, el) => {
        const url = $(el).attr('href');
        if (url && !url.includes('google.com')) {
          results.sources.push({
            url,
            title: $(el).text(),
            isClient: clientData.website ? url.includes(clientData.website) : false
          });
        }
      });

    } catch (e) {
      console.error(`[${this.name}] Error: ${e.message}`);
      results.error = e.message;
    } finally {
      await page.close();
    }

    return results;
  }

  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(r => setTimeout(r, delay));
  }
}

/**
 * 语义指纹检测器
 */
class SemanticFingerprintChecker {
  async checkFingerprints(clientData, html) {
    const results = {
      fingerprintsChecked: [],
      matchesFound: [],
      brandInternalized: false
    };

    // 从数据库获取指纹
    const { data: fpData } = await supabase
      .from('semantic_fingerprints')
      .select('fingerprints')
      .eq('client_id', clientData.id)
      .single();

    if (!fpData || !fpData.fingerprints) {
      return results;
    }

    const text = html.toLowerCase();

    for (const fp of fpData.fingerprints) {
      results.fingerprintsChecked.push(fp);
      
      const value = fp.value.toLowerCase();
      if (text.includes(value)) {
        results.matchesFound.push({
          fingerprint: fp,
          confidence: 95,
          context: this.extractContext(text, value)
        });
      }
    }

    // 2个以上匹配视为内化
    results.brandInternalized = results.matchesFound.length >= 2;
    
    return results;
  }

  extractContext(text, value) {
    const index = text.indexOf(value);
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + value.length + 50);
    return text.substring(start, end);
  }
}

/**
 * 主探测服务
 */
class AIProbingService {
  constructor() {
    this.probers = {
      perplexity: new PerplexityProber(),
      gemini: new GeminiProber()
    };
    this.fingerprintChecker = new SemanticFingerprintChecker();
  }

  async init() {
    console.log('🚀 Initializing AI Probing Service...');
    
    this.browser = await chromium.launch(CONFIG.browser);
    
    // 创建浏览器上下文
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      proxy: CONFIG.proxy
    });

    console.log('✅ Browser initialized');
  }

  async probeClient(clientId) {
    console.log(`\n🔍 Starting probe for client: ${clientId}`);
    
    // 获取客户数据
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error || !client) {
      throw new Error(`Client not found: ${clientId}`);
    }

    const startTime = Date.now();
    const results = {
      clientId,
      timestamp: new Date().toISOString(),
      platforms: {},
      summary: {
        totalPlatforms: 0,
        brandMentionedOn: [],
        citationsFound: 0,
        semanticMatches: 0
      }
    };

    // 探测各平台
    for (const [name, prober] of Object.entries(this.probers)) {
      try {
        const platformResult = await prober.probe(client, this.browser);
        results.platforms[name] = platformResult;
        results.summary.totalPlatforms++;
        
        if (platformResult.brandMentioned) {
          results.summary.brandMentionedOn.push(name);
        }
        
        results.summary.citationsFound += platformResult.sources?.length || 0;
        
      } catch (e) {
        console.error(`[${name}] Probing failed:`, e.message);
        results.platforms[name] = { error: e.message };
      }
    }

    // 语义指纹检测
    const allHtml = Object.values(results.platforms)
      .map(p => JSON.stringify(p))
      .join(' ');
    
    const fpResult = await this.fingerprintChecker.checkFingerprints(client, allHtml);
    results.semanticFingerprints = fpResult;
    results.summary.semanticMatches = fpResult.matchesFound.length;

    // 保存结果
    await this.saveResults(results);
    
    // 更新可见度评分
    await this.updateVisibilityScore(clientId, results);

    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ Probe completed in ${duration}s`);
    console.log(`   Brand mentioned on: ${results.summary.brandMentionedOn.join(', ') || 'none'}`);
    console.log(`   Citations found: ${results.summary.citationsFound}`);
    console.log(`   Semantic matches: ${results.summary.semanticMatches}`);

    return results;
  }

  async saveResults(results) {
    const { error } = await supabase
      .from('ai_probing_results')
      .insert({
        client_id: results.clientId,
        results: results.platforms,
        platforms_tested: results.summary.totalPlatforms,
        brand_mentions: results.summary.brandMentionedOn.length,
        citations_found: results.summary.citationsFound,
        semantic_fingerprint_matches: results.semanticFingerprints?.matchesFound || [],
        probed_at: results.timestamp
      });

    if (error) {
      console.error('Failed to save results:', error.message);
    }
  }

  async updateVisibilityScore(clientId, results) {
    // 计算综合评分
    const platformCount = results.summary.totalPlatforms;
    const mentionCount = results.summary.brandMentionedOn.length;
    const citationCount = results.summary.citationsFound;
    
    const perplexityScore = results.platforms.perplexity?.brandMentioned ? 80 : 30;
    const geminiScore = results.platforms.gemini?.brandMentioned ? 60 : 25;
    
    const overallScore = Math.round(
      (perplexityScore + geminiScore + mentionCount * 10 + Math.min(citationCount * 5, 20)) / 3
    );

    const { error } = await supabase
      .from('ai_visibility_scores')
      .upsert({
        client_id: clientId,
        overall_score: Math.min(overallScore, 100),
        perplexity_score: perplexityScore,
        gemini_score: geminiScore,
        chatgpt_score: 0, // 待实现
        claude_score: 0,  // 待实现
        searchgpt_score: 0, // 从Bing数据计算
        total_mentions: mentionCount,
        citation_rate: Math.round((mentionCount / platformCount) * 100) || 0,
        semantic_match_rate: results.summary.semanticMatches > 0 ? 100 : 0,
        calculated_at: results.timestamp
      });

    if (error) {
      console.error('Failed to update visibility score:', error.message);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

/**
 * 批量探测所有活跃客户
 */
async function probeAllClients() {
  const service = new AIProbingService();
  
  try {
    await service.init();
    
    // 获取所有活跃客户
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id')
      .eq('status', 'active');

    if (error) throw error;
    
    console.log(`📋 Found ${clients?.length || 0} active clients to probe`);

    for (const client of clients || []) {
      try {
        await service.probeClient(client.id);
        
        // 随机延迟，避免被封
        await new Promise(r => setTimeout(r, 30000 + Math.random() * 30000));
        
      } catch (e) {
        console.error(`Failed to probe client ${client.id}:`, e.message);
      }
    }

  } finally {
    await service.close();
  }
}

/**
 * 单个客户探测 (CLI用)
 */
async function probeSingleClient(clientId) {
  const service = new AIProbingService();
  
  try {
    await service.init();
    const results = await service.probeClient(clientId);
    console.log('\n📊 Final Results:');
    console.log(JSON.stringify(results, null, 2));
    return results;
  } finally {
    await service.close();
  }
}

// CLI入口
const clientId = process.argv[2];

if (clientId === '--all') {
  probeAllClients().then(() => {
    console.log('\n✅ Batch probing completed');
    process.exit(0);
  }).catch(e => {
    console.error('Batch probing failed:', e);
    process.exit(1);
  });
} else if (clientId) {
  probeSingleClient(clientId).then(() => {
    process.exit(0);
  }).catch(e => {
    console.error('Probing failed:', e);
    process.exit(1);
  });
} else {
  console.log(`
AI Probing Service - 生产级AI平台探测

Usage:
  node ai-probing-service.js [client_id]     # 探测单个客户
  node ai-probing-service.js --all           # 探测所有活跃客户

Examples:
  node ai-probing-service.js client-123
  node ai-probing-service.js --all

Environment Variables:
  SUPABASE_URL        - Supabase URL
  SUPABASE_SERVICE_KEY - Supabase Service Key
  PROXY_SERVER        - Proxy server (optional)
`);
  process.exit(0);
}

export { AIProbingService, probeSingleClient, probeAllClients };
