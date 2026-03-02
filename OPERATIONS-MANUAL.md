# GEO + SEO 实施操作手册

## 快速开始：新客戶 onboarding 流程

### Day 0: 客户信息收集

#### 必须收集的信息清单
```
基础信息:
□ 公司/诊所全称
□ 官网URL
□ 主要服务城市/地区
□ 成立年份
□ 医生/专家资质

业务信息:
□ 主营业务 (具体医美项目)
□ 目标客群 (年龄/性别/收入)
□ 核心竞争优势
□ 典型客户案例

现有资产:
□ 现有网站后台权限
□ Google Business Profile
□ 社交媒体账号
□ 现有内容素材

目标设定:
□ 3个月目标 (具体数字)
□ 6个月目标
□ 主要竞争对手 (3-5家)
□ 目标关键词 (客户自填)
```

---

## Phase 1: 双维度诊断 (Day 1-2)

### Step 1.1: SEO技术审计

```bash
# 运行技术审计脚本
./scripts/seo-tech-audit.sh [website_url]

# 输出:
# - tech-score.json (技术评分)
# - issues-list.md (问题清单)
# - priority-fixes.md (优先修复项)
```

**手工检查项**:
```
1. 网站速度 (GTmetrix)
   - 目标: LCP < 2.5s, FID < 100ms, CLS < 0.1
   
2. 移动适配 (Google Mobile-Friendly Test)
   - 必须是Mobile-First
   
3. Schema标记 (Google Rich Results Test)
   - 检查现有标记
   - 识别缺失标记
   
4. 索引状态 (Google Search Console)
   - 索引页面数
   - 覆盖率问题
   - 核心网页指标
```

### Step 1.2: 关键词研究

```bash
# 运行关键词研究
./scripts/keyword-research.sh [business_name] [location]

# 输入: 业务描述 + 地域
# 输出: keyword-matrix.csv
```

**关键词矩阵模板**:
```csv
keyword,search_volume,seo_difficulty,geo_potential,current_rank,competitor_avg_rank,strategy
"botox houston",2400,45,high,not ranked,3-5,create pillar page
"best med spa houston",880,38,high,not ranked,2-4,target both seo+geo
"facial treatment near me",1600,32,medium,not ranked,1-3,local seo focus
```

### Step 1.3: 竞品逆向工程

```bash
# 运行竞品分析
./scripts/competitor-analysis.sh [competitor1_url] [competitor2_url]

# 输出:
# - competitor-profile.json
# - backlink-sources.csv
# - content-gap-analysis.md
```

**竞品分析维度**:
```
1. 排名页面分析
   - URL结构
   - 内容长度
   - 关键词密度
   - 更新频率

2. 外链分析 (Ahrefs)
   - 外链总数
   - 高质量外链来源
   - 锚文本分布
   - 外链增长速度

3. 内容策略
   - 热门内容主题
   - 内容格式 (视频/图文/FAQ)
   - 发布频率
```

### Step 1.4: AI引用诊断

```bash
# 运行GEO诊断
./scripts/geo-audit.sh [business_name]

# 检查:
# - Perplexity引用
# - ChatGPT知识准确性
# - Google SGE引用
# - 知识图谱存在性
```

**手工检查**:
```
1. Perplexity搜索测试
   搜索: "best [service] in [location]"
   检查: 品牌是否被引用
   
2. ChatGPT知识测试
   提问: "What do you know about [business name]?"
   检查: 信息准确性和完整性
   
3. Google搜索 "[business name]"
   检查: Knowledge Panel是否存在
```

---

## Phase 2: 策略制定 (Day 3-5)

### Step 2.1: 双维度策略书

**模板**:
```markdown
# [Client Name] 双维度优化策略书

## 诊断总结
- SEO现状评分: [X]/100
- GEO现状评分: [Y]/100
- 主要问题: [Top 3]

## 关键词策略
| 优先级 | 关键词 | SEO目标 | GEO目标 | 内容策略 |
|--------|--------|---------|---------|----------|
| P0 | ... | Top 5 | AI引用 | Pillar Page |

## 3个月执行计划
### Month 1
- Week 1-2: 技术优化
- Week 3-4: 内容创建

### Month 2
- Week 5-6: 权威建设
- Week 7-8: 本地SEO

### Month 3
- Week 9-10: AI优化
- Week 11-12: 监控迭代

## 预期效果
- SEO: [具体数字]
- GEO: [具体数字]
- 流量: [具体数字]
```

### Step 2.2: 内容规划表

```bash
# 生成内容日历
./scripts/content-calendar.sh [keyword_matrix.csv]

# 输出: content-calendar.xlsx
```

**内容规划模板**:
```
Week 1: Pillar Page - "Complete Guide to [Service] in [Location]"
Week 2: Service Page - "[Service] Benefits and Cost"
Week 3: FAQ Page - "Top 10 Questions About [Service]"
Week 4: Location Page - "[Service] Near [Neighborhood]"
```

---

## Phase 3: 优化执行 (Day 6-20)

### Step 3.1: 技术优化执行

**Day 6-7: Schema部署**
```bash
# 生成Schema代码
./scripts/generate-schema.sh [business_info.json]

# 输出文件:
# - schema-localbusiness.json
# - schema-faq.json
# - schema-service.json
```

**部署清单**:
```
□ LocalBusiness Schema (首页)
□ Service Schema (服务页面)
□ FAQ Schema (FAQ页面)
□ Breadcrumb Schema (导航)
□ Review Schema (评价页面)
□ HowTo Schema (操作指南)
```

**Day 8-9: 页面速度优化**
```bash
# 运行速度优化
./scripts/speed-optimize.sh [website_url]

# 自动优化:
# - 图片压缩
# - 代码压缩
# - 缓存配置
```

**Day 10: 索引优化**
```bash
# 生成优化后的sitemap
./scripts/generate-sitemap.sh

# 提交到:
# - Google Search Console
# - Bing Webmaster Tools
```

### Step 3.2: 内容创建执行

**内容创作流程**:
```bash
# 1. 生成内容大纲
./scripts/generate-outline.sh [keyword] [content_type]

# 2. AI辅助写作
./scripts/ai-write.sh [outline.md] [tone_style]

# 3. 人工审核优化
# 4. SEO优化检查
./scripts/seo-check.sh [content.html]

# 5. GEO优化检查  
./scripts/geo-check.sh [content.html]

# 6. 发布
```

**内容质量标准**:
```
SEO检查清单:
□ 标题包含主关键词 (60字符内)
□ H1标签存在且唯一
□ 关键词密度 1-2%
□ 内链3-5个
□ 外链1-2个权威来源
□ 图片ALT标签
□ 元描述150字符内

GEO检查清单:
□ 直接回答在首段 (30-50字)
□ 关键数据突出显示
□ 权威引用标注
□ 结构化格式 (表格/列表)
□ E-E-A-T信号 (专家背书)
```

### Step 3.3: 权威建设执行

**外链建设策略**:
```
Week 1-2: 本地引用
□ Google Business Profile优化
□ Yelp, Healthgrades等医疗目录
□ 本地商会/协会

Week 3-4: 行业媒体
□ 医疗行业博客投稿
□ 专家采访安排
□ 案例研究发布

Week 5-6: 高质量外链
□ DA>50网站投稿
□ 大学医院合作
□ 行业协会背书
```

---

## Phase 4: 监控体系 (持续)

### Step 4.1: 自动化监控部署

```bash
# 部署监控脚本
./scripts/setup-monitoring.sh [client_id]

# 配置:
# - 每日排名检查 (06:00)
# - 每周AI引用扫描 (周一08:00)
# - 每月全面审计 (每月1日)
```

**监控Dashboard**:
```
访问: https://dashboard.gspr-hub.site
功能:
- 实时排名追踪
- AI引用监控
- 竞品动态
- 技术健康度
- 自动生成报告
```

### Step 4.2: 周报生成

```bash
# 手动生成周报
./scripts/generate-weekly-report.sh [client_id]

# 自动发送邮件
./scripts/send-report.sh [client_email] [report.pdf]
```

**周报内容**:
```
1. 本周执行摘要
2. 关键词排名变化
3. 流量数据
4. AI引用更新
5. 技术问题修复
6. 下周计划
```

---

## Phase 5: 迭代优化 (Monthly)

### Step 5.1: 月度复盘

**复盘会议议程**:
```
1. 数据回顾 (15分钟)
   - KPI达成率
   - 排名变化趋势
   - 流量增长曲线

2. 问题分析 (15分钟)
   - 未达目标原因
   - 竞品新动作
   - 算法更新影响

3. 策略调整 (20分钟)
   - 下月重点
   - 资源分配
   - 新机会识别

4. 客户反馈 (10分钟)
   - 询盘质量
   - 转化情况
   - 品牌感知
```

### Step 5.2: 策略迭代

**迭代决策树**:
```
如果排名下降:
  ├─ 检查技术问题 → 修复
  ├─ 分析竞品动作 → 应对
  └─ 内容质量评估 → 优化

如果AI引用减少:
  ├─ 检查内容准确性 → 更新
  ├─ 增强权威背书 → 建设
  └─ 知识图谱优化 → 提交

如果流量增长但转化低:
  ├─ 分析用户意图 → 调整内容
  ├─ 优化落地页 → A/B测试
  └─ 检查加载速度 → 技术优化
```

---

## 附录：快速参考

### 常用命令
```bash
# 新客戶 onboarding
./scripts/onboarding.sh [client_name] [website]

# 运行完整分析
./scripts/full-analysis.sh [client_id]

# 生成优化包
./scripts/generate-optimization-package.sh [client_id]

# 部署优化
./scripts/deploy-optimizations.sh [client_id]

# 生成报告
./scripts/generate-report.sh [client_id] [weekly|monthly]
```

### 应急处理
```
网站被黑:
1. 立即暂停优化
2. 扫描恶意代码
3. 修复漏洞
4. 重新提交索引
5. 监控恢复情况

排名大幅下降:
1. 检查算法更新
2. 分析技术问题
3. 检查外链异常
4. 提交reconsideration(如被惩罚)

AI引用错误:
1. 纠正事实错误
2. 增强权威来源
3. 更新知识图谱
4. 监控修正情况
```

---

**手册版本**: v1.0  
**最后更新**: 2026-03-02  
**执行周期**: 3个月标准流程
