with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")

line16 = lines[15]
print("Hex dump of line 16:")
for j, b in enumerate(line16):
    if b > 127 or b == 0x3f:
        print(f"  pos {j}: 0x{b:02x} ({chr(b) if b < 128 else '?'})")

# Show the zh value portion
zh_pos = line16.find(b"zh:")
rest = line16[zh_pos+3:]
print(f"\nZh value raw: {rest}")
print(f"Zh value hex: {rest.hex()}")
