# GEO Core - 精简架构

## 核心文件（保留）

### 1. 入口脚本
- medical-pipeline.js    # 主分析流程
- run.js                 # 兼容旧版调用
- geo.js                 # 兼容旧版调用

### 2. 核心库
- lib/apify.js           # 数据抓取（当前Demo模式）
- lib/auto-implement.js  # 自动执行部署
- lib/db.js             # 数据库（当前文件存储）
- lib/medical-knowledge.js
- lib/medical-content.js
- lib/medical-citation.js
- lib/medical-competition.js
- lib/error-handler.js
- lib/logger.js
- lib/auth-service.js
- lib/api-server.js

### 3. 工具脚本
- monitor.js            # 监控（Scheduler调用）
- scheduler.sh          # 定时任务
- pricing.js            # 定价计算
- test-suite.js         # 测试套件
- deploy.sh             # 部署脚本

### 4. 前端
- public/index.html     # Dashboard
- public/css/enhanced.css

## 废弃文件（已删除）
- lib/content-generator.js
- lib/perplexity-reverser.js
- lib/signal-monitor.js
- lib/outcome-tracker.js
- lib/citation-engine.js
- full-pipeline.js
- evolution.sh
- knowledge-update.js
- setup-database.js
