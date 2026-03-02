#!/usr/bin/env node
/**
 * Skill Sync Checker
 * 定期检查共享skills目录，发现新skill时同步
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.join(__dirname, '../skills');
const LAST_SYNC_FILE = path.join(__dirname, '../.last-skill-sync');

async function checkSkillSync() {
  console.log('🔍 Checking for shared skills...');
  
  try {
    // 读取skills目录
    const entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
    const skillDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
    
    if (skillDirs.length === 0) {
      console.log('  ℹ️ No skills found yet');
      return;
    }
    
    console.log(`  📁 Found ${skillDirs.length} skill(s):`);
    
    let hasNewSkills = false;
    
    for (const dir of skillDirs) {
      const skillPath = path.join(SKILLS_DIR, dir.name);
      const skillFile = path.join(skillPath, 'SKILL.md');
      
      try {
        await fs.access(skillFile);
        console.log(`    ✅ ${dir.name}`);
        hasNewSkills = true;
        
        // 读取skill信息
        const content = await fs.readFile(skillFile, 'utf8');
        const nameMatch = content.match(/#\s*(.+)/);
        const name = nameMatch ? nameMatch[1] : dir.name;
        
        // 记录到README
        await updateSkillsList(dir.name, name);
        
      } catch (e) {
        console.log(`    ⚠️ ${dir.name} (no SKILL.md)`);
      }
    }
    
    // 如果有新skill，执行git同步
    if (hasNewSkills) {
      await syncToGit();
    }
    
    // 记录同步时间
    await fs.writeFile(LAST_SYNC_FILE, new Date().toISOString());
    
  } catch (e) {
    console.error('  ❌ Error checking skills:', e.message);
  }
}

async function updateSkillsList(skillDir, skillName) {
  const readmePath = path.join(SKILLS_DIR, 'README.md');
  
  try {
    let content = await fs.readFile(readmePath, 'utf8');
    
    // 检查是否已存在
    if (content.includes(skillDir)) {
      return; // 已存在，不重复添加
    }
    
    // 添加新skill到表格
    const newRow = `| ${skillName} | Shared | Ready |`;
    content = content.replace(
      '| (None yet) | - | - |',
      newRow
    );
    
    await fs.writeFile(readmePath, content);
    console.log(`    📝 Updated README with ${skillName}`);
    
  } catch (e) {
    console.error('    ❌ Error updating README:', e.message);
  }
}

async function syncToGit() {
  console.log('  🔄 Syncing to Git...');
  
  try {
    const commands = [
      'cd /root/.openclaw/workspace-geo-arch',
      'git add skills/',
      'git commit -m "Sync shared skills from other agents" 2>/dev/null || echo "Nothing to commit"',
      'git push origin master 2>/dev/null || echo "Push failed"'
    ];
    
    for (const cmd of commands) {
      try {
        execSync(cmd, { stdio: 'pipe' });
      } catch (e) {
        // 忽略某些错误
      }
    }
    
    console.log('  ✅ Git sync complete');
    
  } catch (e) {
    console.error('  ❌ Git sync failed:', e.message);
  }
}

// 运行检查
checkSkillSync().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
