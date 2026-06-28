import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# Replace non-ASCII characters in en values only (keep zh values as \uXXXX escapes)
# Split into lines, process en values
lines = text.split('\n')
new_lines = []
for line in lines:
    if ', zh:' not in line:
        # No zh value on this line — skip
        new_lines.append(line)
        continue
    
    # Has zh value. Find the en value and replace non-ASCII
    m = re.search(r'"([^"]+)":\s*\{\s*en:\s*"(.+?)",\s*zh:', line)
    if m:
        key = m.group(1)
        en_val = m.group(2)
        
        # Replace non-ASCII in en value
        new_en = []
        for ch in en_val:
            if ord(ch) > 127:
                # Map common non-ASCII to ASCII
                replacements = {
                    '\u2192': '->',   # →
                    '\u2190': '<-',   # ←
                    '\u2191': '^',    # ↑
                    '\u2193': 'v',    # ↓
                    '\u2014': '--',   # —
                    '\u2013': '-',    # –
                    '\u2026': '...',  # …
                    '\u00b7': '.',    # ·
                }
                new_en.append(replacements.get(ch, '?'))
            else:
                new_en.append(ch)
        
        new_en_str = ''.join(new_en)
        line = line[:m.start(2)] + new_en_str + line[m.end(2):]
    
    new_lines.append(line)

text = '\n'.join(new_lines)

with open(filepath, "w", encoding="utf-8", newline='\n') as f:
    f.write(text)

print("Done.")

# Verify
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Line 591: {repr(lines[590])}")

# Check for any non-ASCII in en values
bad = 0
for i, line in enumerate(lines, 1):
    if ', zh:' in line:
        m = re.search(r'en:\s*"(.+?)",\s*zh:', line)
        if m:
            en_val = m.group(1)
            for ch in en_val:
                if ord(ch) > 127:
                    bad += 1
                    if bad <= 3:
                        print(f"Line {i}: Still non-ASCII in en: {repr(en_val)}")

if bad == 0:
    print("All en values are ASCII-only!")
