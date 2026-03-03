# 🎣 Agentic Probing System - 主动探测AI平台引用

**核心理念**: 不等API，主动出击！用Headless Browser"钓鱼"探测AI平台是否引用客户品牌。

---

## 🚀 3大黑科技

### 1. Agentic Probing (主动钓鱼)
- **原理**: 用Playwright模拟真实用户，向ChatGPT/Claude/Gemini提问
- **动作**: 每天自动问50个核心关键词问题
- **解析**: 提取回答中的品牌提及、引用气泡、外链

### 2. Semantic Fingerprinting (语义指纹识别)
- **原理**: 在客户网站埋入独特数据点(如"96.73%成功率")
- **检测**: 如果AI回答中出现这些独特数据，说明已"内化"品牌内容
- **价值**: 证明内容已进入AI的RAG或训练权重

### 3. Bing Proxy Strategy (代理监控)
- **原理**: SearchGPT底层依赖Bing索引
- **逻辑**: Bing Top 3 = 90% SearchGPT引用概率
- **动作**: 监控Bing排名，预测SearchGPT可见度

---

## 📦 组件清单

| 文件 | 功能 |
|------|------|
| `lib/ai-probing-agent.js` | Playwright探测Agent |
| `lib/semantic-fingerprint.js` | 指纹生成与检测 |
| `lib/bing-proxy-monitor.js` | Bing排名监控 |
| `supabase/add-agentic-probing-schema.sql` | 数据库表结构 |

---

## 🔧 部署步骤

### Step 1: 执行数据库迁移

```bash
# 连接到Supabase数据库
psql $SUPABASE_URL -f supabase/add-agentic-probing-schema.sql
```

创建以下表:
- `ai_probing_results` - AI探测结果
- `semantic_fingerprints` - 语义指纹配置
- `bing_monitoring_results` - Bing监控结果
- `ai_visibility_scores` - 综合可见度评分
- `probing_jobs` - 探测任务队列

### Step 2: 安装Playwright

```bash
cd core-engine
npm install playwright
npx playwright install chromium
```

### Step 3: 配置环境变量

```bash
# .env 添加
BING_API_KEY=your_bing_search_api_key
CHATGPT_PROFILE=chatgpt_login_state  # 可选，用于保持登录
```

### Step 4: 重启API服务

```bash
systemctl restart geo-dashboard
```

---

## 📡 API端点

### 1. 触发AI探测
```bash
POST /api/probing/:clientId/trigger
Content-Type: application/json
Authorization: Bearer {token}

{
  "platforms": ["perplexity", "chatgpt", "claude"]
}
```

### 2. 获取探测历史
```bash
GET /api/probing/:clientId/history?limit=10
Authorization: Bearer {token}
```

### 3. 生成语义指纹
```bash
POST /api/probing/:clientId/fingerprints
Authorization: Bearer {token}
```

响应:
```json
{
  "success": true,
  "fingerprints": [
    {
      "type": "statistic",
      "value": "96.73%",
      "phrase": "Our clinic achieves a 96.73% success rate"
    }
  ],
  "embedInstructions": {
    "statistic": "Our clinic achieves a 96.73% success rate",
    "terminology": "Using our proprietary PrecisionFlow-A3F2 technique"
  }
}
```

### 4. 触发Bing监控
```bash
POST /api/probing/:clientId/bing-monitor
Content-Type: application/json

{
  "keywords": ["best botox houston", "med spa near me"]
}
```

### 5. 获取综合可见度评分
```bash
GET /api/probing/:clientId/visibility-score
Authorization: Bearer {token}
```

响应:
```json
{
  "success": true,
  "data": {
    "overall_score": 72,
    "perplexity_score": 80,
    "searchgpt_score": 75,
    "chatgpt_score": 65,
    "claude_score": 60,
    "gemini_score": 70,
    "trend": "improving"
  }
}
```

---

## 🎯 使用场景

### 场景1: 新客户上线检测
```bash
# 1. 生成语义指纹
curl -X POST /api/probing/client-123/fingerprints

# 2. 获取指纹并埋入客户网站
# (手动或自动部署到客户网站)

# 3. 等待1-2周后触发探测
curl -X POST /api/probing/client-123/trigger

# 4. 查看AI是否已"记住"品牌
curl /api/probing/client-123/history
```

### 场景2: 竞争对手监控
```bash
# 监控竞品的Bing排名，预测SearchGPT可见度
# (需要在数据库中手动添加竞品数据)
```

### 场景3: 周报自动化
```bash
# 设置定时任务，每周探测一次
echo "0 9 * * 1 /usr/bin/node /path/to/ai-probing-agent.js client-123" | crontab
```

---

## 🔍 探测策略详解

### Perplexity探测
```javascript
// 最可靠，有明确的引用来源
- 直接抓取搜索结果页面
- 提取source列表
- 检查客户URL是否在列表中
```

### ChatGPT探测
```javascript
// 对话式，需模拟用户
- 登录ChatGPT账号 (或免登录模式)
- 发送问题: "Who is the best X in Y?"
- 解析回答中的品牌提及
- 检测语义指纹匹配
```

### SearchGPT探测
```javascript
// 有引用气泡，类似Perplexity
- 启用搜索模式
- 抓取回答中的引用气泡
- 提取链接
```

### Claude探测
```javascript
// 需登录，支持Artifacts
- 登录Claude账号
- 发送查询
- 检查Artifacts中的链接
- 语义指纹匹配
```

### Gemini探测
```javascript
// 集成Google搜索
- 抓取底部来源链接
- 检查知识面板
```

---

## 📊 数据解读

### 可见度评分等级
| 分数 | 等级 | 说明 |
|------|------|------|
| 90-100 | 卓越 | AI高频引用，品牌已成为行业标杆 |
| 70-89 | 良好 | 有稳定引用，需持续优化 |
| 50-69 | 一般 | 偶尔被引用，需加强内容建设 |
| 30-49 | 较弱 | 很少被引用，需系统性GEO优化 |
| 0-29 | 缺失 | 几乎无AI可见度，急需干预 |

### 趋势指标
- **improving**: 引用数增加，策略有效
- **stable**: 维持现状，需新动作
- **declining**: 引用数下降，需检查

---

## ⚠️ 注意事项

### 1. 反爬虫风险
- **问题**: 频繁探测可能触发平台反爬虫
- **对策**: 
  - 随机延迟 (30-60秒)
  - 使用代理IP轮换
  - 限制每天探测次数
  - 使用Bit浏览器矩阵

### 2. 登录状态
- **ChatGPT/Claude**: 需要登录，需手动导出登录状态
- **导出方法**: Playwright的 `context.storageState()`

### 3. 成本考量
- **Playwright**: 本地运行，免费
- **代理IP**: 可能需付费 (Bright Data等)
- **Bing API**: 每月1000次免费，超出付费

### 4. 法律合规
- 遵守各平台ToS
- 不要过度频繁请求
- 仅用于自己客户的监控

---

## 🔮 未来增强

### Phase 2
- [ ] 自动指纹埋入 (通过CMS API)
- [ ] 多账号矩阵探测
- [ ] 图像识别 (检测引用截图)

### Phase 3
- [ ] 机器学习预测模型
- [ ] 自动优化建议生成
- [ ] 竞品AI可见度对比

---

## 📈 商业价值

### 客户展示
> "虽然ChatGPT没有给你链接，但我们通过语义指纹检测到，AI的回答中包含了你网站独有的'96.73%成功率'数据，证明你的内容已被AI内化。"

### 收费建议
| 服务 | 定价 |
|------|------|
| AI可见度检测 | $200/次 |
| 语义指纹部署 | $500/套 |
| 月度监控报告 | $300/月 |
| 竞品AI监控 | $500/月 |

---

**这不是等待，这是主动出击！** 🎯
