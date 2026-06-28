with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Check for remaining corruption patterns
patterns = ['\u9225?', '\u922b?', '\u951b', '\u9486']
for p in patterns:
    count = text.count(p)
    if count > 0:
        print(f"Still found U+{ord(p[0]):04X} ({p[0]}) + {repr(p[1:])}: {count} times")

# Check line 42 specifically
lines = text.split('\n')
print(f"\nLine 42: {lines[41][:150]}...")
