with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Show context around line 2360
for i in range(max(0, 2340), min(len(lines), 2365)):
    marker = " >>> " if i == 2359 else "     "
    print(f"{marker}{i+1}: {lines[i][:100]}")
