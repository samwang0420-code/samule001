# GEO Auto-Iteration Engine

## 概述

自动迭代引擎会定期扫描 `geo_implementation_iterations` 表，自动执行其中的需求，实现系统的自我进化和技能升级。

## 工作原理

```
外部项目扫描行业变化
       ↓
生成需求 → geo_implementation_iterations表
       ↓
自动迭代引擎 (每小时检查)
       ↓
根据category执行不同操作
       ↓
更新系统/文档/流程
       ↓
更新表状态 (backlog → completed)
```

## 表结构

### geo_implementation_iterations

| 字段 | 说明 |
|------|------|
| **管理字段** |
| id | UUID主键 |
| created_at | 创建时间 |
| updated_at | 更新时间 |
| status | backlog/planned/in_progress/completed/cancelled |
| **内容字段** |
| title | 需求标题 |
| description | 详细描述 |
| category | Algorithm/Technical/Content/Strategy |
| priority | critical/high/medium/low |
| **工作量** |
| estimated_hours | 预估工时 |
| actual_hours | 实际工时 |
| **分类** |
| tags[] | 标签 |
| affects[] | 影响范围 (medical/local/ecommerce/technical_seo/content_strategy/ai_optimization/all) |
| **来源追踪** |
| source_type | algorithm_update/breaking_change/feature_release/best_practice/manual |
| source_url | 来源URL |
| source_title | 来源标题 |
| source_publish_date | 发布时间 |
| **实施细节** |
| acceptance_criteria[] | 验收标准 |
| implementation_steps[] | 实施步骤 |
| technical_notes | 技术备注 |
| **项目管理** |
| assigned_to | 分配给 |
| project | 项目 |
| due_date | 截止日期 |
| started_at | 开始时间 |
| completed_at | 完成时间 |
| **风险** |
| risk_level | 风险等级 |
| dependencies[] | 依赖项 |

## 自动处理逻辑

### Algorithm (算法更新)
- 更新评分算法
- 调整权重配置
- 更新方法论文档

### Technical (技术更新)
- Schema模板更新
- API增强
- 数据库优化
- 监控脚本升级

### Content (内容更新)
- 行业模板更新
- 内容策略调整
- 文案模板优化

### Strategy (策略更新)
- 实施手册更新
- 操作流程优化
- 验收标准调整

## 安装和配置

### 1. 安装Systemd服务

```bash
# 复制服务文件
sudo cp core-engine/scripts/geo-iteration.service /etc/systemd/system/

# 重新加载systemd
sudo systemctl daemon-reload

# 启用服务
sudo systemctl enable geo-iteration.service

# 手动运行一次测试
sudo systemctl start geo-iteration.service

# 查看状态
sudo systemctl status geo-iteration.service

# 查看日志
sudo journalctl -u geo-iteration.service -f
```

### 2. 配置Cron定时任务

```bash
# 每小时检查一次
sudo cp core-engine/scripts/geo-iteration.cron /etc/cron.d/geo-iteration
sudo chmod 644 /etc/cron.d/geo-iteration
sudo service cron restart
```

### 3. 手动运行

```bash
cd core-engine
node scripts/auto-iteration-engine.js
```

## 日志位置

- 迭代日志: `/var/log/geo-iteration.log`
- 变更记录: `ITERATION-CHANGELOG.md`
- 摘要记录: `iteration-summaries/summary-{timestamp}.json`

## 监控命令

```bash
# 查看最近的迭代日志
tail -f /var/log/geo-iteration.log

# 查看systemd服务状态
sudo systemctl status geo-iteration

# 查看cron任务
sudo cat /etc/cron.d/geo-iteration

# 查看数据库中的backlog数量
psql -d your_db -c "SELECT COUNT(*) FROM geo_implementation_iterations WHERE status='backlog';"
```

## 示例需求插入

```sql
-- 插入一个算法更新需求
INSERT INTO geo_implementation_iterations (
    title,
    description,
    category,
    priority,
    affects,
    source_type,
    source_url,
    source_title,
    implementation_steps,
    acceptance_criteria
) VALUES (
    'Google Core Update 2024-03: E-E-A-T Enhancement',
    'Google released new core update emphasizing Experience in E-E-A-T. Need to update content templates to include more first-hand experience signals.',
    'Algorithm',
    'high',
    ARRAY['content_strategy', 'all'],
    'algorithm_update',
    'https://developers.google.com/search/blog/2024/03/core-update',
    'March 2024 Core Update',
    ARRAY[
        'Update content templates to include "In our experience" sections',
        'Add case study requirements to medical content',
        'Update content scoring algorithm'
    ],
    ARRAY[
        'All medical content templates include experience sections',
        'Content score calculation updated',
        'Documentation updated'
    ]
);
```

## 自动化规则

引擎会自动根据以下规则执行：

1. **Priority排序**: critical > high > medium > low
2. **时间排序**: 同优先级按创建时间
3. **状态更新**: 
   - backlog → in_progress (开始执行)
   - in_progress → completed (执行成功)
   - in_progress → backlog (执行失败，重试)
4. **工时记录**: 自动计算actual_hours
5. **文档更新**: 自动更新相关文档

## 通知机制

- 每小时执行后输出到日志
- 每日9点发送执行摘要
- 重要更新立即记录到CHANGELOG

## 故障排查

```bash
# 检查服务状态
sudo systemctl status geo-iteration

# 检查日志
tail -100 /var/log/geo-iteration.log

# 检查数据库连接
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fixemvsckapejyfwphft.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
supabase.from('geo_implementation_iterations').select('count').then(console.log);
"

# 手动触发一次迭代
sudo systemctl start geo-iteration
```

## 安全说明

- 所有数据库操作使用Service Role Key
- 脚本运行在隔离的systemd服务中
- 日志定期清理防止磁盘占满
- 失败的操作会回滚到backlog状态

---

**系统版本**: v1.0  
**最后更新**: 2026-03-02
