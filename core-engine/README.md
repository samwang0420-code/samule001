# 🏰 护城河核心系统 - 完成

## 架构
**CLI工具 + 自动化引擎。没有网站。没有界面。**

```
┌─────────────────────────────────────────────────────────┐
│                    CORE ENGINE v1.0                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ./run.sh "Firm Name" "Address"                         │
│        ↓                                                 │
│   [Data Collection]  ← Apify (或 Demo)                  │
│        ↓                                                 │
│   [GEO Algorithm]     ← 核心IP (评分算法)                │
│        ↓                                                 │
│   [Schema Generator]  ← 输出优化Schema                   │
│        ↓                                                 │
│   ./outputs/client-xxx/                                 │
│        - client.json                                    │
│        - score.json                                     │
│        - schema.json                                    │
│        - deploy.md                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 使用

```bash
cd core-engine
./run.js "Garcia Immigration Law" "1234 Main St, Houston, TX 77002"
```

输出：
- GEO Score (0-100)
- 当前排名 vs 优化后排名
- 生成的 Schema.json
- 部署指南 deploy.md

## 成本
- 服务器：$5/月 (DigitalOcean)
- 抓取：$40/月 (Apify)
- 数据库：$0/月 (Supabase免费档)
- **总计：$50/月**

## 扩展 (n8n)
 workflows/n8n-geo-onboarding.json - 自动化工作流

## 状态
✅ 核心引擎可运行 (Demo模式)
⏳ 需要 APIFY_TOKEN 启用真实数据

## Git
d9bcb04 CORE ENGINE: standalone CLI tool for GEO analysis
