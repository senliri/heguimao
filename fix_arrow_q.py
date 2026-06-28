import re
import sys
sys.stdout.reconfigure(encoding="utf-8")

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# Now replace →? with →" (where ? was a corrupted closing quote)
count = text.count('→?')
print(f"Found '→?' {count} times")
if count > 0:
    text = text.replace('→?', '→"')
    print("Replaced →? with →\"")

with open(filepath, "w", encoding="utf-8", newline='\n') as f:
    f.write(text)

# Verify line 591
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()
print(f"Line 591: {repr(lines[590])}")
