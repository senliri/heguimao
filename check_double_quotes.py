import re
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Check for :"" patterns (colon followed by two quotes) which might indicate
# the 锛? → ：" replacement went wrong
matches = list(re.finditer(r':"."', text))
print(f":\".\" patterns: {len(matches)}")
for m in matches[:5]:
    ctx = text[max(0,m.start()-20):m.end()+20]
    print(f"  ...{ctx}...")

# Check for :" " patterns
matches2 = list(re.finditer(r'": "', text))
print(f"\n\": \" patterns: {len(matches2)}")
for m in matches2[:5]:
    ctx = text[max(0,m.start()-20):m.end()+20]
    print(f"  ...{ctx}...")
