with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")

line16 = lines[15]
print("Line 16 raw:")
print(repr(line16))
print()

# Count raw bytes > 127
raw_count = 0
for b in line16:
    if b > 127:
        raw_count += 1
print(f"Raw bytes > 127 in line 16: {raw_count}")

# Check all lines
total_bad = 0
for i, line in enumerate(lines, 1):
    for b in line:
        if b > 127:
            total_bad += 1
            break
print(f"Total lines with raw bytes > 127: {total_bad}")
