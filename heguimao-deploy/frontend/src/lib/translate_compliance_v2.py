# -*- coding: utf-8 -*-
"""Translate untranslated site.compliance.* keys in i18n.ts"""
import re

# Load untranslated keys
untranslated = []
with open(r'D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\untranslated_keys.txt', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        parts = line.split('\t', 1)
        if len(parts) == 2:
            untranslated.append((parts[0], parts[1]))

print(f'Loaded {len(untranslated)} untranslated keys')

# Filter to only site.compliance keys
compliance_keys = [(k, v) for k, v in untranslated if k.startswith('site.compliance')]
print(f'site.compliance keys to translate: {len(compliance_keys)}')

# Show distribution
from collections import defaultdict
cats = defaultdict(list)
for k, v in compliance_keys:
    # Extract category: site.compliance.X
    parts = k.split('.')
    if len(parts) >= 3:
        cat = 'site.' + parts[1] + '.' + parts[2]
    elif len(parts) >= 2:
        cat = 'site.' + parts[1]
    else:
        cat = k
    cats[cat].append((k, v))

for cat, items in sorted(cats.items()):
    print(f'  {cat}: {len(items)} keys')
