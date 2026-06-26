import re

p = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages\Report.tsx"
lines = open(p, encoding="utf-8").readlines()

count = 0
for i, l in enumerate(lines):
    # Look for t(" or t(`) that are NOT inside {...}
    # Simple heuristic: lines containing >t(" or >t(`
    if '>t("' in l or ">t('" in l or ">t(`" in l:
        count += 1
        print(f"Line {i+1}: {l.rstrip()[:200]}")

print(f"\nLines with bare t() in JSX text: {count}")

# Also check for t(" that's NOT preceded by {
for i, l in enumerate(lines):
    # Find all t(" patterns
    for m in re.finditer(r't\("[^"]*"\)', l):
        start = m.start()
        # Check context - is this inside {...}?
        before = l[:start]
        # Count { and } before this position
        o = before.count('{')
        c = before.count('}')
        if o > c:
            continue  # inside expression, skip
        
        # Not inside expression - check if preceded by >
        if '>' in before and '{' not in before[before.rfind('>') :]:
            print(f"Line {i+1} (UNWRAPPED): {l.rstrip()[:200]}")
