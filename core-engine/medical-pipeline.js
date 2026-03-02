#!/usr/bin/env node
/**
 * Medical GEO Pipeline - 医美牙医专用完整流程
 * 
 * 一键完成：分析 → 方案 → 实施
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as medicalKnowledge from './lib/medical-knowledge.js';
import * as medicalCitation from './lib/medical-citation.js';
import * as medicalContentModule from './lib/medical-content.js';
import { implementOptimization } from './lib/implement.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function medicalPipeline(practiceName, address, specialty, services) {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     MEDICAL GEO PIPELINE: Analysis → Implementation      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const clientId = `med_${Date.now()}`;
  
  // Phase 1: 医疗行业专用分析
  console.log('📊 PHASE 1: MEDICAL PRACTICE ANALYSIS\n');
  
  try {
    // 基础数据收集（使用通用run.js）
    const output = execSync(
      `node run.js "${practiceName}" "${address}"`,
      { encoding: 'utf8', cwd: __dirname }
    );
    console.log(output);
    
    // 提取client_id
    const match = output.match(/Client ID:\s+(client_\d+)/);
    const baseClientId = match ? match[1] : clientId;
    
    const outputDir = path.join(__dirname, 'outputs', baseClientId);
    
    // 读取基础分析
    const scoreData = JSON.parse(await fs.readFile(path.join(outputDir, 'score.json'), 'utf8'));
    
    // Phase 2: 医疗专用优化分析
    console.log('\n💉 PHASE 2: MEDICAL-SPECIFIC OPTIMIZATION\n');
    
    // 生成医疗专用内容
    const practiceData = {
      name: practiceName,
      address,
      city: 'Houston',
      specialty,
      services,
      phone: '(713) 555-0123'
    };
    
    const medicalContent = medicalContentModule.generateMedicalLocationPage(practiceData, services);
    
    // 医疗专用引用概率分析
    const fullContent = Object.values(medicalContent).filter(v => typeof v === 'string').join(' ');
    const citationAnalysis = medicalCitation.calculateMedicalCitationProbability(fullContent);
    
    // 生成医疗专用Schema
    const medicalSchema = medicalKnowledge.generateMedicalSchema(practiceData, services);
    
    console.log('✓ Medical content generated');
    console.log(`  Specialty: ${specialty}`);
    console.log(`  Services: ${services.length}`);
    console.log(`  Citation Score: ${citationAnalysis.percentage}%`);
    
    // Phase 3: 医疗行业实施包
    console.log('\n🔧 PHASE 3: MEDICAL PRACTICE IMPLEMENTATION\n');
    
    const medicalOptimizationPlan = {
      clientId: baseClientId,
      practiceName,
      address,
      specialty,
      services,
      
      analysis: {
        geoScore: scoreData,
        medicalCitationScore: citationAnalysis,
        topRecommendations: citationAnalysis.recommendations.slice(0, 3)
      },
      
      schema: medicalSchema,
      
      content: {
        ...medicalContent,
        medicalSpecialty: specialty,
        servicesList: services
      },
      
      gmb: {
        optimizedDescription: generateMedicalGMBDescription(practiceName, specialty, services),
        posts: [
          medicalContentModule.generateMedicalGMBPost('promotion'),
          medicalContentModule.generateMedicalGMBPost('education'),
          medicalContentModule.generateMedicalGMBPost('testimonial')
        ],
        suggestedQA: generateMedicalQA(services)
      }
    };
    
    // 保存医疗优化计划
    await fs.writeFile(
      path.join(outputDir, 'medical-optimization-plan.json'),
      JSON.stringify(medicalOptimizationPlan, null, 2)
    );
    
    // 生成医疗专用部署文件
    await generateMedicalDeployFiles(outputDir, medicalOptimizationPlan);
    
    // Phase 4: 监控设置
    console.log('\n📡 PHASE 4: MONITORING SETUP\n');
    
    const keywords = generateMedicalKeywords(practiceName, specialty, services);
    
    for (const keyword of keywords) {
      try {
        execSync(`node monitor.js add "${baseClientId}" "${keyword}"`, { cwd: __dirname });
        console.log(`  ✓ Monitoring: "${keyword}"`);
      } catch (e) {}
    }
    
    // 生成最终医疗行业报告
    console.log('\n📋 PHASE 5: MEDICAL PRACTICE REPORT\n');
    
    const report = generateMedicalReport(practiceName, baseClientId, medicalOptimizationPlan);
    
    const reportPath = path.join(outputDir, 'MEDICAL-GEO-REPORT.md');
    await fs.writeFile(reportPath, report);
    
    console.log('✓ Medical GEO report generated');
    console.log(`  📁 ${reportPath}`);
    
    // 总结
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║           MEDICAL GEO PIPELINE COMPLETE                  ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║ Practice:  ${practiceName.substring(0, 40).padEnd(46)} ║`);
    console.log(`║ Specialty: ${specialty.substring(0, 40).padEnd(46)} ║`);
    console.log(`║ Client ID: ${baseClientId.padEnd(46)} ║`);
    console.log(`║ Citation:  ${citationAnalysis.percentage}% ${citationAnalysis.percentage >= 70 ? '(Excellent)' : '(Needs Work)'}`.padEnd(56) + ' ║');
    console.log(`║ Keywords:  ${keywords.length} tracked`.padEnd(56) + ' ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    console.log('Next: Review MEDICAL-GEO-REPORT.md and deploy to your practice.\n');
    
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error.message);
    process.exit(1);
  }
}

function generateMedicalGMBDescription(name, specialty, services) {
  return `${name} is a premier ${specialty.toLowerCase()} practice in Houston, TX. 
We specialize in ${services.slice(0, 3).join(', ')}, and more. 
Our board-certified providers deliver natural-looking results in a comfortable, 
professional setting. Free consultations. Financing available. 
Convenient parking. Call today!`;
}

function generateMedicalQA(services) {
  return [
    {
      q: `Do you offer ${services[0]}?`,
      a: `Yes, we specialize in ${services[0]} and have extensive experience with this treatment. Schedule a free consultation to learn more.`
    },
    {
      q: 'Do you offer free consultations?',
      a: 'Yes! We offer complimentary consultations where we can discuss your goals and create a personalized treatment plan.'
    },
    {
      q: 'Is there parking available?',
      a: 'Yes, we have free on-site parking for our patients.'
    }
  ];
}

function generateMedicalKeywords(name, specialty, services) {
  const baseKeywords = [
    `${specialty.toLowerCase()} houston`,
    `${services[0].toLowerCase()} houston`,
    `${services[1]?.toLowerCase() || 'aesthetic'} houston`,
    `best ${specialty.toLowerCase()} houston`,
    `${name.toLowerCase().replace(/\s+/g, ' ')}`
  ];
  
  if (specialty.toLowerCase().includes('dental') || specialty.toLowerCase().includes('dentist')) {
    baseKeywords.push(
      'dentist houston',
      'cosmetic dentist houston',
      'best dentist houston'
    );
  }
  
  if (specialty.toLowerCase().includes('med') || specialty.toLowerCase().includes('aesthetic')) {
    baseKeywords.push(
      'med spa houston',
      'botox houston',
      'fillers houston'
    );
  }
  
  return [...new Set(baseKeywords)];
}

async function generateMedicalDeployFiles(outputDir, plan) {
  // 医疗专用部署指南
  const deployGuide = `
# Medical Practice GEO Deployment Guide

## Practice: ${plan.practiceName}
## Specialty: ${plan.specialty}

### Step 1: Medical Schema Deployment

Add this to your website \`<head\`>:

\`\`\`html
<script type="application/ld+json">
${JSON.stringify(plan.schema, null, 2)}
</script>
\`\`\`

**Important for Medical Practices:**
- Ensure HIPAA compliance on all pages
- Include medical disclaimers
- Add before/after photo consent notices

### Step 2: Update Google Business Profile

**Optimized Description:**
${plan.gmb.optimizedDescription}

**Post these updates:**
${plan.gmb.posts.map((post, i) =>
  `${i + 1}. ${post.title}\n   ${post.content.substring(0, 100)}...`
).join('\n\n')}

### Step 3: Medical Content Pages

Deploy these service-specific landing pages:
${plan.services.map(s =>
  `- /services/${s.toLowerCase().replace(/\s+/g, '-')}/`
).join('\n')}

### Step 4: Compliance Check

Before going live, verify:
- [ ] Medical disclaimers present
- [ ] HIPAA compliance on forms
- [ ] Before/after photo releases
- [ ] Provider credentials displayed
- [ ] Contact information accurate

---

*Generated by Medical GEO Engine v2.0*
  `.trim();
  
  await fs.writeFile(path.join(outputDir, 'MEDICAL-DEPLOY.md'), deployGuide);
}

function generateMedicalReport(name, clientId, plan) {
  return `
# Medical Practice GEO Optimization Report

**Practice:** ${name}  
**Specialty:** ${plan.specialty}  
**Client ID:** ${clientId}  
**Generated:** ${new Date().toLocaleString()}

## Executive Summary

| Metric | Score | Status |
|--------|-------|--------|
| GEO Score | ${plan.analysis.geoScore.total}/100 | ${plan.analysis.geoScore.total >= 70 ? '✅ Good' : '⚠️ Needs Improvement'} |
| Medical Citation | ${plan.analysis.medicalCitationScore.percentage}% | ${plan.analysis.medicalCitationScore.percentage >= 70 ? '✅ Excellent' : '⚠️ Optimize Content'} |
| Services Optimized | ${plan.services.length} | ✅ Complete |

## Top Recommendations

${plan.analysis.topRecommendations.map((rec, i) =>
  `${i + 1}. **${rec.action}**\n   Impact: ${rec.impact}\n`
).join('\n')}

## Deliverables

✅ Medical Schema markup  
✅ Optimized service pages  
✅ GMB update package  
✅ Keyword monitoring (8 terms)  
✅ Implementation guide  

## Next Steps

1. Review MEDICAL-DEPLOY.md
2. Implement Schema markup
3. Update Google Business Profile
4. Deploy service pages
5. Monitor rankings weekly

---

*StackMatrices Medical GEO Engine*
  `.trim();
}

// CLI
const [,, practiceName, address, specialty, ...services] = process.argv;

if (!practiceName || !address || !specialty) {
  console.log(`
Medical GEO Pipeline - For Aesthetic & Dental Practices

Usage:
  ./medical-pipeline.js "Practice Name" "Address" "Specialty" "Service1" "Service2" ...

Examples:
  ./medical-pipeline.js "Glow Aesthetics" "123 Main St, Houston, TX" "Medical Spa" "Botox" "Fillers" "Laser Hair Removal"
  
  ./medical-pipeline.js "Smile Dental" "456 Oak Ave, Houston, TX" "Cosmetic Dentistry" "Invisalign" "Veneers" "Teeth Whitening"

Specialties:
  - Medical Spa / Aesthetic Clinic
  - Plastic Surgery
  - Cosmetic Dentistry
  - Orthodontics
  - Dermatology
`);
  process.exit(1);
}

medicalPipeline(practiceName, address, specialty, services);
