import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# CORRECTED corruption map:
# 鈥 (U+9225 = \xe9\x88\xa5) → → (U+2192) — same as 锛
# 锛 (U+922B = \xe9\x88\xab) → → (U+2192)
# These are BOTH corrupted arrows, not double quotes!
CORRUPTIONS = [
    ('\u951b', '\uff1a'),   # 锛 -> ： (FULLWIDTH COLON)
    ('\u9486', '\u3001'),   # 銆 -> 、 (IDEOGRAPHIC COMMA)
    ('\u9225', '\u2192'),   # 鈥 -> → (RIGHT ARROW) — FIXED!
    ('\u922b', '\u2192'),   # 锛 -> → (RIGHT ARROW)
    ('\u9515', '\u3002'),   # 锕 -> 。 (FULLWIDTH STOP)
    ('\u9514', '\u00b7'),   # 锔 -> · (MIDDLE DOT)
    ('\u9439', '\u2014'),   # 鈹 -> — (EM DASH)
]

for bad, good in CORRUPTIONS:
    count = text.count(bad)
    if count > 0:
        text = text.replace(bad, good)
        print(f"Replaced U+{ord(bad):04X} ({bad}) with U+{ord(good):04X} ({good}) [{count} times]")

# Fix trailing ? after arrows (corrupted closing ")
text = text.replace('→?', '→')

# Fix fragments (lines starting with , zh:)
lines = text.split('\n')
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    if line.strip().startswith(', zh:') and i > 0:
        prev = new_lines[-1]
        merged = prev.rstrip() + ' ' + line.lstrip()
        new_lines[-1] = merged
        print(f"Merged fragment line {i+1}")
        i += 1
        continue
    new_lines.append(line)
    i += 1

text = '\n'.join(new_lines)

# Fix zh values missing closing quotes
lines = text.split('\n')
new_lines = []
for line in lines:
    if ', zh:' in line:
        m = re.search(r',\s*zh:\s*"(.*)"', line)
        if not m:
            m2 = re.search(r',\s*zh:\s*"', line)
            if m2:
                val_start = m2.end()
                close_brace = line.rfind('}')
                if close_brace > val_start:
                    line = line[:close_brace] + '"' + line[close_brace:]
    new_lines.append(line)

text = '\n'.join(new_lines)

# Fix orphaned uXXXX escapes
def restore_escapes(m):
    return '\\u' + m.group(1)

lines = text.split('\n')
new_lines = []
for line in lines:
    if ', zh:' in line:
        line = re.sub(r'(?<!\\)u([0-9a-fA-F]{4})', restore_escapes, line)
    new_lines.append(line)

text = '\n'.join(new_lines)

with open(filepath, "w", encoding="utf-8", newline='\n') as f:
    f.write(text)

print("\nDone.")

# Verify brace balance
brace_depth = 0
in_str = False
str_ch = None
line_num = 0
for idx, ch in enumerate(text):
    if idx == 0 or text[max(0,idx-1)] == '\n':
        line_num += 1
    if in_str:
        if ch == str_ch:
            in_str = False
    else:
        if ch in ('"', "'"):
            in_str = True
            str_ch = ch
        elif ch == '{':
            brace_depth += 1
        elif ch == '}':
            brace_depth -= 1
            if brace_depth < 0:
                print(f"Extra }} at line {line_num}")

print(f"Final brace depth: {brace_depth}")

# Verify zh values
bad = 0
lines = text.split('\n')
for i, line in enumerate(lines, 1):
    if line.strip().startswith(', zh:'):
        bad += 1
        print(f"Fragment line {i}")
    if ', zh:' in line:
        m = re.search(r',\s*zh:\s*"(.*)"', line)
        if not m:
            bad += 1
            if bad <= 3:
                print(f"Bad zh {i}: {line[:60]}")

if bad == 0:
    print("All checks passed!")
