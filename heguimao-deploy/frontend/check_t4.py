import re

p = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages\Report.tsx"
lines = open(p, encoding="utf-8").readlines()

for i, l in enumerate(lines):
    # Find standalone t(" or t(`)
    matches = list(re.finditer(r'(?<![.\w])t\(["\x60][^"\x60]*["\x60]\)', l))
    if matches:
        for m in matches:
            start = m.start()
            before = l[:start]
            last_gt = before.rfind('>')
            between = before[last_gt:] if last_gt >= 0 else before
            has_curly = '{' in between
            status = "UNWRAPPED" if not has_curly else "WRAPPED"
            print(f"L{i+1} [{status}]: {l.rstrip()[:200]}")
