with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")
print(f"Line 591 hex: {lines[590].hex()}")
print(f"Line 591: {repr(lines[590])}")
