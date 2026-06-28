with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    raw = f.read()
lines = raw.split(b"\n")
line16 = lines[15]
print(f"Line 16 bytes: {line16.hex()}")
print(f"Line 16 repr: {repr(line16)}")

# Find the zh value
import re
m = re.search(rb'zh:\s*"(.*)"', line16)
if m:
    print(f"zh value: {repr(m.group(1))}")
else:
    print("No closing quote found!")
    # Find where zh: starts
    m2 = re.search(rb'zh:', line16)
    if m2:
        print(f"After zh: {repr(line16[m2.end():])}")
