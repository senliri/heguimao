with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    raw = f.read()
lines = raw.split(b"\n")
print(f"Line 16 (raw): {repr(lines[15])}")
print(f"Line 16 (decoded): {lines[15].decode('utf-8')}")
