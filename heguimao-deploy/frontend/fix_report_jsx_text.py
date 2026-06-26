#!/usr/bin/env python3
"""Fix remaining JSX text node hardcoded strings in Report.tsx."""
import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages\Report.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# JSX text replacements: >TEXT< to >{t("key")}<
jsx_replacements = [
    ('>Sending...<', '>{t("report.sending")}...<'),
    ('>Sent!<', '>{t("report.sent")}!<'),
    ('>Open Email Client<', '>{t("report.open_email")}<'),
    ('>Email client opened! Complete and send the email manually.</p>', '>{t("report.email_sent_hint")}</p>'),
    ('>Return Home</Link>', '>{t("report.return_home")}</Link>'),
    ('>Key Warnings</h3>', '>{t("report.key_warn")}</h3>'),
]

changed = 0
for old, new in jsx_replacements:
    if old in content:
        content = content.replace(old, new)
        changed += 1
        try:
            print(f"OK: {old[:80]}")
        except:
            print(f"OK: {repr(old[:40])}")
    else:
        try:
            print(f"SKIP: {old[:80]}")
        except:
            print(f"SKIP: {repr(old[:40])}")

# Severity labels with emojis - handle separately
severity_fixes = [
    ('>High Priority', '>{t("report.high_priority")}'),
    ('>Medium Priority', '>{t("report.med_priority")}'),
    ('>Low Priority', '>{t("report.low_priority")}'),
    ('>Immediate action required', '>{t("report.immediate_action")}'),
    ('>Handle soon', '>{t("report.handle_soon")}'),
    ('>Handle in order', '>{t("report.handle_order")}'),
]

for old, new in severity_fixes:
    if old in content:
        content = content.replace(old, new)
        changed += 1
        print(f"SEV OK: {old}")

# Lab data map replacement
lab_pattern = r"\{\s*name:\s*'([^']+)',\s*site:\s*'([^']+)',\s*desc:\s*'([^']+)',\s*price:\s*'([^']+)'\s*\}"
price_map = {'Med-High': 'med_high', 'Medium': 'medium', 'Low-Med': 'low_med', 'High': 'high'}

def fix_lab(m):
    name = m.group(1)
    site = m.group(2)
    desc = m.group(3)
    price = m.group(4)
    base = name.lower().replace('&', '').replace(' ', '_')
    desc_key = f"lab.{base}_desc"
    price_key = f"price.{price_map.get(price, price.lower())}"
    return f'{{ name: "{name}", site: "{site}", desc: t("{desc_key}"), price: t("{price_key}") }}'

content = re.sub(lab_pattern, fix_lab, content)
print("Fixed lab data")

# Static label replacements
static_replacements = [
    ('>EORI Number:</span>', '>{t("report.eori_num")}:</span>'),
    ('>Required for customs. Apply via national tax authority.</div></div>', '>{t("report.eori_desc")}</div></div>'),
    ('>Mandatory. Register in each target country', '>{t("report.vat_desc")}'),
    ('>Extended Producer Responsibility by product type:', '>{t("report.epr_desc")}'),
    ('>EU Authorized Rep:</span>', '>{t("report.eu_rep")}:</span>'),
    ('>Required for CE marking. Must have physical EU address.', '>{t("report.eu_rep_desc")}'),
    ('>Required if turnover exceeds', '>{t("report.uk_vat_desc")}'),
    ('>Required for UKCA marking. Must be UK-based.', '>{t("report.uk_rp_desc")}'),
    ('>New rules from 2025: separate registration for packaging, waste, batteries.', '>{t("report.uk_epr_desc")}'),
    ('>US Business Registration:</span>', '>{t("report.us_reg")}:</span>'),
    ('>EIN (Employer ID) or SSN required for individual sellers.', '>{t("report.us_reg_desc")}'),
    ('>US Physical Address:</span>', '>{t("report.us_addr")}:</span>'),
    ('>P.O. Boxes not accepted for compliance docs.', '>{t("report.us_addr_desc")}'),
    ('>Sales Tax:</span>', '>{t("report.sales_tax")}:</span>'),
    ('>Nexus varies by state. Use Amazon Tax or consult professional.', '>{t("report.sales_tax_desc")}'),
    ('>Japanese Tax ID:</span>', '>{t("report.jp_tax")}:</span>'),
    ('>Required for cross-border sales, via e-Tax system.', '>{t("report.jp_tax_desc")}'),
    ('>Consumer Affairs Registration:</span>', '>{t("report.consumers")}:</span>'),
    ('>Required for food, cosmetics, certain consumer goods.', '>{t("report.consumers_desc")}'),
    ('>Amazon flags virtual offices, co-working spaces. Use verified physical address.', '>{t("report.shell_desc")}'),
    ('>Bank account, tax ID, and seller central name must match.', '>{t("report.name_desc")}'),
    ('>May request utility bills, bank statements, or government ID.', '>{t("report.doc_desc")}'),
    ('>Verify notified body, EU Rep, applicable directives.', '>{t("report.ce_v")}'),
    ('>Verify CPSC-accepted lab at', '>{t("report.cpc_v")}'),
    ('>Verify at', '>{t("report.verify_at")}'),
]

for old, new in static_replacements:
    if old in content:
        content = content.replace(old, new)
        changed += 1
        print(f"LABEL OK: {old[:60]}")

print(f"\nTotal changes: {changed}")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Wrote {filepath}")
