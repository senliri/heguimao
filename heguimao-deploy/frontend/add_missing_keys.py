#!/usr/bin/env python3
"""Collect all t() keys used in Report.tsx and add missing ones to i18n.ts."""
import re, sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages\Report.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Extract all t("...") and t('...') calls
keys = set(re.findall(r't\(["\']([^"\']+)["\']\)', content))

i18n_path = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"
with open(i18n_path, "r", encoding="utf-8") as f:
    i18n_content = f.read()

# Extract existing keys
existing = set(re.findall(r'"\s*([^"]+)\s*":\s*\{', i18n_content))

missing = keys - existing
print(f"Keys used in Report.tsx: {len(keys)}")
print(f"Keys in i18n.ts: {len(existing)}")
print(f"Missing keys: {len(missing)}")

if missing:
    print("\nMissing keys:")
    for k in sorted(missing):
        print(f'  "{k}"')
else:
    print("\nAll keys are present!")
