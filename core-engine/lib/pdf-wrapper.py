#!/usr/bin/env python3
import sys
import json
import os

# 添加skills目录到路径
sys.path.insert(0, '/root/.openclaw/workspace-geo-arch/core-engine/skills')

from knock_door_pdf.core.pdf_generator import generate_report

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 pdf-wrapper.py <data.json>", file=sys.stderr)
        sys.exit(1)
    
    # 读取JSON数据
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        payload = json.load(f)
    
    # 生成PDF
    pdf_path = generate_report(
        data=payload['data'],
        content=payload['content'],
        client_name=payload['client_name'],
        output_dir=payload['output_dir']
    )
    
    print(pdf_path)

if __name__ == '__main__':
    main()
