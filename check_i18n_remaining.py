import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

issues = []
for i, line in enumerate(lines, 1):
    text = line.strip()
    # Check for remaining \\u (double-escaped)
    if '\\\\u' in text:
        issues.append(('double_escape', i, text[:200]))
    # Check for unterminated zh strings (zh value ends with ': },')
    if 'zh:' in text and text.endswith(': },'):
        issues.append(('unterminated_zh', i, text[:200]))
    # Check for mixed English/Chinese corruption (e.g. "Prepare Nutrition \\u6807")
    if '\\u6' in text or '\\u8' in text or '\\u6807' in text:
        if 'zh:' in text:
            issues.append(('partial_fix', i, text[:200]))

print(f'Total issues: {len(issues)}')
types = {}
for t, *_ in issues:
    types[t] = types.get(t, 0) + 1
for k, v in sorted(types.items()):
    print(f'  {k}: {v}')

print('\nSample issues:')
for typ, ln, txt in issues[:10]:
    print(f'  [{typ}] Line {ln}: {txt}')
