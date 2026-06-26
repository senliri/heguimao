# -*- coding: utf-8 -*-
"""
Complete i18n migration for site.ts, Category.tsx, Market.tsx, Report.tsx.
Handles:
1. site.ts - wrap all display strings with t()
2. Category.tsx - wrap all display strings with t()  
3. Market.tsx - wrap all display strings with t()
4. Report.tsx - wrap remaining hardcoded strings with t()
"""
import re, os

base = os.path.dirname(os.path.abspath(__file__))

# ============================================================
# Step 1: Fix site.ts - wrap compliance item fields with t()
# ============================================================
site_path = os.path.join(base, "frontend", "src", "data", "site.ts")
with open(site_path, "r", encoding="utf-8") as f:
    site_content = f.read()

# Replace name: "XXX" -> name: t("site.compliance.XXX_key"), required: true -> required: true
# We need to preserve the structure: { name: "...", required: true, desc: "...", severity: "...", action: "...", estimatedTime: "..." }

def wrap_compliance_field(match):
    """Wrap compliance item fields with t() calls."""
    field = match.group(1)  # name, desc, action, estimatedTime
    value = match.group(2)  # the string value
    
    # Generate a key from the value
    clean = value.strip('"').lower()
    clean = re.sub(r'[^a-z0-9]+', '_', clean)
    clean = clean.strip('_')
    
    return f'{field}: t("site.compliance.{field}.{clean}")'

# Match pattern: fieldName: "value" inside compliance objects
# Fields: name, desc, action, estimatedTime
for field in ['name', 'desc', 'action', 'estimatedTime']:
    pattern = rf'({field}:\s*)(["\'])(.*?)\2'
    def replacer(m, f=field):
        val = m.group(3)
        clean = val.lower()
        clean = re.sub(r'[^a-z0-9]+', '_', clean)
        clean = clean.strip('_')
        return f'{m.group(1)}{m.group(2)}site.compliance.{f}.{clean}{m.group(2)}'
    site_content = re.sub(pattern, replacer, site_content)

with open(site_path, "w", encoding="utf-8") as f:
    f.write(site_content)

print("site.ts compliance fields wrapped")

# ============================================================
# Step 2: Fix Report.tsx - wrap item.field references with t()
# ============================================================
report_path = os.path.join(base, "frontend", "src", "pages", "Report.tsx")
with open(report_path, "r", encoding="utf-8") as f:
    report_content = f.read()

# Wrap item.name, item.desc, item.action, item.estimatedTime in JSX
# Pattern: {item.name} -> {t(`site.compliance_name.${item._key}`)}
# But we don't have a unique key per item. So we'll use the text itself as the key.
# Better: wrap with t() and use a dynamic key based on the field name

# For recommendation cards, the items come from compliance data
# We need to call t() on each field value

# Replace {item.name} with a dynamic t() call
# Strategy: use t(`report.rec_${field}`) but that won't work per-item.
# 
# Better strategy: add a helper function in the component that wraps the translation.
# Or: just use t() directly with the value as key.

# Simplest: create a helper function
helper = '''
// i18n helper for compliance items
const recLabel = (field: string, value: string) => t(`report.rec_${field}_${value.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`);
'''

# Insert helper after the imports
import_end = report_content.find('export function Report')
if import_end > 0:
    report_content = report_content[:import_end] + helper + '\n' + report_content[import_end:]

# Now wrap {item.name} etc in JSX
# Pattern: {item.name} -> {recLabel('name', item.name)}
for field in ['name', 'desc', 'action']:
    pattern = rf'\{{item\.{field}\}}'
    replacement = f"{{recLabel('{field}', item.{field})}}"
    report_content = re.sub(pattern, replacement, report_content)

# For estimatedTime, it's often used in template literals
# {item.estimatedTime} -> {t(`report.rec_estimatedTime_${item.estimatedTime}`)}
pattern = r'\{item\.estimatedTime\}'
report_content = re.sub(pattern, '{t(`report.rec_estimated_time_${item.estimatedTime}`)}', report_content)

# Fix template literal: {item.name}${req}
pattern = r'\{item\.name\}\$\{req\}'
report_content = re.sub(pattern, "{recLabel('name', item.name)}${req}", report_content)

with open(report_path, "w", encoding="utf-8") as f:
    f.write(report_content)

print("Report.tsx item references wrapped")

# ============================================================
# Step 3: Fix Category.tsx
# ============================================================
cat_path = os.path.join(base, "frontend", "src", "pages", "Category.tsx")
with open(cat_path, "r", encoding="utf-8") as f:
    cat_content = f.read()

# Add t import
if 'import' not in cat_content[:500]:
    pass  # already has imports

# Wrap display strings
replacements_cat = [
    ('Home</Link>', '{t("category.breadcrumb_home")}</Link>'),
    ('{category?.label || "Category"}', '{t(`site.category_${category?.id}`)}'),
    ('Back to Categories', '{t("category.back_to_categories")}'),
    ('Category Not Found', '{t("category.not_found")}'),
    ('Select a specific type', '{t("category.select_specific_type")}'),
    ('Subcategories</h2>', '{t("category.subcategories")}</h2>'),
    ('Subcategory data', '{t("category.data_being_updated")}'),
    ('Skip, use default', '{t("category.skip_default_data")}'),
    ('<h3 className="font-semibold text-amber-300">Tip</h3>', '<h3 className="font-semibold text-amber-300">{t("category.tip")}</h3>'),
    ('Selecting a specific subcategory', '{t("category.subcategory_tip")}'),
]

for old, new in replacements_cat:
    cat_content = cat_content.replace(old, new)

# Wrap sub.label
cat_content = cat_content.replace('{sub.label}', '{t(`site.sub_${sub.id}`)}')

with open(cat_path, "w", encoding="utf-8") as f:
    f.write(cat_content)

print("Category.tsx done")

# ============================================================
# Step 4: Fix Market.tsx
# ============================================================
mkt_path = os.path.join(base, "frontend", "src", "pages", "Market.tsx")
with open(mkt_path, "r", encoding="utf-8") as f:
    mkt_content = f.read()

replacements_mkt = [
    ('Home</Link>', '{t("market.breadcrumb_home")}</Link>'),
    ('Select Market</span>', '{t("market.select_market")}</span>'),
    ('Back to Category', '{t("market.back_to_category")}'),
    ('Selected:', '{t("market.selected")}:'),
    ('No category selected', '{t("market.no_category_selected")}'),
    ('Select Target Market', '{t("market.select_target")}'),
    ('Perform targeted compliance', '{t("market.targeted_checks")}'),
    ('View compliance report', '{t("market.view_compliance_report")}'),
    ('Not sure about your target', '{t("market.not_sure")}'),
    ('Use general compliance', '{t("market.use_general_data")}'),
]

for old, new in replacements_mkt:
    mkt_content = mkt_content.replace(old, new)

# Wrap dynamic labels
mkt_content = mkt_content.replace('{category?.label || "Category"}', '{t(`site.category_${category?.id}`) || t("market.category_not_selected")}')
mkt_content = mkt_content.replace('{m.label}', '{t(`market.label.${m.id}`)}')
mkt_content = mkt_content.replace('{m.description}', '{t(`market.desc.${m.id}`)}')
mkt_content = mkt_content.replace('{sub.label}', '{t(`site.sub_${sub.id}`)}')

with open(mkt_path, "w", encoding="utf-8") as f:
    f.write(mkt_content)

print("Market.tsx done")
