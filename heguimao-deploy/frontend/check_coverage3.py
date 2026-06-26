#!/usr/bin/env python3
"""Precise t() call scanner"""
import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

frontend_dir = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src"
i18n_path = os.path.join(frontend_dir, "lib", "i18n.ts")

with open(i18n_path, "r", encoding="utf-8") as f:
    i18n_content = f.read()

defined_keys = set(re.findall(r'"([^"]+)":\s*\{', i18n_content))

used_keys = set()
false_positives = []

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
        
        for lineno, line in enumerate(lines, 1):
            stripped = line.strip()
            # Skip import/export lines entirely
            if stripped.startswith(('import ', 'from ', 'export ')):
                continue
            # Skip lines that are clearly not t() calls
            # Must contain t( to be relevant
            if 't(' not in stripped:
                continue
            
            # Find t("key") or t('key') - but exclude import strings
            matches = re.findall(r't\(\s*["\']([^"\']+)["\']\s*\)', stripped)
            for key in matches:
                # Filter out obvious false positives
                if key.startswith('./') or key.startswith('../'):
                    false_positives.append((fpath, lineno, key, stripped[:80]))
                    continue
                if '@' in key and '.' in key:
                    false_positives.append((fpath, lineno, key, stripped[:80]))
                    continue
                if ';' in key or ':' in key:
                    false_positives.append((fpath, lineno, key, stripped[:80]))
                    continue
                used_keys.add(key)

print(f"Defined keys: {len(defined_keys)}")
print(f"Used keys (actual t() calls): {len(used_keys)}")

print(f"\nFalse positives (import strings, etc.): {len(false_positives)}")
for fp in false_positives[:10]:
    print(f"  {fp[0]}:{fp[1]} -> '{fp[2]}'")
    print(f"    Line: {fp[3]}")

missing = used_keys - defined_keys
print(f"\nActual missing keys: {len(missing)}")
if missing:
    for k in sorted(missing):
        print(f"  - {k}")
else:
    print("  ✅ None!")

unused = defined_keys - used_keys
print(f"\nDefined but never used: {len(unused)}")
