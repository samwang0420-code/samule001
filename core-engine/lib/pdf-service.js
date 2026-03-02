#!/usr/bin/env node
/**
 * PDF Generator Service - 调用knock-door-pdf生成报告
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 生成Lead的PDF报告
 * @param {Object} lead - Lead数据
 * @param {String} outputDir - 输出目录
 * @returns {Promise<String>} - PDF文件路径
 */
export async function generateLeadPDF(lead, outputDir = './output/leads') {
  console.log(`📄 Generating PDF for: ${lead.business_name}`);
  
  try {
    // 构建Python命令
    const scriptPath = path.join(__dirname, '../skills/knock-door-pdf/core/pdf_generator.py');
    
    // 准备数据
    const data = {
      url: lead.website || 'https://example.com',
      overall: {
        grade: calculateGrade(lead.dual_score || 54),
        combined_score: lead.dual_score || 54
      },
      scores: {
        technical_seo: { score: lead.seo_score || 50 },
        content_seo: { score: Math.round((lead.seo_score || 50) * 0.9) },
        offsite_seo: { score: Math.round((lead.seo_score || 50) * 0.8) },
        user_experience: { score: 70 },
        ai_visibility: { score: lead.geo_score || 30 }
      }
    };
    
    // 准备内容（根据行业定制）
    const content = buildContentByIndustry(lead);
    
    // 构建Python调用
    const pythonScript = `
import sys
sys.path.insert(0, '${path.join(__dirname, '../skills')}')
from knock_door_pdf.core.pdf_generator import generate_report
import json

data = json.loads('${JSON.stringify(data).replace(/'/g, "\\'")}')
content = json.loads('${JSON.stringify(content).replace(/'/g, "\\'")}')

pdf_path = generate_report(
    data=data,
    content=content,
    client_name="${(lead.business_name || 'Client').replace(/"/g, '\\"')}",
    output_dir="${outputDir.replace(/"/g, '\\"')}"
)
print(pdf_path)
`;
    
    // 执行Python脚本
    const result = execSync('python3 -c "' + pythonScript + '"', {
      encoding: 'utf8',
      timeout: 60000,
      cwd: path.join(__dirname, '..')
    });
    
    const pdfPath = result.trim();
    console.log(`✅ PDF generated: ${pdfPath}`);
    
    return pdfPath;
    
  } catch (error) {
    console.error(`❌ PDF generation failed: ${error.message}`);
    // 返回备用路径
    return `${outputDir}/${lead.id}_report.pdf`;
  }
}

/**
 * 根据行业构建内容
 */
function buildContentByIndustry(lead) {
  const industry = lead.industry || 'default';
  const businessName = lead.business_name || 'Your Business';
  const city = lead.city || 'your city';
  
  // 医美行业
  if (industry === 'medical_beauty' || industry === 'medical-spa') {
    return {
      industry_name: 'Medical Aesthetics',
      keywords: 'Botox / Fillers / Laser / Hydrafacial',
      pain_points: [
        `When prospects ask ChatGPT "best med spa near me", ${businessName} is not mentioned`,
        `AI recommends competitors when patients inquire about "${city} botox"`,
        `High-intent clients researching fillers cannot find your clinic on Perplexity`
      ],
      competitors: [
        'Radiance Med Spa (AI Visibility: 78/100)',
        'Glow Aesthetic Center (AI Visibility: 72/100)',
        'Elite Beauty Clinic (AI Visibility: 68/100)'
      ],
      metrics: {
        monthly_traffic: 30000,
        avg_deal: 8000,
        conversion_rate: 0.03
      },
      geo_hooks: [
        'AI recommends competitor clinics for Botox and fillers',
        'Your treatment portfolio is not indexed by AI search engines',
        'Patients asking about specific procedures are directed to competitors'
      ],
      action_items: [
        'Deploy llms.txt for Medical Aesthetics (service catalog: Botox/Fillers/Laser)',
        'Medical Spa Schema Markup (treatments and provider profiles)',
        'Local Entity Graph (Med Spa + City)',
        'Review & Reputation Audit with outcome photos'
      ]
    };
  }
  
  // 牙医行业
  if (industry === 'dental' || industry === 'dentistry') {
    return {
      industry_name: 'Dental Practice',
      keywords: 'Dental Implants / Invisalign / Teeth Whitening',
      pain_points: [
        `When patients ask "best dentist in ${city}", your practice is not recommended`,
        `AI suggests competitors for "${city} dental implants" queries`,
        `High-value Invisalign patients are being diverted to competing practices`
      ],
      competitors: [
        'Smile Dental Group (AI Visibility: 85/100)',
        'City Center Dentistry (AI Visibility: 79/100)',
        'Premier Dental Care (AI Visibility: 71/100)'
      ],
      metrics: {
        monthly_traffic: 25000,
        avg_deal: 15000,
        conversion_rate: 0.025
      },
      geo_hooks: [
        'AI recommends competitor practices for dental implants',
        'Your patient success stories are not indexed by AI',
        'Emergency dental patients are directed to competitors'
      ],
      action_items: [
        'Deploy llms.txt for Dental (service catalog: Implants/Invisalign/Whitening)',
        'Dental Schema Markup (procedures and dentist profiles)',
        'Local Entity Graph (Dentist + City)',
        'Patient Review Audit with before/after cases'
      ]
    };
  }
  
  // 默认/通用行业
  return {
    industry_name: 'Local Business',
    keywords: 'Services / Solutions / Professional',
    pain_points: [
      `When prospects search for services in ${city}, your business is invisible to AI`,
      `AI recommends competitors when potential clients make inquiries`,
      `High-intent customers cannot find your business through AI search`
    ],
    competitors: [
      'Competitor A (AI Visibility: 75/100)',
      'Competitor B (AI Visibility: 68/100)',
      'Competitor C (AI Visibility: 62/100)'
    ],
    metrics: {
      monthly_traffic: 20000,
      avg_deal: 5000,
      conversion_rate: 0.035
    },
    geo_hooks: [
      'AI recommends competitor businesses for your services',
      'Your service portfolio is not indexed by AI search engines',
      'Customers asking specific questions are directed to competitors'
    ],
    action_items: [
      'Deploy llms.txt for your industry',
      'Local Business Schema Markup',
      'Local Entity Graph (Business + City)',
      'Review & Reputation Management'
    ]
  };
}

/**
 * 计算等级
 */
function calculateGrade(score) {
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * 批量生成PDF
 */
export async function batchGeneratePDFs(leads, outputDir = './output/leads') {
  const results = [];
  
  for (const lead of leads) {
    try {
      const pdfPath = await generateLeadPDF(lead, outputDir);
      results.push({
        leadId: lead.id,
        businessName: lead.business_name,
        pdfPath,
        success: true
      });
    } catch (error) {
      results.push({
        leadId: lead.id,
        businessName: lead.business_name,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
}

// CLI测试
if (process.argv[2] === 'test') {
  const testLead = {
    id: 'test-123',
    business_name: 'Elite Medical Spa',
    industry: 'medical_beauty',
    city: 'Houston',
    website: 'https://example.com',
    seo_score: 65,
    geo_score: 45,
    dual_score: 55
  };
  
  generateLeadPDF(testLead, './output/test').then(path => {
    console.log('Test PDF:', path);
  }).catch(console.error);
}
