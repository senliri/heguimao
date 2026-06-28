with open(r"D:\qclaw\workspace-AI工程师\heguimao-deploy\frontend\src\lib\i18n.ts", "rb") as f:
    raw = f.read()

# Find all occurrences of e28692 (→)
import re
for m in re.finditer(b'\xe2\x86\x92', raw):
    pos = m.start()
    context = raw[max(0,pos-5):pos+10]
    print(f"At pos {pos}: {repr(context)}")
