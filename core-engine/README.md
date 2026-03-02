# 🏰 护城河核心系统 - Core Engine v1.1 (含数据库)

## 架构
```
输入: 律所名称 + 地址
    ↓
┌─────────────────────────────────────────────────────────┐
│  GEO分析引擎 (run.js)                                   │
│    ├── 数据抓取 (Demo/Apify)                            │
│    ├── GEO评分算法 (0-100)                              │
│    ├── Schema生成器                                     │
│    └── 本地输出 (outputs/)                              │
│                                                         │
│  数据库层 (Supabase)                                    │
│    ├── clients (客户信息)                               │
│    ├── geo_audits (审计记录)                            │
│    ├── keywords (关键词)                                │
│    ├── rankings (排名历史)                              │
│    └── competitors (竞争对手)                           │
└─────────────────────────────────────────────────────────┘
    ↓
输出: 可部署的Schema + 优化建议
```

## 快速开始

### 1. 安装依赖
```bash
cd core-engine
npm install
```

### 2. 配置数据库 (可选但推荐)

**步骤 A: 创建 Supabase 项目**
1. 访问 https://supabase.com
2. 创建新项目
3. 复制 Project URL 和 anon key

**步骤 B: 运行数据库脚本**
```bash
# 在 Supabase SQL Editor 中运行:
../supabase/schema-v1.sql
```

**步骤 C: 配置环境变量**
```bash
cp .env.example .env
# 编辑 .env,填入你的 Supabase URL 和 key
```

**步骤 D: 测试连接**
```bash
npm run test-db
```

### 3. 运行

**Demo模式 (无数据库)**
```bash
./geo.js onboard "Garcia Immigration Law" "1234 Main St, Houston, TX 77002"
```

**数据库模式 (有Supabase)**
```bash
# 配置 .env 后
./geo.js onboard "Garcia Immigration Law" "1234 Main St, Houston, TX 77002"
# 数据会自动保存到数据库
```

## 命令

| 命令 | 用途 |
|------|------|
| `./geo.js onboard "Firm" "Address"` | 新客户接入 (自动保存到DB) |
| `./geo.js status` | 系统状态 (显示DB统计) |
| `./geo.js report "client_id"` | 生成报告 |
| `npm run test-db` | 测试数据库连接 |

## 数据结构

### 客户表 (clients)
- id, client_code, firm_name, address
- website, email, phone
- created_at, updated_at

### 审计表 (geo_audits)
- client_id, total_score
- coordinate_precision, parking_accessibility
- schema_markup, local_context
- current_rank, potential_rank
- raw_data (JSONB)

### 关键词表 (keywords)
- client_id, keyword
- location, search_volume, difficulty
- is_active

### 排名表 (rankings)
- keyword_id, position, page
- serp_features, checked_at

## 特点

### ✅ 渐进式集成
- 无DB也能运行 (Demo模式)
- 有DB自动保存
- 零停机迁移

### ✅ 数据持久化
- 客户信息永久存储
- 审计历史可追溯
- 排名变化可分析

### ✅ 可扩展
- 多租户架构预留
- RLS安全策略
- 索引优化查询

## 成本

| 组件 | 成本/月 |
|------|---------|
| DigitalOcean | $5 |
| Supabase (免费档) | $0 |
| Apify (按需) | ~$40 |
| **总计** | **$45-50** |

## 下一步

1. ✅ 数据库接入 (完成)
2. ⏳ Apify真实数据接入 (等待key)
3. ⏳ 排名监控自动化
4. ⏳ 竞品追踪

## Git

```
9cd6664 数据库接入: Supabase集成,数据持久化,连接测试
```

---

**系统已支持数据库存储。等待 APIFY_TOKEN 启用真实数据抓取。**
