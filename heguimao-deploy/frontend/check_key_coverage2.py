#!/usr/bin/env python3
"""Scan for t() calls excluding import statements"""
import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

frontend_dir = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src"
i18n_path = os.path.join(frontend_dir, "lib", "i18n.ts")

with open(i18n_path, "r", encoding="utf-8") as f:
    i18n_content = f.read()

defined_keys = set(re.findall(r'"([^"]+)":\s*\{', i18n_content))

used_keys = set()
missing_keys = set()
import_like = set()

for root, dirs, files in os.walk(frontend_dir):
    dirs[:] = [d for d in dirs if d != 'node_modules']
    for fname in files:
        if not (fname.endswith('.tsx') or fname.endswith('.ts')):
            continue
        fpath = os.path.join(root, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                lines = f.readlines()
        except:
            continue
        
        for line in lines:
            stripped = line.strip()
            # Skip import/export lines
            if stripped.startswith(('import ', 'from ', 'export ')):
                continue
            # Skip string literals that aren't t() calls
            # Match t("key") or t('key') but not in import/from
            matches = re.findall(r't\(\s*["\']([^"\']+)["\']\s*\)', stripped)
            for key in matches:
                used_keys.add(key)
                if key not in defined_keys:
                    # Categorize
                    if key.startswith('./') or key.startswith('../'):
                        import_like.add(key)
                    elif '/' in key or '.' in key:
                        import_like.add(key)
                    else:
                        missing_keys.add(key)

print(f"Defined keys: {len(defined_keys)}")
print(f"Used keys: {len(used_keys)}")
print(f"Import-like (not actual t() calls): {len(import_like)}")
if import_like:
    for k in sorted(import_like):
        print(f"  - {k}")
print(f"\nActual missing keys: {len(missing_keys)}")
if missing_keys:
    for k in sorted(missing_keys):
        print(f"  - {k}")
else:
    print("  ✅ None! All t() calls have defined keys.")

unused = defined_keys - used_keys
print(f"\nDefined but never used: {len(unused)}")
