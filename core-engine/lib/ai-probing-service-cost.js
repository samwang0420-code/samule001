#!/usr/bin/env node
/**
 * Cost-Optimized AI Probing Service - 成本控制版
 * 
 * 成本控制策略:
 * - Apify: $9/1000条 = $0.009/条
 * - 每日预算限制
 * - 智能缓存避免重复查询
 * - 批量处理减少API调用
 * - 优先级队列处理重要客户
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 成本配置
const COST_CONFIG = {
  // Apify成本: $9/1000 = $0.009 per query
  apifyCostPerQuery: 0.009,
  
  // 每日预算限制
  dailyBudgetUSD: 2.00, // 每天最多$2
  
  // 每月预算限制
  monthlyBudgetUSD: 50.00, // 每月最多$50
  
  // 缓存时间 (小时)
  cacheTTLHours: 24, // 24小时内不重复查询
  
  // 每个客户最大查询数
  maxQueriesPerClient: 3,
  
  // 批处理大小
  batchSize: 5
};

// Apify配置
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_BASE_URL = 'https://api.apify.com/v2';
const ACTOR_ID = 'winbayai/perplexity-2-0';

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// 内存缓存
const queryCache = new Map();

/**
 * 成本追踪器
 */
class CostTracker {
  constructor() {
    this.dailyCost = 0;
    this.monthlyCost = 0;
    this.queryCount = 0;
    this.cacheHits = 0;
    this.apifyCalls = 0;
  }

  async load() {
    // 从数据库加载今日成本
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('cost_tracking')
      .select('*')
      .eq('date', today)
      .single();
    
    if (data) {
      this.dailyCost = data.daily_cost || 0;
      this.queryCount = data.query_count || 0;
    }
  }

  async save() {
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('cost_tracking')
      .upsert({
        date: today,
        daily_cost: this.dailyCost,
        monthly_cost: this.monthlyCost,
        query_count: this.queryCount,
        updated_at: new Date().toISOString()
      });
  }

  addCost(amount) {
    this.dailyCost += amount;
    this.monthlyCost += amount;
  }

  canSpend(amount) {
    return (this.dailyCost + amount) <= COST_CONFIG.dailyBudgetUSD;
  }

  getStats() {
    return {
      dailyCost: this.dailyCost.toFixed(4),
      dailyBudget: COST_CONFIG.dailyBudgetUSD,
      remaining: (COST_CONFIG.dailyBudgetUSD - this.dailyCost).toFixed(4),
      queryCount: this.queryCount,
      cacheHits: this.cacheHits,
      apifyCalls: this.apifyCalls,
      efficiency: this.queryCount > 0 ? 
        ((this.cacheHits / (this.cacheHits + this.apifyCalls)) * 100).toFixed(1) : 0
    };
  }
}

const costTracker = new CostTracker();

/**
 * 智能缓存管理
 */
class QueryCache {
  static getCacheKey(query, clientId) {
    return `${clientId}:${query.toLowerCase().trim()}`;
  }

  static async get(query, clientId) {
    const key = this.getCacheKey(query, clientId);
    
    // 检查内存缓存
    if (queryCache.has(key)) {
      const cached = queryCache.get(key);
      const age = Date.now() - cached.timestamp;
      const maxAge = COST_CONFIG.cacheTTLHours * 60 * 60 * 1000;
      
      if (age < maxAge) {
        console.log(`   💾 Cache HIT for "${query.substring(0, 40)}..."`);
        costTracker.cacheHits++;
        return cached.data;
      }
    }
    
    // 检查数据库缓存
    try {
      const { data } = await supabase
        .from('query_cache')
        .select('*')
        .eq('cache_key', key)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (data) {
        console.log(`   💾 DB Cache HIT for "${query.substring(0, 40)}..."`);
        queryCache.set(key, { data: data.result, timestamp: Date.now() });
        costTracker.cacheHits++;
        return data.result;
      }
    } catch (e) {
      // 缓存未命中
    }
    
    return null;
  }

  static async set(query, clientId, result) {
    const key = this.getCacheKey(query, clientId);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + COST_CONFIG.cacheTTLHours);
    
    // 内存缓存
    queryCache.set(key, { data: result, timestamp: Date.now() });
    
    // 数据库缓存
    await supabase
      .from('query_cache')
      .upsert({
        cache_key: key,
        query: query,
        client_id: clientId,
        result: result,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });
  }
}

/**
 * 成本优化的Apify Perplexity探测器
 */
class CostOptimizedPerplexityProber {
  constructor() {
    this.name = 'Perplexity (Cost-Optimized)';
    this.demoMode = !APIFY_TOKEN;
  }

  /**
   * 批量查询优化 - 合并多个查询减少API调用
   */
  async batchQuery(queries) {
    console.log(`[${this.name}] Processing ${queries.length} queries`);
    
    const results = [];
    const toFetch = [];
    
    // 1. 检查缓存
    for (const query of queries) {
      const cached = await QueryCache.get(query, 'batch');
      if (cached) {
        results.push({ query, ...cached, fromCache: true });
      } else {
        toFetch.push(query);
      }
    }
    
    console.log(`   💾 Cache hits: ${results.length}, To fetch: ${toFetch.length}`);
    
    // 2. 检查预算
    const estimatedCost = toFetch.length * COST_CONFIG.apifyCostPerQuery;
    if (!costTracker.canSpend(estimatedCost)) {
      console.log(`   ⚠️ Budget limit reached! Using demo mode for remaining queries.`);
      for (const query of toFetch) {
        const demoResult = this.generateDemoResult(query);
        results.push({ query, ...demoResult, fromCache: false, isDemo: true });
      }
      return results;
    }
    
    // 3. 调用Apify (批量处理)
    if (toFetch.length > 0) {
      const apifyResults = await this.callApify(toFetch);
      
      for (let i = 0; i < toFetch.length; i++) {
        const result = apifyResults[i] || this.generateDemoResult(toFetch[i]);
        results.push({ 
          query: toFetch[i], 
          ...result, 
          fromCache: false,
          isDemo: this.demoMode 
        });
        
        // 保存到缓存
        await QueryCache.set(toFetch[i], 'batch', result);
      }
      
      // 记录成本
      const actualCost = toFetch.length * COST_CONFIG.apifyCostPerQuery;
      costTracker.addCost(actualCost);
      costTracker.apifyCalls += toFetch.length;
    }
    
    return results;
  }

  async callApify(queries) {
    if (this.demoMode) {
      console.log(`[${this.name}] DEMO mode - generating mock data`);
      return queries.map(q => this.generateDemoResult(q));
    }
    
    try {
      console.log(`[${this.name}] Calling Apify API (${queries.length} queries)`);
      
      const startResponse = await fetch(
        `${APIFY_BASE_URL}/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queries: queries,
            mode: 'concise',
            timeout: 60
          })
        }
      );
      
      if (!startResponse.ok) {
        const error = await startResponse.json();
        if (error.error?.type === 'user-or-token-not-found') {
          console.log(`[${this.name}] Token invalid, switching to demo mode`);
          this.demoMode = true;
          return queries.map(q => this.generateDemoResult(q));
        }
        throw new Error(JSON.stringify(error));
      }
      
      const { data: { id: runId } } = await startResponse.json();
      
      // 等待完成
      let status = 'RUNNING';
      let attempts = 0;
      while (status === 'RUNNING' && attempts < 30) {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await fetch(
          `${APIFY_BASE_URL}/acts/${ACTOR_ID}/runs/${runId}?token=${APIFY_TOKEN}`
        );
        const statusData = await statusRes.json();
        status = statusData.data.status;
        attempts++;
      }
      
      if (status !== 'SUCCEEDED') {
        throw new Error(`Run failed: ${status}`);
      }
      
      // 获取结果
      const datasetRes = await fetch(
        `${APIFY_BASE_URL}/acts/${ACTOR_ID}/runs/${runId}/dataset/items?token=${APIFY_TOKEN}`
      );
      
      const items = await datasetRes.json();
      console.log(`[${this.name}] ✅ Got ${items.length} results from Apify`);
      
      return items;
      
    } catch (error) {
      console.error(`[${this.name}] Error:`, error.message);
      console.log(`[${this.name}] Falling back to demo mode`);
      this.demoMode = true;
      return queries.map(q => this.generateDemoResult(q));
    }
  }

  generateDemoResult(query) {
    return {
      text: `DEMO: Results for "${query}". Top medical spas include Glow Med Spa with 4.8 stars.`,
      sources: [
        { url: 'https://example1.com', title: 'Source 1' },
        { url: 'https://example2.com', title: 'Source 2' }
      ],
      _demo: true
    };
  }

  async probe(clientData) {
    console.log(`\n🔍 [${this.name}] Probing: ${clientData.business_name}`);
    
    // 生成最小必要查询
    const queries = this.generateOptimizedQueries(clientData);
    console.log(`   Queries: ${queries.join(', ')}`);
    
    // 批量查询
    const batchResults = await this.batchQuery(queries);
    
    // 解析结果
    const results = {
      platform: 'perplexity',
      citations: [],
      brandMentioned: false,
      brandMentionCount: 0,
      sources: [],
      cost: batchResults.filter(r => !r.fromCache && !r.isDemo).length * COST_CONFIG.apifyCostPerQuery
    };

    for (const item of batchResults) {
      const text = item.text || '';
      const brandName = clientData.business_name;
      const brandMentioned = brandName ? 
        text.toLowerCase().includes(brandName.toLowerCase()) : false;
      
      const sources = (item.sources || []).map(s => ({
        url: s.url || '',
        title: s.title || '',
        isClient: brandName ? 
          (s.url || '').includes(brandName.toLowerCase().replace(/\s/g, '')) : false
      }));

      results.citations.push({
        query: item.query,
        text: text.substring(0, 300),
        brandMentioned,
        sources,
        fromCache: item.fromCache,
        isDemo: item.isDemo
      });

      if (brandMentioned) {
        results.brandMentioned = true;
        results.brandMentionCount++;
      }
      
      results.sources.push(...sources);
    }

    // 去重
    const seen = new Set();
    results.sources = results.sources.filter(s => {
      if (seen.has(s.url)) return false;
      seen.add(s.url);
      return true;
    });

    console.log(`   ✅ ${results.citations.length} citations, ${results.sources.length} sources`);
    console.log(`   💰 Cost: $${results.cost.toFixed(4)}`);
    
    return results;
  }

  generateOptimizedQueries(clientData) {
    const queries = [];
    const industry = clientData.industry || 'medical spa';
    const location = clientData.city || clientData.location || 'Houston';
    const businessName = clientData.business_name;
    
    // 优先级1: 行业+地点 (最重要)
    queries.push(`best ${industry} in ${location}`);
    
    // 优先级2: 品牌名+地点 (如果预算允许)
    if (businessName && queries.length < COST_CONFIG.maxQueriesPerClient) {
      queries.push(`${businessName} ${location}`);
    }
    
    return queries.slice(0, COST_CONFIG.maxQueriesPerClient);
  }
}

/**
 * 主探测服务
 */
class CostOptimizedProbingService {
  constructor() {
    this.probers = {
      perplexity: new CostOptimizedPerplexityProber()
    };
  }

  async probeClient(clientId) {
    await costTracker.load();
    
    console.log(`\n💰 Budget Status: $${costTracker.getStats().remaining} remaining today`);
    
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
        totalCost: 0
      }
    };

    // 只探测Perplexity (成本最低ROI最高)
    const prober = this.probers.perplexity;
    try {
      const platformResult = await prober.probe(client);
      results.platforms.perplexity = platformResult;
      results.summary.totalPlatforms++;
      
      if (platformResult.brandMentioned) {
        results.summary.brandMentionedOn.push('perplexity');
      }
      
      results.summary.citationsFound += platformResult.citations?.length || 0;
      results.summary.totalCost += platformResult.cost || 0;
      
    } catch (e) {
      console.error(`Probing failed:`, e.message);
      results.platforms.perplexity = { error: e.message };
    }

    await this.saveResults(results);
    await costTracker.save();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const stats = costTracker.getStats();
    
    console.log(`\n✅ Probe completed in ${duration}s`);
    console.log(`📊 Stats: ${stats.cacheHits} cache hits, ${stats.apifyCalls} API calls`);
    console.log(`💰 Total cost: $${results.summary.totalCost.toFixed(4)}`);
    console.log(`💰 Daily used: $${stats.dailyCost} / $${stats.dailyBudget}`);
    
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
        cost_usd: results.summary.totalCost,
        probed_at: results.timestamp
      });

    if (error) {
      console.error('Failed to save results:', error.message);
    }
  }
}

// CLI
const clientId = process.argv[2];

if (clientId === '--stats') {
  costTracker.load().then(() => {
    console.log('\n💰 Cost Statistics');
    console.log(JSON.stringify(costTracker.getStats(), null, 2));
  });
} else if (clientId) {
  const service = new CostOptimizedProbingService();
  service.probeClient(clientId).then(results => {
    console.log('\n📊 Final Results:');
    console.log(JSON.stringify(results, null, 2));
  }).catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  });
} else {
  console.log(`
Cost-Optimized AI Probing Service - 成本控制版

Cost: $${COST_CONFIG.apifyCostPerQuery}/query ($9/1000)
Daily Budget: $${COST_CONFIG.dailyBudgetUSD}
Cache TTL: ${COST_CONFIG.cacheTTLHours} hours

Usage:
  node ai-probing-service-cost.js [client_id]     # 探测单个客户
  node ai-probing-service-cost.js --stats         # 查看成本统计

Environment Variables:
  APIFY_TOKEN         - Apify API token (optional, demo mode if not set)
  SUPABASE_URL        - Supabase URL
  SUPABASE_SERVICE_KEY - Supabase Service Key
`);
}

export { CostOptimizedProbingService, CostOptimizedPerplexityProber };
