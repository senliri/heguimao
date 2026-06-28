with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")
line591 = lines[590]
print(f"Line 591 hex: {line591.hex()}")
print(f"Line 591 repr: {repr(line591)}")

# Check if \xe9\x88\xab? exists
if b'\xe9\x88\xab?' in line591:
    print("Found \\xe9\\x88\\xab?")
else:
    print("NOT found \\xe9\\x88\\xab?")

# Find the en value part
m_start = line591.find(b'"report.link"')
if m_start >= 0:
    print(f"From report.link: {repr(line591[m_start:])}")
