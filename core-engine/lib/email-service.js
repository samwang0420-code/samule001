/**
 * Email Service - 邮件服务
 * 
 * 自动发送客户报告和告警
 */

import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 邮件配置
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
  secure: process.env.EMAIL_SMTP_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASS
  }
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'reports@stackmatrices.com';
const FROM_NAME = process.env.FROM_NAME || 'StackMatrices GEO';

/**
 * 发送周报
 */
export async function sendWeeklyReport(clientEmail, clientName, reportContent, options = {}) {
  const subject = `${clientName} - Weekly GEO Performance Report`;
  
  const html = generateEmailTemplate({
    title: 'Weekly Performance Report',
    clientName,
    content: markdownToHtml(reportContent),
    ctaText: 'View Full Dashboard',
    ctaUrl: options.dashboardUrl || '#'
  });
  
  return sendEmail({
    to: clientEmail,
    subject,
    html,
    text: reportContent
  });
}

/**
 * 发送排名告警
 */
export async function sendRankingAlert(clientEmail, clientName, alertData) {
  const subject = `🚨 ${clientName} - Ranking Alert`;
  
  const html = generateEmailTemplate({
    title: 'Ranking Alert',
    clientName,
    content: `
      <h2>${alertData.type === 'drop' ? '📉' : '📈'} ${alertData.title}</h2>
      <p><strong>Keyword:</strong> "${alertData.keyword}"</p>
      <p><strong>Change:</strong> ${alertData.change}</p>
      <p><strong>Current Position:</strong> #${alertData.currentRank}</p>
      <p><strong>Previous:</strong> #${alertData.previousRank}</p>
      <hr/>
      <p><strong>Recommended Action:</strong></p>
      <p>${alertData.recommendation}</p>
    `,
    ctaText: 'View Details',
    ctaUrl: alertData.url || '#'
  });
  
  return sendEmail({
    to: clientEmail,
    subject,
    html,
    priority: 'high'
  });
}

/**
 * 发送AI引用通知
 */
export async function sendAICitationAlert(clientEmail, clientName, citationData) {
  const subject = `✨ ${clientName} - New AI Citation!`;
  
  const html = generateEmailTemplate({
    title: 'AI Citation Achieved',
    clientName,
    content: `
      <h2>🤖 Your Content Was Cited by AI</h2>
      <p>Great news! Perplexity AI referenced your website in response to:</p>
      <blockquote style="font-style: italic; border-left: 3px solid #4CAF50; padding-left: 15px;">
        "${citationData.query}"
      </blockquote>
      <p><strong>Citation Rank:</strong> #${citationData.rank} of ${citationData.totalSources}</p>
      <p><strong>Platform:</strong> ${citationData.platform}</p>
    `,
    ctaText: 'View AI Report',
    ctaUrl: citationData.reportUrl || '#'
  });
  
  return sendEmail({
    to: clientEmail,
    subject,
    html
  });
}

/**
 * 发送月度ROI报告
 */
export async function sendMonthlyROIReport(clientEmail, clientName, roiData) {
  const subject = `${clientName} - Monthly ROI Report`;
  
  const html = generateEmailTemplate({
    title: 'Monthly ROI Report',
    clientName,
    content: `
      <h2>📊 This Month's Results</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Investment</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">$${roiData.investment}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>New Customers</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${roiData.newCustomers}</td>
        </tr>
        <tr style="background: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Revenue Generated</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #4CAF50;"><strong>$${roiData.revenue}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>ROI</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #4CAF50;"><strong>${roiData.roi}%</strong></td>
        </tr>
      </table>
    `,
    ctaText: 'View Full Report',
    ctaUrl: roiData.reportUrl || '#'
  });
  
  return sendEmail({
    to: clientEmail,
    subject,
    html
  });
}

/**
 * 发送欢迎邮件
 */
export async function sendWelcomeEmail(clientEmail, clientName, onboardingUrl) {
  const subject = `Welcome to StackMatrices GEO - Let's Get Started!`;
  
  const html = generateEmailTemplate({
    title: 'Welcome to GEO Optimization',
    clientName,
    content: `
      <h2>🎉 You're All Set!</h2>
      <p>Thank you for choosing StackMatrices GEO. We're excited to help you dominate AI search.</p>
      
      <h3>What Happens Next:</h3>
      <ol>
        <li><strong>Day 1:</strong> Complete onboarding questionnaire</li>
        <li><strong>Day 2-3:</strong> We analyze your current GEO presence</li>
        <li><strong>Day 4-7:</strong> Deploy optimizations</li>
        <li><strong>Ongoing:</strong> Daily monitoring & weekly reports</li>
      </ol>
      
      <p><strong>Your dedicated team:</strong></p>
      <ul>
        <li>Account Manager: [Name]</li>
        <li>GEO Specialist: [Name]</li>
        <li>Support: support@stackmatrices.com</li>
      </ul>
    `,
    ctaText: 'Start Onboarding',
    ctaUrl: onboardingUrl
  });
  
  return sendEmail({
    to: clientEmail,
    subject,
    html
  });
}

/**
 * 生成邮件模板
 */
function generateEmailTemplate({ title, clientName, content, ctaText, ctaUrl }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>Hello ${clientName},</p>
  </div>
  <div class="content">
    ${content}
    <center>
      <a href="${ctaUrl}" class="button">${ctaText}</a>
    </center>
  </div>
  <div class="footer">
    <p>StackMatrices GEO Platform</p>
    <p><a href="https://stackmatrices.com">stackmatrices.com</a> | <a href="mailto:support@stackmatrices.com">support@stackmatrices.com</a></p>
  </div>
</body>
</html>
  `;
}

/**
 * 发送邮件
 */
async function sendEmail({ to, subject, html, text, priority = 'normal' }) {
  if (!process.env.EMAIL_SMTP_HOST) {
    console.log('⚠️  Email not configured. Would send:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    return { preview: true };
  }
  
  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
      priority: priority === 'high' ? 'high' : 'normal'
    });
    
    console.log(`✅ Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Markdown转HTML (简化版)
 */
function markdownToHtml(markdown) {
  return markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br/>');
}

/**
 * 批量发送周报给所有客户
 */
export async function sendWeeklyReportsToAll() {
  console.log('📧 Sending weekly reports to all clients...\n');
  
  // 加载客户列表
  const clients = await loadClientList();
  
  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };
  
  for (const client of clients) {
    try {
      // 读取生成的报告
      const reportPath = path.join(__dirname, '../outputs', client.id, 'reports', `weekly-${new Date().toISOString().split('T')[0]}.md`);
      const report = await fs.readFile(reportPath, 'utf8');
      
      // 发送邮件
      await sendWeeklyReport(client.email, client.name, report);
      results.sent++;
      console.log(`  ✅ ${client.name}`);
      
    } catch (error) {
      results.failed++;
      results.errors.push({ client: client.name, error: error.message });
      console.log(`  ❌ ${client.name}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Summary: ${results.sent} sent, ${results.failed} failed`);
  return results;
}

async function loadClientList() {
  // 从数据库或配置文件加载
  // Demo mode: return empty
  try {
    const configPath = path.join(__dirname, '../config/clients.json');
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export default {
  sendWeeklyReport,
  sendRankingAlert,
  sendAICitationAlert,
  sendMonthlyROIReport,
  sendWelcomeEmail,
  sendWeeklyReportsToAll
};
