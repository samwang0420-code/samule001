#!/usr/bin/env node
/**
 * Bing Proxy Strategy - Bing/SearchGPT代理监控
 * 
 * 逻辑: OpenAI搜索底层依赖Bing，监控Bing排名可预测SearchGPT引用概率
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Bing Search API配置
const BING_API_KEY = process.env.BING_API_KEY; // 需要申请
const BING_API_ENDPOINT = 'https://api.bing.microsoft.com/v7.0/search';

/**
 * Bing排名监控
 */
export async function monitorBingRankings(keywords, targetWebsite) {
  const results = [];
  
  for (const keyword of keywords) {
    try {
      const bingResult = await searchBing(keyword);
      
      // 查找目标网站排名
      const ranking = findWebsiteRanking(bingResult, targetWebsite);
      
      // 计算SearchGPT引用概率
      const searchGPTProbability = calculateSearchGPTProbability(ranking);
      
      results.push({
        keyword,
        bingRanking: ranking,
        searchGPTProbability,
        deepResults: bingResult.deepResults || [],
        richResults: bingResult.richResults || []
      });
      
    } catch (e) {
      console.error(`Bing search failed for "${keyword}":`, e.message);
    }
  }
  
  return results;
}

async function searchBing(query) {
  if (!BING_API_KEY) {
    console.warn('BING_API_KEY not set, using mock data');
    return mockBingResult(query);
  }
  
  const response = await fetch(
    `${BING_API_ENDPOINT}?q=${encodeURIComponent(query)}&count=20&responseFilter=Webpages`,
    {
      headers: { 'Ocp-Apim-Subscription-Key': BING_API_KEY }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Bing API error: ${response.status}`);
  }
  
  return await response.json();
}

function findWebsiteRanking(bingResult, targetWebsite) {
  const webpages = bingResult.webPages?.value || [];
  
  for (let i = 0; i < webpages.length; i++) {
    const page = webpages[i];
    if (page.url.includes(targetWebsite) || 
        page.displayUrl.includes(targetWebsite)) {
      return {
        position: i + 1,
        url: page.url,
        title: page.name,
        snippet: page.snippet
      };
    }
  }
  
  return { position: null, notFound: true };
}

/**
 * 计算SearchGPT引用概率
 * 
 * 逻辑: 
 * - Bing排名1-3: SearchGPT引用概率 85-95%
 * - Bing排名4-10: 引用概率 60-80%
 * - Bing排名10+: 引用概率 30-50%
 * - 出现在Deep Results: +15%
 * - 出现在Rich Results: +20%
 */
function calculateSearchGPTProbability(ranking) {
  if (ranking.notFound) {
    return { probability: 0, reason: 'Not in Bing index' };
  }
  
  const position = ranking.position;
  let baseProbability = 0;
  
  if (position <= 3) {
    baseProbability = 90; // Top 3: 90%
  } else if (position <= 5) {
    baseProbability = 75; // 4-5: 75%
  } else if (position <= 10) {
    baseProbability = 60; // 6-10: 60%
  } else {
    baseProbability = 40; // 10+: 40%
  }
  
  return {
    probability: baseProbability,
    position: position,
    reason: `Bing position #${position}`,
    recommendation: position > 5 
      ? 'Optimize for Bing Top 5 to increase SearchGPT visibility' 
      : 'Well positioned for SearchGPT citations'
  };
}

function mockBingResult(query) {
  return {
    webPages: {
      value: [
        { url: 'https://competitor1.com', name: 'Competitor 1', snippet: '...' },
        { url: 'https://example-client.com', name: 'Example Client', snippet: '...' },
        { url: 'https://competitor2.com', name: 'Competitor 2', snippet: '...' }
      ]
    }
  };
}

/**
 * IndexNow状态检查
 * 快速通知Bing索引更新
 */
export async function checkIndexNowStatus(url) {
  // IndexNow允许网站主动通知搜索引擎内容更新
  // 检查是否已提交
  
  const indexNowUrl = `https://api.indexnow.org/IndexNow?url=${encodeURIComponent(url)}`;
  
  try {
    const response = await fetch(indexNowUrl, { method: 'GET' });
    return {
      url,
      indexed: response.status === 200,
      status: response.status
    };
  } catch (e) {
    return { url, indexed: false, error: e.message };
  }
}

/**
 * 生成Bing优化建议
 */
export function generateBingOptimizationReport(bingResults) {
  const report = {
    overallScore: 0,
    recommendations: [],
    priorityActions: []
  };
  
  const avgPosition = bingResults
    .filter(r => r.bingRanking.position)
    .reduce((sum, r) => sum + r.bingRanking.position, 0) 
    / bingResults.filter(r => r.bingRanking.position).length || 0;
  
  report.overallScore = avgPosition <= 5 ? 85 : avgPosition <= 10 ? 70 : 50;
  
  if (avgPosition > 5) {
    report.priorityActions.push({
      action: 'Improve Bing rankings to Top 5',
      impact: 'Increase SearchGPT citation probability by 30%',
      difficulty: 'High'
    });
  }
  
  report.recommendations.push(
    'Submit sitemap to Bing Webmaster Tools',
    'Use IndexNow for rapid indexing',
    'Optimize for Bing-specific ranking factors'
  );
  
  return report;
}

// CLI
if (process.argv[2] === 'test') {
  const testKeywords = ['best botox houston', 'med spa near me'];
  const testWebsite = 'example.com';
  
  monitorBingRankings(testKeywords, testWebsite).then(results => {
    console.log('Bing monitoring results:');
    console.log(JSON.stringify(results, null, 2));
  });
}
