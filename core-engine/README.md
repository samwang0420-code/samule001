# 🏰 护城河核心系统 - Core Engine v1.0

## 架构
**CLI工具 + 自动化引擎。没有网站。没有界面。**

```
./geo.js onboard "Firm Name" "Address"
        ↓
┌─────────────────────────────────────────────────────────┐
│  [GEO Analysis]    Score calculation (0-100)            │
│  [Schema Gen]      Optimized JSON-LD output             │
│  [Rank Monitor]    Keyword tracking setup               │
│  [Competitor]      Competition tracking                 │
└─────────────────────────────────────────────────────────┘
        ↓
./outputs/client_xxx/
  ├── score.json      # GEO Score breakdown
  ├── schema.json     # Deployable Schema markup
  ├── deploy.md       # Action checklist
  └── client.json     # Metadata
```

## 快速开始

```bash
cd core-engine

# 1. Onboard new client
./geo.js onboard "Garcia Immigration Law" "1234 Main St, Houston, TX 77002"

# 2. Check system status
./geo.js status

# 3. Generate client report
./geo.js report "client_1772389766088"

# 4. Daily monitoring (cron)
./scheduler.sh daily
```

## 命令

| 命令 | 用途 |
|------|------|
| `./geo.js onboard "Firm" "Address"` | 完整客户接入 |
| `./geo.js report "client_id"` | 生成报告 |
| `./geo.js status` | 系统状态 |
| `./geo.js monitor add "client" "keyword"` | 添加关键词追踪 |
| `./geo.js competitor add "client" "name" "address"` | 添加竞品 |
| `./monitor.js run` | 检查所有排名 |
| `./monitor.js report "client"` | 排名报告 |
| `./competitor.js analyze "client"` | 竞品分析 |
| `./scheduler.sh daily` | 每日自动检查 |
| `./scheduler.sh weekly` | 每周报告 |

## 自动化 (Cron)

```bash
# 每日早6点检查排名
crontab -e
0 6 * * * cd /path/to/core-engine && ./scheduler.sh daily

# 每周一早8点生成报告
0 8 * * 1 cd /path/to/core-engine && ./scheduler.sh weekly
```

## 成本

| 组件 | 成本/月 |
|------|---------|
| DigitalOcean droplet | $5 |
| Apify (SERP scraping) | $40 |
| Supabase (DB) | $0 |
| **总计** | **$50** |

## 文件结构

```
core-engine/
├── geo.js                 # 主控命令
├── run.js                 # GEO分析引擎
├── monitor.js             # 排名监控
├── competitor.js          # 竞品追踪
├── scheduler.sh           # 定时任务
├── scrapers/
│   └── geo-scraper.js     # 数据抓取逻辑
├── workflows/
│   └── n8n-geo-onboarding.json  # n8n自动化
├── data/                  # 运行时数据
│   ├── tracked-keywords.json
│   └── competitors.json
├── outputs/               # 客户交付目录
│   └── client_xxx/
├── logs/                  # 日志
└── README.md
```

## 模式

### Demo模式 (默认)
- 无需API key
- 模拟数据
- 测试工作流

### Live模式
```bash
export APIFY_TOKEN=your_token
./geo.js onboard "Firm Name" "Address"  # 使用真实数据
```

## 扩展

### n8n工作流
导入 `workflows/n8n-geo-onboarding.json` 实现:
- 自动数据抓取
- Slack通知
- 数据库存储

### 数据库 (Supabase)
运行 `../supabase/schema.sql` 创建表结构

## 输出示例

```
🔥 CORE ENGINE RUNNING
   Firm: Garcia Immigration Law
   Mode: DEMO (simulated)

📊 Step 1: GEO Analysis
   Score: 77/100
   Current Rank: #3
   Potential Rank: #9
   Improvement: +6 positions

⚡ Step 2: Schema Generation
   ✓ Schema generated

💾 Step 3: Save Outputs
   ✓ Saved to: ./outputs/client_1772389766088
```

## Git

```
ce2b5e0 护城河核心系统文档
d9bcb04 CORE ENGINE: standalone CLI tool
```

## 状态

✅ 核心引擎可运行 (Demo模式)  
✅ 排名监控  
✅ 竞品追踪  
✅ 定时任务  
✅ 统一CLI界面  
⏳ 需要 APIFY_TOKEN 启用真实数据
