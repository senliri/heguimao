import sys, os
sys.stdout.reconfigure(encoding="utf-8")
size = os.path.getsize(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts")
print(f"File size: {size} bytes")
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    data = f.read()
    lines = data.split(b"\n")
    print(f"Total lines: {len(lines)}")
    for i, line in enumerate(lines[:50], 1):
        print(f"{i:4d}: {line.decode('utf-8', errors='replace')}")
