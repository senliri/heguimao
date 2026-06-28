filepath = r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts"

with open(filepath, "rb") as f:
    raw = f.read()

raw_lines = raw.split(b"\n")

# Check line 16
line = raw_lines[15]
print(f"Line 16: {repr(line)}")
print(f"  b', zh:' in line: {b', zh:' in line}")
print(f"  b'zh:' in line: {b'zh:' in line}")

zh_pos = line.find(b"zh:")
print(f"  zh_pos: {zh_pos}")

open_q = line.find(b'"', zh_pos)
print(f"  open_q (first \" after zh:): {open_q}")

last_q = line.rfind(b'"')
print(f"  last_q (last \" in line): {last_q}")

if last_q > open_q:
    value_bytes = line[open_q+1:last_q]
    print(f"  value_bytes: {repr(value_bytes)}")
    print(f"  value_bytes ends with: {repr(value_bytes[-5:])}")
    
    # Strip trailing
    orig_len = len(value_bytes)
    while value_bytes and value_bytes[-1:] in (b"?", b"\r", b" "):
        value_bytes = value_bytes[:-1]
    print(f"  after strip: {repr(value_bytes)}")
    print(f"  stripped {orig_len - len(value_bytes)} bytes")
    
    # Check for raw bytes
    raw_count = sum(1 for b in value_bytes if b > 127)
    print(f"  Raw bytes > 127: {raw_count}")
else:
    print(f"  last_q ({last_q}) <= open_q ({open_q}), skipping")
