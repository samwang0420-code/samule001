#!/usr/bin/env node
/**
 * Lead Crawler - Apify Google Maps Business Scraper
 * 爬取潜在客户数据并存储到Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 导入PDF服务
import { generateLeadPDF } from '../lib/pdf-service.js';

// 配置
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://fixemvsckapejyfwphft.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeGVtdnNja2FwZWp5ZndwaGZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkxNDczNSwiZXhwIjoyMDg3NDkwNzM1fQ.q_mgJQlae4B0AJMv9RziN2MzjVRKylG-06WIKFoG434'
);

const APIFY_TOKEN = process.env.APIFY_TOKEN || 'apify_api_cxCD9lkZ7l9pK3B_Lh2Bfm4wC3mKt43Ch4Q5';
const ACTOR_ID = 'xmiso_scrapers/millions-us-businesses-leads-with-emails-from-google-maps';

// 颜色输出
const log = {
  info: (msg) => console.log(`ℹ️ ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warn: (msg) => console.log(`⚠️ ${msg}`)
};

/**
 * 启动Apify Actor
 */
async function startApifyRun(searchConfig) {
  log.info('Starting Apify Actor...');
  
  const input = {
    search: searchConfig.search_keyword,
    location: searchConfig.location,
    maxLeads: searchConfig.max_leads || 10, // 测试用10条
    includeEmail: searchConfig.include_email !== false,
    includePhone: searchConfig.include_phone !== false,
    includeWebsite: searchConfig.include_website !== false
  };
  
  // 如果有坐标，添加地理限制
  if (searchConfig.lat && searchConfig.lng) {
    input.lat = searchConfig.lat;
    input.lng = searchConfig.lng;
    input.radius = searchConfig.radius_meters || 50000;
  }
  
  try {
    const response = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${APIFY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    });
    
    if (!response.ok) {
      throw new Error(`Apify API error: ${response.status} ${await response.text()}`);
    }
    
    const data = await response.json();
    log.success(`Actor run started: ${data.data.id}`);
    return data.data.id;
    
  } catch (error) {
    log.error(`Failed to start Apify: ${error.message}`);
    throw error;
  }
}

/**
 * 等待Actor运行完成
 */
async function waitForApifyRun(runId, timeout = 600000) { // 10分钟超时
  log.info(`Waiting for run ${runId} to complete...`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const response = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}`, {
      headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to check run status: ${response.status}`);
    }
    
    const data = await response.json();
    const status = data.data.status;
    
    if (status === 'SUCCEEDED') {
      log.success('Actor run completed successfully');
      return data.data;
    }
    
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Actor run ${status}: ${data.data.errorMessage || 'Unknown error'}`);
    }
    
    // 等待10秒再检查
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 10000));
  }
  
  throw new Error('Timeout waiting for Apify run');
}

/**
 * 获取爬取结果
 */
async function getApifyResults(runId) {
  log.info('Fetching results from Apify...');
  
  const response = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}/dataset/items`, {
    headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch results: ${response.status}`);
  }
  
  const data = await response.json();
  log.success(`Fetched ${data.length} leads from Apify`);
  return data;
}

/**
 * 转换Apify数据到数据库格式
 */
function convertApifyToLead(apifyData) {
  return {
    business_name: apifyData.name || apifyData.title,
    website: apifyData.website || apifyData.url,
    phone: apifyData.phone,
    email: apifyData.email,
    
    address: apifyData.address,
    city: apifyData.city,
    state: apifyData.state,
    zip_code: apifyData.zip,
    country: 'US',
    latitude: apifyData.latitude,
    longitude: apifyData.longitude,
    
    google_maps_url: apifyData.googleMapsUrl,
    google_maps_rating: apifyData.totalScore,
    google_maps_reviews_count: apifyData.reviewsCount,
    place_id: apifyData.placeId,
    
    category: apifyData.categoryName,
    subcategory: apifyData.subtitle,
    industry: detectIndustry(apifyData),
    
    status: 'new',
    priority: calculatePriority(apifyData),
    
    source_type: 'apify',
    source_actor: ACTOR_ID,
    source_query: `${apifyData.searchQuery || ''} in ${apifyData.locationQuery || ''}`,
    
    crawled_at: new Date().toISOString()
  };
}

/**
 * 检测行业
 */
function detectIndustry(data) {
  const category = (data.categoryName || '').toLowerCase();
  const name = (data.name || '').toLowerCase();
  
  if (category.includes('dentist') || category.includes('dental') || name.includes('dental')) {
    return 'dental';
  }
  if (category.includes('spa') || category.includes('beauty') || category.includes('medical spa')) {
    return 'medical_beauty';
  }
  if (category.includes('doctor') || category.includes('clinic') || category.includes('medical')) {
    return 'medical';
  }
  return 'other';
}

/**
 * 计算优先级
 */
function calculatePriority(data) {
  // 根据评分、评论数等计算优先级
  const rating = data.totalScore || 0;
  const reviews = data.reviewsCount || 0;
  const hasWebsite = data.website ? 1 : 0;
  
  let score = rating * 10 + Math.min(reviews, 100) + hasWebsite * 50;
  
  if (score >= 400) return 'critical';
  if (score >= 300) return 'high';
  if (score >= 200) return 'medium';
  return 'low';
}

/**
 * 保存leads到数据库
 */
async function saveLeadsToDatabase(leads, configId) {
  log.info(`Saving ${leads.length} leads to database...`);
  
  let inserted = 0;
  let duplicates = 0;
  
  for (const lead of leads) {
    try {
      // 检查重复（根据place_id或website）
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .or(`place_id.eq.${lead.place_id},website.eq.${lead.website}`)
        .limit(1);
      
      if (existing && existing.length > 0) {
        duplicates++;
        continue;
      }
      
      const { error } = await supabase
        .from('leads')
        .insert(lead);
      
      if (error) {
        log.error(`Failed to insert lead: ${error.message}`);
      } else {
        inserted++;
      }
    } catch (e) {
      log.error(`Error saving lead: ${e.message}`);
    }
  }
  
  log.success(`Saved ${inserted} new leads (${duplicates} duplicates skipped)`);
  return { inserted, duplicates };
}

/**
 * 生成PDF报告（调用knock-door-pdf skill）
async function analyzeLead(leadId) {
  // 这里应该调用我们的双维度评分系统
  // 简化版：生成随机分数（实际应该分析网站）
  
  const seoScore = Math.floor(Math.random() * 60) + 30; // 30-90
  const geoScore = Math.floor(Math.random() * 60) + 20; // 20-80
  const dualScore = Math.round((seoScore + geoScore) / 2);
  
  await supabase
    .from('leads')
    .update({
      seo_score: seoScore,
      geo_score: geoScore,
      dual_score: dualScore
    })
    .eq('id', leadId);
  
  return { seoScore, geoScore, dualScore };
}

/**
 * 主函数：执行爬取流程
 */
async function crawlLeads(configId, testMode = false) {
  const startTime = Date.now();
  
  try {
    // 1. 获取搜索配置
    const { data: config, error: configError } = await supabase
      .from('lead_search_configs')
      .select('*')
      .eq('id', configId)
      .single();
    
    if (configError || !config) {
      throw new Error(`Config not found: ${configError?.message}`);
    }
    
    log.info(`Starting crawl: ${config.name}`);
    log.info(`Search: ${config.search_keyword} in ${config.location}`);
    
    // 测试模式限制数量
    if (testMode) {
      config.max_leads = 10;
      log.warn('TEST MODE: Limited to 10 leads');
    }
    
    // 2. 创建爬取日志
    const { data: logEntry } = await supabase
      .from('lead_crawl_logs')
      .insert({
        config_id: configId,
        status: 'running'
      })
      .select()
      .single();
    
    // 3. 启动Apify
    const runId = await startApifyRun(config);
    
    // 更新日志
    await supabase
      .from('lead_crawl_logs')
      .update({ apify_run_id: runId })
      .eq('id', logEntry.id);
    
    // 4. 等待完成
    const runData = await waitForApifyRun(runId);
    
    // 5. 获取结果
    const results = await getApifyResults(runId);
    
    // 6. 转换并保存
    const leads = results.map(convertApifyToLead);
    const { inserted, duplicates } = await saveLeadsToDatabase(leads, configId);
    
    // 7. 分析并生成PDF
    log.info('Analyzing leads and generating PDFs...');
    let pdfsGenerated = 0;
    
    for (const lead of leads.slice(0, inserted)) {
      try {
        // 分析分数
        await analyzeLead(lead.id);
        
        // 重新获取lead数据（包含分数）
        const { data: leadData } = await supabase
          .from('leads')
          .select('*')
          .eq('id', lead.id)
          .single();
        
        // 生成PDF
        const pdfPath = await generateLeadPDF(
          leadData,
          path.join(__dirname, `../../outputs/${leadData.id}/reports`)
        );
        
        // 更新数据库
        await supabase
          .from('leads')
          .update({
            pdf_url: pdfPath,
            pdf_generated_at: new Date().toISOString(),
            status: 'pdf_generated'
          })
          .eq('id', lead.id);
        
        pdfsGenerated++;
        log.success(`PDF generated for ${lead.business_name}`);
      } catch (e) {
        log.error(`Failed to process lead ${lead.id}: ${e.message}`);
      }
    }
    
    // 8. 更新配置统计
    await supabase
      .from('lead_search_configs')
      .update({
        last_run_at: new Date().toISOString(),
        leads_found: (config.leads_found || 0) + inserted,
        pdfs_generated: (config.pdfs_generated || 0) + pdfsGenerated
      })
      .eq('id', configId);
    
    // 9. 完成日志
    const duration = Math.round((Date.now() - startTime) / 1000);
    await supabase
      .from('lead_crawl_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        leads_found: results.length,
        leads_inserted: inserted,
        pdfs_generated: pdfsGenerated
      })
      .eq('id', logEntry.id);
    
    log.success(`Crawl completed in ${duration}s`);
    log.success(`Found: ${results.length}, Inserted: ${inserted}, PDFs: ${pdfsGenerated}`);
    
    return {
      success: true,
      leadsFound: results.length,
      leadsInserted: inserted,
      pdfsGenerated,
      duration
    };
    
  } catch (error) {
    log.error(`Crawl failed: ${error.message}`);
    
    // 更新日志为失败
    await supabase
      .from('lead_crawl_logs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('config_id', configId)
      .is('completed_at', null);
    
    throw error;
  }
}

// CLI用法
const configId = process.argv[2];
const testMode = process.argv.includes('--test') || process.argv.includes('-t');

if (!configId) {
  console.log('Usage: node lead-crawler.js [config_id] [--test]');
  console.log('Example: node lead-crawler.js 123e4567-e89b-12d3-a456-426614174000 --test');
  process.exit(1);
}

crawlLeads(configId, testMode).then(result => {
  console.log('\n✅ Crawl finished:', result);
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Crawl failed:', error.message);
  process.exit(1);
});

export { crawlLeads, startApifyRun, waitForApifyRun };
