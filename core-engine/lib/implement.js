/**
 * Implementation Engine - 自动执行优化
 * 
 * 将分析结果自动实施到客户资产
 * 包括: GMB更新, Schema部署, 内容发布
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 执行完整的优化方案
 */
export async function implementOptimization(clientId, optimizationPlan) {
  console.log(`🔧 Implementing optimization for ${clientId}...\n`);
  
  const results = {
    clientId,
    startedAt: new Date().toISOString(),
    steps: []
  };
  
  // Step 1: 部署Schema到客户网站
  if (optimizationPlan.schema) {
    const schemaResult = await deploySchema(clientId, optimizationPlan.schema);
    results.steps.push({ step: 'schema_deploy', ...schemaResult });
  }
  
  // Step 2: 生成并部署优化内容
  if (optimizationPlan.content) {
    const contentResult = await deployContent(clientId, optimizationPlan.content);
    results.steps.push({ step: 'content_deploy', ...contentResult });
  }
  
  // Step 3: 更新Google Business Profile
  if (optimizationPlan.gmb) {
    const gmbResult = await updateGMB(clientId, optimizationPlan.gmb);
    results.steps.push({ step: 'gmb_update', ...gmbResult });
  }
  
  // Step 4: 提交搜索引擎索引
  if (optimizationPlan.indexing) {
    const indexResult = await submitToSearchEngines(clientId, optimizationPlan.indexing);
    results.steps.push({ step: 'indexing', ...indexResult });
  }
  
  results.completedAt = new Date().toISOString();
  results.success = results.steps.every(s => s.success);
  
  // 保存实施记录
  await saveImplementationRecord(results);
  
  return results;
}

/**
 * 部署Schema到客户网站
 */
async function deploySchema(clientId, schemaData) {
  console.log('📋 Step 1: Deploying Schema markup...');
  
  // 生成部署包
  const deploymentPackage = {
    schema: schemaData,
    instructions: `
## Schema Deployment Instructions

### Option 1: Manual Deployment (Recommended for most sites)

1. Copy the following code to your website's \`<head\`> section:

\`\`\`html
<script type="application/ld+json">
${JSON.stringify(schemaData, null, 2)}
</script>
\`\`\`

2. Place it on your homepage and contact page

3. Test with Google's Rich Results Test:
   https://search.google.com/test/rich-results

### Option 2: WordPress (if applicable)

Install "Schema Pro" or "Rank Math SEO" plugin and import this JSON.

### Option 3: Custom CMS

Provide this JSON to your web developer for implementation.
    `.trim()
  };
  
  // 保存部署包
  const deployPath = path.join(__dirname, '../outputs', clientId, 'schema-deployment.md');
  await fs.mkdir(path.dirname(deployPath), { recursive: true });
  await fs.writeFile(deployPath, deploymentPackage.instructions);
  
  console.log('   ✓ Schema deployment package created');
  console.log(`   📁 Saved to: ${deployPath}`);
  
  // TODO: 如果有API权限，直接推送到客户网站
  // 这需要客户网站有API端点或Webhook支持
  
  return {
    success: true,
    method: 'manual_deployment',
    outputPath: deployPath,
    notes: 'Schema markup ready for deployment. Manual implementation required.'
  };
}

/**
 * 部署优化内容
 */
async function deployContent(clientId, contentData) {
  console.log('📝 Step 2: Deploying optimized content...');
  
  // 生成完整的Location页面
  const locationPageHTML = generateLocationPageHTML(contentData);
  
  // 保存为可部署文件
  const contentPath = path.join(__dirname, '../outputs', clientId, 'location-page.html');
  await fs.writeFile(contentPath, locationPageHTML);
  
  console.log('   ✓ Location page generated');
  console.log(`   📁 Saved to: ${contentPath}`);
  
  // 生成部署指南
  const deployGuide = `
## Content Deployment Guide

### Location Page

A complete, SEO-optimized location page has been generated for your law firm.

**File:** location-page.html

**To deploy:**

1. **Option A: Create New Page**
   - Create a new page on your website: /houston-immigration-lawyer/
   - Copy the content from location-page.html
   - Publish the page

2. **Option B: Update Existing Page**
   - Replace your current location/service page content
   - Keep the same URL to preserve SEO value
   - Add 301 redirects if changing URL

**Important:**
- Keep the Schema markup in the \`<head\`>
- Ensure the page is linked from your main navigation
- Submit the new URL to Google Search Console for indexing

### GMB Posts

5 ready-to-post GMB updates have been generated in content-package.json
Copy and paste these into your Google Business Profile.
  `.trim();
  
  const guidePath = path.join(__dirname, '../outputs', clientId, 'content-deployment.md');
  await fs.writeFile(guidePath, deployGuide);
  
  return {
    success: true,
    files: ['location-page.html', 'content-deployment.md'],
    notes: 'Content ready for deployment. Manual upload required.'
  };
}

function generateLocationPageHTML(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title || 'Immigration Lawyer'}</title>
    <meta name="description" content="${content.metaDescription || ''}">
    
    <!-- Schema Markup -->
    <script type="application/ld+json">
${JSON.stringify(content.schema, null, 2)}
    </script>
</head>
<body>
    <article>
${content.hero ? `<header><h1>${content.hero.split('\n')[0]}</h1></header>` : ''}
        
${content.introduction ? `<section>${content.introduction.replace(/\n/g, '\n        ')}</section>` : ''}
        
${content.services ? `<section>${content.services.replace(/\n/g, '\n        ')}</section>` : ''}
        
${content.faq ? `<section>${content.faq.replace(/\n/g, '\n        ')}</section>` : ''}
    </article>
</body>
</html>`;
}

/**
 * 更新Google Business Profile
 */
async function updateGMB(clientId, gmbData) {
  console.log('📍 Step 3: Preparing GMB updates...');
  
  // GMB API需要OAuth认证，这里生成更新清单
  const gmbUpdatePackage = {
    description: {
      current: gmbData.currentDescription || '',
      recommended: gmbData.optimizedDescription || '',
      changes: 'Added parking information, service details, and keywords'
    },
    posts: gmbData.posts || [],
    qanda: gmbData.suggestedQA || [],
    attributes: {
      add: ['Parking: Free on-site parking available', 'Languages: English, Spanish'],
      update: gmbData.attributeUpdates || {}
    }
  };
  
  // 保存GMB更新包
  const gmbPath = path.join(__dirname, '../outputs', clientId, 'gmb-updates.json');
  await fs.writeFile(gmbPath, JSON.stringify(gmbUpdatePackage, null, 2));
  
  // 生成GMB更新指南
  const gmbGuide = `
## Google Business Profile Update Guide

### 1. Update Business Description

**Current:** ${gmbUpdatePackage.description.current}

**Recommended:**
${gmbUpdatePackage.description.recommended}

**To update:**
1. Go to https://business.google.com
2. Select your business
3. Click "Info" in left menu
4. Edit "Description"
5. Paste the recommended text
6. Save

### 2. Add GMB Posts

${gmbUpdatePackage.posts.map((post, i) =>
  `${i + 1}. **${post.title}**\n   ${post.content}\n   CTA: ${post.cta}\n`
).join('\n')}

**To post:**
1. In GMB dashboard, click "Posts"
2. Click "Add update"
3. Copy content from above
4. Add relevant photo
5. Publish

### 3. Add Q&A

Pre-populate common questions:

${gmbUpdatePackage.qanda.map(qa =
  `**Q:** ${qa.question}\n**A:** ${qa.answer}\n`
).join('\n')}

**To add:**
1. In GMB dashboard, go to "Q&A" tab
2. Click "Add question" (ask as customer)
3. Then answer as business owner

### 4. Update Business Attributes

Add/Update:
${Object.entries(gmbUpdatePackage.attributes.add || {}).map(([k, v]) =>
  `- ${k}: ${v}`
).join('\n')}

**To update:**
1. In GMB "Info" tab
2. Scroll to "Attributes"
3. Add missing attributes
4. Save
  `.trim();
  
  const guidePath = path.join(__dirname, '../outputs', clientId, 'gmb-update-guide.md');
  await fs.writeFile(guidePath, gmbGuide);
  
  console.log('   ✓ GMB update package created');
  console.log(`   📁 Updates saved to: ${gmbPath}`);
  console.log(`   📖 Guide saved to: ${guidePath}`);
  
  return {
    success: true,
    files: ['gmb-updates.json', 'gmb-update-guide.md'],
    notes: 'GMB updates prepared. Manual implementation in Google Business Profile required.'
  };
}

/**
 * 提交到搜索引擎索引
 */
async function submitToSearchEngines(clientId, urls) {
  console.log('🔍 Step 4: Preparing indexing submissions...');
  
  // 生成索引提交脚本
  const indexingScript = `
## Search Engine Indexing

### Google Search Console

**Manual URL Submission:**
1. Go to https://search.google.com/search-console
2. Select your property
3. Go to "URL Inspection" tool
4. Enter each URL and click "Request Indexing"

**URLs to submit:**
${urls.map(url => `- ${url}`).join('\n')}

**Sitemap Update:**
Ensure your sitemap.xml includes:
${urls.map(url => `  <url><loc>${url}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>`).join('\n')}

### Bing Webmaster Tools

1. Go to https://www.bing.com/webmasters
2. Submit URLs via "URL Submission" tool
3. Or update sitemap

### Immediate Actions

Run this curl command for each URL (requires GSC API access):
\`\`\`bash
# Requires OAuth2 token from GSC API
curl -X POST \\
  'https://indexing.googleapis.com/v3/urlNotifications:publish' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -d '{
    "url": "${urls[0] || 'https://example.com/page'}",
    "type": "URL_UPDATED"
  }'
\`\`\`
  `.trim();
  
  const indexPath = path.join(__dirname, '../outputs', clientId, 'indexing-guide.md');
  await fs.writeFile(indexPath, indexingScript);
  
  console.log('   ✓ Indexing guide created');
  console.log(`   📁 Saved to: ${indexPath}`);
  
  return {
    success: true,
    files: ['indexing-guide.md'],
    notes: 'Indexing instructions prepared. Manual submission to Search Console required.'
  };
}

/**
 * 保存实施记录
 */
async function saveImplementationRecord(results) {
  const recordPath = path.join(__dirname, '../data', 'implementations.json');
  
  let data = { implementations: [] };
  try {
    const content = await fs.readFile(recordPath, 'utf8');
    data = JSON.parse(content);
  } catch (e) {}
  
  data.implementations.push(results);
  
  // 只保留最近100条
  data.implementations = data.implementations.slice(-100);
  
  await fs.mkdir(path.dirname(recordPath), { recursive: true });
  await fs.writeFile(recordPath, JSON.stringify(data, null, 2));
}

/**
 * 获取实施历史
 */
export async function getImplementationHistory(clientId) {
  try {
    const recordPath = path.join(__dirname, '../data', 'implementations.json');
    const content = await fs.readFile(recordPath, 'utf8');
    const data = JSON.parse(content);
    
    return data.implementations.filter(i => i.clientId === clientId);
  } catch (e) {
    return [];
  }
}

// CLI
async function main() {
  const [,, command, clientId] = process.argv;
  
  if (command === 'run' && clientId) {
    // 读取该客户的优化计划
    const planPath = path.join(__dirname, '../outputs', clientId, 'optimization-plan.json');
    
    try {
      const plan = JSON.parse(await fs.readFile(planPath, 'utf8'));
      const results = await implementOptimization(clientId, plan);
      
      console.log('\n✅ Implementation Complete');
      console.log('==========================');
      console.log(`Client: ${results.clientId}`);
      console.log(`Success: ${results.success}`);
      console.log(`Steps completed: ${results.steps.length}`);
      
      results.steps.forEach(step => {
        console.log(`  ${step.success ? '✓' : '✗'} ${step.step}: ${step.notes}`);
      });
      
    } catch (e) {
      console.error('Error:', e.message);
      console.log(`\nMake sure optimization plan exists: ${planPath}`);
    }
  } else {
    console.log(`
Implementation Engine - 自动执行优化

Usage:
  node implement.js run "client_id"

This will execute the optimization plan for the specified client.
`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default {
  implementOptimization,
  getImplementationHistory
};
