#!/usr/bin/env node
/**
 * Test Apify Perplexity Actor - 测试Apify Perplexity爬取
 */

const APIFY_TOKEN = process.env.APIFY_TOKEN || 'apify_api_cxCD9lkZ7l9pK3B_Lh2Bfm4wC3mKt43Ch4Q5';
const APIFY_BASE_URL = 'https://api.apify.com/v2';

async function testApifyPerplexity() {
  console.log('🧪 Testing Apify Perplexity Actor...\n');
  
  const queries = [
    'best botox houston',
    'top medical spa houston tx'
  ];
  
  try {
    console.log('1. Starting Apify actor: winbayai/perplexity-2-0');
    console.log(`   Queries: ${queries.join(', ')}\n`);
    
    // 1. 启动Actor
    const startResponse = await fetch(
      `${APIFY_BASE_URL}/acts/winbayai~perplexity-2-0/runs?token=${APIFY_TOKEN}`,
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
      const error = await startResponse.text();
      console.error(`❌ Failed to start actor: ${error}`);
      return;
    }
    
    const startData = await startResponse.json();
    const runId = startData.data.id;
    
    console.log(`✅ Actor run started: ${runId}\n`);
    
    // 2. 等待完成
    console.log('2. Waiting for actor to complete...');
    let status = 'RUNNING';
    let attempts = 0;
    
    while (status === 'RUNNING' && attempts < 30) {
      await new Promise(r => setTimeout(r, 3000));
      
      const statusResponse = await fetch(
        `${APIFY_BASE_URL}/acts/winbayai~perplexity-2-0/runs/${runId}?token=${APIFY_TOKEN}`
      );
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        status = statusData.data.status;
        attempts++;
        
        if (attempts % 3 === 0) {
          console.log(`   Status: ${status} (${attempts}/30)`);
        }
      }
    }
    
    if (status !== 'SUCCEEDED') {
      console.error(`\n❌ Actor run failed with status: ${status}`);
      return;
    }
    
    console.log(`\n✅ Actor completed successfully!\n`);
    
    // 3. 获取结果
    console.log('3. Fetching results...\n');
    const datasetResponse = await fetch(
      `${APIFY_BASE_URL}/acts/winbayai~perplexity-2-0/runs/${runId}/dataset/items?token=${APIFY_TOKEN}`
    );
    
    if (!datasetResponse.ok) {
      console.error('❌ Failed to fetch dataset');
      return;
    }
    
    const items = await datasetResponse.json();
    
    console.log(`✅ Got ${items.length} results:\n`);
    
    items.forEach((item, i) => {
      console.log(`--- Result ${i + 1} ---`);
      console.log(`Query: ${item.query || 'N/A'}`);
      console.log(`Answer: ${(item.text || item.answer || 'N/A').substring(0, 300)}...`);
      
      if (item.sources && item.sources.length > 0) {
        console.log(`Sources (${item.sources.length}):`);
        item.sources.slice(0, 3).forEach((s, j) => {
          console.log(`  ${j + 1}. ${s.title || 'N/A'} - ${s.url || 'N/A'}`);
        });
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testApifyPerplexity();
