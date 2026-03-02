# 🏰 护城河核心系统 v1.2 - 真实数据接入

## 当前状态

| 组件 | 状态 | 说明 |
|------|------|------|
| **GEO分析引擎** | ✅ | 评分算法 + Schema生成 |
| **数据库** | ✅ | Supabase集成，数据持久化 |
| **Apify抓取** | ✅ | 真实Google Maps数据 |
| **SERP监控** | ✅ | 排名追踪 |
| **CLI界面** | ✅ | 统一命令入口 |

## 快速开始

### 1. 安装
```bash
cd core-engine
npm install
```

### 2. 配置 (可选，但推荐)

**数据库 (Supabase)**
```bash
# 1. 创建 .env 文件
cp .env.example .env

# 2. 填入 Supabase 信息
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# 3. 测试连接
npm run test-db
```

**Apify (真实数据)**
```bash
# 1. 获取 token: https://console.apify.com
# 2. 添加到 .env
APIFY_TOKEN=your-apify-token

# 3. 测试连接
npm run test-apify
```

### 3. 运行

**Demo模式** (无API配置，模拟数据)
```bash
./geo.js onboard "Garcia Immigration Law" "1234 Main St, Houston, TX"
```

**Live模式** (有Apify，真实数据)
```bash
./geo.js onboard "Garcia Immigration Law" "1234 Main St, Houston, TX"
# 自动从Google Maps抓取真实数据
```

## 命令

```bash
# 客户接入
./geo.js onboard "Firm Name" "Address"

# 系统状态
./geo.js status

# 测试连接
npm run test-db      # 测试数据库
npm run test-apify   # 测试Apify

# 排名监控
./geo.js monitor add "client_id" "keyword"
./geo.js monitor run
./geo.js monitor report "client_id"

# 竞品追踪
./geo.js competitor add "client_id" "Competitor Name" "Address"
./geo.js competitor analyze "client_id"
```

## 架构

```
┌─────────────────────────────────────────────────────────┐
│  CLI (geo.js)                                           │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  GEO Engine │  │   Monitor   │  │ Competitor  │     │
│  │  (run.js)   │  │ (monitor.js)│  │(competitor.js)    │
│  └──────┬──────┘  └─────────────┘  └─────────────┘     │
├─────────┼───────────────────────────────────────────────┤
│  ┌──────┴──────┐  ┌─────────────┐                       │
│  │  Apify API  │  │  Supabase   │                       │
│  │  (真实数据)  │  │   (数据库)   │                       │
│  └─────────────┘  └─────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

## 渐进式模式

| 配置 | 数据 | 存储 |
|------|------|------|
| 无 | 模拟数据 | 本地文件 |
| Apify | 真实Google Maps | 本地文件 |
| Supabase | 模拟/真实 | 数据库 |
| Apify + Supabase | 真实Google Maps | 数据库 + 本地 |

## 成本

| 组件 | 月费用 |
|------|--------|
| DigitalOcean | $5 |
| Supabase (免费档) | $0 |
| Apify | ~$40 (按量) |
| **总计** | **$45-50** |

## Git

```
4c679ca Apify集成: 真实Google Maps数据抓取, SERP排名抓取
9cd6664 数据库接入: Supabase集成,数据持久化
28dba2d 护城河完整系统: CLI + 监控 + 定时任务
```

## 下一步

1. ✅ 数据库接入
2. ✅ Apify真实数据
3. ⏳ 排名监控自动化 (定时任务)
4. ⏳ 竞品追踪自动化
5. ⏳ 报告生成器

---

**系统已支持真实数据抓取。配置 APIFY_TOKEN 启用。**
