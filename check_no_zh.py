import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")

for i, line in enumerate(lines, 1):
    has_raw = any(b > 127 for b in line)
    has_zh = b'zh:' in line
    if has_raw and not has_zh:
        print(f"Line {i}: raw bytes but no zh:")
        print(f"  {line.decode('utf-8', errors='replace')[:200]}")
        print()
