import sys, os
sys.stdout.reconfigure(encoding="utf-8")
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()
    for i, line in enumerate(lines[50:200], 51):
        print(f"{i:4d}: {line.rstrip()}")
