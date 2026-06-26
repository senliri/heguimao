import re
from collections import Counter

with open(r'D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'"([^"]+)":\s*\{\s*en:\s*"([^"]*)",\s*zh:\s*"([^"]*)"\s*\}'
matches = re.findall(pattern, content)

untranslated = []
for key, en, zh in matches:
    if en and en == zh and len(en) > 2:
        untranslated.append((key, en))

print(f'Total keys: {len(matches)}')
print(f'Untranslated (en==zh): {len(untranslated)}')

compliance = [k for k,v in untranslated if k.startswith('site.compliance')]
print(f'site.compliance keys: {len(compliance)}')

cats = Counter()
for k, v in untranslated:
    parts = k.split('.')
    if len(parts) >= 2:
        cats[parts[1]] += 1
    else:
        cats['root'] += 1
print(f'Distribution: {dict(cats.most_common(10))}')

for k, v in untranslated[:20]:
    print(f'  {k}: "{v}"')

# Save untranslated list for next step
with open(r'D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\untranslated_keys.txt', 'w', encoding='utf-8') as f:
    for k, v in untranslated:
        f.write(f'{k}\t{v}\n')
print(f'\nSaved {len(untranslated)} keys to untranslated_keys.txt')
