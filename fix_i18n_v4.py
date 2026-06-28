import re

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixed = 0
new_lines = []

for i, line in enumerate(lines):
    text = line.rstrip('\n')
    
    # Only process lines that contain both 'zh:' and have issues
    if 'zh:' not in text:
        new_lines.append(text)
        continue
    
    # Check for the two specific corruption patterns:
    # 1. Unterminated zh string: ends with ': },' or '、 },' (missing closing quote)
    # 2. Double-escaped garbage: \\u951b\\u5b7f etc embedded in zh value
    
    # Pattern A: zh value with missing closing quote
    # e.g.: zh: "\u60a8\u5df2\u5728\u5f53\u524d\u5957\u9910\uff1a },
    # Should be: zh: "\u60a8\u5df2\u5728\u5f53\u524d\u5957\u9910\uff1a" },
    if re.search(r'zh:\s*"[^"]*(?:\uff1a|\u3001)\s*\}\s*,?\s*$', text):
        # Fix: add missing closing quote before }
        new_text = re.sub(r'(zh:\s*")(\s*(?:\uff1a|\u3001))(\s*\}\s*,?\s*$)', r'\1\2" \3', text)
        # Simpler: find zh value, add quote before }
        m = re.search(r'(zh:\s*")(.+)("$)?\s*\}\s*,?\s*$', text)
        if m:
            prefix = m.group(1)
            value = m.group(2)
            has_close = m.group(3)
            if not has_close:
                # Check if value ends with ： or 、 (Chinese punctuation that got misinterpreted)
                if value.endswith('：') or value.endswith('、'):
                    new_text = text.replace(value, value + '"')
                    fixed += 1
                    if fixed <= 5:
                        print(f'Line {i+1}: Added missing quote')
                        print(f'  Old: {text[:200]}')
                        print(f'  New: {new_text[:200]}')
                    new_lines.append(new_text)
                    continue
    
    # Pattern B: double-escaped garbage \\u951b\\u5b7f in zh value
    # But NOT legitimate \\u2026 or \\u201c (these are escaped dashes/quotes)
    if '\\\\u951b' in text or '\\\\u4fd3' in text or '\\\\u9286' in text:
        # Remove the garbage sequences
        new_text = re.sub(r'\\\\u[0-9a-fA-F]{4}', '', text)
        # Also fix unterminated string if present
        # After removing garbage, check if zh value is properly terminated
        m = re.search(r'(zh:\s*")(.+)("$)?\s*\}\s*,?\s*$', new_text)
        if m and not m.group(3):
            val = m.group(2)
            if val.endswith('：') or val.endswith('、'):
                new_text = new_text.replace(val, val + '"')
        fixed += 1
        if fixed <= 5:
            print(f'Line {i+1}: Removed garbage + fixed quote')
            print(f'  Old: {text[:200]}')
            print(f'  New: {new_text[:200]}')
        new_lines.append(new_text)
        continue
    
    # Pattern C: legitimate double-escaped like \\u2026 in zh value
    # These are intentional (escaped em-dash etc in the EN text, sometimes leaked to zh)
    # Only fix if the double-escape is in the zh portion
    if '\\\\u2026' in text or '\\\\u201c' in text:
        # Check if it's in the zh value specifically
        zh_part_start = text.find('zh:')
        if zh_part_start >= 0:
            en_part = text[:zh_part_start]
            zh_part = text[zh_part_start:]
            # If double-escape is in en part, leave it (it's intentional)
            # If in zh part, fix it
            if '\\\\u' in zh_part:
                # The double-escape in zh part means literal \\u text
                # e.g. zh: "text \\u2026" should be zh: "text …" or zh: "text \\u2026"
                # Actually \\u2026 in source = literal \u2026 in JS string = "…" at runtime
                # So it's fine, leave it alone
                pass
        new_lines.append(text)
        continue
    
    # No issues found, keep as-is
    new_lines.append(text)

print(f'Total fixed: {fixed}')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print('File written.')
