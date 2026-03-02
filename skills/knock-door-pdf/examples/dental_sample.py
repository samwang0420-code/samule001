#!/usr/bin/env python3
"""
示例：生成牙医行业敲门砖PDF报告
"""
import sys
sys.path.insert(0, '/root/.openclaw/workspace/skills/knock-door-pdf')

from core.pdf_generator import generate_report

# 牙科诊所评估数据
assessment_data = {
    'url': 'https://dental-expert.com',
    'assessment_date': '2026-03-02',
    'overall': {
        'grade': 'D',
        'combined_score': 42
    },
    'scores': {
        'technical_seo': {'score': 55},
        'content_seo': {'score': 48},
        'offsite_seo': {'score': 38},
        'user_experience': {'score': 62},
        'ai_visibility': {'score': 18}
    }
}

# 生成牙医行业报告
pdf_path = generate_report(
    data=assessment_data,
    client_name=" expert牙科诊所",
    industry="dental",  # 牙医行业
    output_dir='./output'
)

print(f"✅ 牙医报告已生成: {pdf_path}")
