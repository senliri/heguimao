import sys
sys.stdout.reconfigure(encoding="utf-8")
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")

bad = []
for i, line in enumerate(lines, 1):
    if b", zh:" in line:
        has_bad = any(b > 127 for b in line)
        if has_bad:
            bad.append((i, line.decode("utf-8", errors="replace")[:200]))

print(f"Bad zh lines: {len(bad)}")
for ln, txt in bad:
    print(f"  Line {ln}: {txt}")
