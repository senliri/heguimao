with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

line591 = lines[590]
print(f"Line 591: {repr(line591)}")

# Check for any non-ASCII
for i, ch in enumerate(line591):
    if ord(ch) > 127:
        print(f"  Non-ASCII at pos {i}: U+{ord(ch):04X} ({ch!r})")
