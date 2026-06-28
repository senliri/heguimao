import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# Replace ALL Chinese/fullwidth punctuation with ASCII equivalents
# This ensures esbuild on Windows can parse the file correctly
CHINESE_TO_ASCII = {
    '\uff1a': ':',      # ： → :
    '\uff1b': ';',      # ； → ;
    '\uff01': '!',      # ！ → !
    '\uff0c': ',',      # ， → ,
    '\u3001': ',',      # 、 → ,
    '\u3002': '.',      # 。 → .
    '\u2014': '-',      # — → -
    '\u2013': '-',      # – → -
    '\u2018': "'",       # ' → '
    '\u2019': "'",       # ' → '
    '\u201c': '"',       # " → "
    '\u201d': '"',       # " → "
    '\u00b7': '.',       # · → .
    '\u2026': '...',     # … → ...
}

for bad, good in CHINESE_TO_ASCII.items():
    count = text.count(bad)
    if count > 0:
        text = text.replace(bad, good)
        print(f"Replaced U+{ord(bad):04X} ({bad!r}) with {good!r}: {count} times")

with open(filepath, "w", encoding="utf-8", newline='\n') as f:
    f.write(text)

print("\nDone.")
