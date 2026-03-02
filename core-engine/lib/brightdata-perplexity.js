/**
 * Bright Data Perplexity Scraper - 真实的Perplexity数据抓取
 * 
 * 使用Bright Data爬虫API获取真实的Perplexity搜索结果
 * 这是生产级GEO的核心
 * 
 * 成本: ~$5/1000次查询
 */

import fetch from 'node-fetch';

const BRIGHTDATA_API_TOKEN = process.env.BRIGHTDATA_API_TOKEN;
const BRIGHTDATA_ZONE = process.env.BRIGHTDATA_ZONE || 'perplexity_scraper';

/**
 * 抓取Perplexity搜索结果
 */
export async function scrapePerplexity(query, options = {}) {
  if (!BRIGHTDATA_API_TOKEN) {
    console.log('⚠️  BRIGHTDATA_API_TOKEN not set, using demo mode');
    return scrapePerplexityDemo(query, options);
  }
  
  console.log(`🔍 Scraping Perplexity for: "${query}"`);
  
  try {
    // Bright Data Web Unlocker + Perplexity
    const response = await fetch('https://api.brightdata.com/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BRIGHTDATA_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        zone: BRIGHTDATA_ZONE,
        url: `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`,
        format: 'raw',
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Bright Data API error: ${response.status}`);
    }
    
    const html = await response.text();
    
    // 解析Perplexity结果
    const result = parsePerplexityHTML(html, query);
    
    return result;
    
  } catch (error) {
    console.error('Perplexity scraping failed:', error.message);
    // 降级到Demo模式
    return scrapePerplexityDemo(query, options);
  }
}

/**
 * 解析Perplexity HTML
 */
function parsePerplexityHTML(html, query) {
  // 这是一个简化解析器
  // 实际生产环境需要更复杂的解析逻辑
  
  const result = {
    query,
    timestamp: new Date().toISOString(),
    answer: '',
    sources: [],
    relatedQuestions: []
  };
  
  try {
    // 提取回答文本 (简化版)
    const answerMatch = html.match(/<div[^>]*class="[^"]*prose[^"]*"[^>]*>(.*?)<\/div>/s);
    if (answerMatch) {
      result.answer = cleanHTML(answerMatch[1]).substring(0, 500);
    }
    
    // 提取来源链接
    const sourceMatches = html.matchAll(/<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>/g);
    for (const match of sourceMatches) {
      if (!result.sources.includes(match[1])) {
        result.sources.push(match[1]);
      }
    }
    
    // 提取相关问题
    const relatedMatch = html.match(/<div[^>]*class="[^"]*related[^"]*"[^>]*>(.*?)<\/div>/s);
    if (relatedMatch) {
      const questions = relatedMatch[1].match(/<a[^>]*>([^<]+)<\/a>/g);
      if (questions) {
        result.relatedQuestions = questions.map(q => cleanHTML(q)).slice(0, 5);
      }
    }
    
  } catch (e) {
    console.error('HTML parsing error:', e.message);
  }
  
  return result;
}

/**
 * Demo模式 - 模拟数据
 */
function scrapePerplexityDemo(query, options) {
  const clientWebsite = options.clientWebsite || 'example-clinic.com';
  
  // 根据查询类型生成不同的模拟结果
  const isMedicalQuery = /botox|filler|med spa|plastic surgeon/i.test(query);
  const isLocalQuery = /houston|near me|local/i.test(query);
  
  const demoResult = {
    query,
    timestamp: new Date().toISOString(),
    answer: generateDemoAnswer(query, isMedicalQuery, isLocalQuery),
    sources: generateDemoSources(clientWebsite, isLocalQuery),
    relatedQuestions: generateDemoRelatedQuestions(query),
    _demo: true
  };
  
  // 检查客户网站是否在来源中
  const clientMentioned = demoResult.sources.some(s => 
    s.url.includes(clientWebsite) || s.domain.includes(clientWebsite.replace('.com', ''))
  );
  
  demoResult.clientMentioned = clientMentioned;
  demoResult.clientRank = clientMentioned ? 
    demoResult.sources.findIndex(s => s.url.includes(clientWebsite)) + 1 : null;
  
  return demoResult;
}

function generateDemoAnswer(query, isMedical, isLocal) {
  if (isMedical && isLocal) {
    return `Based on my search, here are the top ${query.includes('botox') ? 'Botox' : 'medical spa'} providers in Houston:

The best providers typically have board-certified physicians, positive patient reviews, and offer comprehensive consultations. Prices range from $200-$600 per treatment area depending on the provider and specific treatment.

Key factors to consider:
- Board certification
- Years of experience
- Patient reviews and before/after photos
- Consultation process`;
  }
  
  return `Here is what I found about "${query}":

The most relevant information comes from authoritative medical sources and local business directories. Treatment effectiveness and safety depend on proper administration by qualified professionals.

For specific recommendations, consult with a board-certified provider in your area.`;
}

function generateDemoSources(clientWebsite, isLocal) {
  const sources = [
    { url: `https://${clientWebsite}/services`, domain: clientWebsite, title: 'Services - Our Clinic' },
    { url: 'https://www.realself.com/botox', domain: 'realself.com', title: 'Botox Reviews - RealSelf' },
    { url: 'https://www.healthline.com/health/botox', domain: 'healthline.com', title: 'Botox: Everything You Need to Know' },
    { url: 'https://www.webmd.com/beauty/cosmetic-procedures-botox', domain: 'webmd.com', title: 'Botox Injections: Uses, Side Effects & More' }
  ];
  
  if (isLocal) {
    sources.push({
      url: 'https://www.yelp.com/search?find_desc=med+spa&find_loc=Houston',
      domain: 'yelp.com',
      title: 'Top 10 Best Medical Spa in Houston'
    });
  }
  
  // 随机打乱顺序
  return sources.sort(() => Math.random() - 0.5);
}

function generateDemoRelatedQuestions(query) {
  const baseQuestions = [
    `How much does ${query} cost?`,
    `Is ${query} safe?`,
    `What are the side effects of ${query}?`,
    `How long does ${query} last?`,
    `Best ${query} providers near me`
  ];
  
  return baseQuestions;
}

function cleanHTML(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 批量查询Perplexity
 */
export async function batchScrapePerplexity(queries, options = {}) {
  console.log(`\n🔍 Batch scraping ${queries.length} queries...\n`);
  
  const results = [];
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`  [${i + 1}/${queries.length}] "${query}"`);
    
    const result = await scrapePerplexity(query, options);
    results.push(result);
    
    // 避免触发限流
    if (i < queries.length - 1) {
      await sleep(options.delayMs || 2000);
    }
  }
  
  return results;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 分析Perplexity结果
 */
export function analyzePerplexityResults(results, clientWebsite) {
  const analysis = {
    totalQueries: results.length,
    clientMentions: 0,
    asPrimarySource: 0,
    asSecondarySource: 0,
    notMentioned: 0,
    averageRank: 0,
    topQueries: [],
    missingQueries: []
  };
  
  let totalRank = 0;
  let rankCount = 0;
  
  for (const result of results) {
    if (result.clientMentioned) {
      analysis.clientMentions++;
      
      if (result.clientRank === 1) {
        analysis.asPrimarySource++;
      } else {
        analysis.asSecondarySource++;
      }
      
      totalRank += result.clientRank;
      rankCount++;
      
      analysis.topQueries.push({
        query: result.query,
        rank: result.clientRank
      });
    } else {
      analysis.notMentioned++;
      analysis.missingQueries.push(result.query);
    }
  }
  
  analysis.averageRank = rankCount > 0 ? (totalRank / rankCount).toFixed(1) : 'N/A';
  analysis.visibilityRate = ((analysis.clientMentions / results.length) * 100).toFixed(1);
  
  return analysis;
}

/**
 * CLI测试
 */
async function main() {
  const [,, query, clientWebsite] = process.argv;
  
  if (!query) {
    console.log(`
Bright Data Perplexity Scraper

Usage:
  node brightdata-perplexity.js "query" "client-website.com"

Example:
  node brightdata-perplexity.js "best botox houston" "glowmedspa.com"

Environment:
  BRIGHTDATA_API_TOKEN - Your Bright Data API token
  BRIGHTDATA_ZONE - Your scraping zone (default: perplexity_scraper)

Note: Without BRIGHTDATA_API_TOKEN, runs in demo mode.
`);
    process.exit(1);
  }
  
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     Bright Data Perplexity Scraper                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const result = await scrapePerplexity(query, { clientWebsite });
  
  console.log('\n📊 Result:');
  console.log(`  Query: ${result.query}`);
  console.log(`  Demo Mode: ${result._demo ? 'Yes' : 'No'}`);
  console.log(`  Client Mentioned: ${result.clientMentioned ? 'Yes' : 'No'}`);
  
  if (result.clientMentioned) {
    console.log(`  Client Rank: #${result.clientRank}`);
  }
  
  console.log('\n📚 Sources:');
  result.sources.forEach((s, i) => {
    const marker = s.url.includes(clientWebsite) ? ' 👈 CLIENT' : '';
    console.log(`  ${i + 1}. ${s.domain}${marker}`);
  });
  
  console.log('\n💬 Answer Preview:');
  console.log(result.answer.substring(0, 200) + '...');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default {
  scrapePerplexity,
  batchScrapePerplexity,
  analyzePerplexityResults
};
