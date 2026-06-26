#!/usr/bin/env python3
"""Fix remaining hardcoded strings in Report.tsx."""
import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages\Report.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Mapping of exact strings to t() calls
# Order matters: longer strings first to avoid partial replacements
replacements = [
    # JSX text nodes
    ('>Return Home<', '>{t("report.return_home")}<'),
    ('>Generating...<', '>{t("report.generating")}<'),
    ('>Download Report (PDF)<', '>{t("report.download_pdf")}<'),
    ('>Share Report<', '>{t("report.share")}<'),
    ('>View Appeal Guide<', '>{t("report.view_appeal")}<'),
    ('>Send Report via Email<', '>{t("report.send_email")}<'),
    ('>Opens your default email client with the report summary pre-filled<', '>{t("report.send_email_desc")}<'),
    ('>your@email.com<', 'placeholder="{t("profile.email")}"<'),  # placeholder attribute
    ('>No category selected, using general data<', '>{t("report.no_cat_warn")}<'),
    ('>AI is generating diagnosis report...<', '>{t("report.generating")}<'),
    ('>No compliance data available for this category and market<', '>{t("report.no_data")}<'),
    ('>AI Smart Analysis<', '>{t("report.ai_smart")}<'),
    ('>Auto-matched based on product features<', '>{t("report.auto_match")}<'),
    ('>Priority<', '>{t("report.priority")}<'),
    ('>Medium Risk<', '>{t("report.med_risk")}<'),
    ('>High Risk<', '>{t("report.high_risk")}<'),
    ('>Total Items<', '>{t("report.total_items")}<'),
    ('>AI Recommendations<', '>{t("report.ai_recs_tab")}<'),
    ('>Compliance Checklist<', '>{t("report.checklist")}<'),
    ('>Market Prerequisites<', '>{t("report.market_prereqs_tab")}<'),
    ('>Action Plan<', '>{t("report.action_plan_tab")}<'),
    ('>AI is analyzing product compliance risks...<', '>{t("report.analyzing")}<'),
    ('>🔴 Priority — These items have the biggest impact<', '>{t("report.priority")} — {t("report.priority_note")}<'),
    ('>🟡 Recommended — Improve compliance completeness<', '>{t("report.recommended")} — {t("report.recommended_note")}<'),
    ('>🟢 Optional — Depends on your product<', '>{t("report.optional")} — {t("report.optional_note")}<'),
    
    # PDF text
    ('"Disclaimer: This report is for reference only and does not constitute legal advice. Compliance requirements may change. Please refer to the latest information from regulatory authorities."', 't("report.disclaimer")'),
    
    # Console.error
    ('console.error("PDF export failed:"', 'console.error(t("report.pdf_export_fail"),'),
    
    # Banner text
    ('>Need a complete compliance guide? Download our expert manuals.', '>t("report.banner_title")'),
    ('>PPWR Manual ($29.90) | CPSC eFiling Manual ($9.90) | Amazon Suspension Guide ($29)', '>t("report.banner_products")'),
    ('>Available on Payhip & Gumroad — scan QR or visit: heguimao.pages.dev', '>t("report.banner_url")'),
    ('>Scan QR code or visit', '>t("report.scan_qr")'),
    
    # Lab test advice
    ('>Lab test results expiring within 6 months may not be accepted.', '>t("report.lab_advice")'),
]

changed = 0
for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        changed += 1
        print(f"OK Replaced: {old[:70]}")
    else:
        print(f"MISSING: {old[:70]}")

print(f"\nApplied {changed}/{len(replacements)} replacements")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Wrote {filepath}")
