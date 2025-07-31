# backend/pdf_generator/generator.py
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from io import BytesIO
import boto3
from datetime import datetime
from typing import Dict
import uuid

class PDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.custom_styles = self._create_custom_styles()
    
    def _create_custom_styles(self):
        return {
            'CustomTitle': ParagraphStyle(
                'CustomTitle',
                parent=self.styles['Heading1'],
                fontSize=20,
                spaceAfter=30,
                textColor=colors.darkblue
            ),
            'SectionHeader': ParagraphStyle(
                'SectionHeader',
                parent=self.styles['Heading2'],
                fontSize=14,
                spaceBefore=20,
                spaceAfter=10,
                textColor=colors.darkgreen
            )
        }
    
    async def generate_report(self, product_info: Dict, constraints: Dict) -> str:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=inch)
        
        story = []
        
        # Title
        story.append(Paragraph("RAPPORT DE PRODUIT STRUCTURÉ", self.custom_styles['CustomTitle']))
        story.append(Spacer(1, 20))
        
        # Generation info
        story.append(Paragraph(f"Généré le: {datetime.now().strftime('%d/%m/%Y %H:%M')}", self.styles['Normal']))
        story.append(Paragraph(f"Référence: SPG-{uuid.uuid4().hex[:8].upper()}", self.styles['Normal']))
        story.append(Spacer(1, 30))
        
        # Client constraints
        story.append(Paragraph("PARAMÈTRES CLIENT", self.custom_styles['SectionHeader']))
        constraints_data = [
            ['Durée', f"{constraints['duration']} mois"],
            ['Rendement cible', f"{constraints['target_yield']}%"],
            ['Niveau de risque', constraints['risk_level'].title()],
            ['Montant investi', f"{constraints['amount']:,.0f} €"]
        ]
        constraints_table = Table(constraints_data, colWidths=[2*inch, 2*inch])
        constraints_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(constraints_table)
        story.append(Spacer(1, 30))
        
        # Product details
        story.append(Paragraph("PRODUIT SÉLECTIONNÉ", self.custom_styles['SectionHeader']))
        story.append(Paragraph(f"<b>{product_info.name}</b>", self.styles['Normal']))
        story.append(Paragraph(product_info.description, self.styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Financial metrics
        story.append(Paragraph("MÉTRIQUES FINANCIÈRES", self.custom_styles['SectionHeader']))
        metrics_data = [
            ['Rendement attendu', f"{product_info.expected_yield*100:.2f}%"],
            ['Gain projeté', f"{product_info.expected_return:,.0f} €"],
            ['Score d\'adéquation', f"{product_info.score:.0f}/300"]
        ]
        metrics_table = Table(metrics_data, colWidths=[2*inch, 2*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightblue),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(metrics_table)
        story.append(Spacer(1, 30))
        
        # Greeks
        story.append(Paragraph("SENSIBILITÉS (GREEKS)", self.custom_styles['SectionHeader']))
        greeks_data = [
            ['Delta', f"{product_info.greeks.delta:.3f}"],
            ['Vega', f"{product_info.greeks.vega:.3f}"],
            ['Theta', f"{product_info.greeks.theta:.3f}"],
            ['Gamma', f"{product_info.greeks.gamma:.3f}"]
        ]
        greeks_table = Table(greeks_data, colWidths=[2*inch, 2*inch])
        greeks_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightyellow),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(greeks_table)
        
        # Build PDF
        doc.build(story)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        # Upload to S3 (simulation)
        file_key = f"reports/spg-{uuid.uuid4().hex}.pdf"
        # In real implementation: upload to S3
        # s3_client.put_object(Bucket='your-bucket', Key=file_key, Body=pdf_content)
        
        return f"https://your-bucket.s3.amazonaws.com/{file_key}"
