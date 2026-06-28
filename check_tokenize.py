import sys
sys.stdout.reconfigure(encoding="utf-8")

with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    raw = f.read()

raw_lines = raw.split(b"\n")
line = raw_lines[15]
print(f"Line: {repr(line)}")
print()

parts = []
j = 0
current = bytearray()

while j < len(line):
    if line[j:j+1] == b'"':
        current.append(line[j])
        j += 1
        while j < len(line) and line[j:j+1] != b'"':
            current.append(line[j])
            j += 1
        if j < len(line):
            current.append(line[j])
            j += 1
        parts.append(('str', bytes(current)))
        current = bytearray()
    else:
        current.append(line[j])
        j += 1

if current:
    parts.append(('other', bytes(current)))

for ptype, pdata in parts:
    print(f"{ptype}: {repr(pdata[:100])}")
