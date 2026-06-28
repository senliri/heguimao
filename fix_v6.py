import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# Step 1: Fix corrupted bytes → correct Unicode characters
CORRUPTIONS = [
    ('\u951b', '\uff1a'),   # 锛 -> ：
    ('\u9486', '\u3001'),   # 銆 -> 、
    ('\u9225', '\u201c'),   # 鈥 -> " (LEFT DOUBLE QUOTE)
    ('\u922b', '\u2192'),   # 锛 -> →
    ('\u9515', '\u3002'),   # 锕 -> 。 (FULLWIDTH STOP)
    ('\u9514', '\u00b7'),   # 锔 -> ·
    ('\u9439', '\u2014'),   # 鈹 -> —
]

for bad, good in CORRUPTIONS:
    count = text.count(bad)
    if count > 0:
        text = text.replace(bad, good)
        print(f"Replaced U+{ord(bad):04X} ({bad}) with U+{ord(good):04X} ({good}) [{count} times]")

# Step 2: Fix fragments (lines starting with , zh:)
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

# Step 3: Fix zh values missing closing quotes
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
                    print(f"  Added closing quote")
    new_lines.append(line)

text = '\n'.join(new_lines)

# Step 4: Fix orphaned uXXXX escapes
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

# Verify
with open(filepath, "r", encoding="utf-8") as f:
    final = f.read()

lines = final.split('\n')
bad = 0
for i, line in enumerate(lines, 1):
    if line.strip().startswith(', zh:'):
        bad += 1
        print(f"Fragment line {i}: {line[:60]}")
    if ', zh:' in line:
        m = re.search(r',\s*zh:\s*"(.*)"', line)
        if not m:
            bad += 1
            if bad <= 3:
                print(f"Bad zh {i}: {line[:60]}")

if bad == 0:
    print("All lines valid!")
else:
    print(f"{bad} issues remaining.")
