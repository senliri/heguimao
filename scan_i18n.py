import os

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"
with open(filepath, 'rb') as f:
    data = f.read()
    lines = data.split(b'\n')

bad = []
for i, line in enumerate(lines, 1):
    text = line.decode('utf-8', errors='replace')
    if '\\\\u' in text:
        bad.append((i, text[:300]))

print(f'Found {len(bad)} lines with double-escaped unicode:')
for ln, txt in bad:
    print(f'  Line {ln}: {txt.strip()}')

# Also check for unterminated strings (missing closing quote before })
for i, line in enumerate(lines, 1):
    text = line.decode('utf-8', errors='replace')
    if 'zh:' in text and text.strip().endswith(': },'):
        # Check if zh value has unclosed quote
        zh_part = text.split('zh:')[1] if 'zh:' in text else ''
        if zh_part.strip() and not zh_part.strip().startswith('"'):
            bad.append((i, text[:300]))

print(f'\nFound {len(bad)} total problematic lines')
