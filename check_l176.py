import sys
sys.stdout.reconfigure(encoding="utf-8")
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")
line176 = lines[175]
print(f"Line 176: {repr(line176)}")
print()

import re
# Find zh:
zm = re.search(rb',\s*zh:\s*"', line176)
if zm:
    print(f"zh match: {zm.group()} at pos {zm.start()}-{zm.end()}")
    open_q = zm.end()
    rest = line176[open_q:]
    print(f"After open_q: {repr(rest)}")
    close = re.search(rb'"', rest)
    if close:
        print(f"Closing quote at offset {close.start()}")
        value = rest[:close.start()]
        print(f"Value: {repr(value)}")
        # Check for raw bytes
        raw = [b for b in value if b > 127]
        print(f"Raw bytes in value: {raw}")
