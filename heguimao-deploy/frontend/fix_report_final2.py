#!/usr/bin/env python3
"""Final sweep: fix all remaining hardcoded English strings in Report.tsx."""
import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages\Report.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# All remaining hardcoded strings -> t() calls
# Using exact byte-level matching
fixes = [
    # Line 741: Key Warnings
    ("⚠ Key Warnings</h3>", "⚠ {t(\"report.key_warn\")}</h3>"),
    
    # Action Items heading
    (">Action Items & Plan</h2>", ">{t(\"report.action_plan\")}</h2>"),
    
    # No action items
    (">No action items available</p>", ">{t(\"report.no_actions\")}</p>"),
    
    # Severity labels
    (">High Priority", ">{t(\"report.high_priority\")}"),
    (">Medium Priority", ">{t(\"report.med_priority\")}"),
    (">Low Priority", ">{t(\"report.low_priority\")}"),
    ("Immediate action required", "t(\"report.immediate_action\")"),
    ("Handle soon", "t(\"report.handle_soon\")"),
    ("Handle in order", "t(\"report.handle_order\")"),
    
    # Breadcrumb
    ('">Home</a>', '">{t("nav.home")}</a>'),
    ('">Report</a>', '">{t("nav.report")}</a>'),
    
    # Compliance Checklist tab
    (">No detailed compliance data for this category and market</p>", ">{t(\"report.no_detail\")}</p>"),
    
    # Prerequisites tab
    (">Market Prerequisites & Business Risks</h2>", ">{t(\"report.market_risks\")}</h2>"),
    (">Corporate Entity Risks</h3>", ">{t(\"report.corp_risks\")}</h3>"),
    (">Recommended Testing Laboratories</h3>", ">{t(\"report.lab_section\")}</h3>"),
    (">Certificate Verification Methods</h3>", ">{t(\"report.cert_verify\")}</h3>"),
    
    # Shell/Name/Doc labels
    ("Shell Company Risk:", "t(\"report.shell\"):"),
    ("Name Matching:", "t(\"report.name_match\"):"),
    ("Document Verification:", "t(\"report.doc_verify\"):"),
    
    # Lab advice
    ("Choose labs accredited by ILAC-MRA. Avoid instant-cert factories.", "t(\"report.lab_advice\")"),
    
    # EORI Number
    ("EORI Number:", "t(\"report.eori_num\":"),
    ("Required for customs. Apply via national tax authority.", "t(\"report.eori_desc\")"),
    
    # VAT
    ("VAT Registration:", "t(\"report.vat\":"),
    ("Mandatory. Register in each target country", "t(\"report.vat_desc\")"),
    
    # EPR
    ("EPR Registration:", "t(\"report.epr\":"),
    ("Extended Producer Responsibility by product type:", "t(\"report.epr_desc\")"),
    
    # EU Rep
    ("EU Authorized Rep:", "t(\"report.eu_rep\":"),
    ("Required for CE marking. Must have physical EU address.", "t(\"report.eu_rep_desc\")"),
    
    # UK VAT
    ("UK VAT:", "t(\"report.uk_vat\":"),
    ("Required if turnover exceeds", "t(\"report.uk_vat_desc\")"),
    
    # UK RP
    ("UK Responsible Person:", "t(\"report.uk_rp\":"),
    ("Required for UKCA marking. Must be UK-based.", "t(\"report.uk_rp_desc\")"),
    
    # UK EPR
    ("UK EPR:", "t(\"report.uk_epr\":"),
    ("New rules from 2025: separate registration for packaging, waste, batteries.", "t(\"report.uk_epr_desc\")"),
    
    # US Business
    ("US Business Registration:", "t(\"report.us_reg\":"),
    ("EIN (Employer ID) or SSN required for individual sellers.", "t(\"report.us_reg_desc\")"),
    
    # US Address
    ("US Physical Address:", "t(\"report.us_addr\":"),
    ("P.O. Boxes not accepted for compliance docs.", "t(\"report.us_addr_desc\")"),
    
    # Sales Tax
    ("Sales Tax:", "t(\"report.sales_tax\":"),
    ("Nexus varies by state. Use Amazon Tax or consult professional.", "t(\"report.sales_tax_desc\")"),
    
    # JP Tax
    ("Japanese Tax ID:", "t(\"report.jp_tax\":"),
    ("Required for cross-border sales, via e-Tax system.", "t(\"report.jp_tax_desc\")"),
    
    # Consumer Affairs
    ("Consumer Affairs Registration:", "t(\"report.consumers\":"),
    ("Required for food, cosmetics, certain consumer goods.", "t(\"report.consumers_desc\")"),
    
    # Shell risk
    ("Amazon flags virtual offices, co-working spaces. Use verified physical address.", "t(\"report.shell_desc\")"),
    
    # Name matching
    ("Bank account, tax ID, and seller central name must match.", "t(\"report.name_desc\")"),
    
    # Doc verification
    ("May request utility bills, bank statements, or government ID.", "t(\"report.doc_desc\")"),
    
    # FCC
    ("FCC ID:", "t(\"report.fcc_id\":"),
    ("Verify at", "t(\"report.verify_at\")"),
    
    # CE
    ("CE DoC:", "t(\"report.ce_doc\":"),
    ("Verify notified body, EU Rep, applicable directives.", "t(\"report.ce_v\")"),
    
    # CPC
    ("CPC:", "t(\"report.cpc\":"),
    ("Verify CPSC-accepted lab at", "t(\"report.cpc_v\")"),
    
    # PSE
    ("PSE (Japan):", "t(\"report.pse\":"),
]

changed = 0
for old, new in fixes:
    if old in content:
        content = content.replace(old, new)
        changed += 1
        print("OK")
    else:
        print("SKIP")

print(f"\nApplied {changed}/{len(fixes)} replacements")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Wrote {filepath}")
