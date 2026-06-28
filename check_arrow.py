with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")
line591 = lines[590]
print(f"Line 591 bytes: {line591.hex()}")

# Find the arrow
arrow_pos = line591.find(b'\xe2\x86\x92')
if arrow_pos >= 0:
    print(f"Arrow at pos {arrow_pos}")
    print(f"After arrow: {repr(line591[arrow_pos:arrow_pos+10])}")
