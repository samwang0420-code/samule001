#!/usr/bin/env node
/**
 * Dashboard - 系统状态仪表板
 * 
 * 显示关键指标、客户状态、系统健康度
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './lib/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function showDashboard() {
  console.clear();
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           GEO CORE ENGINE - SYSTEM DASHBOARD             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  // 1. 系统健康
  console.log('📊 SYSTEM HEALTH');
  console.log('────────────────');
  
  const health = await checkSystemHealth();
  console.log(`  Database: ${health.database ? '✅ Connected' : '❌ Disconnected'}`);
  console.log(`  Apify: ${health.apify ? '✅ Configured' : '⚠️  Not Configured'}`);
  console.log(`  Disk Space: ${health.diskSpace}`);
  console.log(`  Uptime: ${health.uptime}\n`);
  
  // 2. 客户统计
  console.log('👥 CLIENTS');
  console.log('───────────');
  
  if (db.isConfigured) {
    try {
      const stats = await db.getSystemStats();
      console.log(`  Total Clients: ${stats.clients}`);
      console.log(`  GEO Audits: ${stats.audits}`);
      console.log(`  Keywords Tracked: ${stats.keywords}`);
      console.log(`  Rankings Recorded: ${stats.rankings}\n`);
    } catch (e) {
      console.log(`  ⚠️  Database tables not ready\n`);
    }
  } else {
    // 从本地文件统计
    const localStats = await getLocalStats();
    console.log(`  Local Clients: ${localStats.clients}`);
    console.log(`  Output Directories: ${localStats.outputs}\n`);
  }
  
  // 3. 最近活动
  console.log('📈 RECENT ACTIVITY');
  console.log('───────────────────');
  
  const recent = await getRecentActivity();
  if (recent.length > 0) {
    recent.slice(0, 5).forEach(item => {
      console.log(`  ${item.time} - ${item.action}`);
    });
  } else {
    console.log('  No recent activity');
  }
  console.log();
  
  // 4. 待办事项
  console.log('📋 TODO / ALERTS');
  console.log('─────────────────');
  
  const todos = await getTodoItems();
  if (todos.length > 0) {
    todos.forEach(todo => {
      const icon = todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢';
      console.log(`  ${icon} ${todo.message}`);
    });
  } else {
    console.log('  ✅ All systems operational');
  }
  console.log();
  
  // 5. 快速操作
  console.log('⚡ QUICK ACTIONS');
  console.log('────────────────');
  console.log('  1. Run new client analysis: ./full-pipeline.js "Name" "Address"');
  console.log('  2. Check rankings: ./scheduler.sh now');
  console.log('  3. View logs: cat logs/app-*.jsonl | tail -20');
  console.log('  4. Cleanup: node lib/logger.js cleanup\n');
}

async function checkSystemHealth() {
  const health = {
    database: db.isConfigured,
    apify: !!process.env.APIFY_TOKEN,
    diskSpace: 'OK',
    uptime: process.uptime() < 60 
      ? Math.round(process.uptime()) + 's' 
      : Math.round(process.uptime() / 60) + 'm'
  };
  
  // 检查磁盘空间
  try {
    const stats = await fs.statfs(__dirname);
    const freeGB = (stats.bavail * stats.bsize / 1024 / 1024 / 1024).toFixed(1);
    health.diskSpace = `${freeGB}GB free`;
  } catch (e) {
    health.diskSpace = 'Unknown';
  }
  
  return health;
}

async function getLocalStats() {
  try {
    const outputsDir = path.join(__dirname, 'outputs');
    const entries = await fs.readdir(outputsDir);
    const dirs = entries.filter(async e => {
      const stat = await fs.stat(path.join(outputsDir, e));
      return stat.isDirectory();
    });
    
    return {
      clients: dirs.length,
      outputs: dirs.length
    };
  } catch (e) {
    return { clients: 0, outputs: 0 };
  }
}

async function getRecentActivity() {
  const activities = [];
  
  // 检查最近的输出目录
  try {
    const outputsDir = path.join(__dirname, 'outputs');
    const entries = await fs.readdir(outputsDir);
    
    for (const entry of entries.slice(-5)) {
      const stat = await fs.stat(path.join(outputsDir, entry));
      activities.push({
        time: stat.mtime.toLocaleString(),
        action: `Analysis: ${entry}`
      });
    }
  } catch (e) {}
  
  return activities.sort((a, b) => new Date(b.time) - new Date(a.time));
}

async function getTodoItems() {
  const todos = [];
  
  // 检查数据库
  if (!db.isConfigured) {
    todos.push({ priority: 'high', message: 'Configure database in .env file' });
  }
  
  // 检查Apify
  if (!process.env.APIFY_TOKEN) {
    todos.push({ priority: 'high', message: 'Add APIFY_TOKEN for real data' });
  }
  
  // 检查输出目录
  try {
    const outputsDir = path.join(__dirname, 'outputs');
    await fs.access(outputsDir);
  } catch (e) {
    todos.push({ priority: 'medium', message: 'Create outputs directory' });
  }
  
  // 检查日志目录
  try {
    const logsDir = path.join(__dirname, 'logs');
    await fs.access(logsDir);
  } catch (e) {
    todos.push({ priority: 'low', message: 'Create logs directory' });
  }
  
  return todos;
}

// CLI
showDashboard().catch(console.error);

export default { showDashboard };
