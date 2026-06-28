with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Debug
print(f"Before: '→\" \"' in text: {'→\" \"' in text}")
print(f"Count: {text.count('→" \"')}")

# Check line 591
lines = text.split('\n')
print(f"Line 591: {repr(lines[590])}")

# Try replacing
text2 = text.replace('→" "', '→"')
lines2 = text2.split('\n')
print(f"After: Line 591: {repr(lines2[590])}")
