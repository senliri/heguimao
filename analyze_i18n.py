import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, 'rb') as f:
    data = f.read()
    lines = data.split(b'\n')

# Find lines with actual corruption
corrupt = []
unterm = []

for i, line in enumerate(lines):
    text = line.decode('utf-8', errors='replace')
    
    # Check for double-escaped garbage (literal backslash + backslash + u in the file)
    if b'\\\\u951b' in line or b'\\\\u4fd3' in line or b'\\\\u9286' in line:
        corrupt.append((i+1, text[:300]))
    
    # Check for unterminated zh strings
    if b'zh:' in line:
        # Find the zh value portion
        # Pattern: the zh value is between " and "}, or between " and },
        # If it ends with Chinese punctuation ： or 、 but no closing ", it's unterminated
        zh_idx = line.find(b'zh:')
        if zh_idx >= 0:
            zh_rest = line[zh_idx:]
            # Check if value has opening quote but no closing quote before }
            # Look for: zh: "...text： },  (no quote before })
            # or: zh: "...text、 },
            if re.search(rb'zh:\s*"[^"]*(?:\xef\x9a\x9a|\xe3\x80\x81)\s*\}', zh_rest):
                unterm.append((i+1, text[:300]))

print(f'Corrupt (double-escaped garbage): {len(corrupt)} lines')
print(f'Unterminated zh strings: {len(unterm)} lines')

print('\n--- CORRUPT SAMPLES ---')
for ln, txt in corrupt[:5]:
    print(f'  Line {ln}: {txt.strip()[:200]}')

print('\n--- UNTERMINATED SAMPLES ---')
for ln, txt in unterm[:5]:
    print(f'  Line {ln}: {txt.strip()[:200]}')
