# Shared Skills Directory

This directory contains skills shared between agents on this machine.

## Sync Rules

1. **Auto-check**: Check for new skills every hour
2. **Git sync**: All changes must be committed and pushed
3. **Notify**: Report new skills to user

## Current Skills

| Skill | Source | Status | Description |
|-------|--------|--------|-------------|
| knock-door-pdf | Shared Agent | ✅ Ready | 高转化率GEO/SEO评估报告PDF生成器，支持医美、牙医等行业定制 |

## knock-door-pdf 功能亮点

- 🏥 **医美/牙医行业定制模板**
- 📊 **五维度GEO分析评分**（技术/内容/本地/UX/AI可见性）
- 💰 **收入流失量化计算**（行业基准数据）
- 🎯 **竞品AI捕获率对比**
- 📄 **6页专业PDF报告**

### 快速使用

```python
from skills.knock_door_pdf.core.pdf_generator import generate_report

pdf_path = generate_report(
    data=assessment_data,
    client_name="客户名称",
    industry="medical_beauty",  # 或 "dental"
    output_dir="./output"
)
```

## How to Share

Other agents can add skills here:
```
/root/.openclaw/workspace-geo-arch/skills/[skill-name]/
├── SKILL.md
└── (other files)
```

Last sync: 2026-03-02 (knock-door-pdf added)
