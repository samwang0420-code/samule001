# GEO Intelligence Monitoring System

## 监控源配置

### 1. Google算法监控
```yaml
sources:
  - name: "Search Engine Land"
    url: "https://searchengineland.com/feed"
    keywords: ["google update", "local search", "algorithm", "GMB"]
    
  - name: "Google Search Status"
    url: "https://status.search.google.com/incidents.json"
    check_interval: "1h"
    
  - name: "Schema.org Releases"
    url: "https://github.com/schemaorg/schemaorg/releases.atom"
    trigger: "new release"
```

### 2. 竞品情报监控
```yaml
competitors:
  - city: "houston"
    keywords: ["immigration lawyer", "visa attorney", "green card lawyer"]
    monitoring:
      - schema_changes: true
      - content_updates: true
      - gmb_photo_frequency: true
      - review_velocity: true
    check_interval: "daily"
```

### 3. 客户数据异常监控
```yaml
client_alerts:
  - metric: "ranking_drop"
    threshold: "3 positions"
    timeframe: "48h"
    
  - metric: "conversion_decline"
    threshold: "20%"
    timeframe: "1 week"
    
  - metric: "knowledge_panel_missing"
    action: "immediate_audit"
```

## 更新分类与响应

### P0: 算法地震（立即响应，24小时内）
- Google官方算法核心更新
- Schema标记规范重大变更
- GMB政策变更

**响应：**
1. 暂停所有新客户部署
2. 验证现有客户是否受影响
3. 24小时内发布应对策略
4. 更新系统架构文档

### P1: 新机会（1周内响应）
- Schema.org新增类型
- 竞品发现新玩法
- 客户数据发现新模式

**响应：**
1. 小规模测试（1-2个客户）
2. 验证效果
3. 系统化处理脚本
4. 批量部署

### P2: 优化迭代（月度更新）
- 抓取策略优化
- 报告模板改进
- 自动化流程增强

## 知识沉淀机制

### 每周情报摘要
```
文件：memory/YYYY-MM-DD-intel-summary.md
内容：
- 本周算法变动
- 竞品新动作
- 客户数据洞察
- 下周行动计划
```

### 每月系统审计
```
检查项：
- Schema标记是否符合最新规范
- Apify抓取任务是否正常
- 客户平均ROI是否达标
- 系统成本是否优化
```

### 每季度战略调整
```
决策点：
- 是否扩展新城市？
- 是否增加新律所类型？
- 是否需要升级基础设施？
- 定价策略是否需要调整？
```
