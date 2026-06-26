#!/usr/bin/env python3
"""Fix remaining hardcoded strings in Report.tsx using regex."""
import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages\Report.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Simple string replacements (order: longest first)
replacements = [
    # PDF banner
    (">Need a complete compliance guide? Download our expert manuals.", ">t(\"report.banner_title\")"),
    (">PPWR Manual ($29.90) | CPSC eFiling Manual ($9.90) | Amazon Suspension Guide ($29)", ">t(\"report.banner_products\")"),
    (">Available on Payhip & Gumroad — scan QR or visit: heguimao.pages.dev", ">t(\"report.banner_url\")"),
    (">Scan QR code or visit", ">t(\"report.scan_qr\")"),
    
    # Lab advice
    (">Lab test results expiring within 6 months may not be accepted.", ">t(\"report.lab_advice\")"),
    
    # CE/FCC/FDA validity
    (">CE Certificate Validity:", ">t(\"report.ce_cert\"):"),
    (">FCC Certification Validity:", ">t(\"report.fcc_cert\"):"),
    (">FDA Registration Validity:", ">t(\"report.fda_cert\"):"),
    
    # Market prerequisites labels
    (">EORI Registration:", ">t(\"report.eori\"):"),
    (">VAT Registration:", ">t(\"report.vat\"):"),
    (">EPR Registration:", ">t(\"report.epr\"):"),
    (">EU Representative:", ">t(\"report.eu_rep\"):"),
    (">UK VAT:", ">t(\"report.uk_vat\"):"),
    (">UK Responsible Person:", ">t(\"report.uk_rp\"):"),
    (">UK EPR:", ">t(\"report.uk_epr\"):"),
    (">US Product Liability Insurance:", ">t(\"report.us_insurance\"):"),
    (">US Agent/Address:", ">t(\"report.us_addr\"):"),
    (">Sales Tax Collection:", ">t(\"report.sales_tax\"):"),
    (">Japan Consumption Tax:", ">t(\"report.jp_tax\"):"),
    (">Consumer Product Safety:", ">t(\"report.consumers\"):"),
    (">Shell Company:", ">t(\"report.shell\"):"),
    (">Document Verification:", ">t(\"report.doc_verify\"):"),
    (">Name Mismatch:", ">t(\"report.name_match\"):"),
    
    # Key warning
    (">Key Warning</h3>", ">t(\"report.key_warn\")</h3>"),
    
    # No detail message
    (">No compliance data available for this section.", ">t(\"report.no_detail\")"),
    
    # No actions message
    (">No actions to display.", ">t(\"report.no_actions\")"),
    
    # Estimated time
    (">Est. time:", ">t(\"report.estimated_time\"):"),
    
    # Breadcrumb text
    (">All Categories</a>", ">t(\"breadcrumb.category\")</a>"),
    (">Select Market</a>", ">t(\"breadcrumb.market\")</a>"),
]

changed = 0
for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        changed += 1
        print(f"OK: {old[:80]}")
    else:
        print(f"SKIP: {old[:80]}")

print(f"\nApplied {changed}/{len(replacements)} replacements")

# Also handle multi-line patterns - JSX text between > and <
# Pattern: >Text< where Text is English UI string and not already {t(
jsx_fixes = [
    (r'>AI Smart Analysis</span>', '>{t("report.ai_smart")}</span>'),
    (r'>Auto-matched based on product features</span>', '>{t("report.auto_match")}</span>'),
    (r'>Priority</p>', '>{t("report.priority")}</p>'),
    (r'>Medium Risk</p>', '>{t("report.med_risk")}</p>'),
    (r'>High Risk</p>', '>{t("report.high_risk")}</p>'),
    (r'>Total Items</p>', '>{t("report.total_items")}</p>'),
    (r'>AI Recommendations</button>', '>{t("report.ai_recs_tab")}</button>'),
    (r'>Compliance Checklist</button>', '>{t("report.checklist")}</button>'),
    (r'>Market Prerequisites</button>', '>{t("report.market_prereqs_tab")}</button>'),
    (r'>Action Plan</button>', '>{t("report.action_plan_tab")}</button>'),
    (r'>AI is analyzing product compliance risks...</div>', '>{t("report.analyzing")}</div>'),
    (r'>Return Home</Link>', '>{t("report.return_home")}</Link>'),
    (r'>Generating...</button>', '>{t("report.generating")}</button>'),
    (r'>Download Report \(PDF\)</button>', '>{t("report.download_pdf")}</button>'),
    (r'>Share Report</button>', '>{t("report.share")}</button>'),
    (r'>View Appeal Guide</Link>', '>{t("report.view_appeal")}</Link>'),
    (r'>Send Report via Email</h3>', '>{t("report.send_email")}</h3>'),
    (r'>Opens your default email client with the report summary pre-filled</p>', '>{t("report.send_email_desc")}</p>'),
    (r'>No category selected, using general data</span>', '>{t("report.no_cat_warn")}</span>'),
]

for pattern, replacement in jsx_fixes:
    content = re.sub(pattern, replacement, content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Done.")
