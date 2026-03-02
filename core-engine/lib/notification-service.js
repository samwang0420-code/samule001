#!/usr/bin/env node
/**
 * Notification Service - 邮件/消息通知系统
 */

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  'https://fixemvsckapejyfwphft.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeGVtdnNja2FwZWp5ZndwaGZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkxNDczNSwiZXhwIjoyMDg3NDkwNzM1fQ.q_mgJQlae4B0AJMv9RziN2MzjVRKylG-06WIKFoG434'
);

// 邮件配置（使用环境变量或配置）
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// 通知类型
const NOTIFICATION_TYPES = {
  ANALYSIS_COMPLETE: 'analysis_complete',
  SCORE_IMPROVEMENT: 'score_improvement',
  ALGORITHM_UPDATE: 'algorithm_update',
  WEEKLY_REPORT: 'weekly_report',
  ISSUE_ALERT: 'issue_alert'
};

/**
 * 发送分析完成通知
 */
async function sendAnalysisCompleteNotification(clientId) {
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  
  if (!client || !client.email) return;
  
  const subject = `Analysis Complete: ${client.business_name}`;
  const html = `
    <h2>SEO + GEO Analysis Complete</h2>
    <p>Your analysis for <strong>${client.business_name}</strong> is now complete.</p>
    
    <h3>Your Scores:</h3>
    <ul>
      <li>SEO Score: <strong>${client.seo_score || 0}/100</strong></li>
      <li>GEO Score: <strong>${client.geo_score || 0}/100</strong></li>
      <li>Dual Score: <strong>${Math.round(((client.seo_score || 0) + (client.geo_score || 0)) / 2)}/100</strong></li>
    </ul>
    
    <p><a href="https://dashboard.gspr-hub.site/clients/${clientId}">View Full Report →</a></p>
  `;
  
  await sendEmail(client.email, subject, html);
  console.log(`✅ Analysis notification sent to ${client.email}`);
}

/**
 * 发送分数提升通知
 */
async function sendScoreImprovementNotification(clientId, improvements) {
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  
  if (!client || !client.email) return;
  
  const subject = `🎉 Score Improvements: ${client.business_name}`;
  const html = `
    <h2>Great News! Your Scores Have Improved</h2>
    <p>Your optimization efforts are paying off for <strong>${client.business_name}</strong>.</p>
    
    <h3>Improvements This Week:</h3>
    <ul>
      ${improvements.map(imp => `
        <li>${imp.type}: <strong>+${imp.change} points</strong> (${imp.from} → ${imp.to})</li>
      `).join('')}
    </ul>
    
    <p>Keep up the great work! 🚀</p>
  `;
  
  await sendEmail(client.email, subject, html);
}

/**
 * 发送周报
 */
async function sendWeeklyReport(clientId) {
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  
  if (!client || !client.email) return;
  
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  
  const subject = `Weekly Report: ${client.business_name} (${weekStart.toLocaleDateString()})`;
  const html = `
    <h2>Weekly Performance Report</h2>
    <p>Here's how <strong>${client.business_name}</strong> performed this week:</p>
    
    <h3>Current Scores:</h3>
    <table border="1" cellpadding="10">
      <tr><th>Metric</th><th>Score</th><th>Status</th></tr>
      <tr><td>SEO Score</td><td>${client.seo_score || 0}/100</td><td>${getScoreStatus(client.seo_score)}</td></tr>
      <tr><td>GEO Score</td><td>${client.geo_score || 0}/100</td><td>${getScoreStatus(client.geo_score)}</td></tr>
    </table>
    
    <h3>Actions Taken This Week:</h3>
    <ul>
      <li>Content optimization</li>
      <li>Backlink acquisition</li>
      <li>Technical SEO fixes</li>
    </ul>
    
    <h3>Next Week's Plan:</h3>
    <ul>
      <li>Continue content creation</li>
      <li>Monitor ranking improvements</li>
      <li>Optimize for AI citations</li>
    </ul>
  `;
  
  await sendEmail(client.email, subject, html);
}

/**
 * 发送算法更新提醒
 */
async function sendAlgorithmUpdateAlert(updates) {
  const { data: clients } = await supabase
    .from('clients')
    .select('email, business_name')
    .not('email', 'is', null);
  
  const subject = '🔔 Important: Google Algorithm Update';
  const html = `
    <h2>Algorithm Update Alert</h2>
    <p>Google has released a new algorithm update that may affect your rankings.</p>
    
    <h3>Update Details:</h3>
    <ul>
      ${updates.map(u => `<li><strong>${u.title}</strong>: ${u.description}</li>`).join('')}
    </ul>
    
    <h3>What We're Doing:</h3>
    <p>Our team is already analyzing the impact and making necessary adjustments to your optimization strategy.</p>
    
    <p>No action needed from you at this time. We'll keep you updated.</p>
  `;
  
  for (const client of clients || []) {
    await sendEmail(client.email, subject, html);
  }
}

/**
 * 发送邮件
 */
async function sendEmail(to, subject, html) {
  // 如果没有配置SMTP，只记录日志
  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}`);
    return;
  }
  
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@dashboard.gspr-hub.site',
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Email sending failed:', error);
  }
}

function getScoreStatus(score) {
  if (score >= 80) return '🟢 Excellent';
  if (score >= 60) return '🟡 Good';
  if (score >= 40) return '🟠 Needs Work';
  return '🔴 Critical';
}

// CLI usage
const command = process.argv[2];
const clientId = process.argv[3];

switch (command) {
  case 'analysis-complete':
    sendAnalysisCompleteNotification(clientId);
    break;
  case 'weekly-report':
    sendWeeklyReport(clientId);
    break;
  default:
    console.log('Usage: node notification-service.js [command] [client_id]');
    console.log('Commands: analysis-complete, weekly-report');
}

export {
  sendAnalysisCompleteNotification,
  sendScoreImprovementNotification,
  sendWeeklyReport,
  sendAlgorithmUpdateAlert,
  NOTIFICATION_TYPES
};
