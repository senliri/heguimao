import sys
sys.stdout.reconfigure(encoding="utf-8")
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")
print(f"Line 42 ({len(lines[41])} bytes):")
print(lines[41].decode("utf-8", errors="replace"))
print()

# Check for raw bytes
raw_count = sum(1 for b in lines[41] if b > 127)
print(f"Raw bytes in line 42: {raw_count}")

# Find en value
import re
m = re.search(rb'"en":\s*"([^"]*)"', lines[41])
if m:
    print(f'en value: {m.group(1)[:100]}')
    print(f'en value has raw bytes: {any(b > 127 for b in m.group(1))}')
