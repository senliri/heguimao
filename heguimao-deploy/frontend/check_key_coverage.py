#!/usr/bin/env python3
"""Scan all TSX/TS files for t() calls, compare against i18n.ts keys"""
import subprocess, sys, os, re
sys.stdout.reconfigure(encoding='utf-8')

frontend_dir = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src"
i18n_path = os.path.join(frontend_dir, "lib", "i18n.ts")

# 1. Extract all defined keys from i18n.ts
with open(i18n_path, "r", encoding="utf-8") as f:
    i18n_content = f.read()

defined_keys = set(re.findall(r'"([^"]+)":\s*\{', i18n_content))
print(f"Defined keys in i18n.ts: {len(defined_keys)}")

# 2. Scan all TSX/TS files for t("...") calls
used_keys = set()
missing_keys = set()

for root, dirs, files in os.walk(frontend_dir):
    # Skip node_modules
    dirs[:] = [d for d in dirs if d != 'node_modules']
    for fname in files:
        if not (fname.endswith('.tsx') or fname.endswith('.ts')):
            continue
        fpath = os.path.join(root, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
        except:
            continue
        
        # Find t("key") and t('key') calls
        matches = re.findall(r't\(\s*["\']([^"\']+)["\']\s*\)', content)
        for key in matches:
            used_keys.add(key)
            if key not in defined_keys:
                missing_keys.add(key)

print(f"\nKeys referenced in code: {len(used_keys)}")
print(f"Defined in i18n.ts: {len(defined_keys)}")
print(f"Missing from i18n.ts: {len(missing_keys)}")

if missing_keys:
    print("\n❌ Missing keys:")
    for k in sorted(missing_keys):
        print(f"  - {k}")
else:
    print("\n✅ All used keys are defined in i18n.ts")

# Also check defined keys that are never used
unused = defined_keys - used_keys
print(f"\nDefined but never used: {len(unused)} keys")
if len(unused) <= 20:
    for k in sorted(unused):
        print(f"  - {k}")
else:
    print("  (too many to list, top 20 shown)")
    for k in sorted(unused)[:20]:
        print(f"  - {k}")
