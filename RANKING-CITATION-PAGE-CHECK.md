# Ranking & AI Citation 页面逻辑检查报告

**检查时间**: 2026-03-03  
**检查范围**: Rankings页面 + AI Citations页面

---

## ❌ 严重问题发现

### 1. Rankings页面 - 全是静态数据

**当前状态**: ❌ **没有数据加载逻辑**

**问题详情**:
```javascript
// showPage函数只加载clients和dashboard数据
if (pageName === 'clients' || pageName === 'dashboard') {
    loadClients();
}
// 注意: rankings 不在条件中!
```

**页面显示** (全是硬编码):
- "Avg Position: #5.2" ← 静态数字
- "Keywords on Page 1: 12" ← 静态数字
- "Local Pack Appearances: 8" ← 静态数字
- 排名表格 ← 静态HTML，无动态数据

**缺失功能**:
- ❌ 从API获取排名数据
- ❌ 动态更新排名表格
- ❌ 排名趋势图
- ❌ 关键词筛选

---

### 2. AI Citations页面 - 全是静态数据

**当前状态**: ❌ **没有数据加载逻辑**

**页面显示** (全是硬编码):
- "Perplexity Mentions: 28" ← 静态数字
- "As Primary Source: 6" ← 静态数字
- "Citation Rate: 45%" ← 静态数字
- 引用列表 ← 静态HTML示例

**缺失功能**:
- ❌ 从API获取AI引用数据
- ❌ 实时监控Perplexity/ChatGPT引用
- ❌ 动态更新引用列表
- ❌ 引用机会识别

---

## 🔍 具体代码问题

### Rankings页面HTML (静态)
```html
<div id="page-rankings" class="page">
    <!-- 静态统计卡片 -->
    <h3 class="text-4xl font-bold mt-1">#5.2</h3>  <!-- 硬编码 -->
    <h3 class="text-4xl font-bold mt-1">12</h3>     <!-- 硬编码 -->
    <h3 class="text-4xl font-bold mt-1">8</h3>      <!-- 硬编码 -->
    
    <!-- 静态表格 -->
    <tbody>
        <tr class="border-t hover:bg-gray-50">
            <td class="py-4 px-6 font-medium">botox houston</td>
            <td class="py-4 px-6">Glow Med Spa</td>
            <td class="py-4 px-6 text-center"><span class="font-bold text-green-600">#3</span></td>
            <td class="py-4 px-6 text-center text-gray-500">#5</td>
            <td class="py-4 px-6 text-center"><span class="text-green-600 flex items-center justify-center"><i class="fas fa-arrow-up mr-1"></i>+2</span></td>
            <td class="py-4 px-6">
                <div class="flex items-center">
                    <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div class="bg-green-500 h-2 rounded-full" style="width: 60%"></div>
                    </div>
                </div>
            </td>
        </tr>
    </tbody>
    <!-- 所有数据都是写死的! -->
</div>
```

### AI Citations页面HTML (静态)
```html
<div id="page-ai-citations" class="page">
    <!-- 静态统计卡片 -->
    <h3 class="text-4xl font-bold mt-1">28</h3>   <!-- 硬编码 -->
    <h3 class="text-4xl font-bold mt-1">6</h3>    <!-- 硬编码 -->
    <h3 class="text-4xl font-bold mt-1">45%</h3>  <!-- 硬编码 -->
    
    <!-- 静态引用示例 -->
    <div class="space-y-4">
        <div class="p-4 bg-gray-50 rounded-xl">
            <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">Perplexity</span>
            <span class="text-sm text-gray-400">2 hours ago</span>
            <p class="text-gray-700 mb-2"><strong>Query:</strong> "best botox houston"</p>
            <p class="text-sm text-gray-600 italic">"Based on reviews and ratings..."</p>
        </div>
    </div>
    <!-- 全是示例数据! -->
</div>
```

---

## ✅ 需要的修复

### 修复1: 添加排名数据加载函数

```javascript
// 添加 loadRankings() 函数
async function loadRankings() {
    try {
        const token = localStorage.getItem('geo_token');
        const res = await fetch('/api/rankings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load rankings');
        
        const data = await res.json();
        
        // 更新统计卡片
        document.getElementById('stat-avg-position').textContent = 
            '#' + (data.avgPosition || '-');
        document.getElementById('stat-page1-keywords').textContent = 
            data.page1Count || '-';
        document.getElementById('stat-local-pack').textContent = 
            data.localPackCount || '-';
        
        // 更新表格
        const rows = data.rankings.map(r => `
            <tr class="border-t hover:bg-gray-50">
                <td class="py-4 px-6 font-medium">${r.keyword}</td>
                <td class="py-4 px-6">${r.clientName}</td>
                <td class="py-4 px-6 text-center">
                    <span class="font-bold ${getRankColor(r.currentRank)}">#${r.currentRank}</span>
                </td>
                <td class="py-4 px-6 text-center text-gray-500">#${r.previousRank}</td>
                <td class="py-4 px-6 text-center">
                    ${formatChange(r.change)}
                </td>
                <td class="py-4 px-6">
                    <div class="flex items-center">
                        <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div class="bg-green-500 h-2 rounded-full" 
                                 style="width: ${r.trend}%"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');
        
        document.getElementById('rankings-table-body').innerHTML = rows;
        
    } catch (e) {
        console.error('Error loading rankings:', e);
    }
}
```

### 修复2: 添加AI引用数据加载函数

```javascript
// 添加 loadAICitations() 函数
async function loadAICitations() {
    try {
        const token = localStorage.getItem('geo_token');
        const res = await fetch('/api/ai-citations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load citations');
        
        const data = await res.json();
        
        // 更新统计卡片
        document.getElementById('stat-perplexity').textContent = 
            data.perplexityMentions || '-';
        document.getElementById('stat-primary-source').textContent = 
            data.primarySourceCount || '-';
        document.getElementById('stat-citation-rate').textContent = 
            (data.citationRate || '-') + '%';
        
        // 更新引用列表
        const citations = data.citations.map(c => `
            <div class="p-4 bg-gray-50 rounded-xl">
                <div class="flex items-start justify-between mb-2">
                    <span class="px-2 py-1 ${getPlatformBadgeClass(c.platform)}">
                        ${c.platform}
                    </span>
                    <span class="text-sm text-gray-400">${formatTime(c.date)}</span>
                </div>
                <p class="text-gray-700 mb-2"><strong>Query:</strong> "${c.query}"</p>
                <div class="bg-white p-3 rounded-lg border border-gray-200">
                    <p class="text-sm text-gray-600 italic">"${c.citationText}"</p>
                </div>
                <div class="flex items-center mt-2 text-sm">
                    <span class="${getCitationStatusClass(c.status)}">
                        <i class="fas fa-check-circle mr-1"></i>${c.status}
                    </span>
                </div>
            </div>
        `).join('');
        
        document.getElementById('citations-list').innerHTML = citations;
        
    } catch (e) {
        console.error('Error loading citations:', e);
    }
}
```

### 修复3: 更新showPage函数

```javascript
function showPage(pageName) {
    // ... 现有代码 ...
    
    // Load data if needed
    if (pageName === 'clients' || pageName === 'dashboard') {
        loadClients();
    } else if (pageName === 'rankings') {
        loadRankings();  // 新增
    } else if (pageName === 'ai-citations') {
        loadAICitations();  // 新增
    }
}
```

### 修复4: 添加API端点

```javascript
// API端点 - 排名数据
app.get('/api/rankings', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('rankings')
            .select('*, clients(business_name)')
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (error) throw error;
        
        // 计算统计
        const avgPosition = data.length > 0 
            ? Math.round(data.reduce((a, b) => a + b.current_rank, 0) / data.length)
            : 0;
        const page1Count = data.filter(r => r.current_rank <= 10).length;
        
        res.json({
            success: true,
            avgPosition,
            page1Count,
            localPackCount: data.filter(r => r.in_local_pack).length,
            rankings: data
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API端点 - AI引用数据
app.get('/api/ai-citations', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ai_citations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        // 计算统计
        const perplexityMentions = data.filter(c => c.platform === 'Perplexity').length;
        const primarySourceCount = data.filter(c => c.is_primary_source).length;
        const citationRate = data.length > 0 
            ? Math.round((primarySourceCount / data.length) * 100)
            : 0;
        
        res.json({
            success: true,
            perplexityMentions,
            primarySourceCount,
            citationRate,
            citations: data
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
```

### 修复5: 创建数据库表

```sql
-- 排名数据表
CREATE TABLE IF NOT EXISTS public.rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id),
    keyword TEXT NOT NULL,
    current_rank INTEGER,
    previous_rank INTEGER,
    search_engine TEXT DEFAULT 'google',
    location TEXT,
    in_local_pack BOOLEAN DEFAULT false,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI引用数据表
CREATE TABLE IF NOT EXISTS public.ai_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id),
    platform TEXT NOT NULL, -- Perplexity, ChatGPT, etc.
    query TEXT,
    citation_text TEXT,
    is_primary_source BOOLEAN DEFAULT false,
    url TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📊 完成度评估

| 功能 | 当前状态 | 完成度 |
|------|----------|--------|
| Rankings页面UI | ✅ 有静态HTML | 30% |
| Rankings数据加载 | ❌ 无 | 0% |
| Rankings API | ❌ 无 | 0% |
| AI Citations页面UI | ✅ 有静态HTML | 30% |
| AI Citations数据加载 | ❌ 无 | 0% |
| AI Citations API | ❌ 无 | 0% |

**总体完成度**: 15% (仅UI框架，无数据逻辑)

---

## 🎯 建议

### 方案A: 立即实现数据功能 (推荐)
**工时**: 4-6小时
**优先级**: P0

实现步骤:
1. 创建数据库表 (15分钟)
2. 添加API端点 (30分钟)
3. 添加前端加载函数 (1小时)
4. 更新showPage调用 (15分钟)
5. 测试验证 (1小时)

### 方案B: 暂时隐藏页面
**工时**: 5分钟

如果暂时不需要这些功能，可以从导航菜单中隐藏这两个页面，只保留Dashboard和Clients。

### 方案C: 添加"开发中"提示
**工时**: 10分钟

在页面顶部添加提示:
```html
<div class="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
    <p class="text-yellow-700">
        <i class="fas fa-tools mr-2"></i>
        This feature is under development. Data shown is for demonstration only.
    </p>
</div>
```

---

## 结论

**Rankings和AI Citations页面当前只有静态UI，没有数据加载逻辑。**

这两个页面需要完整的后端API + 前端数据加载功能才能正常使用。

**建议**: 选择方案A立即实现，或选择方案B暂时隐藏避免误导用户。
