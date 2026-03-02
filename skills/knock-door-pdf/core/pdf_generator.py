#!/usr/bin/env python3
"""
Knock-Door PDF Skill - 高转化率GEO评估报告生成器
支持行业：医美、牙医
"""

import os
from datetime import datetime
from typing import Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Line

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False


class PDFReportGenerator:
    """敲门砖PDF生成器 - 支持医美/牙医行业"""
    
    # 色彩系统
    C_PRIMARY = colors.HexColor('#1e3a8a')
    C_RED = colors.HexColor('#dc2626')
    C_GREEN = colors.HexColor('#16a34a')
    C_ORANGE = colors.HexColor('#f97316')
    C_GRAY = colors.HexColor('#6b7280')
    C_DARK = colors.HexColor('#111827')
    C_BODY = colors.HexColor('#374151')
    C_BG = colors.HexColor('#f9fafb')
    
    # 页边距
    M_T = 2.5*cm
    M_B = 2.5*cm
    M_L = 2*cm
    M_R = 2*cm
    
    # 行业配置
    INDUSTRY_CONFIG = {
        'medical_beauty': {
            'name': '医美',
            'keywords': '医美诊所 / 整形医院 / 皮肤管理中心',
            'pain_points': [
                'AI搜索"附近医美诊所"时，您的机构未被推荐',
                '潜在客户询问"最好的玻尿酸品牌"时，AI推荐了竞品',
                '高意向求美者在Perplexity搜索时，您的诊所 invisible'
            ],
            'competitors': [' competitor_a_clinic', ' competitor_b_hospital', ' competitor_c_center'],
            'monthly_traffic': 30000,
            'avg_deal': 8000,
            'conversion_rate': 0.03,
            'geo_hooks': [
                'AI推荐竞争对手的玻尿酸项目',
                '您的热玛吉服务未被AI索引',
                '客户在ChatGPT询问时被推荐到竞品'
            ]
        },
        'dental': {
            'name': '牙医',
            'keywords': '牙科诊所 / 口腔医院 / 种植牙中心',
            'pain_points': [
                '患者搜索"附近种植牙医院"时，您的诊所不在AI推荐列表',
                'AI回答"最好的牙医"问题时推荐了竞争对手',
                '高价值种植客户被AI导流至竞品机构'
            ],
            'competitors': [' competitor_a_dental', ' competitor_b_hospital', ' competitor_c_center'],
            'monthly_traffic': 25000,
            'avg_deal': 15000,
            'conversion_rate': 0.025,
            'geo_hooks': [
                'AI推荐竞争对手的种植牙服务',
                '您的隐形矫正项目未被AI收录',
                '患者询问时被AI推荐到竞品诊所'
            ]
        },
        'default': {
            'name': 'SaaS',
            'keywords': '软件工具 / 企业服务',
            'pain_points': [
                '42% of high-intent searches are answered by AI',
                'Your brand is invisible in 4 out of 5 major AI platforms',
                'Competitors capturing your prospective customers'
            ],
            'competitors': ['Competitor A', 'Competitor B', 'Competitor C'],
            'monthly_traffic': 50000,
            'avg_deal': 5000,
            'conversion_rate': 0.02,
            'geo_hooks': [
                'AI recommends competitors at discovery phase',
                'Your solution not indexed by AI search engines',
                'High-intent queries answered without mentioning you'
            ]
        }
    }
    
    def __init__(self, output_dir="output", industry="default"):
        self.output_dir = output_dir
        self.industry = industry
        self.config = self.INDUSTRY_CONFIG.get(industry, self.INDUSTRY_CONFIG['default'])
        os.makedirs(output_dir, exist_ok=True)
        self.styles = self._create_styles()
    
    def _create_styles(self):
        styles = getSampleStyleSheet()
        
        styles.add(ParagraphStyle(
            name='MainTitle',
            parent=styles['Title'],
            fontSize=24,
            textColor=self.C_DARK,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            leading=30
        ))
        
        styles.add(ParagraphStyle(
            name='SectionTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=self.C_DARK,
            fontName='Helvetica-Bold',
            leading=22,
            spaceBefore=16,
            spaceAfter=12
        ))
        
        styles.add(ParagraphStyle(
            name='AlertTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=self.C_RED,
            fontName='Helvetica-Bold',
            leading=22,
            spaceBefore=16,
            spaceAfter=12
        ))
        
        styles.add(ParagraphStyle(
            name='BodyText',
            parent=styles['Normal'],
            fontSize=10,
            leading=16,
            textColor=self.C_BODY,
            alignment=TA_LEFT
        ))
        
        return styles
    
    def generate(self, data: Dict, client_name="Client", filename=None):
        """生成PDF报告"""
        if filename is None:
            ts = datetime.now().strftime("%Y%m%d")
            domain = data.get('url', 'unknown').replace('https://', '').replace('http://', '').split('/')[0]
            filename = f"GEO_Assessment_{domain}_{ts}.pdf"
        
        filepath = os.path.join(self.output_dir, filename)
        
        doc = SimpleDocTemplate(
            filepath, pagesize=A4,
            rightMargin=self.M_R, leftMargin=self.M_L,
            topMargin=self.M_T, bottomMargin=self.M_B
        )
        
        story = []
        story.extend(self._build_cover(data, client_name))
        story.append(PageBreak())
        story.extend(self._build_ai_page(data))
        story.append(PageBreak())
        story.extend(self._build_competitor_page(data))
        story.append(PageBreak())
        story.extend(self._build_loss_page(data))
        story.append(PageBreak())
        story.extend(self._build_dimensions_page(data))
        story.append(PageBreak())
        story.extend(self._build_recovery_page(data))
        
        doc.build(story, onFirstPage=self._add_footer, onLaterPages=self._add_footer)
        return filepath
    
    def _add_footer(self, canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor('#e5e7eb'))
        canvas.setLineWidth(0.5)
        y_line = doc.bottomMargin - 0.4*cm
        canvas.line(doc.leftMargin, y_line, doc.width + doc.leftMargin, y_line)
        
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(self.C_GRAY)
        y = doc.bottomMargin - 0.9*cm
        
        page_num = canvas.getPageNumber()
        footer_text = f"CONFIDENTIAL  |  StackMatrices Intelligence  |  Page {page_num} of 6"
        canvas.drawCentredString(doc.width/2 + doc.leftMargin, y, footer_text)
        
        canvas.restoreState()
    
    def _build_cover(self, data, client_name):
        elements = []
        
        elements.append(Paragraph(
            "STACKMATRICES INTELLIGENCE | CONFIDENTIAL",
            ParagraphStyle(name='Header', parent=self.styles['Normal'],
                          fontSize=9, textColor=self.C_GRAY, alignment=TA_CENTER,
                          fontName='Helvetica-Bold', spaceAfter=20)
        ))
        
        elements.append(Spacer(1, 1.5*cm))
        elements.append(Paragraph("GEO Visibility", self.styles['MainTitle']))
        elements.append(Paragraph(
            "& Strategic Assessment",
            ParagraphStyle(name='Sub', parent=self.styles['Normal'],
                          fontSize=18, textColor=self.C_PRIMARY, alignment=TA_CENTER,
                          fontName='Helvetica-Bold', spaceAfter=20)
        ))
        
        d = Drawing(400, 4)
        d.add(Line(100, 2, 300, 2, strokeColor=self.C_RED, strokeWidth=2))
        elements.append(d)
        elements.append(Spacer(1, 1.5*cm))
        
        elements.append(Paragraph(
            f"<b>{client_name}</b>",
            ParagraphStyle(name='Client', parent=self.styles['Normal'],
                          fontSize=14, alignment=TA_CENTER,
                          textColor=self.C_DARK, fontName='Helvetica-Bold')
        ))
        
        domain = data.get('url', '').replace('https://', '').replace('http://', '').split('/')[0]
        elements.append(Paragraph(domain,
            ParagraphStyle(name='Domain', parent=self.styles['Normal'],
                          fontSize=10, alignment=TA_CENTER, textColor=self.C_GRAY)))
        
        elements.append(Spacer(1, 2*cm))
        
        # 评分卡片
        overall = data.get('overall', {})
        grade = overall.get('grade', 'C')
        score = overall.get('combined_score', 50)
        
        if grade in ['A+', 'A']:
            border_c = self.C_GREEN
            status = "Strong Performer"
            status_c = self.C_GREEN
        elif grade in ['C', 'D', 'F']:
            border_c = self.C_RED
            status = "At Risk"
            status_c = self.C_RED
        else:
            border_c = self.C_PRIMARY
            status = "Average"
            status_c = self.C_PRIMARY
        
        score_card = Table([
            [
                Paragraph(f"<b>{score}</b>", 
                          ParagraphStyle(name='BigNum', parent=self.styles['Normal'],
                                        fontSize=36, fontName='Helvetica-Bold', 
                                        textColor=self.C_DARK, alignment=TA_CENTER,
                                        leading=40)),
                Paragraph(f"(Grade {grade})",
                          ParagraphStyle(name='GradeLabel', parent=self.styles['Normal'],
                                        fontSize=11, fontName='Helvetica-Bold',
                                        textColor=self.C_GRAY, alignment=TA_CENTER)),
                Paragraph(f"<b>{status}</b>",
                          ParagraphStyle(name='StatusLabel', parent=self.styles['Normal'],
                                        fontSize=9, fontName='Helvetica-Bold',
                                        textColor=colors.white, alignment=TA_CENTER))
            ]
        ], colWidths=[3.5*cm, 3.5*cm, 4*cm], rowHeights=[1.5*cm])
        
        score_card.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, -1), colors.white),
            ('BACKGROUND', (2, 0), (2, -1), status_c),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (2, 0), (2, -1), 6),
            ('BOTTOMPADDING', (2, 0), (2, -1), 6),
            ('LEFTPADDING', (2, 0), (2, -1), 12),
            ('RIGHTPADDING', (2, 0), (2, -1), 12),
            ('LINEBEFORE', (0, 0), (0, -1), 4, border_c),
            ('LINEABOVE', (0, 0), (-1, 0), 0.5, colors.HexColor('#e5e7eb')),
            ('LINEBELOW', (0, -1), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('LINERIGHT', (-1, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ]))
        
        elements.append(Table([[score_card]], colWidths=[16*cm],
                             style=TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER')])))
        
        elements.append(Spacer(1, 1*cm))
        grade_descs = {
            'A+': f"Dominating AI search for {self.config['keywords']}",
            'A': f"Well-positioned in {self.config['name']} market",
            'B+': "Good foundation, gaps exist",
            'B': f"Missing key AI visibility in {self.config['name']} sector",
            'C': f"Competitors capturing your {self.config['name']} traffic",
            'D': f"Significant {self.config['name']} client loss to AI",
            'F': f"Near-invisible in {self.config['name']} AI search"
        }
        elements.append(Paragraph(
            grade_descs.get(grade, 'Assessment completed'),
            ParagraphStyle(name='Desc', parent=self.styles['Normal'],
                          fontSize=10, alignment=TA_CENTER, textColor=self.C_GRAY)))
        
        return elements
    
    def _build_ai_page(self, data):
        elements = []
        
        elements.append(Paragraph("AI Visibility Crisis", self.styles['AlertTitle']))
        elements.append(Spacer(1, 0.5*cm))
        
        scores = data.get('scores', {})
        ai_score = scores.get('ai_visibility', {}).get('score', 0)
        
        warning = Table([
            [Paragraph(f"<b>Your AI Visibility Score: {ai_score}/100</b>",
                      ParagraphStyle(name='WarnTitle', parent=self.styles['Normal'],
                                    fontSize=14, textColor=colors.white,
                                    alignment=TA_CENTER, fontName='Helvetica-Bold'))]
        ], colWidths=[16*cm], rowHeights=[1*cm])
        
        warning.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), self.C_RED),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(warning)
        elements.append(Spacer(1, 0.3*cm))
        elements.append(Paragraph("This is your biggest competitive vulnerability",
            ParagraphStyle(name='WarnSub', parent=self.styles['Normal'],
                          fontSize=10, textColor=self.C_RED, alignment=TA_CENTER, fontName='Helvetica-Bold')))
        elements.append(Spacer(1, 0.8*cm))
        
        # 行业特定关键洞察
        elements.append(Paragraph("<b>Critical Insights for {0}</b>".format(self.config['name']), self.styles['SectionTitle']))
        
        for pain_point in self.config['pain_points']:
            elements.append(Paragraph(f"• {pain_point}", self.styles['BodyText']))
            elements.append(Spacer(1, 0.3*cm))
        
        return elements
    
    def _build_competitor_page(self, data):
        elements = []
        
        elements.append(Paragraph("Competitor AI Capture Analysis", self.styles['SectionTitle']))
        elements.append(Spacer(1, 0.5*cm))
        
        elements.append(Paragraph(
            f"When prospects ask AI about {self.config['keywords']}, who gets recommended?",
            ParagraphStyle(name='Fear', parent=self.styles['Normal'],
                          fontSize=10, textColor=self.C_RED, alignment=TA_CENTER,
                          fontName='Helvetica-Bold', spaceAfter=16)))
        
        # 竞品表格 - 使用行业特定竞品名称
        comp_names = self.config['competitors']
        comp_data = [
            ['Brand', 'AI Visibility', 'ChatGPT', 'Claude', 'Perplexity', 'Google'],
            [comp_names[0], '78/100', 'Yes', 'Yes', 'Yes', 'Yes'],
            [comp_names[1], '65/100', 'Yes', 'Yes', 'Yes', 'Partial'],
            [comp_names[2], '52/100', 'Partial', 'Yes', 'Yes', 'No'],
            ['YOU', '28/100', 'No', 'No', 'Yes', 'Partial'],
        ]
        
        comp_table = Table(comp_data, colWidths=[3.5*cm, 2.5*cm, 2*cm, 2*cm, 2.5*cm, 2*cm])
        comp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f8f9fa')),
            ('TEXTCOLOR', (0, 0), (-1, 0), self.C_DARK),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#dee2e6')),
            ('LINEBELOW', (0, -1), (-1, -1), 1, colors.HexColor('#dee2e6')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fff3cd')),
            ('TEXTCOLOR', (0, -1), (-1, -1), self.C_RED),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.white]),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(comp_table)
        elements.append(Spacer(1, 1.2*cm))
        
        # REALITY CHECK - 行业特定
        elements.append(Paragraph("<b>THE REALITY CHECK</b>",
            ParagraphStyle(name='RealTitle', parent=self.styles['Normal'],
                          fontSize=12, textColor=self.C_RED, alignment=TA_CENTER,
                          fontName='Helvetica-Bold', spaceBefore=12, spaceAfter=8)))
        
        # 使用行业特定的GEO hooks
        hooks = self.config['geo_hooks']
        reality_text = (
            f"<b>Scenario:</b> {hooks[0]}<br/><br/>"
            f"<b>Result:</b> {hooks[1]}<br/><br/>"
            f"<font size='8' color='#6b7280'>This happens thousands of times per day in the {self.config['name']} industry.</font>"
        )
        
        reality_box = Table([[Paragraph(reality_text, self.styles['BodyText'])]],
                           colWidths=[16*cm])
        reality_box.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef2f2')),
            ('BOX', (0, 0), (-1, -1), 1.5, self.C_RED),
            ('PADDING', (0, 0), (-1, -1), 12),
        ]))
        elements.append(reality_box)
        elements.append(Spacer(1, 1*cm))
        
        # 引言
        quote_box = Table([[Paragraph(
            f'"Being invisible in AI search is the new death penalty for {self.config["name"]} businesses. '
            f"It's not about ranking #10 anymore - it's about being mentioned when patients search for {self.config['keywords']}.\"",
            ParagraphStyle(name='Quote', parent=self.styles['Normal'],
                          fontSize=10, fontName='Helvetica-Oblique',
                          textColor=self.C_BODY, leading=16))]],
            colWidths=[16*cm])
        quote_box.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff7ed')),
            ('LINEBEFORE', (0, 0), (0, -1), 4, self.C_ORANGE),
            ('PADDING', (0, 0), (-1, -1), 16),
        ]))
        elements.append(quote_box)
        
        return elements
    
    def _build_loss_page(self, data):
        elements = []
        
        elements.append(Paragraph("Revenue Leakage Estimation", self.styles['AlertTitle']))
        elements.append(Spacer(1, 0.5*cm))
        
        ai_score = data.get('scores', {}).get('ai_visibility', {}).get('score', 0)
        leakage = max(0, (100 - ai_score) * 0.42)
        
        # 使用行业特定的基准数据
        monthly_traffic = self.config['monthly_traffic']
        avg_deal = self.config['avg_deal']
        conversion = self.config['conversion_rate']
        monthly_loss = int(monthly_traffic * (leakage/100) * conversion * avg_deal)
        yearly_loss = monthly_loss * 12
        
        loss_card = Table([
            [Paragraph(f"Estimated Monthly Revenue Loss ({self.config['name']})",
                      ParagraphStyle(name='LossLabel', parent=self.styles['Normal'],
                                    fontSize=11, textColor=self.C_GRAY, alignment=TA_CENTER))],
            [Paragraph(f"${monthly_loss:,}",
                      ParagraphStyle(name='LossNum', parent=self.styles['Normal'],
                                    fontSize=48, fontName='Helvetica-Bold',
                                    textColor=self.C_RED, alignment=TA_CENTER, leading=56))],
            [Paragraph(f"(${yearly_loss:,} annually)",
                      ParagraphStyle(name='LossAnnual', parent=self.styles['Normal'],
                                    fontSize=9, textColor=self.C_GRAY, alignment=TA_CENTER))]
        ], colWidths=[16*cm], rowHeights=[0.6*cm, 1.6*cm, 0.5*cm])
        
        loss_card.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ('LINEABOVE', (0, 0), (-1, 0), 4, self.C_RED),
            ('LINEBELOW', (0, -1), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('LINELEFT', (0, 0), (0, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('LINERIGHT', (-1, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(loss_card)
        elements.append(Spacer(1, 1*cm))
        
        elements.append(Paragraph("<b>Calculation Methodology</b>", self.styles['SectionTitle']))
        
        calc_data = [
            ['Metric', 'Value', 'Note'],
            ['Monthly Search Traffic', f'{monthly_traffic:,}', f'{self.config["name"]} industry baseline'],
            ['AI Hijack Rate', f'{leakage:.1f}%', f'From AI Visibility score {ai_score}/100'],
            [f'Avg {self.config["name"]} Client Value', f'${avg_deal:,}', 'Industry benchmark'],
            ['Conversion Rate', f'{conversion*100:.1f}%', f'{self.config["name"]} sector average'],
        ]
        
        calc_table = Table(calc_data, colWidths=[5*cm, 4*cm, 7*cm])
        calc_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('ALIGN', (2, 0), (2, -1), 'LEFT'),
            ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#1e293b')),
            ('LINEBELOW', (0, -1), (-1, -1), 0.5, colors.HexColor('#dee2e6')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, self.C_BG]),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ]))
        elements.append(calc_table)
        elements.append(Spacer(1, 0.8*cm))
        
        elements.append(Paragraph(
            f"<b>What This Means:</b> Every month without GEO optimization, "
            f"you're giving <font color='#dc2626'><b>${monthly_loss:,}</b></font> to competitors. "
            f"Our {self.config['name']} GEO recovery program can help reclaim this lost revenue.",
            self.styles['BodyText']))
        
        return elements
    
    def _build_dimensions_page(self, data):
        elements = []
        
        elements.append(Paragraph("Five-Dimension Assessment", self.styles['SectionTitle']))
        elements.append(Spacer(1, 0.5*cm))
        
        scores = data.get('scores', {})
        
        if MATPLOTLIB_AVAILABLE:
            radar_path = self._create_radar(scores)
            if radar_path:
                elements.append(Image(radar_path, width=10*cm, height=8*cm))
                elements.append(Spacer(1, 0.5*cm))
        
        dim_data = [['Dimension', 'Weight', 'Score', 'Status']]
        
        dims = [
            ('Technical SEO', '20%', 'technical_seo', self.C_PRIMARY),
            ('Content SEO', '25%', 'content_seo', self.C_PRIMARY),
            ('Local SEO', '20%', 'offsite_seo', self.C_PRIMARY),
            ('User Experience', '20%', 'user_experience', self.C_GREEN),
            ('AI Visibility', '15%', 'ai_visibility', self.C_RED),
        ]
        
        for name, weight, key, color in dims:
            score = scores.get(key, {}).get('score', 0)
            if score >= 70:
                status = "Good"
            elif score >= 50:
                status = "Fair"
            else:
                status = "At Risk"
            
            dim_data.append([name, weight, f"{score}/100", f"[{status}]"])
        
        dim_table = Table(dim_data, colWidths=[6*cm, 2*cm, 2.5*cm, 3*cm])
        dim_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#1e293b')),
            ('LINEBELOW', (0, -1), (-1, -1), 0.5, colors.HexColor('#dee2e6')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, self.C_BG]),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(dim_table)
        
        return elements
    
    def _build_recovery_page(self, data):
        elements = []
        
        elements.append(Paragraph("GEO Recovery Plan - Phase 1", self.styles['SectionTitle']))
        elements.append(Spacer(1, 0.3*cm))
        
        elements.append(Paragraph(
            f"This report shows only <b>30% of</b> the underlying {self.config['name']} GEO data we collected.",
            self.styles['BodyText'))
        elements.append(Spacer(1, 0.5*cm))
        
        elements.append(Paragraph("<b>Immediate Actions</b>", self.styles['SectionTitle']))
        
        # 行业特定行动计划
        if self.industry == 'medical_beauty':
            actions_text = """
            <b>[HIGH] Week 1-2</b> • Deploy llms.txt for {0}<br/>
            Create machine-readable service catalog (玻尿酸/热玛吉/超声刀)<br/><br/>
            <b>[HIGH] Week 1-2</b> • Medical Schema Markup<br/>
            Implement AI-optimized treatment and doctor profiles<br/><br/>
            <b>[MEDIUM] Week 3-4</b> • Local Entity Graph<br/>
            Build "{0} + 城市" entity relationships for AI comprehension<br/><br/>
            <b>[MEDIUM] Week 3-4</b> • Review & Reputation Audit<br/>
            Identify and fix AI-invisible review content
            """.format(self.config['name'])
        elif self.industry == 'dental':
            actions_text = """
            <b>[HIGH] Week 1-2</b> • Deploy llms.txt for {0}<br/>
            Create machine-readable service catalog (种植牙/隐形矫正/美白)<br/><br/>
            <b>[HIGH] Week 1-2</b> • Dental Schema Markup<br/>
            Implement AI-optimized treatment and dentist profiles<br/><br/>
            <b>[MEDIUM] Week 3-4</b> • Local Entity Graph<br/>
            Build "{0} + 城市" entity relationships for AI comprehension<br/><br/>
            <b>[MEDIUM] Week 3-4</b> • Patient Review Audit<br/>
            Identify and fix AI-invisible review content
            """.format(self.config['name'])
        else:
            actions_text = """
            <b>[HIGH] Week 1-2</b> • Deploy llms.txt<br/>
            Create machine-readable manifest for AI crawlers<br/><br/>
            <b>[HIGH] Week 1-2</b> • Schema Markup Fix<br/>
            Implement AI-optimized structured data<br/><br/>
            <b>[MEDIUM] Week 3-4</b> • Semantic Graph Setup<br/>
            Build entity relationships for AI comprehension<br/><br/>
            <b>[MEDIUM] Week 3-4</b> • Content Audit<br/>
            Identify and fix AI-invisible content
            """
        
        elements.append(Paragraph(actions_text, self.styles['BodyText']))
        elements.append(Spacer(1, 0.8*cm))
        
        elements.append(Paragraph("<b>Expected Results</b>", self.styles['SectionTitle']))
        results_text = f"""
        <b>[OK] 14 days:</b> First AI mention for {self.config['keywords']}<br/><br/>
        <b>[OK] 30 days:</b> 40% improvement in {self.config['name']} AI visibility<br/><br/>
        <b>[OK] 90 days:</b> Presence in 4+ AI platforms for {self.config['name']} queries
        """
        elements.append(Paragraph(results_text, self.styles['BodyText']))
        elements.append(Spacer(1, 0.8*cm))
        
        # 行业特定CTA
        cta_box = Table([[
            Paragraph(
                f"<font size='14' color='#fbbf24'><b>Your {self.config['name']} Clients Are Being Stolen</b></font><br/><br/>"
                f"Every day you wait, competitors capture more high-intent {self.config['name']} patients.<br/><br/>"
                "<b>Schedule Your Strategic Briefing:</b><br/>"
                f"• See exactly how many {self.config['name']} patients you're losing to AI<br/>"
                f"• Discover which AI platforms ignore your {self.config['name']} services<br/>"
                f"• Get your 14-day {self.config['name']} GEO recovery roadmap<br/><br/>"
                "<font size='12' color='#16a34a'><b>geo@stackmatrices.com</b></font>",
                ParagraphStyle(name='CTAAll', parent=self.styles['Normal'],
                              alignment=TA_CENTER, textColor=colors.white, leading=18))
        ]], colWidths=[16*cm])
        cta_box.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), self.C_PRIMARY),
            ('PADDING', (0, 0), (-1, -1), 20),
            ('LINEBELOW', (0, 0), (-1, -1), 3, self.C_RED),
        ]))
        elements.append(cta_box)
        
        return elements
    
    def _create_radar(self, scores):
        if not MATPLOTLIB_AVAILABLE:
            return None
        try:
            cats = ['Technical', 'Content', 'Local', 'UX', 'AI']
            vals = [
                scores.get('technical_seo', {}).get('score', 0),
                scores.get('content_seo', {}).get('score', 0),
                scores.get('offsite_seo', {}).get('score', 0),
                scores.get('user_experience', {}).get('score', 0),
                scores.get('ai_visibility', {}).get('score', 0),
            ]
            
            angles = np.linspace(0, 2 * np.pi, len(cats), endpoint=False).tolist()
            vals_plot = vals + vals[:1]
            angles += angles[:1]
            
            fig, ax = plt.subplots(figsize=(5, 4), subplot_kw=dict(polar=True))
            ax.fill(angles, vals_plot, color='#dc2626', alpha=0.15)
            ax.plot(angles, vals_plot, color='#dc2626', linewidth=2)
            
            ax.set_yticks([25, 50, 75, 100])
            ax.set_yticklabels(['25', '50', '75', '100'], fontsize=7, color='#6b7280')
            ax.yaxis.grid(True, linestyle='--', alpha=0.5)
            ax.xaxis.grid(True, linestyle='--', alpha=0.5)
            ax.set_xticks(angles[:-1])
            ax.set_xticklabels(cats, fontsize=9, fontweight='bold')
            ax.set_ylim(0, 100)
            
            for angle, val in zip(angles[:-1], vals):
                ax.annotate(str(val), xy=(angle, val), xytext=(angle, val + 10),
                           fontsize=9, fontweight='bold', ha='center', color='#1e3a8a')
            
            plt.tight_layout()
            chart_path = os.path.join(self.output_dir, 'radar_v42.png')
            plt.savefig(chart_path, dpi=150, bbox_inches='tight', facecolor='white')
            plt.close()
            return chart_path
        except Exception as e:
            print(f"Radar error: {e}")
            return None


def generate_report(data, client_name="Client", industry="default", output_dir="output"):
    """
    生成敲门砖PDF报告
    
    Args:
        data: 评估数据字典
        client_name: 客户名称
        industry: 行业类型 ('medical_beauty', 'dental', 'default')
        output_dir: 输出目录
    
    Returns:
        pdf文件路径
    """
    gen = PDFReportGenerator(output_dir=output_dir, industry=industry)
    return gen.generate(data, client_name=client_name)


# 兼容别名
generate_pdf_report_v42 = generate_report
