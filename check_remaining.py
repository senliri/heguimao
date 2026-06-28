with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Check for U+922B
count_922b = text.count('\u922b')
print(f"U+922B (锛) count: {count_922b}")

# Check for U+2192 (arrow)
count_2192 = text.count('\u2192')
print(f"U+2192 (→) count: {count_2192}")

# Check for U+9225 (different arrow)
count_9225 = text.count('\u9225')
print(f"U+9225 (鈥) count: {count_9225}")

# Find remaining corruption
import re
for cp in [0x9225, 0x922b, 0x951b, 0x9486, 0x20ac, 0x9239]:
    ch = chr(cp)
    cnt = text.count(ch)
    if cnt > 0:
        print(f"U+{cp:04X} ({ch!r}): {cnt} remaining")
