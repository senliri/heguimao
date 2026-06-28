import re
with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    raw = f.read()
lines = raw.split(b"\n")
line16 = lines[15]
open_q = line16.find(b'"', line16.find(b"zh:"))
after_open = line16[open_q + 1:]
print(f"after_open: {repr(after_open)}")
print()

# Try patterns
m1 = re.search(rb'"[\s]*\}', after_open)
print(f'Pattern "}}: {m1}')

m2 = re.search(rb'[,]\s*\}', after_open)
print(f"Pattern ,}}: {m2}")

# The actual structure: \u5df2\u53d1\u9001锛? },\r
# There's NO closing " before }, so we need to find }, and assume the value ends before it
m3 = re.search(rb'\}\s*,\s*', after_open)
print(f"Pattern }},: {m3}")
if m3:
    print(f"  value would be: {repr(after_open[:m3.start()])}")
