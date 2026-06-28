with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")
for n in [15, 25, 41, 590]:
    print(f"Line {n+1}: {lines[n][:120]}")
