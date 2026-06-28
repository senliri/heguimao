with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    content = f.read()

# Fix 锛? (U+922B + ?) → →" (arrow + closing quote)
content = content.replace(b'\xe9\x88\xab?', b'\xe2\x86\x92"')

with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "wb") as f:
    f.write(content)

print("Fixed line 591")

with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")
print(f"Line 591: {repr(lines[590])}")
