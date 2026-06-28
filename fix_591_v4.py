with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Fix line 591 specifically: en: "→, should be en: "→",
text = text.replace('"→, zh:', '"→", zh:')

# Fix zh: "→ "} should be zh: "→" }
text = text.replace('→" "', '→"')

with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "w", encoding="utf-8", newline='\n') as f:
    f.write(text)

with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()
print(f"Line 591: {repr(lines[590])}")
