with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    raw = f.read()

# Find "report.link"
idx = raw.find(b'report.link')
if idx >= 0:
    print(f"Found at pos {idx}")
    print(f"Context: {repr(raw[idx:idx+60])}")
    print(f"Hex: {raw[idx:idx+60].hex()}")
