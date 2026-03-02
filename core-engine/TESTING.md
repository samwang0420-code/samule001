# GEO Core Engine - 快速测试指南

## 一键测试所有核心功能

```bash
cd core-engine

# 1. 基础GEO分析测试
./run.js "Test Law Firm" "123 Main St, Houston, TX"

# 2. 系统状态检查
./geo.js status

# 3. 知识进化系统测试
./evolution.sh daily
./evolution.sh weekly

# 4. 查看生成的输出
cat outputs/*/deploy.md
```

## 各模块单独测试

### 引用概率引擎
```bash
node -e "
import('./lib/citation-engine.js').then(m => {
  const content = 'H-1B visa process requires Form I-129. 87% approval rate in 2024.';
  const result = m.calculateCitationProbability(content);
  console.log('Citation Probability:', result.percentage + '%');
  console.log('Recommendations:', result.recommendations.map(r => r.action));
});
"
```

### 知识图谱
```bash
node -e "
import('./lib/knowledge-graph.js').then(m => {
  const entities = m.getRelatedEntities('H1B visa');
  console.log('Related entities:', entities);
});
"
```

### 内容生成器
```bash
node -e "
import('./lib/content-generator.js').then(m => {
  const page = m.generateLocationPage(
    { name: 'Test Firm', city: 'Houston' },
    ['H-1B Visa', 'Green Card']
  );
  console.log('Generated title:', page.title);
  console.log('Citation score:', page.citationScore.percentage + '%');
});
"
```

### 策略效果追踪
```bash
# 查看报告
node lib/outcome-tracker.js report

# 获取更新建议
node lib/outcome-tracker.js recommend
```

### 信号监控
```bash
# 扫描外部信号
node lib/signal-monitor.js scan

# 检查知识新鲜度
node lib/signal-monitor.js status

# 列出最近信号
node lib/signal-monitor.js list
```

## 完整工作流测试

```bash
# 1. 注册新策略测试
node lib/outcome-tracker.js register \
  "Test Strategy" \
  "Description" \
  schema_change \
  geo-score \
  10

# 2. 记录效果
node lib/outcome-tracker.js record strat_xxx

# 3. 生成更新计划
node knowledge-update.js

# 4. 应用更新（谨慎！）
node knowledge-update.js apply
```

## 预期输出示例

### GEO分析输出
```
🔥 CORE ENGINE RUNNING
   Firm: Test Law Firm
   Mode: DEMO (simulated)

📡 Step 1: Data Collection
   ✓ Simulated data generated

🧠 Step 2: GEO Analysis
   Score: 77/100
   Current Rank: #5
   Potential Rank: #2

⚡ Step 3: Schema Generation
   ✓ Schema generated

🤖 Step 4: Citation Probability Analysis
   Probability: 68%
   Status: ⚠️ Medium

🔍 Step 5: Perplexity Analysis
   Analyzed 5 competitor sources
   Strategy: 6 recommendations

📁 Step 7: Local Output
   ✓ Saved to: ./outputs/client_xxx/
```

### 进化系统输出
```
📡 Step 1: Checking for external signals...
   ✓ No critical signals

📊 Step 2: Analyzing strategy outcomes...
   Found 2 update recommendations

📝 Step 3: Generating update plan...

📋 Update Plan
==============
Plan ID: update_xxx
Risk Level: LOW
Total Changes: 2

1. ✅ [ADOPT] Add parking info to GMB
   Evidence: 50 clients, avg ranking change: -2.3

2. ✅ [ADOPT] Add FAQ Schema markup
   Evidence: 30 clients, avg ranking change: -1.5
```

## 故障排查

### 问题：模块找不到
```bash
# 确保在core-engine目录下
cd core-engine
npm install
```

### 问题：权限错误
```bash
chmod +x *.sh *.js
```

### 问题：数据库连接失败
```bash
# 检查.env配置
cat .env
# 运行测试
npm run test-db
```

## 生产环境检查清单

- [ ] APIFY_TOKEN 配置正确
- [ ] SUPABASE 连接正常
- [ ] 定时任务已设置 (crontab -l)
- [ ] 日志目录可写
- [ ] 输出目录可写
- [ ] 至少一个策略已注册并测试
- [ ] 知识版本已初始化

## 性能基准

| 操作 | 预期时间 | 备注 |
|------|---------|------|
| GEO分析 (Demo) | <5秒 | 模拟数据 |
| GEO分析 (Live) | 30-60秒 | Apify API调用 |
| 引用概率计算 | <1秒 | 本地计算 |
| Perplexity分析 | 10-30秒 | Demo模式 |
| 知识更新检查 | <5秒 | 本地操作 |
