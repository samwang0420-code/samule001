# GEO + SEO 双维度优化平台

## 🎯 系统概述

这是一个专为**医疗美容**和**牙科**行业设计的**SEO + GEO 双维度优化平台**，实现了完整的闭环工作流程：

```
问卷收集 → 双维度诊断 → 策略制定 → 优化执行 → 持续监控 → 效果评估
```

## 🏥 支持行业

| 行业 | 状态 | 专用模板 |
|------|------|----------|
| **医疗美容** (Medical Spa) | ✅ 完整支持 | Schema/内容/GMB |
| **牙科** (Dentistry) | ✅ 完整支持 | Schema/内容/GMB |
| **皮肤科** (Dermatology) | ✅ 支持 | 通用模板 |
| **整形外科** (Plastic Surgery) | ✅ 支持 | 通用模板 |

### 牙科行业特殊配置
- **Dentist Schema** - 完整的牙科业务结构化数据
- **Dental Service Schema** - 种植牙/Invisalign/美白等服务标记
- **YMYL合规** - 符合医疗健康内容标准
- **紧急牙科** - 24/7服务页面模板
- **保险集成** - 保险接受页面和FAQ

**查看完整牙科指南**: [DENTAL-INDUSTRY-GUIDE.md](./DENTAL-INDUSTRY-GUIDE.md)

## 📚 核心文档

| 文档 | 说明 |
|------|------|
| [METHODOLOGY-GEO-SEO.md](./METHODOLOGY-GEO-SEO.md) | 双维度优化方法论 |
| [OPERATIONS-MANUAL.md](./OPERATIONS-MANUAL.md) | 操作执行手册 |
| [SYSTEM-AUDIT-FULL.md](./SYSTEM-AUDIT-FULL.md) | 系统功能检查报告 |

## 🚀 快速开始

### 1. 登录系统
```
https://dashboard.gspr-hub.site/login.html

默认账号: admin@geo.local
默认密码: admin123
```

### 2. 新客戶 Onboarding
```bash
cd core-engine
./scripts/full-analysis.sh [website] [business_name] [location]

# 示例
./scripts/full-analysis.sh \
  "https://medspahouston.com" \
  "Houston Medical Spa" \
  "Houston, TX"
```

### 3. 查看分析结果
```
Dashboard → Clients → View
```

### 4. 生成部署包
```bash
./scripts/deploy-optimizations.sh [client_id]
```

### 5. 设置监控
```bash
# 每日监控
./scripts/monitor.sh daily

# 每周监控
./scripts/monitor.sh weekly

# 生成周报
./scripts/generate-weekly-report.sh [client_id]
```

## 🏗️ 系统架构

### 后端 API
```
POST /api/auth/login          # 用户登录
POST /api/analyze             # 提交问卷分析
GET  /api/clients             # 客户列表
GET  /api/clients/:id         # 客户详情
POST /api/execute             # 执行优化
```

### 数据流
```
问卷提交 → Supabase数据库 → 文件备份
                ↓
         异步分析处理
                ↓
         客户记录创建
                ↓
         Dashboard展示
```

### 技术栈
- **后端**: Node.js + Express
- **数据库**: Supabase (PostgreSQL)
- **前端**: HTML + Tailwind CSS + Chart.js
- **认证**: JWT
- **部署**: systemd + Caddy

## 📊 双维度优化框架

### SEO维度 (搜索引擎优化)
```
技术SEO (30%)
├── 网站速度优化
├── Schema标记
├── 移动适配
└── 索引覆盖率

内容SEO (40%)
├── 关键词策略
├── 内容质量
├── E-E-A-T信号
└── 语义相关性

权威SEO (30%)
├── 外链质量
├── 品牌提及
├── 本地引用
└── 行业权威度
```

### GEO维度 (生成引擎优化)
```
AI可见性 (50%)
├── Perplexity引用
├── ChatGPT知识
├── Google SGE
└── 其他AI平台

知识图谱 (30%)
├── Google Knowledge Panel
├── 结构化数据
├── 实体关联度
└── 品牌实体化

可信度信号 (20%)
├── 专家背书
├── 权威引用
├── 用户评价
└── 案例研究
```

## 🔧 实施流程

### Phase 1: 诊断 (Day 1-2)
- [ ] SEO技术审计
- [ ] 关键词研究
- [ ] 竞品逆向工程
- [ ] AI引用诊断

**输出**: 《双维度诊断报告》

### Phase 2: 策略 (Day 3-5)
- [ ] 关键词矩阵制定
- [ ] 内容策略规划
- [ ] 技术优化路线图
- [ ] 权威建设方案

**输出**: 《双维度优化策略书》

### Phase 3: 执行 (Day 6-20)
- [ ] Schema部署
- [ ] 内容创建
- [ ] 外链建设
- [ ] GMB优化

**输出**: 《部署文件包》

### Phase 4: 监控 (持续)
- [ ] 每日排名检查
- [ ] 每周AI扫描
- [ ] 每月全面审计

**输出**: 《监控仪表盘》+ 《周报》

### Phase 5: 迭代 (Monthly)
- [ ] 效果评估
- [ ] 策略调整
- [ ] 新机会识别

**输出**: 《月度复盘报告》

## 📈 成功指标

### 3个月目标
| 指标 | 目标 |
|------|------|
| 核心关键词排名 | 提升 30% |
| AI平台引用率 | 提升 50% |
| 有机流量 | 增长 40% |
| 技术SEO评分 | 58 → 80 |

### 6个月目标
| 指标 | 目标 |
|------|------|
| TOP10关键词 | 数量翻倍 |
| AI平台引用 | 主要平台稳定 |
| 询盘量 | 增长 100% |
| 域名权威度 | 0 → 25 |

## 🛠️ 自动化脚本

| 脚本 | 功能 |
|------|------|
| `full-analysis.sh` | 完整诊断分析 |
| `deploy-optimizations.sh` | 生成部署包 |
| `monitor.sh` | 日常监控 |
| `generate-weekly-report.sh` | 周报生成 |

## 🌐 API文档

### 认证
所有API需要JWT Token:
```bash
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@geo.local","password":"admin123"}'
```

### 提交问卷
```bash
curl -X POST /api/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "website": "https://example.com",
    "businessName": "Example Medical Spa",
    "industry": "medical-spa",
    "keywords": ["botox", "fillers"],
    "contactName": "John Doe",
    "email": "john@example.com"
  }'
```

## 📝 数据库Schema

### 核心表
- `clients` - 客户信息
- `questionnaire_submissions` - 问卷提交
- `analysis_jobs` - 分析任务
- `users` - 系统用户

完整Schema: [supabase/schema-update-questionnaire.sql](./supabase/schema-update-questionnaire.sql)

## 🎓 最佳实践

### 内容创建
1. 直接回答在前30-50字
2. 关键数据突出显示
3. 每段包含可引用语句
4. 添加权威来源标注

### 技术优化
1. LCP < 2.5秒
2. 完整Schema标记
3. Mobile-First设计
4. 核心网页指标达标

### 权威建设
1. DA>50外链优先
2. 本地引用NAP一致
3. 专家背书获取
4. 行业媒体报道

## 🔐 安全配置

- JWT认证保护API
- API Key用于公开接口
- Supabase RLS策略
- 文件存储备份

## 📞 支持

**Dashboard**: https://dashboard.gspr-hub.site

**API Health**: https://dashboard.gspr-hub.site/api/health

---

**版本**: v2.0.0  
**最后更新**: 2026-03-02  
**适用行业**: 医疗美容、本地服务、专业服务
