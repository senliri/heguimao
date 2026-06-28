import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

# Restore original
import subprocess
subprocess.run(["git", "restore", filepath], cwd=r"D:\qclaw\workspace-AI工程师\heguimao-deploy")

with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# The corruption is: UTF-8 bytes misread as GBK
# Key patterns found:
# - 锛 (U+951B) = corrupted → (arrow)
# - 銆 (U+9486) = corrupted 、 (ideographic comma)  
# - 锕 (U+9515) = corrupted 。 (fullwidth period)
# - 锔 (U+9514) = corrupted · (middle dot)
# - 鈹 (U+9439) = corrupted — (em dash)
# - 锛? (U+951B + ?) = corrupted ： (fullwidth colon) — the ? is NOT a closing quote

# Replace individual corrupted characters (NOT pairs with ?)
REPLACEMENTS = [
    ('\u9225', '\u2192'),  # 鈥 → → (arrow)
    ('\u922b', '\u2192'),  # 锛 → → (arrow) 
    ('\u951b', '\uff1a'),  # 锛 → ： (fullwidth colon)
    ('\u9486', '\u3001'),  # 銆 → 、 (ideographic comma)
    ('\u9515', '\u3002'),  # 锕 → 。 (fullwidth period)
    ('\u9514', '\u00b7'),  # 锔 → · (middle dot)
    ('\u9439', '\u2014'),  # 鈹 → — (em dash)
]

for bad, good in REPLACEMENTS:
    count = text.count(bad)
    if count > 0:
        text = text.replace(bad, good)
        print(f"Replaced U+{ord(bad):04X} ({bad}) with U+{ord(good):04X} ({good}): {count} times")

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

# Verify
with open(filepath, "r", encoding="utf-8") as f:
    final = f.read()

lines = final.split('\n')
bad = 0
for i, line in enumerate(lines, 1):
    if line.strip().startswith(', zh:'):
        bad += 1
    if ', zh:' in line:
        m = re.search(r',\s*zh:\s*"(.*)"', line)
        if not m:
            bad += 1
            if bad <= 5:
                print(f"Bad zh {i}: {line[:80]}")

if bad == 0:
    print("All checks passed!")
