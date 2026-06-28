import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

# Mapping of corrupted Chinese punctuation → correct characters
# Order matters: put longer patterns first to avoid partial replacement
FIX_MAP = [
    ("锛?", "："),    # GBK misread colon + ?
    ("銆?", "、"),    # GBK misread enum comma + ?
    ("锛", "："),     # GBK misread colon
    ("銆", "、"),     # GBK misread enum comma
    ("鈥", '"'),      # GBK misread double quote
    ("鈫", "→"),      # GBK misread arrow
    ("锔", "·"),     # GBK misread middle dot
    ("锕", "．"),    # GBK misread full-width dot
]

with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# Apply fixes - longer patterns first
for bad, good in FIX_MAP:
    text = text.replace(bad, good)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(text)

print("Fixed corrupted Chinese punctuation.")

# Verify
remaining = 0
for bad, _ in FIX_MAP:
    count = text.count(bad)
    if count > 0:
        remaining += count
        print(f"WARNING: Still found '{bad}' {count} times!")

if remaining == 0:
    print("All corrupted chars removed.")
