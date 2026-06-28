import sys
sys.stdout.reconfigure(encoding="utf-8")
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    raw = f.read()
lines = raw.split(b"\n")
bad = []
for i, line in enumerate(lines, 1):
    if line.strip():
        has_raw = any(b > 127 for b in line)
        if has_raw:
            bad.append((i, line[:100]))
print(f"Total lines with raw bytes: {len(bad)}")
for ln, preview in bad:
    print(f"Line {ln}: {preview.decode('utf-8', errors='replace')}")
