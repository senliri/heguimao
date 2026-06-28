with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    raw = f.read()

# Find report.link
idx = raw.find(b'"report.link"')
if idx >= 0:
    # Get 60 bytes around it
    chunk = raw[idx:idx+80]
    print(f"Bytes: {chunk}")
    print(f"Hex: {chunk.hex()}")
    
    # Decode each byte
    print(f"\nDecoded:")
    for i, b in enumerate(chunk):
        print(f"  [{i}] 0x{b:02x} = {chr(b) if 32 <= b < 127 else '?'}")
