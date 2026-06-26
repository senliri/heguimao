import re

p = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages\Report.tsx"
lines = open(p, encoding="utf-8").readlines()

for i, l in enumerate(lines):
    # Find t(" or t(`) specifically
    matches = list(re.finditer(r't\(["\x60][^"\x60]*["\x60]\)', l))
    if matches:
        for m in matches:
            # Check if preceded by {
            start = m.start()
            before = l[:start]
            # Find the last > and check if { is between > and t(
            last_gt = before.rfind('>')
            between = before[last_gt:] if last_gt >= 0 else before
            has_curly = '{' in between
            print(f"Line {i+1}: {'UNWRAPPED' if not has_curly else 'WRAPPED'}: {l.rstrip()[:200]}")
