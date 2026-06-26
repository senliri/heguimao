import re

p = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages\Report.tsx"
lines = open(p, encoding="utf-8").readlines()

for i, l in enumerate(lines):
    if re.search(r't\(["\x60]', l):
        print(f"{i+1}: {l.rstrip()[:200]}")
