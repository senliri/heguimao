import re
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

line = lines[590]
print(f"Line: {repr(line)}")

# Try the regex
m = re.search(r'"([^"]+)":\s*\{\s*en:\s*"(.+?)",\s*zh:', line)
if m:
    print(f"Match! key={m.group(1)}, en={m.group(2)!r}")
else:
    print("No match!")
    # Try simpler regex
    m2 = re.search(r'en:\s*"(.+?)",\s*zh:', line)
    if m2:
        print(f"Simpler match: en={m2.group(1)!r}")
    else:
        print("Simpler also no match!")
        # Find the issue
        idx = line.find('en:')
        if idx >= 0:
            print(f"en: at pos {idx}: {repr(line[idx:idx+30])}")
