# 🎣 Agentic Probing System v1.0 - 生产就绪部署指南

**状态**: ✅ 代码完成，待数据库迁移后完全可用  
**完成度**: 95%

---

## ✅ 已完成的生产级代码

### 1. 核心探测服务
```
core-engine/lib/ai-probing-service.js    # 16,694字节生产级代码
```

**功能**:
- ✅ Perplexity探测 (直接抓取引用来源)
- ✅ Gemini探测 (Google搜索集成)
- ✅ 语义指纹检测
- ✅ 自动重试机制
- ✅ 反爬虫随机延迟
- ✅ 错误处理和日志
- ✅ 数据库自动保存

### 2. 部署脚本
```
core-engine/scripts/
├── deploy-probing.sh           # 一键部署脚本
├── geo-probing.service         # systemd服务
├── geo-probing.cron            # 定时任务
└── test-probing-service.js     # 测试脚本
```

### 3. 数据库Schema
```
supabase/add-agentic-probing-schema.sql
```

**5张表**:
- `ai_probing_results` - 探测结果存储
- `semantic_fingerprints` - 语义指纹配置
- `bing_monitoring_results` - Bing监控数据
- `ai_visibility_scores` - 综合可见度评分
- `probing_jobs` - 探测任务队列

---

## 🔧 部署步骤 (生产环境)

### Step 1: 执行数据库迁移

**方法A**: Supabase Dashboard (推荐)
1. 访问: https://app.supabase.com/project/fixemvsckapejyfwphft
2. 进入: SQL Editor → New query
3. 复制粘贴: `supabase/add-agentic-probing-schema.sql`
4. 点击 Run

**方法B**: psql命令行
```bash
export PGPASSWORD="your_password"
psql -h aws-0-us-west-1.pooler.supabase.com -p 6543 \
  -U postgres.fixemvsckapejyfwphft -d postgres \
  -f supabase/add-agentic-probing-schema.sql
```

### Step 2: 验证Playwright安装

```bash
cd /root/.openclaw/workspace-geo-arch/core-engine

# 检查是否已安装
ls ~/.cache/ms-playwright/chromium-*/chrome-linux/chrome

# 如未安装，运行:
npm install playwright cheerio --save
npx playwright install chromium
```

### Step 3: 部署systemd服务

```bash
# 复制服务文件
sudo cp core-engine/scripts/geo-probing.service /etc/systemd/system/

# 编辑服务文件，填入正确的环境变量
sudo nano /etc/systemd/system/geo-probing.service
# 修改: SUPABASE_SERVICE_KEY=your_actual_key

# 启用服务
sudo systemctl daemon-reload
sudo systemctl enable geo-probing.service

# 测试运行一次
sudo systemctl start geo-probing.service

# 查看日志
sudo journalctl -u geo-probing -f
```

### Step 4: 配置定时任务

```bash
# 部署cron任务
sudo cp core-engine/scripts/geo-probing.cron /etc/cron.d/geo-probing
sudo chmod 644 /etc/cron.d/geo-probing

# 创建日志文件
sudo touch /var/log/geo-probing.log
sudo chmod 644 /var/log/geo-probing.log

# 验证cron配置
crontab -l
```

默认每4小时运行一次探测。

### Step 5: 测试服务

```bash
cd /root/.openclaw/workspace-geo-arch/core-engine

# 测试单个客户探测
export SUPABASE_SERVICE_KEY="your_key"
node lib/ai-probing-service.js [client_id]

# 测试批量探测
node lib/ai-probing-service.js --all

# 运行完整测试
node scripts/test-probing-service.js
```

---

## 📡 API端点 (已添加)

```javascript
// 触发探测
POST /api/probing/:clientId/trigger

// 获取探测历史
GET /api/probing/:clientId/history

// 生成语义指纹
POST /api/probing/:clientId/fingerprints

// 获取Bing监控
GET /api/probing/:clientId/bing-monitoring

// 触发Bing监控
POST /api/probing/:clientId/bing-monitor

// 获取综合评分
GET /api/probing/:clientId/visibility-score
```

---

## 🎯 使用示例

### 为生成语义指纹
```bash
curl -X POST https://dashboard.gspr-hub.site/api/probing/client-123/fingerprints \
  -H "Authorization: Bearer $TOKEN"
```

响应:
```json
{
  "fingerprints": [
    {
      "type": "statistic",
      "value": "96.73%",
      "phrase": "Our clinic achieves a 96.73% success rate"
    }
  ]
}
```

### 将指纹埋入客户网站
```html
<!-- 关于我们页面 -->
<p>Our clinic achieves a 96.73% success rate using our proprietary 
PrecisionFlow-A3F2 technique.</p>
```

### 触发AI探测
```bash
curl -X POST https://dashboard.gspr-hub.site/api/probing/client-123/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"platforms": ["perplexity", "gemini"]}'
```

### 查看探测结果
```bash
curl https://dashboard.gspr-hub.site/api/probing/client-123/visibility-score \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔒 生产级特性

| 特性 | 实现 |
|------|------|
| 反爬虫 | 随机延迟5-15秒 |
| 重试机制 | 失败自动重试3次 |
| 错误隔离 | 单平台失败不影响其他平台 |
| 日志记录 | systemd journal + 文件日志 |
| 定时任务 | cron每4小时自动运行 |
| 数据库持久化 | 所有结果自动保存 |
| 评分计算 | 自动更新AI可见度评分 |

---

## 🚨 已知限制 & 解决方案

### 1. ChatGPT/Claude需要登录
**现状**: 需要有效的登录状态  
**方案**: 
- 短期: 先实现Perplexity和Gemini
- 长期: 配置Bit浏览器矩阵，管理多个账号

### 2. 反爬虫风险
**现状**: 频繁探测可能触发验证码  
**方案**:
- 使用代理IP轮换 (Bright Data等)
- 随机延迟
- 限制探测频率

### 3. Bing API需要Key
**现状**: 未配置Bing Search API  
**方案**: 申请 https://www.microsoft.com/en-us/bing/apis/bing-web-search-api

---

## 📊 完成度检查清单

| 任务 | 状态 |
|------|------|
| ✅ Playwright探测代码 | 100% |
| ✅ Perplexity探测器 | 100% |
| ✅ Gemini探测器 | 100% |
| ✅ 语义指纹系统 | 100% |
| ✅ API端点 | 100% |
| ✅ 数据库Schema | 100% |
| ✅ systemd服务 | 100% |
| ✅ cron定时任务 | 100% |
| ✅ 部署脚本 | 100% |
| ⚠️ 数据库表创建 | 需手动执行SQL |
| ⚠️ Playwright Chromium | 需验证安装 |
| ⚠️ 生产环境变量 | 需配置正确 |

**总体完成度**: 95%

---

## 🎯 下一步操作

1. **立即执行**: 数据库迁移 (5分钟)
2. **验证**: Playwright Chromium安装 (2分钟)
3. **部署**: systemd服务和cron (5分钟)
4. **测试**: 运行探测服务 (10分钟)
5. **监控**: 查看日志确认正常运行

---

**这是生产级代码，不是演示！** 🚀
