with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")

for n in [41, 42, 43]:
    print(f"Line {n+1} ({len(lines[n])} bytes): {lines[n][:200]}")
    print()
