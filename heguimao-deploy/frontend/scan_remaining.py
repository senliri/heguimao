#!/usr/bin/env python3
import re, sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\pages\Report.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Find English text nodes not wrapped in {t(...)}
lines = content.split('\n')
issues = []
for i, line in enumerate(lines, 1):
    # Skip import lines, comments, JS expressions
    if line.strip().startswith('//') or line.strip().startswith('*') or 'import' in line:
        continue
    if '{t(' in line or '{t("' in line:
        continue
    # Look for >English< patterns
    matches = re.findall(r'>([A-Z][a-zA-Z\s,./:()\-]+?)<', line)
    for m in matches:
        m = m.strip()
        if len(m) < 4:
            continue
        if any(skip in m for skip in ['className', 'href=', 'target=', 'rel=', 'style=', 'color=', 'bg-', 'text-', 'border-', 'flex-', 'gap-', 'mt-', 'mb-', 'p-', 'px-', 'rounded', 'hover:', 'disabled', 'animate']):
            continue
        if m.startswith('http') or '/' in m or '.' in m and 'Report' not in m and 'Disclaimer' not in m:
            continue
        issues.append((i, m))

print(f"Found {len(issues)} potential hardcoded strings:")
for line_no, text in issues:
    print(f"  Line {line_no}: {text[:60]}")
