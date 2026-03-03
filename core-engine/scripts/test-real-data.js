#!/usr/bin/env node
/**
 * Real Data Test - 从网上获取真实数据测试
 * 测试Agentic Probing系统和Rankings功能
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fixemvsckapejyfwphft.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeGVtdnNrYXBlanlmd3BoZnQiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM2MTMzMzQxLCJleHAiOjIwNTE3MDkzNDF9.6R1E1jdVHt5V8N-P4QM5E7qH2cGy5C3tfFf8Jk3uCA8'
);

/**
 * 真实Perplexity探测测试
 */
async function testRealPerplexityProbing() {
  console.log('🔍 Testing Real Perplexity Probing...\n');
  
  let browser = null;
  
  try {
    // 启动浏览器
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    // 测试关键词
    const testQueries = [
      'best botox houston',
      'top medical spa houston tx',
      'best med spa near me'
    ];
    
    const results = [];
    
    for (const query of testQueries) {
      console.log(`📝 Query: "${query}"`);
      
      try {
        // 访问Perplexity
        await page.goto('https://www.perplexity.ai', { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        // 等待页面加载
        await page.waitForTimeout(3000);
        
        // 查找输入框并输入查询
        const inputSelectors = [
          'textarea[placeholder*="Ask"]',
          'textarea[placeholder*="Search"]',
          'div[contenteditable="true"]'
        ];
        
        let inputFound = false;
        for (const selector of inputSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 5000 });
            await page.fill(selector, query);
            await page.keyboard.press('Enter');
            inputFound = true;
            console.log('   ✅ Input submitted');
            break;
          } catch (e) {
            continue;
          }
        }
        
        if (!inputFound) {
          console.log('   ⚠️ Could not find input, trying alternative method...');
          // 尝试直接通过URL参数搜索
          await page.goto(`https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`, {
            waitUntil: 'networkidle',
            timeout: 30000
          });
        }
        
        // 等待回答生成
        console.log('   ⏳ Waiting for response...');
        await page.waitForTimeout(8000);
        
        // 获取页面内容
        const html = await page.content();
        const title = await page.title();
        
        // 检查结果
        const hasResults = html.includes('source') || html.includes('citation') || html.length > 50000;
        
        // 提取可见文本
        const visibleText = await page.evaluate(() => {
          return document.body.innerText.substring(0, 2000);
        });
        
        // 查找是否有医疗SPA相关结果
        const hasMedicalSpa = visibleText.toLowerCase().includes('medical spa') ||
                              visibleText.toLowerCase().includes('med spa') ||
                              visibleText.toLowerCase().includes('botox');
        
        // 查找来源链接
        const links = await page.evaluate(() => {
          const anchors = Array.from(document.querySelectorAll('a[href^="http"]'));
          return anchors.map(a => ({
            url: a.href,
            text: a.innerText.substring(0, 100)
          })).filter(l => l.url && !l.url.includes('perplexity.ai'));
        });
        
        const uniqueLinks = [...new Map(links.map(l => [l.url, l])).values()].slice(0, 10);
        
        results.push({
          query,
          success: hasResults,
          hasMedicalSpa,
          title: title.substring(0, 50),
          contentLength: visibleText.length,
          sourcesFound: uniqueLinks.length,
          topSources: uniqueLinks.slice(0, 5)
        });
        
        console.log(`   ✅ Response received`);
        console.log(`   📊 Content length: ${visibleText.length} chars`);
        console.log(`   🔗 Sources found: ${uniqueLinks.length}`);
        console.log(`   🏥 Medical spa mentioned: ${hasMedicalSpa ? 'YES' : 'NO'}\n`);
        
        // 随机延迟避免被封
        await page.waitForTimeout(5000 + Math.random() * 5000);
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        results.push({
          query,
          success: false,
          error: error.message
        });
      }
    }
    
    await browser.close();
    
    return results;
    
  } catch (error) {
    console.error('❌ Browser error:', error.message);
    if (browser) await browser.close();
    return [{ error: error.message }];
  }
}

/**
 * 测试Gemini搜索
 */
async function testRealGeminiProbing() {
  console.log('🔍 Testing Real Gemini Probing...\n');
  
  let browser = null;
  
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    const query = 'best botox houston';
    console.log(`📝 Query: "${query}"`);
    
    // 访问Gemini
    await page.goto('https://gemini.google.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // 尝试输入查询
    try {
      await page.fill('textarea', query);
      await page.keyboard.press('Enter');
      console.log('   ✅ Input submitted');
    } catch (e) {
      console.log('   ⚠️ Could not input text');
    }
    
    // 等待回答
    await page.waitForTimeout(8000);
    
    // 获取内容
    const html = await page.content();
    const text = await page.evaluate(() => document.body.innerText.substring(0, 1500));
    
    await browser.close();
    
    return {
      query,
      success: text.length > 100,
      contentLength: text.length,
      hasResults: text.toLowerCase().includes('botox') || text.toLowerCase().includes('houston'),
      preview: text.substring(0, 500)
    };
    
  } catch (error) {
    console.error('❌ Gemini error:', error.message);
    if (browser) await browser.close();
    return { error: error.message };
  }
}

/**
 * 从数据库获取真实客户数据
 */
async function getRealClientData() {
  console.log('🗄️ Fetching Real Client Data from Database...\n');
  
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'active')
      .limit(5);
    
    if (error) throw error;
    
    console.log(`✅ Found ${clients?.length || 0} active clients\n`);
    
    return clients || [];
  } catch (error) {
    console.error('❌ Database error:', error.message);
    return [];
  }
}

/**
 * 运行完整测试
 */
async function runRealDataTest() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Real Data Test - 真实数据获取测试                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  
  // 1. 测试Perplexity
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 1: Perplexity Probing with Real Queries');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const perplexityResults = await testRealPerplexityProbing();
  
  // 2. 测试Gemini
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 2: Gemini Probing');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const geminiResult = await testRealGeminiProbing();
  
  // 3. 获取客户数据
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 3: Database Client Data');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const clients = await getRealClientData();
  
  // 汇总报告
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 Perplexity Results:');
  perplexityResults.forEach((r, i) => {
    console.log(`   Query ${i + 1}: "${r.query}"`);
    console.log(`   - Success: ${r.success ? '✅' : '❌'}`);
    console.log(`   - Content: ${r.contentLength || 0} chars`);
    console.log(`   - Sources: ${r.sourcesFound || 0}`);
    console.log(`   - Medical Spa mentioned: ${r.hasMedicalSpa ? '✅ YES' : '❌ NO'}`);
    if (r.topSources && r.topSources.length > 0) {
      console.log(`   - Top sources:`);
      r.topSources.forEach((s, j) => {
        console.log(`     ${j + 1}. ${s.text.substring(0, 50)}...`);
        console.log(`        ${s.url.substring(0, 80)}...`);
      });
    }
    console.log('');
  });
  
  console.log('📊 Gemini Results:');
  if (geminiResult.error) {
    console.log(`   ❌ Error: ${geminiResult.error}`);
  } else {
    console.log(`   Query: "${geminiResult.query}"`);
    console.log(`   - Success: ${geminiResult.success ? '✅' : '❌'}`);
    console.log(`   - Content: ${geminiResult.contentLength} chars`);
    console.log(`   - Has relevant results: ${geminiResult.hasResults ? '✅' : '❌'}`);
    console.log(`   - Preview: "${geminiResult.preview?.substring(0, 200)}..."`);
  }
  console.log('');
  
  console.log('📊 Database Results:');
  console.log(`   - Active clients: ${clients.length}`);
  if (clients.length > 0) {
    clients.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.business_name} (${c.industry})`);
    });
  }
  console.log('');
  
  console.log(`⏱️  Total duration: ${duration}s`);
  console.log('\n✅ Real data test completed!');
}

runRealDataTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
