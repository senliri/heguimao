import re
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")

line42 = lines[41]
# Find zh:
zm = re.search(rb',\s*zh:\s*"', line42)
if zm:
    print(f"zh match at {zm.start()}-{zm.end()}: {zm.group()}")
    value_start = zm.end()
    rest = line42[value_start:]
    print(f"Rest: {repr(rest[:200])}")
    
    # Find closing "
    close = re.search(rb'"', rest)
    if close:
        print(f"Closing quote at offset {close.start()}")
        value = rest[:close.start()]
        print(f"Value: {repr(value[:200])}")
        raw = [b for b in value if b > 127]
        print(f"Raw bytes: {raw}")
