import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

# All known corrupted byte sequences → correct UTF-8
REPLACEMENTS = [
    # 锛 (U+951B = \xe9\x94\x9b) → ： (U+FF1A = \xef\xbc\x9a) FULLWIDTH COLON
    (b'\xe9\x94\x9b', b'\xef\xbc\x9a'),
    # 銆 (U+9486 = \xe9\x8a\x86) → 、 (U+3001 = \xe3\x80\x81) IDEOGRAPHIC COMMA
    (b'\xe9\x8a\x86', b'\xe3\x80\x81'),
    # 鈥 (U+9225 = \xe9\x88\xa5) → " (U+0022 = \x22) DOUBLE QUOTE
    (b'\xe9\x88\xa5', b'"'),
    # 锛 (U+922B = \xe9\x88\xab) → → (U+2192 = \xe2\x86\x92) RIGHT ARROW
    (b'\xe9\x88\xab', b'\xe2\x86\x92'),
    # 锔 (U+9514 = \xe9\x94\x94) → · (U+00B7 = \xc2\xb7) MIDDLE DOT
    (b'\xe9\x94\x94', b'\xc2\xb7'),
    # 锕 (U+9515 = \xe9\x94\x95) → ． (U+FF0E = \xef\xbc\x8e) FULLWIDTH FULL STOP
    (b'\xe9\x94\x95', b'\xef\xbc\x8e'),
    # 鈹 (U+9439 = \xe9\x90\xb9) → — (U+2014 = \xe2\x80\x94) EM DASH
    (b'\xe9\x90\xb9', b'\xe2\x80\x94'),
]

with open(filepath, "rb") as f:
    raw = f.read()

original = raw
for bad, good in REPLACEMENTS:
    count = raw.count(bad)
    if count > 0:
        raw = raw.replace(bad, good)
        print(f"Replaced {bad.hex()} ({count} times) with {good.hex()}")

with open(filepath, "wb") as f:
    f.write(raw)

# Verify - check for any remaining high bytes that might be corrupted
with open(filepath, "rb") as f:
    content = f.read()

# Check zh values for closing quotes
lines = content.split(b"\n")
unclosed = 0
for i, line in enumerate(lines, 1):
    if b', zh:' in line:
        m = re.search(rb',\s*zh:\s*"(.*)"', line)
        if not m:
            unclosed += 1
            if unclosed <= 3:
                print(f"Line {i} still unclosed: {line[:80]}")

if unclosed == 0:
    print("\nAll zh values have closing quotes!")
else:
    print(f"\n{unclosed} lines still missing closing quotes.")

# Check for remaining known corruption patterns
for bad, _ in REPLACEMENTS:
    count = content.count(bad)
    if count > 0:
        print(f"WARNING: Still found {bad.hex()} {count} times!")
