# Knock-Door PDF Skill + Medical GEO Website

高转化率GEO/SEO评估报告PDF生成器 + 医疗行业网站系统

## 完整系统架构

```
stackmatrices-site/
├── design-system.ts          # 医疗级设计系统
├── App.tsx                   # 路由配置
├── components/
│   ├── Layout.tsx           # 导航+页脚
│   ├── LeakageCalculator.tsx # 收入流失计算器
│   ├── IndustryCard.tsx     # 行业卡片
│   └── SemanticPulse.tsx    # 神经网络可视化
└── pages/
    ├── Home.tsx             # 首页(抢病人)
    ├── Audit.tsx            # AI可见性审计
    ├── Interventions.tsx    # 战略干预
    └── Cases.tsx            # 案例研究
```

## 品牌转型完成

### 从 → 到
| 维度 | 旧 | 新 |
|------|-----|-----|
| 身份 | AI Skill Registry | GEO Agency for Medical Practices |
| 颜色 | 默认科技蓝 | Deep Space Navy (#0B0F19) + Clinical Teal (#2DD4BF) + Security Red (#EF4444) |
| 标语 | 自动化工具 | Patient Intent Capture / AI Visibility Protection |
| 客户 | 通用开发者 | 医美/牙医诊所老板 |
| 术语 | Skills/Deployment | Interventions/Protocol/Seeding |

## 核心页面

### 1. 首页 (Home)
- **Hero**: "Your Patients are Asking AI. Are they Finding You or Your Competitor?"
- **收入流失计算器**: 动态显示 $1.2M+ 年度损失
- **垂直聚焦**: 医美 + 牙医双卡片
- **Semantic Pulse**: 神经网络可视化

### 2. AI Visibility Audit (转化页)
- **评分仪表盘**: 28/100 圆形指示器
- **竞品对比表**: YOU vs Competitors
- **收入流失**: $1.5M+ 红色警示
- **申请表**: 网站/服务/营销预算

### 3. Strategic Interventions (方案页)
- Aesthetic Intent Interceptor
- Medical Trust Architect  
- Intent-to-Treatment Linkage

### 4. Cases (案例页)
- Breast Augmentation Dominance (Beverly Hills)
- Dental Implant Empire (Miami)

## 行业配置

### 医美 (medical_beauty)
```python
{
  'name': 'Medical Aesthetics',
  'keywords': 'Botox / Fillers / Thermage',
  'avg_deal': 8000,
  'monthly_traffic': 30000,
  'pain_points': [
    'AI搜索"附近医美诊所"时您的机构未被推荐',
    '潜在客户询问"最好的玻尿酸品牌"时AI推荐了竞品'
  ]
}
```

### 牙医 (dental)
```python
{
  'name': 'High-End Dentistry',
  'keywords': 'Implants / Invisalign / Veneers',
  'avg_deal': 15000,
  'monthly_traffic': 25000,
  'pain_points': [
    '患者搜索"附近种植牙医院"时您的诊所不在AI推荐列表',
    'AI回答"最好的牙医"问题时推荐了竞争对手'
  ]
}
```

## 使用方式

### 生成PDF报告
```python
from skills.knock_door_pdf.core.pdf_generator import generate_report

pdf_path = generate_report(
    data=assessment_data,
    client_name="美丽医美诊所",
    industry="medical_beauty",  # 或 "dental"
    output_dir='./output'
)
```

### 启动网站
```bash
cd stackmatrices-site
npm install
npm run dev
```

## 心理战设计

### 恐惧触发
- "AI正在推荐你的邻居，而不是你"
- "Invisibility is the new death penalty for clinics"
- "你的高意向病人被AI导流至竞品"

### 权威建立
- HIPAA/GDPR合规声明
- "医疗级安全专家"语境
- 深空海军蓝+临床青绿配色

### 紧迫感
- 动态收入流失计数器
- 红色危险标签 (At Risk)
- 年度$1.2M+损失可视化

## 视觉规范

### 颜色
- 背景: #0B0F19 (Deep Space Navy)
- 主色: #2DD4BF (Clinical Teal)
- 警示: #EF4444 (Security Red)
- 文字: #F9FAFB (Primary) / #9CA3AF (Secondary)

### 字体
- 主字体: Inter / Manrope
- 数据: JetBrains Mono
- 大小: Hero 64px / H1 48px / Body 16px

### 组件
- 评分卡片: 54 (Grade C) At Risk
- 状态标签: 红底白字圆角
- 页脚: HIPAA/GDPR合规徽章

## 部署

**线上地址**: https://openclaw.gspr-hub.site

已集成:
- ✅ PDF生成器 v4.2
- ✅ 医美/牙医行业模板
- ✅ 收入流失计算器
- ✅ 6页完整报告流程

## 后续优化

1. 添加更多垂直行业 (眼科、骨科)
2. 集成真实API数据 (G2/Trustpilot)
3. 自动化邮件跟进系统
4. A/B测试不同CTA文案

---

**状态**: 生产就绪
**版本**: v4.2 Medical GEO
**最后更新**: 2026-03-02
