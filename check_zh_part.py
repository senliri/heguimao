with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")
line591 = lines[590]
# Find the zh value
idx = line591.find(b'zh:')
print(f"From zh: {repr(line591[idx:])}")
print(f"Hex: {line591[idx:].hex()}")
