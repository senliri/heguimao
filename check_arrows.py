with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Check if →? exists
count = text.count('→?')
print(f"Count of '→?': {count}")

# Check the actual line
lines = text.split('\n')
for i, line in enumerate(lines, 1):
    if 'report.link' in line:
        print(f"Line {i}: {repr(line)}")
