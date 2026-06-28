import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

# The pattern: corrupted Chinese punctuation followed by ? then } or space
# These are missing closing " which was corrupted to ?
# Fix: replace "锛?" with "："" (correct colon + closing quote)

with open(filepath, "rb") as f:
    raw = f.read()

# Pattern: 锛? followed by space or } (indicating end of value without closing ")
# Replace with ：" (correct colon + closing quote)
raw = raw.replace(b'\xe9\x94\x9b? ', b'\xef\xbc\x9a" ')     # 锛?  -> ："
raw = raw.replace(b'\xe9\x94\x9b?', b'\xef\xbc\x9a"')         # 锛?  -> ：" (no space)

# Also fix 銆? (enum comma + ?) -> 、"
raw = raw.replace(b'\xe9\x8a\x86? ', b'\xe3\x80\x81" ')       # 銆?  ->  、"
raw = raw.replace(b'\xe9\x8a\x86?', b'\xe3\x80\x81"')          # 銆?  ->  、"

# Fix 鈥 (double quote corruption) -> "
raw = raw.replace(b'\xe9\x88\xa5', b'"')                       # 鈥 -> "

print("Fixed missing closing quotes.")

# Verify
with open(filepath, "wb") as f:
    f.write(raw)

# Check
with open(filepath, "rb") as f:
    content = f.read()

# Count remaining issues
bad_patterns = [b'\xe9\x94\x9b?', b'\xe9\x8a\x86?', b'\xe9\x88\xa5']
for pat in bad_patterns:
    count = content.count(pat)
    if count > 0:
        print(f"WARNING: Still found {pat.hex()} {count} times!")

# Check for unterminated strings - find lines with zh: but no closing "
lines = content.split(b"\n")
unclosed = 0
for i, line in enumerate(lines, 1):
    if b', zh:' in line:
        m = re.search(rb',\s*zh:\s*"(.*)"', line)
        if not m:
            unclosed += 1
            if unclosed <= 5:
                print(f"Line {i} still unclosed: {line[:80]}")

if unclosed == 0:
    print("All zh values now have closing quotes!")
else:
    print(f"\n{unclosed} lines still missing closing quotes.")
