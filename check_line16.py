with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    raw = f.read()
lines = raw.split(b"\n")
line16 = lines[15]
print(f"Line 16 hex: {line16.hex()}")
print()
print("Byte-by-byte after zh:")
zh = line16.find(b"zh:")
for j in range(zh, len(line16)):
    b = line16[j]
    print(f"  [{j}] 0x{b:02x} = {chr(b) if 32 <= b < 127 else '?'}")
