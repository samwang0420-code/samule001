# StackMatrices GEO - 子目录部署配置

## 部署目标
- 主站: https://stackmatrices.com
- GEO工具: https://stackmatrices.com/geo

## Astro 配置调整

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://stackmatrices.com',
  base: '/geo',  // 关键：子目录部署
  output: 'static',
  outDir: './dist/geo',
  build: {
    format: 'directory'
  }
});
```

## 路由结构

```
src/pages/
├── index.astro           # /geo/ (GEO首页)
├── audit.astro           # /geo/audit (GEO评分工具)
├── pricing.astro         # /geo/pricing (定价)
├── api/
│   └── geo-audit.js      # /geo/api/geo-audit (API)
└── houston/
    └── immigration/
        └── index.astro   # /geo/houston/immigration (落地页)
```

## 链接处理

所有内部链接使用相对路径或 `import.meta.env.BASE_URL`:

```astro
<!-- 正确 -->
<a href={`${import.meta.env.BASE_URL}/audit`}>Check Score</a>

<!-- 或相对路径 -->
<a href="./audit">Check Score</a>

<!-- 错误：绝对路径会导致404 -->
<a href="/audit">Check Score</a>
```

## 构建输出

```bash
npm run build
# 输出到 dist/geo/
# 部署时：将 dist/geo/ 上传到 stackmatrices.com/geo/
```

## Vercel 配置（如使用）

```json
// vercel.json
{
  "rewrites": [
    { "source": "/geo/(.*)", "destination": "/geo/$1" }
  ]
}
```

## 混合部署策略

### 静态托管（推荐）
1. 主站 stackmatrices.com 保持现状
2. /geo/ 目录单独部署Astro生成的静态文件
3. 通过 CDN / Nginx 路由

### 架构
```
stackmatrices.com/           (现有主站)
├── ...existing pages
├── /geo/                    (Astro生成)
│   ├── index.html
│   ├── audit/
│   ├── pricing/
│   └── api/
```
