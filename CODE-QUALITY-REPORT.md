# 代码健壮性检查报告

**检查时间**: 2026-03-03  
**检查范围**: API Server, Lead Crawler, PDF Service, Auto-Iteration Engine

---

## 🔴 严重问题 (需立即修复)

### 1. PDF服务 - 命令注入风险
**文件**: `core-engine/lib/pdf-service.js`

**问题**: 使用字符串拼接构建Python命令，存在命令注入风险

```javascript
// 危险代码:
const pythonScript = `
data = json.loads('${JSON.stringify(data).replace(/'/g, "\\'")}')
client_name="${(lead.business_name || 'Client').replace(/"/g, '\\"')}"
`;

execSync('python3 -c "' + pythonScript + '"')
```

**风险**: 
- 如果 `lead.business_name` 包含 `$()` 或反引号，可能执行任意命令
- 特殊字符转义不完整

**修复建议**:
```javascript
// 使用临时文件传递数据
const tempDataFile = `/tmp/lead-${lead.id}.json`;
await fs.writeFile(tempDataFile, JSON.stringify({ data, content }));

const result = execSync(`python3 ${scriptPath} --input ${tempDataFile}`, {
  encoding: 'utf8',
  timeout: 60000
});
```

---

## 🟡 中等问题 (建议修复)

### 2. Lead Crawler - 缺少重试机制
**文件**: `core-engine/scripts/lead-crawler.js`

**问题**: Apify API调用失败时没有重试机制

```javascript
// 当前代码 - 直接抛出错误
if (!response.ok) {
  throw new Error(`Apify API error: ${response.status}`);
}
```

**修复建议**:
```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    } catch (e) {
      if (i === maxRetries - 1) throw e;
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

### 3. API Server - 缺少输入验证
**文件**: `core-engine/lib/api-server.js`

**问题**: 多个API端点缺少输入验证

```javascript
// POST /api/lead-configs - 直接插入用户输入
app.post('/api/lead-configs', authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from('lead_search_configs')
    .insert(req.body)  // 没有验证!
    .select()
    .single();
});
```

**修复建议**:
```javascript
import { body, validationResult } from 'express-validator';

app.post('/api/lead-configs', 
  authenticateToken,
  body('name').isLength({ min: 1, max: 100 }),
  body('search_keyword').isLength({ min: 1, max: 200 }),
  body('max_leads').optional().isInt({ min: 1, max: 1000 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ...
  }
);
```

---

### 4. 缺少错误边界处理
**文件**: 多个文件

**问题**: 异步函数缺少try-catch，可能导致未捕获的Promise rejection

```javascript
// 问题代码:
app.get('/api/leads', authenticateToken, async (req, res) => {
  const { data, error } = await supabase.from('leads').select('*');
  // 如果supabase连接失败，会抛出未处理的错误
});
```

**修复建议**:
```javascript
// 添加全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    requestId: req.id 
  });
});

// 包装异步路由
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/api/leads', authenticateToken, asyncHandler(async (req, res) => {
  // ...
}));
```

---

## 🟢 轻微问题 (可选优化)

### 5. 硬编码配置
**文件**: 多个文件

**问题**: API密钥、Token等硬编码在代码中

```javascript
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const APIFY_TOKEN = process.env.APIFY_TOKEN || 'apify_api_cxCD9lkZ7l9pK3B_Lh2Bfm4wC3mKt43Ch4Q5';
```

**建议**: 生产环境强制使用环境变量，移除默认值

```javascript
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_KEY environment variable is required');
}
```

---

### 6. 缺少日志级别控制
**文件**: 多个文件

**问题**: 所有日志都使用console.log，无法在生产环境关闭调试日志

**建议**:
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console());
}
```

---

### 7. 资源泄漏风险
**文件**: `core-engine/scripts/lead-crawler.js`

**问题**: 长时间运行的爬虫可能积累内存泄漏

**建议**: 定期清理和限制并发

```javascript
// 添加内存监控
setInterval(() => {
  const usage = process.memoryUsage();
  if (usage.heapUsed > 500 * 1024 * 1024) { // 500MB
    logger.warn('High memory usage detected, restarting...');
    process.exit(1); // 让systemd重启服务
  }
}, 60000);
```

---

## 📊 问题统计

| 级别 | 数量 | 问题 |
|------|------|------|
| 🔴 严重 | 1 | 命令注入风险 |
| 🟡 中等 | 3 | 重试机制、输入验证、错误边界 |
| 🟢 轻微 | 3 | 硬编码、日志级别、资源泄漏 |

---

## 🛠️ 立即修复清单

### 优先级1 (今天完成)
- [ ] 修复 PDF服务的命令注入风险
- [ ] 为 API端点添加输入验证

### 优先级2 (本周完成)
- [ ] 为外部API调用添加重试机制
- [ ] 添加全局错误处理中间件
- [ ] 移除生产环境硬编码密钥

### 优先级3 (可选)
- [ ] 接入结构化日志系统
- [ ] 添加内存监控
- [ ] 完善单元测试

---

## 🔒 安全建议

1. **立即更换硬编码的API密钥** - 可能已经泄露
2. **启用API速率限制** - 防止暴力破解
3. **添加CORS白名单** - 只允许dashboard域名访问
4. **定期安全扫描** - 使用npm audit检查依赖漏洞

---

**报告生成时间**: 2026-03-03  
**建议修复期限**: 严重问题24小时内，中等问题1周内
