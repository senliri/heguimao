import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

issues = []
for i, line in enumerate(lines, 1):
    text = line.strip()
    # Real double-escaped: literal backslash-backslash-u followed by 4 hex digits
    # In the file content, this appears as \\uXXXX (two backslashes then uXXXX)
    if re.search(r'\\\\u[0-9a-fA-F]{4}', text):
        issues.append((i, text[:250]))

print(f'Real double-escaped lines: {len(issues)}')
for ln, txt in issues[:20]:
    print(f'  Line {ln}: {txt}')

# Also check for unterminated zh strings
unterm = []
for i, line in enumerate(lines, 1):
    text = line.strip()
    if 'zh:' in text:
        # Check if zh value has mismatched quotes
        parts = text.split('zh:')
        if len(parts) >= 2:
            zh_val = parts[1]
            # Count quotes in zh value
            q_count = zh_val.count('"')
            if q_count % 2 != 0:
                unterm.append((i, text[:250]))

print(f'\nUnterminated zh strings: {len(unterm)}')
for ln, txt in unterm[:20]:
    print(f'  Line {ln}: {txt}')
