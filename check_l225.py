import sys
sys.stdout.reconfigure(encoding="utf-8")
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")
print(f"Line 225: {lines[224][:200]}")
print(f"Line 226: {lines[225][:200]}")
