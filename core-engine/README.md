# 🏰 护城河核心系统 - Core Engine v1.2 (Apify集成)

## 架构
```
输入: 律所名称 + 地址
    ↓
┌─────────────────────────────────────────────────────────┐
│  数据层 (渐进式)                                        │
│    ├── Apify: 真实Google Maps数据 (配置后自动启用)      │
│    └── Demo: 模拟数据 (无API成本)                       │
│                                                         │
│  分析层                                                 │
│    ├── GEO评分算法 (0-100)                              │
│    ├── Schema生成器                                     │
│    └── 排名预测                                         │
│                                                         │
│  存储层 (渐进式)                                        │
│    ├── Supabase: 云端持久化 (配置后自动启用)            │
│    └── 本地: JSON文件输出                               │
└─────────────────────────────────────────────────────────┘
    ↓
输出: Schema代码 + 部署指南 + 数据文件
```

## 两种运行模式

### 模式 1: Demo (零成本)
```bash
# 无需任何配置
./geo.js onboard "Garcia Immigration Law" "1234 Main St, Houston, TX"
```
使用模拟数据，测试工作流。

### 模式 2: Live (真实数据)
```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 添加 APIFY_TOKEN

# 2. 运行
./geo.js onboard "Garcia Immigration Law" "1234 Main St, Houston, TX"
```
自动使用真实Google Maps数据。

## 快速开始

### 1. 安装
```bash
cd core-engine
npm install
```

### 2. 测试连接
```bash
# 测试 Apify (真实数据)
./geo.js test-apify

# 测试数据库 (持久化)
./geo.js test-db
```

### 3. 运行分析
```bash
# Demo 模式 (无需配置)
./geo.js onboard "Firm Name" "Address"

# Live 模式 (需要 APIFY_TOKEN)
./geo.js onboard "Firm Name" "Address"
```

## 命令

| 命令 | 用途 |
|------|------|
| `./geo.js onboard "Firm" "Address"` | 新客户接入 |
| `./geo.js status` | 系统状态 |
| `./geo.js report "client_id"` | 生成报告 |
| `./geo.js test-apify` | 测试Apify连接 |
| `./geo.js test-db` | 测试数据库连接 |
| `./geo.js monitor add "client" "keyword"` | 添加关键词追踪 |
| `./geo.js competitor add "client" "name" "address"` | 添加竞争对手 |

## 环境配置

### 必需 (用于Live模式)
```bash
# .env
APIFY_TOKEN=your_apify_token_here
```

获取: https://apify.com

### 可选 (用于数据持久化)
```bash
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

获取: https://supabase.com

## 特点

### ✅ 渐进式集成
- 零配置即可运行 (Demo模式)
- 配置APIFY后自动升级 (Live模式)
- 配置Supabase后自动持久化
- 平滑迁移，无停机

### ✅ 成本可控
- Demo模式: $0/月
- Live模式: ~$50/月 (Apify $40 + 服务器 $5 + DB $0)

### ✅ 数据质量
- Demo: 快速测试，无需成本
- Live: 真实Google Maps数据，精确坐标，真实评论

## Apify数据内容

使用Live模式获取:
- 精确GPS坐标 (建筑级)
- 完整地址信息
- 电话号码、网站、邮箱
- 营业时间
- 用户评论 (文本+评分)
- 商家描述
- 类别标签
- 服务区域

## Git

```
[待提交] Apify集成: 真实数据抓取
```

---

**系统已支持渐进式数据接入。配置 APIFY_TOKEN 启用真实数据。**
