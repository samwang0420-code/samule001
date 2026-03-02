# GEO Analysis 问卷 - 开发对接文档

## 页面说明
客户自助提交SEO+GEO分析请求的表单页面

## 前端页面规范

### URL
```
/analyze.html
```

### 页面标题
```
GEO + SEO Analysis Request | Free Website Audit
```

### 表单字段（7个）

| 字段名 | 类型 | 必填 | 示例 | 说明 |
|--------|------|------|------|------|
| website | url | ✅ | https://example.com | 主网站URL |
| businessName | text | ✅ | ABC Company | 公司名称 |
| industry | select | ✅ | service | 行业类型 |
| keywords | textarea | ✅ | keyword1, keyword2 | 目标关键词，逗号分隔 |
| competitors | textarea | ❌ | Competitor A, Competitor B | 竞争对手，逗号分隔 |
| contactName | text | ✅ | John Doe | 联系人 |
| email | email | ✅ | john@example.com | 邮箱 |

### 行业选项（industry select）
```
- medical-spa: Medical Spa
- dentistry: Dentistry
- dermatology: Dermatology
- plastic-surgery: Plastic Surgery
- other-medical: Other Medical
- service: Service Business
- other: Other
```

### 页面文案

**标题**: GEO + SEO Analysis Request
**副标题**: Complete audit of your local search presence
**提交按钮**: Request Analysis
**底部提示**: Report delivered within 24-48 hours. Free analysis, no credit card required.
**成功提示**: 
- 标题: Request Received
- 内容: We'll analyze your website and send the report to your email within 24-48 hours.

---

## 后端API对接

### API端点
```
POST https://dashboard.gspr-hub.site/api/analyze
```

### 请求头
```json
{
  "Content-Type": "application/json",
  "X-API-Key": "geo-internal-samwang0420"
}
```

### 请求体格式
```json
{
  "website": "https://example.com",
  "businessName": "ABC Company",
  "industry": "service",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "competitors": ["Competitor A", "Competitor B"],
  "contactName": "John Doe",
  "email": "john@example.com"
}
```

### 响应格式
```json
{
  "success": true,
  "message": "Analysis started",
  "data": {
    "clientId": "client_1234567890",
    "businessName": "ABC Company",
    "status": "analyzing"
  }
}
```

---

## 前端JavaScript示例

```javascript
document.getElementById('analysisForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  
  // 处理关键词和竞争对手为数组
  const keywords = formData.get('keywords').split(',').map(k => k.trim()).filter(k => k);
  const competitors = formData.get('competitors') 
    ? formData.get('competitors').split(',').map(c => c.trim()).filter(c => c)
    : [];
  
  const payload = {
    website: formData.get('website'),
    businessName: formData.get('businessName'),
    industry: formData.get('industry'),
    keywords: keywords,
    competitors: competitors,
    contactName: formData.get('contactName'),
    email: formData.get('email')
  };
  
  fetch('https://dashboard.gspr-hub.site/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'geo-internal-samwang0420'
    },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(result => {
    // 显示成功消息
    document.getElementById('analysisForm').classList.add('hidden');
    document.getElementById('successMessage').classList.remove('hidden');
  })
  .catch(err => {
    alert('Error submitting request. Please try again.');
  });
});
```

---

## 注意事项

1. **跨域**: API已配置CORS，支持跨域请求
2. **验证**: 所有必填字段必须有值
3. **关键词处理**: 前端将逗号分隔字符串转为数组
4. **错误处理**: API返回400错误时，显示通用错误提示
5. **成功跳转**: 提交成功后隐藏表单，显示成功消息（非跳转）

---

## 设计参考

- 背景: 渐变色 (purple-600 to purple-700)
- 表单卡片: 白色背景，圆角，阴影
- 输入框: 灰色边框，聚焦时紫色边框
- 提交按钮: 紫色渐变，白色文字
- 成功状态: 绿色图标 + 成功文案

完整HTML参考: https://dashboard.gspr-hub.site/analysis-request.html
