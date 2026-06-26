#!/usr/bin/env python3
"""Check for duplicate keys in i18n.ts."""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Find all key definitions
keys = re.findall(r'"([^"]+)":\s*\{', content)
from collections import Counter
counts = Counter(keys)
duplicates = {k: v for k, v in counts.items() if v > 1}

if duplicates:
    print(f"Found {len(duplicates)} duplicate keys:")
    for k, v in sorted(duplicates.items()):
        print(f"  {k}: {v} times")
else:
    print("No duplicate keys found!")

print(f"\nTotal keys: {len(keys)}, Unique: {len(set(keys))}")
