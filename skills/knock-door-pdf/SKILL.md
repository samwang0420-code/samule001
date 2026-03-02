# Knock-Door PDF Skill

高转化率GEO/SEO评估报告PDF生成器，支持医美、牙医等行业定制。

## 核心功能

- 6页完整评估报告
- 行业特定内容（医美/牙医/通用SaaS）
- 五维度分析（技术/内容/本地/UX/AI可见性）
- 竞品AI捕获率对比
- 商业损失量化（行业基准数据）
- GEO Recovery Plan（行业特定行动项）

## 快速开始

### 安装依赖

```bash
pip install reportlab matplotlib
```

### 生成报告

```python
from skills.knock_door_pdf.core.pdf_generator import generate_report

# 准备评估数据
assessment_data = {
    'url': 'https://example.com',
    'overall': {'grade': 'C', 'combined_score': 54},
    'scores': {
        'technical_seo': {'score': 65},
        'content_seo': {'score': 72},
        'offsite_seo': {'score': 58},
        'user_experience': {'score': 78},
        'ai_visibility': {'score': 28}
    }
}

# 生成报告
pdf_path = generate_report(
    data=assessment_data,
    client_name="客户名称",
    industry="medical_beauty",  # 医美: medical_beauty, 牙医: dental, 通用: default
    output_dir="./output"
)
```

## 支持行业

| 行业 | industry参数 | 特点 |
|------|-------------|------|
| 医美 | `medical_beauty` | 玻尿酸/热玛吉/超声刀关键词，客单价8K |
| 牙医 | `dental` | 种植牙/隐形矫正关键词，客单价15K |
| 通用 | `default` | SaaS工具关键词，客单价5K |

## 行业特定内容

### 医美行业 (medical_beauty)

**痛点洞察：**
- AI搜索"附近医美诊所"时，您的机构未被推荐
- 潜在客户询问"最好的玻尿酸品牌"时，AI推荐了竞品
- 高意向求美者在Perplexity搜索时，您的诊所invisible

**计算基准：**
- 月流量：30,000
- 平均客单价：¥8,000
- 转化率：3%

**行动项：**
- Deploy llms.txt for 医美（服务目录：玻尿酸/热玛吉/超声刀）
- Medical Schema Markup（治疗方案和医生档案）
- Local Entity Graph（医美+城市）
- Review & Reputation Audit

### 牙医行业 (dental)

**痛点洞察：**
- 患者搜索"附近种植牙医院"时，您的诊所不在AI推荐列表
- AI回答"最好的牙医"问题时推荐了竞争对手
- 高价值种植客户被AI导流至竞品机构

**计算基准：**
- 月流量：25,000
- 平均客单价：¥15,000
- 转化率：2.5%

**行动项：**
- Deploy llms.txt for 牙医（服务目录：种植牙/隐形矫正/美白）
- Dental Schema Markup（治疗方案和牙医档案）
- Local Entity Graph（牙医+城市）
- Patient Review Audit

## 数据格式

```json
{
  "url": "https://client-website.com",
  "assessment_date": "2026-03-02",
  "overall": {
    "grade": "C",
    "combined_score": 54
  },
  "scores": {
    "technical_seo": {"score": 65},
    "content_seo": {"score": 72},
    "offsite_seo": {"score": 58},
    "user_experience": {"score": 78},
    "ai_visibility": {"score": 28}
  }
}
```

## 6页报告结构

1. **封面** - 评分卡片 54 (Grade C) At Risk + 客户信息
2. **AI Visibility Crisis** - 行业特定痛点洞察
3. **Competitor AI Capture** - 竞品对比表（行业特定竞品名）
4. **Revenue Leakage** - 商业损失计算（行业基准数据）
5. **Five-Dimension** - 雷达图 + 详细评分
6. **GEO Recovery Plan** - 行业特定行动计划 + CTA

## 视觉规范

- **评分卡片**: 54 (Grade C) At Risk
- **状态标签**: 红底白字圆角标签
- **页脚**: CONFIDENTIAL | StackMatrices Intelligence | Page X of 6
- **色彩**: 深蓝主色 + 红/绿状态色

## 示例

```bash
# 医美行业
cd examples
python3 medical_beauty_sample.py

# 牙医行业
python3 dental_sample.py
```

## 自定义行业

在 `core/pdf_generator.py` 中添加新的行业配置：

```python
INDUSTRY_CONFIG = {
    'your_industry': {
        'name': '行业名称',
        'keywords': '关键词1 / 关键词2',
        'pain_points': ['痛点1', '痛点2', '痛点3'],
        'competitors': ['竞品A', '竞品B', '竞品C'],
        'monthly_traffic': 30000,
        'avg_deal': 8000,
        'conversion_rate': 0.03,
        'geo_hooks': ['钩子1', '钩子2', '钩子3']
    }
}
```

## 作者

StackMatrices Intelligence Team
