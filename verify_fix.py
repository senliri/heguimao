with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")

line16 = lines[15]
print("Line 16 after fix:")
print(repr(line16))
print()

# Check all lines for remaining raw bytes > 127
bad_lines = []
for i, line in enumerate(lines, 1):
    for j, b in enumerate(line):
        if b > 127:
            bad_lines.append(i)
            break

print(f"Lines with raw bytes > 127: {len(set(bad_lines))}")
if bad_lines:
    print(f"First few: {set(bad_lines)[:10]}")
