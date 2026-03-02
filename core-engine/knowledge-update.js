#!/usr/bin/env node
/**
 * Knowledge Update - 知识库更新工具
 * 
 * 从信号发现到知识部署的完整工作流
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { monitorSignals } from './lib/signal-monitor.js';
import { recommendKnowledgeUpdate } from './lib/outcome-tracker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge-base');

/**
 * 知识更新工作流
 */
async function knowledgeUpdateWorkflow() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           KNOWLEDGE UPDATE WORKFLOW                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  // Step 1: 检查信号
  console.log('📡 Step 1: Checking for external signals...');
  const signalResult = await monitorSignals();
  
  if (signalResult.criticalSignals > 0) {
    console.log(`   ⚠️  ${signalResult.criticalSignals} CRITICAL signals detected!`);
    console.log('   Pause new deployments until assessed.\n');
  } else {
    console.log('   ✓ No critical signals\n');
  }
  
  // Step 2: 检查策略效果
  console.log('📊 Step 2: Analyzing strategy outcomes...');
  const recommendations = await recommendKnowledgeUpdate();
  
  const totalRecs = recommendations.toAdopt.length + recommendations.toDeprecate.length;
  console.log(`   Found ${totalRecs} update recommendations\n`);
  
  // Step 3: 生成更新计划
  console.log('📝 Step 3: Generating update plan...');
  const plan = await generateUpdatePlan(recommendations, signalResult);
  
  displayUpdatePlan(plan);
  
  // Step 4: 用户确认
  console.log('\n⚡ Ready to execute update plan.\n');
  console.log('To apply these updates, run:');
  console.log('  node knowledge-update.js apply\n');
  
  // 保存计划
  await saveUpdatePlan(plan);
}

/**
 * 生成更新计划
 */
async function generateUpdatePlan(recommendations, signals) {
  const plan = {
    id: `update_${Date.now()}`,
    createdAt: new Date().toISOString(),
    changes: [],
    affectedComponents: new Set(),
    riskLevel: 'LOW'
  };
  
  // 来自策略推荐的更新
  for (const strat of recommendations.toAdopt) {
    plan.changes.push({
      type: 'ADOPT',
      component: strat.component,
      strategyId: strat.id,
      description: strat.name,
      evidence: strat.evidence,
      risk: 'LOW'
    });
    plan.affectedComponents.add(strat.component);
  }
  
  for (const strat of recommendations.toDeprecate) {
    plan.changes.push({
      type: 'DEPRECATE',
      component: strat.component || 'unknown',
      strategyId: strat.id,
      description: strat.name,
      reason: strat.reason,
      risk: 'MEDIUM'
    });
    plan.affectedComponents.add(strat.component || 'unknown');
  }
  
  // 来自信号触发的更新
  if (signals.criticalSignals > 0) {
    plan.changes.push({
      type: 'INVESTIGATE',
      component: 'all',
      description: 'External signals require investigation',
      signals: signals.signalsFound,
      risk: 'HIGH'
    });
    plan.riskLevel = 'HIGH';
  }
  
  plan.affectedComponents = Array.from(plan.affectedComponents);
  
  // 重新计算风险
  if (plan.changes.some(c => c.risk === 'HIGH')) {
    plan.riskLevel = 'HIGH';
  } else if (plan.changes.some(c => c.risk === 'MEDIUM')) {
    plan.riskLevel = 'MEDIUM';
  }
  
  return plan;
}

function displayUpdatePlan(plan) {
  console.log('\n📋 Update Plan');
  console.log('==============');
  console.log(`Plan ID: ${plan.id}`);
  console.log(`Risk Level: ${plan.riskLevel}`);
  console.log(`Affected Components: ${plan.affectedComponents.join(', ')}`);
  console.log(`Total Changes: ${plan.changes.length}\n`);
  
  plan.changes.forEach((change, i) => {
    const icon = change.type === 'ADOPT' ? '✅' : 
                 change.type === 'DEPRECATE' ? '❌' : '🔍';
    console.log(`${i + 1}. ${icon} [${change.type}] ${change.description}`);
    console.log(`   Component: ${change.component}`);
    console.log(`   Risk: ${change.risk}`);
    if (change.evidence) {
      console.log(`   Evidence: ${change.evidence}`);
    }
    if (change.reason) {
      console.log(`   Reason: ${change.reason}`);
    }
    console.log();
  });
}

/**
 * 应用更新计划
 */
async function applyUpdatePlan() {
  const plan = await loadUpdatePlan();
  
  if (!plan) {
    console.log('❌ No update plan found. Run "node knowledge-update.js" first.');
    process.exit(1);
  }
  
  console.log(`\nApplying update plan: ${plan.id}`);
  console.log(`Risk Level: ${plan.riskLevel}\n`);
  
  if (plan.riskLevel === 'HIGH') {
    console.log('⚠️  HIGH RISK update detected!');
    console.log('Recommended approach:');
    console.log('  1. Deploy to test environment first');
    console.log('  2. Run on 5% of clients (canary)');
    console.log('  3. Monitor for 48 hours');
    console.log('  4. Gradual rollout if stable\n');
  }
  
  // 模拟应用更新
  for (const change of plan.changes) {
    console.log(`Applying: ${change.description}...`);
    
    switch (change.type) {
      case 'ADOPT':
        await adoptStrategy(change);
        break;
      case 'DEPRECATE':
        await deprecateStrategy(change);
        break;
      case 'INVESTIGATE':
        console.log('  ⚠️  Manual investigation required');
        break;
    }
  }
  
  // 更新版本
  await bumpVersion(plan);
  
  console.log('\n✅ Update plan applied successfully!');
  console.log('New knowledge version:', await getCurrentVersion());
}

async function adoptStrategy(change) {
  // 实际应用中，这里会修改知识库文件
  console.log(`  ✓ Strategy adopted into ${change.component}`);
  
  // 记录变更
  await logChange({
    type: 'ADOPT',
    component: change.component,
    description: change.description,
    timestamp: new Date().toISOString()
  });
}

async function deprecateStrategy(change) {
  console.log(`  ✓ Strategy deprecated from ${change.component}`);
  
  await logChange({
    type: 'DEPRECATE',
    component: change.component,
    description: change.description,
    reason: change.reason,
    timestamp: new Date().toISOString()
  });
}

async function bumpVersion(plan) {
  const versionFile = path.join(KNOWLEDGE_DIR, 'version.json');
  
  let version = { major: 1, minor: 0, patch: 0, lastUpdated: new Date().toISOString() };
  try {
    const content = await fs.readFile(versionFile, 'utf8');
    version = JSON.parse(content);
  } catch (e) {}
  
  // 根据风险级别决定版本号变化
  if (plan.riskLevel === 'HIGH') {
    version.major++;
    version.minor = 0;
    version.patch = 0;
  } else if (plan.riskLevel === 'MEDIUM') {
    version.minor++;
    version.patch = 0;
  } else {
    version.patch++;
  }
  
  version.lastUpdated = new Date().toISOString();
  version.changes = plan.changes.length;
  
  await fs.mkdir(KNOWLEDGE_DIR, { recursive: true });
  await fs.writeFile(versionFile, JSON.stringify(version, null, 2));
}

async function getCurrentVersion() {
  try {
    const content = await fs.readFile(path.join(KNOWLEDGE_DIR, 'version.json'), 'utf8');
    const v = JSON.parse(content);
    return `${v.major}.${v.minor}.${v.patch}`;
  } catch (e) {
    return '1.0.0';
  }
}

async function saveUpdatePlan(plan) {
  const planFile = path.join(KNOWLEDGE_DIR, 'pending-update.json');
  await fs.mkdir(KNOWLEDGE_DIR, { recursive: true });
  await fs.writeFile(planFile, JSON.stringify(plan, null, 2));
}

async function loadUpdatePlan() {
  try {
    const content = await fs.readFile(path.join(KNOWLEDGE_DIR, 'pending-update.json'), 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

async function logChange(change) {
  const changelogFile = path.join(KNOWLEDGE_DIR, 'CHANGELOG.md');
  
  const entry = `\n## ${new Date().toISOString().split('T')[0]}\n- [${change.type}] ${change.description}\n`;
  
  let existing = '';
  try {
    existing = await fs.readFile(changelogFile, 'utf8');
  } catch (e) {}
  
  await fs.writeFile(changelogFile, existing + entry);
}

// CLI
async function main() {
  const [,, command] = process.argv;
  
  switch (command) {
    case 'apply':
      await applyUpdatePlan();
      break;
      
    case 'status':
      const version = await getCurrentVersion();
      console.log(`Current Knowledge Version: ${version}`);
      
      const plan = await loadUpdatePlan();
      if (plan) {
        console.log(`\nPending update plan: ${plan.id}`);
        console.log(`Changes: ${plan.changes.length}`);
        console.log('Run "node knowledge-update.js apply" to deploy');
      } else {
        console.log('\nNo pending updates');
      }
      break;
      
    default:
      await knowledgeUpdateWorkflow();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default {
  knowledgeUpdateWorkflow,
  applyUpdatePlan
};
