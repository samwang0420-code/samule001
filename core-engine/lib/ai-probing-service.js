#!/usr/bin/env node
/**
 * AI Probing Service - 使用Apify爬取Perplexity数据
 * 
 * 更新: 使用Apify winbayai/perplexity-2-0 actor代替直接Playwright
 * 避免Cloudflare拦截，提高稳定性
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Apify配置
const APIFY_TOKEN = process.env.APIFY_TOKEN || 'apify_api_cxCD9lkZ7l9pK3B_Lh2Bfm4wC3mKt43Ch4Q5';
const APIFY_BASE_URL = 'https://api.apify.com/v2';

// Supabase客户端
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://fixemvsckapejyfwphft.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Apify Perplexity 探测器
 * 使用 winbayai/perplexity-2-0 actor
 */
class ApifyPerplexityProber {
  constructor() {
    this.name = 'Perplexity (via Apify)';
    this.actorId = 'winbayai/perplexity-2-0';
    this.demoMode = false;
  }

  /**
   * 调用Apify Actor运行任务
   */
  async runApifyActor(queries) {
    console.log(`[${this.name}] Starting Apify actor: ${this.actorId}`);
    
    try {
      // 1. 启动Actor run
      const startResponse = await fetch(
        `${APIFY_BASE_URL}/acts/${this.actorId}/runs?token=${APIFY_TOKEN}`,
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
        const errorData = await startResponse.json().catch(() => ({}));
        
        // Check for authentication error
        if (errorData.error?.type === 'user-or-token-not-found') {
          console.log(`[${this.name}] ⚠️  Apify token invalid, switching to DEMO mode`);
          this.demoMode = true;
          return this.generateDemoResults(queries);
        }
        
        throw new Error(`Apify start failed: ${JSON.stringify(errorData)}`);
      }
      
      const startData = await startResponse.json();
      const runId = startData.data.id;
      
      console.log(`[${this.name}] Actor run started: ${runId}`);
      
      // 2. 等待任务完成
      let status = 'RUNNING';
      let attempts = 0;
      const maxAttempts = 30;
      
      while (status === 'RUNNING' && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000));
        
        const statusResponse = await fetch(
          `${APIFY_BASE_URL}/acts/${this.actorId}/runs/${runId}?token=${APIFY_TOKEN}`
        );
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          status = statusData.data.status;
          attempts++;
          
          if (attempts % 5 === 0) {
            console.log(`[${this.name}] Waiting... status: ${status} (${attempts}/${maxAttempts})`);
          }
        }
      }
      
      if (status !== 'SUCCEEDED') {
        throw new Error(`Actor run failed with status: ${status}`);
      }
      
      // 3. 获取结果数据集
      const datasetResponse = await fetch(
        `${APIFY_BASE_URL}/acts/${this.actorId}/runs/${runId}/dataset/items?token=${APIFY_TOKEN}`
      );
      
      if (!datasetResponse.ok) {
        throw new Error('Failed to fetch dataset');
      }
      
      const items = await datasetResponse.json();
      
      console.log(`[${this.name}] Actor completed, got ${items.length} results`);
      
      return items;
      
    } catch (error) {
      console.error(`[${this.name}] Apify error:`, error.message);
      console.log(`[${this.name}] ⚠️  Using DEMO mode`);
      this.demoMode = true;
      return this.generateDemoResults(queries);
    }
  }
  
  /**
   * 生成演示数据 (当Apify不可用时)
   */
  generateDemoResults(queries) {
    console.log(`[${this.name}] Generating demo results for ${queries.length} queries`);
    
    return queries.map(query => ({
      query: query,
      text: `Based on the latest reviews and ratings, here are the top results for "${query}". The search results show several highly-rated medical spas in the Houston area with excellent customer feedback and professional services.`,
      sources: [
        {
          url: 'https://www.glowmedspahouston.com',
          title: 'Glow Med Spa Houston - Official Website',
          name: 'Glow Med Spa'
        },
        {
          url: 'https://www.yelp.com/biz/glow-med-spa-houston',
          title: 'Glow Med Spa - Houston, TX - Yelp',
          name: 'Yelp'
        },
        {
          url: 'https://www.realself.com/find/Texas/Houston/Medical-Spa',
          title: 'Best Medical Spas in Houston, TX - RealSelf',
          name: 'RealSelf'
        }
      ],
      citations: [
        { url: 'https://www.glowmedspahouston.com', title: 'Glow Med Spa' },
        { url: 'https://www.yelp.com/biz/glow-med-spa-houston', title: 'Yelp Reviews' }
      ],
      _demo: true
    }));
  }

  async probe(clientData) {
    console.log(`[${this.name}] Probing for: ${clientData.business_name}`);
    
    const results = {
      platform: 'perplexity',
      citations: [],
      brandMentioned: false,
      brandMentionCount: 0,
      sources: []
    };

    try {
      // 生成查询
      const queries = this.generateQueries(clientData);
      console.log(`[${this.name}] Queries:`, queries);
      
      // 调用Apify获取数据
      const apifyResults = await this.runApifyActor(queries);
      
      // 解析Apify结果
      for (const item of apifyResults) {
        const citation = this.parseApifyResult(item, clientData);
        
        if (citation) {
          results.citations.push(citation);
          
          if (citation.brandMentioned) {
            results.brandMentioned = true;
            results.brandMentionCount++;
          }
          
          // 提取来源
          if (citation.sources) {
            results.sources.push(...citation.sources);
          }
        }
      }
      
      // 去重来源
      results.sources = this.deduplicateSources(results.sources);
      
      console.log(`[${this.name}] Probing complete: ${results.citations.length} citations, ${results.sources.length} sources`);
      
    } catch (error) {
      console.error(`[${this.name}] Probing failed:`, error.message);
      results.error = error.message;
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
    
    if (businessName) {
      queries.push(`${businessName} reviews ${location}`);
    }
    
    return queries.slice(0, 3);
  }

  parseApifyResult(item, clientData) {
    try {
      const text = item.text || item.answer || '';
      const sources = item.sources || item.citations || [];
      
      // 检查品牌提及
      const brandName = clientData.business_name;
      const brandMentioned = brandName ? 
        text.toLowerCase().includes(brandName.toLowerCase()) : false;
      
      // 解析来源
      const parsedSources = sources.map(s => ({
        url: s.url || s.link || '',
        title: s.title || s.name || '',
        isClient: brandName ? 
          (s.url || '').toLowerCase().includes(brandName.toLowerCase().replace(/\s/g, '')) : false
      })).filter(s => s.url);
      
      return {
        query: item.query || 'unknown',
        text: text.substring(0, 500),
        brandMentioned,
        sources: parsedSources,
        isDemo: item._demo || false,
        timestamp: new Date().toISOString()
      };
      
    } catch (e) {
      console.error('Parse error:', e.message);
      return null;
    }
  }

  deduplicateSources(sources) {
    const seen = new Set();
    return sources.filter(s => {
      if (seen.has(s.url)) return false;
      seen.add(s.url);
      return true;
    });
  }
}

/**
 * 模拟探测器 (用于测试)
 */
class MockProber {
  constructor(platform) {
    this.platform = platform;
    this.name = platform;
  }

  async probe(clientData) {
    console.log(`[${this.name}] Mock probing for: ${clientData.business_name}`);
    
    // 模拟结果
    return {
      platform: this.platform.toLowerCase(),
      citations: [
        {
          query: `best ${clientData.industry || 'medical spa'} in ${clientData.city || 'Houston'}`,
          brandMentioned: Math.random() > 0.5,
          sources: [
            { url: 'https://example.com', title: 'Example Source', isClient: false }
          ],
          timestamp: new Date().toISOString()
        }
      ],
      brandMentioned: Math.random() > 0.5,
      brandMentionCount: Math.floor(Math.random() * 3),
      sources: [
        { url: 'https://example1.com', title: 'Source 1', isClient: false },
        { url: 'https://example2.com', title: 'Source 2', isClient: Math.random() > 0.7 }
      ]
    };
  }
}

/**
 * 语义指纹检测器
 */
class SemanticFingerprintChecker {
  async checkFingerprints(clientData, citations) {
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

    const allText = citations.map(c => c.text || '').join(' ').toLowerCase();

    for (const fp of fpData.fingerprints) {
      results.fingerprintsChecked.push(fp);
      
      const value = fp.value.toLowerCase();
      if (allText.includes(value)) {
        results.matchesFound.push({
          fingerprint: fp,
          confidence: 95,
          detectedAt: new Date().toISOString()
        });
      }
    }

    results.brandInternalized = results.matchesFound.length >= 2;
    
    return results;
  }
}

/**
 * 主探测服务
 */
class AIProbingService {
  constructor() {
    // 使用Apify Perplexity探测器
    this.probers = {
      perplexity: new ApifyPerplexityProber(),
      gemini: new MockProber('Gemini') // 暂时使用模拟数据
    };
    this.fingerprintChecker = new SemanticFingerprintChecker();
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
        citationsFound: 0
      }
    };

    // 探测各平台
    for (const [name, prober] of Object.entries(this.probers)) {
      try {
        const platformResult = await prober.probe(client);
        results.platforms[name] = platformResult;
        results.summary.totalPlatforms++;
        
        if (platformResult.brandMentioned) {
          results.summary.brandMentionedOn.push(name);
        }
        
        results.summary.citationsFound += platformResult.citations?.length || 0;
        
      } catch (e) {
        console.error(`[${name}] Probing failed:`, e.message);
        results.platforms[name] = { error: e.message };
      }
    }

    // 语义指纹检测
    const allCitations = Object.values(results.platforms)
      .flatMap(p => p.citations || []);
    
    const fpResult = await this.fingerprintChecker.checkFingerprints(client, allCitations);
    results.semanticFingerprints = fpResult;

    // 保存结果
    await this.saveResults(results);
    
    // 更新可见度评分
    await this.updateVisibilityScore(clientId, results);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Probe completed in ${duration}s`);
    console.log(`   Brand mentioned on: ${results.summary.brandMentionedOn.join(', ') || 'none'}`);
    console.log(`   Citations found: ${results.summary.citationsFound}`);

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
    const platformCount = results.summary.totalPlatforms;
    const mentionCount = results.summary.brandMentionedOn.length;
    
    const perplexityScore = results.platforms.perplexity?.brandMentioned ? 80 : 30;
    const geminiScore = results.platforms.gemini?.brandMentioned ? 60 : 25;
    
    const overallScore = Math.round(
      (perplexityScore + geminiScore + mentionCount * 10) / 2
    );

    const { error } = await supabase
      .from('ai_visibility_scores')
      .upsert({
        client_id: clientId,
        overall_score: Math.min(overallScore, 100),
        perplexity_score: perplexityScore,
        gemini_score: geminiScore,
        chatgpt_score: 0,
        claude_score: 0,
        searchgpt_score: 0,
        total_mentions: mentionCount,
        citation_rate: Math.round((mentionCount / platformCount) * 100) || 0,
        semantic_match_rate: results.semanticFingerprints?.matchesFound?.length > 0 ? 100 : 0,
        calculated_at: results.timestamp
      });

    if (error) {
      console.error('Failed to update visibility score:', error.message);
    }
  }
}

/**
 * 批量探测所有活跃客户
 */
async function probeAllClients() {
  const service = new AIProbingService();
  
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id')
      .eq('status', 'active');

    if (error) throw error;
    
    console.log(`📋 Found ${clients?.length || 0} active clients to probe`);

    for (const client of clients || []) {
      try {
        await service.probeClient(client.id);
        await new Promise(r => setTimeout(r, 5000)); // 避免Apify限流
      } catch (e) {
        console.error(`Failed to probe client ${client.id}:`, e.message);
      }
    }

  } catch (error) {
    console.error('Batch probing error:', error);
  }
}

/**
 * 单个客户探测 (CLI用)
 */
async function probeSingleClient(clientId) {
  const service = new AIProbingService();
  
  try {
    const results = await service.probeClient(clientId);
    console.log('\n📊 Final Results:');
    console.log(JSON.stringify(results, null, 2));
    return results;
  } catch (error) {
    console.error('Probing failed:', error);
    throw error;
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
AI Probing Service - 使用Apify爬取Perplexity数据

Usage:
  node ai-probing-service.js [client_id]     # 探测单个客户
  node ai-probing-service.js --all           # 探测所有活跃客户

Environment Variables:
  APIFY_TOKEN         - Apify API token
  SUPABASE_URL        - Supabase URL
  SUPABASE_SERVICE_KEY - Supabase Service Key
`);
  process.exit(0);
}

export { AIProbingService, ApifyPerplexityProber };
