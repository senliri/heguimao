with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Line 591: {repr(lines[590])}")

# Check for U+922B
line = lines[590]
for i, ch in enumerate(line):
    if ord(ch) == 0x922b:
        print(f"U+922B at position {i}: {repr(line[i:i+5])}")
