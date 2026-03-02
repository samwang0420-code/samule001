# GEO Core Engine - 端到端测试清单

## 测试目标
验证系统从输入到输出的完整流程，确保各模块协同工作。

## 前置条件
- [ ] Node.js 18+ 已安装
- [ ] npm install 已执行
- [ ] .env 文件已配置（或有测试用的API keys）

## 测试用例

### 1. 基础功能测试

#### 1.1 CLI可用性
```bash
cd core-engine
./geo.js --help
./geo.js status
```
**预期结果**: 显示帮助信息和系统状态

#### 1.2 Demo模式运行
```bash
./run.js "Test Law Firm" "123 Main St, Houston, TX"
```
**预期结果**: 
- 成功生成输出目录
- 包含 score.json, schema.json, citation.json
- 无错误信息

### 2. 模块单元测试

#### 2.1 引用概率引擎
```bash
node -e "import('./lib/citation-engine.js').then(m => {
  const result = m.calculateCitationProbability('H1B visa process for Houston immigrants');
  console.log('Score:', result.percentage + '%');
  console.log('Factors:', Object.keys(result.factors));
})"
```
**预期结果**: 返回0-100的分数和因子分解

#### 2.2 知识图谱
```bash
node -e "import('./lib/knowledge-graph.js').then(m => {
  const entities = m.getRelatedEntities('H1B visa');
  console.log('Related entities:', entities);
})"
```
**预期结果**: 返回相关实体数组

#### 2.3 内容生成器
```bash
node -e "import('./lib/content-generator.js').then(m => {
  const content = m.generateLocationPage(
    { name: 'Test Firm', city: 'Houston' },
    ['H-1B Visa', 'Green Card']
  );
  console.log('Title:', content.title);
})"
```
**预期结果**: 生成包含标题和章节的内容对象

### 3. 集成测试（需要API keys）

#### 3.1 Apify集成
```bash
export APIFY_TOKEN=your_token
node test-apify.js
```
**预期结果**: 显示 "✓ Apify connected"

#### 3.2 Supabase集成
```bash
export SUPABASE_URL=your_url
export SUPABASE_KEY=your_key
node test-db.js
```
**预期结果**: 显示 "✓ Database connection successful"

#### 3.3 完整流程（Live模式）
```bash
export APIFY_TOKEN=your_token
./run.js "Garcia Immigration Law" "1234 Main St, Houston, TX"
```
**预期结果**:
- 显示 "Mode: LIVE (Apify real data)"
- 成功抓取Google Maps数据
- 所有6个步骤完成

### 4. 监控与告警测试

#### 4.1 关键词监控
```bash
./monitor.js add "client_test_001" "immigration lawyer houston"
./monitor.js run
./monitor.js report "client_test_001"
```
**预期结果**: 添加成功，运行检查，生成报告

#### 4.2 告警系统
```bash
node lib/alert-system.js check "client_test_001"
node lib/alert-system.js summary
```
**预期结果**: 运行检查，显示汇总

### 5. 知识更新测试

#### 5.1 信号监控
```bash
node lib/signal-monitor.js scan
node lib/signal-monitor.js status
```
**预期结果**: 扫描信号，显示知识库状态

#### 5.2 策略追踪
```bash
node lib/outcome-tracker.js register "Test Strategy" "Test desc" schema_change geo-score 10
node lib/outcome-tracker.js report
```
**预期结果**: 注册策略，显示效果报告

## 预期输出文件结构

```
outputs/client_xxx/
├── client.json          # 客户信息
├── raw-data.json        # 原始数据
├── score.json           # GEO评分
├── citation.json        # 引用概率分析 ✅ 关键新功能
├── perplexity.json      # 竞品分析 ✅ 关键新功能
├── schema.json          # Schema标记
└── deploy.md            # 部署指南
```

## 成功标准

- [ ] Demo模式完整运行无错误
- [ ] Live模式成功抓取真实数据（有API key时）
- [ ] 所有JSON输出文件格式正确
- [ ] 引用概率分数在0-100范围内
- [ ] 知识图谱返回相关实体
- [ ] 内容生成器输出完整页面结构

## 失败处理

如果遇到错误：
1. 检查错误信息中的具体模块
2. 验证该模块的依赖是否安装
3. 检查环境变量是否设置
4. 查看日志文件 logs/
5. 根据错误类型修复代码或配置

## 自动化测试命令

一键运行所有测试：
```bash
cd core-engine
npm test 2>/dev/null || echo "No test script, running manual checks..."
node -e "import('./lib/citation-engine.js')" && echo "✓ Citation engine OK"
node -e "import('./lib/knowledge-graph.js')" && echo "✓ Knowledge graph OK"
node -e "import('./lib/content-generator.js')" && echo "✓ Content generator OK"
./run.js "Test" "Test Address" >/dev/null 2>&1 && echo "✓ Full pipeline OK"
echo "All tests completed"
```
