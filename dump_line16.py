with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")

line16 = lines[15]
print("Line 16 raw bytes:")
for j, b in enumerate(line16):
    print(f"  [{j}] 0x{b:02x} = {chr(b) if 32 <= b < 127 else '?'}")
