with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i in range(200, 206):
    print(f"Line {i+1}: {repr(lines[i][:120])}")
