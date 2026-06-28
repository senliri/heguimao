with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Remove the extra " " before } that was added by closing-quote fix
# Pattern: →" " } should become →" }
text = text.replace('→" "', '→"')

with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "w", encoding="utf-8", newline='\n') as f:
    f.write(text)

with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()
print(f"Line 591: {repr(lines[590])}")
