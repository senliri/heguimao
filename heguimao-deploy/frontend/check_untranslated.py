import re

with open(r'D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all keys where en == zh (meaning untranslated)
# Pattern: "key": { en: "...", zh: "..." } where zh value equals en value
pattern = r'"([^"]+)":\s*\{\s*en:\s*"([^"]*)",\s*zh:\s*"\2"\s*\}'
matches = re.findall(pattern, content)
untranslated = [(k, v) for k, v in matches if v]
print(f'Total untranslated keys (en==zh): {len(untranslated)}')

# Categorize by prefix
cats = {}
for k, v in untranslated:
    parts = k.split('.')
    cat = '.'.join(parts[:3]) if len(parts) >= 3 else '.'.join(parts[:2])
    cats[cat] = cats.get(cat, 0) + 1

for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
    print(f'  {cat}: {count}')

# Show some samples
print('\nSamples:')
for k, v in untranslated[:10]:
    print(f'  {k}: "{v}"')
