# 🏰 StackMatrices GEO - Core Engine v2.0

**完整的GEO（生成式引擎优化）护城河系统**

---

## ✅ 已完成全部功能（A-D）

### A. 知识图谱 (Knowledge Graph)
- ✅ 移民法本体（签证分类/绿卡途径/人道主义）
- ✅ 实体关系（USCIS/DOL/关键术语）
- ✅ Houston本地上下文（法院/地标/产业）
- ✅ 动态Schema增强

### B. 内容生成器 (Content Generator)
- ✅ Location页面生成
- ✅ FAQ Schema自动生成
- ✅ GMB帖子模板（5种类型）
- ✅ 引用概率优化建议

### C. 部署上线 (Deployment)
- ✅ 一键部署脚本 (`./deploy.sh`)
- ✅ 环境检测和配置
- ✅ Systemd服务配置
- ✅ Cron定时任务

### D. 监控自动化 (Monitoring)
- ✅ 排名变化告警
- ✅ 竞品超越检测
- ✅ 每日/每周自动报告
- ✅ 智能告警系统

---

## 系统架构 v2.0

```
┌─────────────────────────────────────────────────────────────────┐
│                     CORE ENGINE v2.0                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Knowledge      │  │  Citation       │  │  Perplexity     │  │
│  │  Graph          │  │  Engine         │  │  Reverser       │  │
│  │  ─────────      │  │  ─────────      │  │  ─────────      │  │
│  │  • 移民法本体   │  │  • 5因子评分   │  │  • 竞品分析     │  │
│  │  • 实体关系     │  │  • 0-100%概率  │  │  • 引用源分析   │  │
│  │  • 动态Schema   │  │  • 优化建议     │  │  • 策略生成     │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                ▼                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Content Generator                       │   │
│  │  • Location页面  • FAQ Schema  • GMB帖子               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                                │
│           ┌────────────────────┼────────────────────┐           │
│           ▼                    ▼                    ▼           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  Database    │    │  Monitor     │    │  Alert       │     │
│  │  ─────────   │    │  ─────────   │    │  ─────────   │     │
│  │  Supabase    │    │  排名追踪     │    │  智能告警     │     │
│  │  数据持久化   │    │  历史趋势     │    │  自动通知     │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 快速开始

### 1. 安装部署

```bash
cd core-engine
./deploy.sh production
```

### 2. 配置API Keys

```bash
cp .env.example .env
# 编辑 .env 添加:
# - APIFY_TOKEN (必需，真实数据)
# - SUPABASE_URL & SUPABASE_KEY (推荐，数据持久化)
# - BRIGHT_DATA_API_KEY (可选，Perplexity逆向)
```

### 3. 运行测试

```bash
# 测试数据库
npm run test-db

# 测试Apify
npm run test-apify

# 测试完整流程
./geo.js onboard "Garcia Immigration Law" "1234 Main St, Houston, TX"
```

---

## 核心命令

```bash
# 客户接入（完整分析）
./geo.js onboard "Firm Name" "Address"

# 查看状态
./geo.js status

# 排名监控
./geo.js monitor add "client_id" "keyword"
./geo.js monitor run
./geo.js monitor report "client_id"

# 竞品追踪
./geo.js competitor add "client_id" "Competitor Name" "Address"
./geo.js competitor analyze "client_id"

# 告警检查
node lib/alert-system.js check "client_id"
node lib/alert-system.js summary

# 定时任务
./scheduler.sh daily    # 每日检查
./scheduler.sh weekly   # 每周报告
./scheduler.sh now      # 立即执行
```

---

## 输出示例

```
🔥 CORE ENGINE RUNNING
   Firm: Garcia Immigration Law
   Mode: LIVE (Apify real data)

📡 Step 1: Data Collection
   ✓ Real data collected from Google Maps

🧠 Step 2: GEO Analysis
   Score: 82/100
   Current Rank: #5
   Potential Rank: #2

⚡ Step 3: Schema Generation
   ✓ Schema generated

🤖 Step 4: Citation Probability Analysis
   Probability: 75%
   Status: ✅ High

🔍 Step 5: Perplexity Analysis
   Analyzed 5 competitor sources
   Target Probability: 85%

💾 Step 6: Database Storage
   ✓ Saved to database

📁 Step 7: Content Generation
   ✓ Location page generated
   ✓ FAQ Schema created
   ✓ GMB posts generated

📁 Step 8: Local Output
   ✓ Saved to: ./outputs/client_xxx/

╔══════════════════════════════════════════════════════════╗
║                     DELIVERY SUMMARY                     ║
╠══════════════════════════════════════════════════════════╣
║ Client ID:     client_1772422078887                      ║
║ GEO Score:     82/100                                    ║
║ Citation Prob: 75% (High)                                ║
║ Improvement:   +3 positions                              ║
╚══════════════════════════════════════════════════════════╝
```

---

## 输出文件

```
outputs/client_xxx/
├── client.json           # 客户信息
├── raw-data.json         # 原始GMB数据
├── score.json            # GEO评分详情
├── citation.json         # 引用概率分析
├── perplexity.json       # 竞品分析
├── schema.json           # Schema标记
├── content-package.json  # 生成内容包
└── deploy.md             # 部署指南
```

---

## 技术栈

| 组件 | 技术 |
|------|------|
| Runtime | Node.js 18+ |
| Database | Supabase (PostgreSQL) |
| Data Scraping | Apify |
| Reverse Engineering | Bright Data (可选) |
| Automation | Cron + Systemd |

---

## 成本

| 环境 | 月费用 | 说明 |
|------|--------|------|
| Demo | $5 | 服务器 only |
| Live | $45 | + Apify $40 |
| Full | $50 | + Supabase免费档 |

---

## Git

```
ca32f87 A-D全部完成: 知识图谱+内容生成器+部署脚本+监控告警系统
```

---

## 下一步（生产就绪）

1. **配置 API Keys**
   - 获取 Apify Token
   - 创建 Supabase 项目
   - （可选）获取 Bright Data API

2. **部署服务器**
   - DigitalOcean $5 droplet
   - 运行 `./deploy.sh production`

3. **接入第一个客户**
   - 运行 `./geo.js onboard "Firm Name" "Address"`
   - 验证输出

4. **设置监控**
   - Cron自动运行
   - 告警通知（需配置Webhook）

---

**系统已完成，等待API配置上线。**
