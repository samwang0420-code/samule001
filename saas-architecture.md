# SaaS-Ready Architecture v1.0

## 架构原则

**"现在为Service建，将来为SaaS用"**

所有组件设计时考虑：
1. **多租户隔离** - 数据层支持client_id隔离
2. **功能开关** - Feature flag控制功能可见性
3. **配额限制** - 防止资源滥用
4. **API优先** - 所有功能可编程调用

---

## 数据模型（多租户预埋）

### 核心实体
```sql
-- 租户/客户表
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'free', -- free, starter, pro, enterprise
    status VARCHAR(50) DEFAULT 'active',
    limits JSONB DEFAULT '{"projects": 1, "api_calls": 100}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 项目表（律所）
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    location GEOGRAPHY(POINT),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 排名数据
CREATE TABLE rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    keyword VARCHAR(255) NOT NULL,
    position INTEGER,
    serp_features JSONB,
    captured_at TIMESTAMP DEFAULT NOW()
);

-- 用户表（多角色）
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'client', -- admin, agency, client, viewer
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security (RLS) 策略
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON projects
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

---

## API设计（REST + GraphQL）

### REST API（面向客户）
```
POST   /v1/auth/login              # 登录
POST   /v1/auth/register           # 注册

GET    /v1/projects                # 项目列表
POST   /v1/projects                # 创建项目
GET    /v1/projects/:id            # 项目详情
PUT    /v1/projects/:id            # 更新项目
DELETE /v1/projects/:id            # 删除项目

POST   /v1/projects/:id/geo-audit  # 运行GEO审计
GET    /v1/projects/:id/rankings   # 获取排名数据
GET    /v1/projects/:id/reports    # 获取报告

POST   /v1/schema/generate         # 生成Schema
POST   /v1/schema/validate         # 验证Schema

GET    /v1/competitors             # 竞品数据
GET    /v1/alerts                  # 警报设置
```

### GraphQL（高级查询）
```graphql
type Query {
  project(id: ID!): Project
  rankings(
    projectId: ID!
    startDate: DateTime
    endDate: DateTime
    keywords: [String!]
  ): [Ranking!]!
  
  geoScore(projectId: ID!): GeoScore!
  competitors(projectId: ID!, radius: Int): [Competitor!]!
}

type Mutation {
  createProject(input: ProjectInput!): Project!
  runGeoAudit(projectId: ID!): AuditResult!
  updateSchema(projectId: ID!, schema: JSON!): Schema!
}
```

---

## 功能分层（Plan-based）

### Free Plan（钩子）
- 1个项目
- 3次/月 GEO Audit
- 基础排名追踪
- 标准报告

### Starter ($49/月)
- 3个项目
- 无限GEO Audit
- 每日排名更新
- Schema生成器
- 邮件警报

### Professional ($149/月)
- 10个项目
- 实时排名追踪
- 竞品监控
- API访问
- 白标报告

### Enterprise ($499/月)
- 无限项目
- 专属服务器
- 定制开发
- SLA保障
- 1对1支持

---

## 自助工具清单

### v2.0阶段开放

#### 1. GEO Score Checker
- 输入：律所名称+地址
- 输出：评分+建议+竞品对比
- 限制：免费3次/月，付费无限

#### 2. Schema生成器
- 输入：律所信息表单
- 输出：JSON-LD代码
- 功能：复制/下载/验证

#### 3. 排名监控看板
- 图表：历史排名趋势
- 表格：关键词明细
- 导出：PDF/Excel

#### 4. 竞品浏览器
- 列表：竞品律所
- 详情：Schema、照片、评论分析
- 对比：并排对比工具

### v3.0阶段开放

#### 5. 工作流编辑器
- 可视化：n8n式拖拽
- 模板：预置常用流程
- 执行：云端自动运行

#### 6. 内容生成器
- AI辅助：Location页面文案
- 多语言：西语/中文版本
- SEO优化：关键词自动插入

#### 7. 知识库搜索
- 全文搜索
- 标签筛选
- 书签功能

---

## 技术栈（SaaS-ready）

### 前端
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind + shadcn/ui
- **State**: TanStack Query (React Query)
- **Auth**: Clerk (多租户支持)

### 后端
- **API**: Next.js API Routes + tRPC
- **Database**: Supabase (PostgreSQL + RLS)
- **Cache**: Upstash Redis
- **Queue**: Inngest / QStash

### 基础设施
- **Hosting**: Vercel (Edge Network)
- **Storage**: Cloudflare R2
- **Monitoring**: Vercel Analytics + LogRocket
- **Billing**: Stripe

---

## 安全设计

### 认证
- JWT + Refresh Token
- MFA支持（企业版）
- SSO (SAML/OIDC)（企业版）

### 授权
- RBAC (Role-Based Access Control)
- ABAC (Attribute-Based)（未来）
- API Key管理

### 数据保护
- 传输：TLS 1.3
- 存储：AES-256
- 备份：每日异地备份

---

## 部署架构

```
┌─────────────────────────────────────────┐
│              Vercel Edge                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  US-East │ │  US-West │ │  Europe │   │
│  └────┬────┘ └────┬────┘ └────┬────┘   │
└───────┼───────────┼───────────┼────────┘
        │           │           │
        └───────────┼───────────┘
                    ▼
        ┌─────────────────────┐
        │    API Gateway       │
        │  (Rate Limit/Auth)   │
        └──────────┬──────────┘
                   ▼
        ┌─────────────────────┐
        │   Next.js API       │
        │   (Serverless)      │
        └──────────┬──────────┘
                   ▼
        ┌─────────────────────┐
        │     Supabase        │
        │  (Postgres + Edge)  │
        └─────────────────────┘
```

---

## 迁移路径

### 阶段1: 现在 (v1.0)
- 单租户硬编码
- 我手动操作数据库
- 客户通过邮件/报告交互

### 阶段2: v1.5 (准备期)
- 添加tenant_id字段
- 保留单租户逻辑
- UI增加登录入口（隐藏）

### 阶段3: v2.0 (试点)
- 启用RLS
- 邀请1-2客户试用
- 收集反馈迭代

### 阶段4: v3.0 (全面开放)
- 公开注册
- 自助订阅
- 社区运营

---

## 关键决策记录

**Decision 2024-03-01**: 使用Supabase RLS而非应用层隔离
- 理由：数据库层强制隔离，更安全
- 代价：复杂查询性能略有下降

**Decision 2024-03-01**: 使用Clerk而非自建Auth
- 理由：快速支持多租户、SSO
- 代价：$25/月起，但节省开发时间

**Decision 2024-03-01**: 先REST后GraphQL
- 理由：REST足够v2.0使用，GraphQL后期按需添加
- 代价：后期需要维护两套API
