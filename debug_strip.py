with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    raw = f.read()

lines = raw.split(b"\n")
line16 = lines[15]

zh_pos = line16.find(b"zh:")
rest = line16[zh_pos + 3:]
print(f"rest: {repr(rest)}")

q_start = rest.find(b'"')
print(f"q_start: {q_start}")

after_open = rest[q_start + 1:]
print(f"after_open: {repr(after_open)}")

# Find last "
last_q = -1
for j in range(len(after_open) - 1, -1, -1):
    if after_open[j:j+1] == b'"':
        last_q = j
        print(f"Found \" at position {j}")
        break

print(f"last_q: {last_q}")

if last_q >= 0:
    value_content = after_open[:last_q]
    after_close = after_open[last_q:]
else:
    value_content = after_open
    after_close = b'"'

print(f"value_content: {repr(value_content)}")
print(f"after_close: {repr(after_close)}")

# Strip trailing
print(f"Last bytes of value_content: {[hex(b) for b in value_content[-10:]]}")
while value_content and value_content[-1:] in (b'?', b'\r', b' '):
    print(f"  Stripping: {hex(value_content[-1])}")
    value_content = value_content[:-1]

print(f"After strip: {repr(value_content)}")
