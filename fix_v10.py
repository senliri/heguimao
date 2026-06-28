import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# Fix all corruption patterns:
# 1. 锛? (U+951B + ?) → ：" (fullwidth colon + closing quote) — 178 occurrences
# 2. 鈥? (U+9225 + ?) → → (arrow only, ? is noise) — 13 occurrences
# 3. 锛 (U+951B alone) → ： (fullwidth colon) — remaining after ? removal
# 4. 銆 (U+9486) → 、 (ideographic comma) — 170 occurrences
# 5. € (U+20AC) → — (em dash) — 287 occurrences
# 6. 鈹 (U+9239) → — (em dash) — 283 occurrences
# 7. 鈫 (U+922B) → → (arrow) — 2 occurrences

replacements = [
    ('\u951b?', '\uff1a"'),   # 锛? → ："
    ('\u9225?', '\u2192'),    # 鈥? → →
    ('\u922b?', '\u2192'),    # 锛? → →
    ('\u951b', '\uff1a'),     # 锛 → ：
    ('\u9486', '\u3001'),     # 銆 → 、
    ('\u20ac', '\u2014'),     # € → —
    ('\u9239', '\u2014'),     # 鈹 → —
    ('\u922b', '\u2192'),     # 锛 → →
]

for bad, good in replacements:
    count = text.count(bad)
    if count > 0:
        text = text.replace(bad, good)
        print(f"Fixed {bad!r} → {good!r}: {count} times")

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
        print(f"Fragment line {i}: {line[:60]}")
    if ', zh:' in line:
        m = re.search(r',\s*zh:\s*"(.*)"', line)
        if not m:
            bad += 1
            if bad <= 5:
                print(f"Bad zh {i}: {line[:80]}")

if bad == 0:
    print("All checks passed!")
