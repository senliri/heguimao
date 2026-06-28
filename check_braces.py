import re
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Count quotes
open_q = text.count('"')
print(f"Total double quotes: {open_q}")

# Check brace balance in the file
# Find the t() function area (around line 2360)
lines = text.split('\n')
# Count { and } in the whole file
opens = 0
closes = 0
for line in lines:
    opens += line.count('{')
    closes += line.count('}')

print(f"Total {{: {opens}, Total }}: {closes}")
print(f"Difference: {opens - closes}")

# Check around line 2360
print(f"\nLines 2355-2365:")
for i in range(2354, min(2365, len(lines))):
    print(f"  {i+1}: {lines[i][:80]}")
