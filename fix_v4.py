import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, "rb") as f:
    raw = f.read()

text = raw.decode("utf-8")

# Step 1: Fix corrupted double quotes in en values
# 鈥? = corrupted `"` (left double quote) + closing JSON `"`
# After replacing 鈥 with ", we get `"?` which breaks JSON
# Replace `"?` with `"` (left double quote)
text = text.replace('"?', '"')

# Step 2: Fix corrupted Chinese punctuation
CORRUPTION_TO_UNICODE = [
    (b'\xe9\x94\x9b', '\uff1a'),   # 锛 -> ：
    (b'\xe9\x8a\x86', '\u3001'),   # 銆 -> 、
    (b'\xe9\x88\xab', '\u2192'),   # 锛 -> →
    (b'\xe9\x94\x95', '\uff0e'),   # 锕 -> ．
    (b'\xe9\x94\x94', '\u00b7'),   # 锔 -> ·
    (b'\xe9\x90\xb9', '\u2014'),   # 鈹 -> —
]

for bad_bytes, unicode_char in CORRUPTION_TO_UNICODE:
    count = text.encode("utf-8").count(bad_bytes)
    if count > 0:
        text = text.replace(bad_bytes.decode("latin-1"), unicode_char)
        print(f"Replaced {bad_bytes.hex()} ({count} times) with U+{ord(unicode_char):04X}")

# Step 3: Fix zh values missing closing quotes
lines = text.split('\n')
new_lines = []
for line in lines:
    if ', zh:' in line:
        m = re.search(r'(,\s*zh:\s*")(.*)(")', line)
        if m:
            prefix = m.group(1)
            value = m.group(2)
            suffix = m.group(3)
            
            # Restore missing backslashes before orphaned uXXXX
            fixed_value = re.sub(r'(?<!\\)u([0-9a-fA-F]{4})', r'\\u\1', value)
            
            if fixed_value != value:
                print(f"  Restored backslashes in zh value")
                line = f'{prefix}{fixed_value}{suffix}'
    new_lines.append(line)

text = '\n'.join(new_lines)

# Step 4: Ensure all zh values have closing quotes
lines = text.split('\n')
new_lines = []
for line in lines:
    if ', zh:' in line:
        m = re.search(r',\s*zh:\s*"(.*)"', line)
        if not m:
            # Missing closing quote - find zh value and add closing quote
            m2 = re.search(r',\s*zh:\s*"', line)
            if m2:
                value_start = m2.end()
                close_brace = line.rfind('}')
                if close_brace > value_start:
                    line = line[:value_start] + line[value_start:close_brace] + '"' + line[close_brace:]
                    print(f"  Added closing quote")
    new_lines.append(line)

text = '\n'.join(new_lines)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(text)

print("\nDone.")

# Verify
with open(filepath, "r", encoding="utf-8") as f:
    final = f.read()

lines = final.split('\n')
bad_zh = 0
for i, line in enumerate(lines, 1):
    if ', zh:' in line:
        m = re.search(r',\s*zh:\s*"(.*)"', line)
        if not m:
            bad_zh += 1
            if bad_zh <= 3:
                print(f"Line {i} still bad: {line[:80]}")

if bad_zh == 0:
    print("All zh values have closing quotes!")
else:
    print(f"{bad_zh} lines still missing closing quotes.")
