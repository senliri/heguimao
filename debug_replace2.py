with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    text = f.read()

pattern = '→" "'
print(f"Pattern: {repr(pattern)}")
print(f"Count in text: {text.count(pattern)}")

lines = text.split('\n')
print(f"Line 591: {repr(lines[590])}")

text2 = text.replace(pattern, '→"')
lines2 = text2.split('\n')
print(f"After fix: Line 591: {repr(lines2[590])}")
