import re
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Find lines where zh value is missing closing quote
lines = text.split('\n')
bad_lines = []
for i, line in enumerate(lines, 1):
    if ', zh:' in line:
        # Find zh: "..." pattern
        m = re.search(r',\s*zh:\s*"(.*)"', line)
        if not m:
            bad_lines.append((i, line[:100]))

print(f"Lines with missing closing quote in zh: {len(bad_lines)}")
for ln, content in bad_lines[:10]:
    print(f"  Line {ln}: {content}")

# Also check en values
bad_en = []
for i, line in enumerate(lines, 1):
    if ', zh:' in line:
        m = re.search(r'en:\s*"(.*)"', line)
        if not m:
            bad_en.append((i, line[:100]))

print(f"\nLines with missing closing quote in en: {len(bad_en)}")
for ln, content in bad_en[:10]:
    print(f"  Line {ln}: {content}")
