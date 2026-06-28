import re
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    lines = f.read().split(b"\n")

# Check line 16
line = lines[15]
print("Line 16:", line)
print()

# Check what pattern matches
print(b', zh:' in line)  # comma-space-zh-colon-quote
print(b"'zh':" in line)
print(b'"zh":' in line)
print(b'zh:' in line)

# The actual pattern is: { en: "...", zh: "..." }
# So it's: ...", zh: "..."
# Let's find it
idx = line.find(b'zh:')
if idx >= 0:
    print(f"zh: at position {idx}")
    print(f"Context: {line[max(0,idx-10):idx+20]}")
