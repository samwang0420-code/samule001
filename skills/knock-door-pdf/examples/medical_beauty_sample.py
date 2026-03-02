#!/usr/bin/env python3
"""
示例：生成医美行业敲门砖PDF报告
"""
import sys
sys.path.insert(0, '/root/.openclaw/workspace/skills/knock-door-pdf')

from core.pdf_generator import generate_report

# 医美诊所评估数据
assessment_data = {
    'url': 'https://meili-clinic.com',
    'assessment_date': '2026-03-02',
    'overall': {
        'grade': 'C',
        'combined_score': 54
    },
    'scores': {
        'technical_seo': {'score': 65},
        'content_seo': {'score': 72},
        'offsite_seo': {'score': 58},
        'user_experience': {'score': 78},
        'ai_visibility': {'score': 28}
    }
}

# 生成医美行业报告
pdf_path = generate_report(
    data=assessment_data,
    client_name="美丽医美诊所",
    industry="medical_beauty",  # 医美行业
    output_dir='./output'
)

print(f"✅ 医美报告已生成: {pdf_path}")
