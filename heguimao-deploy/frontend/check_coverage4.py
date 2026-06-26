#!/usr/bin/env python3
"""Precise t() scanner - only match actual t() function calls"""
import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

frontend_dir = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src"
i18n_path = os.path.join(frontend_dir, "lib", "i18n.ts")

with open(i18n_path, "r", encoding="utf-8") as f:
    i18n_content = f.read()

defined_keys = set(re.findall(r'"([^"]+)":\s*\{', i18n_content))

used_keys = set()
skipped = []

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
            if stripped.startswith(('import ', 'from ', 'export ')):
                continue
            if 't("' not in stripped and "t('" not in stripped:
                continue
            
            # Only match t("key") or t('key') patterns
            # Exclude params.get, split, createElement, etc.
            matches = re.findall(r'\bt\(\s*["\']([^"\']+)["\']\s*\)', stripped)
            for key in matches:
                # Must be a valid i18n key format (contains dots or is a known phrase)
                if len(key) > 50:  # Too long, likely not an i18n key
                    skipped.append((fpath, lineno, key[:50]))
                    continue
                if key.startswith('./') or key.startswith('../'):
                    skipped.append((fpath, lineno, key))
                    continue
                used_keys.add(key)

print(f"Defined keys: {len(defined_keys)}")
print(f"Used keys: {len(used_keys)}")

missing = used_keys - defined_keys
print(f"Missing keys: {len(missing)}")
if missing:
    for k in sorted(missing):
        print(f"  ❌ {k}")
else:
    print("  ✅ None! All used keys are defined.")

unused = defined_keys - used_keys
print(f"\nDefined but never used: {len(unused)}")
print(f"Coverage: {len(used_keys)}/{len(defined_keys)} = {len(used_keys)/len(defined_keys)*100:.1f}%")

if skipped:
    print(f"\nSkipped ({len(skipped)} long/invalid matches):")
    for s in skipped[:5]:
        print(f"  {s[0]}:{s[1]} -> '{s[2]}...'")
