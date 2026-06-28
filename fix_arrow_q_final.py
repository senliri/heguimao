with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Fix: →? → →" (where ? was the corrupted closing quote)
count = text.count('→?')
print(f"→? count: {count}")
text = text.replace('→?', '→"')

# Also fix the en value on line 591: →, should be →",
# The issue: the ? was between → and , (en value closing quote + separator)
# After →? → →", the line becomes: en: "→", zh: "→" "
# But we need: en: "→", zh: "→"

# Remove extra " before }
text = text.replace('→" "', '→"')

with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "w", encoding="utf-8", newline='\n') as f:
    f.write(text)

with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()
print(f"Line 591: {repr(lines[590])}")
